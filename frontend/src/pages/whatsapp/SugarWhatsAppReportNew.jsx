import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast, Toaster } from 'react-hot-toast';
import { masterService, dailyCaneEntryService } from '../../microservices/api.service';
import '../../styles/base.css';const __cx = (...vals) => vals.filter(Boolean).join(" ");

const num = (v) => Number(v || 0);
const txt = (v) => String(v || '');

const normalizeReportRow = (r = {}) => ({
  unit: txt(r.F_Short || r.F_Name || r.Unit || r.Cn_Unit),
  crushOn: num(r.Cn_Crush_OnDate),
  crushTo: num(r.Cn_Crush_ToDate),
  capOn: num(r.Cn_Cap_OnDate),
  capTo: num(r.Cn_Cap_ToDate),
  molOn: num(r.Cn_MolCatPurity_OnDate),
  molTo: num(r.Cn_MolCatPurity_ToDate),
  thisType: txt(r.Cn_Rec_ThisProdtype),
  recOn: num(r.Cn_Rec_ThisYear1),
  recTo: num(r.Cn_Rec_ThisYear2),
  prevType: txt(r.Prev_ProdType),
  prevRecOn: num(r.Prev_Rec_OnDate),
  prevRecTo: num(r.Prev_Rec_ToDate),
  lossOn: num(r.Cn_Loss_OnDate),
  lossTo: num(r.Cn_Loss_ToDate),
  bagOn: num(r.Cn_SugBagQtl_OnDate),
  bagTo: num(r.Cn_SugBagQtl_ToDate),
  caneBal: num(r.Cn_CnBalGateQtl) + num(r.Cn_CnBalCentreQtl),
  rainfall: num(r.Cn_Rainfall),
  stoppage: txt(r.Cn_Stoppage_OnDate),
  remark: txt(r.Cn_Remark),
  id: r.ID || r.Cn_Unit || `${txt(r.F_Short || r.F_Name || r.Unit)}-${txt(r.Cn_Rec_ThisProdtype)}-${txt(r.Cn_Stoppage_OnDate)}`
});

const Main_SugarWhatsAppReportNew = () => {
  const navigate = useNavigate();
  const [factories, setFactories] = useState([]);
  const [unitCode, setUnitCode] = useState('');
  const [reportDate, setReportDate] = useState('');
  const [reportData, setReportData] = useState([]);
  const [summary, setSummary] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    masterService.getUnits().then((d) => setFactories(Array.isArray(d) ? d : [])).catch(() => {});
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const dd = String(yesterday.getDate()).padStart(2, '0');
    const mm = String(yesterday.getMonth() + 1).padStart(2, '0');
    const yyyy = yesterday.getFullYear();
    setReportDate(`${dd}-${mm}-${yyyy}`);
  }, []);

  const handleSearch = async (e) => {
    if (e) e.preventDefault();
    setIsLoading(true);
    try {
      const [newRes, diffRes] = await Promise.all([
      dailyCaneEntryService.getNewReportData({ F_code: unitCode, C_date: reportDate }),
      dailyCaneEntryService.getSummaryReport({ F_code: unitCode, Cn_Date: reportDate })]
      );
      const rawNew = Array.isArray(newRes?.data) ? newRes.data : Array.isArray(newRes) ? newRes : [];
      const rawSummary = Array.isArray(diffRes?.rows) ? diffRes.rows : [];
      const raw = rawNew.length ? rawNew : rawSummary;
      setReportData((raw || []).map(normalizeReportRow));
      setSummary(diffRes && typeof diffRes === 'object' ? diffRes : null);
      if (raw.length > 0) toast.success('Report data loaded successfully.');else
      toast('No data for selected date. Showing blank report.');
    } catch {
      toast.error('Error fetching report data.');
      setReportData([]);
      setSummary(null);
    } finally {
      setIsLoading(false);
    }
  };

  const totals = reportData.reduce((acc, r) => {
    acc.crushOn += num(r.crushOn);
    acc.crushTo += num(r.crushTo);
    acc.capOn += num(r.capOn);
    acc.capTo += num(r.capTo);
    acc.recOn += num(r.recOn);
    acc.recTo += num(r.recTo);
    acc.prevRecOn += num(r.prevRecOn);
    acc.prevRecTo += num(r.prevRecTo);
    acc.lossOn += num(r.lossOn);
    acc.lossTo += num(r.lossTo);
    acc.bagOn += num(r.bagOn);
    acc.bagTo += num(r.bagTo);
    return acc;
  }, {
    crushOn: 0, crushTo: 0, capOn: 0, capTo: 0, recOn: 0, recTo: 0, prevRecOn: 0, prevRecTo: 0, lossOn: 0, lossTo: 0, bagOn: 0, bagTo: 0
  });

  const exportCsv = () => {
    if (!reportData.length) {
      toast.error('No data to export');
      return;
    }
    const headers = [
    'Unit', 'Crush_OnDate', 'Crush_ToDate', 'Cap_OnDate', 'Cap_ToDate',
    'Mol_OnDate', 'Mol_ToDate', 'Rec_OnDate', 'Rec_ToDate', 'Loss_OnDate', 'Loss_ToDate',
    'Bag_OnDate', 'Bag_ToDate', 'Cane_Balance', 'Rainfall', 'Stoppage', 'Remark'];

    const lines = [headers.join(',')];
    reportData.forEach((r) => {
      lines.push([
      txt(r.unit),
      num(r.crushOn), num(r.crushTo),
      num(r.capOn), num(r.capTo),
      num(r.molOn), num(r.molTo),
      num(r.recOn), num(r.recTo),
      num(r.lossOn), num(r.lossTo),
      num(r.bagOn), num(r.bagTo),
      num(r.caneBal),
      num(r.rainfall),
      `"${txt(r.stoppage).replace(/"/g, '""')}"`,
      `"${txt(r.remark).replace(/"/g, '""')}"`].
      join(','));
    });
    const blob = new Blob([lines.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `sugar-whatsapp-new-${reportDate || 'report'}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="p-[20px] bg-white min-h-[100vh] font-['Poppins', Arial, sans-serif]">
      <Toaster position="top-right" />

      <div className={__cx("page-card", "rounded-lg")}>
        <div className={__cx("page-card-header", "text-center text-[15px]")}>
          Sugar WhatsApp New Report
        </div>

        <div className={__cx("page-card-body", "bg-[#f5f5e8]")}>
          <div className={__cx("form-grid-4", "mb-[20px]")}>
            <div className="form-group">
              <label>Units</label>
              <select className="form-control" value={unitCode} onChange={(e) => setUnitCode(e.target.value)}>
                <option value="">All</option>
                {factories.map((f, idx) =>
                <option key={`${f.F_Code || f.f_Code || f.id || 'factory'}-${idx}`} value={f.F_Code || f.f_Code || f.id}>
                    {f.F_Name || f.name}
                  </option>
                )}
              </select>
            </div>
            <div className="form-group">
              <label>Date</label>
              <input
                type="text"
                className="form-control"
                value={reportDate}
                onChange={(e) => setReportDate(e.target.value)}
                placeholder="DD-MM-YYYY" />
              
            </div>
          </div>

          <div className={__cx("form-actions", "border-t-0 mt-[0] pt-[0]")}>
            <button className="btn btn-primary" onClick={handleSearch} disabled={isLoading}>
              {isLoading ? 'Searching...' : 'Search'}
            </button>
            <button className="btn btn-primary" onClick={exportCsv}>Export</button>
            <button className="btn btn-primary" onClick={() => window.print()}>Print</button>
            <button className="btn btn-primary" onClick={() => navigate(-1)}>Exit</button>
          </div>
        </div>
      </div>

      {reportData.length > 0 &&
      <div className={__cx("page-card", "mt-[10px]")}>
          <div className="p-[10px 12px 0 12px]">
            <div>Crush Report - {reportDate}</div>
            <div>Difference from last Season</div>
            <div className="flex gap-[40px] mb-[10px]">
              <div>Crush,Q {num(summary?.difference?.onDate)}</div>
              <div>{num(summary?.difference?.toDate) >= 0 ? '+' : ''}{num(summary?.difference?.toDate)}</div>
            </div>
          </div>

          <div className={__cx("table-wrapper", "max-h-[65vh] overflow-y-auto overflow-x-auto")}>
            <table className={__cx("data-table", "min-w-[1800px]")}>
              <thead>
                <tr>
                  <th rowSpan="3">Unit</th>
                  <th colSpan="2">Crushing, Qtls</th>
                  <th colSpan="2">Capacity Utilisation(%)</th>
                  <th colSpan="3">Molasses Category - Purity</th>
                  <th colSpan="4">Recovery% Cane</th>
                  <th colSpan="2">Losses% Cane</th>
                  <th colSpan="2">Sugar Bagging, Qtls</th>
                  <th rowSpan="3">Cane Balance Qtls</th>
                  <th rowSpan="3">Rainfall (Inches)</th>
                </tr>
                <tr>
                  <th colSpan="2">This Year</th>
                  <th colSpan="2">This Year</th>
                  <th colSpan="2">This Year</th>
                  <th rowSpan="2">TYPE</th>
                  <th colSpan="2">This Year</th>
                  <th colSpan="2">Last Year</th>
                  <th colSpan="2"></th>
                  <th colSpan="2"></th>
                </tr>
                <tr>
                  <th>OnDate</th><th>ToDate</th>
                  <th>OnDate</th><th>ToDate</th>
                  <th>OnDate</th><th>ToDate</th>
                  <th>OnDate</th><th>ToDate</th>
                  <th>OnDate</th><th>ToDate</th>
                  <th>OnDate</th><th>ToDate</th>
                  <th>OnDate</th><th>ToDate</th>
                </tr>
              </thead>
              <tbody>
                {reportData.map((r, idx) =>
              <tr key={`${r.id ?? 'row'}-${idx}`}>
                    <td>{txt(r.unit)}</td>
                    <td>{num(r.crushOn).toFixed(2)}</td>
                    <td>{num(r.crushTo).toFixed(2)}</td>
                    <td>{num(r.capOn).toFixed(2)}</td>
                    <td>{num(r.capTo).toFixed(2)}</td>
                    <td>{num(r.molOn).toFixed(2)}</td>
                    <td>{num(r.molTo).toFixed(2)}</td>
                    <td>{txt(r.thisType)}</td>
                    <td>{num(r.recOn).toFixed(2)}</td>
                    <td>{num(r.recTo).toFixed(2)}</td>
                    <td>{num(r.prevRecOn).toFixed(2)}</td>
                    <td>{num(r.prevRecTo).toFixed(2)}</td>
                    <td>{num(r.lossOn).toFixed(2)}</td>
                    <td>{num(r.lossTo).toFixed(2)}</td>
                    <td>{num(r.bagOn).toFixed(2)}</td>
                    <td>{num(r.bagTo).toFixed(2)}</td>
                    <td>{num(r.caneBal).toFixed(0)}</td>
                    <td>{num(r.rainfall).toFixed(2)}</td>
                  </tr>
              )}
                <tr>
                  <td>Total</td>
                  <td>{totals.crushOn.toFixed(2)}</td>
                  <td>{totals.crushTo.toFixed(2)}</td>
                  <td>{totals.capOn.toFixed(2)}</td>
                  <td>{totals.capTo.toFixed(2)}</td>
                  <td></td><td></td><td></td>
                  <td>{totals.recOn.toFixed(2)}</td>
                  <td>{totals.recTo.toFixed(2)}</td>
                  <td>{totals.prevRecOn.toFixed(2)}</td>
                  <td>{totals.prevRecTo.toFixed(2)}</td>
                  <td>{totals.lossOn.toFixed(2)}</td>
                  <td>{totals.lossTo.toFixed(2)}</td>
                  <td>{totals.bagOn.toFixed(2)}</td>
                  <td>{totals.bagTo.toFixed(2)}</td>
                  <td></td><td></td>
                </tr>
              </tbody>
            </table>

            <div className="mt-[14px] p-[0 8px 10px 8px]">
              <div>OnDate Stoppages (Reason Time in hour format)</div>
              {reportData.filter((r) => txt(r.stoppage).trim() && txt(r.stoppage).trim() !== '0').map((r, idx) =>
            <div key={`stp-${idx}`}>{txt(r.unit)} {txt(r.stoppage)}</div>
            )}
              <div className="mt-[10px]">Remark</div>
              {reportData.filter((r) => txt(r.remark).trim() && txt(r.remark).trim() !== '0').map((r, idx) =>
            <div key={`rmk-${idx}`}>{txt(r.unit)} {txt(r.remark)}</div>
            )}
            </div>
          </div>
        </div>
      }
    </div>);

};

export default Main_SugarWhatsAppReportNew;