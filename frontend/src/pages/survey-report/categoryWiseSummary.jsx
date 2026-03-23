import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast, Toaster } from 'react-hot-toast';
import { masterService, surveyService } from '../../microservices/api.service';
import { openPrintWindow } from '../../utils/print';

const today = () => {
  const d = new Date();
  return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;
};

const normalizeUnit = (u) => ({
  code: String(u?.F_Code || u?.f_Code || u?.id || '').trim(),
  name: String(u?.F_Name || u?.f_Name || u?.name || '').trim()
});

const SurveyReport_categoryWiseSummary = () => {
  const navigate = useNavigate();
  const [units, setUnits] = useState([]);
  const [loading, setLoading] = useState(false);
  const [rows, setRows] = useState([]);
  const [filters, setFilters] = useState({ unit: '', date: today(), category: '0' });

  useEffect(() => {
    masterService.getUnits()
      .then((d) => setUnits(Array.isArray(d) ? d.map(normalizeUnit).filter((u) => u.code) : []))
      .catch(() => { });
  }, []);

  const handleChange = (e) => setFilters((prev) => ({ ...prev, [e.target.name]: e.target.value }));

  const handleSearch = async () => {
    if (!filters.unit) {
      toast.error('Please select a Factory');
      return;
    }
    setLoading(true);
    try {
      const res = await surveyService.getCategoryWiseSummary({
        F_Name: filters.unit,
        date: filters.date,
        catg: filters.category
      });
      const data = res?.data ?? res?.recordsets?.[0] ?? (Array.isArray(res) ? res : []);
      if (!Array.isArray(data) || data.length === 0) {
        toast('No data found.', { icon: 'ℹ️' });
        setRows([]);
      } else {
        setRows(data);
        toast.success(`${data.length} rows loaded.`);
      }
    } catch {
      toast.error('Failed to load category summary');
      setRows([]);
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = () => {
    const content = document.getElementById('category-wise-summary-print');
    openPrintWindow({
      title: 'Category Wise Summary Report',
      subtitle: `Factory: ${filters.unit} | Date: ${filters.date}`,
      contentHtml: content ? content.outerHTML : ''
    });
  };

  const thBase = 'px-3 py-3 border border-[#a7c49d] bg-[#dff0d8] text-[#1b3b2f] font-semibold text-center whitespace-nowrap text-xs';
  const tdBase = 'px-3 py-2 border-b border-[#c7d9c5] text-xs whitespace-nowrap';
  const tableId = 'category-wise-summary-table';

  return (
    <div className="px-4 pb-10">
      <Toaster position="top-right" />

      <div className="rounded-lg border border-emerald-200 bg-white shadow-sm">
        <div className="rounded-t-lg bg-emerald-600 px-6 py-3 text-white">
          Category Wise Summary Report
        </div>
        <div className="border border-emerald-100 bg-emerald-50 px-6 py-3 text-emerald-900">
          Category Wise Summary Report
        </div>
        <div className="px-6 py-5">
          <div className="grid gap-4 md:grid-cols-3">
            <div className="w-64">
              <label className="block text-sm font-semibold text-emerald-900">Factory</label>
              <select
                name="unit"
                value={filters.unit}
                onChange={handleChange}
                className="mt-2 w-full rounded-md border border-emerald-200 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none"
              >
                <option value="">-- Select Factory --</option>
                {units.map((u, i) => (
                  <option key={`${u.code}-${i}`} value={u.code}>{u.name}</option>
                ))}
              </select>
            </div>
            <div className="w-52">
              <label className="block text-sm font-semibold text-emerald-900">Date</label>
              <input
                type="text"
                name="date"
                value={filters.date}
                onChange={handleChange}
                placeholder="DD/MM/YYYY"
                className="mt-2 w-full rounded-md border border-emerald-200 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none"
              />
            </div>
            <div className="w-64">
              <label className="block text-sm font-semibold text-emerald-900">Category</label>
              <select
                name="category"
                value={filters.category}
                onChange={handleChange}
                className="mt-2 w-full rounded-md border border-emerald-200 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none"
              >
                <option value="0">ALL</option>
                <option value="1">Higher To Lower</option>
                <option value="2">Lower To Higher</option>
              </select>
            </div>
          </div>

          <div className="mt-5 flex flex-wrap gap-3">
            <button
              onClick={handleSearch}
              disabled={loading}
              className="rounded-md bg-emerald-600 px-5 py-2 text-sm font-semibold text-white shadow hover:bg-emerald-700 disabled:opacity-70"
            >
              {loading ? 'Searching...' : 'Search'}
            </button>
            <button
              onClick={() => window.exportTableToCSV?.(tableId, 'CategoryWiseSummary.csv')}
              className="rounded-md bg-emerald-600 px-5 py-2 text-sm font-semibold text-white shadow hover:bg-emerald-700"
            >
              Export
            </button>
            <button
              onClick={handlePrint}
              className="rounded-md bg-emerald-600 px-5 py-2 text-sm font-semibold text-white shadow hover:bg-emerald-700"
            >
              Print
            </button>
            <button
              onClick={() => navigate(-1)}
              className="rounded-md bg-emerald-500 px-5 py-2 text-sm font-semibold text-white shadow hover:bg-emerald-600"
            >
              Exit
            </button>
          </div>
        </div>
      </div>

      <div className="mt-6 rounded-lg border border-emerald-200 bg-white shadow-sm" id="category-wise-summary-print">
        <div className="p-4 relative">
          <button
            type="button"
            className="absolute right-4 top-4 h-8 w-8 rounded-full bg-emerald-600 text-white text-sm font-bold shadow"
            aria-label="Help"
          >
            ?
          </button>
          <div className="max-h-[420px] overflow-auto rounded-md border border-emerald-200 bg-[#f9fbf6]">
            <table id={tableId} className="w-full min-w-[1200px] table-auto border-collapse text-sm">
              <thead className="sticky top-0 bg-emerald-100">
                <tr>
                  <th className={thBase}>S.No</th>
                  <th className={thBase}>Bafore Category Name</th>
                  <th className={thBase}>Update Category Name</th>
                  <th className={thBase}>Plot Count</th>
                </tr>
              </thead>
              <tbody>
                {rows.length === 0 && (
                  <tr>
                    <td colSpan={4} className="border border-emerald-200 px-4 py-6 text-center text-sm text-slate-700">
                      {loading ? 'Loading data...' : 'No Data Found..'}
                    </td>
                  </tr>
                )}
                {rows.map((row, idx) => (
                  <tr key={idx} className={idx % 2 === 0 ? 'bg-white hover:bg-[#eef7f0]' : 'bg-[#f7fbf8] hover:bg-[#eef7f0]'}>
                    <td className={`${tdBase} text-center`}>{idx + 1}</td>
                    <td className={tdBase}>{row.BaforeCategoryName ?? row.beforeCategoryName ?? ''}</td>
                    <td className={tdBase}>{row.UpdateCategoryName ?? row.updateCategoryName ?? ''}</td>
                    <td className={`${tdBase} text-center`}>{row.PlotCount ?? row.plotCount ?? ''}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Empty state handled inside table */}
    </div>
  );
};

export default SurveyReport_categoryWiseSummary;
