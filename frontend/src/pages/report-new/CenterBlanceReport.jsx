import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast, Toaster } from 'react-hot-toast';
import { reportNewService, masterService } from '../../microservices/api.service';
import '../../styles/base.css';const CenterBlanceReport = () => {const navigate = useNavigate();const [units, setUnits] = useState([]);const [loading, setLoading] = useState(false);const [reportData, setReportData] = useState([]);const [filters, setFilters] = useState({ F_code: 'All',
      c_code: '0'
    });
  const [centers, setCenters] = useState([]);

  useEffect(() => {
    masterService.getUnits().then((d) => {
      const data = Array.isArray(d) ? d : d.data || [];
      setUnits(data);
    }).catch(() => {});
  }, []);

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters((prev) => ({ ...prev, [name]: value }));
  };

  useEffect(() => {
    if (!filters.F_code || filters.F_code === 'All') {
      setCenters([]);
      return;
    }
    reportNewService.getCenterBind({ Fact: filters.F_code })
      .then((d) => {
        const data = Array.isArray(d) ? d : d.data || [];
        setCenters(data);
      })
      .catch(() => {});
  }, [filters.F_code]);

  const handleSearch = async () => {
    setLoading(true);
    try {
      const response = await reportNewService.getCenterBlanceReport(filters);
      if (response.status === 'success') {
        setReportData(response.data || []);
        toast.success("Balance data synchronized.");
      } else {
        toast.error(response.message || "No data available.");
      }
    } catch (error) {
      toast.error("Telemetry sync failure.");
    } finally {
      setLoading(false);
    }
  };

  const headerStyle = "bg-[#008080] text-white py-[10px] px-[20px] text-4 font-medium rounded-[8px 8px 0 0] mb-[1px]";









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

  return (
    <div className="p-[20px] bg-white min-h-[100vh] font-['Segoe UI', Tahoma, Geneva, Verdana, sans-serif]">
            <Toaster position="top-right" />

            <div className={headerStyle}>
                Center Balance Report
            </div>

            <div className={cardStyle}>
                <div className="flex gap-[20px] mb-[25px] items-end">
                    <div className="w-[250px]">
                        <label className={labelStyle}>Units</label>
                        <select
              name="F_code"
              value={filters.F_code}
              onChange={handleFilterChange} className={inputStyle}>

              
                            <option value="All">All</option>
                            {units.map((unit, idx) =>
              <option key={`${unit.F_Code || unit.id}-${idx}`} value={unit.F_Code || unit.id}>{unit.F_Name || unit.name}</option>
              )}
                        </select>
                    </div>
                    <div className="w-[250px] hidden">
                        <label className={labelStyle}>Center</label>
                        <select
              name="c_code"
              value={filters.c_code}
              onChange={handleFilterChange} className={inputStyle}>
                            <option value="0">All</option>
                            {centers.map((center, idx) =>
              <option key={`${center.c_code || center.c_Code}-${idx}`} value={center.c_code || center.c_Code}>{center.c_name || center.c_Name}</option>
              )}
                        </select>
                    </div>
                </div>

                <div className="flex gap-[10px]">
                    <button onClick={handleSearch} disabled={loading} className="px-5 py-2 rounded text-[13px] font-medium cursor-pointer border-0 text-white min-w-[90px] bg-[#16a085]">
                        {loading ? '...' : 'Search'}
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
            </div>

            {reportData.length > 0 &&
      <div className="overflow-x-auto border border-[#e2e8f0] rounded">
                    <table className="w-[100%] text-[11px]">
                        <thead>
                            <tr className="bg-[#f8fafc] font-bold">
                                <th className="p-[12px] border border-[#cbd5e1] text-left">Center</th>
                                <th className="p-[12px] border border-[#cbd5e1] text-left">Clerk</th>
                                <th className="p-[12px] border border-[#cbd5e1] text-left">Posting Date</th>
                                <th className="p-[12px] border border-[#cbd5e1] text-left">Desc</th>
                                <th className="p-[12px] border border-[#cbd5e1] text-right">Purchase</th>
                                <th className="p-[12px] border border-[#cbd5e1] text-right">Manual</th>
                                <th className="p-[12px] border border-[#cbd5e1] text-right">Reciept</th>
                                <th className="p-[12px] border border-[#cbd5e1] text-right">Transit</th>
                                <th className="p-[12px] border border-[#cbd5e1] text-right">Center Running Balance</th>
                                <th className="p-[12px] border border-[#cbd5e1] text-right">Balance</th>
                            </tr>
                        </thead>
                        <tbody>
                            {reportData.map((row, index) =>
            <tr key={index} className="border-b border-b-[#f1f5f9]">
                                    <td className="py-[8px] px-[12px]">{row.Centre ?? row.Center ?? row.centre ?? ''}</td>
                                    <td className="py-[8px] px-[12px]">{row.WClerk ?? row.Clerk ?? row.wclerk ?? ''}</td>
                                    <td className="py-[8px] px-[12px]">{row.PostingDate ?? row.postingdate ?? row.Posting_Date ?? ''}</td>
                                    <td className="py-[8px] px-[12px]">{row.Desc ?? row.desc ?? ''}</td>
                                    <td className="py-[8px] px-[12px] text-right">{row.Purchase ?? row.purchase ?? 0}</td>
                                    <td className="py-[8px] px-[12px] text-right">{row.Manual ?? row.manual ?? 0}</td>
                                    <td className="py-[8px] px-[12px] text-right">{row.Receipt ?? row.Reciept ?? row.receipt ?? 0}</td>
                                    <td className="py-[8px] px-[12px] text-right">{row.Transit ?? row.transit ?? 0}</td>
                                    <td className="py-[8px] px-[12px] text-right">{row.CentreRunningBal ?? row.CenterRunningBal ?? row.centrerunningbal ?? 0}</td>
                                    <td className="py-[8px] px-[12px] text-right">{row.Balance ?? row.balance ?? 0}</td>
                                </tr>
            )}
                        </tbody>
                    </table>
                </div>
      }
        </div>);

};

export default CenterBlanceReport;
