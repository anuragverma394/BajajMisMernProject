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

const n = (v) => { const x = Number(String(v ?? '').replace(/,/g, '')); return isNaN(x) ? 0 : x; };
const fmt = (v) => n(v).toFixed(2);

const COLS = [
  { key: 'SLNO', label: 'SLNO', align: 'text-center' },
  { key: 'U_code', label: 'Code', align: 'text-center' },
  { key: 'U_Name', label: 'Name Of Clerk', align: 'text-left' },
  { key: 'OPBAL', label: 'Open Balance*', align: 'text-right', num: true },
  { key: 'PQTY', label: 'Purchase Qty', align: 'text-right', num: true },
  { key: 'RQTY', label: 'Receipt Qty', align: 'text-right', num: true },
  { key: 'CLBAL', label: 'Closing Balance', align: 'text-right', num: true },
  { key: 'TOTREPT', label: 'Total Receipt', align: 'text-right', num: true },
  { key: 'DRQTY', label: 'Dries Qty', align: 'text-right', num: true },
  { key: 'PERC', label: '%Tage', align: 'text-right', dec: true }
];

const SUM_KEYS = ['OPBAL', 'PQTY', 'RQTY', 'CLBAL', 'TOTREPT', 'DRQTY'];

/* ── Component ───────────────────────────────────────────────────────────── */
const Report_DriageClerkSummary = () => {
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
      const res = await apiClient.get('/report/driage-clerk-summary', {
        params: { F_Code: filters.unit, Date: filters.date }
      });
      const data = res?.data?.data ?? res?.data?.recordsets?.[0] ?? (Array.isArray(res?.data) ? res.data : []);
      if (!Array.isArray(data) || data.length === 0) {
        toast('No data found.', { icon: 'ℹ️' }); setRows([]);
      } else {
        setRows(data); toast.success(`${data.length} rows loaded.`);
      }
    } catch {
      toast.error('Failed to fetch Driage Clerk Summary.');
    } finally { setLoading(false); }
  };

  // Totals
  const totals = useMemo(() => {
    const res = {};
    SUM_KEYS.forEach(k => { res[k] = rows.reduce((a, r) => a + n(r[k]), 0); });
    return res;
  }, [rows]);

  return (
    <div className="min-h-screen bg-gray-50 p-4 font-sans">
      <Toaster position="top-right" />

      {/* Header */}
      <div className="bg-teal-700 text-white px-5 py-3 text-sm font-semibold rounded-t-lg mb-px">
        DRIAGE CLERK SUMMARY
      </div>

      {/* Filter card */}
      <div className="border border-gray-200 rounded-b-lg bg-white shadow-sm mb-4">
        <div className="bg-green-50 text-green-800 px-5 py-2 text-xs font-semibold border-b border-green-200">
          DRIAGE CLERK SUMMARY
        </div>
        <div className="p-5">
          <div className="flex flex-wrap gap-5 mb-5 items-end">
            {/* Factory */}
            <div className="w-60">
              <label className="block text-xs font-semibold text-gray-700 mb-1.5">Factory</label>
              <select
                name="unit"
                value={filters.unit}
                onChange={handleChange}
                className="w-full border border-gray-300 rounded px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-teal-500"
              >
                <option value="">-- Select Factory --</option>
                {units.map((u, i) => (
                  <option key={`${u.code}-${i}`} value={u.code}>{u.name}</option>
                ))}
              </select>
            </div>

            {/* Date */}
            <div className="w-60">
              <label className="block text-xs font-semibold text-gray-700 mb-1.5">Date</label>
              <input
                type="text"
                name="date"
                value={filters.date}
                onChange={handleChange}
                placeholder="DD/MM/YYYY"
                className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex flex-wrap gap-2">
            <button
              onClick={handleSearch}
              disabled={loading}
              className="px-5 py-2 rounded text-sm font-medium text-white bg-teal-600 hover:bg-teal-700 disabled:opacity-60 transition-colors min-w-[80px]"
            >
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

      {/* Data Table */}
      {rows.length > 0 && (
        <div className="overflow-x-auto border border-gray-200 rounded-lg shadow-sm bg-white">
          <table className="w-full text-xs border-collapse">
            <thead>
              <tr>
                {COLS.map(c => (
                  <th
                    key={c.key}
                    className={`px-3 py-2 border border-gray-300 bg-teal-700 text-white font-semibold ${c.align} whitespace-nowrap`}
                  >
                    {c.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row, idx) => (
                <tr key={idx} className={idx % 2 === 0 ? 'bg-white hover:bg-teal-50' : 'bg-gray-50 hover:bg-teal-50'}>
                  {COLS.map(c => (
                    <td key={c.key} className={`px-3 py-2 border-b border-gray-200 ${c.align} whitespace-nowrap`}>
                      {c.dec ? fmt(row[c.key]) : c.num ? n(row[c.key]) : (row[c.key] ?? '')}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>

            {/* Totals footer */}
            <tfoot>
              <tr className="bg-teal-50 font-semibold text-teal-900 border-t-2 border-teal-300">
                <td className="px-3 py-2 text-center">—</td>
                <td className="px-3 py-2 text-center">—</td>
                <td className="px-3 py-2 text-left font-bold">TOTAL</td>
                {SUM_KEYS.map(k => (
                  <td key={k} className="px-3 py-2 text-right">{n(totals[k])}</td>
                ))}
                <td className="px-3 py-2 text-right">—</td>
              </tr>
            </tfoot>
          </table>
        </div>
      )}

      {/* Empty state */}
      {!loading && rows.length === 0 && (
        <div className="border border-gray-200 rounded-lg bg-white min-h-[280px] flex flex-col items-center justify-center text-gray-400">
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

export default Report_DriageClerkSummary;