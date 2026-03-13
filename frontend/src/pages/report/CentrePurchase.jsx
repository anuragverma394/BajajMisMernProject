import React, { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast, Toaster } from 'react-hot-toast';
import { masterService, reportService } from '../../microservices/api.service';

/* ── helpers ────────────────────────────────────────────────────────────── */
const today = () => {
  const d = new Date();
  const dd = String(d.getDate()).padStart(2, '0');
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  return `${dd}/${mm}/${d.getFullYear()}`;
};

const normalizeUnit = (u) => ({
  code: String(u?.F_Code || u?.f_Code || u?.id || '').trim(),
  name: String(u?.F_Name || u?.f_Name || u?.name || '').trim()
});

const pick = (row, keys, fb = 0) => {
  for (const k of keys) {
    if (row[k] !== undefined && row[k] !== null && row[k] !== '') return row[k];
    const lk = k.toLowerCase();
    const found = Object.keys(row).find(rk => rk.toLowerCase() === lk);
    if (found && row[found] !== undefined && row[found] !== null && row[found] !== '') return row[found];
  }
  return fb;
};

const n = (v) => {
  const x = Number(String(v ?? '').replace(/,/g, ''));
  return isNaN(x) ? 0 : x;
};

const fmt = (v, dec = 2) => {
  const num = n(v);
  return num === 0 ? '0' : num.toFixed(dec);
};

/* ── column config (matches screenshot) ─────────────────────────────────── */
const COLS = [
  { label: 'S.N.', key: ['SN'], align: 'text-center', num: false },
  { label: 'Centre Code', key: ['m_Centre'], align: 'text-left', num: false },
  { label: 'Centre Name', key: ['C_Name'], align: 'text-left', num: false },
  { label: '1st wmtTime', key: ['1stwmtTime'], align: 'text-center', num: false },
  { label: 'Last WmtTime', key: ['LastWmtTime'], align: 'text-center', num: false },
  { label: 'Purchy Nos', key: ['PurchyNos'], align: 'text-right', num: true },
  { label: 'Purchases Qty', key: ['PurQty'], align: 'text-right', num: true, dec: 2 },
  { label: 'Veh DispatchNos', key: ['VehDispatchNos'], align: 'text-right', num: true },
  { label: '1st DisptchAt', key: ['1stdisptchAt'], align: 'text-center', num: false },
  { label: 'Last DisptchAt', key: ['LastDisptchAt'], align: 'text-center', num: false },
  { label: 'Recieved', key: ['Recieved'], align: 'text-right', num: true },
  { label: 'Balance', key: ['Balance'], align: 'text-right', num: true }
];

/* ── component ───────────────────────────────────────────────────────────── */
const Report_CentrePurchase = () => {
  const navigate = useNavigate();
  const [units, setUnits] = useState([]);
  const [loading, setLoading] = useState(false);
  const [rows, setRows] = useState([]);
  const [filters, setFilters] = useState({ unit: '', date: today() });

  useEffect(() => {
    masterService
      .getUnits()
      .then(d => setUnits(Array.isArray(d) ? d.map(normalizeUnit).filter(u => u.code) : []))
      .catch(() => { });
  }, []);

  const handleChange = e => setFilters(prev => ({ ...prev, [e.target.name]: e.target.value }));

  const handleSearch = async () => {
    if (!filters.unit) { toast.error('Please select a Unit'); return; }
    if (!filters.date) { toast.error('Please enter a Date'); return; }
    setLoading(true);
    try {
      const res = await reportService.getCenterPurchases({
        F_Code: filters.unit,
        Date: filters.date
      });
      const data = res?.data ?? res?.recordsets?.[0] ?? (Array.isArray(res) ? res : []);
      if (!Array.isArray(data) || data.length === 0) {
        toast('No data found for selected filters.', { icon: 'ℹ️' });
        setRows([]);
      } else {
        setRows(data);
        toast.success(`${data.length} centres loaded.`);
      }
    } catch {
      toast.error('Failed to fetch Centre Purchase data.');
    } finally {
      setLoading(false);
    }
  };

  /* summary stats shown in the green bar */
  const summary = useMemo(() => {
    const total = rows.length;
    const purNos = rows.reduce((a, r) => a + n(pick(r, ['PurchyNos'])), 0);
    const purQty = rows.reduce((a, r) => a + n(pick(r, ['PurQty'])), 0);
    const vehNos = rows.reduce((a, r) => a + n(pick(r, ['VehDispatchNos'])), 0);
    const recv = rows.reduce((a, r) => a + n(pick(r, ['Recieved'])), 0);
    const bal = rows.reduce((a, r) => a + n(pick(r, ['Balance'])), 0);
    return { total, purNos, purQty, vehNos, recv, bal };
  }, [rows]);

  const handleExcel = () => toast('Excel export coming soon.', { icon: '📊' });
  const handlePrint = () => window.print();

  /* ── render ────────────────────────────────────────────────────────────── */
  return (
    <div className="min-h-screen bg-gray-50 p-5 font-sans">
      <Toaster position="top-right" />

      {/* ── Page header ── */}
      <div className="bg-teal-600 text-white text-center py-3 text-base font-semibold rounded-t-lg mb-px">
        Center Purchases Report
      </div>

      {/* ── Filter card ── */}
      <div className="bg-white border border-gray-200 rounded-b-lg shadow-sm p-5 mb-4">
        <div className="flex flex-wrap gap-5 mb-5">
          {/* Unit */}
          <div className="w-64">
            <label className="block text-xs font-semibold text-gray-700 mb-1.5">Units</label>
            <select
              name="unit"
              value={filters.unit}
              onChange={handleChange}
              className="w-full border border-gray-300 rounded px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-teal-500"
            >
              <option value="">-- Select Unit --</option>
              {units.map((u, i) => (
                <option key={`${u.code}-${i}`} value={u.code}>{u.name}</option>
              ))}
            </select>
          </div>

          {/* Date */}
          <div className="w-64">
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

        {/* Action buttons + summary bar */}
        <div className="flex flex-wrap items-center gap-2">
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
                </svg>
                ...
              </span>
            ) : 'Search'}
          </button>

          <button onClick={handleExcel} className="px-5 py-2 rounded text-sm font-medium text-white bg-teal-600 hover:bg-teal-700 transition-colors min-w-[80px]">
            Excel
          </button>
          <button onClick={handlePrint} className="px-5 py-2 rounded text-sm font-medium text-white bg-teal-600 hover:bg-teal-700 transition-colors min-w-[80px]">
            Print
          </button>
          <button onClick={() => navigate(-1)} className="px-5 py-2 rounded text-sm font-medium text-white bg-teal-600 hover:bg-teal-700 transition-colors min-w-[80px]">
            Exit
          </button>

          {/* Summary bar (visible after search) */}
          {rows.length > 0 && (
            <span className="ml-2 text-sm font-semibold text-teal-700">
              Centre Operated&nbsp;: {summary.total} &nbsp;|&nbsp;
              PurchyNos&nbsp;: {summary.purNos} &nbsp;|&nbsp;
              PurchyQty&nbsp;: {fmt(summary.purQty)} &nbsp;|&nbsp;
              VehDispatchNos&nbsp;: {summary.vehNos} &nbsp;|&nbsp;
              Recieved&nbsp;: {summary.recv} &nbsp;|&nbsp;
              Balance&nbsp;: {summary.bal}
            </span>
          )}
        </div>
      </div>

      {/* ── Data table ── */}
      {rows.length > 0 && (
        <div className="overflow-x-auto border border-gray-200 rounded-lg shadow-sm bg-white">
          <table className="w-full text-xs border-collapse">
            <thead>
              <tr className="bg-gray-100 text-gray-700">
                {COLS.map(col => (
                  <th
                    key={col.label}
                    className={`px-3 py-2.5 border border-gray-300 font-semibold whitespace-nowrap ${col.align}`}
                  >
                    {col.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row, idx) => (
                <tr
                  key={idx}
                  className={idx % 2 === 0 ? 'bg-white hover:bg-teal-50' : 'bg-gray-50 hover:bg-teal-50'}
                >
                  {COLS.map(col => {
                    const raw = pick(row, col.key, col.num ? 0 : '');
                    const display = col.dec ? fmt(raw, col.dec) : (col.num ? n(raw) : (raw || '0'));
                    return (
                      <td
                        key={col.label}
                        className={`px-3 py-2 border-b border-gray-200 ${col.align} whitespace-nowrap`}
                      >
                        {display}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>

            {/* Totals row */}
            <tfoot>
              <tr className="bg-teal-50 font-semibold text-teal-800">
                <td className="px-3 py-2 border-t-2 border-teal-300 text-center" colSpan={5}>
                  Total
                </td>
                <td className="px-3 py-2 border-t-2 border-teal-300 text-right">{summary.purNos}</td>
                <td className="px-3 py-2 border-t-2 border-teal-300 text-right">{fmt(summary.purQty)}</td>
                <td className="px-3 py-2 border-t-2 border-teal-300 text-right">{summary.vehNos}</td>
                <td className="px-3 py-2 border-t-2 border-teal-300 text-center" colSpan={2}></td>
                <td className="px-3 py-2 border-t-2 border-teal-300 text-right">{summary.recv}</td>
                <td className="px-3 py-2 border-t-2 border-teal-300 text-right">{summary.bal}</td>
              </tr>
            </tfoot>
          </table>
        </div>
      )}

      {/* ── Empty state ── */}
      {!loading && rows.length === 0 && (
        <div className="text-center py-16 text-gray-400">
          <svg className="mx-auto h-12 w-12 mb-3 opacity-40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
              d="M9 17v-2a4 4 0 014-4h0a4 4 0 014 4v2M3 17v-2a4 4 0 014-4h0M9 7a3 3 0 110-6 3 3 0 010 6zm6 0a3 3 0 110-6 3 3 0 010 6z" />
          </svg>
          <p className="text-sm">Select a unit and date, then click <strong>Search</strong>.</p>
        </div>
      )}
    </div>
  );
};

export default Report_CentrePurchase;