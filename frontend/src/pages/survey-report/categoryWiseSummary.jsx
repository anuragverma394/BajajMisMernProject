import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast, Toaster } from 'react-hot-toast';
import { surveyService, masterService } from '../../microservices/api.service';
import '../../styles/SurveyReports.css';const __cx = (...vals) => vals.filter(Boolean).join(" ");

const SurveyReport_categoryWiseSummary = () => {
  const navigate = useNavigate();
  const [factories, setFactories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [reportData, setReportData] = useState([]);
  const [filters, setFilters] = useState({
    unitCode: '',
    date: new Date().toISOString().split('T')[0],
    catg: '0'
  });

  useEffect(() => {
    const loadUnits = async () => {
      try {
        const units = await masterService.getUnits();
        setFactories(units);
        if (units.length > 0) {
          setFilters((prev) => ({ ...prev, unitCode: units[0].F_Code || units[0].id }));
        }
      } catch (error) {
        toast.error("Telemetry link failure: Unit master offline");
      }
    };
    loadUnits();
  }, []);

  const handleSearch = async (e) => {
    if (e) e.preventDefault();
    if (!filters.unitCode) {
      toast.error("Command node identification required");
      return;
    }

    setLoading(true);
    try {
      // Mapping back to what the API expects (F_Name field used for code)
      const apiParams = {
        F_Name: filters.unitCode,
        date: filters.date,
        catg: filters.catg
      };
      const response = await surveyService.getCategoryWiseSummary(apiParams);
      setReportData(response.data || response || []);
      toast.success("Categorization matrix synchronized");
    } catch (error) {
      toast.error("Anomalous data flux: Verification aborted");
      setReportData([]);
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = () => {
    const content = document.getElementById('category-report-print');
    const win = window.open('', '', 'height=800,width=1400');
    win.document.write('<html><head><title>Category Analytics Matrix</title>');
    win.document.write('<style>table { width: 100%; border-collapse: collapse; font-family: sans-serif; font-size: 10px; } th, td { border: 1px solid #e2e8f0; padding: 12px; text-align: left; } th { background: #f8fafc; color: #475569; font-weight: 800; text-transform: uppercase; border-bottom: 2px solid #e2e8f0; } .text-center { text-align: center; } .font-black { font-weight: 900; } .bg-blue { background: #f0f9ff; }</style>');
    win.document.write('</head><body>');
    win.document.write('<div style="text-align:center; padding: 30px;">');
    win.document.write('<h1 style="margin:0; color:#1e293b;">Bajaj Sugar - Distribution Analytics</h1>');
    win.document.write(`<p style="color:#64748b;">Category Wise Summary Core | Unit: ${filters.unitCode} | Chronos: ${filters.date}</p>`);
    win.document.write('</div>');
    win.document.write(content.innerHTML);
    win.document.write('</body></html>');
    win.document.close();
    win.print();
  };

  return (
    <div className="p-[20px] bg-white min-h-[100vh] font-['Poppins', Arial, sans-serif]">
            <Toaster position="top-right" />

            <div className={__cx("page-card", "rounded-lg border-0 shadow-[0 4px 12px rgba(0,0,0,0.1)]")}>
                <div className={__cx("page-card-header", "text-left text-[15px] py-[12px] px-[20px] bg-[#1F9E8A]")}>
                    Category Wise Summary Report
                </div>
                <div className="bg-[#e2efda] py-[10px] px-[20px] text-[13px] text-[#333] border-b border-b-[#c8e6c9] font-bold">
                    Category Wise Summary Report
                </div>

                <div className={__cx("page-card-body", "p-[20px]")}>
                    <div className={__cx("form-row", "flex gap-[20px] items-end mb-[20px]")}>
                        <div className={__cx("form-group", "min-w-[350px]")}>
                            <label className="block text-[12px] font-bold text-[#333] mb-[4px]">Factory</label>
                            <select
                className={__cx("form-control", "w-[100%] p-[8px] border border-[#ccc] rounded")}
                value={filters.unitCode}
                onChange={(e) => setFilters({ ...filters, unitCode: e.target.value })}

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
                                <option value="1">Shift Forward (H » L)</option>
                                <option value="2">Shift Reverse (L » H)</option>
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
        <div className="space-y-10 animate-in slide-in-from-bottom-10 duration-1000" id="category-report-print">
                        <div className="bg-white rounded-[4rem] shadow-2xl border border-white overflow-hidden">
                            <div className="px-10 py-8 border-b border-slate-50 flex justify-between items-center bg-slate-50/50">
                                <h3 className="font-black text-slate-800 uppercase tracking-widest text-[13px]">Dimensional Category Matrix</h3>
                                <div className="flex gap-2 bg-white p-1 rounded-xl shadow-inner border border-slate-100">
                                    <div className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-[9px] font-black uppercase tracking-widest">Shift Data</div>
                                    <div className="px-4 py-2 text-slate-400 rounded-lg text-[9px] font-black uppercase tracking-widest">Aggregate</div>
                                </div>
                            </div>
                            <div className="table-wrapper-premium overflow-x-auto p-4">
                                <table className="table-premium w-full border-separate border-spacing-0">
                                    <thead>
                                        <tr className="bg-slate-900 text-white">
                                            <th className="p-6 text-center text-[10px] font-black uppercase border-r border-slate-800 rounded-tl-[3.5rem]">Idx</th>
                                            <th className="p-6 text-left text-[10px] font-black uppercase border-r border-slate-800">Origin State</th>
                                            <th className="p-6 text-left text-[10px] font-black uppercase border-r border-slate-800">Target State</th>
                                            <th className="p-6 text-center text-[10px] font-black uppercase bg-indigo-900 text-indigo-400 rounded-tr-[3.5rem]">Plot Volume</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {reportData.map((row, idx) =>
                  <tr key={idx} className="hover:bg-indigo-50/50 transition-all border-b border-slate-50 group">
                                                <td className="p-4 text-center mono text-[10px] text-slate-300 border-r border-slate-50">[{idx + 1}]</td>
                                                <td className="p-4 text-left font-black text-slate-400 border-r border-slate-50 whitespace-nowrap italic">{row.BaforeCategoryName || row.beforeCategoryName}</td>
                                                <td className="p-4 text-left border-r border-slate-50">
                                                    <div className="font-black text-indigo-900 text-[14px]">{row.UpdateCategoryName || row.updateCategoryName}</div>
                                                </td>
                                                <td className="p-4 text-center mono font-black text-slate-900 text-xl bg-slate-50/30 group-hover:bg-indigo-50/80 transition-all">
                                                    {row.PlotCount || row.plotCount}
                                                </td>
                                            </tr>
                  )}
                                    </tbody>
                                    <tfoot className="bg-slate-900 text-white border-t-4 border-indigo-500">
                                        <tr className="font-black uppercase tracking-tighter">
                                            <td colSpan="3" className="p-6 text-right text-[12px] text-indigo-400 border-r border-slate-800 rounded-bl-[3.5rem]">Collective Distribution Sum</td>
                                            <td className="p-6 text-center text-4xl mono text-white bg-indigo-500/10 rounded-br-[3.5rem]">
                                                {reportData.reduce((acc, curr) => acc + (parseInt(curr.PlotCount || curr.plotCount) || 0), 0)}
                                            </td>
                                        </tr>
                                    </tfoot>
                                </table>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                            {reportData.slice(0, 3).map((row, i) =>
            <div key={i} className="bg-white p-8 rounded-[3rem] shadow-xl border border-white group hover:-translate-y-2 transition-all">
                                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-4">Top Flux Node {i + 1}</p>
                                    <h4 className="text-xl font-black text-slate-800 leading-tight mb-4">{row.UpdateCategoryName}</h4>
                                    <div className="flex items-center justify-between">
                                        <span className="text-3xl font-black text-indigo-600 mono">{row.PlotCount}</span>
                                        <div className="w-12 h-12 bg-indigo-50 text-indigo-500 rounded-2xl flex items-center justify-center group-hover:bg-indigo-600 group-hover:text-white transition-all">
                                            <i className="fas fa-arrow-right"></i>
                                        </div>
                                    </div>
                                </div>
            )}
                        </div>
                    </div> :
        !loading &&
        <div className="py-40 flex flex-col items-center justify-center bg-white rounded-[4rem] shadow-2xl border border-white">
                        <div className="w-40 h-40 bg-indigo-50 rounded-full flex items-center justify-center mb-10 shadow-inner group hover:scale-110 transition-all duration-700">
                            <i className="fas fa-boxes text-indigo-200 group-hover:text-indigo-500 text-6xl transition-colors"></i>
                        </div>
                        <h3 className="text-2xl font-black text-slate-800 tracking-tight italic uppercase">Categorization Matrix Offline</h3>
                        <p className="text-slate-400 text-center max-w-sm mt-4 font-bold uppercase tracking-widest text-[9px] leading-loose">
                            Synchronize with a command node to decrypt the distribution heuristics and category transition telemetry.
                        </p>
                    </div>
        }
            </div>
        </div>);

};

export default SurveyReport_categoryWiseSummary;