import React, { useState } from 'react';
import { Search } from 'lucide-react';

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
                placeholder="Enter city (e.g. Paris), zip code, coordinates, or landmark"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
            />
            <button type="submit" className="search-button" aria-label="Search">
                <Search size={24} />
            </button>
        </form>
    );
};

export default WeatherForm;
