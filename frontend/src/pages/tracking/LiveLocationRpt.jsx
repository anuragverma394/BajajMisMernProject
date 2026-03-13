import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast, Toaster } from 'react-hot-toast';
import { masterService, trackingService } from '../../microservices/api.service';
import '../../styles/base.css';const __cx = (...vals) => vals.filter(Boolean).join(" ");

const Tracking_LiveLocationRpt = () => {
  const navigate = useNavigate();
  const [units, setUnits] = useState([]);
  const [unit, setUnit] = useState('');
  const [empCode, setEmpCode] = useState('');
  const [empName, setEmpName] = useState('');
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    masterService.getUnits().then((d) => setUnits(Array.isArray(d) ? d : [])).catch(() => setUnits([]));
  }, []);

  const handleSearch = async () => {
    setLoading(true);
    try {
      const res = await trackingService.getLiveLocation({
        F_code: unit || '0',
        Emp_code: empCode.trim(),
        Emp_name: empName.trim()
      });
      const list = Array.isArray(res?.data) ? res.data : Array.isArray(res) ? res : [];
      setRows(list);
      if (!list.length) toast.error('No Record Available');
    } catch (error) {
      setRows([]);
      toast.error('Failed to fetch live location data.');
    } finally {
      setLoading(false);
    }
  };

  const openGoogleMap = (row) => {
    const fact = unit || '0';
    const empCodeValue = String(row?.USERCODE || '').trim();
    const url = `/Tracking/ViewMapLive?fact=${encodeURIComponent(fact)}&userid=Admin${empCodeValue ? `&EmpCode=${encodeURIComponent(empCodeValue)}` : ''}`;
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const openGoogleMapView = () => {
    const fact = unit || '0';
    const url = `/Tracking/ViewMapLive?fact=${encodeURIComponent(fact)}&userid=Admin`;
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const handlePrint = () => window.print();

  return (
    <div className="p-[20px] bg-white min-h-[100vh] font-['Poppins', Arial, sans-serif]">
      <Toaster position="top-right" />

      <div className={__cx("page-card", "rounded-lg")}>
        <div className={__cx("page-card-header", "text-left text-[15px]")}>
          Live Location
        </div>

        <div className={__cx("page-card-body", "bg-[#f5f5e8]")}>
          <div className={__cx("form-grid-3", "mb-[10px]")}>
            <div className="form-group">
              <label>Units</label>
              <select className="form-control" value={unit} onChange={(e) => setUnit(e.target.value)}>
                <option value="">All</option>
                {units.map((u, idx) =>
                <option key={`${u.F_Code || u.f_Code || u.id}-${idx}`} value={u.F_Code || u.f_Code || u.id}>
                    {u.F_Name || u.F_NAME || u.name}
                  </option>
                )}
              </select>
            </div>
            <div className="form-group">
              <label>Employee Code</label>
              <input className="form-control" value={empCode} onChange={(e) => setEmpCode(e.target.value)} />
            </div>
            <div className="form-group">
              <label>Employee Name</label>
              <input className="form-control" value={empName} onChange={(e) => setEmpName(e.target.value)} />
            </div>
          </div>

          <div className={__cx("form-actions", "border-t-0 mt-[0] pt-[0] items-center")}>
            <button className="btn btn-primary" onClick={handleSearch} disabled={loading}>{loading ? 'Searching...' : 'Search'}</button>
            <button className="btn btn-primary" onClick={() => navigate(-1)}>Exit</button>
            <button className="btn btn-primary" onClick={openGoogleMapView}>Google Map View</button>
            <button className="btn btn-primary" onClick={handlePrint}>Print</button>
            <button className="btn btn-primary" onClick={handleSearch}>Refresh</button>
            <span className="text-[#ff3355] font-medium">Under Development</span>
          </div>

          <div className={__cx("page-card", "mt-[12px] mb-[0px]")}>
            <div className={__cx("table-wrapper", "max-h-[55vh] overflow-y-auto overflow-x-auto")}>
              <table className={__cx("data-table", "min-w-[1650px]")}>
                <thead>
                  <tr>
                    <th>Sr.NO</th>
                    <th>Emp Code</th>
                    <th>EmpName</th>
                    <th>Mobile</th>
                    <th>LastLocation Received</th>
                    <th>DeviceStatus/LastConnected</th>
                    <th>ShowOnMap</th>
                    <th>Tracking</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.length > 0 ?
                  rows.map((r, i) =>
                  <tr key={`${r.USERCODE || 'row'}-${i}`}>
                        <td>{r.srnno || i + 1}</td>
                        <td>{r.USERCODE || ''}</td>
                        <td>{r.Name || ''}</td>
                        <td>{r.Mobile || ''}</td>
                        <td>{r.lastLocationReceived || r.cordinatedate || 'No Data Found'}</td>
                        <td dangerouslySetInnerHTML={{ __html: r.address || r.deviceStatus || 'No Data Found' }} className="text-[#ff1f1f]" />
                        <td className="text-center">
                          <button className={__cx("btn btn-primary", "py-[4px] px-[8px]")} onClick={() => openGoogleMap(r)}>Map</button>
                        </td>
                        <td className="text-center">
                          <button className={__cx("btn btn-primary", "py-[4px] px-[8px]")} onClick={() => openGoogleMap(r)}>Track</button>
                        </td>
                      </tr>
                  ) :

                  <tr>
                      <td colSpan={8} className="text-center font-bold">
                        {loading ? 'Loading...' : 'No Record Available'}
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

export default Tracking_LiveLocationRpt;