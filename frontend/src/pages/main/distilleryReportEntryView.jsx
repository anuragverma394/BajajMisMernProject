import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast, Toaster } from 'react-hot-toast';
import { masterService, distilleryEntryService } from '../../microservices/api.service';const __cx = (...vals) => vals.filter(Boolean).join(" ");const TEAL = '#1f9e8a';const BORDER = '#cfd8e3';const columns = [{ key: 'Unit', label: 'Units' }, { key: 'Dist_Date', label: 'Date' }, { key: 'Dist_RSStatus', label: 'Restart Status' }, { key: 'Dist_RSDate', label: 'Restart Date' },
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
{ key: 'Dist_UserID', label: 'UserID' }];


function formatDDMMYYYY(date) {
  const dd = String(date.getDate()).padStart(2, '0');
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const yyyy = date.getFullYear();
  return `${dd}-${mm}-${yyyy}`;
}

function normalizeDateToIso(value) {
  const raw = String(value || '').trim();
  if (!raw) return '';
  if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) return raw;
  const ddmmyyyy = raw.match(/^(\d{2})[-\/](\d{2})[-\/](\d{4})$/);
  if (ddmmyyyy) return `${ddmmyyyy[3]}-${ddmmyyyy[2]}-${ddmmyyyy[1]}`;
  const ymd = raw.match(/^(\d{4})\/(\d{2})\/(\d{2})$/);
  if (ymd) return `${ymd[1]}-${ymd[2]}-${ymd[3]}`;
  const dt = new Date(raw);
  if (!Number.isNaN(dt.getTime())) {
    const yyyy = dt.getFullYear();
    const mm = String(dt.getMonth() + 1).padStart(2, '0');
    const dd = String(dt.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  }
  return raw;
}

function getYesterday() {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return d;
}

export default function Main_distilleryReportEntryView() {
  const navigate = useNavigate();
  const [units, setUnits] = useState([]);
  const [unitCode, setUnitCode] = useState('');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [rows, setRows] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const yesterday = formatDDMMYYYY(getYesterday());
    setFromDate(yesterday);
    setToDate(yesterday);
    masterService.getDistilleryUnits().then((d) => setUnits(Array.isArray(d) ? d : [])).catch(() => setUnits([]));
  }, []);

  const handleSearch = async () => {
    const fallbackDate = formatDDMMYYYY(getYesterday());
    const safeFrom = (fromDate || '').trim() || fallbackDate;
    const safeTo = (toDate || '').trim() || safeFrom;
    if (!fromDate) setFromDate(safeFrom);
    if (!toDate) setToDate(safeTo);
    try {
      setIsLoading(true);
      const data = await distilleryEntryService.getList({
        factoryCode: unitCode,
        fromDate: normalizeDateToIso(safeFrom),
        toDate: normalizeDateToIso(safeTo)
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
    const body = rows.
    map((r) => columns.map((c) => `"${String(r[c.key] ?? '').replace(/"/g, '""')}"`).join(',')).
    join('\n');
    const csv = `data:text/csv;charset=utf-8,${header}\n${body}`;
    const link = document.createElement('a');
    link.href = encodeURI(csv);
    link.download = 'distillery-entry.csv';
    link.click();
  };

  return (
    <div className="py-[16px] px-[20px] bg-[#f3f4f6] min-h-[calc(100vh - 120px)]">
      <Toaster position="top-right" />
      <div className="border border-[#cfd8e3] rounded-xl bg-white overflow-hidden">
        <div className="bg-[#1f9e8a] text-white font-medium text-[34px] text-center py-[12px] px-[10px]">
          Distillery Entry
        </div>

        <div className="p-[22px 24px 26px] bg-[#f7f7f7]">
          <div className="grid gap-[14px] mb-[14px]">
            <div>
              <label className={labelStyle}>Units</label>
              <select value={unitCode} onChange={(e) => setUnitCode(e.target.value)} className={inputStyle}>
                <option value="">All</option>
                {units.map((u, idx) =>
                <option key={`${u.f_Code ?? u.id}-${idx}`} value={u.f_Code ?? u.id}>
                    {u.F_Name || u.name}
                  </option>
                )}
              </select>
            </div>
            <div>
              <label className={labelStyle}>From Date</label>
              <input value={fromDate} onChange={(e) => setFromDate(e.target.value)} placeholder="Ex. dd/mm/yyyy" className={inputStyle} />
            </div>
            <div>
              <label className={labelStyle}>To Date</label>
              <input value={toDate} onChange={(e) => setToDate(e.target.value)} placeholder="Ex. dd/mm/yyyy" className={inputStyle} />
            </div>
          </div>

          <div className="flex gap-[8px] mb-[16px]">
            <button onClick={handleSearch} disabled={isLoading} className={buttonStyle}>
              {isLoading ? 'Searching...' : 'Search'}
            </button>
            <button onClick={() => navigate('/Main/distilleryReportEntry')} className={buttonStyle}>Add New</button>
            <button onClick={() => navigate(-1)} className={buttonStyle}>Exit</button>
            <button onClick={exportCsv} className={buttonStyle}>Excel</button>
          </div>

          <div className="border border-[#9bc49a] bg-white overflow-x-auto">
            <table className="w-[100%] min-w-[2200px]">
              <thead>
                <tr className="bg-[#c6d8c2]">
                  {columns.map((col) =>
                  <th key={col.key} className={thStyle}>{col.label}</th>
                  )}
                </tr>
              </thead>
              <tbody>
                {rows.length ?
                rows.map((row, idx) =>
                <tr key={`${row.ID ?? row.id ?? 'row'}-${idx}`}>
                      {columns.map((col) =>
                  <td key={`${col.key}-${idx}`} className={tdStyle}>{row[col.key] ?? '-'}</td>
                  )}
                    </tr>
                ) :

                <tr>
                    <td colSpan={columns.length} className={__cx(tdStyle, "text-center text-[#6b7280]")}>
                      {isLoading ? 'Loading...' : 'No records found.'}
                    </td>
                  </tr>
                }
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>);

}

const labelStyle = "block text-[13px] text-[#111827] mb-[6px] font-semibold";







const inputStyle = "w-[100%] h-[44px] border-[2px] border-[#c7d2e5] rounded-md py-[0] px-[14px] text-[13px] text-[#374151]  bg-white";











const buttonStyle = "bg-[#1f9e8a] text-white border-0 rounded-md py-[10px] px-[16px] text-[13px] cursor-pointer";

const thStyle = "text-left text-[#1b74e4] font-bold text-[13px] py-[14px] px-[14px] ";








const tdStyle = "text-[#1f2937] text-[13px] py-[12px] px-[14px] border-t border-t-[#d1fae5] ";
