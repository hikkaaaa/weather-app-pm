import React from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Fix for default marker icon not showing up in React Leaflet
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

let DefaultIcon = L.icon({
    iconUrl: icon,
    shadowUrl: iconShadow,
    iconSize: [25, 41],
    iconAnchor: [12, 41]
});

L.Marker.prototype.options.icon = DefaultIcon;

// Subcomponent to update map center when props change
function ChangeView({ center }) {
    const map = useMap();
    map.setView(center);
    return null;
}

const MapComponent = ({ lat, lon, locationName }) => {
    if (!lat || !lon) return null;

    const position = [lat, lon];

    return (
        <div className="glass-card map-container" style={{ height: '350px', borderRadius: '15px', overflow: 'hidden', marginTop: '2rem', padding: '0.5rem' }}>
             <MapContainer center={position} zoom={13} scrollWheelZoom={false} style={{ height: '100%', width: '100%', borderRadius: '10px' }}>
                <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                <Marker position={position}>
                    <Popup>
                        {locationName}
                    </Popup>
                </Marker>
                <ChangeView center={position} />
            </MapContainer>
        </div>
    );
};

export default MapComponent;
