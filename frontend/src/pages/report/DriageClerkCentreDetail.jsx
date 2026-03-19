import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast, Toaster } from 'react-hot-toast';
import { masterService, reportService } from '../../microservices/api.service';
import '../../styles/base.css';

const formatTodayDmy = () => {
  const now = new Date();
  const dd = String(now.getDate()).padStart(2, '0');
  const mm = String(now.getMonth() + 1).padStart(2, '0');
  const yyyy = now.getFullYear();
  return `${dd}/${mm}/${yyyy}`;
};

const toDmy = (value) => {
  const raw = String(value || '').trim();
  if (!raw) return '';
  if (/^\d{2}\/\d{2}\/\d{4}$/.test(raw)) return raw;
  const iso = raw.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (iso) return `${iso[3]}/${iso[2]}/${iso[1]}`;
  return raw;
};

const Report_DriageClerkCentreDetail = () => {
  const navigate = useNavigate();
  const [units, setUnits] = useState([]);
  const [loading, setLoading] = useState(false);
  const [reportData, setReportData] = useState([]);
  const [filters, setFilters] = useState({
    F_code: '',
    Date: formatTodayDmy()
  });

  useEffect(() => {
    masterService.getUnits()
      .then((d) => setUnits(Array.isArray(d) ? d : d?.data || []))
      .catch(() => {});
  }, []);

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters((prev) => ({ ...prev, [name]: value }));
  };

  const handleSearch = async () => {
    const date = toDmy(filters.Date);
    if (!filters.F_code) {
      toast.error('Please select a factory.');
      return;
    }
    if (!date) {
      toast.error('Please select a date.');
      return;
    }
    setLoading(true);
    try {
      const response = await reportService.getDriageClerkCentreDetail({
        F_code: filters.F_code,
        Date: date
      });
      const data = response?.Data || response?.data || [];
      if (response?.API_STATUS === 'OK' || data.length > 0) {
        setReportData(data);
        if (!data.length) toast.error('No data available.');
      } else {
        toast.error(response?.Message || 'No data available.');
      }
    } catch (error) {
      toast.error('Failed to fetch report data.');
    } finally {
      setLoading(false);
    }
  };

  const handleExport = () => {
    if (!reportData.length) {
      toast.error('No data to export.');
      return;
    }
    const headers = [
      'S.NO',
      'Clerk Code',
      'Clerk Name',
      'Centre Code',
      'Centre Name',
      'From',
      'Till',
      'Purchase Qty',
      'Receipt Qty',
      'Dries Qty',
      '%Tage'
    ];
    const rows = reportData.map((row, idx) => ([
      idx + 1,
      row.clerkCode || '',
      row.clerkName || '',
      row.centreCode || '',
      row.centreName || '',
      row.MFrom || '',
      row.Till || '',
      row.weighed ?? '0',
      row.crushed ?? '0',
      row.driage ?? '0',
      row.percent ?? '0'
    ]));
    const csv = [headers, ...rows]
      .map((r) => r.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(','))
      .join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'DriageClerkCentreDetail.csv';
    link.click();
    URL.revokeObjectURL(link.href);
  };

  return (
    <div className="min-h-screen bg-slate-50 p-4">
      <Toaster position="top-right" />

      <div className="rounded-lg border border-emerald-200 bg-white shadow-sm">
        <div className="rounded-t-lg bg-emerald-600 px-4 py-3 text-sm font-semibold text-white">
          Driage Clerk And Centre Summary
        </div>

        <div className="space-y-4 p-4">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <div>
              <label className="mb-2 block text-xs font-semibold text-slate-700">Factory</label>
              <select
                name="F_code"
                value={filters.F_code}
                onChange={handleFilterChange}
                className="w-full rounded border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 focus:border-emerald-500 focus:outline-none"
              >
                <option value="">Select Factory</option>
                {units.map((unit, idx) => (
                  <option key={`${unit.F_Code || unit.id}-${idx}`} value={unit.F_Code || unit.id}>
                    {unit.F_Name || unit.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-2 block text-xs font-semibold text-slate-700">Date</label>
              <input
                type="text"
                name="Date"
                value={filters.Date}
                onChange={handleFilterChange}
                placeholder="DD/MM/YYYY"
                className="w-full rounded border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 focus:border-emerald-500 focus:outline-none"
              />
            </div>

            <div className="flex flex-wrap items-end gap-2">
              <button
                onClick={handleSearch}
                disabled={loading}
                className="rounded bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading ? 'Searching...' : 'Search'}
              </button>
              <button
                onClick={handleExport}
                className="rounded bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700"
              >
                Excel
              </button>
              <button
                onClick={() => window.print()}
                className="rounded bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700"
              >
                Print
              </button>
              <button
                onClick={() => navigate(-1)}
                className="rounded bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700"
              >
                Exit
              </button>
            </div>
          </div>

          <div className="overflow-x-auto rounded-lg border border-emerald-200">
            <table className="min-w-[1100px] border-collapse text-xs">
              <thead>
                <tr className="bg-emerald-50 text-emerald-800">
                  <th className="border border-emerald-200 px-2 py-2 text-center">S.NO</th>
                  <th className="border border-emerald-200 px-2 py-2 text-left">Clerk Code</th>
                  <th className="border border-emerald-200 px-2 py-2 text-left">Clerk Name</th>
                  <th className="border border-emerald-200 px-2 py-2 text-left">Centre Code</th>
                  <th className="border border-emerald-200 px-2 py-2 text-left">Centre Name</th>
                  <th className="border border-emerald-200 px-2 py-2 text-center">From</th>
                  <th className="border border-emerald-200 px-2 py-2 text-center">Till</th>
                  <th className="border border-emerald-200 px-2 py-2 text-right">Purchase Qty</th>
                  <th className="border border-emerald-200 px-2 py-2 text-right">Receipt Qty</th>
                  <th className="border border-emerald-200 px-2 py-2 text-right">Dries Qty</th>
                  <th className="border border-emerald-200 px-2 py-2 text-right">%Tage</th>
                </tr>
              </thead>
              <tbody>
                {reportData.length === 0 ? (
                  <tr>
                    <td colSpan={11} className="border border-emerald-100 px-4 py-10 text-center text-slate-400">
                      No data found. Select a factory and date, then click Search.
                    </td>
                  </tr>
                ) : (
                  reportData.map((row, idx) => (
                    <tr key={`${row.clerkCode || 'row'}-${idx}`} className="border-b border-emerald-100">
                      <td className="border border-emerald-100 px-2 py-1 text-center">{idx + 1}</td>
                      <td className="border border-emerald-100 px-2 py-1 text-left">{row.clerkCode || '-'}</td>
                      <td className="border border-emerald-100 px-2 py-1 text-left">{row.clerkName || '-'}</td>
                      <td className="border border-emerald-100 px-2 py-1 text-left">{row.centreCode || '-'}</td>
                      <td className="border border-emerald-100 px-2 py-1 text-left">{row.centreName || '-'}</td>
                      <td className="border border-emerald-100 px-2 py-1 text-center">{row.MFrom || '-'}</td>
                      <td className="border border-emerald-100 px-2 py-1 text-center">{row.Till || '-'}</td>
                      <td className="border border-emerald-100 px-2 py-1 text-right">{row.weighed ?? '0'}</td>
                      <td className="border border-emerald-100 px-2 py-1 text-right">{row.crushed ?? '0'}</td>
                      <td className="border border-emerald-100 px-2 py-1 text-right">{row.driage ?? '0'}</td>
                      <td className="border border-emerald-100 px-2 py-1 text-right">{row.percent ?? '0'}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Report_DriageClerkCentreDetail;
