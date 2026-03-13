import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast, Toaster } from 'react-hot-toast';
import { masterService, whatsappService } from '../../microservices/api.service';
import '../../styles/base.css';const __cx = (...vals) => vals.filter(Boolean).join(" ");

const DistilleryWhatsAppReport = () => {
  const navigate = useNavigate();
  const [units, setUnits] = useState([]);
  const [selectedUnit, setSelectedUnit] = useState('');
  const [fromDate, setFromDate] = useState('');
  const [reportData, setReportData] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    masterService.getUnits().then((d) => setUnits(Array.isArray(d) ? d : [])).catch(() => {});
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const dd = String(yesterday.getDate()).padStart(2, '0');
    const mm = String(yesterday.getMonth() + 1).padStart(2, '0');
    const yyyy = yesterday.getFullYear();
    setFromDate(`${dd}-${mm}-${yyyy}`);
  }, []);

  const handleSearch = async () => {
    setIsLoading(true);
    try {
      const response = await whatsappService.getDistilleryReport({
        Date: fromDate,
        F_code: selectedUnit
      });
      setReportData(response);
      if (response) toast.success('Report loaded successfully.');else
      toast.error('No records found.');
    } catch (error) {
      toast.error('Error fetching report data.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="p-[20px] bg-white min-h-[100vh] font-['Poppins', Arial, sans-serif]">
            <Toaster position="top-right" />

            <div className={__cx("page-card", "rounded-lg")}>
                <div className={__cx("page-card-header", "text-center text-[15px]")}>
                    Distillery Entry
                </div>

                <div className={__cx("page-card-body", "bg-[#f5f5e8]")}>
                    <div className={__cx("form-grid-4", "mb-[20px]")}>
                        <div className="form-group">
                            <label>Units</label>
                            <select className="form-control" value={selectedUnit} onChange={(e) => setSelectedUnit(e.target.value)}>
                                <option value="">All</option>
                                {units.map((u, idx) =>
                <option key={`${u.f_Code || u.F_CODE || u.id}-${idx}`} value={u.f_Code || u.F_CODE || u.id}>
                                        {u.F_Name || u.F_NAME || u.name}
                                    </option>
                )}
                            </select>
                        </div>
                        <div className="form-group">
                            <label>From Date</label>
                            <input type="text" className="form-control" value={fromDate} onChange={(e) => setFromDate(e.target.value)} placeholder="DD-MM-YYYY" />
                        </div>
                    </div>

                    <div className={__cx("form-actions", "border-t-0 mt-[0] pt-[0]")}>
                        <button className="btn btn-primary" onClick={handleSearch} disabled={isLoading}>
                            {isLoading ? 'Searching...' : 'Search'}
                        </button>
                        <button className="btn btn-primary" onClick={() => toast.success('Exporting data...')}>
                            Export
                        </button>
                        <button className="btn btn-primary" onClick={() => window.print()}>
                            Print
                        </button>
                        <button className="btn btn-primary" onClick={() => navigate(-1)}>
                            Exit
                        </button>
                    </div>
                </div>
            </div>
        </div>);

};

export default DistilleryWhatsAppReport;