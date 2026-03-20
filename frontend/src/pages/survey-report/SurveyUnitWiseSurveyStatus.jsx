import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast, Toaster } from 'react-hot-toast';
import { masterService, surveyService } from '../../microservices/api.service';

const SurveyReport_SurveyUnitWiseSurveyStatus = () => {
  const navigate = useNavigate();
  const [units, setUnits] = useState([]);
  const [loading, setLoading] = useState(false);
  const [rows, setRows] = useState([]);
  const [filters, setFilters] = useState({
    F_code: '0',
    CaneType: '1'
  });

  useEffect(() => {
    const loadUnits = async () => {
      try {
        const data = await masterService.getUnits();
        const normalized = Array.isArray(data)
          ? data
              .map((u) => ({
                code: String(u?.F_Code || u?.f_Code || u?.id || '').trim(),
                name: String(u?.F_Name || u?.f_Name || u?.name || '').trim()
              }))
              .filter((u) => u.code)
          : [];
        setUnits(normalized);
      } catch {
        toast.error('Failed to load units.');
      }
    };
    loadUnits();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFilters((prev) => ({ ...prev, [name]: value }));
  };

  const handleSearch = async () => {
    setLoading(true);
    try {
      const response = await surveyService.getSurveyUnitWiseStatus(filters);
      const data = response?.data ?? response ?? [];
      if (Array.isArray(data) && data.length > 0) {
        setRows(data);
        toast.success(`Loaded ${data.length} rows.`);
      } else {
        setRows([]);
        toast('No data found.', { icon: 'ℹ️' });
      }
    } catch {
      setRows([]);
      toast.error('Failed to fetch report data.');
    } finally {
      setLoading(false);
    }
  };

  const tableId = 'unit-wise-survey-status-table';
  const thBase =
    'px-3 py-2 border border-[#a6c5a6] bg-[#dff0d8] text-[#1b3b2f] text-xs font-semibold text-center whitespace-nowrap';
  const tdBase = 'px-3 py-2 border-b border-[#cfe0cf] text-xs text-center whitespace-nowrap';

  const unitOptions = useMemo(
    () => [
      { code: '0', name: 'All' },
      ...units
    ],
    [units]
  );

  return (
    <div className="min-h-screen bg-gray-50 p-4 font-sans">
      <Toaster position="top-right" />

      <div className="bg-[#129a81] text-white px-5 py-3 text-sm font-semibold rounded-t-lg mb-px">
        Unit Wise Survey Report
      </div>

      <div className="border border-gray-200 rounded-b-lg bg-white shadow-sm mb-4">
        <div className="bg-[#dff0d8] text-[#1b3b2f] px-5 py-2 text-xs font-semibold border-b border-[#c7d9c5]">
          Unit Wise Survey Report
        </div>
        <div className="p-5">
          <div className="flex flex-wrap gap-5 mb-5 items-end">
            <div className="w-64">
              <label className="block text-xs font-semibold text-gray-700 mb-1.5">Type of cane Area</label>
              <select
                name="CaneType"
                value={filters.CaneType}
                onChange={handleChange}
                className="w-full border border-gray-300 rounded px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-teal-500"
              >
                <option value="1">As Per First Survey</option>
                <option value="2">As Per Caneup Portal</option>
              </select>
            </div>
            <div className="w-64">
              <label className="block text-xs font-semibold text-gray-700 mb-1.5">Factory</label>
              <select
                name="F_code"
                value={filters.F_code}
                onChange={handleChange}
                className="w-full border border-gray-300 rounded px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-teal-500"
              >
                {unitOptions.map((u) => (
                  <option key={u.code} value={u.code}>
                    {u.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              onClick={handleSearch}
              disabled={loading}
              className="px-5 py-2 rounded text-sm font-medium text-white bg-[#129a81] hover:bg-[#0f7f68] disabled:opacity-60 transition-colors min-w-[80px]"
            >
              {loading ? 'Loading...' : 'Search'}
            </button>
            <button
              onClick={() => window.exportTableToCSV?.(tableId, 'UNIT_WISE_SURVEY_REPORT')}
              className="px-5 py-2 rounded text-sm font-medium text-white bg-[#129a81] hover:bg-[#0f7f68] transition-colors"
            >
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
          <table id={tableId} className="w-full text-xs border-collapse">
            <thead>
              <tr>
                <th rowSpan={2} className={thBase}>S.No</th>
                <th rowSpan={2} className={thBase}>Unit Name</th>
                <th rowSpan={2} className={thBase}>Survey Start Date</th>
                <th rowSpan={2} className={thBase}>Total No of Village</th>
                <th colSpan={2} className={thBase}>Village Under Finalization</th>
                <th colSpan={2} className={thBase}>Final Village (Uploaded on ERP)</th>
                <th colSpan={2} className={thBase}>Village Under Survey</th>
                <th colSpan={2} className={thBase}>Total Survey</th>
                <th rowSpan={2} className={thBase}>Balance Village</th>
              </tr>
              <tr>
                <th className={thBase}>No</th>
                <th className={thBase}>Area</th>
                <th className={thBase}>No</th>
                <th className={thBase}>Area</th>
                <th className={thBase}>No</th>
                <th className={thBase}>Area</th>
                <th className={thBase}>No</th>
                <th className={thBase}>Area</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row, idx) => {
                const isTotal = ['West Zone', 'Central Zone', 'Eeast Zone', 'Total'].includes(
                  String(row.Factory || '').trim()
                );
                return (
                  <tr
                    key={idx}
                    className={
                      isTotal ? 'bg-[#dff0d8] font-semibold' : idx % 2 === 0 ? 'bg-white' : 'bg-[#f7fbf8]'
                    }
                  >
                    <td className={`${tdBase} text-center`}>{row.SN}</td>
                    <td className={`${tdBase} text-left`}>{row.Factory}</td>
                    <td className={tdBase}>{row.SurStartDate}</td>
                    <td className={tdBase}>{row.TVillage}</td>
                    <td className={tdBase}>{row.VillageCNo}</td>
                    <td className={tdBase}>{row.VillageCArea}</td>
                    <td className={tdBase}>{row.VillageRFANo}</td>
                    <td className={tdBase}>{row.VillageRFAArea}</td>
                    <td className={tdBase}>{row.VillageUPNo}</td>
                    <td className={tdBase}>{row.VillageUPArea}</td>
                    <td className={tdBase}>{row.TotalSNo}</td>
                    <td className={tdBase}>{row.TotalSArea}</td>
                    <td className={tdBase}>{row.BalVillage}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {!loading && rows.length === 0 && (
        <div className="border border-gray-200 rounded-lg bg-white min-h-[220px] flex flex-col items-center justify-center text-gray-400">
          <svg className="h-10 w-10 mb-3 opacity-40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 17v-2a4 4 0 014-4h0a4 4 0 014 4v2M3 17v-2a4 4 0 014-4h0" />
          </svg>
          <p className="text-sm">Select filters and click Search.</p>
        </div>
      )}
    </div>
  );
};

export default SurveyReport_SurveyUnitWiseSurveyStatus;
