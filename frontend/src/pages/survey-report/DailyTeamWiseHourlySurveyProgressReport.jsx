import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast, Toaster } from 'react-hot-toast';
import { masterService } from '../../microservices/api.service';
import { surveyService } from '../../microservices/survey.service';

const today = () => {
  const d = new Date();
  return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;
};

const normalizeUnit = (u) => ({
  code: String(u?.F_Code || u?.f_Code || u?.id || '').trim(),
  name: String(u?.F_Name || u?.f_Name || u?.name || '').trim()
});

const toNum = (v) => {
  const num = Number(String(v ?? '').replace(/,/g, ''));
  return Number.isFinite(num) ? num : 0;
};

const SurveyReport_DailyTeamWiseHourlySurveyProgressReport = () => {
  const navigate = useNavigate();
  const [units, setUnits] = useState([]);
  const [loading, setLoading] = useState(false);
  const [rows, setRows] = useState([]);
  const [filters, setFilters] = useState({ unit: '', date: today() });

  useEffect(() => {
    masterService.getUnits()
      .then((d) => setUnits(Array.isArray(d) ? d.map(normalizeUnit).filter((u) => u.code) : []))
      .catch(() => { });
  }, []);

  const handleChange = (e) => setFilters((prev) => ({ ...prev, [e.target.name]: e.target.value }));

  const handleSearch = async () => {
    if (!filters.unit) { toast.error('Please select a Factory'); return; }
    if (!filters.date) { toast.error('Please enter a Date'); return; }
    setLoading(true);
    try {
      const response = await surveyService.getDailyTeamWiseHourlyProgress({
        F_Code: filters.unit,
        Date: filters.date
      });
      const data = response?.data ?? response?.recordsets?.[0] ?? (Array.isArray(response) ? response : []);
      setRows(Array.isArray(data) ? data : []);
      if (!data || data.length === 0) toast('No data found.', { icon: 'ℹ️' });
    } catch {
      toast.error('Failed to fetch report data.');
    } finally {
      setLoading(false);
    }
  };

  const thBase = 'px-2 py-2 border border-[#8fbfa4] bg-[#dff0d8] text-[#1b3b2f] font-semibold text-center whitespace-nowrap text-xs';
  const tdBase = 'px-2 py-1.5 border-b border-[#c7d9c5] text-xs whitespace-nowrap';

  return (
    <div className="min-h-screen bg-gray-50 p-4 font-sans">
      <Toaster position="top-right" />

      <div className="bg-[#129a81] text-white px-5 py-3 text-sm font-semibold rounded-t-lg mb-px">
        Daily Hourly Survey Progress Report
      </div>

      <div className="border border-gray-200 rounded-b-lg bg-white shadow-sm mb-4">
        <div className="bg-[#dff0d8] text-[#1b3b2f] px-5 py-2 text-xs font-semibold border-b border-[#c7d9c5]">
          Daily Hourly Survey Progress Report
        </div>
        <div className="p-5">
          <div className="flex flex-wrap gap-5 mb-5 items-end">
            <div className="w-64">
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
            <div className="w-52">
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

          <div className="flex flex-wrap gap-2">
            <button
              onClick={handleSearch}
              disabled={loading}
              className="px-5 py-2 rounded text-sm font-medium text-white bg-[#129a81] hover:bg-[#0f7f68] disabled:opacity-60 transition-colors min-w-[80px]"
            >
              {loading ? '...' : 'Search'}
            </button>
            <button className="px-5 py-2 rounded text-sm font-medium text-white bg-[#129a81] hover:bg-[#0f7f68] transition-colors">
              Excel
            </button>
            <button
              onClick={() => window.print()}
              className="px-5 py-2 rounded text-sm font-medium text-white bg-[#129a81] hover:bg-[#0f7f68] transition-colors"
            >
              Print
            </button>
            <button
              onClick={() => navigate(-1)}
              className="px-5 py-2 rounded text-sm font-medium text-white bg-[#129a81] hover:bg-[#0f7f68] transition-colors"
            >
              Exit
            </button>
          </div>
        </div>
      </div>

      {rows.length > 0 && (
        <div className="overflow-x-auto border border-gray-200 rounded-lg shadow-sm bg-white">
          <table className="w-full text-xs border-collapse">
            <thead>
              <tr>
                <th className={`${thBase} align-bottom`} rowSpan={2}>S.No</th>
                <th className={`${thBase} align-bottom`} rowSpan={2}>Zone Incharge</th>
                <th className={`${thBase} align-bottom`} rowSpan={2}>Block Incharge</th>
                <th className={`${thBase} align-bottom`} rowSpan={2}>Block</th>
                <th className={`${thBase} align-bottom`} rowSpan={2}>Surveyor</th>
                <th className={`${thBase}`} colSpan={2}>Priv.Day No</th>
                <th className={`${thBase}`} colSpan={15}>Hourly On Date Plot</th>
                <th className={`${thBase}`} colSpan={2}>On Date No.</th>
                <th className={`${thBase}`} colSpan={2}>To Date No.</th>
                <th className={`${thBase}`} colSpan={2}>Todate Avg.</th>
                <th className={`${thBase}`} colSpan={2}>Non Mem. %</th>
                <th className={`${thBase}`} colSpan={1}>Total Working Days</th>
              </tr>
              <tr>
                <th className={thBase}>PLOT</th>
                <th className={thBase}>AREA</th>
                {[6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20].map((hr) => (
                  <th key={`h-${hr}`} className={thBase}>{hr}Hr</th>
                ))}
                <th className={thBase}>PLOT</th>
                <th className={thBase}>AREA</th>
                <th className={thBase}>PLOT</th>
                <th className={thBase}>AREA</th>
                <th className={thBase}>Plot</th>
                <th className={thBase}>Area</th>
                <th className={thBase}>Ondate</th>
                <th className={thBase}>Todate</th>
                <th className={thBase}></th>
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
                    <td className={tdBase}>{row.Manager}</td>
                    <td className={tdBase}>{row.Blockincharge}</td>
                    <td className={tdBase}>{row.Zone}</td>
                    <td className={tdBase}>{row.Surveyor}</td>
                    <td className={`${tdBase} text-right`}>{toNum(row.PDNPlot)}</td>
                    <td className={`${tdBase} text-right`}>{row.PDNArea}</td>
                    {[6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20].map((hr) => (
                      <td key={`${idx}-${hr}`} className={`${tdBase} text-center`}>{toNum(row[`Hr${hr}`])}</td>
                    ))}
                    <td className={`${tdBase} text-right`}>{toNum(row.NoPlotOnDate)}</td>
                    <td className={`${tdBase} text-right`}>{row.AreaOnDate}</td>
                    <td className={`${tdBase} text-right`}>{toNum(row.NoPlotToDate)}</td>
                    <td className={`${tdBase} text-right`}>{row.AreaToDate}</td>
                    <td className={`${tdBase} text-right`}>{row.AreaTotalAvg}</td>
                    <td className={`${tdBase} text-right`}>{row.PlotTotalAvg}</td>
                    <td className={`${tdBase} text-right`}>{row.NonMemOnDatePer}</td>
                    <td className={`${tdBase} text-right`}>{row.NonMemToDatePre}</td>
                    <td className={`${tdBase} text-right`}>{row.TotalWorkingDays}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {!loading && rows.length === 0 && (
        <div className="border border-gray-200 rounded-lg bg-white min-h-[250px] flex flex-col items-center justify-center text-gray-400">
          <p className="text-sm">Select a factory and date, then click <strong>Search</strong>.</p>
        </div>
      )}
    </div>
  );
};

export default SurveyReport_DailyTeamWiseHourlySurveyProgressReport;
