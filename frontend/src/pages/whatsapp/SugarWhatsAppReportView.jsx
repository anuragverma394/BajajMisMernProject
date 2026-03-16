import React, { useEffect, useMemo, useState } from 'react';
import { toast, Toaster } from 'react-hot-toast';
import { masterService, dailyCaneEntryService } from '../../microservices/api.service';
import './SugarWhatsAppReportView.css';
import { openPrintWindow } from '../../utils/print';

function formatDDMMYYYY(d) {
  const dd = String(d.getDate()).padStart(2, '0');
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const yyyy = d.getFullYear();
  return `${dd}-${mm}-${yyyy}`;
}

function num(v) {
  return Number(v || 0);
}

function plus(v) {
  const n = num(v);
  return n > 0 ? `+${n}` : `${n}`;
}

function pickDate(v) {
  const s = String(v || '').trim();
  if (!s) return '';
  if (/^\d{2}-\d{2}-\d{4}$/.test(s)) return s;
  if (/^\d{2}\/\d{2}\/\d{4}$/.test(s)) return s.replace(/\//g, '-');
  return s;
}

function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function buildReportData(summary, selectedDate) {
  const rows = Array.isArray(summary?.rows) ? summary.rows : [];
  return {
    rows,
    reportDate: summary?.reportDate || pickDate(rows[0]?.Cn_Date) || selectedDate,
    difference: summary?.difference || { onDate: 0, toDate: 0 },
    totals: {
      crushOn: num(summary?.totals?.crushOn ?? rows.reduce((a, r) => a + num(r.Cn_Crush_OnDate), 0)),
      crushTo: num(summary?.totals?.crushTo ?? rows.reduce((a, r) => a + num(r.Cn_Crush_ToDate), 0)),
      sugarBagOn: num(summary?.totals?.sugarBagOn ?? rows.reduce((a, r) => a + num(r.Cn_SugBagQtl_OnDate), 0)),
      sugarBagTo: num(summary?.totals?.sugarBagTo ?? rows.reduce((a, r) => a + num(r.Cn_SugBagQtl_ToDate), 0))
    }
  };
}

function buildPrintBody(report) {
  const rowsCrush = report.rows
    .map((r) => `<tr><td>${escapeHtml(r.Unit || '-')}</td><td>${num(r.Cn_Crush_OnDate)}</td><td>/${num(r.Cn_Crush_ToDate)}</td></tr>`)
    .join('');

  const rowsPurity = report.rows
    .map((r) => `<tr><td>${escapeHtml(r.Unit || '-')}</td><td>${escapeHtml(r.Cn_Rec_ThisProdtype ? `${r.Cn_Rec_ThisProdtype}-` : '')}${num(r.Cn_MolCatPurity_OnDate)} / ${num(r.Cn_MolCatPurity_ToDate)}</td><td>${escapeHtml(r.Prev_ProdType ? `${r.Prev_ProdType}-` : '')}${num(r.Prev_Mol_OnDate)} / ${num(r.Prev_Mol_ToDate)}</td></tr>`)
    .join('');

  const rowsRecovery = report.rows
    .map((r) => `<tr><td>${escapeHtml(r.Unit || '-')}</td><td>${escapeHtml(r.Cn_Rec_ThisProdtype ? `${r.Cn_Rec_ThisProdtype}-` : '')}${num(r.Cn_Rec_ThisYear1)} / ${num(r.Cn_Rec_ThisYear2)}</td><td>${escapeHtml(r.Prev_ProdType ? `${r.Prev_ProdType}-` : '')}${num(r.Prev_Rec_OnDate)} / ${num(r.Prev_Rec_ToDate)}</td></tr>`)
    .join('');

  const rowsLoss = report.rows
    .map((r) => `<tr><td>${escapeHtml(r.Unit || '-')}</td><td>${num(r.Cn_Loss_OnDate)}</td><td>/${num(r.Cn_Loss_ToDate)}</td></tr>`)
    .join('');

  const rowsBagging = report.rows
    .map((r) => `<tr><td>${escapeHtml(r.Unit || '-')}</td><td>${num(r.Cn_SugBagQtl_OnDate)}</td><td>/${num(r.Cn_SugBagQtl_ToDate)}</td></tr>`)
    .join('');

  const rowsCap = report.rows
    .map((r) => `<tr><td>${escapeHtml(r.Unit || '-')}</td><td>${num(r.Cn_Cap_OnDate)}</td><td>/${num(r.Cn_Cap_ToDate)}</td></tr>`)
    .join('');

  const rowsBalance = report.rows
    .filter((r) => num(r.Cn_CnBalGateQtl) > 0 || num(r.Cn_CnBalCentreQtl) > 0)
    .map((r) => `<tr><td>${escapeHtml(r.Unit || '-')}</td><td>${Math.round(num(r.Cn_CnBalGateQtl))} / ${Math.round(num(r.Cn_CnBalCentreQtl))}</td><td>${Math.round(num(r.Cn_CnBalGateQtl) + num(r.Cn_CnBalCentreQtl))}</td></tr>`)
    .join('');

  const rowsStop = report.rows
    .filter((r) => String(r.Cn_Stoppage_OnDate || '').trim() && String(r.Cn_Stoppage_OnDate).trim() !== '0')
    .map((r) => `<tr><td>${escapeHtml(r.Unit || '-')}</td><td>${escapeHtml(r.Cn_Stoppage_OnDate || '')}</td></tr>`)
    .join('');

  return `
        <div class="print-title">Crush Report - ${escapeHtml(report.reportDate)}</div>
        <div class="print-subtitle">Difference from last Season</div>
        <table class="print-table">
          <tr><th></th><th>OnDate</th><th>ToDate</th></tr>
          <tr><td class="print-bold">Crush,Q</td><td>${plus(report.difference.onDate)}</td><td>${plus(report.difference.toDate)}</td></tr>
        </table>

        <div class="print-subtitle">Crushing, Qtls</div>
        <table class="print-table">
          <tr><th>Unit</th><th>OnDate</th><th>/ ToDate</th></tr>
          ${rowsCrush}
          <tr><td class="print-bold">Grp</td><td class="print-bold">${report.totals.crushOn}</td><td class="print-bold">${report.totals.crushTo}</td></tr>
        </table>

        <div class="print-subtitle">Molasses Category - Purity</div>
        <table class="print-table">
          <tr><th>Unit</th><th>This Year</th><th>Last Year</th></tr>
          ${rowsPurity}
        </table>

        <div class="print-subtitle">Recovery% Cane</div>
        <table class="print-table">
          <tr><th>Unit</th><th>This Year OnDate / ToDate</th><th>Last Year OnDate / ToDate</th></tr>
          ${rowsRecovery}
        </table>

        <div class="print-subtitle">Losses% Cane</div>
        <table class="print-table">
          <tr><th>Unit</th><th>OnDate</th><th>/ ToDate</th></tr>
          ${rowsLoss}
        </table>

        <div class="print-subtitle">Sugar Bagging, Qtls</div>
        <table class="print-table">
          <tr><th>Unit</th><th>OnDate</th><th>/ ToDate</th></tr>
          ${rowsBagging}
          <tr><td class="print-bold">Grp</td><td class="print-bold">${report.totals.sugarBagOn}</td><td class="print-bold">${report.totals.sugarBagTo}</td></tr>
        </table>

        <div class="print-subtitle">Capacity Utilisation(%)</div>
        <table class="print-table">
          <tr><th>Unit</th><th>OnDate</th><th>/ ToDate</th></tr>
          ${rowsCap}
        </table>

        <div class="print-subtitle">Cane Balance Qtls</div>
        <table class="print-table">
          <tr><th>Unit</th><th>Gate/Centre</th><th>Total</th></tr>
          ${rowsBalance}
        </table>

        <div class="print-subtitle">OnDate Stoppages (Reason Time in hour format)</div>
        <table class="print-table">
          <tr><th>Unit</th><th>Remark</th></tr>
          ${rowsStop}
        </table>
  `;
}

function buildPrintHtml(report) {
  const body = buildPrintBody(report);
  return `
    <html>
      <head>
        <title>Sugar WhatsApp Report</title>
        <style>
          body { font-family: Arial, sans-serif; color: #111827; padding: 12px; }
          .print-title { font-weight: 700; margin-bottom: 8px; }
          .print-subtitle { font-weight: 700; margin: 10px 0 2px; }
          .print-table { border-collapse: collapse; margin: 4px 0 12px; }
          .print-table th, .print-table td { text-align: left; padding-right: 18px; vertical-align: top; }
          .print-bold { font-weight: 700; }
        </style>
      </head>
      <body>
        ${body}
      </body>
    </html>
  `;
}

function ReportTable({ title, columns, rows, footer }) {
  return (
    <section className="swrv-report__section">
      <h4 className="swrv-report__subtitle">{title}</h4>
      <table className="swrv-report__table">
        <thead>
          <tr>
            {columns.map((col) => (
              <th key={col}>{col}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows}
          {footer || null}
        </tbody>
      </table>
    </section>
  );
}

export default function SugarWhatsAppReportView() {
  const [units, setUnits] = useState([]);
  const [unitCode, setUnitCode] = useState('');
  const [date, setDate] = useState('');
  const [summary, setSummary] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    setDate(formatDDMMYYYY(new Date()));
    masterService.getUnits().then((d) => setUnits(Array.isArray(d) ? d : [])).catch(() => setUnits([]));
  }, []);

  const report = useMemo(() => buildReportData(summary, date), [summary, date]);

  const handleSearch = async () => {
    if (!date) {
      toast.error('Date is required');
      return;
    }
    try {
      setIsLoading(true);
      const data = await dailyCaneEntryService.getSummaryReport({ F_code: unitCode, Cn_Date: date });
      setSummary(data && typeof data === 'object' ? data : null);
      if (!Array.isArray(data?.rows) || !data.rows.length) toast.error('No data found');
    } catch (error) {
      toast.error(error?.response?.data?.message || 'Error fetching report');
      setSummary(null);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePrint = () => {
    if (!report.rows.length) {
      toast.error('No data to print');
      return;
    }
    openPrintWindow({
      title: "Sugar WhatsApp Report",
      subtitle: `Crush Report - ${report.reportDate}`,
      contentHtml: buildPrintBody(report)
    });
  };

  const handleExport = () => {
    if (!report.rows.length) {
      toast.error('No data to export');
      return;
    }
    const blob = new Blob([buildPrintHtml(report)], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `sugar-whatsapp-report-${date || 'report'}.html`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="swrv">
      <Toaster position="top-right" />
      <div className="swrv__card">
        <header className="swrv__header">
          <h2 className="swrv__title">Sugar WhatsApp Report</h2>
        </header>

        <div className="swrv__content">
          <div className="swrv__filters">
            <div className="swrv__field">
              <label className="swrv__label" htmlFor="swrv-unit">Units</label>
              <select id="swrv-unit" className="swrv__input" value={unitCode} onChange={(e) => setUnitCode(e.target.value)}>
                <option value="">All</option>
                {units.map((u, idx) => (
                  <option key={`${u.f_Code ?? u.F_Code ?? idx}`} value={u.f_Code ?? u.F_Code ?? ''}>
                    {u.F_Name || u.f_Name || u.name || `Unit ${u.f_Code ?? u.F_Code ?? idx}`}
                  </option>
                ))}
              </select>
            </div>
            <div className="swrv__field">
              <label className="swrv__label" htmlFor="swrv-date">Date</label>
              <input id="swrv-date" className="swrv__input" value={date} onChange={(e) => setDate(e.target.value)} placeholder="DD-MM-YYYY" />
            </div>
          </div>

          <div className="swrv__actions">
            <button className="swrv__btn swrv__btn--primary" onClick={handleSearch} disabled={isLoading}>
              {isLoading ? 'Searching...' : 'Search'}
            </button>
            <button className="swrv__btn swrv__btn--ghost" onClick={handleExport}>Export</button>
            <button className="swrv__btn swrv__btn--ghost" onClick={handlePrint}>Print</button>
          </div>

          <div className="swrv__report-panel">
            {!report.rows.length ? (
              <p className="swrv__empty">No report data found.</p>
            ) : (
              <div className="swrv-report">
                <h3 className="swrv-report__title">Crush Report - {report.reportDate}</h3>

                <ReportTable
                  title="Difference from last Season"
                  columns={['', 'OnDate', 'ToDate']}
                  rows={[
                    <tr key="diff">
                      <td className="swrv-report__bold">Crush,Q</td>
                      <td>{plus(report.difference.onDate)}</td>
                      <td>{plus(report.difference.toDate)}</td>
                    </tr>
                  ]}
                />

                <ReportTable
                  title="Crushing, Qtls"
                  columns={['Unit', 'OnDate', '/ ToDate']}
                  rows={report.rows.map((r, idx) => (
                    <tr key={`cr-${idx}`}><td>{r.Unit || '-'}</td><td>{num(r.Cn_Crush_OnDate)}</td><td>/{num(r.Cn_Crush_ToDate)}</td></tr>
                  ))}
                  footer={<tr><td className="swrv-report__bold">Grp</td><td className="swrv-report__bold">{report.totals.crushOn}</td><td className="swrv-report__bold">{report.totals.crushTo}</td></tr>}
                />

                <ReportTable
                  title="Molasses Category - Purity"
                  columns={['Unit', 'This Year', 'Last Year']}
                  rows={report.rows.map((r, idx) => (
                    <tr key={`mol-${idx}`}><td>{r.Unit || '-'}</td><td>{r.Cn_Rec_ThisProdtype ? `${r.Cn_Rec_ThisProdtype}-` : ''}{num(r.Cn_MolCatPurity_OnDate)} / {num(r.Cn_MolCatPurity_ToDate)}</td><td>{r.Prev_ProdType ? `${r.Prev_ProdType}-` : ''}{num(r.Prev_Mol_OnDate)} / {num(r.Prev_Mol_ToDate)}</td></tr>
                  ))}
                />

                <ReportTable
                  title="Recovery% Cane"
                  columns={['Unit', 'This Year OnDate / ToDate', 'Last Year OnDate / ToDate']}
                  rows={report.rows.map((r, idx) => (
                    <tr key={`rec-${idx}`}><td>{r.Unit || '-'}</td><td>{r.Cn_Rec_ThisProdtype ? `${r.Cn_Rec_ThisProdtype}-` : ''}{num(r.Cn_Rec_ThisYear1)} / {num(r.Cn_Rec_ThisYear2)}</td><td>{r.Prev_ProdType ? `${r.Prev_ProdType}-` : ''}{num(r.Prev_Rec_OnDate)} / {num(r.Prev_Rec_ToDate)}</td></tr>
                  ))}
                />

                <ReportTable
                  title="Losses% Cane"
                  columns={['Unit', 'OnDate', '/ ToDate']}
                  rows={report.rows.map((r, idx) => (
                    <tr key={`loss-${idx}`}><td>{r.Unit || '-'}</td><td>{num(r.Cn_Loss_OnDate)}</td><td>/{num(r.Cn_Loss_ToDate)}</td></tr>
                  ))}
                />

                <ReportTable
                  title="Sugar Bagging, Qtls"
                  columns={['Unit', 'OnDate', '/ ToDate']}
                  rows={report.rows.map((r, idx) => (
                    <tr key={`bag-${idx}`}><td>{r.Unit || '-'}</td><td>{num(r.Cn_SugBagQtl_OnDate)}</td><td>/{num(r.Cn_SugBagQtl_ToDate)}</td></tr>
                  ))}
                  footer={<tr><td className="swrv-report__bold">Grp</td><td className="swrv-report__bold">{report.totals.sugarBagOn}</td><td className="swrv-report__bold">{report.totals.sugarBagTo}</td></tr>}
                />

                <ReportTable
                  title="Capacity Utilisation(%)"
                  columns={['Unit', 'OnDate', '/ ToDate']}
                  rows={report.rows.map((r, idx) => (
                    <tr key={`cap-${idx}`}><td>{r.Unit || '-'}</td><td>{num(r.Cn_Cap_OnDate)}</td><td>/{num(r.Cn_Cap_ToDate)}</td></tr>
                  ))}
                />

                <ReportTable
                  title="Cane Balance Qtls"
                  columns={['Unit', 'Gate/Centre', 'Total']}
                  rows={report.rows.filter((r) => num(r.Cn_CnBalGateQtl) > 0 || num(r.Cn_CnBalCentreQtl) > 0).map((r, idx) => (
                    <tr key={`bal-${idx}`}><td>{r.Unit || '-'}</td><td>{Math.round(num(r.Cn_CnBalGateQtl))} / {Math.round(num(r.Cn_CnBalCentreQtl))}</td><td>{Math.round(num(r.Cn_CnBalGateQtl) + num(r.Cn_CnBalCentreQtl))}</td></tr>
                  ))}
                />

                {report.rows.some((r) => String(r.Cn_Stoppage_OnDate || '').trim() && String(r.Cn_Stoppage_OnDate).trim() !== '0') && (
                  <ReportTable
                    title="OnDate Stoppages (Reason Time in hour format)"
                    columns={['Unit', 'Remark']}
                    rows={report.rows.filter((r) => String(r.Cn_Stoppage_OnDate || '').trim() && String(r.Cn_Stoppage_OnDate).trim() !== '0').map((r, idx) => (
                      <tr key={`stp-${idx}`}><td>{r.Unit || '-'}</td><td>{String(r.Cn_Stoppage_OnDate || '')}</td></tr>
                    ))}
                  />
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}



