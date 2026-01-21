import React, { useState } from 'react';
import './App.css';
import WeatherForm from './components/WeatherForm';
import WeatherDisplay from './components/WeatherDisplay';
import Forecast from './components/Forecast';
import SavedLocations from './components/SavedLocations';
import Footer from './components/Footer';
import DateRangeModal from './components/DateRangeModal';
import MapComponent from './components/MapComponent';
import VideoSection from './components/VideoSection';
import { getWeather, getForecast, saveForecast, getForecastHistory, refreshForecast, updateWeather, getWeatherHistory, getYouTubeVideos, getExportUrl } from './services/weatherService';

function App() {
  const [weather, setWeather] = useState(null);
  const [forecast, setForecast] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [savedId, setSavedId] = useState(null); // ID if current view is from DB
  const [historyRefresh, setHistoryRefresh] = useState(0); // Trigger to reload history list
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [videos, setVideos] = useState([]);

  // Initial load? maybe load nothing or default?

  const handleSearch = async (location) => {
    setLoading(true);
    setError('');
    setSavedId(null);
    setWeather(null);
    setForecast(null);

    try {
      // Parallel fetch
      const [weatherData, forecastData] = await Promise.all([
        getWeather(location),
        getForecast(location)
      ]);

      const videoData = await getYouTubeVideos(location);

      setWeather(weatherData);
      setForecast(forecastData);
      setVideos(videoData);
      // API return: getForecast returns response.data.  OpenWeather main endpoint returns { list: [...] } but my backend wrapper 'get_forecast' returns { ..., forecast: [...] } ?
      // Let's check backend 'get_forecast' return value:
      // return { "location": ..., "city": ..., "forecast": forecast_list }
      // So the object has a "forecast" key.

    } catch (err) {
      console.error(err);
      setError('Could not fetch weather data. Please check the city name.');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveClick = () => {
    if (!weather) return;
    setIsModalOpen(true);
  };

  const handleConfirmSave = async (startDate, endDate) => {
    setIsModalOpen(false);
    setLoading(true);
    try {
      await saveForecast(weather.location, startDate, endDate);
      setHistoryRefresh(prev => prev + 1);
      alert('Location and date range saved to history!');
    } catch (err) {
      console.error(err);
      setError('Failed to save to history.');
    } finally {
      setLoading(false);
    }
  };

  const handleHistorySelect = async (record) => {
    setLoading(true);
    setError('');
    setSavedId(record.id);
    setWeather(record); // The record from history is compatible with WeatherDisplay (has temp, weather, icon etc)

    try {
      const historyForecast = await getForecastHistory(record.id);
      // historyForecast is an array of items. 
      // Forecast component expects { forecast: [...] }
      setForecast({ forecast: historyForecast });

      // Load videos for this location too (using location name)
      const videoData = await getYouTubeVideos(record.location);
      setVideos(videoData);

    } catch (err) {
      console.error(err);
      setError('Could not load saved forecast.');
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    if (!savedId) return;
    setLoading(true);
    try {
      // Refresh current weather record in DB
      await updateWeather(savedId, weather.location);
      // Refresh forecast records in DB
      await refreshForecast(savedId);

      // Reload the displayed forecast
      const historyForecast = await getForecastHistory(savedId);
      setForecast({ forecast: historyForecast });

      // Reload the displayed current weather
      const history = await getWeatherHistory();
      const updatedRecord = history.find(r => r.id === savedId);
      if (updatedRecord) setWeather(updatedRecord);

      // Trigger history list reload
      setHistoryRefresh(prev => prev + 1);

      alert('Weather data updated!');
    } catch (err) {
      console.error(err);
      setError('Failed to refresh data.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="App">
      <div className="main-content">
        <div className="main-container">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
            <h1>Weather App</h1>
            <div style={{ display: 'flex', gap: '1rem' }}>
              <a href={getExportUrl('csv')} className="action-btn" style={{ textDecoration: 'none', fontSize: '0.8rem' }} target="_blank" rel="noreferrer">Export CSV</a>
              <a href={getExportUrl('json')} className="action-btn" style={{ textDecoration: 'none', fontSize: '0.8rem' }} target="_blank" rel="noreferrer">Export JSON</a>
            </div>
          </div>

          <WeatherForm onSearch={handleSearch} />

          {error && <div className="error-message">{error}</div>}
          {loading && <div className="loading-spinner"></div>}

          {(weather || forecast) && (
            <div className="top-section">
              <div className="weather-card-container">
                {weather && (
                  <div style={{ position: 'relative' }}>
                    <WeatherDisplay weather={weather} />
                    {/* Actions for current card */}
                    <div style={{ marginTop: '1rem', display: 'flex', gap: '1rem', justifyContent: 'center' }}>
                      {!savedId ? (
                        <button className="action-btn" onClick={handleSaveClick}>
                          Save to History
                        </button>
                      ) : (
                        <button className="action-btn" onClick={handleRefresh}>
                          Refresh Data
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>

              <div className="forecast-section-container">
                {forecast && <Forecast forecastData={forecast} />}
              </div>

              <div style={{ width: '100%', marginTop: '1rem' }}>
                {/* Map - use lat/lon from weather data (either API or DB) */}
                {weather && weather.lat && weather.lon && (
                  <MapComponent lat={weather.lat} lon={weather.lon} locationName={weather.city || weather.location} />
                )}

                <VideoSection videos={videos} />
              </div>
            </div>
          )}

          <SavedLocations
            onSelect={handleHistorySelect}
            refreshTrigger={historyRefresh}
          />

        </div>
      </div>

      <DateRangeModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onConfirm={handleConfirmSave}
      />

      <Footer />
    </div>
  );
}

export default App;
