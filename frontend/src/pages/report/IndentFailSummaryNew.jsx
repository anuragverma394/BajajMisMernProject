import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast, Toaster } from 'react-hot-toast';
import { reportNewService, masterService } from '../../microservices/api.service';
import '../../styles/base.css';const IndentFailSummaryNew = () => {const navigate = useNavigate();const [units, setUnits] = useState([]);const [loading, setLoading] = useState(false);const [reportData, setReportData] = useState([]);const [filters, setFilters] = useState({ factory: 'All',
      date: new Date().toISOString().split('T')[0]
    });

  useEffect(() => {
    masterService.getUnits().then((d) => {
      const data = Array.isArray(d) ? d : d.data || [];
      setUnits(data);
    }).catch(() => {});
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFilters((prev) => ({ ...prev, [name]: value }));
  };

  const handlePrevDate = () => {
    const d = new Date(filters.date);
    d.setDate(d.getDate() - 1);
    setFilters((prev) => ({ ...prev, date: d.toISOString().split('T')[0] }));
  };

  const handleNextDate = () => {
    const d = new Date(filters.date);
    d.setDate(d.getDate() + 1);
    setFilters((prev) => ({ ...prev, date: d.toISOString().split('T')[0] }));
  };

  const handleSearch = async () => {
    setLoading(true);
    try {
      const response = await reportNewService.getIndentFailSummary(filters);
      if (response.status === 'success') {
        setReportData(response.data || []);
        toast.success("Sync completed.");
      } else {
        toast.error(response.message || "No records found.");
      }
    } catch (error) {
      toast.error("Telemetry sync failure.");
    } finally {
      setLoading(false);
    }
  };

  const headerStyle = "bg-[#008080] text-white py-[10px] px-[20px] text-4 font-medium rounded-[8px 8px 0 0] mb-[1px]";









  const subHeaderStyle = "bg-[#e6f3e6] text-[#2e7d32] py-[8px] px-[20px] text-[13px] font-semibold border-b border-b-[#c8e6c9] mb-[20px]";









  const cardStyle = "p-[25px] border border-[#e2e8f0] rounded-[0 0 8px 8px] bg-white shadow-[0 1px 3px rgba(0,0,0,0.05)] mb-[20px]";








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
    minWidth: '90px'
  });

  const arrowBtnStyle = "py-[8px] px-[12px] bg-[#16a085] text-white border-0 rounded cursor-pointer";








  return (
    <div className="p-[20px] bg-white min-h-[100vh] font-['Segoe UI', Tahoma, Geneva, Verdana, sans-serif]">
            <Toaster position="top-right" />

            <div className={headerStyle}>
                INDENT FAILURE AVAILABILITY
            </div>

            <div className="border border-[#e2e8f0] rounded-[0 0 8px 8px]">
                <div className={subHeaderStyle}>
                    INDENT FAILURE AVAILABILITY
                </div>

                <div className={cardStyle}>
                    <div className="flex gap-[20px] mb-[25px] items-end">
                        <div className="w-[250px]">
                            <label className={labelStyle}>Factory</label>
                            <select
                name="factory"
                value={filters.factory}
                onChange={handleChange} className={inputStyle}>

                
                                <option value="All">All</option>
                                {units.map((unit, idx) =>
                <option key={`${unit.F_Code || unit.id}-${idx}`} value={unit.F_Code || unit.id}>{unit.F_Name || unit.name}</option>
                )}
                            </select>
                        </div>

                        <div className="w-[250px]">
                            <label className={labelStyle}>Date</label>
                            <div className="flex gap-[8px]">
                                <button type="button" onClick={handlePrevDate} className={arrowBtnStyle}>
                                    &lt;
                                </button>
                                <input
                  type="date"
                  name="date"
                  value={filters.date}
                  onChange={handleChange} className={inputStyle} />

                
                                <button type="button" onClick={handleNextDate} className={arrowBtnStyle}>
                                    &gt;
                                </button>
                            </div>
                        </div>
                    </div>

                    <div className="flex gap-[10px]">
                        <button onClick={handleSearch} disabled={loading} className="px-5 py-2 rounded text-[13px] font-medium cursor-pointer border-0 text-white min-w-[90px] bg-[#16a085]">
                            {loading ? '...' : 'Search'}
                        </button>
                        <button onClick={() => window.print()} className="px-5 py-2 rounded text-[13px] font-medium cursor-pointer border-0 text-white min-w-[90px] bg-[#16a085]">
                            Print
                        </button>
                        <button onClick={() => toast.info("Exporting Excel...")} className="px-5 py-2 rounded text-[13px] font-medium cursor-pointer border-0 text-white min-w-[90px] bg-[#16a085]">
                            Excel
                        </button>
                        <button onClick={() => navigate(-1)} className="px-5 py-2 rounded text-[13px] font-medium cursor-pointer border-0 text-white min-w-[90px] bg-[#16a085]">
                            Exit
                        </button>
                    </div>
                </div>

                <div className="p-[0 20px 20px 20px]">
                    {reportData.length > 0 &&
          <div className="overflow-x-auto border border-[#e2e8f0] rounded">
                            <table className="w-[100%] text-[11px]">
                                <thead>
                                    <tr className="bg-[#f8fafc] font-bold">
                                        <th className="p-[10px] border border-[#cbd5e1]">Date</th>
                                        <th className="p-[10px] border border-[#cbd5e1]">Indent Qty (Qtls)</th>
                                        <th className="p-[10px] border border-[#cbd5e1]">Indent Weighted Qty (Qtls)</th>
                                        <th className="p-[10px] border border-[#cbd5e1]">Actual Weighted Qty (Qtls)</th>
                                        <th className="p-[10px] border border-[#cbd5e1]">Failure % (Purchy)</th>
                                        <th className="p-[10px] border border-[#cbd5e1]">Failure % (Actual)</th>
                                        <th className="p-[10px] border border-[#cbd5e1]">Running Balance</th>
                                        <th className="p-[10px] border border-[#cbd5e1]">Morning Bal (6AM Prev)</th>
                                        <th className="p-[10px] border border-[#cbd5e1]">Turn Up Ondated</th>
                                        <th className="p-[10px] border border-[#cbd5e1]">Turn Up %</th>
                                        <th className="p-[10px] border border-[#cbd5e1]">Morning Bal (6AM Curr)</th>
                                        <th className="p-[10px] border border-[#cbd5e1]">Expected Weight Today</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {reportData.map((row, index) =>
                <tr key={index} className="border-b border-b-[#f1f5f9]">
                                            <td className="p-[8px]">{row.date}</td>
                                            <td className="p-[8px] text-right">{row.indent_qty}</td>
                                            <td className="p-[8px] text-right">{row.indent_weighted_qty}</td>
                                            <td className="p-[8px] text-right">{row.actual_weighted_qty}</td>
                                            <td className="p-[8px] text-right">{row.failure_purchy}</td>
                                            <td className="p-[8px] text-right">{row.failure_actual}</td>
                                            <td className="p-[8px] text-right">{row.running_bal}</td>
                                            <td className="p-[8px] text-right">{row.morning_bal_prev}</td>
                                            <td className="p-[8px] text-right">{row.turnup_ondated}</td>
                                            <td className="p-[8px] text-right">{row.turnup_pct}</td>
                                            <td className="p-[8px] text-right">{row.morning_bal_curr}</td>
                                            <td className="p-[8px] text-right">{row.expected_weight}</td>
                                        </tr>
                )}
                                </tbody>
                            </table>
                        </div>
          }
                </div>
            </div>
        </div>);

};

export default IndentFailSummaryNew;