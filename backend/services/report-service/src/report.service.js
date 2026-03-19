const reportRepository = require('./report.repository');
const newReportService = require('./services/new-report.service');

function normalizeDmyInput(raw) {
  const value = String(raw || '').trim();
  if (!value) return null;

  let d = null;
  if (/^\d{2}\/\d{2}\/\d{4}$/.test(value)) {
    const [dd, mm, yyyy] = value.split('/');
    d = new Date(Number(yyyy), Number(mm) - 1, Number(dd));
  } else if (/^\d{2}-\d{2}-\d{4}$/.test(value)) {
    const [dd, mm, yyyy] = value.split('-');
    d = new Date(Number(yyyy), Number(mm) - 1, Number(dd));
  } else if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    const [yyyy, mm, dd] = value.split('-');
    d = new Date(Number(yyyy), Number(mm) - 1, Number(dd));
  } else {
    const parsed = new Date(value);
    if (!Number.isNaN(parsed.getTime())) d = parsed;
  }

  if (!d || Number.isNaN(d.getTime())) return null;
  const dd = String(d.getDate()).padStart(2, '0');
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const yyyy = d.getFullYear();
  const dmy = `${dd}/${mm}/${yyyy}`;
  const yyyymmdd = `${yyyy}${mm}${dd}`;
  return { dmy, yyyymmdd };
}

function truncateDecimal(value, precision) {
  const step = Math.pow(10, precision);
  const tmp = Math.trunc(Number(value || 0) * step);
  return tmp / step;
}

function toYyyymmddFromDmy(raw) {
  const parsed = normalizeDmyInput(raw);
  return parsed ? parsed.yyyymmdd : '';
}

function addDaysToYyyymmdd(yyyymmdd, days) {
  const s = String(yyyymmdd || '');
  if (!/^\d{8}$/.test(s)) return '';
  const y = Number(s.slice(0, 4));
  const m = Number(s.slice(4, 6));
  const d = Number(s.slice(6, 8));
  const dt = new Date(y, m - 1, d);
  if (Number.isNaN(dt.getTime())) return '';
  dt.setDate(dt.getDate() + Number(days || 0));
  const yyyy = dt.getFullYear();
  const mm = String(dt.getMonth() + 1).padStart(2, '0');
  const dd = String(dt.getDate()).padStart(2, '0');
  return `${yyyy}${mm}${dd}`;
}

async function getDriageSummary(params = {}) {
  const season = params.season;
  const fcode = String(params.fcode || '').trim();
  const dateInfo = normalizeDmyInput(params.dateRaw);

  if (!fcode || fcode === '0' || fcode.toLowerCase() === 'all') {
    return { success: true, data: [], recordsets: [[]], message: 'Please select a Factory' };
  }
  if (!dateInfo) {
    return { success: true, data: [], recordsets: [[]], message: 'Invalid Date' };
  }

  const dt = dateInfo.yyyymmdd;
  const rowsRaw = await reportRepository.fetchDriageSummaryRows(fcode, dt, season).catch(() => []);
  if (!rowsRaw || rowsRaw.length === 0) {
    return { success: true, data: [], recordsets: [[]], message: 'No data found' };
  }

  const rows = [];
  let srno = 0;
  const fmt2 = (v) => truncateDecimal(v, 2).toFixed(2);

  for (const r of rowsRaw) {
    srno += 1;
    const centre = String(r.C_CODE || '').trim();
    const pqty = Number(r.PQTY || 0);
    const rqty = Number(r.RQTY || 0);
    let clbal = 0;

    const cb = await reportRepository.fetchClosingBalance(fcode, dt, centre, season).catch(() => []);
    if (cb && cb.length) clbal = Number(cb[0].CH_BALANCE || 0);

    let totrqty = rqty + clbal;
    totrqty = truncateDecimal(totrqty, 2);
    let drqty = totrqty - pqty;
    drqty = truncateDecimal(drqty, 2);
    let perc = 0;
    if (drqty !== 0 && pqty > 0) {
      perc = truncateDecimal((drqty / pqty) * 100, 2);
    }

    rows.push({
      F_code: Number(r.C_FACTORY || fcode),
      Date: dateInfo.dmy,
      SLNO: String(srno),
      C_CODE: centre,
      C_NAME: String(r.C_NAME || ''),
      PQTY: fmt2(pqty),
      RQTY: fmt2(rqty),
      CLBAL: fmt2(clbal),
      TOTREPT: fmt2(totrqty),
      DRQTY: fmt2(drqty),
      PERC: fmt2(perc)
    });
  }

  return { success: true, data: rows, recordsets: [rows] };
}

async function getDriageDetail(params = {}) {
  const season = params.season;
  const fcode = String(params.fcode || '').trim();
  const center = String(params.center || '').trim();
  const dateInfo = normalizeDmyInput(params.dateRaw);

  if (!fcode || fcode === '0') {
    return { success: true, data: [], recordsets: [[]], message: 'Please select a Factory' };
  }
  if (!center || center === '0') {
    return { success: true, data: [], recordsets: [[]], message: 'Please select a Center' };
  }
  if (!dateInfo) {
    return { success: true, data: [], recordsets: [[]], message: 'Invalid Date' };
  }

  const dt = dateInfo.yyyymmdd;
  const edt = addDaysToYyyymmdd(dt, -10);

  const beforeRows = await reportRepository.fetchDriageDetailBeforeRows(fcode, edt, center, season).catch(() => []);
  const rangeRows = await reportRepository.fetchDriageDetailRangeRows(fcode, edt, dt, center, season).catch(() => []);

  const rows = [];
  let srno = 0;
  const fmt2 = (v) => truncateDecimal(v, 2).toFixed(2);

  const buildRow = async (labelDate, pqty, rqty, dateForBal) => {
    const openDt = addDaysToYyyymmdd(toYyyymmddFromDmy(dateForBal), -1);
    let opbal = 0;
    if (openDt) {
      const ob = await reportRepository.fetchDriageDetailOpeningBalance(fcode, openDt, center, season).catch(() => []);
      if (ob && ob.length) opbal = Number(ob[0].CH_BALANCE || 0);
    }

    let clbal = 0;
    const closeDt = toYyyymmddFromDmy(dateForBal);
    if (closeDt) {
      const cb = await reportRepository.fetchDriageDetailClosingBalance(fcode, closeDt, center, season).catch(() => []);
      if (cb && cb.length) clbal = Number(cb[0].CH_BALANCE || 0);
    }

    let tot = Number(rqty || 0) + clbal - opbal;
    tot = truncateDecimal(tot, 2);
    let dr = tot - Number(pqty || 0);
    dr = truncateDecimal(dr, 2);
    let perc = 0;
    if (dr !== 0 && Number(pqty || 0) > 0) {
      perc = truncateDecimal((dr / Number(pqty || 0)) * 100, 2);
    }

    rows.push({
      SLNO: String(++srno),
      DATE: labelDate,
      OQty: fmt2(opbal),
      PQty: fmt2(pqty),
      RQty: fmt2(rqty),
      CLBal: fmt2(clbal),
      TRQty: fmt2(tot),
      DRQty: fmt2(dr),
      PER: fmt2(perc)
    });
  };

  for (const r of beforeRows || []) {
    await buildRow(`Up To ${r.DATE}`, Number(r.PQTY || 0), Number(r.RQTY || 0), r.DATE);
  }
  for (const r of rangeRows || []) {
    await buildRow(String(r.DATE || ''), Number(r.PQTY || 0), Number(r.RQTY || 0), r.DATE);
  }

  return { success: true, data: rows, recordsets: [rows] };
}

async function getDriageClerkSummary(params = {}) {
  const season = params.season;
  const fcode = String(params.fcode || '').trim();
  const dateInfo = normalizeDmyInput(params.dateRaw);

  if (!fcode || fcode === '0' || fcode.toLowerCase() === 'all') {
    return { success: true, data: [], recordsets: [[]], message: 'Please select a Factory' };
  }
  if (!dateInfo) {
    return { success: true, data: [], recordsets: [[]], message: 'Invalid Date' };
  }

  const dt = dateInfo.yyyymmdd;
  const clerkRows = await reportRepository.fetchDriageClerkSummaryRows(fcode, dt, season).catch(() => []);
  if (!clerkRows || clerkRows.length === 0) {
    return { success: true, data: [], recordsets: [[]], message: 'No data found' };
  }

  const rows = [];
  let srno = 0;
  const round2 = (v) => Number(Number(v || 0).toFixed(2));
  const fmt2 = (v) => truncateDecimal(v, 2).toFixed(2);

  for (const r of clerkRows) {
    srno += 1;
    const clerkCode = String(r.C_CODE || '').trim();
    const clerkName = String(r.C_NAME || '').trim();
    const pqty = round2(r.PQTY || 0);
    const rqty = round2(r.RQTY || 0);

    let obal = 0;
    let cbal = 0;

    const detailRows = await reportRepository.fetchDriageClerkDetailRows(fcode, dt, clerkCode, season).catch(() => []);
    if (detailRows && detailRows.length) {
      for (const d of detailRows) {
        const mfrom = String(d.MFrom || '').trim();
        const till = String(d.Till || '').trim();
        const centreCode = String(d.c_code || d.C_CODE || '').trim();

        const openDt = addDaysToYyyymmdd(toYyyymmddFromDmy(mfrom), -1);
        if (openDt) {
          const ob = await reportRepository.fetchDriageClerkOpeningBalance(fcode, openDt, centreCode, season).catch(() => []);
          if (ob && ob.length && fcode !== '51') {
            obal += Number(ob[0].CH_BALANCE || 0);
          }
        }

        const closeDt = toYyyymmddFromDmy(till);
        if (closeDt) {
          const cb = await reportRepository.fetchDriageClerkClosingBalance(fcode, closeDt, clerkCode, season).catch(() => []);
          if (cb && cb.length && fcode !== '51') {
            cbal += Number(cb[0].CH_BALANCE || 0);
          }
        }
      }
    }

    let totqty = (rqty - obal) + cbal;
    totqty = truncateDecimal(totqty, 2);
    let drqty = totqty - pqty;
    drqty = truncateDecimal(drqty, 2);
    let perc = 0;
    if (drqty !== 0 && pqty > 0) {
      perc = truncateDecimal((drqty / pqty) * 100, 2);
    }

    rows.push({
      SLNO: String(srno),
      U_code: clerkCode,
      U_Name: clerkName,
      CCode: clerkCode,
      CName: clerkName,
      OPBAL: fmt2(obal),
      PQTY: fmt2(pqty),
      RQTY: fmt2(rqty - obal),
      CLBAL: fmt2(cbal),
      TOTREPT: fmt2(totqty),
      DRQTY: fmt2(drqty),
      PERC: fmt2(perc),
      F_code: Number(fcode),
      Date: dateInfo.dmy
    });
  }

  return { success: true, data: rows, recordsets: [rows] };
}

async function getTargetActualMISReport(params = {}) {
  const season = params.season;
  const factoryName = params.factoryName || params.fcode || params.F_Code || '';
  const cpDate = params.dateRaw || params.Date || params.date || '';
  const data = await newReportService.getTargetActualMISDataMis(factoryName, cpDate, season);
  return { success: true, data, recordsets: [data] };
}

async function getTargetActualMISPeriodReport(params = {}) {
  const season = params.season;
  const factoryName = params.factoryName || params.fcode || params.F_Code || '';
  const dateFrom = params.dateFrom || params.fromDate || params.DateFrom || '';
  const dateTo = params.dateTo || params.toDate || params.DateTo || '';
  const data = await newReportService.getTargetActualMISData(factoryName, dateFrom, dateTo, season);
  return { success: true, data, recordsets: [data] };
}

module.exports = {
  getDriageSummary,
  getDriageDetail,
  getDriageClerkSummary,
  getTargetActualMISReport,
  getTargetActualMISPeriodReport
};
