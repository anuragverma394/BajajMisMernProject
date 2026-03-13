import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast, Toaster } from 'react-hot-toast';
import { masterService, reportService } from '../../microservices/api.service';

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
const fmt = (v, dec = 2) => { const x = n(v); return x === 0 ? '0.00' : x.toFixed(dec); };
const pick = (row, keys, fb = 0) => {
  for (const k of keys) {
    if (row[k] !== undefined && row[k] !== null && row[k] !== '') return row[k];
  }
  return fb;
};

/* ── Column definitions ─────────────────────────────────────────────────── */
// group: { label, span, cols: [{label, key, dec?}] }
const GROUPS = [
  {
    label: 'Early', span: 5, bg: 'bg-teal-700', cols: [
      { label: 'Indent Qty(Qtls)', key: 'ERINDQTY' },
      { label: 'Indent Weighted Qty(Qtls)', key: 'EINDWT' },
      { label: 'Actual Weighted Qty(Qtls)', key: 'EACTWT' },
      { label: 'Failure % Interms Of Purchy', key: 'EPURCHYPERC', dec: true },
      { label: 'Failure % Interms Of Actual Weight(Qtls)', key: 'EWTPERC', dec: true }
    ]
  },
  {
    label: 'Other Than Early', span: 5, bg: 'bg-teal-600', cols: [
      { label: 'Indent Qty(Qtls)', key: 'OTINDQTY' },
      { label: 'Indent Weighted Qty(Qtls)', key: 'OTINDWT' },
      { label: 'Actual Weighted Qty(Qtls)', key: 'OTACTWT' },
      { label: 'Failure % Interms Of Purchy', key: 'OTPURCHYPERC', dec: true },
      { label: 'Failure % Interms Of Actual Weight(Qtls)', key: 'OTWTPERC', dec: true }
    ]
  },
  {
    label: 'Total', span: 5, bg: 'bg-teal-700', cols: [
      { label: 'Indent Qty(Qtls)', key: 'TOTINDQTY' },
      { label: 'Indent Weighted Qty(Qtls)', key: 'TOTINDWT' },
      { label: 'Actual Weighted Qty(Qtls)', key: 'TOTACTWT' },
      { label: 'Failure % Interms Of Purchy', key: 'TOTPURCHYPERC', dec: true },
      { label: 'Failure % Interms Of Actual Weight(Qtls)', key: 'TOTWTPERC', dec: true }
    ]
  },
  {
    label: 'Balance Indent', span: 3, bg: 'bg-teal-600', cols: [
      { label: 'Today Balance Indent Qty(Qtls)', key: 'BALTOTINDQTY' },
      { label: 'Pipeline Balance 2 Days Back(Qts)', key: 'PIPBALIND' },
      { label: 'Total Balance Indent Qty(Qts)', key: 'TOTBALIND' }
    ]
  }
];

/* ── Component ───────────────────────────────────────────────────────────── */
const Report_IndentFailSummary = () => {
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

  const navigate1Day = (dir) => {
    const [dd, mm, yyyy] = filters.date.split('/').map(Number);
    const d = new Date(yyyy, mm - 1, dd);
    d.setDate(d.getDate() + dir);
    setFilters(prev => ({
      ...prev,
      date: `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`
    }));
  };

  const handleSearch = async () => {
    if (!filters.unit) { toast.error('Please select a Factory'); return; }
    if (!filters.date) { toast.error('Please enter a Date'); return; }
    setLoading(true);
    try {
      const res = await reportService.getIndentFailSummary({
        F_Code: filters.unit,
        Date: filters.date
      });
      const data = res?.data ?? res?.recordsets?.[0] ?? (Array.isArray(res) ? res : []);
      if (!Array.isArray(data) || data.length === 0) {
        toast('No data found for selected filters.', { icon: 'ℹ️' });
        setRows([]);
      } else {
        setRows(data);
        toast.success(`${data.length} rows loaded.`);
      }
    } catch {
      toast.error('Failed to fetch Indent Failure Summary.');
    } finally {
      setLoading(false);
    }
  };

  // Totals row
  const totals = useMemo(() => {
    const sum = (key) => rows.reduce((a, r) => a + n(pick(r, [key])), 0);
    const result = {};
    GROUPS.forEach(g => g.cols.forEach(c => { result[c.key] = sum(c.key); }));
    return result;
  }, [rows]);

  const allCols = GROUPS.flatMap(g => g.cols);

  return (
    <div className="min-h-screen bg-gray-50 p-4 font-sans">
      <Toaster position="top-right" />

      {/* ── Page header ── */}
      <div className="bg-teal-700 text-white px-5 py-3 text-sm font-semibold rounded-t-lg mb-px">
        INDENT FAILURE SUMMARY
      </div>

      {/* ── Sub-header + filters card ── */}
      <div className="border border-gray-200 rounded-b-lg bg-white shadow-sm mb-4">
        <div className="bg-green-50 text-green-800 px-5 py-2 text-xs font-semibold border-b border-green-200">
          INDENT FAILURE SUMMARY
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

            {/* Date + nav */}
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

            {/* Prev / Next day navigation */}
            <div className="flex gap-1">
              <button
                onClick={() => navigate1Day(-1)}
                className="w-9 h-9 rounded bg-teal-600 text-white text-base font-bold hover:bg-teal-700 transition-colors"
                title="Previous Day"
              >&lt;</button>
              <button
                onClick={() => navigate1Day(1)}
                className="w-9 h-9 rounded bg-teal-600 text-white text-base font-bold hover:bg-teal-700 transition-colors"
                title="Next Day"
              >&gt;</button>
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
            <button onClick={() => window.print()} className="px-5 py-2 rounded text-sm font-medium text-white bg-teal-600 hover:bg-teal-700 transition-colors">Print</button>
            <button onClick={() => toast('Excel export coming soon.', { icon: '📊' })} className="px-5 py-2 rounded text-sm font-medium text-white bg-teal-600 hover:bg-teal-700 transition-colors">Excel</button>
            <button onClick={() => navigate(-1)} className="px-5 py-2 rounded text-sm font-medium text-white bg-teal-600 hover:bg-teal-700 transition-colors">Exit</button>
          </div>
        </div>
      </div>

      {/* ── Multi-level header data table ── */}
      {rows.length > 0 && (
        <div className="overflow-x-auto border border-gray-200 rounded-lg shadow-sm bg-white">
          <table className="text-xs border-collapse" style={{ minWidth: '1600px' }}>
            <thead>
              {/* Row 1: group labels */}
              <tr>
                <th className="px-3 py-2 border border-gray-300 bg-teal-800 text-white text-center whitespace-nowrap" rowSpan={2}>
                  Date
                </th>
                {GROUPS.map(g => (
                  <th
                    key={g.label}
                    colSpan={g.span}
                    className={`px-3 py-2 border border-gray-300 ${g.bg} text-white text-center font-semibold`}
                  >
                    {g.label}
                  </th>
                ))}
              </tr>
              {/* Row 2: sub-column labels */}
              <tr>
                {GROUPS.flatMap(g =>
                  g.cols.map(c => (
                    <th
                      key={`${g.label}-${c.key}`}
                      className="px-2 py-2 border border-gray-300 bg-green-50 text-gray-700 font-semibold text-center"
                      style={{ minWidth: '110px' }}
                    >
                      {c.label}
                    </th>
                  ))
                )}
              </tr>
            </thead>
            <tbody>
              {rows.map((row, idx) => (
                <tr key={idx} className={idx % 2 === 0 ? 'bg-white hover:bg-teal-50' : 'bg-gray-50 hover:bg-teal-50'}>
                  <td className="px-3 py-2 border-b border-gray-200 text-center whitespace-nowrap font-medium text-gray-700">
                    {row.IS_IS_DT || ''}
                  </td>
                  {allCols.map(c => (
                    <td key={c.key} className="px-3 py-2 border-b border-gray-200 text-right whitespace-nowrap">
                      {c.dec ? fmt(pick(row, [c.key])) : n(pick(row, [c.key]))}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
            {/* Totals footer */}
            <tfoot>
              <tr className="bg-teal-50 font-semibold text-teal-900 border-t-2 border-teal-300">
                <td className="px-3 py-2 text-center">Total</td>
                {allCols.map(c => (
                  <td key={c.key} className="px-3 py-2 text-right">
                    {c.dec ? fmt(totals[c.key]) : n(totals[c.key])}
                  </td>
                ))}
              </tr>
            </tfoot>
          </table>
        </div>
      )}

      {/* ── Empty state ── */}
      {!loading && rows.length === 0 && (
        <div className="border border-gray-200 rounded-lg bg-white min-h-[280px] flex flex-col items-center justify-center text-gray-400">
          <svg className="h-12 w-12 mb-3 opacity-40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
              d="M9 17v-2a4 4 0 014-4h0a4 4 0 014 4v2M3 17v-2a4 4 0 014-4h0M9 7a3 3 0 110-6 3 3 0 010 6zm6 0a3 3 0 110-6 3 3 0 010 6z" />
          </svg>
          <p className="text-sm">Select a factory and date, then click <strong>Search</strong>.</p>
        </div>
      )}
    </div>
  );
};

export default Report_IndentFailSummary;