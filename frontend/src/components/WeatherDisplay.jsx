import { getWeatherIcon } from '../utils/iconMap';

const WeatherDisplay = ({ weather }) => {
    if (!weather) return null;

    // weather.icon might be "01d", "04n" etc.
    const { city, location, temperature, feels_like, humidity, weather: description, icon } = weather;
    const displayName = city || location;

    return (
        <div className="glass-card">
            <h2>Current Weather</h2>
            <div className="location-name">{displayName}</div>
            <div className="weather-main" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '1rem' }}>
                <div style={{ transform: 'scale(1.5)' }}>
                    {getWeatherIcon(icon)}
                </div>
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
