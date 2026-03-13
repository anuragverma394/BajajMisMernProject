import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast, Toaster } from 'react-hot-toast';
import { masterService } from '../../microservices/api.service';
import { apiClient } from '../../microservices/http.client';

/* ── helpers ────────────────────────────────────────────────────────────── */
const today = () => {
    const d = new Date();
    return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;
};
const normalizeUnit = (u) => ({
    code: String(u?.F_Code || u?.f_Code || u?.id || '').trim(),
    name: String(u?.F_Name || u?.f_Name || u?.name || '').trim()
});
const nv = (v) => { const x = Number(String(v ?? '').replace(/,/g, '')); return isNaN(x) ? 0 : x; };

/* ── Component ───────────────────────────────────────────────────────────── */
const SurveyReport_DailyTeamWiseSurveyProgressReport = () => {
    const navigate = useNavigate();
    const [units, setUnits] = useState([]);
    const [loading, setLoading] = useState(false);
    const [rows, setRows] = useState([]);
    const [filters, setFilters] = useState({ unit: '', date: today() });

    useEffect(() => {
        masterService.getUnits()
            .then(d => setUnits(Array.isArray(d) ? d.map(normalizeUnit).filter(u => u.code) : []))
            .catch(() => { });
    }, []);

    const handleChange = e => setFilters(prev => ({ ...prev, [e.target.name]: e.target.value }));

    const handleSearch = async () => {
        if (!filters.unit) { toast.error('Please select a Factory'); return; }
        if (!filters.date) { toast.error('Please enter a Date'); return; }
        setLoading(true);
        try {
            const res = await apiClient.get('/survey-report/daily-team-wise-survey-progress-report', {
                params: { F_Code: filters.unit, Date: filters.date }
            });
            const data = res?.data?.data ?? res?.data?.recordsets?.[0] ?? (Array.isArray(res?.data) ? res.data : []);
            if (!Array.isArray(data) || data.length === 0) {
                toast('No data found.', { icon: 'ℹ️' }); setRows([]);
            } else {
                setRows(data); toast.success(`${data.length} rows loaded.`);
            }
        } catch {
            toast.error('Failed to fetch report data.');
        } finally { setLoading(false); }
    };

    // Totals per column for footer
    const totals = useMemo(() => {
        const sum = k => rows.reduce((a, r) => a + nv(r[k]), 0);
        return {
            NoofPlotOnDate: sum('NoofPlotOnDate'),
            NoofPlotToDate: sum('NoofPlotToDate'),
            OnDateArea: sum('OnDateArea').toFixed(3),
            ToDateArea: sum('ToDateArea').toFixed(3),
            SurveyAvgOnDate: sum('SurveyAvgOnDate').toFixed(3),
            SurveyAvgToDate: sum('SurveyAvgToDate').toFixed(3)
        };
    }, [rows]);

    const thBase = 'px-2 py-2 border border-gray-300 bg-teal-700 text-white font-semibold text-center whitespace-nowrap text-xs';
    const tdBase = 'px-2 py-1.5 border-b border-gray-200 text-xs whitespace-nowrap';

    return (
        <div className="min-h-screen bg-gray-50 p-4 font-sans">
            <Toaster position="top-right" />

            {/* Header */}
            <div className="bg-teal-700 text-white px-5 py-3 text-sm font-semibold rounded-t-lg mb-px">
                Daily Survey Progress Report
            </div>

            {/* Filter card */}
            <div className="border border-gray-200 rounded-b-lg bg-white shadow-sm mb-4">
                <div className="bg-green-50 text-green-800 px-5 py-2 text-xs font-semibold border-b border-green-200">
                    Daily Survey Progress Report
                </div>
                <div className="p-5">
                    <div className="flex flex-wrap gap-5 mb-5 items-end">
                        <div className="w-64">
                            <label className="block text-xs font-semibold text-gray-700 mb-1.5">Factory</label>
                            <select name="unit" value={filters.unit} onChange={handleChange}
                                className="w-full border border-gray-300 rounded px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-teal-500">
                                <option value="">-- Select Factory --</option>
                                {units.map((u, i) => <option key={`${u.code}-${i}`} value={u.code}>{u.name}</option>)}
                            </select>
                        </div>
                        <div className="w-52">
                            <label className="block text-xs font-semibold text-gray-700 mb-1.5">Date</label>
                            <input type="text" name="date" value={filters.date} onChange={handleChange}
                                placeholder="DD/MM/YYYY"
                                className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500" />
                        </div>
                    </div>

                    <div className="flex flex-wrap gap-2">
                        <button onClick={handleSearch} disabled={loading}
                            className="px-5 py-2 rounded text-sm font-medium text-white bg-teal-600 hover:bg-teal-700 disabled:opacity-60 transition-colors min-w-[80px]">
                            {loading ? (
                                <span className="flex items-center gap-1">
                                    <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                                    </svg>...
                                </span>
                            ) : 'Search'}
                        </button>
                        <button onClick={() => toast('Excel export coming soon.', { icon: '📊' })} className="px-5 py-2 rounded text-sm font-medium text-white bg-teal-600 hover:bg-teal-700 transition-colors">Excel</button>
                        <button onClick={() => window.print()} className="px-5 py-2 rounded text-sm font-medium text-white bg-teal-600 hover:bg-teal-700 transition-colors">Print</button>
                        <button onClick={() => navigate(-1)} className="px-5 py-2 rounded text-sm font-medium text-white bg-teal-600 hover:bg-teal-700 transition-colors">Exit</button>
                    </div>
                </div>
            </div>

            {/* Data table */}
            {rows.length > 0 && (
                <div className="overflow-x-auto border border-gray-200 rounded-lg shadow-sm bg-white">
                    <table className="w-full text-xs border-collapse">
                        <thead>
                            {/* Row 1 – grouped headers */}
                            <tr>
                                <th className={`${thBase} align-bottom`} rowSpan={2}>S.No</th>
                                <th className={`${thBase} align-bottom`} rowSpan={2}>Zone Incharge</th>
                                <th className={`${thBase} align-bottom`} rowSpan={2}>Block Incharge</th>
                                <th className={`${thBase} align-bottom`} rowSpan={2}>Block</th>
                                <th className={`${thBase} align-bottom`} rowSpan={2}>Surveyor</th>
                                <th className={`${thBase} align-bottom text-teal-200`} rowSpan={2}>Time Of<br />Survey Start</th>
                                <th className={`${thBase} align-bottom text-teal-200`} rowSpan={2}>Time Of<br />Survey Closed</th>
                                <th className={`${thBase}`} colSpan={2}>No. Of Plot Surveyed</th>
                                <th className={`${thBase}`} colSpan={2}>Survey Area (Hect)</th>
                                <th className={`${thBase}`} colSpan={2}>Survey Avg (In Hect)</th>
                                <th className={`${thBase}`} colSpan={2}>% Of Survey On Non-Member</th>
                            </tr>
                            {/* Row 2 – ONDATE / TODATE sub-headers */}
                            <tr>
                                {['No. Of Plot Surveyed', 'Survey Area (Hect)', 'Survey Avg (In Hect)', '% Of Survey On Non-Member'].flatMap(() =>
                                    ['ONDATE', 'TODATE'].map((sub, si) => (
                                        <th key={`${sub}-${Math.random()}`} className={`${thBase} text-teal-200`}>{sub}</th>
                                    ))
                                )}
                            </tr>
                        </thead>
                        <tbody>
                            {rows.map((row, idx) => (
                                <tr key={idx} className={idx % 2 === 0 ? 'bg-white hover:bg-teal-50' : 'bg-gray-50 hover:bg-teal-50'}>
                                    <td className={`${tdBase} text-center`}>{row.SNo}</td>
                                    <td className={`${tdBase}`}>{row.ZoneIncharge}</td>
                                    <td className={`${tdBase}`}>{row.BlockIncharge}</td>
                                    <td className={`${tdBase} font-medium text-teal-700`}>{row.Block}</td>
                                    <td className={`${tdBase} text-teal-600`}>{row.Surveyor}</td>
                                    <td className={`${tdBase} text-center`}>{row.StartTime}</td>
                                    <td className={`${tdBase} text-center`}>{row.EndTime}</td>
                                    <td className={`${tdBase} text-right`}>{nv(row.NoofPlotOnDate)}</td>
                                    <td className={`${tdBase} text-right`}>{nv(row.NoofPlotToDate)}</td>
                                    <td className={`${tdBase} text-right`}>{row.OnDateArea}</td>
                                    <td className={`${tdBase} text-right`}>{row.ToDateArea}</td>
                                    <td className={`${tdBase} text-right`}>{row.SurveyAvgOnDate}</td>
                                    <td className={`${tdBase} text-right`}>{row.SurveyAvgToDate}</td>
                                    <td className={`${tdBase} text-right`}>{row.PctNonMemberOnDate}</td>
                                    <td className={`${tdBase} text-right`}>{row.PctNonMemberToDate}</td>
                                </tr>
                            ))}
                        </tbody>
                        <tfoot>
                            <tr className="bg-teal-50 font-semibold text-teal-900 border-t-2 border-teal-300 text-xs">
                                <td colSpan={7} className="px-3 py-2 text-left font-bold">TOTAL</td>
                                <td className="px-2 py-2 text-right">{totals.NoofPlotOnDate}</td>
                                <td className="px-2 py-2 text-right">{totals.NoofPlotToDate}</td>
                                <td className="px-2 py-2 text-right">{totals.OnDateArea}</td>
                                <td className="px-2 py-2 text-right">{totals.ToDateArea}</td>
                                <td className="px-2 py-2 text-right">{totals.SurveyAvgOnDate}</td>
                                <td className="px-2 py-2 text-right">{totals.SurveyAvgToDate}</td>
                                <td colSpan={2} className="px-2 py-2 text-center">—</td>
                            </tr>
                        </tfoot>
                    </table>
                </div>
            )}

            {/* Empty state */}
            {!loading && rows.length === 0 && (
                <div className="border border-gray-200 rounded-lg bg-white min-h-[250px] flex flex-col items-center justify-center text-gray-400">
                    <svg className="h-12 w-12 mb-3 opacity-40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                            d="M9 17v-2a4 4 0 014-4h0a4 4 0 014 4v2M3 17v-2a4 4 0 014-4h0" />
                    </svg>
                    <p className="text-sm">Select a factory and date, then click <strong>Search</strong>.</p>
                </div>
            )}
        </div>
    );
};

export default SurveyReport_DailyTeamWiseSurveyProgressReport;