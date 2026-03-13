import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast, Toaster } from 'react-hot-toast';
import { surveyService, masterService } from '../../microservices/api.service';
import '../../styles/SurveyReports.css';const __cx = (...vals) => vals.filter(Boolean).join(" ");

const SurveyReport_WeeklySubmissionofIndents = () => {
  const navigate = useNavigate();
  const [factories, setFactories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [reportData, setReportData] = useState([]);
  const [filters, setFilters] = useState({
    F_Zone: '0',
    unit: '',
    Zonefrom: '0',
    Zoneto: '9999',
    blockfrom: '0',
    blockto: '9999',
    Datefrom: new Date().toISOString().split('T')[0],
    DateTo: new Date().toISOString().split('T')[0]
  });

  useEffect(() => {
    const loadUnits = async () => {
      try {
        const units = await masterService.getUnits();
        setFactories(units);
        if (units.length > 0) {
          setFilters((prev) => ({ ...prev, unit: units[0].F_Code || units[0].id }));
        }
      } catch (error) {
        toast.error("Telemetry link failure: Unit registry unreachable");
      }
    };
    loadUnits();
  }, []);

  const handleSearch = async (e) => {
    if (e) e.preventDefault();
    if (!filters.unit) {
      toast.error("Command node identification required");
      return;
    }

    setLoading(true);
    try {
      const response = await surveyService.getWeeklyIndents(filters);
      setReportData(response.data || response || []);
      toast.success("Allocation Matrix synchronized");
    } catch (error) {
      toast.error("Synthetic analytical failure: Indent lookup aborted");
      setReportData([]);
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = () => {
    const content = document.getElementById('report-print-area');
    const win = window.open('', '', 'height=800,width=1400');
    win.document.write('<html><head><title>Resource Allocation Matrix</title>');
    win.document.write('<style>table { width: 100%; border-collapse: collapse; font-family: sans-serif; font-size: 8px; } th, td { border: 1px solid #e2e8f0; padding: 6px; text-align: center; } th { background: #f8fafc; color: #1e293b; font-weight: 800; text-transform: uppercase; } .text-left { text-align: left; } .font-bold { font-weight: 700; }</style>');
    win.document.write('</head><body>');
    win.document.write('<div style="text-align:center; padding: 30px;">');
    win.document.write('<h1 style="margin:0; color:#0f172a; text-transform:uppercase;">Bajaj Sugar - Resource Allocation Matrix</h1>');
    win.document.write(`<p style="color:#64748b;">Node: ${filters.unit} | Zone: ${filters.F_Zone} | Period: ${filters.Datefrom} to ${filters.DateTo}</p>`);
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
                    Weekly Submission of Indenting Report
                </div>
                <div className="bg-[#e2efda] py-[10px] px-[20px] text-[13px] text-[#333] border-b border-b-[#c8e6c9] font-bold">
                    Weekly Submission of Indent Report
                </div>

                <div className={__cx("page-card-body", "p-[20px]")}>
                    <div className={__cx("form-row", "grid  gap-[20px]  mb-[20px]")}>
                        <div className="form-group">
                            <label className="block text-[12px] font-bold text-[#333] mb-[4px]">Factory Zone</label>
                            <select
                className={__cx("form-control", "w-[100%] p-[8px] border border-[#ccc] rounded")}
                value={filters.F_Zone}
                onChange={(e) => setFilters({ ...filters, F_Zone: e.target.value })}>

                
                                <option value="0">---Please Select---</option>
                                <option value="CZ">Central Zone</option>
                                <option value="WZ">Western Zone</option>
                                <option value="EZ">Eastern Zone</option>
                            </select>
                        </div>
                        <div className="form-group">
                            <label className="block text-[12px] font-bold text-[#333] mb-[4px]">Unit</label>
                            <select
                className={__cx("form-control", "w-[100%] p-[8px] border border-[#ccc] rounded")}
                value={filters.unit}
                onChange={(e) => setFilters({ ...filters, unit: e.target.value })}>

                
                                <option value="">---Please Select---</option>
                                {factories.map((f, idx) => <option key={`${f.F_Code || f.id}-${idx}`} value={f.F_Code || f.id}>{f.F_Name || f.name}</option>)}
                            </select>
                        </div>
                        <div className="form-group">
                            <label className="block text-[12px] font-bold text-[#333] mb-[4px]">Zone</label>
                            <input
                type="number"
                className={__cx("form-control", "w-[100%] p-[8px] border border-[#ccc] rounded")}
                value={filters.Zonefrom}
                onChange={(e) => setFilters({ ...filters, Zonefrom: e.target.value })} />

              
                        </div>
                        <div className="form-group">
                            <label className="block text-[12px] font-bold text-[#333] mb-[4px]">Zone To</label>
                            <input
                type="number"
                className={__cx("form-control", "w-[100%] p-[8px] border border-[#ccc] rounded")}
                value={filters.Zoneto}
                onChange={(e) => setFilters({ ...filters, Zoneto: e.target.value })} />

              
                        </div>
                        <div className="form-group">
                            <label className="block text-[12px] font-bold text-[#333] mb-[4px]">Block From</label>
                            <input
                type="number"
                className={__cx("form-control", "w-[100%] p-[8px] border border-[#ccc] rounded")}
                value={filters.blockfrom}
                onChange={(e) => setFilters({ ...filters, blockfrom: e.target.value })} />

              
                        </div>
                        <div className="form-group">
                            <label className="block text-[12px] font-bold text-[#333] mb-[4px]">Block To</label>
                            <input
                type="number"
                className={__cx("form-control", "w-[100%] p-[8px] border border-[#ccc] rounded")}
                value={filters.blockto}
                onChange={(e) => setFilters({ ...filters, blockto: e.target.value })} />

              
                        </div>
                        <div className="form-group">
                            <label className="block text-[12px] font-bold text-[#333] mb-[4px]">From Date</label>
                            <input
                type="date"
                className={__cx("form-control", "w-[100%] p-[8px] border border-[#ccc] rounded")}
                value={filters.Datefrom}
                onChange={(e) => setFilters({ ...filters, Datefrom: e.target.value })} />

              
                        </div>
                        <div className="form-group">
                            <label className="block text-[12px] font-bold text-[#333] mb-[4px]">To Date</label>
                            <input
                type="date"
                className={__cx("form-control", "w-[100%] p-[8px] border border-[#ccc] rounded")}
                value={filters.DateTo}
                onChange={(e) => setFilters({ ...filters, DateTo: e.target.value })} />

              
                        </div>
                        <div className="form-group">
                            <label className="block text-[12px] font-bold text-[#333] mb-[4px]">Indent Type</label>
                            <select
                className={__cx("form-control", "w-[100%] p-[8px] border border-[#ccc] rounded")}>

                
                                <option value="">---Please Select---</option>
                            </select>
                        </div>
                    </div>

                    <div className={__cx("form-actions", "flex gap-[8px] mt-[10px]")}>
                        <button className={__cx("btn", "py-[8px] px-[16px] bg-[#1F9E8A] text-white border-0 rounded cursor-pointer")} onClick={handleSearch} disabled={loading}>
                            {loading ? 'Searching...' : 'Search'}
                        </button>
                        <button className={__cx("btn", "py-[8px] px-[16px] bg-[#1F9E8A] text-white border-0 rounded cursor-pointer")} disabled={!reportData.length}>
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
        <div className="space-y-12 animate-in slide-in-from-bottom-10 duration-1000" id="report-print-area">
                        <div className="bg-white rounded-[4rem] shadow-2xl border border-white overflow-hidden relative">
                            <div className="px-10 py-8 border-b border-slate-50 flex justify-between items-center bg-slate-50/50">
                                <h3 className="font-black text-slate-800 uppercase tracking-widest text-[13px]">Indent Stream Heuristics</h3>
                                <span className="bg-blue-100 text-blue-700 font-black px-4 py-1 rounded-full text-[10px] uppercase tracking-widest">{reportData.length} Records Detected</span>
                            </div>
                            <div className="table-wrapper-premium overflow-x-auto p-4">
                                <table className="table-premium w-full border-separate border-spacing-0">
                                    <thead>
                                        <tr className="bg-slate-900 text-white">
                                            <th className="p-4 text-center text-[10px] font-black uppercase border-r border-slate-800 rounded-tl-[3.5rem]">Idx</th>
                                            <th className="p-4 text-left text-[10px] font-black uppercase border-r border-slate-800">Cluster/Plot</th>
                                            <th className="p-4 text-left text-[10px] font-black uppercase border-r border-slate-800">Resource (Grower)</th>
                                            <th className="p-4 text-center text-[10px] font-black uppercase border-r border-slate-800">Allocation</th>
                                            <th className="p-4 text-center text-[10px] font-black uppercase border-r border-slate-800">Timestamp</th>
                                            <th className="p-4 text-left text-[10px] font-black uppercase border-r border-slate-800">Node Architecture</th>
                                            <th className="p-4 text-left text-[10px] font-black uppercase rounded-tr-[3.5rem]">Genetic Variety</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {reportData.map((row, idx) =>
                  <tr key={idx} className="hover:bg-blue-50/50 border-b border-slate-50 group transition-all">
                                                <td className="p-4 text-center mono text-[10px] text-slate-300 border-r border-slate-50">{idx + 1}</td>
                                                <td className="p-4 text-left border-r border-slate-50">
                                                    <div className="flex flex-col">
                                                        <span className="font-black text-slate-800 text-[11px] uppercase tracking-tighter">{row.v_name || row.V_Name}</span>
                                                        <code className="text-[9px] text-slate-400">P-{row.varietycode}</code>
                                                    </div>
                                                </td>
                                                <td className="p-4 text-left border-r border-slate-50">
                                                    <div className="flex flex-col">
                                                        <span className="font-black text-slate-700 text-[11px] uppercase">{row.g_name}</span>
                                                        <span className="text-[9px] text-slate-400 italic">S/O {row.g_father}</span>
                                                        <code className="text-[8px] bg-slate-100 text-slate-500 self-start px-2 py-0.5 rounded mt-1">{row.Growercode}</code>
                                                    </div>
                                                </td>
                                                <td className="p-4 text-center border-r border-slate-50">
                                                    <div className="flex flex-col items-center">
                                                        <span className="bg-blue-50 text-blue-700 font-black px-3 py-1 rounded-lg text-[12px] mono">{row.IN_INDARE}</span>
                                                        <span className="text-[9px] text-slate-400 uppercase mt-1 font-bold">{row.IN_TYPE}</span>
                                                    </div>
                                                </td>
                                                <td className="p-4 text-center border-r border-slate-50">
                                                    <div className="flex flex-col">
                                                        <span className="text-[10px] font-black text-slate-600">IN: {row.indentDate}</span>
                                                        <span className="text-[9px] text-slate-400 italic">PL: {row.PlantDT}</span>
                                                    </div>
                                                </td>
                                                <td className="p-4 text-left border-r border-slate-50">
                                                    <div className="grid grid-cols-2 gap-x-4 gap-y-1">
                                                        <span className="text-[9px] font-black text-slate-400 uppercase">Sector:</span>
                                                        <span className="text-[10px] font-black text-slate-700">{row.Z_NAME} ({row.V_Zone})</span>
                                                        <span className="text-[9px] font-black text-slate-400 uppercase">Buffer:</span>
                                                        <span className="text-[10px] font-black text-slate-700">{row.bl_name} ({row.v_block})</span>
                                                    </div>
                                                </td>
                                                <td className="p-4 text-left">
                                                    <div className="flex flex-col">
                                                        <span className="font-black text-slate-800 text-[11px]">{row.vr_name}</span>
                                                        <div className="flex gap-2 mt-1">
                                                            <span className={`text-[8px] px-2 py-0.5 rounded font-black uppercase ${row.vr_Cane_Type?.includes('Early') ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-700'}`}>
                                                                {row.vr_Cane_Type}
                                                            </span>
                                                            <code className="text-[8px] text-slate-400">V-{row.IN_VARIETY}</code>
                                                        </div>
                                                    </div>
                                                </td>
                                            </tr>
                  )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div> :
        !loading &&
        <div className="py-40 flex flex-col items-center justify-center bg-white rounded-[4rem] shadow-2xl border border-white relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-64 h-64 bg-slate-50 rounded-full -mr-32 -mt-32 blur-3xl opacity-50"></div>
                        <div className="w-40 h-40 bg-blue-50 rounded-full flex items-center justify-center mb-10 shadow-inner group hover:scale-110 transition-all duration-700">
                            <i className="fas fa-calendar-check text-blue-200 group-hover:text-blue-500 text-6xl transition-colors"></i>
                        </div>
                        <h3 className="text-2xl font-black text-slate-800 tracking-tight italic uppercase">Allocation Matrix Latent</h3>
                        <p className="text-slate-400 text-center max-w-sm mt-4 font-bold uppercase tracking-widest text-[9px] leading-loose">
                            Identify a manufacturing node and temporal range to establish the resource allocation matrix and analyze weekly seasonal indenting flow.
                        </p>
                    </div>
        }
            </div>
        </div>);

};

export default SurveyReport_WeeklySubmissionofIndents;