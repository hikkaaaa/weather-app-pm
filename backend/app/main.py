from datetime import datetime
from fastapi import FastAPI, HTTPException, Query
from fastapi.responses import Response
from fastapi.middleware.cors import CORSMiddleware
from fastapi.concurrency import run_in_threadpool
import requests
import os
import csv
import io
from dotenv import load_dotenv
from app.utils import parse_location_input
from app.database import database, engine, metadata
from app.models.weather import weather_searches, forecast_searches

#loading environment variables from .env
load_dotenv()

OPENWEATHER_API_KEY = os.getenv("OPENWEATHER_API_KEY")
YOUTUBE_API_KEY = os.getenv("YOUTUBE_API_KEY")

if not OPENWEATHER_API_KEY: 
    raise RuntimeError("OPENWEATHER_API_KEY is not set")

app = FastAPI(title = "Weather App API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

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
        "icon": data["weather"][0]["icon"],
        "lat": data["coord"]["lat"],
        "lon": data["coord"]["lon"]
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
        icon=data["weather"][0]["icon"],
        lat=data["coord"]["lat"],
        lon=data["coord"]["lon"]
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
async def save_forecast(location: str, start_date: str = None, end_date: str = None):
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
        icon=weather_data["weather"][0]["icon"],
        lat=weather_data["coord"]["lat"],
        lon=weather_data["coord"]["lon"],
        start_date=start_date,
        end_date=end_date
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

# EXTRA FEATURES

def fetch_youtube_videos_sync(location: str):
    if not YOUTUBE_API_KEY:
        return []
    
    # Simple heuristic to improve search results
    query = f"{location} travel guide"
    url = "https://www.googleapis.com/youtube/v3/search"
    params = {
        "part": "snippet",
        "q": query,
        "key": YOUTUBE_API_KEY,
        "maxResults": 3,
        "type": "video"
    }
    
    try:
        response = requests.get(url, params=params)
        if response.status_code != 200:
            print(f"YouTube API Error: {response.text}")
            return []
            
        data = response.json()
        videos = []
        for item in data.get("items", []):
            videos.append({
                "title": item["snippet"]["title"],
                "videoId": item["id"]["videoId"],
                "thumbnail": item["snippet"]["thumbnails"]["high"]["url"]
            })
        return videos
    except Exception as e:
        print(f"Error fetching YouTube videos: {e}")
        return []

@app.get("/media/youtube")
async def get_youtube_videos(location: str):
    videos = await run_in_threadpool(fetch_youtube_videos_sync, location)
    return videos

@app.get("/export/weather")
async def export_weather(format: str = "json"):
    query = weather_searches.select()
    results = await database.fetch_all(query)
    
    # Convert database rows to dictionary list
    data_list = [dict(row) for row in results]
    
    # Helper to serialize datetimes
    for row in data_list:
        for k, v in row.items():
            if isinstance(v, datetime):
                row[k] = v.isoformat()

    if format.lower() == "csv":
        output = io.StringIO()
        if data_list:
            keys = data_list[0].keys()
            writer = csv.DictWriter(output, fieldnames=keys)
            writer.writeheader()
            writer.writerows(data_list)
        
        return Response(
            content=output.getvalue(),
            media_type="text/csv",
            headers={"Content-Disposition": "attachment; filename=weather_history.csv"}
        )
        
    else: # Default to JSON
        return data_list