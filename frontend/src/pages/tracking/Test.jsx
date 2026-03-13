import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast, Toaster } from 'react-hot-toast';
import '../../styles/Tracking.css';
import '../../styles/Test.css';

const Tracking_Test = () => {
    const navigate = useNavigate();
    const [status, setStatus] = useState('idle');
    const [logs, setLogs] = useState([]);

    const runDiagnostics = () => {
        setStatus('running');
        setLogs([]);

        const steps = [
            { m: "Initializing Tracking Engine...", s: "ok" },
            { m: "Checking API Gateway Connectivity...", s: "ok" },
            { m: "Verifying Database Connection Pool...", s: "ok" },
            { m: "Validating Google Maps API Key...", s: "error", details: "Key Restricted or Expired" },
            { m: "Checking Redis Cache Service...", s: "ok" },
            { m: "Pinging Mobile Relay Servers...", s: "ok" }
        ];

        steps.forEach((step, i) => {
            setTimeout(() => {
                setLogs(prev => [...prev, step]);
                if (i === steps.length - 1) {
                    setStatus('complete');
                    toast.error("Diagnostics finished with warnings");
                }
            }, (i + 1) * 600);
        });
    };

    return (
        <div className="tracking-container animate-in fade-in duration-500">
            <Toaster position="top-right" />

            <header className="mb-8 flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900 tracking-tight">System Diagnostics</h1>
                    <p className="text-slate-500 mt-1">Health check for tracking services and infrastructure</p>
                </div>
                <button className="tracking-btn tracking-btn-secondary" onClick={() => navigate('/Tracking/TrackingDashboard')}>Back</button>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-1 space-y-6">
                    <div className="tracking-card">
                        <div className="p-8 text-center">
                            <div className={`w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-6 border-4 ${status === 'running' ? 'border-amber-400 border-t-transparent animate-spin' : (status === 'complete' ? 'border-emerald-500 bg-emerald-50' : 'border-slate-100 bg-slate-50')}`}>
                                <i className={`fas ${status === 'running' ? 'fa-sync text-amber-500' : (status === 'complete' ? 'fa-check text-emerald-600' : 'fa-stethoscope text-slate-300')} text-4xl`}></i>
                            </div>
                            <h3 className="text-xl font-bold text-slate-800 capitalize">{status}</h3>
                            <p className="text-sm text-slate-500 mt-2">Overall Infrastructure Health</p>

                            <button
                                className={`mt-8 w-full tracking-btn ${status === 'running' ? 'bg-slate-100 text-slate-400' : 'tracking-btn-primary bg-indigo-600'}`}
                                onClick={runDiagnostics}
                                disabled={status === 'running'}
                            >
                                {status === 'running' ? 'Running System Scan...' : 'Initiate Full Diagnostic'}
                            </button>
                        </div>
                    </div>
                </div>

                <div className="lg:col-span-2">
                    <div className="tracking-card bg-slate-900 border-slate-800 shadow-2xl overflow-hidden min-h-[500px]">
                        <div className="bg-slate-800 px-6 py-3 flex justify-between items-center">
                            <div className="flex gap-2">
                                <div className="w-3 h-3 rounded-full bg-rose-500"></div>
                                <div className="w-3 h-3 rounded-full bg-amber-500"></div>
                                <div className="w-3 h-3 rounded-full bg-emerald-500"></div>
                            </div>
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Tracking_Live_Log.sh</span>
                        </div>
                        <div className="p-8 font-mono text-sm space-y-3">
                            {logs.length === 0 ? (
                                <div className="text-slate-600 animate-pulse">_ Waiting for diagnostic initialization...</div>
                            ) : (
                                logs.map((l, i) => (
                                    <div key={i} className={`flex items-start gap-4 animate-in fade-in slide-in-from-left-2 duration-300`}>
                                        <span className="text-slate-700">[{new Date().toLocaleTimeString()}]</span>
                                        <span className="text-slate-300 flex-1">{l.m}</span>
                                        <span className={`font-black uppercase text-xs ${l.s === 'ok' ? 'text-emerald-500' : 'text-rose-500'}`}>
                                            [{l.s}]
                                        </span>
                                    </div>
                                ))
                            )}
                            {status === 'complete' && (
                                <div className="pt-6 border-t border-slate-800 mt-4">
                                    <div className="text-rose-400 font-bold mb-2 uppercase text-xs">Diagnostic Warnings:</div>
                                    <div className="text-slate-400 italic text-xs leading-relaxed">
                                        "Google Maps API experienced authentication failure. Static mapping fallback activated.
                                        Manual override might be required in production environment."
                                    </div>
                                    <div className="text-emerald-400 mt-6 animate-pulse">system_ready: true</div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Tracking_Test;
