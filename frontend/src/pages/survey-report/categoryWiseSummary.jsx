import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast, Toaster } from 'react-hot-toast';
import { surveyService, masterService } from '../../microservices/api.service';
import '../../styles/SurveyReports.css';
import '../../styles/categoryWiseSummary.css';
import { openPrintWindow } from '../../utils/print';

const SurveyReport_categoryWiseSummary = () => {
  const navigate = useNavigate();
  const [factories, setFactories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [reportData, setReportData] = useState([]);
  const [filters, setFilters] = useState({
    unitCode: '',
    date: new Date().toISOString().split('T')[0],
    catg: '0'
  });

  useEffect(() => {
    const loadUnits = async () => {
      try {
        const units = await masterService.getUnits();
        setFactories(units);
        if (units.length > 0) {
          setFilters((prev) => ({ ...prev, unitCode: units[0].F_Code || units[0].id }));
        }
      } catch (error) {
        toast.error('Telemetry link failure: Unit master offline');
      }
    };
    loadUnits();
  }, []);

  const handleSearch = async (e) => {
    if (e) e.preventDefault();
    if (!filters.unitCode) {
      toast.error('Command node identification required');
      return;
    }

    setLoading(true);
    try {
      const apiParams = {
        F_Name: filters.unitCode,
        date: filters.date,
        catg: filters.catg
      };
      const response = await surveyService.getCategoryWiseSummary(apiParams);
      setReportData(response.data || response || []);
      toast.success('Category summary loaded');
    } catch (error) {
      toast.error('Failed to load category summary');
      setReportData([]);
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = () => {
    const content = document.getElementById('category-report-print');
    openPrintWindow({
      title: 'Category Wise Summary',
      subtitle: `Unit: ${filters.unitCode} | Date: ${filters.date}`,
      contentHtml: content ? content.outerHTML : ''
    });
  };

  return (
    <div className="category-summary-page">
      <Toaster position="top-right" />

      <div className="category-summary-card">
        <div className="category-summary-header">Category Wise Summary Report</div>
        <div className="category-summary-subheader">Category Wise Summary Report</div>

        <div className="category-summary-body">
          <form className="category-summary-filters" onSubmit={handleSearch}>
            <div className="category-summary-field">
              <label>Factory</label>
              <select
                value={filters.unitCode}
                onChange={(e) => setFilters({ ...filters, unitCode: e.target.value })}
                required
              >
                <option value="">-Select Factory-</option>
                {factories.map((f, idx) => (
                  <option key={`${f.F_Code || f.id}-${idx}`} value={f.F_Code || f.id}>
                    {f.F_Name || f.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="category-summary-field">
              <label>Date</label>
              <input
                type="date"
                value={filters.date}
                onChange={(e) => setFilters({ ...filters, date: e.target.value })}
              />
            </div>

            <div className="category-summary-field">
              <label>Category</label>
              <select
                value={filters.catg}
                onChange={(e) => setFilters({ ...filters, catg: e.target.value })}
              >
                <option value="0">ALL</option>
                <option value="1">Shift Forward (H -> L)</option>
                <option value="2">Shift Reverse (L -> H)</option>
              </select>
            </div>
          </form>

          <div className="category-summary-actions">
            <button type="button" onClick={handleSearch} disabled={loading}>
              {loading ? 'Searching...' : 'Search'}
            </button>
            <button type="button" disabled={!reportData.length}>
              Export
            </button>
            <button type="button" onClick={handlePrint} disabled={!reportData.length}>
              Print
            </button>
            <button type="button" onClick={() => navigate(-1)}>
              Exit
            </button>
          </div>

          <div className="category-summary-table-wrap" id="category-report-print">
            <div className="category-summary-table-header">
              <span>Category Wise Summary Report</span>
              <button type="button" className="category-summary-help" aria-label="Help">
                ?
              </button>
            </div>

            <table className="category-summary-table">
              <thead>
                <tr>
                  <th>S.No</th>
                  <th>Bafore Category Name</th>
                  <th>Update Category Name</th>
                  <th>Plot Count</th>
                </tr>
              </thead>
              <tbody>
                {reportData.length === 0 ? (
                  <tr>
                    <td colSpan="4" className="category-summary-empty">
                      No records found
                    </td>
                  </tr>
                ) : (
                  reportData.map((row, idx) => (
                    <tr key={idx}>
                      <td>{idx + 1}</td>
                      <td>{row.BaforeCategoryName || row.beforeCategoryName}</td>
                      <td>{row.UpdateCategoryName || row.updateCategoryName}</td>
                      <td>{row.PlotCount || row.plotCount}</td>
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

export default SurveyReport_categoryWiseSummary;
