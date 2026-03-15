import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast, Toaster } from 'react-hot-toast';
import { masterService, dailyCaneEntryService } from '../../microservices/api.service';
import '../../styles/base.css';const __cx = (...vals) => vals.filter(Boolean).join(" ");
import '../../styles/DailyCaneEntry.css';

function toDDMMYYYY(input) {
  const d = input instanceof Date ? input : new Date(input);
  if (Number.isNaN(d.getTime())) return '';
  const dd = String(d.getDate()).padStart(2, '0');
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const yyyy = d.getFullYear();
  return `${dd}-${mm}-${yyyy}`;
}

function toCsv(rows) {
  const headers = [
  'Unit', 'Date', 'Crushing Ondate', 'Crushing Todate', 'Recovery This Year1', 'Recovery This Year2',
  'Recovery This Prod Type', 'Estimate Recovery', 'MolCatPurity OnDate', 'MolCatPurity ToDate',
  'Loss % Ondate', 'Loss % Todate', 'Sugar Bagging Ondate', 'Sugar Bagging Todate',
  'Cane Balance Gate', 'Rainfall', 'Stoppage Ondate', 'UserID', 'Cane Balance Centre'];

  const esc = (v) => `"${String(v ?? '').replace(/"/g, '""')}"`;
  const lines = [headers.map(esc).join(',')];
  rows.forEach((r) => {
    lines.push([
    r.Unit, r.Cn_Date, r.Cn_Crush_OnDate, r.Cn_Crush_ToDate, r.Cn_Rec_ThisYear1, r.Cn_Rec_ThisYear2,
    r.Cn_Rec_ThisProdtype, r.Cn_Rec_Estimate, r.Cn_MolCatPurity_OnDate, r.Cn_MolCatPurity_ToDate,
    r.Cn_Loss_OnDate, r.Cn_Loss_ToDate, r.Cn_SugBagQtl_OnDate, r.Cn_SugBagQtl_ToDate,
    r.Cn_CnBalGateQtl, r.Cn_Rainfall, r.Cn_Stoppage_OnDate, r.Cn_UserID, r.Cn_CnBalCentreQtl].
    map(esc).join(','));
  });
  return lines.join('\n');
}

export default function DailyCaneEntry() {
  const navigate = useNavigate();
  const [units, setUnits] = useState([]);
  const [unitCode, setUnitCode] = useState('');
  const [fromDate, setFromDate] = useState(toDDMMYYYY(new Date()));
  const [toDate, setToDate] = useState(toDDMMYYYY(new Date()));
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    masterService.getUnits().
    then((d) => setUnits(Array.isArray(d) ? d : [])).
    catch(() => setUnits([]));
  }, []);

  const hasRows = rows.length > 0;

  const handleSearch = async () => {
    if (!fromDate || !toDate) {
      toast.error('From Date and To Date are required');
      return;
    }
    setLoading(true);
    try {
      const data = await dailyCaneEntryService.getList({
        factoryCode: unitCode,
        fromDate,
        toDate
      });
      const list = Array.isArray(data) ? data : [];
      setRows(list);
      if (!list.length) toast.error('No records found');
    } catch (error) {
      toast.error(error?.response?.data?.message || 'Failed to load daily cane entries');
      setRows([]);
    } finally {
      setLoading(false);
    }
  };

  const handleExport = () => {
    if (!hasRows) {
      toast.error('No data to export');
      return;
    }
    const blob = new Blob([toCsv(rows)], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `daily-cane-entry-${fromDate}-to-${toDate}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const visibleRows = useMemo(() => rows, [rows]);

  return (
    <div className="p-[20px] bg-[#f2f3f5] min-h-[100vh]">
      <Toaster position="top-right" />
      <div className={__cx("page-card", "rounded-[10px]")}>
        <div className={__cx("page-card-header", "text-center text-[34px]")}>Daily Cane Entry</div>
        <div className={__cx("page-card-body", "bg-[#f5f5e8]")}>
          <div className="grid gap-[16px]">
            <div className="form-group">
              <label>Units</label>
              <select className="form-control" value={unitCode} onChange={(e) => setUnitCode(e.target.value)}>
                <option value="">All</option>
                {units.map((u, i) =>
                <option key={`${u.F_Code ?? u.f_Code ?? i}`} value={u.F_Code ?? u.f_Code ?? ''}>
                    {u.F_Name || u.f_Name || `Unit ${u.F_Code ?? u.f_Code ?? i}`}
                  </option>
                )}
              </select>
            </div>
            <div className="form-group">
              <label>From Date</label>
              <input className="form-control" value={fromDate} onChange={(e) => setFromDate(e.target.value)} placeholder="Ex. dd/mm/yyyy" />
            </div>
            <div className="form-group">
              <label>To Date</label>
              <input className="form-control" value={toDate} onChange={(e) => setToDate(e.target.value)} placeholder="Ex. dd/mm/yyyy" />
            </div>
          </div>

          <div className="flex gap-[8px] m-[8px 0 16px 0]">
            <button className="btn btn-primary" onClick={handleSearch} disabled={loading}>{loading ? 'Searching...' : 'Search'}</button>
            <button className="btn btn-primary" onClick={() => navigate('/Main/SugarWhatsAppReport')}>Add New</button>
            <button className="btn btn-primary" onClick={handleExport}>Excel</button>
            <button className="btn btn-primary" onClick={() => navigate(-1)}>Exit</button>
          </div>

          <div className="overflow-x-auto border border-[#cfd8dc] rounded bg-white daily-cane-table-wrap">
            <table className={__cx("table table-bordered", "min-w-[1700px] mb-[0px]", "daily-cane-table")}>
              <thead className="bg-[#d9ead3] daily-cane-table-head">
                <tr>
                  <th>Units</th>
                  <th>Date</th>
                  <th>Crushing Ondate</th>
                  <th>Crushing Todate</th>
                  <th>Recovery This Year1</th>
                  <th>Recovery this Year2</th>
                  <th>Recovery This Prod Type</th>
                  <th>Estimate Recovery</th>
                  <th>MolCatPurity OnDate</th>
                  <th>MolCatPurity ToDate</th>
                  <th>Loss % Ondate</th>
                  <th>Loss % Todate</th>
                  <th>Sugar Bagging Ondate</th>
                  <th>Sugar Bagging Todate</th>
                  <th>Cane Balance Gate</th>
                  <th>Rainfall</th>
                  <th>Stoppage Ondate</th>
                  <th>UserID</th>
                  <th>Cane Balance Centre</th>
                </tr>
              </thead>
              <tbody>
                {!visibleRows.length ?
                <tr><td colSpan={19} className="text-center p-[18px]">{loading ? 'Loading...' : 'No data found'}</td></tr> :
                visibleRows.map((r, i) =>
                <tr key={`${r.ID ?? i}`}>
                    <td>{r.Unit || '-'}</td>
                    <td>
                      <button
                      type="button"
                      className="btn btn-link p-0"
                      onClick={() => navigate(`/Main/SugarWhatsAppReport?sid=${r.ID}`)}
                      title="Edit">
                      
                        {r.Cn_Date || '-'}
                      </button>
                    </td>
                    <td>{r.Cn_Crush_OnDate}</td>
                    <td>{r.Cn_Crush_ToDate}</td>
                    <td>{r.Cn_Rec_ThisYear1}</td>
                    <td>{r.Cn_Rec_ThisYear2}</td>
                    <td>{r.Cn_Rec_ThisProdtype}</td>
                    <td>{r.Cn_Rec_Estimate}</td>
                    <td>{r.Cn_MolCatPurity_OnDate}</td>
                    <td>{r.Cn_MolCatPurity_ToDate}</td>
                    <td>{r.Cn_Loss_OnDate}</td>
                    <td>{r.Cn_Loss_ToDate}</td>
                    <td>{r.Cn_SugBagQtl_OnDate}</td>
                    <td>{r.Cn_SugBagQtl_ToDate}</td>
                    <td>{r.Cn_CnBalGateQtl}</td>
                    <td>{r.Cn_Rainfall}</td>
                    <td className="max-w-[220px] overflow-hidden">{r.Cn_Stoppage_OnDate}</td>
                    <td>{r.Cn_UserID}</td>
                    <td>{r.Cn_CnBalCentreQtl}</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>);

}
