from sqlalchemy import Table, Column, Integer, String, Float, DateTime
from sqlalchemy.sql import func
from app.database import metadata 

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
    Column("date_searched", DateTime(timezone=True), server_default=func.now()) #autofills with the current timestamp
)