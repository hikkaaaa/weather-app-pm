import axios from 'axios';

const API_BASE_URL = 'http://127.0.0.1:8000';

const api = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

export const getWeather = async (location) => {
    try {
        const response = await api.get(`/weather`, { params: { location } });
        return response.data;
    } catch (error) {
        throw error;
    }
};

export const getForecast = async (location) => {
    try {
        const response = await api.get(`/forecast`, { params: { location } });
        return response.data;
    } catch (error) {
        throw error;
    }
};

export const saveWeather = async (location) => {
    try {
        const response = await api.post(`/weather/save`, null, { params: { location } });
        return response.data;
    } catch (error) {
        throw error;
    }
};

export const saveForecast = async (location) => {
    try {
        const response = await api.post(`/forecast/save`, null, { params: { location } });
        return response.data;
    } catch (error) {
        throw error;
    }
};

export const getWeatherHistory = async () => {
    try {
        const response = await api.get(`/weather/history`);
        return response.data;
    } catch (error) {
        throw error;
    }
};

export const getForecastHistory = async (weatherId) => {
    try {
        const response = await api.get(`/forecast/history/${weatherId}`);
        return response.data;
    } catch (error) {
        throw error;
    }
};

export const deleteWeatherRecord = async (weatherId) => {
    try {
        // Based on backend logic, deleting via forecast endpoint deletes both or use specific endpoint
        // Backend has @app.delete("/forecast/{weather_id}") which deletes both
        const response = await api.delete(`/forecast/${weatherId}`);
        return response.data;
    } catch (error) {
        throw error;
    }
};

export const refreshForecast = async (weatherId) => {
    try {
        const response = await api.put(`/forecast/refresh/${weatherId}`);
        return response.data;
    } catch (error) {
        throw error;
    }
};
