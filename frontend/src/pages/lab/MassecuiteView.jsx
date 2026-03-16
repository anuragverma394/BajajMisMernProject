import React, { useMemo, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast, Toaster } from 'react-hot-toast';
import { labService, masterService } from '../../microservices/api.service';
import '../../styles/base.css';
import './MassecuiteView.css';

const TYPE_CONFIG = {
  A: { hasLocation: false, addRoute: '/Lab/AMassecuite' },
  A1: { hasLocation: false, addRoute: '/Lab/A1Massecuite' },
  B: { hasLocation: true, addRoute: '/Lab/BMassecuite' },
  C: { hasLocation: true, addRoute: '/Lab/CMassecuite' },
  C1: { hasLocation: true, addRoute: '/Lab/C1Massecuite' },
  R1: { hasLocation: true, addRoute: '/Lab/R1' },
  R2: { hasLocation: true, addRoute: '/Lab/R2' }
};

const BASE_COLUMNS = [
  { key: 'FACTORY', label: 'FACT.NAME' },
  { key: 'DDATE', label: 'DATE' },
  { key: 'SLNO', label: 'SLNO' },
  { key: 'HOUR', label: 'HOUR' },
  { key: 'DIS_HOU', label: 'TIME IN HOUR' },
  { key: 'STRIKE_NO', label: 'STRIKE NO' },
  { key: 'PAN_NO', label: 'PAN NO' },
  { key: 'START_AT', label: 'START AT' },
  { key: 'DROP_AT', label: 'DROP AT' },
  { key: 'DROP_BY', label: 'DROP BY' },
  { key: 'CRYST_NO', label: 'CRYST NO' },
  { key: 'ANAL_BX', label: 'ANAL.BX' },
  { key: 'ANAL_POL', label: 'ANAL.POL' },
  { key: 'ANAL_PY', label: 'ANAL.PY' },
  { key: 'QTY', label: 'TOTAL' }
];

const toDDMMYYYY = (dateObj) => {
  const dd = String(dateObj.getDate()).padStart(2, '0');
  const mm = String(dateObj.getMonth() + 1).padStart(2, '0');
  const yyyy = dateObj.getFullYear();
  return `${dd}/${mm}/${yyyy}`;
};

const normalizeDateInput = (value) => {
  const raw = String(value || '').trim();
  if (!raw) return '';
  if (/^\d{2}[-/]\d{2}[-/]\d{4}$/.test(raw)) return raw.replace(/-/g, '/');
  if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) {
    const [yyyy, mm, dd] = raw.split('-');
    return `${dd}/${mm}/${yyyy}`;
  }
  return raw;
};

const normalizeRows = (payload) => {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.list)) return payload.list;
  if (Array.isArray(payload?.rows)) return payload.rows;
  if (Array.isArray(payload?.data)) return payload.data;
  return [];
};

const getCellValue = (row, key) => {
  if (key === 'FACTORY') {
    return row?.FACTORY ?? row?.FACT ?? row?.FACT_NAME ?? row?.F_Name ?? '';
  }
  if (key === 'DDATE') {
    return normalizeDateInput(row?.DDATE ?? row?.DATE ?? row?.date ?? '');
  }
  return row?.[key] ?? '';
};

const buildRowKey = (row, index) =>
  [
    row?.FACTORY ?? row?.FACT ?? '',
    row?.DDATE ?? row?.DATE ?? '',
    row?.SLNO ?? '',
    row?.HOUR ?? '',
    row?.STRIKE_NO ?? '',
    index
  ]
    .map((part) => String(part ?? ''))
    .join('-');

const MassecuiteView = ({ type = 'A', title }) => {
  const navigate = useNavigate();
  const upperType = String(type || 'A').toUpperCase();
  const typeConfig = TYPE_CONFIG[upperType] || TYPE_CONFIG.A;

  const [units, setUnits] = useState([]);
  const [selectedUnit, setSelectedUnit] = useState('');
  const [reportDate, setReportDate] = useState(toDDMMYYYY(new Date()));
  const [reportData, setReportData] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let isMounted = true;
    masterService
      .getUnits()
      .then((data) => {
        if (isMounted) setUnits(Array.isArray(data) ? data : []);
      })
      .catch(() => {
        if (isMounted) setUnits([]);
      });
    return () => {
      isMounted = false;
    };
  }, []);

  const columns = useMemo(() => {
    if (!typeConfig.hasLocation) return BASE_COLUMNS;
    return [
      BASE_COLUMNS[0],
      BASE_COLUMNS[1],
      BASE_COLUMNS[2],
      { key: 'LOCATION_CODE', label: 'LOCATION' },
      ...BASE_COLUMNS.slice(3)
    ];
  }, [typeConfig.hasLocation]);

  const handleSearch = async () => {
    const normalizedDate = normalizeDateInput(reportDate);
    if (!normalizedDate) {
      toast.error('Date is required');
      return;
    }
    if (!selectedUnit) {
      toast.error('Please select Factory');
      return;
    }

    try {
      setLoading(true);
      const payload = await labService.getMassecuiteView({
        type: upperType,
        factory: selectedUnit || '0',
        date: normalizedDate
      });
      const rows = normalizeRows(payload);
      setReportData(rows);
      if (!rows.length) toast.error('No records found');
    } catch (error) {
      toast.error(error?.response?.data?.message || 'Failed to load data');
      setReportData([]);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (row) => {
    const paramsObj = {
      SLNO: String(row?.SLNO ?? ''),
      FACTORY: String(row?.FACTORY ?? row?.FACT ?? ''),
      DDATE: String(normalizeDateInput(row?.DDATE ?? row?.DATE ?? reportDate))
    };
    if (typeConfig.hasLocation) {
      paramsObj.DIVN = String(row?.LOCATION_CODE ?? '');
      paramsObj.LOCATION_CODE = String(row?.LOCATION_CODE ?? '');
    }
    const params = new URLSearchParams(paramsObj);
    navigate(`${typeConfig.addRoute}?${params.toString()}`);
  };

  const pageTitle = title || `${upperType} MASSECUITE VIEW`;

  return (
    <div className="masv-page">
      <Toaster position="top-right" />

      <div className="page-card">
        <div className="page-card-header masv-main-header">{pageTitle}</div>
        <div className="page-card-body">
          <div className="masv-panel">
            <div className="masv-panel__title">{pageTitle}</div>
            <div className="masv-panel__body">
              <div className="form-grid-3">
                <div className="form-group">
                  <label htmlFor="masv-factory">Factory</label>
                  <select
                    id="masv-factory"
                    className="form-control"
                    value={selectedUnit}
                    onChange={(e) => setSelectedUnit(e.target.value)}
                  >
                    <option value="">All</option>
                    {units.map((u, idx) => {
                      const code = u?.f_Code ?? u?.F_Code ?? u?.id ?? '';
                      const name = u?.F_Name ?? u?.f_Name ?? u?.name ?? `Unit ${idx + 1}`;
                      return (
                        <option key={`${String(code)}-${idx}`} value={code}>
                          {name}
                        </option>
                      );
                    })}
                  </select>
                </div>

                <div className="form-group">
                  <label htmlFor="masv-date">Date</label>
                  <input
                    id="masv-date"
                    type="text"
                    className="form-control"
                    value={reportDate}
                    onChange={(e) => setReportDate(e.target.value)}
                    placeholder="DD/MM/YYYY"
                  />
                </div>
              </div>

              <div className="form-actions">
                <button className="btn btn-primary" onClick={handleSearch} disabled={loading}>
                  {loading ? 'Searching...' : 'Search'}
                </button>
                <button className="btn btn-primary" onClick={() => navigate(typeConfig.addRoute)}>
                  Add New
                </button>
                <button className="btn btn-primary" onClick={() => navigate('/Lab/LabDashboard')}>
                  Exit
                </button>
              </div>

              <div className="masv-table-wrap">
                <table className="masv-table">
                  <thead>
                    <tr>
                      {columns.map((column) => (
                        <th key={column.key}>{column.label}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {!reportData.length ? (
                      <tr>
                        <td colSpan={columns.length} className="masv-empty">
                          {loading ? 'Loading...' : 'No Record Available'}
                        </td>
                      </tr>
                    ) : (
                      reportData.map((row, idx) => {
                        const rowKey = buildRowKey(row, idx);
                        return (
                          <tr key={rowKey}>
                            {columns.map((column) => {
                              const value = getCellValue(row, column.key);
                              if (column.key === 'FACTORY') {
                                return (
                                  <td key={`${rowKey}-${column.key}`}>
                                    <button type="button" className="masv-link-btn" onClick={() => handleEdit(row)}>
                                      {String(value || '-')}
                                    </button>
                                  </td>
                                );
                              }
                              return <td key={`${rowKey}-${column.key}`}>{String(value || '')}</td>;
                            })}
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MassecuiteView;



