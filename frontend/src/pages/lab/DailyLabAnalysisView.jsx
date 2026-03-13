import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast, Toaster } from 'react-hot-toast';
import { labService, masterService } from '../../microservices/api.service';
import '../../styles/base.css';const __cx = (...vals) => vals.filter(Boolean).join(" ");

const columns = [
{ key: 'TIME', label: 'TIME' },
{ key: 'TIME_IN_HOURS', label: 'TIME_IN_HOURS' },
{ key: 'SHIFT', label: 'SHIFT' },
{ key: 'DDATE', label: 'DDATE' },
{ key: 'MILL NO', label: 'MILL NO' },
{ key: 'PJ_Brix', label: 'PJ_Brix' },
{ key: 'PJ_POL', label: 'PJ_POL' },
{ key: 'PJ_PY', label: 'PJ_PY' },
{ key: 'MJ_BX', label: 'MJ_BX' },
{ key: 'MJ_POL', label: 'MJ_POL' },
{ key: 'MJ_PY', label: 'MJ_PY' },
{ key: 'LMJ_BX', label: 'LMJ_BX' },
{ key: 'LMJ_POL', label: 'LMJ_POL' },
{ key: 'LMJ_PY', label: 'LMJ_PY' },
{ key: 'FPJU_BX', label: 'FPJU_BX' },
{ key: 'FPJU_POL', label: 'FPJU_POL' },
{ key: 'FPJU_PY', label: 'FPJU_PY' },
{ key: 'FPJT_BX', label: 'FPJT_BX' },
{ key: 'FPJT_POL', label: 'FPJT_POL' },
{ key: 'FPJT_PY', label: 'FPJT_PY' },
{ key: 'CJ_BX', label: 'CJ_BX' },
{ key: 'CJ_POL', label: 'CJ_POL' },
{ key: 'CJ_PY', label: 'CJ_PY' },
{ key: 'DEVC_I_BX', label: 'DEVC_I_BX' },
{ key: 'DEVC_II_BX', label: 'DEVC_II_BX' },
{ key: 'US_BX', label: 'US_BX' },
{ key: 'US_POL', label: 'US_POL' },
{ key: 'US_PY', label: 'US_PY' },
{ key: 'UST_BX', label: 'UST_BX' },
{ key: 'UST_POL', label: 'UST_POL' },
{ key: 'UST_PY', label: 'UST_PY' },
{ key: 'SS_BX', label: 'SS_BX' },
{ key: 'SS_POL', label: 'SS_POL' },
{ key: 'SS_PY', label: 'SS_PY' },
{ key: 'B_POL', label: 'B_POL' },
{ key: 'B_MOIS', label: 'B_MOIS' },
{ key: 'PC', label: 'PC' },
{ key: 'PC1', label: 'PC1' },
{ key: 'PC2', label: 'PC2' },
{ key: 'PC3', label: 'PC3' },
{ key: 'PC4', label: 'PC4' },
{ key: 'PC5', label: 'PC5' },
{ key: 'PC6', label: 'PC6' },
{ key: 'ADD_WATER', label: 'ADD_WATER' },
{ key: 'MAC_FIBRE', label: 'MAC_FIBRE' },
{ key: 'USER_CODE', label: 'USER' }];


const DailyLabAnalysisView = () => {
  const navigate = useNavigate();
  const tableViewportRef = useRef(null);
  const [units, setUnits] = useState([]);
  const [selectedUnit, setSelectedUnit] = useState('All');
  const [reportDate, setReportDate] = useState('');
  const [reportData, setReportData] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [viewport, setViewport] = useState({ start: 0, end: 0 });

  const rowHeight = 30;
  const buffer = 8;

  useEffect(() => {
    masterService.getUnits().then((d) => setUnits(Array.isArray(d) ? d : [])).catch(() => {});
    setReportDate('');
  }, []);

  const updateViewport = useCallback(() => {
    const el = tableViewportRef.current;
    if (!el) return;
    const total = reportData.length;
    if (!total) {
      setViewport({ start: 0, end: 0 });
      return;
    }
    const visibleCount = Math.ceil(el.clientHeight / rowHeight) + buffer * 2;
    const start = Math.max(0, Math.floor(el.scrollTop / rowHeight) - buffer);
    const end = Math.min(total, start + visibleCount);
    setViewport((prev) => (prev.start === start && prev.end === end ? prev : { start, end }));
  }, [reportData.length]);

  useEffect(() => {
    const el = tableViewportRef.current;
    if (!el) return;
    updateViewport();
    const onScroll = () => updateViewport();
    el.addEventListener('scroll', onScroll, { passive: true });
    return () => el.removeEventListener('scroll', onScroll);
  }, [updateViewport]);

  useEffect(() => {
    if (!tableViewportRef.current) return;
    requestAnimationFrame(() => updateViewport());
  }, [reportData.length, updateViewport]);

  const handleSearch = async () => {
    setIsLoading(true);
    try {
      const data = await labService.getDailyAnalysis({ factory: selectedUnit === 'All' ? '0' : selectedUnit, DDATE: reportDate });
      const list = Array.isArray(data) ? data : [];
      setReportData(list);
      if (!data || data.length === 0) toast.error("No records found.");else
      toast.success("Data loaded successfully.");
    } catch (error) {
      toast.error("Error fetching data.");
    } finally {
      setIsLoading(false);
    }
  };

  const openEdit = (row) => {
    const params = new URLSearchParams({
      DDATE: row.DDATE || '',
      MILL_NO: String(row['MILL NO'] || row.MILL_NO || ''),
      FACTORY: String(row.FACTORY || selectedUnit || ''),
      TIME1: String(row.TIME || '')
    });
    navigate(`/Lab/DailyLabAnalysisAdd?${params.toString()}`);
  };

  const visibleRows = useMemo(
    () => (viewport.end > viewport.start ? reportData.slice(viewport.start, viewport.end) : []),
    [reportData, viewport.start, viewport.end]
  );

  const topSpacer = viewport.start * rowHeight;
  const bottomSpacer = Math.max(0, (reportData.length - viewport.end) * rowHeight);

  return (
    <div className="p-[20px] bg-white min-h-[100vh] font-['Poppins', Arial, sans-serif]">
      <Toaster position="top-right" />

      <div className={__cx("page-card", "rounded-lg")}>
        <div className={__cx("page-card-header", "text-left text-[15px]")}>
          Daily Lab Analysis Data View
        </div>

        <div className={__cx("page-card-body", "bg-[#f5f5e8]")}>
          <div className="page-section-title">Daily Lab Analysis Data View</div>
          <div className={__cx("form-grid-4", "mb-[20px]")}>
            <div className="form-group">
              <label>Factory</label>
              <select className="form-control" value={selectedUnit} onChange={(e) => setSelectedUnit(e.target.value)}>
                <option value="All">All</option>
                {units.map((u, idx) =>
                <option key={`${u.f_Code || u.F_CODE || u.id}-${idx}`} value={u.f_Code || u.F_CODE || u.id}>
                    {u.F_Name || u.F_NAME || u.name}
                  </option>
                )}
              </select>
            </div>
            <div className="form-group">
              <label>Date</label>
              <input
                type="text"
                className="form-control"
                placeholder="Ex. dd/mm/yyyy"
                value={reportDate}
                onChange={(e) => setReportDate(e.target.value)} />
              
            </div>
          </div>

          <div className={__cx("form-actions", "border-t-0 mt-[0] pt-[0]")}>
            <button className="btn btn-primary" onClick={handleSearch} disabled={isLoading}>
              {isLoading ? 'Searching...' : 'Search'}
            </button>
            <button className="btn btn-primary" onClick={() => navigate('/Lab/DailyLabAnalysisAdd')}>
              Add New
            </button>
            <button className="btn btn-primary" onClick={() => navigate(-1)}>
              Exit
            </button>
          </div>
        </div>
      </div>

      <div className={__cx("page-card", "mt-[10px]")}>
        <div ref={tableViewportRef} className={__cx("table-wrapper", "max-h-[65vh] overflow-y-auto overflow-x-auto")}>
          <table className={__cx("data-table", "min-w-[2800px]")}>
            <thead>
              <tr>
                {columns.map((col) =>
                <th key={col.key}>{col.label}</th>
                )}
              </tr>
            </thead>
            <tbody>
              {reportData.length > 0 ?
              <>
                {topSpacer > 0 && (
                  <tr style={{ height: `${topSpacer}px` }}>
                    <td colSpan={columns.length}></td>
                  </tr>
                )}
                {visibleRows.map((row, idx) =>
              <tr key={`${row.FACTORY || 'f'}-${row.TIME || idx}-${row['MILL NO'] || row.MILL_NO || 'm'}-${row.DDATE || 'd'}-${viewport.start + idx}`}>
                    {columns.map((col) => {
                  if (col.key === 'TIME') {
                    return (
                      <td key={`${idx}-${col.key}`}>
                            <button
                          type="button"
                          onClick={() => openEdit(row)} className="bg-[transparent] border-0 text-[#0b74de] cursor-pointer p-[0px]">

                          
                              {row[col.key] ?? ''}
                            </button>
                          </td>);

                  }
                  return <td key={`${idx}-${col.key}`}>{row[col.key] ?? '0'}</td>;
                })}
                  </tr>
                )}
                {bottomSpacer > 0 && (
                  <tr style={{ height: `${bottomSpacer}px` }}>
                    <td colSpan={columns.length}></td>
                  </tr>
                )}
              </> :

              <tr>
                  <td colSpan={columns.length} className="text-center font-bold">
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

export default DailyLabAnalysisView;
