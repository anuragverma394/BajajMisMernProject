import React, { useState, useEffect } from 'react';
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


    const thBase = 'px-2 py-2 border border-[#8fbfa4] bg-[#dff0d8] text-[#1b3b2f] font-semibold text-center whitespace-nowrap text-xs';
    const tdBase = 'px-2 py-1.5 border-b border-[#c7d9c5] text-xs whitespace-nowrap';
    const tableId = 'daily-team-wise-survey-progress-report-table';
    const getBlockName = (row) => row.Block ?? row.BlockName ?? row.BLK_NAME ?? row.Zone ?? row.bl_Name ?? '';
    const getPerToDate = (row) =>
        row.PerToDate ?? row.Per_ToDate ?? row.NonMemberToDate ?? row.NonMemToDate ?? row.PercentageToDate ?? 0;

    return (
        <div className="min-h-screen bg-gray-50 p-4 font-sans">
            <Toaster position="top-right" />

            {/* Header */}
            <div className="bg-[#129a81] text-white px-5 py-3 text-sm font-semibold rounded-t-lg mb-px">
                Daily Survey Progress Report
            </div>

            {/* Filter card */}
            <div className="border border-gray-200 rounded-b-lg bg-white shadow-sm mb-4">
                <div className="bg-[#dff0d8] text-[#1b3b2f] px-5 py-2 text-xs font-semibold border-b border-[#c7d9c5]">
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
                            className="px-5 py-2 rounded text-sm font-medium text-white bg-[#129a81] hover:bg-[#0f7f68] disabled:opacity-60 transition-colors min-w-[80px]">
                            {loading ? (
                                <span className="flex items-center gap-1">
                                    <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                                    </svg>...
                                </span>
                            ) : 'Search'}
                        </button>
                        <button className="px-5 py-2 rounded text-sm font-medium text-white bg-[#129a81] hover:bg-[#0f7f68] transition-colors">Excel</button>
                        <button onClick={() => window.print()} className="px-5 py-2 rounded text-sm font-medium text-white bg-[#129a81] hover:bg-[#0f7f68] transition-colors">Print</button>
                        <button onClick={() => navigate(-1)} className="px-5 py-2 rounded text-sm font-medium text-white bg-[#129a81] hover:bg-[#0f7f68] transition-colors">Exit</button>
                    </div>
                </div>
            </div>

            {/* Data table */}
            {rows.length > 0 && (
                <div className="overflow-x-auto border border-gray-200 rounded-lg shadow-sm bg-white">
                    <table id={tableId} className="w-full text-xs border-collapse">
                        <thead>
                            {/* Row 1 – grouped headers */}
                            <tr>
                                <th className={`${thBase} align-bottom`} rowSpan={2}>S.No</th>
                                <th className={`${thBase} align-bottom`} rowSpan={2}>Zone Incharge</th>
                                <th className={`${thBase} align-bottom`} rowSpan={2}>Block Incharge</th>
                                <th className={`${thBase} align-bottom`} rowSpan={2}>Block</th>
                                <th className={`${thBase} align-bottom`} rowSpan={2}>Surveyor</th>
                                <th className={`${thBase} align-bottom`} rowSpan={2}>Time Of<br />Survey Start</th>
                                <th className={`${thBase} align-bottom`} rowSpan={2}>Time Of<br />Survey Closed</th>
                                <th className={`${thBase}`} colSpan={2}>No. Of Plot Surveyed</th>
                                <th className={`${thBase}`} colSpan={2}>Survey Area (Hect)</th>
                                <th className={`${thBase}`} colSpan={2}>Survey Avg (In Hect)</th>
                                <th className={`${thBase}`} colSpan={2}>% Of Survey On Non-Member</th>
                            </tr>
                            {/* Row 2 – ONDATE / TODATE sub-headers */}
                            <tr>
                                {['No. Of Plot Surveyed', 'Survey Area (Hect)', 'Survey Avg (In Hect)', '% Of Survey On Non-Member'].flatMap(() =>
                                    ['ONDATE', 'TODATE'].map((sub, si) => (
                                        <th key={`${sub}-${Math.random()}`} className={`${thBase}`}>{sub}</th>
                                    ))
                                )}
                            </tr>
                        </thead>
                        <tbody>
                            {rows.map((row, idx) => {
                                const isTotal = String(row?.Surveyor || '').toLowerCase().includes('total');
                                const rowClass = isTotal
                                    ? 'bg-[#dff0d8] font-semibold'
                                    : idx % 2 === 0
                                        ? 'bg-white hover:bg-[#eef7f0]'
                                        : 'bg-[#f7fbf8] hover:bg-[#eef7f0]';
                                return (
                                    <tr key={idx} className={rowClass}>
                                    <td className={`${tdBase} text-center`}>{row.SN}</td>
                                    <td className={`${tdBase}`}>{row.Manager}</td>
                                    <td className={`${tdBase}`}>{row.Blockincharge}</td>
                                    <td className={`${tdBase} font-medium text-[#0b5f4e]`}>{getBlockName(row)}</td>
                                    <td className={`${tdBase} text-[#0b5f4e]`}>{row.Surveyor}</td>
                                    <td className={`${tdBase} text-center`}>{row.StartSurvey}</td>
                                    <td className={`${tdBase} text-center`}>{row.EndSurvey}</td>
                                    <td className={`${tdBase} text-right`}>{nv(row.NoPlotOnDate)}</td>
                                    <td className={`${tdBase} text-right`}>{nv(row.NoPlotToDate)}</td>
                                    <td className={`${tdBase} text-right`}>{row.AreaOnDate}</td>
                                    <td className={`${tdBase} text-right`}>{row.AreaToDate}</td>
                                    <td className={`${tdBase} text-right`}>{row.AvgOnDate}</td>
                                    <td className={`${tdBase} text-right`}>{row.AvgToDate}</td>
                                    <td className={`${tdBase} text-right`}>{row.PerOnDate}</td>
                                    <td className={`${tdBase} text-right`}>{getPerToDate(row)}</td>
                                    </tr>
                                );
                            })}
                        </tbody>
                        <tfoot />
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
