import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast, Toaster } from 'react-hot-toast';
import { reportNewService, masterService } from '../../microservices/api.service';
import '../../styles/base.css';

const CenterBlanceReport = () => {
  const navigate = useNavigate();
  const [units, setUnits] = useState([]);
  const [loading, setLoading] = useState(false);
  const [reportData, setReportData] = useState([]);
  const [filters, setFilters] = useState({
    F_code: ''
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
    if (!filters.F_code) {
      toast.error("Please select a unit.");
      return;
    }
    setLoading(true);
    try {
      const response = await reportNewService.getCenterBlanceReport(filters);
      const ok = response?.success === true || response?.status === 'success';
      const data = Array.isArray(response?.data) ? response.data : Array.isArray(response) ? response : [];
      if (ok) {
        setReportData(data);
        if (data.length === 0) {
          toast.error("No data found for the selected filters.");
        } else {
          toast.success(`Fetched ${data.length} records.`);
        }
      } else {
        toast.error(response?.message || "Failed to fetch data.");
      }
    } catch (error) {
      toast.error("Error connecting to server.");
    } finally {
      setLoading(false);
    }
  };

  const headerStyle = "bg-[#008080] text-white py-[12px] px-[20px] text-[16px] font-semibold rounded-t-lg mb-[1px]";
  const cardStyle = "p-[25px] border border-[#e2e8f0] rounded-b-lg bg-white shadow-sm mb-[20px]";
  const labelStyle = "block text-[13px] font-bold text-[#333] mb-[8px]";
  const inputStyle = "w-full py-[8px] px-[12px] border border-[#cbd5e1] rounded text-[13px] bg-white focus:outline-none focus:ring-1 focus:ring-[#16a085]";
  const btnStyle = "px-5 py-2 rounded text-[13px] font-medium cursor-pointer border-0 text-white min-w-[90px] transition-all hover:opacity-90 active:scale-95 disabled:opacity-50";

  return (
    <div className="p-[20px] bg-[#f1f5f9] min-h-[100vh] font-['Segoe UI', Tahoma, Geneva, Verdana, sans-serif]">
      <Toaster position="top-right" />

      <div className={headerStyle}>
        Center Balance Report
      </div>

      <div className={cardStyle}>
        <div className="flex gap-[20px] mb-[25px] items-end">
          <div className="w-[300px]">
            <label className={labelStyle}>Units</label>
            <select
              name="F_code"
              value={filters.F_code}
              onChange={handleFilterChange}
              className={inputStyle}
            >
              <option value="">Select Unit</option>
              {units.map((unit, idx) => (
                <option key={`${unit.F_Code || unit.id}-${idx}`} value={unit.F_Code || unit.id}>
                  {unit.F_Name || unit.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex flex-wrap gap-[10px]">
          <button 
            onClick={handleSearch} 
            disabled={loading} 
            className={`${btnStyle} bg-[#16a085]`}
          >
            {loading ? 'Searching...' : 'Search'}
          </button>
          <button 
            type="button"
            disabled={reportData.length === 0}
            className={`${btnStyle} bg-[#16a085]`}
          >
            Excel
          </button>
          <button 
            onClick={() => window.print()} 
            disabled={reportData.length === 0}
            className={`${btnStyle} bg-[#16a085]`}
          >
            Print
          </button>
          <button 
            onClick={() => navigate(-1)} 
            className={`${btnStyle} bg-[#16a085]`}
          >
            Exit
          </button>
        </div>
      </div>

      {reportData.length > 0 && (
        <div className="overflow-x-auto border border-[#cbd5e1] rounded-lg bg-white shadow-md">
          <table className="w-full text-[12px] border-collapse">
              <thead>
                <tr className="bg-[#d9ead3] text-gray-800">
                  <th className="p-[10px] border border-[#cbd5e1] text-left">Center</th>
                  <th className="p-[10px] border border-[#cbd5e1] text-left">Clerk</th>
                  <th className="p-[10px] border border-[#cbd5e1] text-left">Posting Date</th>
                  <th className="p-[10px] border border-[#cbd5e1] text-left">Desc</th>
                  <th className="p-[10px] border border-[#cbd5e1] text-right">Purchase</th>
                  <th className="p-[10px] border border-[#cbd5e1] text-right">Manual</th>
                  <th className="p-[10px] border border-[#cbd5e1] text-right">Reciept</th>
                  <th className="p-[10px] border border-[#cbd5e1] text-right">Transit</th>
                  <th className="p-[10px] border border-[#cbd5e1] text-right">Center Running Balance</th>
                  <th className="p-[10px] border border-[#cbd5e1] text-right">Balance</th>
                </tr>
              </thead>
              <tbody>
                {reportData.map((row, index) => (
                  <tr key={index} className="hover:bg-gray-50 transition-colors border-b border-[#e2e8f0]">
                    <td className="p-[8px] border-x border-[#cbd5e1]">{row.Center || '-'}</td>
                    <td className="p-[8px] border-x border-[#cbd5e1]">{row.Clerk || 'N/A'}</td>
                    <td className="p-[8px] border-x border-[#cbd5e1]">{row.PostingDate || '-'}</td>
                    <td className="p-[8px] border-x border-[#cbd5e1]">{row.Desc || '-'}</td>
                    <td className="p-[8px] border-x border-[#cbd5e1] text-right">{Number(row.Purchase || 0).toFixed(2)}</td>
                    <td className="p-[8px] border-x border-[#cbd5e1] text-right">{Number(row.Manual || 0).toFixed(2)}</td>
                    <td className="p-[8px] border-x border-[#cbd5e1] text-right">{Number(row.Receipt || 0).toFixed(2)}</td>
                    <td className="p-[8px] border-x border-[#cbd5e1] text-right">{Number(row.Transit || 0).toFixed(2)}</td>
                    <td className="p-[8px] border-x border-[#cbd5e1] text-right">{Number(row.CenterRunningBal || 0).toFixed(2)}</td>
                    <td className="p-[8px] border-x border-[#cbd5e1] text-right">{Number(row.Balance || 0).toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default CenterBlanceReport;
