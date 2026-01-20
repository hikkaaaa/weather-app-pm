import React, { useState } from 'react';

const WeatherForm = ({ onSearch }) => {
    const [location, setLocation] = useState('');

    const handleSubmit = (e) => {
        e.preventDefault();
        if (location.trim()) {
            onSearch(location);
            setLocation('');
        }
    };

    return (
        <form className="search-form" onSubmit={handleSubmit}>
            <input
                type="text"
                className="search-input"
                placeholder="Search city, zip, or coordinates..."
                value={location}
                onChange={(e) => setLocation(e.target.value)}
            />
            <button type="submit" className="search-button">
                Search
            </button>
        </form>
    );
};

export default WeatherForm;
