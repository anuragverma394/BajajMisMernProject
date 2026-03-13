import React, { useState, useEffect } from 'react';
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

const pick = (row, keys, fb = '') => {
  for (const k of keys) {
    if (row[k] !== undefined && row[k] !== null && row[k] !== '') return row[k];
    const lk = k.toLowerCase();
    const found = Object.keys(row).find(rk => rk.toLowerCase() === lk);
    if (found && row[found] !== undefined && row[found] !== null && row[found] !== '') return row[found];
  }
  return fb;
};

/* ── filter button config ───────────────────────────────────────────────── */
const FILTERS = [
  { label: 'All', type: 'all' },
  { label: 'Yesterday Transit', type: 'yesterday-transit' },
  { label: 'Transit', type: 'transit' },
  { label: 'At Yard', type: 'at-yard' },
  { label: 'At Donga', type: 'at-donga' },
  { label: 'Weighed', type: 'weighed' }
];

/* ── table columns (mirror .NET output) ─────────────────────────────────── */
const COLS = [
  { label: 'S.N.', keys: ['SN'], align: 'text-center' },
  { label: 'Centre Code', keys: ['C_Code'], align: 'text-left' },
  { label: 'Centre Name', keys: ['C_Name', 'c_name'], align: 'text-left' },
  { label: 'Challan No', keys: ['ChalanNo'], align: 'text-center' },
  { label: 'Truck No', keys: ['TruckNo'], align: 'text-left' },
  { label: 'Transporter', keys: ['Transporter'], align: 'text-left' },
  { label: 'Departure Time', keys: ['DepartureTime'], align: 'text-center' },
  { label: 'Arrival Time', keys: ['ArrivalTime'], align: 'text-center' },
  { label: 'Weighment Time', keys: ['WeighmentTime'], align: 'text-center' },
  { label: 'Travel Time', keys: ['TravelTime'], align: 'text-center' },
  { label: 'Wait Time', keys: ['WailtTime'], align: 'text-center' }
];

/* ── component ───────────────────────────────────────────────────────────── */
const Report_TruckDispatchWeighed = () => {
  const navigate = useNavigate();
  const [units, setUnits] = useState([]);
  const [loading, setLoading] = useState(false);
  const [rows, setRows] = useState([]);
  const [activeFilter, setActiveFilter] = useState('all');
  const [filters, setFilters] = useState({ unit: '', date: today() });

  useEffect(() => {
    masterService.getUnits()
      .then(d => setUnits(Array.isArray(d) ? d.map(normalizeUnit).filter(u => u.code) : []))
      .catch(() => { });
  }, []);

  const handleChange = e => setFilters(prev => ({ ...prev, [e.target.name]: e.target.value }));

  const handleSearch = async (filterType = activeFilter) => {
    if (!filters.unit) { toast.error('Please select a Unit'); return; }
    if (!filters.date) { toast.error('Please enter a Date'); return; }
    setLoading(true);
    setActiveFilter(filterType);
    try {
      const res = await reportService.getTruckDispatchWeighed({
        F_Code: filters.unit,
        Date: filters.date,
        filterType
      });
      const data = res?.data ?? res?.recordsets?.[0] ?? (Array.isArray(res) ? res : []);
      if (!Array.isArray(data) || data.length === 0) {
        toast('No data found for selected filters.', { icon: 'ℹ️' });
        setRows([]);
      } else {
        setRows(data);
        toast.success(`${data.length} records loaded.`);
      }
    } catch {
      toast.error('Failed to fetch Truck Dispatch Weighed data.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-5 font-sans">
      <Toaster position="top-right" />

      {/* ── Header ── */}
      <div className="bg-teal-600 text-white text-center py-3 text-base font-semibold rounded-t-lg mb-px">
        Truck Dispatch Weighed Report
      </div>

      {/* ── Filters ── */}
      <div className="bg-white border border-gray-200 rounded-b-lg shadow-sm p-5 mb-4">
        <div className="flex flex-wrap gap-5 mb-5">
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

        {/* Filter type buttons */}
        <div className="flex flex-wrap gap-2">
          {FILTERS.map(f => (
            <button
              key={f.type}
              onClick={() => handleSearch(f.type)}
              disabled={loading}
              className={`px-4 py-2 rounded text-sm font-medium transition-colors disabled:opacity-60 border
                ${activeFilter === f.type && rows.length > 0
                  ? 'bg-teal-700 text-white border-teal-700'
                  : 'bg-teal-600 text-white border-teal-600 hover:bg-teal-700'}`}
            >
              {loading && activeFilter === f.type ? '...' : f.label}
            </button>
          ))}
          <div className="ml-auto flex gap-2">
            <button
              onClick={() => toast('Excel export coming soon.', { icon: '📊' })}
              className="px-4 py-2 rounded text-sm font-medium bg-teal-600 text-white hover:bg-teal-700 transition-colors border border-teal-600"
            >
              Excel
            </button>
            <button
              onClick={() => window.print()}
              className="px-4 py-2 rounded text-sm font-medium bg-teal-600 text-white hover:bg-teal-700 transition-colors border border-teal-600"
            >
              Print
            </button>
            <button
              onClick={() => navigate(-1)}
              className="px-4 py-2 rounded text-sm font-medium bg-teal-600 text-white hover:bg-teal-700 transition-colors border border-teal-600"
            >
              Exit
            </button>
          </div>
        </div>

        {/* Record count badge */}
        {rows.length > 0 && (
          <p className="mt-3 text-xs text-teal-700 font-semibold">
            Showing <span className="bg-teal-100 px-2 py-0.5 rounded">{rows.length}</span> records
            &nbsp;·&nbsp;
            Filter: <span className="italic">{FILTERS.find(f => f.type === activeFilter)?.label}</span>
          </p>
        )}
      </div>

      {/* ── Data table ── */}
      {rows.length > 0 && (
        <div className="overflow-x-auto border border-gray-200 rounded-lg shadow-sm bg-white">
          <table className="w-full text-xs border-collapse">
            <thead>
              <tr className="bg-gray-100 text-gray-700">
                {COLS.map(col => (
                  <th key={col.label}
                    className={`px-3 py-2.5 border border-gray-300 font-semibold whitespace-nowrap ${col.align}`}>
                    {col.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row, idx) => (
                <tr key={idx}
                  className={idx % 2 === 0 ? 'bg-white hover:bg-teal-50' : 'bg-gray-50 hover:bg-teal-50'}>
                  {COLS.map(col => (
                    <td key={col.label}
                      className={`px-3 py-2 border-b border-gray-200 whitespace-nowrap ${col.align}`}>
                      {pick(row, col.keys, '—')}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* ── Empty state ── */}
      {!loading && rows.length === 0 && (
        <div className="text-center py-16 text-gray-400">
          <svg className="mx-auto h-12 w-12 mb-3 opacity-40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
              d="M8 7h12m0 0l-4-4m4 4l-4 4m-8 5H4m0 0l4 4m-4-4l4-4" />
          </svg>
          <p className="text-sm">Select a unit and date, then click a filter button to load data.</p>
        </div>
      )}
    </div>
  );
};

export default Report_TruckDispatchWeighed;