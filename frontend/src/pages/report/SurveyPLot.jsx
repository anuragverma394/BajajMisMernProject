import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast, Toaster } from 'react-hot-toast';
import '../../styles/Report.css';

import { reportService, masterService } from '../../microservices/api.service';
import '../../styles/SurveyPLot.css';const __cx = (...vals) => vals.filter(Boolean).join(" ");const Report_SurveyPLot = () => {const navigate = useNavigate();const [factories, setFactories] = useState([]);const [loading, setLoading] = useState(false);const [activeTab, setActiveTab] = useState('checking'); // checking, disease
  const [summaryData, setSummaryData] = useState(null);
  const [diseaseData, setDiseaseData] = useState(null);

  const [filters, setFilters] = useState({
    unit: '',
    userName: '',
    fromDate: new Date().toISOString().split('T')[0],
    toDate: new Date().toISOString().split('T')[0],
    disease: ''
  });

  useEffect(() => {
    const loadUnits = async () => {
      try {
        const units = await masterService.getUnits(); // or masterService
        setFactories(units);
      } catch (error) {
        toast.error("Failed to load factory units");
      }
    };
    loadUnits();
  }, []);

  const handleSearch = async () => {
    if (!filters.unit) {
      toast.error("Please select a manufacturing unit");
      return;
    }
    setLoading(true);
    try {
      const params = {
        ...filters,
        activeTab: activeTab
      };
      const response = await reportService.getSurveyPlot(params);
      if (response.API_STATUS === "OK") {
        if (activeTab === 'checking') {
          setSummaryData(response.Data);
          setDiseaseData(null);
        } else {
          setDiseaseData(response.Data);
          setSummaryData(null);
        }
        toast.success("Survey checking data synchronized");
      } else {
        toast.error(response.Data || "Data Not Found");
      }
    } catch (error) {
      console.error('Fetch Error:', error);
      toast.error("Failed to fetch survey plot data");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-[20px] bg-white min-h-[100vh] font-['Poppins', Arial, sans-serif]">
            <Toaster position="top-right" />

            <div className={__cx("page-card", "rounded-lg border-0 shadow-[0 4px 12px rgba(0,0,0,0.1)]")}>
                <div className={__cx("page-card-header", "flex justify-between items-center text-[15px] py-[12px] px-[20px] bg-[#1F9E8A] text-white")}>
                    <span>Survey Plot Report</span>
                </div>
                <div className="bg-[#e2efda] py-[10px] px-[20px] text-[13px] text-[#333] border-b border-b-[#c8e6c9] font-bold">
                    Survey Plot Report
                </div>

                <div className={__cx("page-card-body", "p-[20px]")}>
                    <div className="mb-[20px] flex gap-[10px]">
                        <button onClick={() => setActiveTab('checking')} className={activeTab === "checking" ? "py-[8px] px-[16px] rounded border-[2px] border-[#1F9E8A] bg-[#e2efda] font-bold" : "py-[8px] px-[16px] rounded border border-[#ccc] bg-[#f9f9f9] font-bold"}>Checking Summary</button>
                        <button onClick={() => setActiveTab('disease')} className={activeTab === "disease" ? "py-[8px] px-[16px] rounded border-[2px] border-[#1F9E8A] bg-[#e2efda] font-bold" : "py-[8px] px-[16px] rounded border border-[#ccc] bg-[#f9f9f9] font-bold"}>Disease Affected</button>
                    </div>

                    <div className={__cx("form-row", "grid  gap-[20px]  mb-[20px]")}>
                        <div className="form-group">
                            <label className="block text-[12px] font-bold text-[#333] mb-[4px]">Manufacturing unit</label>
                            <select
                className={__cx("form-control", "w-[100%] p-[8px] border border-[#ccc] rounded")}
                value={filters.unit}
                onChange={(e) => setFilters({ ...filters, unit: e.target.value })}>

                
                                <option value="">-Select Unit-</option>
                                {factories.map((f, idx) => <option key={`${f.F_Code || f.id}-${idx}`} value={f.F_Code || f.id}>{f.F_Name || f.name}</option>)}
                            </select>
                        </div>
                        {activeTab === 'checking' ?
            <div className="form-group">
                                <label className="block text-[12px] font-bold text-[#333] mb-[4px]">Cane Officer Name</label>
                                <input
                type="text"
                className={__cx("form-control", "w-[100%] p-[8px] border border-[#ccc] rounded")}
                value={filters.userName}
                placeholder="Operator Code/Name"
                onChange={(e) => setFilters({ ...filters, userName: e.target.value })} />

              
                            </div> :

            <div className="form-group">
                                <label className="block text-[12px] font-bold text-[#333] mb-[4px]">Pathology Category</label>
                                <select
                className={__cx("form-control", "w-[100%] p-[8px] border border-[#ccc] rounded")}
                value={filters.disease}
                onChange={(e) => setFilters({ ...filters, disease: e.target.value })}>

                
                                    <option value="">-Select Disease-</option>
                                    <option value="RED_ROT">Red Rot</option>
                                    <option value="WILT">Wilt</option>
                                    <option value="SMUT">Smut</option>
                                </select>
                            </div>
            }
                        <div className="form-group">
                            <label className="block text-[12px] font-bold text-[#333] mb-[4px]">From Interval</label>
                            <input
                type="date"
                className={__cx("form-control", "w-[100%] p-[8px] border border-[#ccc] rounded")}
                value={filters.fromDate}
                onChange={(e) => setFilters({ ...filters, fromDate: e.target.value })} />

              
                        </div>
                        <div className="form-group">
                            <label className="block text-[12px] font-bold text-[#333] mb-[4px]">To Interval</label>
                            <input
                type="date"
                className={__cx("form-control", "w-[100%] p-[8px] border border-[#ccc] rounded")}
                value={filters.toDate}
                onChange={(e) => setFilters({ ...filters, toDate: e.target.value })} />

              
                        </div>
                    </div>

                    <div className={__cx("form-actions", "flex gap-[8px] mt-[10px]")}>
                        <button className={__cx("btn", "py-[8px] px-[16px] bg-[#1F9E8A] text-white border-0 rounded cursor-pointer")} onClick={handleSearch} disabled={loading}>
                            {loading ? 'Searching...' : 'Search'}
                        </button>
                        <button className={__cx("btn", "py-[8px] px-[16px] bg-[#1F9E8A] text-white border-0 rounded cursor-pointer")} onClick={() => toast.success("Compiling Excel Matrix...")}>
                            Excel
                        </button>
                        <button className={__cx("btn", "py-[8px] px-[16px] bg-[#1F9E8A] text-white border-0 rounded cursor-pointer")} onClick={() => navigate(-1)}>
                            Exit
                        </button>
                    </div>
                </div>

                {activeTab === 'checking' && summaryData &&
        <div className="p-10 max-w-full overflow-x-auto">
                        <table className="report-table border-collapse">
                            <thead>
                                <tr className="bg-emerald-600 text-slate-700">
                                    <th rowSpan="2" className="py-6 px-6 font-black uppercase text-[10px] border-r border-slate-200 rounded-tl-[2rem]">Identity</th>
                                    <th rowSpan="2" className="py-6 px-6 font-black uppercase text-[10px] border-r border-slate-200">Scope</th>
                                    <th colSpan="2" className="py-4 text-center font-black uppercase text-[10px] bg-emerald-700/50 border-r border-slate-200">Base Audit</th>
                                    <th colSpan="2" className="py-4 text-center font-black uppercase text-[10px] bg-amber-500/50 border-r border-slate-200">No Cane Detection</th>
                                    <th colSpan="2" className="py-4 text-center font-black uppercase text-[10px] bg-orange-500/50 border-r border-slate-200">Variety variance</th>
                                    <th colSpan="2" className="py-4 text-center font-black uppercase text-[10px] bg-rose-500/50 border-r border-slate-200">Pathometry Audit</th>
                                    <th rowSpan="2" className="py-6 px-6 font-black uppercase text-[10px] rounded-tr-[2rem]">Sat-Map</th>
                                </tr>
                                <tr className="bg-emerald-600 text-slate-700 border-t border-slate-200">
                                    <th className="py-3 px-4 text-center font-bold text-[9px] border-r border-slate-200">Plots</th>
                                    <th className="py-3 px-4 text-center font-bold text-[9px] border-r border-slate-200">Area (H)</th>
                                    <th className="py-3 px-4 text-center font-bold text-[9px] border-r border-slate-200">Count</th>
                                    <th className="py-3 px-4 text-center font-bold text-[9px] border-r border-slate-200">Area (H)</th>
                                    <th className="py-3 px-4 text-center font-bold text-[9px] border-r border-slate-200">Count</th>
                                    <th className="py-3 px-4 text-center font-bold text-[9px] border-r border-slate-200">Area (H)</th>
                                    <th className="py-3 px-4 text-center font-bold text-[9px] border-r border-slate-200">Count</th>
                                    <th className="py-3 px-4 text-center font-bold text-[9px] border-r border-slate-200">Area (H)</th>
                                </tr>
                            </thead>
                            <tbody>
                                {summaryData.map((user, i) =>
              <React.Fragment key={i}>
                                        <tr className="hover:bg-slate-50 transition-all border-b border-slate-100 group">
                                            <td rowSpan="3" className="py-8 px-6 bg-slate-50/50 border-r border-slate-100">
                                                <div className="flex flex-col">
                                                    <span className="text-xl font-black text-slate-800 tracking-tighter uppercase italic">{user.userName}</span>
                                                    <span className="text-[10px] font-bold text-emerald-600 tracking-widest mt-1">CODE: {user.userCode}</span>
                                                </div>
                                            </td>
                                            <td className="py-4 px-6 font-bold text-slate-500 text-[11px] uppercase border-r border-slate-50">Current Survey</td>
                                            <td className="text-center font-mono font-black text-slate-800 border-r border-slate-50">{user.current.plots}</td>
                                            <td className="text-center font-mono font-bold text-slate-500 border-r border-slate-100">{user.current.area}</td>
                                            <td className="text-center font-mono font-bold text-amber-600 border-r border-slate-50">{user.current.noCane}</td>
                                            <td className="text-center font-mono text-slate-400 border-r border-slate-100">{user.current.noCaneArea}</td>
                                            <td className="text-center font-mono font-bold text-orange-600 border-r border-slate-50">{user.current.varMismatch}</td>
                                            <td className="text-center font-mono text-slate-400 border-r border-slate-100">{user.current.varArea}</td>
                                            <td className="text-center font-mono font-bold text-rose-600 border-r border-slate-50">{user.current.disease}</td>
                                            <td className="text-center font-mono text-slate-400 border-r border-slate-100">{user.current.diseaseArea}</td>
                                            <td className="text-center">
                                                <button className="w-10 h-10 bg-indigo-50 text-indigo-600 rounded-xl hover:bg-indigo-600 hover:text-slate-700 transition-all shadow-sm">
                                                    <i className="fas fa-satellite"></i>
                                                </button>
                                            </td>
                                        </tr>
                                        <tr className="hover:bg-slate-50 transition-all border-b border-slate-100">
                                            <td className="py-4 px-6 font-bold text-slate-500 text-[11px] uppercase border-r border-slate-50">Ratoon Data</td>
                                            <td className="text-center font-mono font-black text-slate-800 border-r border-slate-50">{user.ratoon.plots}</td>
                                            <td className="text-center font-mono font-bold text-slate-500 border-r border-slate-100">{user.ratoon.area}</td>
                                            <td className="text-center font-mono font-bold text-amber-600 border-r border-slate-50">{user.ratoon.noCane}</td>
                                            <td className="text-center font-mono text-slate-400 border-r border-slate-100">{user.ratoon.noCaneArea}</td>
                                            <td className="text-center font-mono font-bold text-orange-600 border-r border-slate-50">{user.ratoon.varMismatch}</td>
                                            <td className="text-center font-mono text-slate-400 border-r border-slate-100">{user.ratoon.varArea}</td>
                                            <td className="text-center font-mono font-bold text-rose-600 border-r border-slate-50">{user.ratoon.disease}</td>
                                            <td className="text-center font-mono text-slate-400 border-r border-slate-100">{user.ratoon.diseaseArea}</td>
                                            <td className="text-center">
                                                <button className="w-10 h-10 bg-indigo-50 text-indigo-600 rounded-xl hover:bg-indigo-600 hover:text-slate-700 transition-all shadow-sm">
                                                    <i className="fas fa-satellite"></i>
                                                </button>
                                            </td>
                                        </tr>
                                        <tr className="bg-slate-100 text-slate-700">
                                            <td className="py-4 px-6 font-black text-[11px] uppercase tracking-tighter border-r border-slate-200 italic">Personnel Aggregates</td>
                                            <td className="text-center font-mono font-black text-emerald-400 border-r border-slate-200">{user.current.plots + user.ratoon.plots}</td>
                                            <td className="text-center font-mono font-bold text-slate-700/60 border-r border-slate-200">{(user.current.area + user.ratoon.area).toFixed(2)}</td>
                                            <td className="text-center font-mono font-black text-amber-400 border-r border-slate-200">{user.current.noCane + user.ratoon.noCane}</td>
                                            <td className="text-center font-mono font-bold text-slate-700/60 border-r border-slate-200">{(user.current.noCaneArea + user.ratoon.noCaneArea).toFixed(2)}</td>
                                            <td className="text-center font-mono font-black text-orange-400 border-r border-slate-200">{user.current.varMismatch + user.ratoon.varMismatch}</td>
                                            <td className="text-center font-mono font-bold text-slate-700/60 border-r border-slate-200">{(user.current.varArea + user.ratoon.varArea).toFixed(2)}</td>
                                            <td className="text-center font-mono font-black text-rose-400 border-r border-slate-200">{user.current.disease + user.ratoon.disease}</td>
                                            <td className="text-center font-mono font-bold text-slate-700/60 border-r border-slate-200">{(user.current.diseaseArea + user.ratoon.diseaseArea).toFixed(2)}</td>
                                            <td className="bg-white"></td>
                                        </tr>
                                    </React.Fragment>
              )}
                            </tbody>
                        </table>
                    </div>
        }
                {activeTab === 'disease' && diseaseData &&
        <div className="p-10">
                        <div className="report-table-container rounded-[2rem] border overflow-hidden border-slate-100 shadow-inner">
                            <table className="report-table">
                                <thead>
                                    <tr className="bg-rose-600 text-slate-700">
                                        <th rowSpan="2" className="py-5 px-6 font-black uppercase text-[10px] border-r border-slate-200">Officer Detail</th>
                                        <th rowSpan="2" className="py-5 px-6 font-black uppercase text-[10px] border-r border-slate-200">Plot Category</th>
                                        <th colSpan="2" className="py-4 text-center font-black uppercase text-[10px] border-r border-slate-200 bg-rose-700/50">Interval Impact</th>
                                        <th colSpan="2" className="py-4 text-center font-black uppercase text-[10px] bg-rose-800/50">Cumulative Impact (To-Date)</th>
                                    </tr>
                                    <tr className="bg-rose-600 text-slate-700 border-t border-slate-200">
                                        <th className="py-3 text-center border-r border-slate-200">Plots (N)</th>
                                        <th className="py-3 text-center border-r border-slate-200">Area (H)</th>
                                        <th className="py-3 text-center border-r border-slate-200">Plots (N)</th>
                                        <th className="py-3 text-center">Area (H)</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {diseaseData.map((row, i) =>
                <React.Fragment key={i}>
                                            <tr className="hover:bg-rose-50/30 transition-all border-b border-slate-50 group">
                                                <td rowSpan="3" className="py-6 px-6 font-black text-slate-800 uppercase italic tracking-tighter border-r border-slate-100">{row.userName}</td>
                                                <td className="py-4 px-6 font-bold text-slate-500 text-[11px] uppercase">Current Survey</td>
                                                <td className="text-center font-mono font-black text-rose-600">{row.current.onDatePlots}</td>
                                                <td className="text-center font-mono font-bold text-slate-400">{row.current.onDateArea}</td>
                                                <td className="text-center font-mono font-black text-rose-900 bg-slate-50/50">{row.current.toDatePlots}</td>
                                                <td className="text-center font-mono font-bold text-slate-600 bg-slate-50/50">{row.current.toDateArea}</td>
                                            </tr>
                                            <tr className="hover:bg-rose-50/30 transition-all border-b border-slate-50">
                                                <td className="py-4 px-6 font-bold text-slate-500 text-[11px] uppercase">Ratoon Data</td>
                                                <td className="text-center font-mono font-black text-rose-600">{row.ratoon.onDatePlots}</td>
                                                <td className="text-center font-mono font-bold text-slate-400">{row.ratoon.onDateArea}</td>
                                                <td className="text-center font-mono font-black text-rose-900 bg-slate-50/50">{row.ratoon.toDatePlots}</td>
                                                <td className="text-center font-mono font-bold text-slate-600 bg-slate-50/50">{row.ratoon.toDateArea}</td>
                                            </tr>
                                            <tr className="bg-rose-900 text-slate-700">
                                                <td className="py-3 px-6 font-black text-[10px] uppercase">Aggregated Variance</td>
                                                <td className="text-center font-mono font-black text-rose-300">{row.current.onDatePlots + row.ratoon.onDatePlots}</td>
                                                <td className="text-center font-mono text-slate-700/50">{(row.current.onDateArea + row.ratoon.onDateArea).toFixed(2)}</td>
                                                <td className="text-center font-mono font-black text-rose-300">{row.current.toDatePlots + row.ratoon.toDatePlots}</td>
                                                <td className="text-center font-mono text-slate-700/50">{(row.current.toDateArea + row.ratoon.toDateArea).toFixed(2)}</td>
                                            </tr>
                                        </React.Fragment>
                )}
                                </tbody>
                            </table>
                        </div>
                    </div>
        }
            </div>
        </div>);

};

export default Report_SurveyPLot;