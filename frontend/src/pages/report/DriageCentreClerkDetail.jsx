import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast, Toaster } from 'react-hot-toast';
import { masterService, reportService } from '../../microservices/api.service';
import '../../styles/DriageCentreClerkDetail.css';

const today = () => {
  const d = new Date();
  return `${String(d.getDate()).padStart(2, '0')}-${String(d.getMonth() + 1).padStart(2, '0')}-${d.getFullYear()}`;
};

const normalizeUnit = (u) => ({
  code: String(u?.F_Code || u?.f_Code || u?.id || '').trim(),
  name: String(u?.F_Name || u?.f_Name || u?.name || '').trim()
});

const Report_DriageCentreClerkDetail = () => {
  const navigate = useNavigate();
  const [units, setUnits] = useState([]);
  const [loading, setLoading] = useState(false);
  const [reportData, setReportData] = useState([]);
  const [filters, setFilters] = useState({ unit: '', date: today() });

  useEffect(() => {
    masterService
      .getUnits()
      .then((d) => setUnits(Array.isArray(d) ? d.map(normalizeUnit).filter((u) => u.code) : []))
      .catch(() => {});
  }, []);

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters((prev) => ({ ...prev, [name]: value }));
  };

  const handleSearch = async () => {
    if (!filters.unit) {
      toast.error('Please select a Factory');
      return;
    }
    if (!filters.date) {
      toast.error('Please enter a Date');
      return;
    }

    setLoading(true);
    try {
      const response = await reportService.getGeneralReport({
        reportName: 'driage-centre-clerk-summary',
        F_Code: filters.unit,
        Date: filters.date
      });

      const data = response?.data ?? response?.Data ?? response?.recordsets?.[0] ?? [];
      if (response?.API_STATUS === 'OK' || response?.success) {
        setReportData(Array.isArray(data) ? data : []);
        toast.success('Driage summary loaded');
      } else if (Array.isArray(data) && data.length) {
        setReportData(data);
        toast.success('Driage summary loaded');
      } else {
        setReportData([]);
        toast.error(response?.Message || 'No data available.');
      }
    } catch (error) {
      toast.error('Telemetry sync failure.');
      setReportData([]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="driage-centre-clerk-page">
      <Toaster position="top-right" />

      <div className="driage-centre-clerk-card">
        <div className="driage-centre-clerk-header">DRIAGE CENTRE AND CLERK SUMMARY</div>
        <div className="driage-centre-clerk-subheader">DRIAGE CENTRE AND CLERK SUMMARY</div>

        <div className="driage-centre-clerk-body">
          <div className="driage-centre-clerk-filters">
            <div className="driage-centre-clerk-field">
              <label>Factory</label>
              <select name="unit" value={filters.unit} onChange={handleFilterChange}>
                <option value="">-- Select Factory --</option>
                {units.map((unit, idx) => (
                  <option key={`${unit.code}-${idx}`} value={unit.code}>
                    {unit.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="driage-centre-clerk-field">
              <label>Date</label>
              <input
                type="text"
                name="date"
                value={filters.date}
                onChange={handleFilterChange}
                placeholder="DD-MM-YYYY"
              />
            </div>
          </div>

          <div className="driage-centre-clerk-actions">
            <button onClick={handleSearch} disabled={loading}>
              {loading ? '...' : 'Search'}
            </button>
            <button onClick={() => toast.info('Exporting Excel...')}>Excel</button>
            <button onClick={() => window.print()}>Print</button>
            <button onClick={() => navigate(-1)}>Exit</button>
          </div>
        </div>

        <div className="driage-centre-clerk-table-wrap">
          <table className="driage-centre-clerk-table">
            <thead>
              <tr>
                <th>S.NO</th>
                <th>Clerk Code</th>
                <th>Clerk Name</th>
                <th>Centre Code</th>
                <th>Centre Name</th>
                <th>From</th>
                <th>Till</th>
                <th>Purchase Qty</th>
                <th>Receipt Qty</th>
                <th>Dries Qty</th>
                <th>%Tage</th>
              </tr>
            </thead>
            <tbody>
              {reportData.length === 0 ? (
                <tr>
                  <td colSpan="11" className="driage-centre-clerk-empty">
                    Select a factory and date, then click Search.
                  </td>
                </tr>
              ) : (
                reportData.map((row, idx) => (
                  <tr key={idx}>
                    <td>{row.SLNO}</td>
                    <td>{row.Clerk}</td>
                    <td>{row.ClerkName}</td>
                    <td>{row.c_code}</td>
                    <td>{row.C_Name}</td>
                    <td>{row.MFrom}</td>
                    <td>{row.Till}</td>
                    <td className="right">{row.PQty}</td>
                    <td className="right">{row.RQty}</td>
                    <td className="right">{row.DRQty}</td>
                    <td className="right">{row.PER}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Report_DriageCentreClerkDetail;
