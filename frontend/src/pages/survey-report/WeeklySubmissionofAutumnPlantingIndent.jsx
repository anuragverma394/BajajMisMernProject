import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast, Toaster } from 'react-hot-toast';
import { surveyService, masterService } from '../../microservices/api.service';
import '../../styles/SurveyReports.css';
import { openPrintWindow } from '../../utils/print';
const __cx = (...vals) => vals.filter(Boolean).join(" ");

const SurveyReport_WeeklySubmissionofAutumnPlantingIndent = () => {
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
    DateTo: new Date().toISOString().split('T')[0],
    PlantinType: 'Autumn'
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
        toast.error("Telemetry link failure: Unit master offline");
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
      const response = await surveyService.getWeeklyPlanting(filters);
      setReportData(response.data || response || []);
      toast.success("Planting records synchronized");
    } catch (error) {
      toast.error("Anomalous data flux: Record lookup aborted");
      setReportData([]);
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = () => {
    const content = document.getElementById('planting-print-area');
    openPrintWindow({
      title: `${filters.PlantinType} Planting Audit`,
      subtitle: `Unit: ${filters.unit} | Range: ${filters.Datefrom} to ${filters.DateTo}`,
      contentHtml: content ? content.outerHTML : ""
    });
  };

  return (
    <div className="p-[20px] bg-white min-h-[100vh] font-['Poppins', Arial, sans-serif]">
            <Toaster position="top-right" />

            <div className={__cx("page-card", "rounded-lg border-0 shadow-[0 4px 12px rgba(0,0,0,0.1)]")}>
                <div className={__cx("page-card-header", "text-left text-[15px] py-[12px] px-[20px] bg-[#1F9E8A]")}>
                    Weekly Submission of Planting Report
                </div>
                <div className="bg-[#e2efda] py-[10px] px-[20px] text-[13px] text-[#333] border-b border-b-[#c8e6c9] font-bold">
                    Weekly Submission of Planting Report
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
                            <label className="block text-[12px] font-bold text-[#333] mb-[4px]">Planting Type</label>
                            <select
                className={__cx("form-control", "w-[100%] p-[8px] border border-[#ccc] rounded")}
                value={filters.PlantinType}
                onChange={(e) => setFilters({ ...filters, PlantinType: e.target.value })}>

                
                                <option value="">---Please Select---</option>
                                <option value="Autumn">Autumn</option>
                                <option value="Spring">Spring</option>
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
        <div className="space-y-10 animate-in slide-in-from-bottom-10 duration-1000" id="planting-print-area">
                        <div className="bg-white rounded-[4rem] shadow-2xl border border-white overflow-hidden">
                            <div className="px-10 py-8 border-b border-slate-50 flex justify-between items-center bg-slate-50/50">
                                <h3 className="font-black text-slate-800 uppercase tracking-widest text-[13px]">Planting Submission Matrix</h3>
                            </div>
                            <div className="table-wrapper-premium overflow-x-auto p-4">
                                <table className="table-premium w-full border-separate border-spacing-0">
                                    <thead>
                                        <tr className="bg-slate-900 text-white">
                                            <th className="p-4 text-center text-[9px] font-black uppercase border-r border-slate-800 rounded-tl-[3rem]">Idx</th>
                                            <th className="p-4 text-left text-[9px] font-black uppercase border-r border-slate-800">Entity Details</th>
                                            <th className="p-4 text-center text-[9px] font-black uppercase border-r border-slate-800 bg-teal-900 text-teal-400">Variety</th>
                                            <th className="p-4 text-center text-[9px] font-black uppercase border-r border-slate-800 bg-teal-950 text-teal-500">Area (Hec)</th>
                                            <th className="p-4 text-center text-[9px] font-black uppercase border-r border-slate-800">Chronos</th>
                                            <th className="p-4 text-center text-[9px] font-black uppercase border-r border-slate-800">Logistics</th>
                                            <th className="p-4 text-center text-[9px] font-black uppercase rounded-tr-[3rem]">Cluster Node</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {reportData.map((row, idx) =>
                  <tr key={idx} className="hover:bg-teal-50/50 transition-all border-b border-slate-50 group">
                                                <td className="p-4 text-center mono text-[10px] text-slate-300 border-r border-slate-50">[{idx + 1}]</td>
                                                <td className="p-4 text-left border-r border-slate-50">
                                                    <div className="font-black text-slate-800 text-[12px]">{row.g_name}</div>
                                                    <div className="flex gap-2 text-[8px] font-black text-slate-400 uppercase">
                                                        <span>S/O: {row.g_father}</span>
                                                        <span className="text-teal-500 italic">[{row.Growercode}]</span>
                                                    </div>
                                                </td>
                                                <td className="p-4 text-center border-r border-slate-50 bg-teal-50/20">
                                                    <div className="font-black text-teal-900 leading-none">{row.vr_name}</div>
                                                    <div className="text-[8px] text-slate-400 uppercase tracking-tighter mt-1">{row.vr_Cane_Type}</div>
                                                </td>
                                                <td className="p-4 text-center mono font-black text-slate-900 text-xl border-r border-slate-50">
                                                    {row.gh_area}
                                                </td>
                                                <td className="p-4 text-center border-r border-slate-50">
                                                    <div className="text-[10px] font-black text-slate-700">{row.plantingDt}</div>
                                                    <div className="text-[8px] text-slate-400 opacity-60">Entered: {row.gh_ent_date}</div>
                                                </td>
                                                <td className="p-4 text-center border-r border-slate-50">
                                                    <div className="text-[9px] font-black text-slate-600 uppercase italic leading-tight">{row.sm_Name}</div>
                                                    <div className="text-[8px] text-slate-400 uppercase">Src: {row.seedself}</div>
                                                </td>
                                                <td className="p-4 text-center text-[10px] font-black text-slate-400 group-hover:text-teal-600 transition-colors">
                                                    <div className="flex flex-col uppercase text-[8px] tracking-tighter">
                                                        <span>{row.Z_NAME}</span>
                                                        <span>{row.bl_name}</span>
                                                        <span className="text-[7px] text-slate-300">{row.v_circle_Name}</span>
                                                    </div>
                                                </td>
                                            </tr>
                  )}
                                    </tbody>
                                    <tfoot className="bg-slate-900 text-white border-t-4 border-teal-500">
                                        <tr className="font-black uppercase tracking-tighter">
                                            <td colSpan="3" className="p-6 text-right text-[12px] text-teal-400 border-r border-slate-800 rounded-bl-[4rem]">Collective Planting Area</td>
                                            <td className="p-6 text-center text-4xl mono text-white bg-teal-500/10 border-r border-slate-800">
                                                {reportData.reduce((acc, curr) => acc + (parseFloat(curr.gh_area) || 0), 0).toFixed(3)}
                                            </td>
                                            <td colSpan="3" className="p-6 text-center text-slate-500 rounded-br-[4rem]">Entities Processed: {reportData.length}</td>
                                        </tr>
                                    </tfoot>
                                </table>
                            </div>
                        </div>
                    </div> :
        !loading &&
        <div className="py-40 flex flex-col items-center justify-center bg-white rounded-[4rem] shadow-2xl border border-white">
                        <div className="w-40 h-40 bg-teal-50 rounded-full flex items-center justify-center mb-10 shadow-inner group hover:scale-110 transition-all duration-700">
                            <i className="fas fa-seedling text-teal-200 group-hover:text-teal-500 text-6xl transition-colors"></i>
                        </div>
                        <h3 className="text-2xl font-black text-slate-800 tracking-tight italic uppercase">Planting Matrix Latent</h3>
                        <p className="text-slate-400 text-center max-w-sm mt-4 font-bold uppercase tracking-widest text-[9px] leading-loose">
                            Configure sector nodes and chronos range to decrypt agriculture distribution and soil utilization heuristics.
                        </p>
                    </div>
        }
            </div>
        </div>);

};

export default SurveyReport_WeeklySubmissionofAutumnPlantingIndent;
