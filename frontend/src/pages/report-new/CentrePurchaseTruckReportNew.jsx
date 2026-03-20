import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { toast, Toaster } from 'react-hot-toast';
import { reportNewService, masterService } from '../../microservices/api.service';
import '../../styles/base.css';const CentrePurchaseTruckReportNew = () => {const navigate = useNavigate();const [units, setUnits] = useState([]);const [loading, setLoading] = useState(false);const [reportData, setReportData] = useState([]);const [totals, setTotals] = useState(null);const [filters, setFilters] = useState({
    F_code: '',
    FromDate: new Date().toLocaleDateString('en-GB'),
    ToDate: new Date().toLocaleDateString('en-GB'),
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
    if (!filters.F_code || String(filters.F_code).toLowerCase() === 'all') {toast.error("Please select a factory.");return;}
    setLoading(true);
    try {
      const response = await reportNewService.getCentrePurchaseTruckReport(filters);
      if (response?.success === true || response?.status === 'success') {
        const payload = response?.data || {};
        const data = Array.isArray(payload?.rows) ? payload.rows : Array.isArray(response?.data) ? response.data : [];
        setReportData(data);
        setTotals(payload?.totals || null);
        toast.success("Truck metrics synchronized.");
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
                CENTER PURCHASE VS RECIEPT REPORT
            </div>

            <div className="border border-[#e2e8f0] rounded-[0 0 8px 8px]">
                <div className={subHeaderStyle}>
                    CENTER PURCHASE VS RECIEPT REPORT
                </div>

                <div className={cardStyle}>
                    <div className="flex gap-[20px] mb-[25px] items-end">
                        <div className="w-[210px]">
                            <label className={labelStyle}>Factory</label>
                            <select
                name="F_code"
                value={filters.F_code}
                onChange={handleFilterChange} className={inputStyle}>

                
                                <option value="">Select</option>
                                {units.map((unit, idx) =>
                <option key={`${unit.F_Code || unit.id}-${idx}`} value={unit.F_Code || unit.id}>{unit.F_Name || unit.name}</option>
                )}
                            </select>
                        </div>

                        <div className="w-[210px]">
                            <label className={labelStyle}>Date Form</label>
                            <input
                type="text"
                name="FromDate"
                value={filters.FromDate}
                onChange={handleFilterChange}
                placeholder="DD/MM/YYYY" className={inputStyle} />

              
                        </div>

                        <div className="w-[210px]">
                            <label className={labelStyle}>Date To</label>
                            <input
                type="text"
                name="ToDate"
                value={filters.ToDate}
                onChange={handleFilterChange}
                placeholder="DD/MM/YYYY" className={inputStyle} />

              
                        </div>

                        <div className="w-[210px]">
                            <label className={labelStyle}>Block From</label>
                            <input
                type="text"
                name="Zone"
                value={filters.Zone}
                onChange={handleFilterChange} className={inputStyle} />

              
                        </div>

                        <div className="w-[210px]">
                            <label className={labelStyle}>Block To</label>
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
                        <button type="button" className="px-5 py-2 rounded text-[13px] font-medium cursor-pointer border-0 text-white min-w-[90px] bg-[#16a085]">
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
          <div className="overflow-x-auto border border-[#cbd5e1] rounded bg-white">
                            <div className="flex items-center justify-between bg-[#129a81] px-4 py-2 text-white text-[14px] font-semibold">
                              <div className="flex items-center gap-3">
                                <span>DATE</span>
                                <input
                                  readOnly
                                  value={filters.ToDate}
                                  className="w-[110px] rounded bg-white px-2 py-1 text-[12px] text-[#333] border border-[#0f7f69]"
                                />
                              </div>
                              <div className="text-[16px]">Center Purchase Reports</div>
                              <div className="flex items-center gap-3">
                                <span>Time :</span>
                                <input
                                  readOnly
                                  value={new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}
                                  className="w-[80px] rounded bg-white px-2 py-1 text-[12px] text-[#333] border border-[#0f7f69]"
                                />
                              </div>
                            </div>
                            <table className="w-[100%] text-[12px] border-collapse">
                                <thead>
                                    <tr className="bg-[#dff0d8] text-[#2b2b2b]">
                                        <th rowSpan="2" className="p-[8px] border border-[#cbd5e1] text-center min-w-[150px]">Block</th>
                                        <th className="p-[8px] border border-[#cbd5e1] text-center">O.BALANC<br/>E</th>
                                        <th colSpan="2" className="p-[8px] border border-[#cbd5e1] text-center">PURCHASE QTY(Period)</th>
                                        <th className="p-[8px] border border-[#cbd5e1] text-center">TOTAL<br/>PURCHAS<br/>E</th>
                                        <th className="p-[8px] border border-[#cbd5e1] text-center">O.BALANC<br/>E</th>
                                        <th colSpan="2" className="p-[8px] border border-[#cbd5e1] text-center">Period</th>
                                        <th colSpan="2" className="p-[8px] border border-[#cbd5e1] text-center">STANDING AT YARD</th>
                                        <th colSpan="2" className="p-[8px] border border-[#cbd5e1] text-center">IN TRANSIT</th>
                                        <th colSpan="2" className="p-[8px] border border-[#cbd5e1] text-center">RECIEPT WEIGHTED(Period)</th>
                                    </tr>
                                    <tr className="bg-[#dff0d8] font-semibold">
                                        <th className="p-[8px] border border-[#cbd5e1] text-center">Purchase</th>
                                        <th className="p-[8px] border border-[#cbd5e1] text-center">CANE(Qtl.)</th>
                                        <th className="p-[8px] border border-[#cbd5e1] text-center">PURCHY(<br/>Nos.)</th>
                                        <th className="p-[8px] border border-[#cbd5e1] text-center"></th>
                                        <th className="p-[8px] border border-[#cbd5e1] text-center">Reciept</th>
                                        <th className="p-[8px] border border-[#cbd5e1] text-center">VEHICLE<br/>DISPACH</th>
                                        <th className="p-[8px] border border-[#cbd5e1] text-center">VEHICLE<br/>RECEIVED</th>
                                        <th className="p-[8px] border border-[#cbd5e1] text-center">VEHICLE(<br/>Nos.)</th>
                                        <th className="p-[8px] border border-[#cbd5e1] text-center">EST. QTY</th>
                                        <th className="p-[8px] border border-[#cbd5e1] text-center">NOS</th>
                                        <th className="p-[8px] border border-[#cbd5e1] text-center">EST. QTY</th>
                                        <th className="p-[8px] border border-[#cbd5e1] text-center">NOS</th>
                                        <th className="p-[8px] border border-[#cbd5e1] text-center">QTY</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {reportData.map((row, index) =>
                <tr key={index} className="border-b border-b-[#f1f5f9]">
                                            <td className="py-[8px] px-[12px] font-bold">
                                                <Link to={`/ReportNew/ZoneCentreWiseTruckdetails?ID=${row.blk_code}&DATE=${filters.FromDate}&DATETO=${filters.ToDate}&ZoneName=${encodeURIComponent(row.blk_name)}&Factory=${filters.F_code}`} className="text-[#2563eb]">
                                                    {row.blk_name}
                                                </Link>
                                            </td>
                                            <td className="py-[8px] px-[12px] text-right">{row.openingbalance}</td>
                                            <td className="py-[8px] px-[12px] text-right">{row.Cane}</td>
                                            <td className="py-[8px] px-[12px] text-right">{row.purchy}</td>
                                            <td className="py-[8px] px-[12px] text-right">{row.TotalCane}</td>
                                            <td className="py-[8px] px-[12px] text-right">{row.openingreceipt}</td>
                                            <td className="py-[8px] px-[12px] text-right">{row.VehicleDispatch}</td>
                                            <td className="py-[8px] px-[12px] text-right">{row.VehicleReceive}</td>
                                            <td className="py-[8px] px-[12px] text-right">{row.Standingyard}</td>
                                            <td className="py-[8px] px-[12px] text-right">{row.standingYardWeight}</td>
                                            <td className="py-[8px] px-[12px] text-right">{row.NosTransit}</td>
                                            <td className="py-[8px] px-[12px] text-right">{row.TransitWeight}</td>
                                            <td className="py-[8px] px-[12px] text-right">{row.WeightedNos}</td>
                                            <td className="py-[8px] px-[12px] text-right">{row.WeightedQty}</td>
                                        </tr>
                )}
                                </tbody>
                                {totals &&
              <tfoot className="bg-[#a9698c] text-white font-bold">
                                        <tr>
                                            <td className="py-[10px] px-[12px] border border-[#cbd5e1] text-center">Total</td>
                                            <td className="py-[10px] px-[12px] border border-[#cbd5e1] text-right">{totals.openingbalance}</td>
                                            <td className="py-[10px] px-[12px] border border-[#cbd5e1] text-right">{totals.Cane}</td>
                                            <td className="py-[10px] px-[12px] border border-[#cbd5e1] text-right">{totals.purchy}</td>
                                            <td className="py-[10px] px-[12px] border border-[#cbd5e1] text-right">{totals.TotalCane}</td>
                                            <td className="py-[10px] px-[12px] border border-[#cbd5e1] text-right">{totals.openingreceipt}</td>
                                            <td className="py-[10px] px-[12px] border border-[#cbd5e1] text-right">{totals.VehicleDispatch}</td>
                                            <td className="py-[10px] px-[12px] border border-[#cbd5e1] text-right">{totals.VehicleReceive}</td>
                                            <td className="py-[10px] px-[12px] border border-[#cbd5e1] text-right">{totals.Standingyard}</td>
                                            <td className="py-[10px] px-[12px] border border-[#cbd5e1] text-right">{totals.standingYardWeight}</td>
                                            <td className="py-[10px] px-[12px] border border-[#cbd5e1] text-right">{totals.NosTransit}</td>
                                            <td className="py-[10px] px-[12px] border border-[#cbd5e1] text-right">{totals.TransitWeight}</td>
                                            <td className="py-[10px] px-[12px] border border-[#cbd5e1] text-right">{totals.WeightedNos}</td>
                                            <td className="py-[10px] px-[12px] border border-[#cbd5e1] text-right">{totals.WeightedQty}</td>
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

export default CentrePurchaseTruckReportNew;
