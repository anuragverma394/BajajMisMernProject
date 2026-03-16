import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast, Toaster } from 'react-hot-toast';
import { surveyService, masterService } from '../../microservices/api.service';
import '../../styles/SurveyActualVarietywise.css';const __cx = (...vals) => vals.filter(Boolean).join(" ");
import { openPrintWindow } from '../../utils/print';

const SurveyReport_SurveyActualVarietywise = () => {
  const navigate = useNavigate();
  const tableRef = useRef(null);

  // Form Search State
  const [factories, setFactories] = useState([]);
  const [unitCode, setUnitCode] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [caneType, setCaneType] = useState('1'); // 1-General, 2-Gashti Amity
  const [isLoading, setIsLoading] = useState(false);
  const [reportData, setReportData] = useState(null);
  const [grandTotals, setGrandTotals] = useState(null);

  useEffect(() => {
    const loadUnits = async () => {
      try {
        const units = await masterService.getUnits();
        setFactories(units);
        if (units.length > 0) {
          setUnitCode(units[0].F_Code || units[0].id);
        }
      } catch (error) {
        toast.error("Telemetry link failure: Station registry unreachable");
      }
    };
    loadUnits();
  }, []);

  const handleSearch = async (e) => {
    if (e) e.preventDefault();
    if (!unitCode) {
      toast.error("Command node identification required");
      return;
    }

    setIsLoading(true);
    try {
      const params = { unitCode, date, caneType };
      const response = await surveyService.getActualVarietyWise(params);
      setReportData(response.data);
      setGrandTotals(response.totals);
      toast.success('Comparative Evolution Matrix populated');
    } catch (error) {
      toast.error('Synthetic analytical failure: Evolution interrupted');
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePrint = () => {
    if (!reportData) return;
    openPrintWindow({
      title: "Actual Variety Wise Area And Supply",
      subtitle: `As on: ${date}`,
      contentHtml: tableRef.current ? tableRef.current.outerHTML : ""
    });
  };

  return (
    <div className={__cx("container-fluid", "p-[0] bg-white min-h-[100vh]")}>
            <Toaster position="top-center" reverseOrder={false} />

            <div className="bg-[#1b9970] py-[10px] px-[20px] text-white flex justify-between items-center">
                <h2 className="m-[0px] text-[18px] font-medium">Actual Variety Wise Area And Supply</h2>
            </div>

            <div className="p-[20px]">
                <div className="bg-[#e8f3ee] py-[10px] px-[15px] text-[#1b9970] border border-[#c3e2d6] rounded mb-[20px] text-[13px]">
                    Actual Variety Wise Area And Supply
                </div>

                <form onSubmit={handleSearch}>
                    <div className="flex gap-[20px] mb-[20px] items-end">
                        <div className="min-w-[200px] max-w-[300px]">
                            <label className="block mb-[8px] text-[13px] font-semibold text-[#333]">Type of cane Area</label>
                            <select
                className={__cx("form-select", "w-[100%] h-[38px] rounded border border-[#ccc]")}
                value={caneType}
                onChange={(e) => setCaneType(e.target.value)}>

                
                                <option value="1">As Per First Survey</option>
                                <option value="2">As Per Caneup Portal</option>
                            </select>
                        </div>
                        <div className="min-w-[200px] max-w-[300px]">
                            <label className="block mb-[8px] text-[13px] font-semibold text-[#333]">Factory</label>
                            <select
                className={__cx("form-select", "w-[100%] h-[38px] rounded border border-[#ccc]")}
                value={unitCode}
                onChange={(e) => setUnitCode(e.target.value)}
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
                value={date}
                onChange={(e) => setDate(e.target.value)} />

              
                        </div>
                    </div>

                    <div className="flex gap-[10px] mb-[20px]">
                        <button type="submit" disabled={isLoading} className="bg-[#1b9970] text-white border-0 py-[8px] px-[20px] rounded text-[13px] cursor-pointer">
                            Search
                        </button>
                        {reportData &&
            <button type="button" onClick={handlePrint} className="bg-[#1b9970] text-white border-0 py-[8px] px-[20px] rounded text-[13px] cursor-pointer">
                                Print
                            </button>
            }
                        {reportData &&
            <button type="button" onClick={() => {toast.success("Exporting to Excel...");}} className="bg-[#1b9970] text-white border-0 py-[8px] px-[20px] rounded text-[13px] cursor-pointer">
                                Excel
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

                {reportData &&
        <div className="overflow-x-auto border border-[#e2e8f0] mt-[20px]">
                        <table ref={tableRef} className="w-[100%] text-[13px]">
                            <thead>
                                <tr>
                                    <th rowSpan="2" className="border border-[#e2e8f0] p-[10px] bg-[#f8fafc] font-semibold text-[#333] text-left">Variety Architecture</th>
                                    <th rowSpan="2" className="border border-[#e2e8f0] p-[10px] bg-[#f8fafc] font-semibold text-[#333]">Class</th>
                                    <th colSpan="4" className="border border-[#e2e8f0] p-[10px] bg-[#f8fafc] font-semibold text-[#333]">Legacy Cycles</th>
                                    <th colSpan="4" className="border border-[#e2e8f0] p-[10px] bg-[#f8fafc] font-semibold text-[#333]">Active Evolution</th>
                                    <th colSpan="3" className="border border-[#e2e8f0] p-[10px] bg-[#f8fafc] font-semibold text-[#333]">Deviation Diagnostics</th>
                                </tr>
                                <tr>
                                    <th className="border border-[#e2e8f0] p-[8px] bg-[#f8fafc] font-semibold text-[#333]">Ratoon</th>
                                    <th className="border border-[#e2e8f0] p-[8px] bg-[#f8fafc] font-semibold text-[#333]">Autumn</th>
                                    <th className="border border-[#e2e8f0] p-[8px] bg-[#f8fafc] font-semibold text-[#333]">Plant</th>
                                    <th className="border border-[#e2e8f0] p-[8px] bg-[#f8fafc] font-semibold text-[#333]">Matrix Sum</th>
                                    <th className="border border-[#e2e8f0] p-[8px] bg-[#f8fafc] font-semibold text-[#333]">Ratoon</th>
                                    <th className="border border-[#e2e8f0] p-[8px] bg-[#f8fafc] font-semibold text-[#333]">Autumn</th>
                                    <th className="border border-[#e2e8f0] p-[8px] bg-[#f8fafc] font-semibold text-[#333]">Plant</th>
                                    <th className="border border-[#e2e8f0] p-[8px] bg-[#f8fafc] font-semibold text-[#333]">Matrix Sum</th>
                                    <th className="border border-[#e2e8f0] p-[8px] bg-[#f8fafc] font-semibold text-[#333]">Heuristic</th>
                                    <th className="border border-[#e2e8f0] p-[8px] bg-[#f8fafc] font-semibold text-[#333]">Flux %</th>
                                    <th className="border border-[#e2e8f0] p-[8px] bg-[#f8fafc] font-semibold text-[#333]">PCD Logic</th>
                                </tr>
                            </thead>
                            <tbody>
                                {reportData.map((row, idx) =>
              <tr key={idx} className="bg-white font-normal">
                                        <td className="border border-[#e2e8f0] p-[8px]">
                                            {row.VarietyCode} - {row.VarietyName}
                                        </td>
                                        <td className="border border-[#e2e8f0] p-[8px] text-center">
                                            {row.VarietyType}
                                        </td>
                                        <td className="border border-[#e2e8f0] p-[8px] text-center">{row.PreRatoon?.toLocaleString()}</td>
                                        <td className="border border-[#e2e8f0] p-[8px] text-center">{row.PreAutumn?.toLocaleString()}</td>
                                        <td className="border border-[#e2e8f0] p-[8px] text-center">{row.PrePlant?.toLocaleString()}</td>
                                        <td className="border border-[#e2e8f0] p-[8px] text-center">{row.PreTotal?.toLocaleString()}</td>
                                        <td className="border border-[#e2e8f0] p-[8px] text-center">{row.CRatoon?.toLocaleString()}</td>
                                        <td className="border border-[#e2e8f0] p-[8px] text-center">{row.CAutumn?.toLocaleString()}</td>
                                        <td className="border border-[#e2e8f0] p-[8px] text-center">{row.CPlant?.toLocaleString()}</td>
                                        <td className="border border-[#e2e8f0] p-[8px] text-center">{row.CTotal?.toLocaleString()}</td>
                                        <td className="border border-[#e2e8f0] p-[8px] text-center">
                                            {row.VarianceH?.toLocaleString()}
                                        </td>
                                        <td className="border border-[#e2e8f0] p-[8px] text-center">
                                            {row.VarianceP}%
                                        </td>
                                        <td className="border border-[#e2e8f0] p-[8px] text-center">
                                            {row.PCDPercent}%
                                        </td>
                                    </tr>
              )}
                            </tbody>
                            {grandTotals &&
            <tfoot>
                                    <tr className="bg-[#f1f5f9] font-bold">
                                        <td colSpan="2" className="border border-[#e2e8f0] p-[10px] text-right">Total</td>
                                        <td className="border border-[#e2e8f0] p-[10px] text-center">{grandTotals.preRatoon?.toLocaleString()}</td>
                                        <td className="border border-[#e2e8f0] p-[10px] text-center">{grandTotals.preAutumn?.toLocaleString()}</td>
                                        <td className="border border-[#e2e8f0] p-[10px] text-center">{grandTotals.prePlant?.toLocaleString()}</td>
                                        <td className="border border-[#e2e8f0] p-[10px] text-center">{grandTotals.preTotal?.toLocaleString()}</td>
                                        <td className="border border-[#e2e8f0] p-[10px] text-center">{grandTotals.crRatoon?.toLocaleString()}</td>
                                        <td className="border border-[#e2e8f0] p-[10px] text-center">{grandTotals.crAutumn?.toLocaleString()}</td>
                                        <td className="border border-[#e2e8f0] p-[10px] text-center">{grandTotals.crPlant?.toLocaleString()}</td>
                                        <td className="border border-[#e2e8f0] p-[10px] text-center">{grandTotals.crTotal?.toLocaleString()}</td>
                                        <td colSpan="3" className="border border-[#e2e8f0] p-[10px]"></td>
                                    </tr>
                                </tfoot>
            }
                        </table>
                    </div>
        }
            </div>
        </div>);

};

export default SurveyReport_SurveyActualVarietywise;
