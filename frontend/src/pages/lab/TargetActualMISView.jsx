import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast, Toaster } from 'react-hot-toast';
import apiClient, { masterService } from '../../microservices/api.service';
import '../../styles/base.css';const __cx = (...vals) => vals.filter(Boolean).join(" ");

const Lab_TargetActualMISView = () => {
  const navigate = useNavigate();
  const [plants, setPlants] = useState([]);
  const [vFactory, setVFactory] = useState('All');
  const [vFrom, setVFrom] = useState('');
  const [vTo, setVTo] = useState('');
  const [viewData, setViewData] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    masterService.getUnits().then((d) => setPlants(Array.isArray(d) ? d : [])).catch(() => {});
    const now = new Date();
    const dd = String(now.getDate()).padStart(2, '0');
    const mm = String(now.getMonth() + 1).padStart(2, '0');
    const yyyy = now.getFullYear();
    const formatted = `${yyyy}-${mm}-${dd}`;
    setVFrom(formatted);
    setVTo(formatted);
  }, []);

  const handleSearch = async (e) => {
    if (e) e.preventDefault();
    if (!vFrom || !vTo) {
      toast.error("Please select date range.");
      return;
    }
    try {
      setIsLoading(true);
      const res = await apiClient.get('/lab/target-actual-mis', {
        params: { factoryCode: vFactory === 'All' ? '0' : vFactory, fromDate: vFrom, toDate: vTo }
      });
      const data = Array.isArray(res.data?.data) ? res.data.data : [];
      setViewData(data);
      if (!data.length) toast.error('No records found.');else
      toast.success("Data loaded successfully.");
    } catch {
      toast.error('Error fetching data.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="p-[20px] bg-white min-h-[100vh] font-['Poppins', Arial, sans-serif]">
      <Toaster position="top-right" />

      <div className={__cx("page-card", "rounded-lg")}>
        <div className={__cx("page-card-header", "text-center text-[15px]")}>
          Daily Target VS Actual
        </div>

        <div className={__cx("page-card-body", "bg-[#f5f5e8]")}>
          <div className={__cx("form-grid-4", "mb-[20px]")}>
            <div className="form-group">
              <label>Units</label>
              <select className="form-control" value={vFactory} onChange={(e) => setVFactory(e.target.value)}>
                <option value="All">All</option>
                {plants.map((p, idx) =>
                <option key={`${p.F_Code || p.f_Code || p.id}-${idx}`} value={p.F_Code || p.f_Code || p.id}>
                    {p.F_Name || p.F_NAME || p.name}
                  </option>
                )}
              </select>
            </div>
            <div className="form-group">
              <label>From Date</label>
              <input type="date" className="form-control" value={vFrom} onChange={(e) => setVFrom(e.target.value)} />
            </div>
            <div className="form-group">
              <label>To Date</label>
              <input type="date" className="form-control" value={vTo} onChange={(e) => setVTo(e.target.value)} />
            </div>
          </div>

          <div className={__cx("form-actions", "border-t-0 mt-[0] pt-[0]")}>
            <button className="btn btn-primary" onClick={handleSearch} disabled={isLoading}>
              {isLoading ? 'Searching...' : 'Search'}
            </button>
            <button className="btn btn-primary" onClick={() => navigate('/Lab/TargetActualMISAdd')}>
              Add New
            </button>
            <button className="btn btn-primary" onClick={() => navigate(-1)}>
              Exit
            </button>
          </div>
        </div>
      </div>

      {viewData.length > 0 &&
      <div className={__cx("page-card", "mt-[10px]")}>
          <div className={__cx("table-wrapper", "max-h-[65vh] overflow-y-auto")}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th className="text-right">Pol % (Target)</th>
                  <th className="text-right">Pol % (Actual)</th>
                  <th className="text-right">Recovery % (Target)</th>
                  <th className="text-right">Recovery % (Actual)</th>
                </tr>
              </thead>
              <tbody>
                {viewData.map((row, idx) =>
              <tr key={idx}>
                    <td className="font-bold text-[#008080]">{row.TM_DATE}</td>
                    <td className="text-right">{row.TM_POL_TARGETPERC}%</td>
                    <td className="text-right">{row.TM_POL_ONDATEPERC}%</td>
                    <td className="text-right">{row.TM_RECOV_TARGETPERC}%</td>
                    <td className={__cx("text-right", "font-bold text-[#16a085]")}>{row.TM_RECOV_ONDATEPERC}%</td>
                  </tr>
              )}
              </tbody>
            </table>
          </div>
        </div>
      }
    </div>);

};

export default Lab_TargetActualMISView;