import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Polygon, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { FaArrowLeft, FaMapMarkedAlt, FaInfoCircle } from 'react-icons/fa';
import '../../styles/Report.css';
import '../../styles/CheckingDetailsOnMap.css';

// Fix for default marker icon in leaflet
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
    iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

const calculateDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371000;
    const toRad = Math.PI / 180;
    const dLat = (lat2 - lat1) * toRad;
    const dLon = (lon2 - lon1) * toRad;
    const a = Math.sin(dLat / 2) ** 2 +
        Math.cos(lat1 * toRad) * Math.cos(lat2 * toRad) *
        Math.sin(dLon / 2) ** 2;
    return (R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))) / 1000;
};

const getCenter = (corners) => {
    let lat = 0, lng = 0;
    corners.forEach(p => {
        lat += p[0];
        lng += p[1];
    });
    return [lat / corners.length, lng / corners.length];
};

const Report_CheckingDetailsOnMap = () => {
    const [plots, setPlots] = useState([]);
    const [selectedPlot, setSelectedPlot] = useState(null);

    useEffect(() => {
        // Mock data or fetch from API
        const mockPlots = [
            {
                gh_no: 'P001', VillageName: 'Village A', UserName: 'User 1',
                lat1: 26.8467, lng1: 80.9462,
                lat2: 26.8477, lng2: 80.9462,
                lat3: 26.8477, lng3: 80.9472,
                lat4: 26.8467, lng4: 80.9472,
                userlat: 26.8457, userlng: 80.9452
            }
        ];
        setPlots(mockPlots);
    }, []);

    return (
        <div className="map-detail-root animate-in fade-in duration-500">
            <div className="premium-map-card">
                <div className="map-card-header">
                    <h2 className="title-with-icon">
                        <FaMapMarkedAlt className="icon-blue" />
                        Checking Details On Map
                    </h2>
                    <button className="btn-back-square" onClick={() => window.history.back()}>
                        <FaArrowLeft className="spacer-r" /> Back
                    </button>
                </div>

                <div className="map-viewport-wrapper">
                    <div className="leaflet-map-container">
                        <MapContainer center={[26.8467, 80.9462]} zoom={13} className="full-size-map">
                            <TileLayer
                                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                            />
                            {plots.map((plot, idx) => {
                                const corners = [
                                    [plot.lat1, plot.lng1],
                                    [plot.lat2, plot.lng2],
                                    [plot.lat3, plot.lng3],
                                    [plot.lat4, plot.lng4],
                                    [plot.lat1, plot.lng1]
                                ];
                                const center = getCenter(corners.slice(0, 4));
                                const distance = calculateDistance(center[0], center[1], plot.userlat, plot.userlng).toFixed(2);

                                return (
                                    <React.Fragment key={idx}>
                                        <Polygon
                                            positions={corners}
                                            pathOptions={{ color: '#28a745', fillColor: '#b2f2bb', fillOpacity: 0.6 }}
                                            eventHandlers={{
                                                click: () => setSelectedPlot({ ...plot, center, distance })
                                            }}
                                        />
                                        <Marker position={center} title={`Plot ${plot.gh_no}`}>
                                            <Popup className="premium-popup">
                                                <div className="popup-inner">
                                                    <strong>Plot {plot.gh_no}</strong><br />
                                                    <span className="village-text">Village: {plot.VillageName}</span>
                                                </div>
                                            </Popup>
                                        </Marker>
                                    </React.Fragment>
                                );
                            })}
                        </MapContainer>
                    </div>

                    {selectedPlot && (
                        <div className="plot-info-panel animate-in slide-in-from-right">
                            <h4 className="panel-title">
                                <FaInfoCircle className="icon-blue" />
                                Plot Details
                            </h4>
                            <div className="panel-stats-list">
                                <div className="stat-row">
                                    <span className="stat-label">Plot No:</span>
                                    <span className="stat-value bold">{selectedPlot.gh_no}</span>
                                </div>
                                <div className="stat-row">
                                    <span className="stat-label">Village:</span>
                                    <span className="stat-value bold">{selectedPlot.VillageName}</span>
                                </div>
                                <div className="stat-row">
                                    <span className="stat-label">User Name:</span>
                                    <span className="stat-value bold">{selectedPlot.UserName}</span>
                                </div>
                                <div className="stat-row">
                                    <span className="stat-label">User Loc:</span>
                                    <span className="stat-value mono-small">{selectedPlot.userlat}, {selectedPlot.userlng}</span>
                                </div>
                                <div className="stat-row">
                                    <span className="stat-label">Plot Center:</span>
                                    <span className="stat-value mono-small">{selectedPlot.center[0].toFixed(6)}, {selectedPlot.center[1].toFixed(6)}</span>
                                </div>
                                <div className="distance-highlight-row">
                                    <span className="dist-label">Distance:</span>
                                    <span className="dist-value">{selectedPlot.distance} km</span>
                                </div>
                            </div>
                            <button
                                className="btn-close-panel"
                                onClick={() => setSelectedPlot(null)}
                            >
                                Close info
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Report_CheckingDetailsOnMap;
