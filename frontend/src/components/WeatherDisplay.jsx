import React from 'react';

const WeatherDisplay = ({ weather }) => {
    if (!weather) return null;

    const { city, temperature, feels_like, humidity, weather: description, icon } = weather;
    const iconUrl = `https://openweathermap.org/img/wn/${icon}@4x.png`;

    return (
        <div className="glass-card">
            <h2>Current Weather</h2>
            <div className="location-name">{city}</div>
            <div className="weather-main" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <img src={iconUrl} alt={description} style={{ width: '100px', height: '100px' }} />
                <div className="temp-huge">{Math.round(temperature)}°</div>
            </div>
            <div className="weather-desc">{description}</div>
            
            <div className="details-grid">
                <div className="detail-item">
                    <span className="detail-label">Feels Like</span>
                    <span className="detail-value">{Math.round(feels_like)}°</span>
                </div>
                <div className="detail-item">
                    <span className="detail-label">Humidity</span>
                    <span className="detail-value">{humidity}%</span>
                </div>
            </div>
        </div>
    );
};

export default WeatherDisplay;
