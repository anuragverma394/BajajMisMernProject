import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast, Toaster } from 'react-hot-toast';
import { surveyService } from '../../microservices/api.service';
import '../../styles/SurveyReports.css';const __cx = (...vals) => vals.filter(Boolean).join(" ");const SurveyReport_FactoryWiseCaneAreaReport = () => {const navigate = useNavigate();const [loading, setLoading] = useState(false);const [reportData, setReportData] = useState([]);const [filters, setFilters] = useState({ CaneArea: '1' });

  const handleSearch = async (e) => {
    if (e) e.preventDefault();
    setLoading(true);
    try {
      const response = await surveyService.getFactoryWiseCaneArea(filters);
      setReportData(response.data || response || []);
      toast.success("Regional data synchronized: Matrix populated");
    } catch (error) {
      toast.error("Anomalous data flux: Global aggregation failure");
      setReportData([]);
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = () => {
    const content = document.getElementById('factory-report-print');
    const win = window.open('', '', 'height=800,width=1400');
    win.document.write('<html><head><title>Global Cane Area Summary</title>');
    win.document.write('<style>table { width: 100%; border-collapse: collapse; font-family: sans-serif; font-size: 10px; } th, td { border: 1px solid #e2e8f0; padding: 12px; text-align: center; } th { background: #f8fafc; color: #1e293b; font-weight: 800; text-transform: uppercase; } .text-left { text-align: left; } .font-black { font-weight: 900; } .text-blue { color: #2563eb; }</style>');
    win.document.write('</head><body>');
    win.document.write('<div style="text-align:center; padding: 30px;">');
    win.document.write('<h1 style="margin:0; color:#0f172a; text-transform:uppercase;">Bajaj Sugar - Global Infrastructure Summary</h1>');
    win.document.write(`<p style="color:#64748b;">Regional Aggregation | Area Type: ${filters.CaneArea === '1' ? 'First Survey' : 'Caneup Portal'}</p>`);
    win.document.write('</div>');
    win.document.write(content.innerHTML);
    win.document.write('</body></html>');
    win.document.close();
    win.print();
  };

  const handleExport = () => {
    if (reportData.length === 0) return;
    const csvContent = "data:text/csv;charset=utf-8," +
    Object.keys(reportData[0]).join(",") + "\n" +
    reportData.map((row) => Object.values(row).join(",")).join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Global_Cane_Summary_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    toast.success("Global summary exported to CSV");
  };
  return (
    <div className="p-[20px] bg-white min-h-[100vh] font-['Poppins', Arial, sans-serif]">
            <Toaster position="top-right" />

            <div className={__cx("page-card", "rounded-lg border-0 shadow-[0 4px 12px rgba(0,0,0,0.1)]")}>
                <div className={__cx("page-card-header", "text-left text-[15px] py-[12px] px-[20px] bg-[#1F9E8A]")}>
                    Factory Wise Cane Area Report
                </div>
                <div className="bg-[#e2efda] py-[10px] px-[20px] text-[13px] text-[#333] border-b border-b-[#c8e6c9] font-bold">
                    Factory Wise Cane Area Report 2526 (Only Final Villages)
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
                                <option value="2">As Per Caneup Portal</option>
                            </select>
                        </div>
                    </div>

                    <div className={__cx("form-actions", "flex gap-[8px] mt-[10px]")}>
                        <button className={__cx("btn", "py-[8px] px-[16px] bg-[#1F9E8A] text-white border-0 rounded cursor-pointer")} onClick={handleSearch} disabled={loading}>
                            {loading ? 'Searching...' : 'Search'}
                        </button>
                        <button className={__cx("btn", "py-[8px] px-[16px] bg-[#1F9E8A] text-white border-0 rounded cursor-pointer")} onClick={handleExport} disabled={!reportData.length}>
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
        <div className="space-y-10 animate-in slide-in-from-bottom-10 duration-1000" id="factory-report-print">
                        <div className="bg-white rounded-[4rem] shadow-2xl border border-white overflow-hidden">
                            <div className="px-10 py-8 border-b border-slate-50 flex justify-between items-center bg-slate-50/50">
                                <h3 className="font-black text-slate-800 uppercase tracking-widest text-[13px]">Factory Performance Multiplier</h3>
                                <button onClick={handlePrint} className="px-5 py-2 bg-white text-slate-900 hover:bg-slate-100 border border-slate-200 rounded-xl font-black text-[10px] uppercase tracking-widest shadow-sm transition-all active:scale-95">
                                    <i className="fas fa-print mr-2"> Hardcopy</i>
                                </button>
                            </div>
                            <div className="table-wrapper-premium overflow-x-auto p-4">
                                <table className="table-premium w-full border-separate border-spacing-0">
                                    <thead>
                                        <tr className="bg-slate-900 text-white">
                                            <th className="p-6 text-center text-[10px] font-black uppercase border-r border-slate-800 rounded-tl-[3.5rem]">Idx</th>
                                            <th className="p-6 text-center text-[10px] font-black uppercase border-r border-slate-800">Node ID</th>
                                            <th className="p-6 text-left text-[10px] font-black uppercase border-r border-slate-800">Station Name</th>
                                            <th className="p-6 text-center text-[10px] font-black uppercase border-r border-slate-800 bg-indigo-900 text-indigo-400">Area (Hec)</th>
                                            <th className="p-6 text-center text-[10px] font-black uppercase border-r border-slate-800">Plots</th>
                                            <th className="p-6 text-center text-[10px] font-black uppercase border-r border-slate-800">Entities</th>
                                            <th className="p-6 text-center text-[10px] font-black uppercase rounded-tr-[3.5rem]">Visual Flux</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {reportData.map((row, idx) =>
                  <tr key={idx} className="hover:bg-indigo-50/50 transition-all border-b border-slate-50 group">
                                                <td className="p-4 text-center mono text-[10px] text-slate-300 border-r border-slate-50">[{idx + 1}]</td>
                                                <td className="p-4 text-center mono font-black text-slate-500 border-r border-slate-50 italic">{row.F_Code || row.f_Code}</td>
                                                <td className="p-4 text-left border-r border-slate-50 font-black text-slate-800">{row.FactoryName || row.factoryName}</td>
                                                <td className="p-4 text-center border-r border-slate-50 bg-indigo-50/20">
                                                    <span className="text-indigo-600 font-black text-xl mono tracking-tighter">{row.CaneArea || row.caneArea}</span>
                                                </td>
                                                <td className="p-4 text-center border-r border-slate-50 mono text-slate-600">{row.PlotCount || row.plotCount}</td>
                                                <td className="p-4 text-center border-r border-slate-50 mono text-slate-600">{row.GrowerCount || row.growerCount}</td>
                                                <td className="p-4 w-48 border-r border-slate-50">
                                                    <div className="w-full bg-slate-100 h-3 rounded-full overflow-hidden shadow-inner p-0.5">
                                                        <div
                          className={`bg-gradient-to-r from-indigo-500 to-cyan-500 h-full rounded-full transition-all duration-1000 w-[${Math.min(100, parseFloat(row.CaneArea || row.caneArea) / 20000 * 100)}%]`}>
                        </div>
                                                    </div>
                                                </td>
                                            </tr>
                  )}
                                    </tbody>
                                    <tfoot className="bg-slate-900 text-white border-t-4 border-indigo-500 shadow-2xl">
                                        <tr className="font-black uppercase tracking-tighter">
                                            <td colSpan="3" className="p-8 text-right text-[14px] text-indigo-400 border-r border-slate-800 rounded-bl-[3.5rem] tracking-widest">Global Aggregated Summary</td>
                                            <td className="p-8 text-center text-4xl mono text-white bg-indigo-500/10 border-r border-slate-800 tracking-tighter">
                                                {reportData.reduce((acc, curr) => acc + (parseFloat(curr.CaneArea || curr.caneArea) || 0), 0).toFixed(3)}
                                            </td>
                                            <td className="p-8 text-center text-2xl mono text-indigo-300 border-r border-slate-800">
                                                {reportData.reduce((acc, curr) => acc + (parseInt(curr.PlotCount || curr.plotCount) || 0), 0)}
                                            </td>
                                            <td className="p-8 text-center text-2xl mono text-indigo-300 border-r border-slate-800">
                                                {reportData.reduce((acc, curr) => acc + (parseInt(curr.GrowerCount || curr.growerCount) || 0), 0)}
                                            </td>
                                            <td className="p-8 text-center text-slate-500 rounded-br-[3.5rem] text-[10px]">Matrix Finalized</td>
                                        </tr>
                                    </tfoot>
                                </table>
                            </div>
                        </div>
                    </div> :
        !loading &&
        <div className="py-40 flex flex-col items-center justify-center bg-white rounded-[4rem] shadow-2xl border border-white relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-64 h-64 bg-slate-50 rounded-full -mr-32 -mt-32 blur-3xl opacity-50"></div>
                        <div className="w-40 h-40 bg-indigo-50 rounded-full flex items-center justify-center mb-10 shadow-inner group hover:scale-110 transition-all duration-700">
                            <i className="fas fa-chart-area text-indigo-200 group-hover:text-indigo-500 text-6xl transition-colors"></i>
                        </div>
                        <h3 className="text-2xl font-black text-slate-800 tracking-tight italic uppercase">Global Matrix Latent</h3>
                        <p className="text-slate-400 text-center max-w-sm mt-4 font-bold uppercase tracking-widest text-[9px] leading-loose">
                            Identify data source protocol and click synchronize to aggregate whole-factory cane infrastructure heuristics across the regional grid.
                        </p>
                    </div>
        }
            </div>
        </div>);

};

export default SurveyReport_FactoryWiseCaneAreaReport;