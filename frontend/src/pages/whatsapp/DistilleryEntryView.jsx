import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast, Toaster } from 'react-hot-toast';
import { masterService, distilleryEntryService } from '../../microservices/api.service';
import './DistilleryEntryView.css';

const columns = [
  { key: 'Unit', label: 'Units' },
  { key: 'Dist_Date', label: 'Date' },
  { key: 'Dist_RSStatus', label: 'Restart Status' },
  { key: 'Dist_RSDate', label: 'Restart Date' },
  { key: 'Dist_RSProd_OnDate', label: 'RS_Prod OnDate' },
  { key: 'Dist_RSProd_ToDate', label: 'RS_Prod ToDate' },
  { key: 'Dist_RSProd_ProdType', label: 'RS_Prod ProdType' },
  { key: 'Dist_AAProd_OnDate', label: 'AA_Prod OnDate' },
  { key: 'Dist_AAProd_ToDate', label: 'AA_Prod ToDate' },
  { key: 'Dist_AAProd_ProdType', label: 'AA_Prod ProdType' },
  { key: 'Dist_Rec_OnDate', label: 'Rec OnDate' },
  { key: 'Dist_Rec_ToDate', label: 'Rec ToDate' },
  { key: 'Dist_Cap_OnDate', label: 'Cap OnDate' },
  { key: 'Dist_Cap_ToDate', label: 'Cap ToDate' },
  { key: 'Dist_FinancialYear', label: 'Financial Year' },
  { key: 'Dist_Prod', label: 'Financial Prod' },
  { key: 'Dist_Stoppage', label: 'Stoppage' },
  { key: 'Dist_Remark', label: 'Remark' },
  { key: 'Dist_UserID', label: 'UserID' }
];

function formatDDMMYYYY(date) {
  const dd = String(date.getDate()).padStart(2, '0');
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const yyyy = date.getFullYear();
  return `${dd}-${mm}-${yyyy}`;
}

export default function DistilleryEntryView() {
  const navigate = useNavigate();
  const [units, setUnits] = useState([]);
  const [unitCode, setUnitCode] = useState('');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [rows, setRows] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const today = formatDDMMYYYY(new Date());
    setFromDate(today);
    setToDate(today);
    masterService.getUnits().then((d) => setUnits(Array.isArray(d) ? d : [])).catch(() => setUnits([]));
  }, []);

  const handleSearch = async () => {
    const today = formatDDMMYYYY(new Date());
    const safeFrom = (fromDate || '').trim() || today;
    const safeTo = (toDate || '').trim() || safeFrom;
    if (!fromDate) setFromDate(safeFrom);
    if (!toDate) setToDate(safeTo);
    try {
      setIsLoading(true);
      const data = await distilleryEntryService.getList({
        factoryCode: unitCode,
        fromDate: safeFrom,
        toDate: safeTo
      });
      const list = Array.isArray(data) ? data : [];
      setRows(list);
      if (!list.length) toast.error('No records found.');
    } catch (error) {
      toast.error(error?.response?.data?.message || 'Failed to fetch distillery data');
      setRows([]);
    } finally {
      setIsLoading(false);
    }
  };

  const exportCsv = () => {
    if (!rows.length) {
      toast.error('No data to export');
      return;
    }
    const header = columns.map((c) => c.label).join(',');
    const body = rows
      .map((r) => columns.map((c) => `"${String(r[c.key] ?? '').replace(/"/g, '""')}"`).join(','))
      .join('\n');
    const csv = `data:text/csv;charset=utf-8,${header}\n${body}`;
    const link = document.createElement('a');
    link.href = encodeURI(csv);
    link.download = 'distillery-entry.csv';
    link.click();
  };

  return (
    <div className="dev">
      <Toaster position="top-right" />
      <div className="dev__card">
        <div className="dev__titlebar">
          Distillery Entry
        </div>

        <div className="dev__content">
          <div className="dev__filters">
            <div className="dev__field">
              <label className="dev__label">Units</label>
              <select value={unitCode} onChange={(e) => setUnitCode(e.target.value)} className="dev__input">
                <option value="">All</option>
                {units.map((u, idx) => (
                  <option key={`${u.f_Code ?? u.id}-${idx}`} value={u.f_Code ?? u.id}>
                    {u.F_Name || u.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="dev__field">
              <label className="dev__label">From Date</label>
              <input value={fromDate} onChange={(e) => setFromDate(e.target.value)} className="dev__input" placeholder="Ex. dd/mm/yyyy" />
            </div>
            <div className="dev__field">
              <label className="dev__label">To Date</label>
              <input value={toDate} onChange={(e) => setToDate(e.target.value)} className="dev__input" placeholder="Ex. dd/mm/yyyy" />
            </div>
          </div>

          <div className="dev__actions">
            <button onClick={handleSearch} className="dev__btn" disabled={isLoading}>
              {isLoading ? 'Searching...' : 'Search'}
            </button>
            <button onClick={() => navigate('/WhatsApp/DistilleryEntry')} className="dev__btn">Add New</button>
            <button onClick={() => navigate(-1)} className="dev__btn">Exit</button>
            <button onClick={exportCsv} className="dev__btn">Excel</button>
          </div>

          <div className="dev__table-wrap">
            <table className="dev__table">
              <thead>
                <tr className="dev__tr-head">
                  {columns.map((col) => (
                    <th key={col.key} className="dev__th">{col.label}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.length ? (
                  rows.map((row, idx) => (
                    <tr key={`${row.ID ?? row.id ?? 'row'}-${idx}`}>
                      {columns.map((col) => (
                        <td key={`${col.key}-${idx}`} className="dev__td">{row[col.key] ?? '-'}</td>
                      ))}
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={columns.length} className="dev__td dev__td--empty">
                      {isLoading ? 'Loading...' : 'No records found.'}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}



