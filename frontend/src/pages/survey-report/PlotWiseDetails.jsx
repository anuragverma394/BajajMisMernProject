import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast, Toaster } from 'react-hot-toast';
import { surveyService, masterService } from '../../microservices/api.service';
import '../../styles/SurveyReports.css';
import { openPrintWindow } from '../../utils/print';
const __cx = (...vals) => vals.filter(Boolean).join(" ");

const SurveyReport_PlotWiseDetails = () => {
  const navigate = useNavigate();
  const [factories, setFactories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [reportData, setReportData] = useState([]);
  const [filters, setFilters] = useState({
    F_code: '',
    date: new Date().toISOString().split('T')[0],
    catg: '0'
  });

  useEffect(() => {
    const loadUnits = async () => {
      try {
        const units = await masterService.getUnits();
        setFactories(units);
        if (units.length > 0) {
          setFilters((prev) => ({ ...prev, F_code: units[0].F_Code || units[0].id }));
        }
      } catch (error) {
        toast.error("Telemetry link failure: Unit master offline");
      }
    };
    loadUnits();
  }, []);

  const handleSearch = async (e) => {
    if (e) e.preventDefault();
    if (!filters.F_code) {
      toast.error("Command node identification required");
      return;
    }

    setLoading(true);
    try {
      const response = await surveyService.getPlotWiseDetails(filters);
      setReportData(response.data || response || []);
      toast.success("Geospatial sweep complete: Data synchronized");
    } catch (error) {
      toast.error("Anomalous data flux: Plot lookup aborted");
      setReportData([]);
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = () => {
    const content = document.getElementById('plot-report-print');
    openPrintWindow({
      title: "Plot Wise Details Report",
      subtitle: `Unit: ${filters.F_code} | Date: ${filters.date}`,
      contentHtml: content ? content.outerHTML : ""
    });
  };

  return (
    <div className="p-[20px] bg-white min-h-[100vh] font-['Poppins', Arial, sans-serif]">
            <Toaster position="top-right" />

            <div className={__cx("page-card", "rounded-lg border-0 shadow-[0 4px 12px rgba(0,0,0,0.1)]")}>
                <div className={__cx("page-card-header", "text-left text-[15px] py-[12px] px-[20px] bg-[#1F9E8A]")}>
                    Plot Wise Details Report
                </div>
                <div className="bg-[#e2efda] py-[10px] px-[20px] text-[13px] text-[#333] border-b border-b-[#c8e6c9] font-bold">
                    Plot Wise Details Report
                </div>

                <div className={__cx("page-card-body", "p-[20px]")}>
                    <div className={__cx("form-row", "flex gap-[20px] items-end mb-[20px]")}>
                        <div className={__cx("form-group", "min-w-[350px]")}>
                            <label className="block text-[12px] font-bold text-[#333] mb-[4px]">Factory</label>
                            <select
                className={__cx("form-control", "w-[100%] p-[8px] border border-[#ccc] rounded")}
                value={filters.F_code}
                onChange={(e) => setFilters({ ...filters, F_code: e.target.value })}

                required>
                
                                <option value="">-Select Factory-</option>
                                {factories.map((f, idx) => <option key={`${f.F_Code || f.id}-${idx}`} value={f.F_Code || f.id}>{f.F_Name || f.name}</option>)}
                            </select>
                        </div>
                        <div className={__cx("form-group", "min-w-[350px]")}>
                            <label className="block text-[12px] font-bold text-[#333] mb-[4px]">Date</label>
                            <input
                type="date"
                className={__cx("form-control", "w-[100%] p-[8px] border border-[#ccc] rounded")}
                value={filters.date}
                onChange={(e) => setFilters({ ...filters, date: e.target.value })} />

              
                        </div>
                        <div className={__cx("form-group", "min-w-[350px]")}>
                            <label className="block text-[12px] font-bold text-[#333] mb-[4px]">Category</label>
                            <select
                className={__cx("form-control", "w-[100%] p-[8px] border border-[#ccc] rounded")}
                value={filters.catg}
                onChange={(e) => setFilters({ ...filters, catg: e.target.value })}>

                
                                <option value="0">ALL</option>
                                <option value="1">Area Dominant (H » L)</option>
                                <option value="2">Area Minor (L » H)</option>
                            </select>
                        </div>
                    </div>

                    <div className={__cx("form-actions", "flex gap-[8px] mt-[10px]")}>
                        <button className={__cx("btn", "py-[8px] px-[16px] bg-[#1F9E8A] text-white border-0 rounded cursor-pointer")} onClick={handleSearch} disabled={loading}>
                            {loading ? 'Searching...' : 'Search'}
                        </button>
                        <button className={__cx("btn", "py-[8px] px-[16px] bg-[#1F9E8A] text-white border-0 rounded cursor-pointer")} disabled={!reportData.length}>
                            Export
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
        <div className="space-y-10 animate-in slide-in-from-bottom-10 duration-1000" id="plot-report-print">
                        <div className="bg-white rounded-[4rem] shadow-2xl border border-white overflow-hidden">
                            <div className="px-10 py-8 border-b border-slate-50 flex justify-between items-center bg-slate-50/50">
                                <h3 className="font-black text-slate-800 uppercase tracking-widest text-[13px]">Dimensional Plot Matrix</h3>
                                <div className="flex gap-2 bg-white p-1 rounded-xl shadow-inner border border-slate-100">
                                    <div className="px-4 py-2 bg-emerald-600 text-white rounded-lg text-[9px] font-black uppercase tracking-widest">Active Survey</div>
                                    <div className="px-4 py-2 text-slate-400 rounded-lg text-[9px] font-black uppercase tracking-widest">Validated</div>
                                </div>
                            </div>
                            <div className="table-wrapper-premium overflow-x-auto p-4">
                                <table className="table-premium w-full border-separate border-spacing-0">
                                    <thead>
                                        <tr className="bg-slate-900 text-white">
                                            <th className="p-6 text-center text-[10px] font-black uppercase border-r border-slate-800 rounded-tl-[3.5rem]">Idx</th>
                                            <th className="p-6 text-left text-[10px] font-black uppercase border-r border-slate-800">Cluster Node</th>
                                            <th className="p-6 text-left text-[10px] font-black uppercase border-r border-slate-800">Entity Alias</th>
                                            <th className="p-6 text-center text-[10px] font-black uppercase border-r border-slate-800 bg-emerald-900 text-emerald-400">Plot Node</th>
                                            <th className="p-6 text-center text-[10px] font-black uppercase border-r border-slate-800 bg-emerald-950 text-emerald-500">Area Metric</th>
                                            <th className="p-6 text-center text-[10px] font-black uppercase border-r border-slate-800">Category</th>
                                            <th className="p-6 text-center text-[10px] font-black uppercase border-r border-slate-800">Type</th>
                                            <th className="p-6 text-center text-[10px] font-black uppercase border-r border-slate-800">Surveyor</th>
                                            <th className="p-6 text-center text-[10px] font-black uppercase border-r border-slate-800">Coordinates</th>
                                            <th className="p-6 text-center text-[10px] font-black uppercase bg-indigo-900 text-indigo-400 rounded-tr-[3.5rem]">Accuracy</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {reportData.map((row, idx) =>
                  <tr key={idx} className="hover:bg-emerald-50/50 transition-all border-b border-slate-50 group">
                                                <td className="p-4 text-center mono text-[10px] text-slate-300 border-r border-slate-50">[{idx + 1}]</td>
                                                <td className="p-4 text-left font-black text-slate-700 border-r border-slate-50 whitespace-nowrap italic">{row.VillageName || row.Village || row.village}</td>
                                                <td className="p-4 text-left border-r border-slate-50">
                                                    <div className="font-black text-slate-800">{row.GrowerName || row.Grower || row.grower}</div>
                                                    <div className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{row.FatherName || '-'}</div>
                                                </td>
                                                <td className="p-4 text-center mono font-black text-emerald-600 border-r border-slate-50 bg-emerald-50/20">{row.PlotNo || row.plotNo}</td>
                                                <td className="p-4 text-center mono font-black text-emerald-900 border-r border-slate-50 bg-emerald-100/30">{row.Area || row.area}</td>
                                                <td className="p-4 text-center border-r border-slate-50">
                                                    <span className="px-3 py-1 bg-slate-100 text-slate-500 rounded-full text-[9px] font-black uppercase tracking-wider">{row.Category || row.VarietyName}</span>
                                                </td>
                                                <td className="p-4 text-center border-r border-slate-50 text-[10px] font-black text-slate-400">{row.CaneType || '-'}</td>
                                                <td className="p-4 text-center border-r border-slate-50">
                                                    <div className="text-[10px] font-black text-slate-700">{row.Surveyor || '-'}</div>
                                                    <div className="text-[8px] mono text-slate-400">{row.SurveyDate || '-'}</div>
                                                </td>
                                                <td className="p-4 text-center mono border-r border-slate-50 group-hover:scale-105 transition-transform">
                                                    <div className="text-[9px] text-emerald-600 flex flex-col">
                                                        <span>LAT: {parseFloat(row.Latitude).toFixed(6)}</span>
                                                        <span>LON: {parseFloat(row.Longitude).toFixed(6)}</span>
                                                    </div>
                                                </td>
                                                <td className={`p-4 text-center mono font-black ${parseFloat(row.Accuracy) < 10 ? 'text-emerald-500' : 'text-rose-500'}`}>
                                                    {row.Accuracy ? `±${row.Accuracy}m` : '-'}
                                                </td>
                                            </tr>
                  )}
                                    </tbody>
                                    <tfoot className="bg-slate-900 text-white border-t-4 border-emerald-500">
                                        <tr className="font-black uppercase tracking-tighter">
                                            <td colSpan="4" className="p-6 text-right text-[12px] text-emerald-400 border-r border-slate-800 rounded-bl-[3.5rem]">Collective Geospatial Area</td>
                                            <td className="p-6 text-center text-2xl mono text-white bg-emerald-500/10 border-r border-slate-800">
                                                {reportData.reduce((acc, curr) => acc + (parseFloat(curr.Area) || 0), 0).toFixed(3)}
                                            </td>
                                            <td colSpan="4" className="p-6 text-center text-slate-500 border-r border-slate-800">Validated Clusters: {new Set(reportData.map((r) => r.Village)).size}</td>
                                            <td className="p-6 text-center bg-indigo-600 rounded-br-[3.5rem]">
                                                <div className="flex flex-col">
                                                    <span className="text-xl">{(reportData.reduce((acc, curr) => acc + (parseFloat(curr.Accuracy) || 0), 0) / reportData.length).toFixed(2)}m</span>
                                                    <span className="text-[8px] opacity-60 uppercase tracking-widest">Avg Precision</span>
                                                </div>
                                            </td>
                                        </tr>
                                    </tfoot>
                                </table>
                            </div>
                        </div>
                    </div> :
        !loading &&
        <div className="py-40 flex flex-col items-center justify-center bg-white rounded-[4rem] shadow-2xl border border-white">
                        <div className="w-40 h-40 bg-emerald-50 rounded-full flex items-center justify-center mb-10 shadow-inner group hover:scale-110 transition-all duration-700">
                            <i className="fas fa-satellite-dish text-emerald-200 group-hover:text-emerald-500 text-6xl transition-colors"></i>
                        </div>
                        <h3 className="text-2xl font-black text-slate-800 tracking-tight italic uppercase">Plot Registry Latent</h3>
                        <p className="text-slate-400 text-center max-w-sm mt-4 font-bold uppercase tracking-widest text-[9px] leading-loose">
                            Select a factory node and chronos point to decrypt the geospatial plot distribution and sensor telemetry.
                        </p>
                    </div>
        }
            </div>
        </div>);

};

export default SurveyReport_PlotWiseDetails;
