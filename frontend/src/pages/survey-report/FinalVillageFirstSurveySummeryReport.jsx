import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast, Toaster } from 'react-hot-toast';
import { surveyService, masterService } from '../../microservices/api.service';
import '../../styles/base.css';

const SurveyReport_FinalVillageFirstSurveySummeryReport = () => {
  const navigate = useNavigate();
  const tableRef = useRef(null);
  const [caneType, setCaneType] = useState('As Per First Survey');
  const [isLoading, setIsLoading] = useState(false);
  const [reportData, setReportData] = useState([]);
  const [totals, setTotals] = useState(null);

  useEffect(() => {
    masterService.getUnits().catch(() => {});
  }, []);

  const handleSearch = async (e) => {
    if (e) e.preventDefault();
    setIsLoading(true);
    try {
      const params = { caneType };
      const response = await surveyService.getFinalVillageFirstSurveySummery(params);
      const rows = response?.data || response || [];
      setReportData(Array.isArray(rows) ? rows : []);
      setTotals(response?.totals || null);
      toast.success('Report loaded');
    } catch (error) {
      toast.error('Failed to load report');
    } finally {
      setIsLoading(false);
    }
  };

  const exportTableToCSV = () => {
    if (!tableRef.current) return;
    const rows = Array.from(tableRef.current.querySelectorAll('tr'));
    const csv = rows
      .map((row) =>
        Array.from(row.querySelectorAll('th,td'))
          .map((cell) => `"${String(cell.innerText || '').replace(/\n/g, ' ').replace(/"/g, '""')}"`)
          .join(',')
      )
      .join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'FinalVillageFirstSurveySummary.csv';
    link.click();
    URL.revokeObjectURL(url);
  };

  const format = (value) => {
    const num = Number(String(value ?? '').replace(/,/g, ''));
    return Number.isFinite(num) ? num.toFixed(3) : '0.000';
  };

  const totalsRow = totals || {};

  return (
    <div className="p-5 bg-white min-h-screen font-[Segoe_UI,Tahoma,Geneva,Verdana,sans-serif]">
      <Toaster position="top-right" />

      <div className="bg-[#16a085] text-white py-2.5 px-5 text-sm font-semibold rounded-t-md">
        Final Village First Survey Summary Report
      </div>

      <div className="border border-[#e2e8f0] rounded-b-md">
        <div className="p-6 border border-[#e2e8f0] rounded-lg bg-white shadow-sm mb-5 relative">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-4">
            <div>
              <label className="block text-[13px] font-semibold text-[#333] mb-2">Type of cane Area</label>
              <select
                value={caneType}
                onChange={(e) => setCaneType(e.target.value)}
                className="w-full py-2 px-3 border border-[#cbd5e1] rounded text-[13px] bg-white"
              >
                <option value="As Per First Survey">As Per First Survey</option>
                <option value="Caneup Portal">Caneup Portal</option>
              </select>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              onClick={handleSearch}
              disabled={isLoading}
              className="px-5 py-2 rounded text-[13px] font-medium text-white bg-[#16a085]"
            >
              {isLoading ? 'Loading...' : 'Search'}
            </button>
            <button
              onClick={exportTableToCSV}
              className="px-5 py-2 rounded text-[13px] font-medium text-white bg-[#16a085]"
            >
              Excel
            </button>
            <button
              onClick={() => window.print()}
              className="px-5 py-2 rounded text-[13px] font-medium text-white bg-[#16a085]"
            >
              Print
            </button>
            <button
              onClick={() => navigate(-1)}
              className="px-5 py-2 rounded text-[13px] font-medium text-white bg-[#16a085]"
            >
              Exit
            </button>
          </div>
        </div>

        <div className="px-5 pb-5">
          <div className="overflow-x-auto border border-[#e2e8f0] rounded">
            <table ref={tableRef} className="min-w-[1200px] w-full text-[12px]">
              <thead>
                <tr className="bg-[#dff0d8] text-[#000]">
                  <th className="border border-[#a7c7a1] p-2" rowSpan={2}>S.No</th>
                  <th className="border border-[#a7c7a1] p-2" rowSpan={2}>Factory</th>
                  <th className="border border-[#a7c7a1] p-2" rowSpan={2}>Factory Name</th>
                  <th className="border border-[#a7c7a1] p-2 text-center" colSpan={4}>Actual Survey 2024-25 (Hect.)</th>
                  <th className="border border-[#a7c7a1] p-2 text-center" colSpan={4}>Actual Survey 2025-26 (Hect.)</th>
                  <th className="border border-[#a7c7a1] p-2" rowSpan={2}>Variance (Hect.)</th>
                  <th className="border border-[#a7c7a1] p-2" rowSpan={2}>Variance (%)</th>
                  <th className="border border-[#a7c7a1] p-2" rowSpan={2}>Ratoon vs LY Plant (%)</th>
                </tr>
                <tr className="bg-[#dff0d8] text-[#000]">
                  <th className="border border-[#a7c7a1] p-2">Ratoon</th>
                  <th className="border border-[#a7c7a1] p-2">Autumn</th>
                  <th className="border border-[#a7c7a1] p-2">Plant</th>
                  <th className="border border-[#a7c7a1] p-2">Total</th>
                  <th className="border border-[#a7c7a1] p-2">Ratoon</th>
                  <th className="border border-[#a7c7a1] p-2">Autumn</th>
                  <th className="border border-[#a7c7a1] p-2">Plant</th>
                  <th className="border border-[#a7c7a1] p-2">Total</th>
                </tr>
              </thead>
              <tbody>
                {reportData.length === 0 ? (
                  <tr>
                    <td colSpan={14} className="text-center p-4">No data found.</td>
                  </tr>
                ) : (
                  reportData.map((row, idx) => (
                    <tr key={idx} className="even:bg-[#f8fbf8]">
                      <td className="border border-[#a7c7a1] p-2 text-center">{idx + 1}</td>
                      <td className="border border-[#a7c7a1] p-2 text-center">{row.Factory ?? row.fact ?? ''}</td>
                      <td className="border border-[#a7c7a1] p-2">{row.FactName ?? row.FactoryName ?? ''}</td>
                      <td className="border border-[#a7c7a1] p-2 text-right">{format(row.RATOON_LY)}</td>
                      <td className="border border-[#a7c7a1] p-2 text-right">{format(row.AUTUMN_LY)}</td>
                      <td className="border border-[#a7c7a1] p-2 text-right">{format(row.PLANT_LY)}</td>
                      <td className="border border-[#a7c7a1] p-2 text-right">{format(row.Total_LY)}</td>
                      <td className="border border-[#a7c7a1] p-2 text-right">{format(row.RATOON)}</td>
                      <td className="border border-[#a7c7a1] p-2 text-right">{format(row.AUTUMN)}</td>
                      <td className="border border-[#a7c7a1] p-2 text-right">{format(row.PLANT)}</td>
                      <td className="border border-[#a7c7a1] p-2 text-right">{format(row.Total)}</td>
                      <td className="border border-[#a7c7a1] p-2 text-right">{format(row.TotalDiff)}</td>
                      <td className="border border-[#a7c7a1] p-2 text-right">{format(row.TotalDiffPer)}</td>
                      <td className="border border-[#a7c7a1] p-2 text-right">{format(row.RatoonAgainst)}</td>
                    </tr>
                  ))
                )}
              </tbody>
              {reportData.length > 0 && (
                <tfoot>
                  <tr className="bg-[#e6f3e6] font-semibold">
                    <td className="border border-[#a7c7a1] p-2 text-center" colSpan={3}>Total</td>
                    <td className="border border-[#a7c7a1] p-2 text-right">{format(totalsRow.RATOON_LY)}</td>
                    <td className="border border-[#a7c7a1] p-2 text-right">{format(totalsRow.AUTUMN_LY)}</td>
                    <td className="border border-[#a7c7a1] p-2 text-right">{format(totalsRow.PLANT_LY)}</td>
                    <td className="border border-[#a7c7a1] p-2 text-right">{format(totalsRow.Total_LY)}</td>
                    <td className="border border-[#a7c7a1] p-2 text-right">{format(totalsRow.RATOON)}</td>
                    <td className="border border-[#a7c7a1] p-2 text-right">{format(totalsRow.AUTUMN)}</td>
                    <td className="border border-[#a7c7a1] p-2 text-right">{format(totalsRow.PLANT)}</td>
                    <td className="border border-[#a7c7a1] p-2 text-right">{format(totalsRow.Total)}</td>
                    <td className="border border-[#a7c7a1] p-2 text-right">{format(totalsRow.TotalDiff)}</td>
                    <td className="border border-[#a7c7a1] p-2 text-right">{format(totalsRow.TotalDiffPer)}</td>
                    <td className="border border-[#a7c7a1] p-2 text-right">{format(totalsRow.RatoonAgainst)}</td>
                  </tr>
                </tfoot>
              )}
            </table>
          </div>
        </div>
      </div>

      <footer className="mt-5 text-[11px] text-[#999] px-5">
        2021 © Bajaj Hindusthan Sugar Ltd. All Rights Reserved. Designed & Developed By Vibrant IT Solutions Pvt. Ltd.
      </footer>
    </div>
  );
};

export default SurveyReport_FinalVillageFirstSurveySummeryReport;
