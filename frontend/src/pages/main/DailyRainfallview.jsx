import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast, Toaster } from 'react-hot-toast';
import { dailyRainfallService, masterService } from '../../microservices/api.service';
import '../../styles/base.css';const __cx = (...vals) => vals.filter(Boolean).join(" ");

const Main_DailyRainfallView = () => {
  const navigate = useNavigate();
  const [units, setUnits] = useState([]);
  const [unitCode, setUnitCode] = useState('All');
  const [searchDate, setSearchDate] = useState('');
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    masterService.getUnits().then((d) => setUnits(Array.isArray(d) ? d : [])).catch(() => setUnits([]));
  }, []);

  const handleSearch = async () => {
    setLoading(true);
    try {
      const res = await dailyRainfallService.getList({
        f_code: unitCode === 'All' ? '0' : unitCode,
        date: searchDate
      });
      const data = Array.isArray(res?.data) ? res.data : [];
      setRows(data);
      if (data.length === 0) {
        toast.error('No Record Available');
      }
    } catch (error) {
      setRows([]);
      toast.error('Error fetching data.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-[20px] bg-white min-h-[100vh] font-['Poppins', Arial, sans-serif]">
      <Toaster position="top-right" />

      <div className={__cx("page-card", "rounded-lg")}>
        <div className={__cx("page-card-header", "text-left text-[15px]")}>
          Rainfall Daily
        </div>

        <div className={__cx("page-card-body", "bg-[#f5f5e8]")}>
          <div className={__cx("form-grid-4", "mb-[10px]")}>
            <div className="form-group">
              <select className="form-control" value={unitCode} onChange={(e) => setUnitCode(e.target.value)}>
                <option value="All">All</option>
                {units.map((u, idx) =>
                <option key={`${u.F_Code || u.f_Code || u.id}-${idx}`} value={u.F_Code || u.f_Code || u.id}>
                    {u.F_Name || u.F_NAME || u.name}
                  </option>
                )}
              </select>
            </div>
            <div className="form-group">
              <input
                type="text"
                className="form-control"
                value={searchDate}
                onChange={(e) => setSearchDate(e.target.value)}
                placeholder="Ex. dd/mm/yyyy" />
              
            </div>
          </div>

          <div className={__cx("form-actions", "border-t-0 mt-[0] pt-[0]")}>
            <button className="btn btn-primary" onClick={handleSearch} disabled={loading}>
              {loading ? 'Searching...' : 'Search'}
            </button>
            <button className="btn btn-primary" onClick={() => navigate('/Main/DailyRainfall')}>
              Add New
            </button>
            <button className="btn btn-primary" onClick={() => navigate(-1)}>
              Exit
            </button>
          </div>

          <div className={__cx("page-card", "mt-[12px] mb-[0px]")}>
            <div className={__cx("table-wrapper", "overflow-x-auto overflow-y-auto max-h-[55vh]")}>
              <table className={__cx("data-table", "min-w-[1500px]")}>
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Unit</th>
                    <th>Day</th>
                    <th>EDate</th>
                    <th>Previous Year Ondate</th>
                    <th>Previous Year Todate</th>
                    <th>Current Year Ondate</th>
                    <th>Current Year Todate</th>
                    <th>Remark</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.length > 0 ?
                  rows.map((item, index) =>
                  <tr key={`${item.RD_ID || 'row'}-${index}`}>
                        <td>
                          <button
                        type="button"
                        onClick={() => navigate(`/Main/DailyRainfall?RD_ID=${item.RD_ID}`)} className="bg-[transparent] border-0 text-[#0b74de] cursor-pointer p-[0px]">

                        
                            {item.RD_ID}
                          </button>
                        </td>
                        <td>{item.F_Name || item.RD_Unit || ''}</td>
                        <td>{item.RD_Day ?? ''}</td>
                        <td>{item.RD_EDate || ''}</td>
                        <td>{item.RD_PreYear_Ondate ?? 0}</td>
                        <td>{item.RD_PreYear_Todate ?? 0}</td>
                        <td>{item.RD_CurYear_Ondate ?? 0}</td>
                        <td>{item.RD_CurYear_Todate ?? 0}</td>
                        <td>{item.RD_Remark || ''}</td>
                      </tr>
                  ) :

                  <tr>
                      <td colSpan={9} className="text-center font-bold">
                        No Record Available
                      </td>
                    </tr>
                  }
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>);

};

export default Main_DailyRainfallView;