import React, { useState } from 'react';
import '../App.css'; 

const DateRangeModal = ({ isOpen, onClose, onConfirm }) => {
    // Default to today and 5 days from now (matching the forecast availability)
    const today = new Date().toISOString().split('T')[0];
    const maxDate = new Date();
    maxDate.setDate(maxDate.getDate() + 5);
    const maxDateStr = maxDate.toISOString().split('T')[0];

    const [startDate, setStartDate] = useState(today);
    const [endDate, setEndDate] = useState(maxDateStr);
    const [error, setError] = useState('');

    if (!isOpen) return null;

    const handleSubmit = () => {
        if (!startDate || !endDate) {
            setError('Please select both dates.');
            return;
        }
        if (startDate > endDate) {
            setError('Start date cannot be after end date.');
            return;
        }
        onConfirm(startDate, endDate);
    };

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content" onClick={e => e.stopPropagation()}>
                <h3>Save Trip Dates</h3>
                <p>Select the date range for your trip to save this forecast.</p>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '1.5rem', textAlign: 'left' }}>
                    <div>
                        <label style={{ display: 'block', marginBottom: '0.5rem', opacity: 0.7 }}>Start Date</label>
                        <input 
                            type="date" 
                            className="search-input" 
                            style={{ width: '100%', boxSizing: 'border-box' }}
                            value={startDate}
                            onChange={(e) => setStartDate(e.target.value)}
                            min={today}
                        />
                    </div>
                    <div>
                        <label style={{ display: 'block', marginBottom: '0.5rem', opacity: 0.7 }}>End Date</label>
                        <input 
                            type="date" 
                            className="search-input" 
                            style={{ width: '100%', boxSizing: 'border-box' }}
                            value={endDate}
                            onChange={(e) => setEndDate(e.target.value)}
                            min={startDate}
                        />
                    </div>
                    {error && <div style={{ color: '#ff6b6b', fontSize: '0.9rem' }}>{error}</div>}
                </div>

                <div style={{ display: 'flex', justifyContent: 'center' }}>
                    <button className="submit-btn" onClick={handleSubmit}>Save Search</button>
                    <button className="close-btn" onClick={onClose}>Cancel</button>
                </div>
            </div>
        </div>
    );
};

export default DateRangeModal;
