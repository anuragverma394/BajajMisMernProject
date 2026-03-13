import React from 'react';
import { useNavigate } from 'react-router-dom';
import '../../styles/Tracking.css';
import '../../styles/Dashboard_1.css';

const TrackingDashboard = () => {
    const navigate = useNavigate();

    const modules = [
        {
            title: "Live Location",
            desc: "Monitor real-time employee movements and battery status",
            icon: "fa-location-dot",
            path: "/Tracking/LiveLocationRpt",
            color: "blue"
        },
        {
            title: "Target Management",
            desc: "Village & Officer wise target setting for cane development",
            icon: "fa-bullseye",
            path: "/Tracking/TargetEntry",
            color: "rose"
        },
        {
            title: "Live Map View",
            desc: "Visual representation of all field assets on map",
            icon: "fa-map-location-dot",
            path: "/Tracking/ViewMapLive",
            color: "emerald"
        },
        {
            title: "Grower Meetings",
            desc: "Track and report meetings held with growers",
            icon: "fa-people-group",
            path: "/Tracking/GrowerMeetingReport",
            color: "amber"
        },
        {
            title: "Analysis Reports",
            desc: "Comprehensive tracking performance analytics",
            icon: "fa-chart-pie",
            path: "/Tracking/TrackingReport",
            color: "violet"
        }
    ];

    return (
        <div className="tracking-container animate-in fade-in duration-500">
            <header className="mb-10">
                <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Geospatial Tracking System</h1>
                <p className="text-slate-500 mt-2">Real-time field monitoring and personnel management.</p>
            </header>

            <div className="tracking-grid">
                {modules.map((mod, idx) => (
                    <div
                        key={idx}
                        className="tracking-module-card group"
                        onClick={() => navigate(mod.path)}
                    >
                        <div className={`tracking-icon-wrapper bg-${mod.color}-50 text-${mod.color}-600 group-hover:bg-${mod.color}-600 group-hover:text-white`}>
                            <i className={`fas ${mod.icon}`}></i>
                        </div>
                        <div>
                            <h3 className="font-bold text-slate-800 text-lg group-hover:text-blue-600 transition-colors">
                                {mod.title}
                            </h3>
                            <p className="text-slate-500 text-sm mt-1 leading-relaxed">
                                {mod.desc}
                            </p>
                        </div>
                        <div className="mt-auto pt-4 flex items-center text-xs font-bold text-slate-400 group-hover:text-blue-500 transition-all uppercase tracking-widest">
                            Explore Module <i className="fas fa-arrow-right ml-2 opacity-0 group-hover:opacity-100 transform translate-x-[-10px] group-hover:translate-x-0 transition-all"></i>
                        </div>
                    </div>
                ))}
            </div>

            {/* Status Footer */}
            <div className="mt-12 p-6 bg-white rounded-2xl border border-slate-200 flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <div className="relative">
                        <div className="w-3 h-3 bg-emerald-500 rounded-full animate-ping absolute inset-0"></div>
                        <div className="w-3 h-3 bg-emerald-500 rounded-full relative"></div>
                    </div>
                    <span className="text-sm font-semibold text-slate-700">Tracking Engine Online</span>
                </div>
                <div className="text-sm text-slate-400">
                    Last sync: {new Date().toLocaleTimeString()}
                </div>
            </div>
        </div>
    );
};

export default TrackingDashboard;
