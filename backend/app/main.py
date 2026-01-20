from datetime import datetime
from fastapi import FastAPI, HTTPException, Query
from fastapi.concurrency import run_in_threadpool
import requests
import os
from dotenv import load_dotenv
from app.utils import parse_location_input
from app.database import database, engine, metadata
from app.models.weather import weather_searches, forecast_searches

#loading environment variables from .env
load_dotenv()

OPENWEATHER_API_KEY = os.getenv("OPENWEATHER_API_KEY")

if not OPENWEATHER_API_KEY: 
    raise RuntimeError("OPENWEATHER_API_KEY is not set")

app = FastAPI(title = "Weather App API")

def fetch_openweather_data(location: str):
    """
    Synchronous helper to fetch weather data from OpenWeather API using requests.
    Used by both sync and async endpoints.
    """
    params = parse_location_input(location)
    params["appid"] = OPENWEATHER_API_KEY
    params["units"] = "metric"

    url = "https://api.openweathermap.org/data/2.5/weather"
    response = requests.get(url, params=params)

    if response.status_code != 200:
        raise HTTPException(
            status_code=response.status_code,
            detail="Location not found or weather service error"
        )
    
    return response.json()


def fetch_openweather_forecast(location: str):
    """
    Synchronous helper to fetch 5-day forecast from OpenWeather API.
    """
    params = parse_location_input(location)
    params["appid"] = OPENWEATHER_API_KEY
    params["units"] = "metric"

    url = "https://api.openweathermap.org/data/2.5/forecast"
    response = requests.get(url, params=params)

    if response.status_code != 200:
        raise HTTPException(
            status_code=response.status_code,
            detail="Location not found or weather service error"
        )
    return response.json()

@app.get("/")
def root(): 
    return {"message": "Weather API is running"}

@app.get("/weather")
def get_weather(location: str = Query(..., description="City, ZIP, coordinates, or landmark")):
    """
    Get current weather for a given location.
    Accepts city, ZIP code, coordinates (lat,lon), or landmark.
    """
    # Runs in a threadpool automatically by FastAPI since it's a 'def' endpoint
    data = fetch_openweather_data(location)

    return {
        "location": location,
        "city": data.get("name"),
        "temperature": data["main"]["temp"],
        "feels_like": data["main"]["feels_like"],
        "humidity": data["main"]["humidity"],
        "weather": data["weather"][0]["description"],
        "icon": data["weather"][0]["icon"]
    }

@app.get("/forecast")
def get_forecast(location: str = Query(..., description = "City, ZIP, coordinates, or landmark")):
    """
    Get 5-day weather forecast for a given location
    Accepts city, ZIP code, coordinates, or landmark
    """
    # Runs in a threadpool automatically by FastAPI since it's a 'def' endpoint
    data = fetch_openweather_forecast(location)
    
    #pick date/time, temp, description, icon
    forecast_list = []
    for item in data["list"]:
        forecast_list.append({
            "datetime": item["dt_txt"],
            "temperature": item["main"]["temp"], 
            "feels_like": item["main"]["feels_like"], 
            "humidity": item["main"]["humidity"], 
            "weather": item["weather"][0]["description"], 
            "icon": item["weather"][0]["icon"]
        })

    return {
        "location": location,
        "city": data.get("city", {}).get("name"),
        "country": data.get("city", {}).get("country"),
        "forecast": forecast_list
    }

#initializing the database
metadata.create_all(engine) #create table

@app.on_event("startup")
async def startup(): 
    await database.connect()

@app.on_event("shutdown")
async def shutdown(): 
    await database.disconnect()

#CRUD WORKFLOW FOR **CURRENT** WEATHER
#C - Create
@app.post("/weather/save")
async def save_weather(location:str):
    # Retrieve weather data without blocking the event loop
    data = await run_in_threadpool(fetch_openweather_data, location)

    query = weather_searches.insert().values(
        location=location, 
        temperature=data["main"]["temp"],
        feels_like=data["main"]["feels_like"],
        humidity=data["main"]["humidity"],
        weather=data["weather"][0]["description"],
        icon=data["weather"][0]["icon"]
    )
    last_record_id = await database.execute(query)
    return {"message": "Weather saved", "id": last_record_id}


#R - Read
@app.get("/weather/history")
async def get_history():
    query = weather_searches.select()
    results = await database.fetch_all(query)
    return results

#U - Update
@app.put("/weather/update/{record_id}")
async def update_weather(record_id: int, location: str = None): 
    query = weather_searches.select().where(weather_searches.c.id == record_id)
    record = await database.fetch_one(query)

    if not record:
        raise HTTPException(status_code=404, detail="Record not found")

    # Optionally fetch fresh weather data if location changed
    if location and location != record["location"]:
        # Retrieve weather data without blocking the event loop
        # Note: We re-use fetch_openweather_data here
        data = await run_in_threadpool(fetch_openweather_data, location)

        update_query = weather_searches.update().where(weather_searches.c.id == record_id).values(
            location=location,
            temperature=data["main"]["temp"],
            feels_like=data["main"]["feels_like"],
            humidity=data["main"]["humidity"],
            weather=data["weather"][0]["description"],
            icon=data["weather"][0]["icon"]
        )
        await database.execute(update_query)
        return {"message": "Record updated"}

    return {"message": "No changes made"}

#D - Delete
@app.delete("/weather/delete/{record_id}")
async def delete_weather(record_id: int):
    query = weather_searches.select().where(weather_searches.c.id == record_id)
    record = await database.fetch_one(query)

    if not record:
        raise HTTPException(status_code=404, detail="Record not found")

    delete_query = weather_searches.delete().where(weather_searches.c.id == record_id)
    await database.execute(delete_query)
    return {"message": "Record deleted"}


#CRUD WORKFLOW ON **5-day forecast** 
#C - Create
@app.post("/forecast/save")
async def save_forecast(location: str):
    """
    Fetch current weather + 5-day forecast and save all to database
    """
    # 1. Fetch CURRENT weather (non-blocking)
    weather_data = await run_in_threadpool(fetch_openweather_data, location)

    # Save current weather
    insert_weather = weather_searches.insert().values(
        location=location,
        temperature=weather_data["main"]["temp"],
        feels_like=weather_data["main"]["feels_like"],
        humidity=weather_data["main"]["humidity"],
        weather=weather_data["weather"][0]["description"],
        icon=weather_data["weather"][0]["icon"]
    )
    weather_id = await database.execute(insert_weather)

    # 2. Fetch FORECAST (non-blocking)
    forecast_data = await run_in_threadpool(fetch_openweather_forecast, location)

    # Save each forecast entry
    for item in forecast_data["list"]:
        # Parse the datetime string to a proper python datetime object
        dt_object = datetime.strptime(item["dt_txt"], "%Y-%m-%d %H:%M:%S")
        
        insert_forecast = forecast_searches.insert().values(
            weather_id=weather_id,
            datetime=dt_object,
            temperature=item["main"]["temp"],
            feels_like=item["main"]["feels_like"],
            humidity=item["main"]["humidity"],
            weather=item["weather"][0]["description"],
            icon=item["weather"][0]["icon"]
        )
        await database.execute(insert_forecast)

    return {"message": "Weather + 5-day forecast saved", "weather_id": weather_id}

#R- Read
@app.get("/forecast/history/{weather_id}")
async def get_saved_forecast(weather_id: int): 
    """
    Retrieve saved forecast by current weather record id
    """
    query = forecast_searches.select().where(forecast_searches.c.weather_id == weather_id)
    results = await database.fetch_all(query)

    if not results:
        raise HTTPException(status_code=404, detail="no forecast found for this weather_id")

    return results

#U - Update
@app.put("/forecast/refresh/{weather_id}")
async def refresh_forecast(weather_id: int): 
    """
    Refresh 5-day forecast for an existing weather search
    """
    #get original location: 
    query = weather_searches.select().where(weather_searches.c.id == weather_id)
    weather_record = await database.fetch_one(query)

    if not weather_record:
        raise HTTPException(status_code=404, detail="Weather record not found")

    location = weather_record["location"]

    #delete old forecast
    delete_query = forecast_searches.delete().where(
        forecast_searches.c.weather_id == weather_id
    )
    await database.execute(delete_query)

    #re-fetch (non-blocking)
    data = await run_in_threadpool(fetch_openweather_forecast, location)

    for item in data["list"]:
        # Parse the datetime string to a proper python datetime object
        dt_object = datetime.strptime(item["dt_txt"], "%Y-%m-%d %H:%M:%S")

        await database.execute(
            forecast_searches.insert().values(
                weather_id=weather_id,
                datetime=dt_object,
                temperature=item["main"]["temp"],
                feels_like=item["main"]["feels_like"],
                humidity=item["main"]["humidity"],
                weather=item["weather"][0]["description"],
                icon=item["weather"][0]["icon"]
            )
        )

    return {"message": "Forecast refreshed successfully"}

#D - Delete
@app.delete("/forecast/{weather_id}")
async def delete_forecast(weather_id: int):
    # Depending on cascade rules, deleting the parent might delete children, 
    # but manually deleting is safer if cascade isn't set up in DB schema.
    await database.execute(
        forecast_searches.delete().where(forecast_searches.c.weather_id == weather_id)
    )
    await database.execute(
        weather_searches.delete().where(weather_searches.c.id == weather_id)
    )
    return {"message": "Weather + forecast deleted"}