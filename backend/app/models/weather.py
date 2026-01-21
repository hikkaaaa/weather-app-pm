from sqlalchemy import Table, Column, Integer, String, Float, DateTime, ForeignKey
from sqlalchemy.sql import func
from app.database import metadata 

#Current weather table
weather_searches = Table(
    "weather_searches", 
    metadata, 
    Column("id", Integer, primary_key=True), 
    Column("location", String, nullable=False), 
    Column("temperature", Float, nullable=False), 
    Column("feels_like", Float, nullable=False),
    Column("humidity", Float, nullable=False),
    Column("weather", String, nullable=False),
    Column("icon", String, nullable=True),
    Column("lat", Float, nullable=True),
    Column("lon", Float, nullable=True),
    Column("date_searched", DateTime(timezone=True), server_default=func.now()), #autofills with the current timestamp
    Column("start_date", String, nullable=True), # User selected start date
    Column("end_date", String, nullable=True)    # User selected end date
)

#Forecast table
forecast_searches = Table(
    "forecast_searches", 
    metadata,
    Column("id", Integer, primary_key=True), 
    Column("weather_id", Integer, ForeignKey("weather_searches.id")), #link to the main search
    Column("datetime", DateTime, nullable=False), 
    Column("temperature", Float, nullable=False), 
    Column("feels_like", Float, nullable=False),
    Column("humidity", Float, nullable=False),
    Column("weather", String, nullable=False),
    Column("icon", String, nullable=True)
)