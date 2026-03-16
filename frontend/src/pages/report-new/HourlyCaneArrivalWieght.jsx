import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast, Toaster } from 'react-hot-toast';
import { reportNewService, masterService } from '../../microservices/api.service';
import '../../styles/base.css';const HourlyCaneArrivalWieght = () => {const navigate = useNavigate();const [loading, setLoading] = useState(false);const [units, setUnits] = useState([]);const [filters, setFilters] = useState({ F_code: 'All', Fdate: new Date().toLocaleDateString('en-GB') // DD/MM/YYYY
    });
  const [reportData, setReportData] = useState([]);

  useEffect(() => {
    masterService.getUnits().then((d) => setUnits(Array.isArray(d) ? d : [])).catch(() => {});
  }, []);

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters((prev) => ({ ...prev, [name]: value }));
  };

  const handleSearch = async () => {
    setLoading(true);
    try {
      const response = await reportNewService.getHourlyCaneArrivalWeight(filters);
      if (response?.success === true || response?.status === 'success') {
        setReportData(response.data || []);
        toast.success("Analysis synchronized.");
      } else {
        toast.error(response?.message || "No data available.");
      }
    } catch (error) {
      toast.error("Inbound flux detection failure.");
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
                Hourly Cane Arrival Weight
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

                    <div className="w-[250px]">
                        <label className={labelStyle}>Date</label>
                        <input
              type="text"
              name="Fdate"
              value={filters.Fdate}
              onChange={handleFilterChange}
              placeholder="DD/MM/YYYY" className={inputStyle} />

            
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
                            <tr className="bg-[#f8fafc]">
                                <th className="p-[12px] border border-[#cbd5e1] text-left">Hour</th>
                                <th className="p-[12px] border border-[#cbd5e1] text-right">Weight (Q)</th>
                                <th className="p-[12px] border border-[#cbd5e1] text-right">Cumulative (Q)</th>
                            </tr>
                        </thead>
                        <tbody>
                            {reportData.map((row, idx) =>
            <tr key={idx} className="border-b border-b-[#f1f5f9]">
                                    <td className="py-[10px] px-[12px]">{row.DIS_HOU}</td>
                                    <td className="py-[10px] px-[12px] text-right">{row.RDBeforeTruck?.toFixed(2)}</td>
                                    <td className="py-[10px] px-[12px] text-right">{row.OneDBeforeTruck?.toFixed(2)}</td>
                                </tr>
            )}
                        </tbody>
                    </table>
                </div>
      }
        </div>);

};

export default HourlyCaneArrivalWieght;
