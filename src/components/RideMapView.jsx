import React, { useEffect, useRef, useState } from 'react';
import { MapContainer, TileLayer, Polyline, Marker, Popup, useMap, Tooltip as LeafletTooltip } from 'react-leaflet';
import polyline from '@mapbox/polyline';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix for default marker icons in React-Leaflet
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
    iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Custom marker icons
const startIcon = new L.Icon({
    iconUrl: 'data:image/svg+xml;base64,' + btoa(`
    <svg xmlns="http://www.w3.org/2000/svg" width="32" height="42" viewBox="0 0 32 42">
      <path fill="#00E676" stroke="#fff" stroke-width="2" d="M16 0C7.2 0 0 7.2 0 16c0 8.8 16 26 16 26s16-17.2 16-26C32 7.2 24.8 0 16 0z"/>
      <circle cx="16" cy="16" r="6" fill="#fff"/>
    </svg>
  `),
    iconSize: [32, 42],
    iconAnchor: [16, 42],
    popupAnchor: [0, -42]
});

const endIcon = new L.Icon({
    iconUrl: 'data:image/svg+xml;base64,' + btoa(`
    <svg xmlns="http://www.w3.org/2000/svg" width="32" height="42" viewBox="0 0 32 42">
      <path fill="#FF5252" stroke="#fff" stroke-width="2" d="M16 0C7.2 0 0 7.2 0 16c0 8.8 16 26 16 26s16-17.2 16-26C32 7.2 24.8 0 16 0z"/>
      <circle cx="16" cy="16" r="6" fill="#fff"/>
    </svg>
  `),
    iconSize: [32, 42],
    iconAnchor: [16, 42],
    popupAnchor: [0, -42]
});

// Get color based on speed
const getSpeedColor = (speed) => {
    if (speed < 10) return '#00E676'; // Green - very slow
    if (speed < 20) return '#76FF03'; // Light green - slow
    if (speed < 30) return '#FFEB3B'; // Yellow - moderate
    if (speed < 40) return '#FFC107'; // Orange - fast
    if (speed < 50) return '#FF9800'; // Deep orange - very fast
    return '#FF5252'; // Red - extremely fast
};

// Component to fit bounds to the route
const FitBounds = ({ bounds }) => {
    const map = useMap();

    useEffect(() => {
        if (bounds && bounds.length > 0) {
            map.fitBounds(bounds, { padding: [50, 50] });
        }
    }, [bounds, map]);

    return null;
};

const RideMapView = ({ ride }) => {
    const mapRef = useRef(null);
    const [showSpeedColors, setShowSpeedColors] = useState(true);

    // Decode polyline if available
    let routeCoordinates = [];
    let bounds = [];
    let speedData = ride.speedTimeSeries || [];

    if (ride.polyline && ride.polyline.trim() !== '') {
        try {
            // Decode polyline (returns [lat, lng] pairs)
            const decoded = polyline.decode(ride.polyline);
            routeCoordinates = decoded.map(coord => [coord[0], coord[1]]);

            if (routeCoordinates.length > 0) {
                bounds = routeCoordinates;
            }
        } catch (error) {
            console.error('Error decoding polyline:', error);
        }
    }

    // Fallback to start/end points if no polyline
    const hasValidStart = ride.location.start[0] !== 0 && ride.location.start[1] !== 0;
    const hasValidEnd = ride.location.end[0] !== 0 && ride.location.end[1] !== 0;

    if (routeCoordinates.length === 0 && hasValidStart && hasValidEnd) {
        routeCoordinates = [ride.location.start, ride.location.end];
        bounds = routeCoordinates;
    }

    // Default center (if no valid coordinates)
    const defaultCenter = [12.9716, 77.5946]; // Bangalore
    const center = routeCoordinates.length > 0
        ? routeCoordinates[Math.floor(routeCoordinates.length / 2)]
        : (hasValidStart ? ride.location.start : defaultCenter);

    const hasRoute = routeCoordinates.length > 0;
    const hasSpeedData = speedData.length > 0;

    // Create speed-colored segments
    const speedSegments = [];
    if (hasRoute && hasSpeedData && showSpeedColors) {
        // Interpolate speed data to match route coordinates
        const pointsPerSpeed = Math.floor(routeCoordinates.length / speedData.length);

        for (let i = 0; i < routeCoordinates.length - 1; i++) {
            const speedIndex = Math.min(Math.floor(i / pointsPerSpeed), speedData.length - 1);
            const speed = speedData[speedIndex] || 0;
            const color = getSpeedColor(speed);

            speedSegments.push({
                positions: [routeCoordinates[i], routeCoordinates[i + 1]],
                color: color,
                speed: speed
            });
        }
    }

    return (
        <div className="ride-map-container">
            {!hasRoute && (
                <div className="map-no-data">
                    <p>📍 No GPS data available for this ride</p>
                </div>
            )}

            <MapContainer
                center={center}
                zoom={hasRoute ? 13 : 12}
                style={{ height: '100%', width: '100%', borderRadius: '12px' }}
                ref={mapRef}
            >
                <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />

                {hasRoute && <FitBounds bounds={bounds} />}

                {/* Speed-colored route segments */}
                {hasRoute && hasSpeedData && showSpeedColors ? (
                    speedSegments.map((segment, idx) => (
                        <Polyline
                            key={`speed-segment-${idx}`}
                            positions={segment.positions}
                            pathOptions={{
                                color: segment.color,
                                weight: 5,
                                opacity: 0.8,
                                lineJoin: 'round',
                                lineCap: 'round'
                            }}
                        >
                            <LeafletTooltip sticky>
                                <strong>{segment.speed.toFixed(1)} km/h</strong>
                            </LeafletTooltip>
                        </Polyline>
                    ))
                ) : (
                    /* Single color route */
                    routeCoordinates.length > 1 && (
                        <Polyline
                            positions={routeCoordinates}
                            pathOptions={{
                                color: '#00E676',
                                weight: 4,
                                opacity: 0.8,
                                lineJoin: 'round',
                                lineCap: 'round'
                            }}
                        />
                    )
                )}

                {/* Start marker */}
                {hasValidStart && (
                    <Marker position={ride.location.start} icon={startIcon}>
                        <Popup>
                            <div style={{ minWidth: '150px' }}>
                                <strong>🏁 Start</strong>
                                <p style={{ margin: '0.5rem 0 0 0', fontSize: '0.85rem' }}>
                                    {ride.location.startAddr || 'Start Location'}
                                </p>
                            </div>
                        </Popup>
                    </Marker>
                )}

                {/* End marker */}
                {hasValidEnd && (
                    <Marker position={ride.location.end} icon={endIcon}>
                        <Popup>
                            <div style={{ minWidth: '150px' }}>
                                <strong>🏁 End</strong>
                                <p style={{ margin: '0.5rem 0 0 0', fontSize: '0.85rem' }}>
                                    {ride.location.endAddr || 'End Location'}
                                </p>
                            </div>
                        </Popup>
                    </Marker>
                )}
            </MapContainer>

            {hasRoute && (
                <>
                    <div className="map-info-overlay">
                        <div className="map-info-item">
                            <span className="map-info-label">Distance:</span>
                            <span className="map-info-value">{ride.distance} km</span>
                        </div>
                        <div className="map-info-item">
                            <span className="map-info-label">Duration:</span>
                            <span className="map-info-value">{ride.duration} min</span>
                        </div>
                        <div className="map-info-item">
                            <span className="map-info-label">Avg Speed:</span>
                            <span className="map-info-value">{((ride.distance / ride.duration) * 60).toFixed(1)} km/h</span>
                        </div>
                        {hasSpeedData && (
                            <div className="map-info-item">
                                <span className="map-info-label">Max Speed:</span>
                                <span className="map-info-value">{ride.topSpeed} km/h</span>
                            </div>
                        )}
                    </div>

                    {hasSpeedData && (
                        <>
                            <button
                                className="map-toggle-speed"
                                onClick={() => setShowSpeedColors(!showSpeedColors)}
                            >
                                {showSpeedColors ? '🎨 Hide Speed Colors' : '🎨 Show Speed Colors'}
                            </button>

                            {showSpeedColors && (
                                <div className="speed-legend">
                                    <div className="legend-title">Speed (km/h)</div>
                                    <div className="legend-items">
                                        <div className="legend-item">
                                            <div className="legend-color" style={{ background: '#FF5252' }}></div>
                                            <span>50+</span>
                                        </div>
                                        <div className="legend-item">
                                            <div className="legend-color" style={{ background: '#FF9800' }}></div>
                                            <span>40-50</span>
                                        </div>
                                        <div className="legend-item">
                                            <div className="legend-color" style={{ background: '#FFC107' }}></div>
                                            <span>30-40</span>
                                        </div>
                                        <div className="legend-item">
                                            <div className="legend-color" style={{ background: '#FFEB3B' }}></div>
                                            <span>20-30</span>
                                        </div>
                                        <div className="legend-item">
                                            <div className="legend-color" style={{ background: '#76FF03' }}></div>
                                            <span>10-20</span>
                                        </div>
                                        <div className="legend-item">
                                            <div className="legend-color" style={{ background: '#00E676' }}></div>
                                            <span>0-10</span>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </>
                    )}
                </>
            )}
        </div>
    );
};

export default RideMapView;
