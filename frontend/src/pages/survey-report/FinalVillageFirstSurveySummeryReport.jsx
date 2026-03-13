import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast, Toaster } from 'react-hot-toast';
import { surveyService, masterService } from '../../microservices/api.service';
import '../../styles/base.css';const SurveyReport_FinalVillageFirstSurveySummeryReport = () => {const navigate = useNavigate();const tableRef = useRef(null);const [factories, setFactories] = useState([]);const [unitCode, setUnitCode] = useState('All');const [caneType, setCaneType] = useState('As Per First Survey');const [isLoading, setIsLoading] = useState(false);
  const [reportData, setReportData] = useState([]);

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
      const params = { unitCode, caneType };
      const response = await surveyService.getFinalVillageFirstSurveySummery(params);
      setReportData(response.data || response || []);
      toast.success('Village infrastructure matrix synchronized.');
    } catch (error) {
      toast.error('Data flux failure.');
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
                Final Village First Survey Summery Report
            </div>

            <div className="border border-[#e2e8f0] rounded-[0 0 8px 8px]">


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
                    </div>

                    <div className="flex gap-[10px]">
                        <button onClick={handleSearch} disabled={isLoading} className="px-5 py-2 rounded text-[13px] font-medium cursor-pointer border-0 text-white min-w-[90px] bg-[#16a085]">
                            {isLoading ? '...' : 'Load Report'}
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
                                        <th className="p-[10px] border border-[#444]">Idx</th>
                                        <th className="p-[10px] border border-[#444] text-left">Cluster Name</th>
                                        <th className="p-[10px] border border-[#444]">Node ID</th>
                                        <th className="p-[10px] border border-[#444] bg-[#2e7d32]">Area (Hec)</th>
                                        <th className="p-[10px] border border-[#444]">Plots</th>
                                        <th className="p-[10px] border border-[#444]">Entities</th>
                                        <th className="p-[10px] border border-[#444]">Density/Plot</th>
                                        <th className="p-[10px] border border-[#444]">Status</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {reportData.map((row, idx) =>
                <tr key={idx} className="border-b border-b-[#f1f5f9]">
                                            <td className="p-[8px] text-center">{idx + 1}</td>
                                            <td className="p-[8px] font-bold">{row.VillageName || row.villageName}</td>
                                            <td className="p-[8px] text-center">#{row.VillageCode || row.villageCode}</td>
                                            <td className="p-[8px] text-center bg-[#f0fdf4] font-bold">{row.Area || row.area}</td>
                                            <td className="p-[8px] text-center">{row.Plots || row.plots}</td>
                                            <td className="p-[8px] text-center">{row.Growers || row.growers}</td>
                                            <td className="p-[8px] text-center">
                                                {((row.Area || row.area) / (row.Plots || row.plots || 1)).toFixed(4)}
                                            </td>
                                            <td className="p-[8px] text-center">
                                                <span className="bg-[#2ecc71] text-white py-[2px] px-[8px] rounded text-2.5">Functional</span>
                                            </td>
                                        </tr>
                )}
                                </tbody>
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

export default SurveyReport_FinalVillageFirstSurveySummeryReport;