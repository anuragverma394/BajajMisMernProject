import React from 'react';
import { useNavigate } from 'react-router-dom';
import '../../styles/DistilleryDashboard.css';

const DistilleryDashboard = () => {
    const navigate = useNavigate();

    const menuItems = [
        {
            title: "B-Heavy Ethanol Report",
            desc: "View and export B-Heavy monthly production and stock metrics.",
            path: "/Distillery/BHeavyEthanolReport",
            icon: "fa-flask",
            color: "emerald"
        },
        {
            title: "C-Heavy Ethanol Report",
            desc: "Detailed analysis of C-Heavy ethanol stages and output.",
            path: "/Distillery/CHeavyEthanolReport",
            icon: "fa-flask-vial",
            color: "indigo"
        },
        {
            title: "Syrup Ethanol Report",
            desc: "Syrup-based ethanol production tracking and monthly logs.",
            path: "/Distillery/SyrupEthanolReport",
            icon: "fa-prescription-bottle-medical",
            color: "sky"
        }
    ];

    return (
        <div className="dist-dashboard-root animate-in fade-in duration-500">
            <header className="dist-dash-header">
                <div className="header-info">
                    <h1 className="text-xl font-semibold text-slate-800">Distillery Operations</h1>
                    <p className="text-slate-500 text-sm mt-1">Monthly ethanol production reports and analytics.</p>
                </div>
                <div className="header-badge">
                    <span className="live-pulse"></span>
                    Operational
                </div>
            </header>

            <div className="dist-menu-grid">
                {menuItems.map((item, idx) => (
                    <div
                        key={idx}
                        className={`dist-menu-card border-accent-${item.color}`}
                        onClick={() => navigate(item.path)}
                    >
                        <div className={`dist-icon-box bg-${item.color}`}>
                            <i className={`fas ${item.icon}`}></i>
                        </div>
                        <div className="dist-card-content">
                            <h3 className="dist-item-title">{item.title}</h3>
                            <p className="dist-item-desc">{item.desc}</p>
                        </div>
                        <div className="dist-card-footer">
                            <span>Open Report</span>
                            <i className="fas fa-chevron-right"></i>
                        </div>
                    </div>
                ))}
            </div>

            <div className="dist-info-section">
                <div className="info-card">
                    <div className="info-icon">
                        <i className="fas fa-info-circle text-blue-400"></i>
                    </div>
                    <div className="info-text">
                        <h4 className="text-sm font-medium text-slate-700">Data Sync Active</h4>
                        <p className="text-xs text-slate-400 mt-0.5">Reports are fetched in real-time from the standardized MERN API.</p>
                    </div>
                </div>
            </div>
        </div>
    );
};
export default DistilleryDashboard;
