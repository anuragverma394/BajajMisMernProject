import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast, Toaster } from 'react-hot-toast';
import { labService, masterService } from '../../microservices/api.service';
import '../../styles/base.css';
import '../../styles/BcMagmaView.css';

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

const getRows = (payload) => {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.data)) return payload.data;
  return [];
};

const BcMagmaView = () => {
  const navigate = useNavigate();
  const [units, setUnits] = useState([]);
  const [selectedFactory, setSelectedFactory] = useState('');
  const [reportDate, setReportDate] = useState(toDDMMYYYY(new Date()));
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    masterService
      .getUnits()
      .then((data) => {
        const list = Array.isArray(data) ? data : [];
        setUnits(list);
        if (!selectedFactory && list.length) {
          setSelectedFactory(String(list[0]?.f_Code ?? list[0]?.F_Code ?? list[0]?.id ?? ''));
        }
      })
      .catch(() => setUnits([]));
  }, [selectedFactory]);

  const columns = useMemo(
    () => [
      { key: 'F_NAME', label: 'FACT.NAME' },
      { key: 'DDATE', label: 'DATE' },
      { key: 'HOUR', label: 'HOUR' },
      { key: 'DIS_HOU', label: 'TIME IN HOUR' },
      { key: 'LOCATION_CODE', label: 'LOCATION' },
      { key: 'A1_BX', label: 'A1_BX' },
      { key: 'A1_POL', label: 'A1_POL' },
      { key: 'A1_PY', label: 'A1_PY' },
      { key: 'B_BX', label: 'B_BX' },
      { key: 'B_POL', label: 'B_POL' },
      { key: 'B_PY', label: 'B_PY' },
      { key: 'C_BX', label: 'C_BX' },
      { key: 'C_POL', label: 'C_POL' },
      { key: 'C_PY', label: 'C_PY' },
      { key: 'CD_BX', label: 'CD_BX' },
      { key: 'CD_POL', label: 'CD_POL' },
      { key: 'CD_PTY', label: 'CD_PTY' },
      { key: 'C1_FW_BX', label: 'C1_FW_BX' },
      { key: 'C1_FW_POL', label: 'C1_FW_POL' },
      { key: 'C1_FW_PY', label: 'C1_FW_PY' }
    ],
    []
  );

  const handleSearch = async () => {
    const date = normalizeDateInput(reportDate);
    if (!date) {
      toast.error('Date is required');
      return;
    }
    setLoading(true);
    try {
      const payload = await labService.getBcMagmaView(selectedFactory || '0', date);
      const list = getRows(payload);
      setRows(list);
      if (!list.length) toast.error('No records found');
    } catch (error) {
      setRows([]);
      toast.error(error?.response?.data?.message || 'Failed to load records');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bcmv-page">
      <Toaster position="top-right" />
      <div className="page-card">
        <div className="page-card-header bcmv-main-title">B/C MAGMA VIEW</div>
        <div className="page-card-body">
          <div className="bcmv-panel">
            <div className="bcmv-panel-title">B/C MAGMA VIEW</div>
            <div className="bcmv-panel-body">
              <div className="bcmv-filters">
                <div className="form-group">
                  <label>Factory</label>
                  <select className="form-control" value={selectedFactory} onChange={(e) => setSelectedFactory(e.target.value)}>
                    <option value="">Select Factory</option>
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
                  <label>Date</label>
                  <input className="form-control" type="text" value={reportDate} onChange={(e) => setReportDate(e.target.value)} placeholder="DD/MM/YYYY" />
                </div>
              </div>

              <div className="bcmv-actions">
                <button className="btn btn-primary" onClick={handleSearch} disabled={loading}>
                  {loading ? 'Searching...' : 'Search'}
                </button>
                <button className="btn btn-primary" onClick={() => navigate('/Lab/BcMagma')}>
                  Add New
                </button>
                <button className="btn btn-primary" onClick={() => navigate('/Lab/LabDashboard')}>
                  Exit
                </button>
              </div>

              <div className="bcmv-table-wrap">
                <table className="bcmv-table">
                  <thead>
                    <tr>
                      {columns.map((column) => (
                        <th key={column.key}>{column.label}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {!rows.length ? (
                      <tr>
                        <td colSpan={columns.length} className="bcmv-empty">
                          {loading ? 'Loading...' : 'No Record Available'}
                        </td>
                      </tr>
                    ) : (
                      rows.map((row, idx) => {
                        const rowKey = `${row?.FACTORY ?? ''}-${row?.DDATE ?? ''}-${row?.HOUR ?? ''}-${row?.LOCATION_CODE ?? ''}-${idx}`;
                        return (
                          <tr key={rowKey}>
                            {columns.map((column) => {
                              const value = row?.[column.key] ?? '';
                              if (column.key === 'F_NAME') {
                                return (
                                  <td key={`${rowKey}-${column.key}`}>
                                    <button
                                      type="button"
                                      className="bcmv-link"
                                      onClick={() =>
                                        navigate(
                                          `/Lab/BcMagma?FACTORY=${row?.FACTORY ?? ''}&DDATE=${encodeURIComponent(
                                            row?.DDATE ?? ''
                                          )}&HOUR=${row?.HOUR ?? ''}&LOCATION=${encodeURIComponent(row?.LOCATION_CODE ?? '')}`
                                        )
                                      }
                                    >
                                      {String(value || '-')}
                                    </button>
                                  </td>
                                );
                              }
                              return <td key={`${rowKey}-${column.key}`}>{String(value)}</td>;
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

export default BcMagmaView;



