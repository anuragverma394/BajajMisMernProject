import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { toast, Toaster } from 'react-hot-toast';
import { reportNewService, masterService } from '../../microservices/api.service';
import '../../styles/base.css';const IndentPurchaseReportNew = () => {const navigate = useNavigate();const [units, setUnits] = useState([]);const [loading, setLoading] = useState(false);const [reportData, setReportData] = useState([]);const [totals, setTotals] = useState(null);const [filters, setFilters] = useState({
    F_code: 'All',
    Fdate: new Date().toLocaleDateString('en-GB'), // DD/MM/YYYY
    Zone: '0',
    ZoneTo: '9999'
  });

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

  const handleSearch = async () => {
    setLoading(true);
    try {
      const response = await reportNewService.getIndentPurchaseReport(filters);
      if (response?.success === true || response?.status === 'success') {
        setReportData(response.data || []);
        setTotals(response.totals);
        toast.success("Indent data synchronized.");
      } else {
        toast.error(response?.message || "No data available.");
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

  return (
    <div className="p-[20px] bg-white min-h-[100vh] font-['Segoe UI', Tahoma, Geneva, Verdana, sans-serif]">
            <Toaster position="top-right" />

            <div className={headerStyle}>
                INDENT PURCHASE REPORT
            </div>

            <div className="border border-[#e2e8f0] rounded-[0 0 8px 8px]">
                <div className={subHeaderStyle}>
                    INDENT PURCHASE REPORT
                </div>

                <div className={cardStyle}>
                    <div className="flex gap-[20px] mb-[25px] items-end">
                        <div className="w-[220px]">
                            <label className={labelStyle}>Factory</label>
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

                        <div className="w-[220px]">
                            <label className={labelStyle}>Date</label>
                            <input
                type="text"
                name="Fdate"
                value={filters.Fdate}
                onChange={handleFilterChange}
                placeholder="DD/MM/YYYY" className={inputStyle} />

              
                        </div>

                        <div className="w-[220px]">
                            <label className={labelStyle}>Zone</label>
                            <input
                type="text"
                name="Zone"
                value={filters.Zone}
                onChange={handleFilterChange} className={inputStyle} />

              
                        </div>

                        <div className="w-[220px]">
                            <label className={labelStyle}>Zone To</label>
                            <input
                type="text"
                name="ZoneTo"
                value={filters.ZoneTo}
                onChange={handleFilterChange} className={inputStyle} />

              
                        </div>
                    </div>

                    <div className="flex gap-[10px]">
                        <button onClick={handleSearch} disabled={loading} className="px-5 py-2 rounded text-[13px] font-medium cursor-pointer border-0 text-white min-w-[90px] bg-[#16a085]">
                            {loading ? '...' : 'Search'}
                        </button>
                        <button onClick={() => toast.info("Exporting Excel...")} className="px-5 py-2 rounded text-[13px] font-medium cursor-pointer border-0 text-white min-w-[90px] bg-[#16a085]">
                            Excel Export
                        </button>
                        <button onClick={() => window.print()} className="px-5 py-2 rounded text-[13px] font-medium cursor-pointer border-0 text-white min-w-[90px] bg-[#16a085]">
                            Print(Pdf)
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
                                    <tr className="bg-[#129a81] text-black">
                                        <th colSpan="2" className="p-[8px] border border-black text-left">Date : {filters.Fdate}</th>
                                        <th colSpan="6" className="p-[8px] border border-black text-center">TODAY</th>
                                        <th colSpan="5" className="p-[8px] border border-black text-center">TOMORROW</th>
                                    </tr>
                                    <tr className="bg-[#129a81] text-black font-bold">
                                        <th className="p-[8px] border border-black">Srno</th>
                                        <th className="p-[8px] border border-black">ZONE</th>
                                        <th className="p-[8px] border border-black">2</th>
                                        <th className="p-[8px] border border-black">1</th>
                                        <th className="p-[8px] border border-black">0</th>
                                        <th className="p-[8px] border border-black">Total</th>
                                        <th className="p-[8px] border border-black">PUR.</th>
                                        <th className="p-[8px] border border-black">Mat %</th>
                                        <th className="p-[8px] border border-black">2</th>
                                        <th className="p-[8px] border border-black">1</th>
                                        <th className="p-[8px] border border-black">0</th>
                                        <th className="p-[8px] border border-black">Total</th>
                                        <th className="p-[8px] border border-black">EXP PUR</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {reportData.map((row, index) =>
                <tr key={index} className="border-b border-b-[#f1f5f9] bg-[#DBE5F1]">
                                            <td className="py-[8px] px-[12px] text-right border border-black">{index + 1}</td>
                                            <td className="py-[8px] px-[12px] font-bold border border-black">
                                                <Link to={`/ReportNew/CenterIndentPurchaseReport?id=${row.blk_code}&DATE=${filters.Fdate}`} className="text-[#2563eb]">
                                                    {row.blk_name}
                                                </Link>
                                            </td>
                                            <td className="py-[8px] px-[12px] text-right border border-black">{row.onedaysbalnace}</td>
                                            <td className="py-[8px] px-[12px] text-right border border-black">{row.twodaysdaysbalnace}</td>
                                            <td className="py-[8px] px-[12px] text-right border border-black">{row.TodayIndent}</td>
                                            <td className="py-[8px] px-[12px] text-right border border-black">{row.totalindenttoday}</td>
                                            <td className="py-[8px] px-[12px] text-right border border-black">{row.purchase}</td>
                                            <td className="py-[8px] px-[12px] text-right border border-black">{row.mature}</td>
                                            <td className="py-[8px] px-[12px] text-right border border-black">{row.backonedaysbalnace}</td>
                                            <td className="py-[8px] px-[12px] text-right border border-black">{row.backtwodaysdaysbalnace}</td>
                                            <td className="py-[8px] px-[12px] text-right border border-black">{row.backTodayIndent}</td>
                                            <td className="py-[8px] px-[12px] text-right border border-black">{row.backbalanceindent}</td>
                                            <td className="py-[8px] px-[12px] text-right border border-black">{row.expur}</td>
                                        </tr>
                )}
                                </tbody>
                                {totals &&
              <tfoot className="bg-[#fff5f7] font-bold">
                                        <tr>
                                            <td colSpan="2" className="py-[10px] px-[12px] border border-[#cbd5e1] text-center">ZONE TOTAL</td>
                                            <td className="py-[10px] px-[12px] border border-[#cbd5e1] text-right">{totals.onedaysbalnace}</td>
                                            <td className="py-[10px] px-[12px] border border-[#cbd5e1] text-right">{totals.twodaysdaysbalnace}</td>
                                            <td className="py-[10px] px-[12px] border border-[#cbd5e1] text-right">{totals.TodayIndent}</td>
                                            <td className="py-[10px] px-[12px] border border-[#cbd5e1] text-right">{totals.totalindenttoday}</td>
                                            <td className="py-[10px] px-[12px] border border-[#cbd5e1] text-right">{totals.purchase}</td>
                                            <td className="py-[10px] px-[12px] border border-[#cbd5e1] text-right">{totals.mature}</td>
                                            <td className="py-[10px] px-[12px] border border-[#cbd5e1] text-right">{totals.backonedaysbalnace}</td>
                                            <td className="py-[10px] px-[12px] border border-[#cbd5e1] text-right">{totals.backtwodaysdaysbalnace}</td>
                                            <td className="py-[10px] px-[12px] border border-[#cbd5e1] text-right">{totals.backTodayIndent}</td>
                                            <td className="py-[10px] px-[12px] border border-[#cbd5e1] text-right">{totals.backbalanceindent}</td>
                                            <td className="py-[10px] px-[12px] border border-[#cbd5e1] text-right">{totals.expur}</td>
                                        </tr>
                                    </tfoot>
              }
                            </table>
                        </div>
          }
                </div>
            </div>
        </div>);

};

export default IndentPurchaseReportNew;
