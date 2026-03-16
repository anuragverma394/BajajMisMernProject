import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast, Toaster } from 'react-hot-toast';
import { reportService, masterService } from '../../microservices/api.service';
import '../../styles/Report.css';
import '../../styles/HourlyCaneArrival.css'; // Reusing premium report layout styles
import { openPrintWindow } from '../../utils/print';
const __cx = (...vals) => vals.filter(Boolean).join(" ");
const Report_EffectedCaneAreaReport = () => {
  const navigate = useNavigate();
  const [factories, setFactories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [reportData, setReportData] = useState([]);
  const [filters, setFilters] = useState({
    F_code: '',
    CaneArea: '1',
    stateDropdown: '2'
  });

  useEffect(() => {
    const loadUnits = async () => {
      try {
        const units = await masterService.getUnits();
        setFactories(units);
      } catch (error) {
        toast.error("Failed to load factory units");
      }
    };
    loadUnits();
  }, []);

  const handleSearch = async () => {
    if (!filters.F_code) {
      toast.error("Please select a factory unit");
      return;
    }
    setLoading(true);
    try {
      const response = await reportService.getEffectedCaneAreaReport({
        F_code: filters.F_code,
        CaneArea: filters.CaneArea,
        stateDropdown: filters.F_code === '63' ? filters.stateDropdown : ''
      });
      setReportData(response.data || response || []);
      toast.success("Analysis complete");
    } catch (error) {
      toast.error("An error occurred during verification");
      setReportData([]);
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = () => {
    const printContent = document.getElementById('effected-report-print');
    openPrintWindow({
      title: "Effected Cane Area Report",
      contentHtml: printContent ? printContent.outerHTML : ""
    });
  };

  const handleExport = () => {
    if (reportData.length === 0) return;
    const csvContent = "data:text/csv;charset=utf-8," +
    Object.keys(reportData[0]).join(",") + "\n" +
    reportData.map((row) => Object.values(row).join(",")).join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `EffectedCaneArea_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
  };

  return (
    <div className="p-[20px] bg-white min-h-[100vh] font-['Poppins', Arial, sans-serif]">
            <Toaster position="top-right" />

            <div className={__cx("page-card", "rounded-lg border-0 shadow-[0 4px 12px rgba(0,0,0,0.1)]")}>
                <div className={__cx("page-card-header", "text-left text-[15px] py-[12px] px-[20px] bg-[#1F9E8A]")}>
                    Effected Cane Area Report
                </div>
                <div className="bg-[#e2efda] py-[10px] px-[20px] text-[13px] text-[#333] border-b border-b-[#c8e6c9] font-bold">
                    Effected Cane Area Report Season 2526 (Only Final Villages)
                </div>

                <div className={__cx("page-card-body", "p-[20px]")}>
                    <div className={__cx("form-row", "flex gap-[20px] items-end mb-[20px]")}>
                        <div className={__cx("form-group", "min-w-[350px]")}>
                            <label className="block text-[12px] font-bold text-[#333] mb-[4px]">Type of cane Area</label>
                            <select
                className={__cx("form-control", "w-[100%] p-[8px] border border-[#ccc] rounded")}
                value={filters.CaneArea}
                onChange={(e) => setFilters({ ...filters, CaneArea: e.target.value })}>

                
                                <option value="1">As Per First Survey</option>
                                <option value="2">As per caneup Portal</option>
                            </select>
                        </div>
                        <div className={__cx("form-group", "min-w-[350px]")}>
                            <label className="block text-[12px] font-bold text-[#333] mb-[4px]">Factory</label>
                            <select
                className={__cx("form-control", "w-[100%] p-[8px] border border-[#ccc] rounded")}
                value={filters.F_code}
                onChange={(e) => setFilters({ ...filters, F_code: e.target.value })}>

                
                                <option value="All">All</option>
                                {factories.map((f, idx) => <option key={`${f.id ?? 'factory'}-${idx}`} value={f.id}>{f.name}</option>)}
                            </select>
                        </div>
                        {filters.F_code === '63' &&
            <div className={__cx("form-group", "min-w-[350px]")}>
                                <label className="block text-[12px] font-bold text-[#333] mb-[4px]">Target State</label>
                                <select
                className={__cx("form-control", "w-[100%] p-[8px] border border-[#ccc] rounded")}
                value={filters.stateDropdown}
                onChange={(e) => setFilters({ ...filters, stateDropdown: e.target.value })}>

                
                                    <option value="2">All States</option>
                                    <option value="0">Uttar Pradesh (U.P)</option>
                                    <option value="1">Bihar</option>
                                </select>
                            </div>
            }
                    </div>

                    <div className={__cx("form-actions", "flex gap-[8px] mt-[10px]")}>
                        <button className={__cx("btn", "py-[8px] px-[16px] bg-[#1F9E8A] text-white border-0 rounded cursor-pointer")} onClick={handleSearch} disabled={loading}>
                            {loading ? 'Searching...' : 'Search'}
                        </button>
                        <button className={__cx("btn", "py-[8px] px-[16px] bg-[#1F9E8A] text-white border-0 rounded cursor-pointer")} onClick={handleExport} disabled={!reportData.length}>
                            Excel
                        </button>
                        <button className={__cx("btn", "py-[8px] px-[16px] bg-[#1F9E8A] text-white border-0 rounded cursor-pointer")} onClick={handlePrint} disabled={!reportData.length}>
                            Print
                        </button>
                        <button className={__cx("btn", "py-[8px] px-[16px] bg-[#1F9E8A] text-white border-0 rounded cursor-pointer")} onClick={() => navigate(-1)}>
                            Exit
                        </button>
                    </div>
                </div>

                {reportData.length > 0 ?
        <div className="report-main-content mt-6 animate-in slide-in-from-bottom duration-500" id="effected-report-print">
                        <div className="table-wrapper-premium">
                            <table className="table-premium">
                                <thead>
                                    <tr>
                                        <th className="w-16">Sr. No.</th>
                                        <th className="w-24">Village Code</th>
                                        <th className="text-left">Village Name</th>
                                        <th className="text-right">Baseline Area (Ha)</th>
                                        <th className="text-right">Effected Area (Ha)</th>
                                        <th>Impact Analysis / Remarks</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {reportData.map((row, idx) =>
                <tr key={idx}>
                                            <td className="font-mono text-slate-400">{idx + 1}</td>
                                            <td className="font-black">{row.V_Code || row.v_Code}</td>
                                            <td>{row.V_Name || row.v_Name}</td>
                                            <td className="text-right font-mono">{row.CaneArea || row.caneArea}</td>
                                            <td className="text-right font-black text-rose-600 font-mono italic">
                                                {row.EffectedArea || row.effectedArea}
                                            </td>
                                            <td>
                                                <div className="flex items-center gap-2">
                                                    <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse"></span>
                                                    <span className="text-xs italic">{row.Remarks || row.remarks || 'Critical Impact Noted'}</span>
                                                </div>
                                            </td>
                                        </tr>
                )}
                                </tbody>
                                <tfoot>
                                    <tr>
                                        <td colSpan="3" className="font-bold text-lg">CUMULATIVE ASSESSMENT</td>
                                        <td className="text-right font-black text-lg">
                                            {reportData.reduce((acc, curr) => acc + (parseFloat(curr.CaneArea || curr.caneArea) || 0), 0).toFixed(3)}
                                        </td>
                                        <td className="text-right font-black text-rose-600 text-xl italic">
                                            {reportData.reduce((acc, curr) => acc + (parseFloat(curr.EffectedArea || curr.effectedArea) || 0), 0).toFixed(3)}
                                        </td>
                                        <td>
                                            <div className={__cx("aggregate-box", "bg-[#fef2f2] border border-[#fee2e2]")}>
                                                <span className="aggregate-value text-rose-600">
                                                    {(reportData.reduce((acc, curr) => acc + (parseFloat(curr.EffectedArea || curr.effectedArea) || 0), 0) / (reportData.reduce((acc, curr) => acc + (parseFloat(curr.CaneArea || curr.caneArea) || 0), 0) || 1) * 100).toFixed(2)}%
                                                </span>
                                                <span className="aggregate-label text-rose-400">Yield Impact Ratio</span>
                                            </div>
                                        </td>
                                    </tr>
                                </tfoot>
                            </table>
                        </div>
                    </div> :
        !loading &&
        <div className="empty-state-premium mt-12">
                        <div className="empty-icon-box">
                            <i className="fas fa-map-marked-alt text-slate-300"></i>
                        </div>
                        <h3 className="empty-title">Impact Engine Ready</h3>
                        <p className="empty-subtitle">Initialize audit to visualize geographical area damage and production risks.</p>
                    </div>
        }
            </div>
        </div>);

};

export default Report_EffectedCaneAreaReport;
