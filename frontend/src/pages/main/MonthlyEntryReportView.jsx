import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast, Toaster } from 'react-hot-toast';
import { masterService, monthlyEntryReportService } from '../../microservices/api.service';
import '../../styles/base.css';const __cx = (...vals) => vals.filter(Boolean).join(" ");

const Main_MonthlyEntryReportView = () => {
  const navigate = useNavigate();
  const [units, setUnits] = useState([]);
  const [unitCode, setUnitCode] = useState('All');
  const [reportDate, setReportDate] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [reportData, setReportData] = useState([]);

  useEffect(() => {
    masterService.getUnits().then((d) => setUnits(Array.isArray(d) ? d : [])).catch(() => {});
    const now = new Date();
    const dd = String(now.getDate()).padStart(2, '0');
    const mm = String(now.getMonth() + 1).padStart(2, '0');
    const yyyy = now.getFullYear();
    setReportDate(`${dd}/${mm}/${yyyy}`);
  }, []);

  const handleSearch = async () => {
    setIsLoading(true);
    try {
      const res = await monthlyEntryReportService.getList({
        factoryCode: unitCode === 'All' ? '' : unitCode,
        date: reportDate
      });
      const data = Array.isArray(res?.data) ? res.data : Array.isArray(res) ? res : [];
      setReportData(data);
      if (data.length === 0) toast.error("No metrics identified for specified parameters.");else
      toast.success("Cumulative metrics identified.");
    } catch (error) {
      toast.error("Failed to retrieve performance metrics.");
      setReportData([]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="p-[20px] bg-white min-h-[100vh] font-['Poppins', Arial, sans-serif]">
            <Toaster position="top-right" />

            <div className={__cx("page-card", "rounded-lg")}>
                <div className={__cx("page-card-header", "text-left text-[15px]")}>
                    Monthly Entry Report
                </div>

                <div className={__cx("page-card-body", "bg-[#f5f5e8]")}>
                    <div className={__cx("form-grid-4", "mb-[20px]")}>
                        <div className="form-group">
                            <label>Units</label>
                            <select className="form-control" value={unitCode} onChange={(e) => setUnitCode(e.target.value)}>
                                <option value="All">All</option>
                                {units.map((u, idx) =>
                <option key={`${u.F_Code || u.f_Code || u.id}-${idx}`} value={u.F_Code || u.f_Code || u.id}>
                                        {u.F_Name || u.name}
                                    </option>
                )}
                            </select>
                        </div>
                        <div className="form-group">
                            <label>Date</label>
                            <input type="text" className="form-control" value={reportDate} onChange={(e) => setReportDate(e.target.value)} placeholder="Ex. dd/mm/yyyy" />
                        </div>
                    </div>

                    <div className={__cx("form-actions", "border-t-0 mt-[0] pt-[0] justify-start")}>
                        <button className="btn btn-primary" onClick={handleSearch} disabled={isLoading}>
                            {isLoading ? 'Searching...' : 'Search'}
                        </button>
                        <button className="btn btn-primary" onClick={() => navigate('/Main/MonthlyEntryReport')}>
                            Add New
                        </button>
                        <button className="btn btn-primary" onClick={() => navigate(-1)}>
                            Exit
                        </button>
                    </div>
                </div>
            </div>

            <div className={__cx("page-card", "mt-[10px]")}>
                <div className={__cx("table-wrapper", "max-h-[65vh] overflow-y-auto")}>
                    <table className="data-table">
                        <thead>
                            <tr>
                                <th className="w-[80px]">ID</th>
                                <th>Parameter</th>
                                <th className="text-right">Current</th>
                                <th className="text-right">Previous</th>
                            </tr>
                        </thead>
                        <tbody>
                            {reportData.length > 0 ?
              reportData.map((item, idx) =>
              <tr key={item.rowId || item.id || idx}>
                                        <td className="text-center">{item.Id ?? item.id ?? idx + 1}</td>
                                        <td className="font-bold">{item.Pm_Name || item.name || item.parameter || ''}</td>
                                        <td className={__cx("text-right", "text-[#16a085] font-bold")}>{item.current ?? item.RD_CurYear_Todate ?? 0}</td>
                                        <td className="text-right">{item.previous ?? item.RD_PreYear_Todate ?? 0}</td>
                                    </tr>
              ) :

              <tr>
                                    <td colSpan={4} className="text-center font-bold">
                                        No Record Available
                                    </td>
                                </tr>
              }
                        </tbody>
                    </table>
                </div>
            </div>
        </div>);

};

export default Main_MonthlyEntryReportView;