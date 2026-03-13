import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Polygon, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { FaArrowLeft, FaMapMarkedAlt, FaInfoCircle, FaUser } from 'react-icons/fa';
import '../../styles/Report.css';
import '../../styles/DiseaseDetailsOnMap.css';

// Fix for default marker icon in leaflet
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
    iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

const calculateDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371000;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distanceMeter = R * c;

    if (distanceMeter < 1000) {
        return distanceMeter.toFixed(2) + " m";
    } else {
        return (distanceMeter / 1000).toFixed(2) + " km";
    }
};

const getPolygonCenter = (corners) => {
    var totalLat = 0, totalLng = 0;
    for (var i = 0; i < corners.length; i++) {
        totalLat += corners[i][0];
        totalLng += corners[i][1];
    }
    return [totalLat / corners.length, totalLng / corners.length];
};

const Report_DiseaseDetailsOnMap = () => {
    const [plots, setPlots] = useState([]);
    const [selectedPlot, setSelectedPlot] = useState(null);

    useEffect(() => {
        // Mock data
        const mockPlots = [
            {
                gh_no: 'D001', VillageName: 'Village B', UserName: 'User 2',
                lat1: 26.8467, lng1: 80.9462,
                lat2: 26.8477, lng2: 80.9462,
                lat3: 26.8477, lng3: 80.9472,
                lat4: 26.8467, lng4: 80.9472,
                userlat: 26.8457, userlng: 80.9482,
                ShareArea: '0.5', growerName: 'Grower X'
            }
        ];
        setPlots(mockPlots);
    }, []);

    const userIcon = L.divIcon({
        className: 'user-marker',
        html: `<div class="user-marker-inner">👤</div>`,
        iconSize: [35, 35],
        iconAnchor: [17, 17]
    });

    const plotIcon = L.divIcon({
        className: 'plot-marker',
        html: `<div class="plot-marker-inner">📍</div>`,
        iconSize: [25, 25],
        iconAnchor: [12, 12]
    });

    return (
        <div className="report-container animate-in fade-in duration-500">
            <div className="report-card">
                <div className="report-card-header">
                    <h2 className="report-card-title">
                        <FaMapMarkedAlt className="text-red-500" />
                        Disease Details On Map
                    </h2>
                    <button className="report-btn report-btn-secondary" onClick={() => window.history.back()}>
                        <FaArrowLeft /> Back
                    </button>
                </div>

                <div className="report-card-content relative">
                    <div className="disease-map-wrapper">
                        <MapContainer center={[26.8467, 80.9462]} zoom={13} className="disease-map-container">
                            <TileLayer
                                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                            />
                            {plots.map((plot, idx) => {
                                const corners = [
                                    [plot.lat1, plot.lng1],
                                    [plot.lat2, plot.lng2],
                                    [plot.lat3, plot.lng3],
                                    [plot.lat4, plot.lng4]
                                ];
                                const center = getPolygonCenter(corners);
                                const distance = calculateDistance(center[0], center[1], plot.userlat, plot.userlng);

                                return (
                                    <React.Fragment key={idx}>
                                        <Polygon
                                            positions={[...corners, corners[0]]}
                                            pathOptions={{ color: '#006600', fillColor: '#33cc33', fillOpacity: 0.7, weight: 4 }}
                                            eventHandlers={{
                                                click: () => setSelectedPlot({ ...plot, center, distance })
                                            }}
                                        />
                                        <Marker position={center} icon={plotIcon} />
                                    </React.Fragment>
                                );
                            })}
                            {selectedPlot && (
                                <>
                                    <Marker position={[selectedPlot.userlat, selectedPlot.userlng]} icon={userIcon} />
                                    <Polyline
                                        positions={[selectedPlot.center, [selectedPlot.userlat, selectedPlot.userlng]]}
                                        pathOptions={{ color: '#ff0000', weight: 4, dashArray: '10, 5', opacity: 0.8 }}
                                    />
                                </>
                            )}
                        </MapContainer>
                    </div>

                    {selectedPlot && (
                        <div className="absolute top-4 right-4 bg-white p-6 rounded-xl shadow-xl border border-slate-200 z-[1000] w-80 animate-in slide-in-from-right">
                            <h4 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2 border-b pb-2">
                                <FaIdCardAlt className="text-red-500" />
                                Plot Details
                            </h4>
                            <div className="space-y-2 text-sm">
                                <p><span className="text-slate-500">GH No:</span> <span className="font-semibold">{selectedPlot.gh_no}</span></p>
                                <p><span className="text-slate-500">Village:</span> <span className="font-semibold">{selectedPlot.VillageName}</span></p>
                                <p><span className="text-slate-500">User:</span> <span className="font-semibold">{selectedPlot.UserName}</span></p>
                                <p><span className="text-slate-500">Grower:</span> <span className="font-semibold">{selectedPlot.growerName}</span></p>
                                <p><span className="text-slate-500">Area:</span> <span className="font-semibold">{selectedPlot.ShareArea}</span></p>
                                <div className="mt-4 pt-4 border-t border-slate-100">
                                    <p className="flex justify-between items-center bg-red-50 p-3 rounded-lg">
                                        <span className="text-red-600 font-medium">🎯 Distance:</span>
                                        <span className="text-red-700 font-bold text-lg">{selectedPlot.distance}</span>
                                    </p>
                                </div>
                            </div>
                            <button
                                className="mt-4 w-full py-2 bg-white text-slate-700 rounded-lg hover:bg-slate-100 transition-colors text-sm font-medium"
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

export default Report_DiseaseDetailsOnMap;
