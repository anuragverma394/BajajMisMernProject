import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast, Toaster } from 'react-hot-toast';
import { surveyService, masterService } from '../../microservices/api.service';
import '../../styles/SurveyReports.css';

const SurveyReport_SurveyUnitWiseSurveyStatus = () => {
    const navigate = useNavigate();
    const [factories, setFactories] = useState([]);
    const [loading, setLoading] = useState(false);
    const [reportData, setReportData] = useState([]);
    const [filters, setFilters] = useState({
        F_code: '',
        CaneType: '1'
    });

    useEffect(() => {
        const loadUnits = async () => {
            try {
                const units = await masterService.getUnits();
                setFactories(units);
                if (units.length > 0) {
                    setFilters(prev => ({ ...prev, F_code: units[0].F_Code || units[0].id }));
                }
            } catch (error) {
                toast.error("Telemetry link failure: Station registry unreachable");
            }
        };
        loadUnits();
    }, []);

    const handleSearch = async (e) => {
        if (e) e.preventDefault();
        if (!filters.F_code) {
            toast.error("Command node identification required");
            return;
        }

        setLoading(true);
        try {
            const response = await surveyService.getSurveyUnitWiseStatus(filters);
            setReportData(response.data || response || []);
            toast.success("Progress Matrix synchronized");
        } catch (error) {
            toast.error("Synthetic analytical failure: Progress mapping aborted");
            setReportData([]);
        } finally {
            setLoading(false);
        }
    };

    const handlePrint = () => {
        const content = document.getElementById('survey-report-print');
        const win = window.open('', '', 'height=800,width=1400');
        win.document.write('<html><head><title>Projected Progress Matrix</title>');
        win.document.write('<style>table { width: 100%; border-collapse: collapse; font-family: sans-serif; font-size: 10px; } th, td { border: 1px solid #e2e8f0; padding: 10px; text-align: center; } th { background: #f8fafc; color: #1e293b; font-weight: 800; text-transform: uppercase; } .text-left { text-align: left; } .font-black { font-weight: 900; } .bg-slate { background: #f1f5f9; } .bg-emerald { background: #ecfdf5; } .bg-blue { background: #eff6ff; } .bg-amber { background: #fffbeb; } .bg-rose { background: #fff1f2; }</style>');
        win.document.write('</head><body>');
        win.document.write('<div style="text-align:center; padding: 30px;">');
        win.document.write('<h1 style="margin:0; color:#0f172a; text-transform:uppercase;">Bajaj Sugar - Projected Progress Matrix</h1>');
        win.document.write(`<p style="color:#64748b;">Node: ${filters.F_code} | Protocol: ${filters.CaneType === '1' ? 'Primary' : 'Portal'}</p>`);
        win.document.write('</div>');
        win.document.write(content.innerHTML);
        win.document.write('</body></html>');
        win.document.close();
        win.print();
    };

    const handleExport = () => {
        if (reportData.length === 0) return;
        const csvContent = "data:text/csv;charset=utf-8,"
            + Object.keys(reportData[0]).join(",") + "\n"
            + reportData.map(row => Object.values(row).join(",")).join("\n");
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", `ProgressMatrix_${new Date().toLocaleDateString()}.csv`);
        document.body.appendChild(link);
        link.click();
        toast.success("Progress Matrix exported to CSV");
    };

    return (
        <div className="report-container-premium animate-in fade-in duration-700 bg-slate-50 min-h-screen p-8">
            <Toaster position="top-right" />

            <header className="report-header-premium mb-10 bg-gradient-to-br from-indigo-950 via-slate-900 to-indigo-900 p-10 rounded-[3rem] shadow-2xl flex flex-col md:flex-row justify-between items-center gap-8 border border-white/10 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 rounded-full -mr-32 -mt-32 blur-3xl"></div>
                <div className="flex items-center gap-8 relative z-10">
                    <div className="w-20 h-20 bg-indigo-500 rounded-[2rem] flex items-center justify-center shadow-2xl shadow-indigo-500/40 rotate-3 group hover:rotate-6 transition-all duration-500">
                        <i className="fas fa-chart-line text-white text-4xl"></i>
                    </div>
                    <div>
                        <h1 className="text-3xl font-black text-white tracking-tighter uppercase">Progress Matrix</h1>
                        <p className="text-indigo-400 font-black text-[11px] uppercase tracking-[0.3em] mt-2 flex items-center gap-2">
                            <span className="w-2 h-2 bg-indigo-500 rounded-full animate-pulse"></span>
                            Unit-Wise Survey Status & Operational Velocity
                        </p>
                    </div>
                </div>

                <div className="flex gap-4 relative z-10">
                    <button onClick={() => navigate('/dashboard')} className="px-6 py-3 bg-white/10 hover:bg-white/20 text-white rounded-2xl font-black text-[11px] uppercase tracking-widest transition-all border border-white/5 backdrop-blur-md">
                        <i className="fas fa-th mr-3"> Home</i>
                    </button>
                    {reportData.length > 0 && (
                        <button onClick={handleExport} className="px-6 py-3 bg-indigo-500 hover:bg-indigo-600 text-white rounded-2xl font-black text-[11px] uppercase tracking-widest shadow-xl shadow-indigo-500/20 transition-all active:scale-95">
                            <i className="fas fa-file-excel mr-3"> Export</i>
                        </button>
                    )}
                </div>
            </header>

            <div className="filter-card-premium mb-12 bg-white/80 backdrop-blur-xl p-12 rounded-[4rem] shadow-2xl border border-white relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-50 rounded-full -mr-48 -mt-48 blur-3xl opacity-50 group-hover:bg-indigo-100 transition-all duration-700"></div>

                <form onSubmit={handleSearch} className="grid grid-cols-1 md:grid-cols-3 gap-12 items-end relative z-10">
                    <div className="report-form-group">
                        <label className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-400 mb-4 block ml-1">Area Source Protocol</label>
                        <select
                            className="filter-input w-full bg-slate-100/50 border-slate-200 text-slate-800 font-black h-14 rounded-2xl px-6 focus:bg-white transition-all shadow-inner"
                            value={filters.CaneType}
                            onChange={(e) => setFilters({ ...filters, CaneType: e.target.value })}
                        >
                            <option value="1">Primary Survey Logistics</option>
                            <option value="2">Caneup Portal Flux</option>
                        </select>
                    </div>
                    <div className="report-form-group">
                        <label className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-400 mb-4 block ml-1">Command Node</label>
                        <select
                            className="filter-input w-full bg-slate-100/50 border-slate-200 text-slate-800 font-black h-14 rounded-2xl px-6 focus:bg-white transition-all shadow-inner"
                            value={filters.F_code}
                            onChange={(e) => setFilters({ ...filters, F_code: e.target.value })}
                            required
                        >
                            <option value="">-- Identify Station --</option>
                            {factories.map((f, idx) => <option key={`${f.F_Code || f.id}-${idx}`} value={f.F_Code || f.id}>{f.F_Name || f.name}</option>)}
                        </select>
                    </div>
                    <button type="submit" disabled={loading} className="btn-search-premium bg-slate-900 hover:bg-black text-white font-black uppercase tracking-[0.2em] text-[11px] h-14 rounded-2xl shadow-2xl transition-all hover:-translate-y-1 active:scale-95">
                        {loading ? <i className="fas fa-spin fa-gear mr-3"></i> : <i className="fas fa-sync-alt mr-3"></i>}
                        {loading ? 'Analyzing Vector...' : 'Sync Progress Matrix'}
                    </button>
                </form>
            </div>

            {reportData.length > 0 ? (
                <div className="space-y-12 animate-in slide-in-from-bottom-10 duration-1000" id="survey-report-print">
                    <div className="bg-white rounded-[4rem] shadow-2xl border border-white overflow-hidden relative">
                        <div className="px-10 py-8 border-b border-slate-50 flex justify-between items-center bg-slate-50/50">
                            <h3 className="font-black text-slate-800 uppercase tracking-widest text-[13px]">Operational Velocity Spectrum</h3>
                            <button onClick={handlePrint} className="px-5 py-2 bg-white text-slate-900 hover:bg-slate-100 border border-slate-200 rounded-xl font-black text-[10px] uppercase tracking-widest shadow-sm transition-all active:scale-95">
                                <i className="fas fa-print mr-2"> Hardcopy</i>
                            </button>
                        </div>
                        <div className="table-wrapper-premium overflow-x-auto p-4">
                            <table className="table-premium w-full border-separate border-spacing-0">
                                <thead>
                                    <tr className="bg-slate-900 text-white">
                                        <th className="p-6 text-center text-[10px] font-black uppercase border-r border-slate-800 rounded-tl-[3.5rem]">Idx</th>
                                        <th className="p-6 text-left text-[10px] font-black uppercase border-r border-slate-800">Station</th>
                                        <th className="p-6 text-center text-[10px] font-black uppercase border-r border-slate-800">Initiation</th>
                                        <th className="p-6 text-center text-[10px] font-black uppercase border-r border-slate-800">Cluster</th>
                                        <th className="p-3 text-center text-[10px] font-black uppercase border-r border-slate-800 bg-emerald-900 text-emerald-300 italic">Validated</th>
                                        <th className="p-3 text-center text-[10px] font-black uppercase border-r border-slate-800 bg-blue-900 text-blue-300 italic">RFA Stream</th>
                                        <th className="p-3 text-center text-[10px] font-black uppercase border-r border-slate-800 bg-amber-900 text-amber-300 italic">UP Stream</th>
                                        <th className="p-3 text-center text-[10px] font-black uppercase border-r border-slate-800 bg-slate-800 text-white italic">Aggregate</th>
                                        <th className="p-6 text-center text-[10px] font-black uppercase rounded-tr-[3.5rem] bg-rose-900 text-rose-300 italic">Latent</th>
                                    </tr>
                                    <tr className="bg-slate-900/90 text-[8px] font-black text-slate-500 uppercase">
                                        <th colSpan="4"></th>
                                        <th className="p-2 border-r border-slate-800 text-emerald-500">Vill | Area</th>
                                        <th className="p-2 border-r border-slate-800 text-blue-500">Vill | Area</th>
                                        <th className="p-2 border-r border-slate-800 text-amber-500">Vill | Area</th>
                                        <th className="p-2 border-r border-slate-800 text-white">Vill | Area</th>
                                        <th className="p-2 text-rose-500 text-center">Villages</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {reportData.map((row, idx) => {
                                        const isTotal = row.Factory === 'Total';
                                        return (
                                            <tr key={idx} className={`${isTotal ? 'bg-slate-900 text-white font-black uppercase shadow-2xl' : 'hover:bg-indigo-50/50 border-b border-slate-50 group transition-all'}`}>
                                                <td className="p-4 text-center mono text-[10px] text-slate-300 border-r border-slate-50">{row.SN}</td>
                                                <td className="p-4 text-left border-r border-slate-50 font-black text-slate-800 tracking-tighter italic">{row.Factory}</td>
                                                <td className="p-4 text-center border-r border-slate-50 mono text-[10px] text-slate-400">{row.SurStartDate}</td>
                                                <td className="p-4 text-center border-r border-slate-50 mono text-[11px] font-black text-slate-600 bg-slate-50/50 italic">{row.TVillage}</td>

                                                <td className="p-4 text-center border-r border-slate-50 bg-emerald-50/30">
                                                    <div className="flex flex-col">
                                                        <span className="text-emerald-600 font-black text-[11px]">{row.VillageCNo}</span>
                                                        <span className="text-[9px] text-emerald-700/60 mono">{row.VillageCArea} ha</span>
                                                    </div>
                                                </td>
                                                <td className="p-4 text-center border-r border-slate-50 bg-blue-50/30">
                                                    <div className="flex flex-col">
                                                        <span className="text-blue-600 font-black text-[11px]">{row.VillageRFANo}</span>
                                                        <span className="text-[9px] text-blue-700/60 mono">{row.VillageRFAArea} ha</span>
                                                    </div>
                                                </td>
                                                <td className="p-4 text-center border-r border-slate-50 bg-amber-50/30">
                                                    <div className="flex flex-col">
                                                        <span className="text-amber-600 font-black text-[11px]">{row.VillageUPNo}</span>
                                                        <span className="text-[9px] text-amber-700/60 mono">{row.VillageUPArea} ha</span>
                                                    </div>
                                                </td>
                                                <td className="p-4 text-center border-r border-slate-50 bg-slate-100/50">
                                                    <div className="flex flex-col">
                                                        <span className="text-slate-900 font-black text-[12px]">{row.TotalSNo}</span>
                                                        <span className="text-[9px] text-slate-500 mono">{row.TotalSArea} ha</span>
                                                    </div>
                                                </td>
                                                <td className="p-4 text-center bg-rose-50/50">
                                                    <span className="text-rose-600 font-black text-[13px] tracking-tighter">{row.BalVillage}</span>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            ) : !loading && (
                <div className="py-40 flex flex-col items-center justify-center bg-white rounded-[4rem] shadow-2xl border border-white relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-slate-50 rounded-full -mr-32 -mt-32 blur-3xl opacity-50"></div>
                    <div className="w-40 h-40 bg-indigo-50 rounded-full flex items-center justify-center mb-10 shadow-inner group hover:scale-110 transition-all duration-700">
                        <i className="fas fa-chart-line text-indigo-200 group-hover:text-indigo-500 text-6xl transition-colors"></i>
                    </div>
                    <h3 className="text-2xl font-black text-slate-800 tracking-tight italic uppercase">Progress Matrix Latent</h3>
                    <p className="text-slate-400 text-center max-w-sm mt-4 font-bold uppercase tracking-widest text-[9px] leading-loose">
                        Synchronize command node and area source protocol to reveal the station-wise operational velocity and multidimensional survey completion heuristics.
                    </p>
                </div>
            )}
        </div>
    );
};

export default SurveyReport_SurveyUnitWiseSurveyStatus;



