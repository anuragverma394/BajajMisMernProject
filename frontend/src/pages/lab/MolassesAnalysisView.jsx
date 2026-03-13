import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast, Toaster } from 'react-hot-toast';
import { labService, masterService } from '../../microservices/api.service';
import '../../styles/base.css';
import '../../styles/MolassesAnalysisView.css';

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

const MolassesAnalysisView = () => {
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
          const firstCode = String(list[0]?.f_Code ?? list[0]?.F_Code ?? list[0]?.id ?? '');
          setSelectedFactory(firstCode);
        }
      })
      .catch(() => setUnits([]));
  }, [selectedFactory]);

  const columns = useMemo(
    () => [
      { key: 'F_NAME', label: 'FACT.NAME' },
      { key: 'DDATE', label: 'DATE' },
      { key: 'TIME', label: 'TIME' },
      { key: 'DIS_HOU', label: 'TIME IN HOUR' },
      { key: 'LOCATION_CODE', label: 'TIME IN HOUR' },
      { key: 'AH_BX', label: 'AH_BX' },
      { key: 'AH_POL', label: 'AH_POL' },
      { key: 'AH_PY', label: 'AH_PY' },
      { key: 'AL_BX', label: 'AL_BX' },
      { key: 'AL_POL', label: 'AL_POL' },
      { key: 'AL_PY', label: 'AL_PY' },
      { key: 'A1_BX', label: 'A1_BX' },
      { key: 'A1_POL', label: 'A1_POL' },
      { key: 'A1_PY', label: 'A1_PY' },
      { key: 'BH_BX', label: 'BH_BX' },
      { key: 'BH_POL', label: 'BH_POL' },
      { key: 'BH_PY', label: 'BH_PY' },
      { key: 'CL_BX', label: 'CL_BX' },
      { key: 'CL_POL', label: 'CL_POL' },
      { key: 'CL_PY', label: 'CL_PY' },
      { key: 'CH_BX', label: 'CH_BX' },
      { key: 'CH_POL', label: 'CH_POL' },
      { key: 'CH_PY', label: 'CH_PY' },
      { key: 'MELT_BX', label: 'MELT_BX' },
      { key: 'MELT_POL', label: 'MELT_POL' },
      { key: 'MELT_PY', label: 'MELT_PY' },
      { key: 'FM_BX', label: 'FM_BX' },
      { key: 'FM_POL', label: 'FM_POL' },
      { key: 'FM_PY', label: 'FM_PY' }
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
      const payload = await labService.getMolassesAnalysisView(selectedFactory || '0', date);
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
    <div className="molv-page">
      <Toaster position="top-right" />

      <div className="page-card">
        <div className="page-card-header molv-main-title">MOLASSES ANALYSIS VIEW</div>
        <div className="page-card-body">
          <div className="molv-panel">
            <div className="molv-panel-title">MOLASSES ANALYSIS VIEW</div>
            <div className="molv-panel-body">
              <div className="molv-filters">
                <div className="form-group">
                  <label htmlFor="molv-factory">Factory</label>
                  <select id="molv-factory" className="form-control" value={selectedFactory} onChange={(e) => setSelectedFactory(e.target.value)}>
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
                  <label htmlFor="molv-date">Date</label>
                  <input id="molv-date" className="form-control" type="text" value={reportDate} onChange={(e) => setReportDate(e.target.value)} placeholder="DD/MM/YYYY" />
                </div>
              </div>

              <div className="molv-actions">
                <button className="btn btn-primary" onClick={handleSearch} disabled={loading}>
                  {loading ? 'Searching...' : 'Search'}
                </button>
                <button className="btn btn-primary" onClick={() => navigate('/Lab/MolassesAnalysis')}>
                  Add New
                </button>
                <button className="btn btn-primary" onClick={() => navigate('/Lab/LabDashboard')}>
                  Exit
                </button>
              </div>

              <div className="molv-table-wrap">
                <table className="molv-table">
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
                        <td colSpan={columns.length} className="molv-empty">
                          {loading ? 'Loading...' : 'No Record Available'}
                        </td>
                      </tr>
                    ) : (
                      rows.map((row, idx) => {
                        const rowKey = `${row?.FACTORY ?? ''}-${row?.DDATE ?? ''}-${row?.TIME ?? ''}-${row?.LOCATION_CODE ?? ''}-${idx}`;
                        return (
                          <tr key={rowKey}>
                            {columns.map((column) => {
                              const value = row?.[column.key] ?? '';
                              if (column.key === 'F_NAME') {
                                return (
                                  <td key={`${rowKey}-${column.key}`}>
                                    <button
                                      type="button"
                                      className="molv-link"
                                      onClick={() =>
                                        navigate(
                                          `/Lab/MolassesAnalysis?FACTORY=${row?.FACTORY ?? ''}&DDATE=${encodeURIComponent(
                                            row?.DDATE ?? ''
                                          )}&TIME=${row?.TIME ?? ''}&LOCATION=${encodeURIComponent(row?.LOCATION_CODE ?? '')}`
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

export default MolassesAnalysisView;



