import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast, Toaster } from 'react-hot-toast';
import { surveyService, masterService } from '../../microservices/api.service';
import '../../styles/SurveyReports.css';const __cx = (...vals) => vals.filter(Boolean).join(" ");

const SurveyReport_CaneVierityVillageGrower = () => {
  const navigate = useNavigate();
  const [factories, setFactories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [reportData, setReportData] = useState([]);
  const [filters, setFilters] = useState({
    F_code: '',
    Categry: 'varietychange',
    Fdate: new Date().toISOString().split('T')[0],
    Tdate: new Date().toISOString().split('T')[0]
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
      const response = await surveyService.getCaneVarietyVillageGrower(filters);
      setReportData(response.data || response || []);
      toast.success("Audit trail synchronized: Changes decrypted");
    } catch (error) {
      toast.error("Anomalous data flux: Verification aborted");
      setReportData([]);
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = () => {
    const content = document.getElementById('cv-report-print');
    const win = window.open('', '', 'height=800,width=1400');
    win.document.write('<html><head><title>Historical Audit Matrix</title>');
    win.document.write('<style>table { width: 100%; border-collapse: collapse; font-family: sans-serif; font-size: 10px; } th, td { border: 1px solid #e2e8f0; padding: 10px; text-align: left; } th { background: #f8fafc; color: #475569; font-weight: 800; text-transform: uppercase; } .line-through { text-decoration: line-through; color: #ef4444; } .font-black { font-weight: 900; } .text-emerald { color: #10b981; }</style>');
    win.document.write('</head><body>');
    win.document.write('<div style="text-align:center; padding: 30px;">');
    win.document.write('<h1 style="margin:0; color:#1e293b text-transform:uppercase;">Bajaj Sugar - Modification Audit</h1>');
    win.document.write(`<p style="color:#64748b;">System Audit Log | Unit: ${filters.F_code} | Range: ${filters.Fdate} to ${filters.Tdate}</p>`);
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
    link.setAttribute("download", `AuditTrail_${filters.Categry}_${filters.Fdate}.csv`);
    document.body.appendChild(link);
    link.click();
    toast.success("Audit data exported to CSV");
  };

  return (
    <div className="p-[20px] bg-white min-h-[100vh] font-['Poppins', Arial, sans-serif]">
            <Toaster position="top-right" />

            <div className={__cx("page-card", "rounded-lg border-0 shadow-[0 4px 12px rgba(0,0,0,0.1)]")}>
                <div className={__cx("page-card-header", "text-left text-[15px] py-[12px] px-[20px] bg-[#1F9E8A]")}>
                    Cane Variety Village Grower Report
                </div>
                <div className="bg-[#e2efda] py-[10px] px-[20px] text-[13px] text-[#333] border-b border-b-[#c8e6c9] font-bold">
                    Cane Variety Village Grower Report
                </div>

                <div className={__cx("page-card-body", "p-[20px]")}>
                    <div className={__cx("form-row", "flex gap-[20px] items-end mb-[20px]")}>
                        <div className={__cx("form-group", "min-w-[250px]")}>
                            <label className="block text-[12px] font-bold text-[#333] mb-[4px]">Factory</label>
                            <select
                className={__cx("form-control", "w-[100%] p-[8px] border border-[#ccc] rounded")}
                value={filters.F_code}
                onChange={(e) => setFilters({ ...filters, F_code: e.target.value })}

                required>
                
                                <option value="">-Select-</option>
                                {factories.map((f, idx) => <option key={`${f.F_Code || f.id}-${idx}`} value={f.F_Code || f.id}>{f.F_Name || f.name}</option>)}
                            </select>
                        </div>
                        <div className={__cx("form-group", "min-w-[250px]")}>
                            <label className="block text-[12px] font-bold text-[#333] mb-[4px]">Type</label>
                            <select
                className={__cx("form-control", "w-[100%] p-[8px] border border-[#ccc] rounded")}
                value={filters.Categry}
                onChange={(e) => setFilters({ ...filters, Categry: e.target.value })}>

                
                                <option value="varietychange">Variety Shift Audit</option>
                                <option value="categorychange">Category Reclass</option>
                                <option value="growerchange">Entity Ownership Change</option>
                                <option value="canetypechange">Cane Geometry Mod</option>
                            </select>
                        </div>
                        <div className={__cx("form-group", "min-w-[200px]")}>
                            <label className="block text-[12px] font-bold text-[#333] mb-[4px]">From Date</label>
                            <input
                type="date"
                className={__cx("form-control", "w-[100%] p-[8px] border border-[#ccc] rounded")}
                value={filters.Fdate}
                onChange={(e) => setFilters({ ...filters, Fdate: e.target.value })} />

              
                        </div>
                        <div className={__cx("form-group", "min-w-[200px]")}>
                            <label className="block text-[12px] font-bold text-[#333] mb-[4px]">To Date</label>
                            <input
                type="date"
                className={__cx("form-control", "w-[100%] p-[8px] border border-[#ccc] rounded")}
                value={filters.Tdate}
                onChange={(e) => setFilters({ ...filters, Tdate: e.target.value })} />

              
                        </div>
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
        <div className="space-y-10 animate-in slide-in-from-bottom-10 duration-1000" id="cv-report-print">
                        <div className="bg-white rounded-[4rem] shadow-2xl border border-white overflow-hidden">
                            <div className="px-10 py-8 border-b border-slate-50 flex justify-between items-center bg-slate-50/50">
                                <h3 className="font-black text-slate-800 uppercase tracking-widest text-[13px]">Historical Modification Matrix</h3>
                                <div className="flex gap-2 bg-white p-1 rounded-xl shadow-inner border border-slate-100">
                                    <span className="px-4 py-2 bg-amber-600 text-white rounded-lg text-[9px] font-black uppercase tracking-widest">Validated Trail</span>
                                </div>
                            </div>
                            <div className="table-wrapper-premium overflow-x-auto p-4">
                                <table className="table-premium w-full border-separate border-spacing-0">
                                    <thead>
                                        <tr className="bg-slate-900 text-white">
                                            <th className="p-6 text-center text-[10px] font-black uppercase border-r border-slate-800 rounded-tl-[3.5rem]">Idx</th>
                                            <th className="p-6 text-left text-[10px] font-black uppercase border-r border-slate-800">Cluster Node</th>
                                            <th className="p-6 text-left text-[10px] font-black uppercase border-r border-slate-800">Subject Alias</th>
                                            <th className="p-6 text-center text-[10px] font-black uppercase border-r border-slate-800 bg-rose-900/50 text-rose-300">Latent Value</th>
                                            <th className="p-6 text-center text-[10px] font-black uppercase border-r border-slate-800 bg-emerald-900/50 text-emerald-300">Target Value</th>
                                            <th className="p-6 text-center text-[10px] font-black uppercase border-r border-slate-800">Time Point</th>
                                            <th className="p-6 text-center text-[10px] font-black uppercase border-r border-slate-800">Agent Node</th>
                                            <th className="p-6 text-center text-[10px] font-black uppercase rounded-tr-[3.5rem]">Heuristics / Remark</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {reportData.map((row, idx) =>
                  <tr key={idx} className="hover:bg-amber-50/50 transition-all border-b border-slate-50 group">
                                                <td className="p-4 text-center mono text-[10px] text-slate-300 border-r border-slate-50">[{idx + 1}]</td>
                                                <td className="p-4 text-left font-black text-slate-700 border-r border-slate-50 italic">{row.Village || row.village || 'N/A'}</td>
                                                <td className="p-4 text-left border-r border-slate-50 font-black text-slate-800">{row.GrowerName || row.growerName}</td>
                                                <td className="p-4 text-center border-r border-slate-50 bg-rose-50/20">
                                                    <span className="line-through text-rose-500 font-black text-[11px] block">{row.OldValue || row.oldValue}</span>
                                                </td>
                                                <td className="p-4 text-center border-r border-slate-50 bg-emerald-50/20">
                                                    <span className="text-emerald-600 font-black text-[14px] uppercase tracking-tighter">{row.NewValue || row.newValue}</span>
                                                </td>
                                                <td className="p-4 text-center mono border-r border-slate-50">
                                                    <div className="text-[10px] font-black text-slate-600">{row.ChangeDate || row.changeDate}</div>
                                                </td>
                                                <td className="p-4 text-center border-r border-slate-50 text-[10px] font-black text-amber-600">{row.UserID || row.userID}</td>
                                                <td className="p-4 text-left italic text-slate-400 text-[10px] max-w-xs">{row.Remark || row.remark || '--- System Entry ---'}</td>
                                            </tr>
                  )}
                                    </tbody>
                                    <tfoot className="bg-slate-900 text-white border-t-4 border-amber-500">
                                        <tr className="font-black uppercase tracking-tighter">
                                            <td colSpan="4" className="p-6 text-right text-[12px] text-amber-400 border-r border-slate-800 rounded-bl-[3.5rem]">Collective Modification Count</td>
                                            <td className="p-6 text-center text-4xl mono text-white bg-amber-500/10 border-r border-slate-800">{reportData.length}</td>
                                            <td colSpan="3" className="p-6 text-center text-slate-500 rounded-br-[3.5rem]">Unique Agents Active: {new Set(reportData.map((r) => r.UserID)).size}</td>
                                        </tr>
                                    </tfoot>
                                </table>
                            </div>
                        </div>
                    </div> :
        !loading &&
        <div className="py-40 flex flex-col items-center justify-center bg-white rounded-[4rem] shadow-2xl border border-white">
                        <div className="w-40 h-40 bg-amber-50 rounded-full flex items-center justify-center mb-10 shadow-inner group hover:scale-110 transition-all duration-700">
                            <i className="fas fa-microscope text-amber-200 group-hover:text-amber-500 text-6xl transition-colors"></i>
                        </div>
                        <h3 className="text-2xl font-black text-slate-800 tracking-tight italic uppercase">Audit Archive Latent</h3>
                        <p className="text-slate-400 text-center max-w-sm mt-4 font-bold uppercase tracking-widest text-[9px] leading-loose">
                            Select an operation and time window to decrypt historical system modification and audit heuristics from the ledger.
                        </p>
                    </div>
        }
            </div>
        </div>);

};

export default SurveyReport_CaneVierityVillageGrower;