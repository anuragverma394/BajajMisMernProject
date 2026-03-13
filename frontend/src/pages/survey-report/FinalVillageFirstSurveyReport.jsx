import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast, Toaster } from 'react-hot-toast';
import { surveyService, masterService } from '../../microservices/api.service';
import '../../styles/base.css';const SurveyReport_FinalVillageFirstSurveyReport = () => {const navigate = useNavigate();const tableRef = useRef(null);const [factories, setFactories] = useState([]);const [unitCode, setUnitCode] = useState('All');const [caneType, setCaneType] = useState('As Per First Survey');const [onlyCompleted, setOnlyCompleted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [reportData, setReportData] = useState([]);
  const [reportTotals, setReportTotals] = useState(null);

  useEffect(() => {
    masterService.getUnits().then((d) => {
      const data = Array.isArray(d) ? d : d.data || [];
      setFactories(data);
    }).catch(() => {});
  }, []);

  const handleSearch = async (e) => {
    if (e) e.preventDefault();
    setIsLoading(true);
    try {
      const params = { unitCode, caneType, onlyCompleted };
      const response = await surveyService.getFinalVillageFirstSurvey(params);
      setReportData(response.data || response || []);
      setReportTotals(response.totals);
      toast.success('Telemetry integration successful.');
    } catch (error) {
      toast.error('Data link failure.');
    } finally {
      setIsLoading(false);
    }
  };

  const headerStyle = "bg-[#16a085] text-white py-[10px] px-[20px] text-4 font-medium rounded-[8px 8px 0 0] mb-[1px]";









  const subHeaderStyle = "bg-[#e6f3e6] text-[#2e7d32] py-[8px] px-[20px] text-[13px] font-semibold border-b border-b-[#c8e6c9] mb-[20px]";









  const cardStyle = "p-[25px] border border-[#e2e8f0] rounded-lg bg-white shadow-[0 1px 3px rgba(0,0,0,0.05)] mb-[20px] relative";









  const labelStyle = "block text-[13px] font-semibold text-[#333] mb-[8px]";







  const inputStyle = "w-[100%] py-[8px] px-[12px] border border-[#cbd5e1] rounded text-[13px] bg-white ";









  const btnStyle = (bg = '#16a085') => ({
    padding: '8px 20px',
    borderRadius: '4px',
    fontSize: '13px',
    fontWeight: '500',
    cursor: 'pointer',
    border: 'none',
    color: 'white',
    backgroundColor: bg,
    minWidth: '80px'
  });

  const helpIconStyle = "absolute right-[40px] bottom-[85px] w-[32px] h-[32px] bg-[#3498db] text-white rounded-[50%] flex items-center justify-center text-[18px] cursor-pointer shadow-[0 2px 4px rgba(0,0,0,0.1)]";
















  return (
    <div className="p-[20px] bg-white min-h-[100vh] font-['Segoe UI', Tahoma, Geneva, Verdana, sans-serif]">
            <Toaster position="top-right" />

            <div className={headerStyle}>
                Final Village First Survey Report
            </div>

            <div className="border border-[#e2e8f0] rounded-[0 0 8px 8px]">
                <div className={subHeaderStyle}>
                    Final Village First Survey Report
                </div>

                <div className={cardStyle}>
                    <div className="flex gap-[40px] mb-[25px]">
                        <div className="w-[280px]">
                            <label className={labelStyle}>Type of cane Area</label>
                            <select
                value={caneType}
                onChange={(e) => setCaneType(e.target.value)} className={inputStyle}>

                
                                <option value="As Per First Survey">As Per First Survey</option>
                                <option value="Caneup Portal">Caneup Portal</option>
                            </select>
                        </div>
                        <div className="w-[280px]">
                            <label className={labelStyle}>Factory</label>
                            <select
                value={unitCode}
                onChange={(e) => setUnitCode(e.target.value)} className={inputStyle}>

                
                                <option value="All">All</option>
                                {factories.map((f, idx) =>
                <option key={`${f.F_Code || f.id}-${idx}`} value={f.F_Code || f.id}>{f.F_Name || f.name}</option>
                )}
                            </select>
                        </div>
                        <div className="min-w-[150px]">
                            <label className={labelStyle}>Final Village Check</label>
                            <input
                type="checkbox"
                checked={onlyCompleted}
                onChange={(e) => setOnlyCompleted(e.target.checked)} className="" />

              
                        </div>
                    </div>

                    <div className="flex gap-[10px]">
                        <button onClick={handleSearch} disabled={isLoading} className="px-5 py-2 rounded text-[13px] font-medium cursor-pointer border-0 text-white min-w-[90px] bg-[#16a085]">
                            {isLoading ? '...' : 'Search'}
                        </button>
                        <button onClick={() => toast.info("Exporting Excel...")} className="px-5 py-2 rounded text-[13px] font-medium cursor-pointer border-0 text-white min-w-[90px] bg-[#16a085]">
                            Excel
                        </button>
                        <button onClick={() => window.print()} className="px-5 py-2 rounded text-[13px] font-medium cursor-pointer border-0 text-white min-w-[90px] bg-[#16a085]">
                            Print
                        </button>
                        <button onClick={() => navigate(-1)} className="px-5 py-2 rounded text-[13px] font-medium cursor-pointer border-0 text-white min-w-[90px] bg-[#16a085]">
                            Exit
                        </button>
                    </div>

                    <div className={helpIconStyle}>?</div>
                </div>

                <div className="p-[0 20px 20px 20px]">
                    {reportData.length > 0 &&
          <div className="overflow-x-auto border border-[#e2e8f0] rounded">
                            <table ref={tableRef} className="w-[100%] text-[11px]">
                                <thead>
                                    <tr className="bg-[#2d3436] text-white font-bold">
                                        <th className="p-[10px] border border-[#444]">Station Node</th>
                                        <th className="p-[10px] border border-[#444]">Ratoon LY</th>
                                        <th className="p-[10px] border border-[#444]">Autumn LY</th>
                                        <th className="p-[10px] border border-[#444]">Plant LY</th>
                                        <th className="p-[10px] border border-[#444]">Total LY</th>
                                        <th className="p-[10px] border border-[#444] bg-[#2e7d32]">Ratoon I</th>
                                        <th className="p-[10px] border border-[#444] bg-[#2e7d32]">Ratoon II</th>
                                        <th className="p-[10px] border border-[#444] bg-[#2e7d32]">Autumn CY</th>
                                        <th className="p-[10px] border border-[#444] bg-[#2e7d32]">Plant CY</th>
                                        <th className="p-[10px] border border-[#444] bg-[#2e7d32]">Total CY</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {reportData.map((row, idx) =>
                <tr key={idx} className="border-b border-b-[#f1f5f9]">
                                            <td className="p-[8px]">
                                                <span className="text-[#999] mr-[5px]">[{row.VillageCode}]</span>
                                                {row.VillageName}
                                            </td>
                                            <td className="p-[8px] text-right">{row.RATOON_LY}</td>
                                            <td className="p-[8px] text-right">{row.AUTUMN_LY}</td>
                                            <td className="p-[8px] text-right">{row.PLANT_LY}</td>
                                            <td className="p-[8px] text-right font-bold">{row.Total_LY}</td>
                                            <td className="p-[8px] text-right">{row.RATOON}</td>
                                            <td className="p-[8px] text-right">{row.RATOONII}</td>
                                            <td className="p-[8px] text-right">{row.AUTUMN}</td>
                                            <td className="p-[8px] text-right">{row.PLANT}</td>
                                            <td className="p-[8px] text-right font-bold bg-[#f0fdf4]">{row.Total}</td>
                                        </tr>
                )}
                                </tbody>
                                {reportTotals &&
              <tfoot className="bg-[#2d3436] text-white font-bold">
                                        <tr>
                                            <td className="p-[10px] border border-[#444]">TOTAL</td>
                                            <td className="p-[10px] border border-[#444] text-right">{reportTotals.ratoonLY.toFixed(3)}</td>
                                            <td className="p-[10px] border border-[#444] text-right">{reportTotals.autumnLY.toFixed(3)}</td>
                                            <td className="p-[10px] border border-[#444] text-right">{reportTotals.plantLY.toFixed(3)}</td>
                                            <td className="p-[10px] border border-[#444] text-right">{reportTotals.totalLY.toFixed(3)}</td>
                                            <td className="p-[10px] border border-[#444] text-right">{reportTotals.ratoon.toFixed(3)}</td>
                                            <td className="p-[10px] border border-[#444] text-right">{reportTotals.ratoonII.toFixed(3)}</td>
                                            <td className="p-[10px] border border-[#444] text-right">{reportTotals.autumn.toFixed(3)}</td>
                                            <td className="p-[10px] border border-[#444] text-right">{reportTotals.plant.toFixed(3)}</td>
                                            <td className="p-[10px] border border-[#444] text-right">{reportTotals.total.toFixed(3)}</td>
                                        </tr>
                                    </tfoot>
              }
                            </table>
                        </div>
          }
                </div>
            </div>

            <footer className="mt-[20px] py-[0] px-[20px] text-[11px] text-[#999]">
                2021 © Bajaj Hindusthan Sugar Ltd. All Rights Reserved. Designed & Developed By Vibrant IT Solutions Pvt. Ltd.
            </footer>
        </div>);

};

export default SurveyReport_FinalVillageFirstSurveyReport;