import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast, Toaster } from 'react-hot-toast';
import { surveyService, masterService } from '../../microservices/api.service';
import '../../styles/SurveyReports.css';const __cx = (...vals) => vals.filter(Boolean).join(" ");const SurveyReport_SurveyUnitWiseSurveyAreaSummary = () => {const navigate = useNavigate();const [factories, setFactories] = useState([]);const [loading, setLoading] = useState(false);const [reportData, setReportData] = useState([]);const [filters, setFilters] = useState({ F_code: '',
      Date: new Date().toISOString().split('T')[0],
      CaneType: '1'
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
        toast.error("Telemetry link failure: Station registry unreachable");
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
      const response = await surveyService.getSurveyUnitWiseAreaSummary(filters);
      setReportData(response.data || response || []);
      toast.success("Area architecture synchronized");
    } catch (error) {
      toast.error("Synthetic analytical failure: Architecture mapping aborted");
      setReportData([]);
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = () => {
    const printContent = document.getElementById('survey-summary-print');
    const WinPrint = window.open('', '', 'left=0,top=0,width=1000,height=900,toolbar=0,scrollbars=0,status=0');
    WinPrint.document.write(`
            <html>
                <head>
                    <title>Unit Wise Survey Area Summary Report</title>
                    <style>
                        table { width: 100%; border-collapse: collapse; font-family: sans-serif; font-size: 11px; }
                        th, td { border: 1px solid #e2e8f0; padding: 8px; text-align: center; }
                        th { background: #f8fafc; font-weight: bold; }
                        h2, h4, p { margin: 5px 0; text-align: center; }
                    </style>
                </head>
                <body>
                    <h2>Bajaj Group</h2>
                    
                    <p>As on: ${filters.Date}</p>
                    ${printContent.innerHTML}
                </body>
            </html>
        `);
    WinPrint.document.close();
    WinPrint.focus();
    WinPrint.print();
  };

  const handleExport = () => {
    if (reportData.length === 0) return;
    const csvContent = "data:text/csv;charset=utf-8," +
    Object.keys(reportData[0]).join(",") + "\n" +
    reportData.map((row) => Object.values(row).join(",")).join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `AreaArchetype_${filters.Date}.csv`);
    document.body.appendChild(link);
    link.click();
    toast.success("Area archetype exported to CSV");
  };

  return (
    <div className={__cx("container-fluid", "p-[0] bg-white min-h-[100vh]")}>
            <Toaster position="top-center" reverseOrder={false} />

            <div className="bg-[#1b9970] py-[10px] px-[20px] text-white flex justify-between items-center">
                <h2 className="m-[0px] text-[18px] font-medium">Unit Wise Survey Area Summary Report</h2>
            </div>

            <div className="p-[20px]">


                <form onSubmit={handleSearch}>
                    <div className="flex gap-[20px] mb-[20px] items-end">
                        <div className="min-w-[200px] max-w-[300px]">
                            <label className="block mb-[8px] text-[13px] font-semibold text-[#333]">Type of cane Area</label>
                            <select
                className={__cx("form-select", "w-[100%] h-[38px] rounded border border-[#ccc]")}
                value={filters.CaneType}
                onChange={(e) => setFilters({ ...filters, CaneType: e.target.value })}>

                
                                <option value="1">As Per First Survey</option>
                                <option value="2">As Per Caneup Portal</option>
                            </select>
                        </div>
                        <div className="min-w-[200px] max-w-[300px]">
                            <label className="block mb-[8px] text-[13px] font-semibold text-[#333]">Factory</label>
                            <select
                className={__cx("form-select", "w-[100%] h-[38px] rounded border border-[#ccc]")}
                value={filters.F_code}
                onChange={(e) => setFilters({ ...filters, F_code: e.target.value })}
                required>

                
                                <option value="">All</option>
                                {factories.map((f, idx) => <option key={`${f.F_Code || f.id}-${idx}`} value={f.F_Code || f.id}>{f.F_Name || f.name}</option>)}
                            </select>
                        </div>
                        <div className="min-w-[200px] max-w-[300px]">
                            <label className="block mb-[8px] text-[13px] font-semibold text-[#333]">Date</label>
                            <input
                type="date"
                className={__cx("form-control", "w-[100%] h-[38px] rounded border border-[#ccc]")}
                value={filters.Date}
                onChange={(e) => setFilters({ ...filters, Date: e.target.value })} />

              
                        </div>
                    </div>

                    <div className="flex gap-[10px] mb-[20px]">
                        <button type="submit" disabled={loading} className="bg-[#1b9970] text-white border-0 py-[8px] px-[20px] rounded text-[13px] cursor-pointer">
                            Search
                        </button>
                        {reportData.length > 0 &&
            <button type="button" onClick={handleExport} className="bg-[#1b9970] text-white border-0 py-[8px] px-[20px] rounded text-[13px] cursor-pointer">
                                Excel
                            </button>
            }
                        {reportData.length > 0 &&
            <button type="button" onClick={handlePrint} className="bg-[#1b9970] text-white border-0 py-[8px] px-[20px] rounded text-[13px] cursor-pointer">
                                Print
                            </button>
            }
                        <button type="button" onClick={() => navigate('/SurveyReport')} className="bg-[#1b9970] text-white border-0 py-[8px] px-[20px] rounded text-[13px] cursor-pointer">
                            Exit
                        </button>
                    </div>
                </form>

                <div className="flex justify-end mt-[-50px] mb-[20px]">
                    <div className="bg-[#3498db] text-white w-[30px] h-[30px] rounded-[50%] flex justify-center items-center font-bold cursor-pointer">
                        ?
                    </div>
                </div>


                {reportData.length > 0 &&
        <div id="survey-summary-print" className="overflow-x-auto border border-[#e2e8f0] mt-[20px]">
                        <table className="w-[100%] text-[13px]">
                            <thead>
                                <tr>
                                    <th rowSpan="2" className="border border-[#e2e8f0] p-[10px] bg-[#f8fafc] font-semibold text-[#333]">Idx</th>
                                    <th rowSpan="2" className="border border-[#e2e8f0] p-[10px] bg-[#f8fafc] font-semibold text-[#333] text-left">Station Hierarchy</th>
                                    <th colSpan="4" className="border border-[#e2e8f0] p-[10px] bg-[#f8fafc] font-semibold text-[#333]">Legacy Infrastructure (Hec)</th>
                                    <th colSpan="5" className="border border-[#e2e8f0] p-[10px] bg-[#f8fafc] font-semibold text-[#333]">Active Infrastructure (Hec)</th>
                                    <th colSpan="2" className="border border-[#e2e8f0] p-[10px] bg-[#f8fafc] font-semibold text-[#333]">Deviation Diagnostics</th>
                                </tr>
                                <tr>
                                    <th className="border border-[#e2e8f0] p-[8px] bg-[#f8fafc] font-semibold text-[#333]">Ratoon</th>
                                    <th className="border border-[#e2e8f0] p-[8px] bg-[#f8fafc] font-semibold text-[#333]">Autumn</th>
                                    <th className="border border-[#e2e8f0] p-[8px] bg-[#f8fafc] font-semibold text-[#333]">Plant</th>
                                    <th className="border border-[#e2e8f0] p-[8px] bg-[#f8fafc] font-semibold text-[#333]">Total</th>
                                    <th className="border border-[#e2e8f0] p-[8px] bg-[#f8fafc] font-semibold text-[#333]">Ratoon I</th>
                                    <th className="border border-[#e2e8f0] p-[8px] bg-[#f8fafc] font-semibold text-[#333]">Ratoon II</th>
                                    <th className="border border-[#e2e8f0] p-[8px] bg-[#f8fafc] font-semibold text-[#333]">Autumn</th>
                                    <th className="border border-[#e2e8f0] p-[8px] bg-[#f8fafc] font-semibold text-[#333]">Plant</th>
                                    <th className="border border-[#e2e8f0] p-[8px] bg-[#f8fafc] font-semibold text-[#333]">Total</th>
                                    <th className="border border-[#e2e8f0] p-[8px] bg-[#f8fafc] font-semibold text-[#333]">Hec Flux</th>
                                    <th className="border border-[#e2e8f0] p-[8px] bg-[#f8fafc] font-semibold text-[#333]">Flux %</th>
                                </tr>
                            </thead>
                            <tbody>
                                {reportData.map((row, idx) => {
                const isTotal = row.Factory === 'Total';
                return (
                  <tr key={idx} className={isTotal ? "bg-[#f1f5f9] font-bold" : "bg-white font-normal"}>
                                            <td className="border border-[#e2e8f0] p-[8px] text-center">{row.SN}</td>
                                            <td className="border border-[#e2e8f0] p-[8px]">{row.Factory}</td>
                                            <td className="border border-[#e2e8f0] p-[8px] text-center">{row.PreRatoon}</td>
                                            <td className="border border-[#e2e8f0] p-[8px] text-center">{row.PreAutumn}</td>
                                            <td className="border border-[#e2e8f0] p-[8px] text-center">{row.PrePlant}</td>
                                            <td className="border border-[#e2e8f0] p-[8px] text-center">{row.PreTotal}</td>
                                            <td className="border border-[#e2e8f0] p-[8px] text-center">{row.CRatoon}</td>
                                            <td className="border border-[#e2e8f0] p-[8px] text-center">{row.CRatoon2}</td>
                                            <td className="border border-[#e2e8f0] p-[8px] text-center">{row.CAutumn}</td>
                                            <td className="border border-[#e2e8f0] p-[8px] text-center">{row.CPlant}</td>
                                            <td className="border border-[#e2e8f0] p-[8px] text-center">{row.CTotal}</td>
                                            <td className="border border-[#e2e8f0] p-[8px] text-center">{row.VarianceH}</td>
                                            <td className="border border-[#e2e8f0] p-[8px] text-center">{row.VarianceP}</td>
                                        </tr>);

              })}
                            </tbody>
                        </table>
                    </div>
        }
            </div>
        </div>);

};

export default SurveyReport_SurveyUnitWiseSurveyAreaSummary;