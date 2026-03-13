import React from 'react';
import { useNavigate } from 'react-router-dom';
import '../../styles/Dashboard_1.css';

const Survey_SurveyDashboard = () => {
    const navigate = useNavigate();

    const reportCards = [
        {
            title: "Survey Status",
            desc: "Unit-wise survey progress and team status monitoring.",
            path: "/SurveyReport/SurveyUnitWiseSurveyStatus",
            icon: "fa-clipboard-check",
            color: "blue"
        },
        {
            title: "Area Summary",
            desc: "Village & Unit level area comparison with last season.",
            path: "/SurveyReport/SurveyUnitWiseSurveyAreaSummary",
            icon: "fa-chart-area",
            color: "emerald"
        },
        {
            title: "Effected Cane Area",
            desc: "Impact analysis for diseased or damaged cane crops.",
            path: "/Report/EffectedCaneAreaReport",
            icon: "fa-wheat-awn-circle-exclamation",
            color: "rose"
        },
        {
            title: "Hourly Cane Arrival",
            desc: "Real-time crushing progress and daily arrival logs.",
            path: "/Report/HourlyCaneArrival",
            icon: "fa-truck-clock",
            color: "amber"
        },
        {
            title: "Live Location",
            desc: "Monitor field staff movements and real-time positioning.",
            path: "/Tracking/LiveLocationRpt",
            icon: "fa-location-dot",
            color: "indigo"
        }
    ];

    return (
        <div className="survey-dashboard-root animate-in fade-in duration-700">
            <header className="mb-10">
                <h1 className="text-4xl font-black text-slate-900 tracking-tight mb-2">Survey Intelligence</h1>
                <p className="text-slate-500 text-lg">Comprehensive field analytics and survey reporting suite.</p>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {reportCards.map((card, idx) => (
                    <div
                        key={idx}
                        className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-xl hover:scale-[1.02] transition-all cursor-pointer group"
                        onClick={() => navigate(card.path)}
                    >
                        <div className={`w-14 h-14 rounded-xl flex items-center justify-center mb-6 bg-${card.color}-50 text-${card.color}-600 group-hover:bg-${card.color}-600 group-hover:text-white transition-colors`}>
                            <i className={`fas ${card.icon} text-2xl`}></i>
                        </div>
                        <h3 className="text-xl font-bold text-slate-800 mb-2">{card.title}</h3>
                        <p className="text-slate-500 text-sm leading-relaxed mb-6">{card.desc}</p>
                        <div className="flex items-center text-xs font-bold uppercase tracking-wider text-slate-400 group-hover:text-slate-900">
                            View Report <i className="fas fa-arrow-right ml-2 group-hover:translate-x-1 transition-transform"></i>
                        </div>
                    </div>
                ))}
            </div>

            <div className="mt-12 grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 bg-slate-900 rounded-3xl p-8 text-white relative overflow-hidden">
                    <div className="relative z-10">
                        <h2 className="text-2xl font-bold mb-4">Deep Analytics Coming Soon</h2>
                        <p className="text-slate-400 max-w-lg mb-8">We are integrating advanced GIS data and satellite imagery into the survey module for more accurate area estimation.</p>
                        <button className="bg-white text-slate-900 px-6 py-3 rounded-xl font-bold hover:bg-slate-200 transition-colors">
                            View Roadmap
                        </button>
                    </div>
                    <i className="fas fa-satellite-dish absolute -right-10 -bottom-10 text-[200px] text-white/5 rotate-12"></i>
                </div>

                <div className="bg-indigo-600 rounded-3xl p-8 text-white">
                    <h3 className="text-xl font-bold mb-4">Quick Stats</h3>
                    <div className="space-y-6">
                        <div className="flex justify-between items-center border-b border-white/10 pb-4">
                            <span className="text-indigo-100">Daily Progress</span>
                            <span className="font-bold">84%</span>
                        </div>
                        <div className="flex justify-between items-center border-b border-white/10 pb-4">
                            <span className="text-indigo-100">Teams Online</span>
                            <span className="font-bold">12/15</span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="text-indigo-100">Pending Sync</span>
                            <span className="font-bold">142 Plots</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Survey_SurveyDashboard;
