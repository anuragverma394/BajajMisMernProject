import React, { useEffect, useMemo, useState } from 'react';
import { toast, Toaster } from 'react-hot-toast';
import { masterService, dailyCaneEntryService } from '../../microservices/api.service';
import '../../styles/base.css';

const num = (v) => Number(v || 0);
const txt = (v) => String(v ?? '');

function formatDDMMYYYY(d) {
  const dd = String(d.getDate()).padStart(2, '0');
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const yyyy = d.getFullYear();
  return `${dd}-${mm}-${yyyy}`;
}

const Main_SugarWhatsAppReportsData = () => {
  const [units, setUnits] = useState([]);
  const [unitCode, setUnitCode] = useState('');
  const [reportDate, setReportDate] = useState('');
  const [rows, setRows] = useState([]);
  const [summary, setSummary] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    masterService.getUnits().then((d) => setUnits(Array.isArray(d) ? d : [])).catch(() => setUnits([]));
    const d = new Date();
    d.setDate(d.getDate() - 1);
    setReportDate(formatDDMMYYYY(d));
  }, []);

  const totals = useMemo(() => {
    const data = Array.isArray(rows) ? rows : [];
    return data.reduce((acc, r) => {
      acc.crushOn += num(r.Cn_Crush_OnDate);
      acc.crushTo += num(r.Cn_Crush_ToDate);
      acc.bagOn += num(r.Cn_SugBagQtl_OnDate);
      acc.bagTo += num(r.Cn_SugBagQtl_ToDate);
      acc.capOn += num(r.Cn_Cap_OnDate);
      acc.capTo += num(r.Cn_Cap_ToDate);
      return acc;
    }, { crushOn: 0, crushTo: 0, bagOn: 0, bagTo: 0, capOn: 0, capTo: 0 });
  }, [rows]);

  const handleSearch = async () => {
    if (!reportDate) {
      toast.error('Date is required');
      return;
    }
    setIsLoading(true);
    try {
      const data = await dailyCaneEntryService.getNewReportData({ F_code: unitCode, C_date: reportDate });
      const reportRows = Array.isArray(data?.data) ? data.data : Array.isArray(data) ? data : [];
      setRows(reportRows);
      setSummary(data?.summary || null);
      if (!reportRows.length) toast.error('No data found');
    } catch (error) {
      toast.error(error?.response?.data?.message || 'Failed to fetch report');
      setRows([]);
      setSummary(null);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="p-[20px] bg-white min-h-[100vh] font-['Poppins', Arial, sans-serif]">
      <Toaster position="top-right" />

      <div className="page-card rounded-lg">
        <div className="page-card-header text-left text-[15px]">
          Sugar WhatsApp Reports Data
        </div>
        <div className="page-card-body bg-[#f5f5e8]">
          <div className="form-grid-4 mb-[20px]">
            <div className="form-group">
              <label>Units</label>
              <select className="form-control" value={unitCode} onChange={(e) => setUnitCode(e.target.value)}>
                <option value="">All</option>
                {units.map((u, idx) => (
                  <option key={`${u.F_Code || u.f_Code || u.id || idx}`} value={u.F_Code || u.f_Code || u.id || ''}>
                    {u.F_Name || u.f_Name || u.name || `Unit ${u.F_Code || u.f_Code || idx}`}
                  </option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label>Date</label>
              <input
                type="text"
                className="form-control"
                value={reportDate}
                onChange={(e) => setReportDate(e.target.value)}
                placeholder="DD-MM-YYYY"
              />
            </div>
          </div>

          <div className="form-actions border-t-0 mt-[0] pt-[0] justify-start">
            <button className="btn btn-primary" onClick={handleSearch} disabled={isLoading}>
              {isLoading ? 'Searching...' : 'Search'}
            </button>
          </div>
        </div>
      </div>

      <div className="page-card mt-[10px]">
        <div className="page-card-body">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-[12px] mb-[16px]">
            <div className="border border-[#e2e8f0] rounded p-[12px]">
              <div className="text-[12px] text-slate-500">Report Date</div>
              <div className="text-[14px] font-semibold">{summary?.reportDate || reportDate}</div>
            </div>
            <div className="border border-[#e2e8f0] rounded p-[12px]">
              <div className="text-[12px] text-slate-500">Crush Difference</div>
              <div className="text-[14px] font-semibold">
                OnDate: {num(summary?.difference?.onDate)} | ToDate: {num(summary?.difference?.toDate)}
              </div>
            </div>
            <div className="border border-[#e2e8f0] rounded p-[12px]">
              <div className="text-[12px] text-slate-500">Totals</div>
              <div className="text-[14px] font-semibold">
                Crush: {totals.crushOn}/{totals.crushTo} | Bag: {totals.bagOn}/{totals.bagTo}
              </div>
            </div>
          </div>

          <div className="table-wrapper max-h-[65vh] overflow-y-auto">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Unit</th>
                  <th>Crush (On/To)</th>
                  <th>Mol Purity (On/To)</th>
                  <th>Recovery (On/To)</th>
                  <th>Loss (On/To)</th>
                  <th>Sugar Bag (On/To)</th>
                  <th>Capacity (On/To)</th>
                  <th>Cane Balance (Gate/Centre)</th>
                  <th>Rainfall</th>
                  <th>Stoppage</th>
                  <th>Remark</th>
                </tr>
              </thead>
              <tbody>
                {rows.length ? (
                  rows.map((r, idx) => (
                    <tr key={`${r.Cn_Unit || r.Unit || idx}`}>
                      <td className="font-bold">{txt(r.Unit || r.F_Name || r.Cn_Unit)}</td>
                      <td>{num(r.Cn_Crush_OnDate)} / {num(r.Cn_Crush_ToDate)}</td>
                      <td>{num(r.Cn_MolCatPurity_OnDate)} / {num(r.Cn_MolCatPurity_ToDate)}</td>
                      <td>{num(r.Cn_Rec_ThisYear1)} / {num(r.Cn_Rec_ThisYear2)}</td>
                      <td>{num(r.Cn_Loss_OnDate)} / {num(r.Cn_Loss_ToDate)}</td>
                      <td>{num(r.Cn_SugBagQtl_OnDate)} / {num(r.Cn_SugBagQtl_ToDate)}</td>
                      <td>{num(r.Cn_Cap_OnDate)} / {num(r.Cn_Cap_ToDate)}</td>
                      <td>{num(r.Cn_CnBalGateQtl)} / {num(r.Cn_CnBalCentreQtl)}</td>
                      <td>{num(r.Cn_Rainfall)}</td>
                      <td>{txt(r.Cn_Stoppage_OnDate)}</td>
                      <td>{txt(r.Cn_Remark)}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={11} className="text-center font-bold">No Record Available</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Main_SugarWhatsAppReportsData;
