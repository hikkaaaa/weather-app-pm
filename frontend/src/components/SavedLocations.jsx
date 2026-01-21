import React, { useEffect, useState } from 'react';
import { Trash2 } from 'lucide-react';
import { getWeatherHistory, deleteWeatherRecord } from '../services/weatherService';

const SavedLocations = ({ onSelect, refreshTrigger }) => {
    const [history, setHistory] = useState([]);

    useEffect(() => {
        loadHistory();
    }, [refreshTrigger]); // Reload when refreshTrigger changes

    const loadHistory = async () => {
        try {
            const data = await getWeatherHistory();
            // Sort by date descending (newest first)
            // Assuming 'date_searched' or 'id' can be used. ID should be fine for now.
            const sorted = data.sort((a, b) => b.id - a.id);
            setHistory(sorted);
        } catch (error) {
            console.error("Failed to load history", error);
        }
    };

    const handleDelete = async (e, id) => {
        e.stopPropagation();
        if (window.confirm('Are you sure you want to delete this record?')) {
            try {
                await deleteWeatherRecord(id);
                loadHistory(); // Reload list
            } catch (error) {
                console.error("Failed to delete record", error);
            }
        }
    };

    if (history.length === 0) return null;

    return (
        <div className="history-section">
            <h2 style={{ textAlign: 'center', marginBottom: '1.5rem', color: 'rgba(255,255,255,0.8)' }}>Saved Searches</h2>
            <div className="history-grid">
                {history.map((record) => (
                    <div 
                        key={record.id} 
                        className="glass-card history-card"
                        onClick={() => onSelect(record)}
                    >
                        <button 
                            className="delete-btn"
                            onClick={(e) => handleDelete(e, record.id)}
                            title="Delete"
                        >
                            <Trash2 size={16} />
                        </button>
                        <div style={{ fontSize: '1.2rem', fontWeight: 'bold' }}>{record.location}</div>
                        <div style={{ fontSize: '2rem', margin: '0.5rem 0' }}>{Math.round(record.temperature)}°</div>
                        <div style={{ textTransform: 'capitalize', opacity: 0.8 }}>{record.weather}</div>
                        {record.start_date && record.end_date && (
                            <div style={{ fontSize: '0.9rem', color: '#ffd700', marginTop: '0.5rem' }}>
                                Trip: {record.start_date} to {record.end_date}
                            </div>
                        )}
                        <div style={{ fontSize: '0.8rem', opacity: 0.6, marginTop: '1rem' }}>
                            {new Date(record.date_searched).toLocaleDateString()}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default SavedLocations;
