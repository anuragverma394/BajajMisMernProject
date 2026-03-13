import React from 'react';
import { Link } from 'react-router-dom';
import '../../styles/Index.css';

const MainHome = () => {
    const mainModules = [
        { name: 'Group Mode Configuration', path: '/Main/AddModeGroupView', icon: 'fa-layer-group', desc: 'Manage factory transport modes and groups' },
        { name: 'Season Configuration', path: '/Main/AddSeasonView', icon: 'fa-calendar-alt', desc: 'Set up season periods, shifts, and change times' },
        { name: 'Stoppage Entry', path: '/Main/AddStopageView', icon: 'fa-hammer', desc: 'Track plant operational status and maintenance stops' },
        { name: 'Daily Rainfall Log', path: '/Main/DailyRainfallview', icon: 'fa-cloud-showers-heavy', desc: 'Record daily rainfall metrics compared to previous years' },
        { name: 'Monthly Entry Report', path: '/Main/MonthlyEntryReportView', icon: 'fa-file-invoice-dollar', desc: 'Track cumulative monthly performance parameter values' },
        { name: 'Target Entry Set Up', path: '/Main/TargetEntry', icon: 'fa-bullseye', desc: 'Define village and officer wise targets effectively' },
        { name: 'Distillery Daily Log', path: '/Main/distilleryReportEntryView', icon: 'fa-industry', desc: 'Track comprehensive RS, AA & ENA production with capacities' },
        { name: 'Sugar Daily Cane Report', path: '/Main/SugarWhatsAppReportView', icon: 'fa-tractor', desc: 'Log crushing, recoveries, losses & balances on daily basis' },
        { name: 'Sugar Cross-Tab Report', path: '/WhatsApp/SugarWhatsAppReportNew', icon: 'fa-chart-pie', desc: 'Analyze WhatsApp reports across complex historical columns' },
    ];

    return (
        <div className="min-h-screen bg-slate-50 p-8 animate-in fade-in duration-500">
            <div className="page-content">

                <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8">
                    <h1 className="text-3xl font-extrabold text-slate-800 tracking-tight flex items-center gap-3">
                        <i className="fas fa-cogs text-indigo-600"></i> Main Module Management
                    </h1>
                    <p className="mt-2 text-slate-500">
                        Select a configuration module to setup baseline operating data for the factory.
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6">
                    {mainModules.map((module, idx) => (
                        <Link
                            key={idx}
                            to={module.path}
                            className="group bg-white rounded-2xl p-6 shadow-sm border border-slate-100 hover:shadow-md hover:border-indigo-200 hover:-translate-y-1 transition-all duration-300 flex items-start gap-5"
                        >
                            <div className="w-14 h-14 rounded-xl bg-indigo-50 text-indigo-600 flex justify-center items-center flex-shrink-0 group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                                <i className={`fas ${module.icon} text-2xl`}></i>
                            </div>
                            <div>
                                <h3 className="text-xl font-semibold text-slate-800 group-hover:text-indigo-700 transition-colors">
                                    {module.name}
                                </h3>
                                <p className="text-sm text-slate-500 mt-1 line-clamp-2">
                                    {module.desc}
                                </p>
                                <p className="text-xs font-bold text-indigo-500 mt-3 flex items-center gap-1 group-hover:gap-2 transition-all">
                                    Open Module <i className="fas fa-arrow-right"></i>
                                </p>
                            </div>
                        </Link>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default MainHome;
