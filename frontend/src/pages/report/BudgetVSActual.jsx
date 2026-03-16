import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast, Toaster } from 'react-hot-toast';
import { masterService, reportService } from '../../microservices/api.service';
import '../../styles/BudgetVSActual.css';

const today = () => {
  const d = new Date();
  return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;
};

const normalizeUnit = (u) => ({
  code: String(u?.F_Code || u?.f_Code || u?.id || '').trim(),
  name: String(u?.F_Name || u?.f_Name || u?.name || '').trim()
});

const Report_BudgetVSActual = () => {
  const navigate = useNavigate();
  const [units, setUnits] = useState([]);
  const [loading, setLoading] = useState(false);
  const [reportData, setReportData] = useState([]);
  const [filters, setFilters] = useState({ unit: '0', date: today() });

  useEffect(() => {
    const loadUnits = async () => {
      try {
        const distUnits = await masterService.getDistilleryUnits();
        const list = Array.isArray(distUnits) ? distUnits.map(normalizeUnit) : [];
        setUnits(list);
      } catch {
        masterService.getUnits()
          .then((d) => setUnits(Array.isArray(d) ? d.map(normalizeUnit) : []))
          .catch(() => {});
      }
    };
    loadUnits();
  }, []);

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters((prev) => ({ ...prev, [name]: value }));
  };

  const handleSearch = async () => {
    setLoading(true);
    try {
      const response = await reportService.getGeneralReport({
        reportName: 'budget-vs-actual',
        F_code: filters.unit || '0',
        date: filters.date
      });
      const data = response?.data ?? response?.Data ?? response?.recordsets?.[0] ?? [];
      if (response?.success || (Array.isArray(data) && data.length)) {
        setReportData(Array.isArray(data) ? data : []);
        toast.success('Budget comparison synced.');
      } else {
        toast.error(response?.Message || 'No data available.');
        setReportData([]);
      }
    } catch (error) {
      toast.error('Telemetry sync failure.');
      setReportData([]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="budget-vs-page">
      <Toaster position="top-right" />

      <div className="budget-vs-card">
        <div className="budget-vs-header">Budget Vs Actual</div>
        <div className="budget-vs-subheader">Budget Vs Actual</div>

        <div className="budget-vs-body">
          <div className="budget-vs-filters">
            <div className="budget-vs-field">
              <label>Factory</label>
              <select name="unit" value={filters.unit} onChange={handleFilterChange}>
                <option value="0">-All-</option>
                {units.map((unit, idx) => (
                  <option key={`${unit.code}-${idx}`} value={unit.code}>
                    {unit.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="budget-vs-field">
              <label>Date</label>
              <input
                type="text"
                name="date"
                value={filters.date}
                onChange={handleFilterChange}
                placeholder="DD/MM/YYYY"
              />
            </div>
          </div>

          <div className="budget-vs-actions">
            <button onClick={handleSearch} disabled={loading}>
              {loading ? '...' : 'Search'}
            </button>
            <button onClick={() => toast.info('Exporting Excel...')}>Excel</button>
            <button onClick={() => window.print()}>Print</button>
            <button onClick={() => navigate(-1)}>Exit</button>
          </div>

          <div className="budget-vs-table-wrap">
            <table className="budget-vs-table">
              <thead>
                <tr>
                  <th>FACTORY</th>
                  <th>Budget Weekly (Lakh Ltr)</th>
                  <th>Actual Weekly (Lakh Ltr)</th>
                  <th>Budget Monthly (Lakh Ltr)</th>
                  <th>Actual Monthly (Lakh Ltr)</th>
                  <th>Budget Cumulative ToDate (Lakh Ltr)</th>
                  <th>Actual Cumulative ToDate (Lakh Ltr)</th>
                  <th>Previous Year Actual Cumulative ToDate (Lakh Ltr)</th>
                  <th>Remark</th>
                </tr>
              </thead>
              <tbody>
                {reportData.length === 0 ? (
                  <tr>
                    <td colSpan="9" className="budget-vs-empty">
                      Select a factory and date, then click Search.
                    </td>
                  </tr>
                ) : (
                  reportData.map((row, idx) => (
                    <tr key={idx}>
                      <td>{row.FACTORY}</td>
                      <td className="right">{row.BudgetWeeklys}</td>
                      <td className="right">{row.ActualWeeklys}</td>
                      <td className="right">{row.BudgetMonthlys}</td>
                      <td className="right">{row.ActualMonthlys}</td>
                      <td className="right">{row.BudgetYearlys}</td>
                      <td className="right">{row.ActualYearlys}</td>
                      <td className="right">{row.ActualPreYearlys}</td>
                      <td>{row.Remark}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Report_BudgetVSActual;
