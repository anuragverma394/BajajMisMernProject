import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast, Toaster } from 'react-hot-toast';
import { reportNewService, masterService } from '../../microservices/api.service';
import '../../styles/base.css';

const CanePurchaseReport = () => {const navigate = useNavigate();
const [units, setUnits] = useState([]);const [loading, setLoading] = useState(false);
const [reportData, setReportData] = useState([]);const [totals, setTotals] = useState(null);
const [extraRows, setExtraRows] = useState([]);
const [filters, setFilters] = useState({
    F_code: 'All',
    FromDate: new Date().toLocaleDateString('en-GB').replace(/\//g, '-'),
    ToDate: new Date().toLocaleDateString('en-GB').replace(/\//g, '-')
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

  const handleSearch = async () => {
    setLoading(true);
    try {
      const response = await reportNewService.getCanePurchaseReport(filters);
      if (response.status === 'success' || response.data) {
        setReportData(response.data || []);
        setTotals(response.totals);
        setExtraRows(response.extraRows || []);
        toast.success("Procurement data synchronized.");
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
    minWidth: '94px'
  });

  const bottomBarStyle = "bg-[#16a085] text-white py-[10px] px-[20px] flex items-center justify-between rounded mt-[10px]";










  const statusBarInput = {
    backgroundColor: 'white',
    color: '#333',
    border: 'none',
    borderRadius: '4px',
    padding: '4px 8px',
    fontSize: '12px',
    width: '100px',
    textAlign: 'center'
  };

  return (
    <div className="p-[20px] bg-white min-h-[100vh] font-['Segoe UI', Tahoma, Geneva, Verdana, sans-serif]">
            <Toaster position="top-right" />

            <div className={headerStyle}>
                CENTER WISE CANE PURCHASE REPORT
            </div>

            <div className="border border-[#e2e8f0] rounded-[0 0 8px 8px]">
                <div className={subHeaderStyle}>
                    CENTER WISE CANE PURCHASE REPORT
                </div>

                <div className={cardStyle}>
                    <div className="flex gap-[30px] mb-[25px]">
                        <div className="w-[250px]">
                            <label className={labelStyle}>Factory</label>
                            <select
                name="F_code"
                value={filters.F_code}
                onChange={handleChange} className={inputStyle}>

                
                                <option value="All">All</option>
                                {units.map((unit, idx) =>
                <option key={`${unit.F_Code || unit.id}-${idx}`} value={unit.F_Code || unit.id}>{unit.F_Name || unit.name}</option>
                )}
                            </select>
                        </div>

                        <div className="w-[250px]">
                            <label className={labelStyle}>Date Form</label>
                            <input
                type="text"
                name="FromDate"
                value={filters.FromDate}
                onChange={handleChange}
                placeholder="DD-MM-YYYY" className={inputStyle} />

              
                        </div>

                        <div className="w-[250px]">
                            <label className={labelStyle}>Date To</label>
                            <input
                type="text"
                name="ToDate"
                value={filters.ToDate}
                onChange={handleChange}
                placeholder="DD-MM-YYYY" className={inputStyle} />

              
                        </div>
                    </div>

                    <div className="flex gap-[10px] mb-[10px]">
                        <button onClick={handleSearch} disabled={loading} className="px-5 py-2 rounded text-[13px] font-medium cursor-pointer border-0 text-white min-w-[90px] bg-[#16a085]">
                            {loading ? '...' : 'Search'}
                        </button>
                        <button onClick={() => window.location.reload()} className="px-5 py-2 rounded text-[13px] font-medium cursor-pointer border-0 text-white min-w-[90px] bg-[#008080]">
                            Refresh
                        </button>
                        <button onClick={() => toast.info("Exporting Excel...")} className="px-5 py-2 rounded text-[13px] font-medium cursor-pointer border-0 text-white min-w-[90px] bg-[#f39c12]">
                            Export Excel
                        </button>
                        <button onClick={() => navigate(-1)} className="px-5 py-2 rounded text-[13px] font-medium cursor-pointer border-0 text-white min-w-[90px] bg-[#f87171]">
                            Exit
                        </button>
                    </div>

                    <div className={bottomBarStyle}>
                        <div className="flex items-center gap-[10px]">
                            <span className="font-semibold text-[13px]">DATE</span>
                            <div className="bg-white text-[#333] border-0 rounded py-[4px] px-[8px] text-[12px] w-[100px] text-center">{filters.FromDate}</div>
                        </div>
                        <div className="font-bold text-4 text-center">
                            Center Wise Cane Purchase Report
                        </div>
                        <div className="flex items-center gap-[10px]">
                            <span className="font-semibold text-[13px]">Time :</span>
                            <div className="bg-white text-[#333] border-0 rounded py-[4px] px-[8px] text-[12px] w-[100px] text-center">{new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}</div>
                        </div>
                    </div>
                </div>

                <div className="p-[0 20px 20px 20px]">
                    {reportData.length > 0 &&
          <div className="overflow-x-auto border border-[#e2e8f0] rounded">
                            <table className="w-[100%] text-[11px]">
                                <thead>
                                    <tr className="bg-[#f8fafc] font-bold">
                                        <th className="p-[10px] border border-[#cbd5e1]">Sr.No.</th>
                                        <th className="p-[10px] border border-[#cbd5e1]">Center Code</th>
                                        <th className="p-[10px] border border-[#cbd5e1] text-left">Center Name</th>
                                        <th className="p-[10px] border border-[#cbd5e1]">Opening Balance</th>
                                        <th className="p-[10px] border border-[#cbd5e1]">Current Period</th>
                                        <th className="p-[10px] border border-[#cbd5e1]">Grand Total</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {reportData.map((row, index) =>
                <tr key={index} className="border-b border-b-[#f1f5f9]">
                                            <td className="p-[8px] text-center">{index + 1}</td>
                                            <td className="p-[8px] text-center">{row.c_code}</td>
                                            <td className="p-[8px]">{row.c_name}</td>
                                            <td className="p-[8px] text-right">{row.OpeningBalance}</td>
                                            <td className="p-[8px] text-right">{row.Period}</td>
                                            <td className="p-[8px] text-right font-bold">{row.GrandTotal}</td>
                                        </tr>
                )}
                                    {totals &&
                  <tr className="bg-[#fff5f7] font-bold">
                                            <td colSpan="3" className="p-[10px] border border-[#cbd5e1] text-right">TOTAL</td>
                                            <td className="p-[10px] border border-[#cbd5e1] text-right">{totals.OpeningBalance}</td>
                                            <td className="p-[10px] border border-[#cbd5e1] text-right">{totals.Period}</td>
                                            <td className="p-[10px] border border-[#cbd5e1] text-right">{totals.GrandTotal}</td>
                                        </tr>
                  }
                                    {extraRows.map((row, index) =>
                  <tr key={`extra-${index}`} className="border-b border-b-[#f1f5f9]">
                                            <td className="p-[8px] text-center"></td>
                                            <td className="p-[8px] text-center">{row.c_code}</td>
                                            <td className="p-[8px]">{row.c_name}</td>
                                            <td className="p-[8px] text-right">{row.OpeningBalance}</td>
                                            <td className="p-[8px] text-right">{row.Period}</td>
                                            <td className="p-[8px] text-right font-bold">{row.GrandTotal}</td>
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

export default CanePurchaseReport;
