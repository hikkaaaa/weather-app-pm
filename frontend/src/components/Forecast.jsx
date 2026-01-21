import React from 'react';
import { getWeatherIcon } from '../utils/iconMap';

const Forecast = ({ forecastData }) => {
    if (!forecastData || !forecastData.forecast) return null;

    // Helper to process forecast data: Group by day and pick representative item (noon)
    const processForecast = (list) => {
        const dailyData = {};

        list.forEach((item) => {
            // detailed parsing to handle "2024-01-01 12:00:00" (OpenWeather) and "2024-01-01T12:00:00" (ISO/DB)
            const dtString = String(item.datetime); 
            const datePart = dtString.split(/[T ]/)[0]; // Split by T or space
            
            if (!dailyData[datePart]) {
                dailyData[datePart] = [];
            }
            dailyData[datePart].push(item);
        });

        // For each day, pick the item closests to 12:00 PM
        const processed = Object.keys(dailyData).map((date) => {
            const dayItems = dailyData[date];
            // Sort by difference from 12:00
            const noon = 12;
            const representative = dayItems.reduce((closest, current) => {
                const getHour = (dt) => {
                    const timePart = String(dt).split(/[T ]/)[1]; // "12:00:00"
                    return parseInt(timePart.split(':')[0], 10);
                };
                
                const currentHour = getHour(current.datetime);
                const closestHour = getHour(closest.datetime);
                return Math.abs(currentHour - noon) < Math.abs(closestHour - noon) ? current : closest;
            });
            return representative;
        });

        // Limit to 5 days if needed, though API usually gives 5
        return processed.slice(0, 5);
    };

    const dailyForecasts = processForecast(forecastData.forecast);
    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

    return (
        <div className="glass-card">
            <h2>5-Day Forecast</h2>
            <div className="forecast-container">
                {dailyForecasts.map((item, index) => {
                    const dateObj = new Date(item.datetime);
                    const dayName = dayNames[dateObj.getDay()];
                    
                    return (
                        <div key={index} className="forecast-day-card">
                            <div className="forecast-day-name">{dayName}</div>
                            <div className="forecast-icon" style={{ margin: '0.5rem 0' }}>
                                {getWeatherIcon(item.icon)}
                            </div>
                            <div style={{ fontWeight: 'bold', fontSize: '1.2rem' }}>
                                {Math.round(item.temperature)}°
                            </div>
                            <div style={{ fontSize: '0.9rem', opacity: 0.8 }}>
                                {item.weather}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default Forecast;
