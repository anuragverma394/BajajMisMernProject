import React, { useEffect, useMemo, useState } from 'react';
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

const SurveyReport_CaneVierityVillageGrower = () => {
  const navigate = useNavigate();
  const [units, setUnits] = useState([]);
  const [loading, setLoading] = useState(false);
  const [rows, setRows] = useState([]);
  const [filters, setFilters] = useState({
    F_code: '',
    Categry: 'varietychange',
    Fdate: today(),
    Tdate: today()
  });

  useEffect(() => {
    masterService.getUnits()
      .then((d) => setUnits(Array.isArray(d) ? d.map(normalizeUnit).filter((u) => u.code) : []))
      .catch(() => { });
  }, []);

  const handleChange = (e) => setFilters((prev) => ({ ...prev, [e.target.name]: e.target.value }));

  const handleSearch = async () => {
    if (!filters.F_code) {
      toast.error('Please select a Factory');
      return;
    }
    setLoading(true);
    try {
      const res = await surveyService.getCaneVarietyVillageGrower(filters);
      const data = res?.data ?? res?.recordsets?.[0] ?? (Array.isArray(res) ? res : []);
      if (!Array.isArray(data) || data.length === 0) {
        toast('No data found.', { icon: 'ℹ️' });
        setRows([]);
      } else {
        setRows(data);
        toast.success(`${data.length} rows loaded.`);
      }
    } catch {
      toast.error('Failed to load report');
      setRows([]);
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = () => {
    const content = document.getElementById('cvvg-print');
    openPrintWindow({
      title: 'Cane Variety Village Grower Report',
      subtitle: `Factory: ${filters.F_code} | ${filters.Fdate} to ${filters.Tdate}`,
      contentHtml: content ? content.outerHTML : ''
    });
  };

  const handleExport = () => {
    if (window.exportTableToCSV) {
      window.exportTableToCSV('cvvg-table', 'CaneVarietyVillageGrower.csv');
    }
  };

  const beforeLabel = useMemo(() => {
    if (filters.Categry === 'categorychange') return 'Before Category Plot Update';
    if (filters.Categry === 'canetypechange') return 'Before CaneType Plot Update';
    if (filters.Categry === 'growerchange') return 'Before Grower Plot Update';
    return 'Before Variety Plot Update';
  }, [filters.Categry]);

  const afterLabel = useMemo(() => {
    if (filters.Categry === 'categorychange') return 'After Category Plot Update';
    if (filters.Categry === 'canetypechange') return 'After CaneType Plot Update';
    if (filters.Categry === 'growerchange') return 'After Grower Plot Update';
    return 'After Variety Plot Update';
  }, [filters.Categry]);

  const highlightClass = (type) => {
    if (filters.Categry === type) {
      return 'text-emerald-900 font-semibold';
    }
    return '';
  };

  const thBase = 'px-3 py-3 border border-[#a7c49d] bg-[#dff0d8] text-[#1b3b2f] font-semibold text-center whitespace-nowrap text-xs';
  const tdBase = 'px-3 py-2 border-b border-[#c7d9c5] text-xs whitespace-nowrap';

  return (
    <div className="px-4 pb-10">
      <Toaster position="top-right" />

      <div className="rounded-lg border border-emerald-200 bg-white shadow-sm">
        <div className="rounded-t-lg bg-emerald-600 px-6 py-3 text-white">
          Cane Variety Village Grower Report
        </div>
        <div className="border border-emerald-100 bg-emerald-50 px-6 py-3 text-emerald-900">
          Cane Variety Village Grower Report
        </div>

        <div className="px-6 py-5">
          <div className="grid gap-4 md:grid-cols-4">
            <div>
              <label className="block text-sm font-semibold text-emerald-900">Factory</label>
              <select
                name="F_code"
                value={filters.F_code}
                onChange={handleChange}
                className="mt-2 w-full rounded-md border border-emerald-200 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none"
              >
                <option value="">-- Select Factory --</option>
                {units.map((u, i) => (
                  <option key={`${u.code}-${i}`} value={u.code}>{u.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold text-emerald-900">Type</label>
              <select
                name="Categry"
                value={filters.Categry}
                onChange={handleChange}
                className="mt-2 w-full rounded-md border border-emerald-200 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none"
              >
                <option value="0">-Select-</option>
                <option value="varietychange">Variety Change</option>
                <option value="categorychange">Category Change</option>
                <option value="growerchange">Grower Change</option>
                <option value="canetypechange">CaneType Change</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold text-emerald-900">From Date</label>
              <input
                type="text"
                name="Fdate"
                value={filters.Fdate}
                onChange={handleChange}
                placeholder="DD/MM/YYYY"
                className="mt-2 w-full rounded-md border border-emerald-200 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-emerald-900">To Date</label>
              <input
                type="text"
                name="Tdate"
                value={filters.Tdate}
                onChange={handleChange}
                placeholder="DD/MM/YYYY"
                className="mt-2 w-full rounded-md border border-emerald-200 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none"
              />
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
              onClick={handleExport}
              className="rounded-md bg-emerald-600 px-5 py-2 text-sm font-semibold text-white shadow hover:bg-emerald-700"
            >
              Excel
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

      <div className="mt-6 rounded-lg border border-emerald-200 bg-white shadow-sm" id="cvvg-print">
        <div className="p-4 relative">
          <button
            type="button"
            className="absolute right-4 top-4 h-8 w-8 rounded-full bg-emerald-600 text-white text-sm font-bold shadow"
            aria-label="Help"
          >
            ?
          </button>
          <div className="max-h-[420px] overflow-auto rounded-md border border-emerald-200 bg-[#f9fbf6]">
            <table id="cvvg-table" className="w-full min-w-[1600px] table-auto border-collapse text-sm">
              <thead className="sticky top-0 bg-emerald-100">
                <tr>
                  <th rowSpan={2} className={thBase}>Plot Village Code</th>
                  <th rowSpan={2} className={thBase}>Plot Village Name</th>
                  <th rowSpan={2} className={thBase}>Plot No</th>
                  <th colSpan={5} className={thBase}>{beforeLabel}</th>
                  <th colSpan={5} className={thBase}>{afterLabel}</th>
                  <th rowSpan={2} className={thBase}>EastDim</th>
                  <th rowSpan={2} className={thBase}>WestDim</th>
                  <th rowSpan={2} className={thBase}>NorthDim</th>
                  <th rowSpan={2} className={thBase}>SouthDim</th>
                </tr>
                <tr>
                  <th className={`${thBase} ${highlightClass('varietychange')}`}>Before Variety Name</th>
                  <th className={`${thBase} ${highlightClass('categorychange')}`}>Before Category Name</th>
                  <th className={thBase}>Before Grower Village</th>
                  <th className={`${thBase} ${highlightClass('growerchange')}`}>Before Grower Code</th>
                  <th className={`${thBase} ${highlightClass('canetypechange')}`}>Before Cane Type Name</th>

                  <th className={`${thBase} ${highlightClass('varietychange')}`}>Update Variety Name</th>
                  <th className={`${thBase} ${highlightClass('categorychange')}`}>Update Category Name</th>
                  <th className={thBase}>Update Grower Village</th>
                  <th className={`${thBase} ${highlightClass('growerchange')}`}>Update Grower Code</th>
                  <th className={`${thBase} ${highlightClass('canetypechange')}`}>After Cane Type Name</th>
                </tr>
              </thead>
              <tbody>
                {rows.length === 0 && (
                  <tr>
                    <td colSpan={17} className="border border-emerald-200 px-4 py-6 text-center text-sm text-red-600">
                      {loading ? 'Loading data...' : 'No Data Found ............'}
                    </td>
                  </tr>
                )}
                {rows.map((row, idx) => (
                  <tr key={idx} className={idx % 2 === 0 ? 'bg-white hover:bg-[#eef7f0]' : 'bg-[#f7fbf8] hover:bg-[#eef7f0]'}>
                    <td className={`${tdBase} text-center`}>{row.PlotVillCode ?? row.plotvillcode ?? ''}</td>
                    <td className={tdBase}>{row.PlotVillName ?? row.plotvillname ?? ''}</td>
                    <td className={`${tdBase} text-center`}>{row.PlotNo ?? row.plotno ?? ''}</td>
                    <td className={`${tdBase}`}>{row.BeforeVarietyName ?? ''}</td>
                    <td className={`${tdBase}`}>{row.BaforeCategoryName ?? ''}</td>
                    <td className={`${tdBase} text-center`}>{row.beforegrowervillage ?? ''}</td>
                    <td className={`${tdBase} text-center`}>{row.BeforeGrowercode ?? ''}</td>
                    <td className={`${tdBase}`}>{row.BeforeCaneTypeName ?? ''}</td>
                    <td className={`${tdBase}`}>{row.UpdateVarietyName ?? ''}</td>
                    <td className={`${tdBase}`}>{row.UpdateCategoryName ?? ''}</td>
                    <td className={`${tdBase} text-center`}>{row.AfterGrowerVillage ?? ''}</td>
                    <td className={`${tdBase} text-center`}>{row.aftergrowercode ?? ''}</td>
                    <td className={`${tdBase}`}>{row.AfterCaneTypeName ?? ''}</td>
                    <td className={`${tdBase} text-right`}>{row.EastDim ?? ''}</td>
                    <td className={`${tdBase} text-right`}>{row.WestDim ?? ''}</td>
                    <td className={`${tdBase} text-right`}>{row.NorthDim ?? ''}</td>
                    <td className={`${tdBase} text-right`}>{row.SouthDim ?? ''}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SurveyReport_CaneVierityVillageGrower;
