import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast, Toaster } from 'react-hot-toast';
import { masterService } from '../../microservices/api.service';
import { apiClient } from '../../microservices/http.client';
import '../../styles/Report.css';
import '../../styles/DriageSummary.css';

const today = () => {
  const d = new Date();
  return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;
};

const normalizeUnit = (u) => ({
  code: String(u?.F_Code || u?.f_Code || u?.id || '').trim(),
  name: String(u?.F_Name || u?.f_Name || u?.name || '').trim()
});

const n = (v) => {
  const x = Number(String(v ?? '').replace(/,/g, ''));
  return Number.isNaN(x) ? 0 : x;
};
const fmt = (v) => n(v).toFixed(2);

const COLS = [
  { key: 'SLNO', label: 'SLNO', align: 'center' },
  { key: 'C_CODE', label: 'Code', align: 'center' },
  { key: 'C_NAME', label: 'Name Of Center', align: 'left' },
  { key: 'PQTY', label: 'Purchase Qty', align: 'right', num: true },
  { key: 'RQTY', label: 'Receipt Qty', align: 'right', num: true },
  { key: 'CLBAL', label: 'Closing Balance', align: 'right', num: true },
  { key: 'TOTREPT', label: 'Total Receipt', align: 'right', num: true },
  { key: 'DRQTY', label: 'Dries Qty', align: 'right', num: true },
  { key: 'PERC', label: '%Tage', align: 'right', dec: true }
];

const Report_DriageSummary = () => {
  const navigate = useNavigate();
  const [units, setUnits] = useState([]);
  const [loading, setLoading] = useState(false);
  const [rows, setRows] = useState([]);
  const [filters, setFilters] = useState({ unit: '', date: today() });

  useEffect(() => {
    masterService
      .getUnits()
      .then((d) => setUnits(Array.isArray(d) ? d.map(normalizeUnit).filter((u) => u.code) : []))
      .catch(() => {});
  }, []);

  const handleChange = (e) => setFilters((prev) => ({ ...prev, [e.target.name]: e.target.value }));

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
      const res = await apiClient.get('/report/driage-summary', {
        params: { F_Code: filters.unit, Date: filters.date }
      });
      const data = res?.data?.data ?? res?.data?.recordsets?.[0] ?? (Array.isArray(res?.data) ? res.data : []);
      if (!Array.isArray(data) || data.length === 0) {
        toast('No data found.', { icon: 'i' });
        setRows([]);
      } else {
        setRows(data);
        toast.success(`${data.length} rows loaded.`);
      }
    } catch {
      toast.error('Failed to fetch Driage Summary.');
    } finally {
      setLoading(false);
    }
  };

  const totals = useMemo(() => {
    const sum = (key) => rows.reduce((a, r) => a + n(r[key]), 0);
    return {
      PQTY: sum('PQTY'),
      RQTY: sum('RQTY'),
      CLBAL: sum('CLBAL'),
      TOTREPT: sum('TOTREPT'),
      DRQTY: sum('DRQTY')
    };
  }, [rows]);

  const handleDetail = (row) => {
    const centerCode = row?.C_CODE || '';
    navigate(`/Report/DriageCentreDetail?factory=${filters.unit}&centerCode=${centerCode}&date=${filters.date}`);
  };

  return (
    <div className="driage-summary-page">
      <Toaster position="top-right" />

      <div className="driage-summary-card">
        <div className="driage-summary-header">DRIAGE CENTER SUMMARY</div>
        <div className="driage-summary-subheader">DRIAGE CENTER SUMMARY</div>

        <div className="driage-summary-body">
          <div className="driage-summary-filters">
            <div className="driage-summary-field">
              <label>Factory</label>
              <select name="unit" value={filters.unit} onChange={handleChange}>
                <option value="">-- Select Factory --</option>
                {units.map((u, i) => (
                  <option key={`${u.code}-${i}`} value={u.code}>
                    {u.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="driage-summary-field">
              <label>Date</label>
              <input
                type="text"
                name="date"
                value={filters.date}
                onChange={handleChange}
                placeholder="DD/MM/YYYY"
              />
            </div>
          </div>

          <div className="driage-summary-actions">
            <button onClick={handleSearch} disabled={loading}>
              {loading ? 'Searching...' : 'Search'}
            </button>
            <button onClick={() => toast('Excel export coming soon.', { icon: 'i' })}>Excel</button>
            <button onClick={() => window.print()}>Print</button>
            <button onClick={() => navigate(-1)}>Exit</button>
          </div>

          <div className="driage-summary-table-wrap">
            <table className="driage-summary-table">
              <thead>
                <tr>
                  {COLS.map((c) => (
                    <th key={c.key} className={c.align}>
                      {c.label}
                    </th>
                  ))}
                  <th className="center"> </th>
                </tr>
              </thead>
              <tbody>
                {rows.length === 0 ? (
                  <tr>
                    <td colSpan={COLS.length + 1} className="driage-summary-empty">
                      Select a factory and date, then click Search.
                    </td>
                  </tr>
                ) : (
                  rows.map((row, idx) => (
                    <tr key={idx}>
                      {COLS.map((c) => {
                        const raw = c.key === 'SLNO' ? row[c.key] ?? idx + 1 : row[c.key];
                        const value = c.dec || c.num ? fmt(raw) : (raw ?? '');
                        return (
                          <td key={c.key} className={c.align}>
                            {value}
                          </td>
                        );
                      })}
                      <td className="center">
                        <button className="driage-summary-detail" onClick={() => handleDetail(row)}>
                          Detail
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
              {rows.length > 0 && (
                <tfoot>
                  <tr className="driage-summary-total">
                    <td className="center">-</td>
                    <td className="center">-</td>
                    <td className="left">TOTAL</td>
                    <td className="right">{fmt(totals.PQTY)}</td>
                    <td className="right">{fmt(totals.RQTY)}</td>
                    <td className="right">{fmt(totals.CLBAL)}</td>
                    <td className="right">{fmt(totals.TOTREPT)}</td>
                    <td className="right">{fmt(totals.DRQTY)}</td>
                    <td className="right">-</td>
                    <td className="center"> </td>
                  </tr>
                </tfoot>
              )}
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Report_DriageSummary;
