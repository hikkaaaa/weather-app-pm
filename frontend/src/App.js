import React, { useState } from 'react';
import './App.css';
import WeatherForm from './components/WeatherForm';
import WeatherDisplay from './components/WeatherDisplay';
import Forecast from './components/Forecast';
import SavedLocations from './components/SavedLocations';
import { getWeather, getForecast, saveForecast, getForecastHistory, refreshForecast } from './services/weatherService';

function App() {
  const [weather, setWeather] = useState(null);
  const [forecast, setForecast] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [savedId, setSavedId] = useState(null); // ID if current view is from DB
  const [historyRefresh, setHistoryRefresh] = useState(0); // Trigger to reload history list

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

      setWeather(weatherData);
      setForecast(forecastData); // contains { forecast: [...] } or { list: [...] } ? 
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

  const handleSave = async () => {
    if (!weather) return;
    setLoading(true);
    try {
      await saveForecast(weather.location);
      setHistoryRefresh(prev => prev + 1);
      alert('Location saved to history!');
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
      await refreshForecast(savedId);
      // Reload the data
      const historyForecast = await getForecastHistory(savedId);
      setForecast({ forecast: historyForecast });
      alert('Forecast updated!');
    } catch (err) {
      console.error(err);
      setError('Failed to refresh forecast.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="App">
      <div className="main-container">
        <h1>Weather App</h1>

        <WeatherForm onSearch={handleSearch} />

        {error && <div style={{ color: '#ff6b6b', marginBottom: '1rem' }}>{error}</div>}
        {loading && <div style={{ color: 'white' }}>Loading...</div>}

        {(weather || forecast) && (
          <div className="top-section">
            <div className="weather-card-container">
              {weather && (
                <div style={{ position: 'relative' }}>
                  <WeatherDisplay weather={weather} />
                  {/* Actions for current card */}
                  <div style={{ marginTop: '1rem', display: 'flex', gap: '1rem', justifyContent: 'center' }}>
                    {!savedId ? (
                      <button className="action-btn" onClick={handleSave}>
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
          </div>
        )}

        <SavedLocations
          onSelect={handleHistorySelect}
          refreshTrigger={historyRefresh}
        />
      </div>
    </div>
  );
}

export default App;
