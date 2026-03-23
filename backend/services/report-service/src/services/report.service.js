const reportRepository = require('../repositories/report.repository');
const newReportService = require('./new-report.service');

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

function toYmdFromDmy(raw) {
  const parsed = normalizeDmyInput(raw);
  if (!parsed) return '';
  const y = parsed.yyyymmdd.slice(0, 4);
  const m = parsed.yyyymmdd.slice(4, 6);
  const d = parsed.yyyymmdd.slice(6, 8);
  return `${y}-${m}-${d}`;
}

function addDaysToDmy(dmy, days) {
  const parsed = normalizeDmyInput(dmy);
  if (!parsed) return '';
  const yyyymmdd = addDaysToYyyymmdd(parsed.yyyymmdd, days);
  if (!yyyymmdd) return '';
  return `${yyyymmdd.slice(6, 8)}/${yyyymmdd.slice(4, 6)}/${yyyymmdd.slice(0, 4)}`;
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

async function getIndentFailSummaryNew(params = {}) {
  const season = params.season;
  const fcode = String(params.fcode || params.F_code || '').trim();
  const dateInfo = normalizeDmyInput(params.dateRaw);

  if (!fcode || fcode === '0' || fcode.toLowerCase() === 'all') {
    return { success: true, data: [], message: 'Please Select Factory' };
  }
  if (!dateInfo) {
    return { success: true, data: [], message: 'Invalid Date' };
  }

  const dtStart = addDaysToYyyymmdd(dateInfo.yyyymmdd, -5);
  const dtEnd = addDaysToYyyymmdd(dateInfo.yyyymmdd, 5);

  const rows = await reportRepository.fetchIndentFailSummaryNewRows(fcode, dtStart, dtEnd, season).catch(() => []);
  const list = [];

  for (const r of rows || []) {
    const rowDate = String(r.IS_IS_DT || '').trim();

    let prev = 0;
    let cur = 0;
    const pb = await reportRepository.fetchIndentFailPBal(
      fcode,
      toYmdFromDmy(addDaysToDmy(dateInfo.dmy, -1)),
      toYmdFromDmy(dateInfo.dmy),
      toYyyymmddFromDmy(rowDate),
      season
    ).catch(() => []);
    if (pb && pb.length) {
      prev = truncateDecimal(Number(pb[0].pdqty || 0), 2);
      cur = truncateDecimal(Number(pb[0].cuqty || 0), 2);
    }

    let turnUp = 0;
    const tw = await reportRepository.fetchIndentFailTodayWeight(
      fcode,
      toYmdFromDmy(addDaysToDmy(dateInfo.dmy, -1)),
      toYmdFromDmy(rowDate),
      season
    ).catch(() => []);
    if (tw && tw.length) {
      turnUp = Math.round(Number(tw[0].Qty || 0));
    }

    list.push({
      ERINDQTY: String(r.ERINDQTY ?? ''),
      IS_FACTORY: String(r.IS_FACTORY ?? ''),
      IS_IS_DT: String(r.IS_IS_DT ?? ''),
      EINDWT: String(r.EINDWT ?? ''),
      EACTWT: String(r.EACTWT ?? ''),
      RunningBal: String(r.RunningBal ?? ''),
      TdWtIndent: String(turnUp),
      TdAvgPrec: '0',
      PdBal: prev,
      CdBal: cur
    });
  }

  const Pdate = addDaysToDmy(dateInfo.dmy, -1);
  const Cdate = dateInfo.dmy;

  return { success: true, data: { IFSList: list, Pdate, Cdate } };
}

async function getIndentFailDetails(params = {}) {
  const season = params.season;
  const fcode = String(params.fcode || params.F_code || '').trim();
  const dateInfo = normalizeDmyInput(params.dateRaw);

  if (!fcode || fcode === '0' || fcode.toLowerCase() === 'all') {
    return { success: true, data: [], message: 'Please Select Factory' };
  }
  if (!dateInfo) {
    return { success: true, data: [], message: 'Invalid Date' };
  }

  const dt = dateInfo.yyyymmdd;
  const rows = await reportRepository.fetchIndentFailDetailRows(fcode, dt, season).catch(() => []);
  const list = [];

  for (const r of rows || []) {
    const center = String(r.IS_CNT_CD || '').trim();
    let prevBal = 0;
    const backRows = await reportRepository.fetchIndentFailDetail2DayBack(fcode, dt, center, season).catch(() => []);
    if (backRows && backRows.length) {
      for (const b of backRows) {
        prevBal += Number(b.BAL || 0);
      }
      prevBal = truncateDecimal(prevBal, 2);
    }
    const totalBal = Number(r.BALTOTINDQTY || 0) + prevBal;

    list.push({
      ERINDQTY: String(r.ERINDQTY ?? ''),
      IS_CNT_CD: String(r.IS_CNT_CD ?? ''),
      C_NAME: String(r.C_NAME ?? ''),
      IS_FACTORY: String(r.IS_FACTORY ?? ''),
      EINDWT: String(r.EINDWT ?? ''),
      EACTWT: String(r.EACTWT ?? ''),
      OTINDQTY: String(r.OTINDQTY ?? ''),
      OTACTWT: String(r.OTACTWT ?? ''),
      OTINDWT: String(r.OTINDWT ?? ''),
      TOTINDQTY: String(r.TOTINDQTY ?? ''),
      TOTINDWT: String(r.TOTINDWT ?? ''),
      TOTACTWT: String(r.TOTACTWT ?? ''),
      BALTOTINDQTY: String(r.BALTOTINDQTY ?? ''),
      TOTBALIND: totalBal,
      PIPBALIND: prevBal
    });
  }

  return { success: true, data: list };
}

async function getEffectedCaneAreaReport(req = {}) {
  const p = { ...(req.query || {}), ...(req.body || {}) };
  const season = req.user?.season || p.season;
  const fcode = String(p.F_code || p.F_Code || p.fact || p.factoryCode || '').trim();
  const caneArea = String(p.CaneArea || p.caneArea || '1').trim();
  const stateDropdown = String(p.stateDropdown || p.state || '').trim();

  if (!fcode || fcode === '0' || fcode.toLowerCase() === 'all') {
    return { centres: [], societies: [] };
  }

  const useAmity = caneArea === '2';
  const rows = await reportRepository.fetchEffectedCaneAreaReport(fcode, stateDropdown, season, useAmity).catch(() => []);
  const safeRows = Array.isArray(rows) ? rows : [];
  let loggedMissingNoOfMember = false;
  for (let i = 0; i < safeRows.length; i += 1) {
    const r = safeRows[i] || {};
    r.V_Code = r.V_Code ?? r.V_CODE ?? r.v_code ?? r.VCode ?? '';
    r.V_Name = r.V_Name || r.V_NAME || r.VNAME || r.v_name || r.VName || r.VILLAGE_NAME || r.VILLAGENAME || r.VILL_NAME || r.VILLNAME || r.VILLAGE || r.VILL_NM || r.VILL_NM1 || r.V_NM || r.VNAME1 || '';
    const noOfMemberRaw =
      r.NoOfMember || r.NoofMember || r.NO_OF_MEMBER || r.NO_OF_MEM || r.NOOFMEMBER || r.NOOFMEM || r.NOOFMEM1 || r.noofmember ||
      r.No_of_member || r.MEMBERCOUNT || r.MEMBERS || r.NOMEMBER || r.NO_MEMBER || r.MEMBER_COUNT || r.MEMCOUNT ||
      r['No of Member'] || r['No Of Member'] || r['No_Of_Member'] || r['NoOfMember'] || r['NOOFMEMBER'] || 0;
    r.NoOfMember = Number(noOfMemberRaw) || 0;
    if (!loggedMissingNoOfMember && r.NoOfMember === 0) {
      console.warn('[EffectedCaneAreaReport] NoOfMember missing. Available keys:', Object.keys(r));
      loggedMissingNoOfMember = true;
    }
    r.BondedMember = r.BondedMember ?? r.BONDEDMEMBER ?? r.bondedmember ?? 0;
    r.CLA = r.CLA ?? r.Cla ?? r.cla ?? 0;
    r.TotalCaneArea = r.TotalCaneArea ?? r.TOTALCANEAREA ?? r.totalcanearea ?? 0;
    r.MoreThanCLA = r.MoreThanCLA ?? r.MORETHANCLA ?? r.morethancla ?? 0;
    r.ZeroCLA = r.ZeroCLA ?? r.ZEROCLA ?? r.zerocla ?? 0;
    r.NonMem = r.NonMem ?? r.NONMEM ?? r.nonmem ?? 0;
    r.LockGrower = r.LockGrower ?? r.LOCKGROWER ?? r.lockgrower ?? 0;
    r.Total = r.Total ?? r.TOTAL ?? r.total ?? 0;
    r.EffectedCaneArea = r.EffectedCaneArea ?? r.EFFECTEDCANEAREA ?? r.effectedcanearea ?? 0;
    r.Percent = r.Percent ?? r.PERCENT ?? r.percent ?? 0;
    r.IsReadyForAmty = r.IsReadyForAmty ?? r.ISREADYFORAMTY ?? r.isreadyforamty ?? 0;
    safeRows[i] = r;
  }
  return safeRows;
}

async function getCentreCode(req = {}) {
  const p = { ...(req.query || {}), ...(req.body || {}) };
  const season = req.user?.season || p.season;
  const fcode = String(p.F_code || p.F_Code || p.FACT || p.fact || p.factoryCode || '').trim();
  const fromRaw = String(p.FormDate || p.FromDate || p.Fdate || p.fromDate || p.from || '').trim();
  const toRaw = String(p.ToDate || p.Todate || p.toDate || p.to || '').trim();

  if (!fcode || fcode === '0' || fcode.toLowerCase() === 'all') {
    return [];
  }

  const fromDate = toYmdFromDmy(fromRaw);
  const toDate = toYmdFromDmy(toRaw);
  if (!fromDate || !toDate) {
    return { centres: [], societies: [] };
  }

  const rawRows = await reportRepository.fetchCentreCodeSummary(fcode, fromDate, toDate, season).catch(() => []);
  const rows = Array.isArray(rawRows) ? rawRows : [];
  if (!rows.length) {
    return { centres: [], societies: [] };
  }

  const centreCodes = Array.from(new Set(rows.map((r) => String(r.c_code || r.C_CODE || '').trim()).filter(Boolean)));
  const rateRows = await reportRepository.fetchCentreRates(fcode, centreCodes, season).catch(() => []);
  const rateMap = new Map();
  (rateRows || []).forEach((r) => {
    const code = String(r.C_CODE || r.c_code || '').trim();
    if (!code) return;
    const cnSap = Number(r.CN_SAP || 0);
    const cnErPrem = Number(r.CN_ERPREM || 0);
    const cnRjDiff = Number(r.CN_RJDIFF || 0);
    rateMap.set(code, {
      general: cnSap,
      early: cnSap + cnErPrem,
      rejected: cnSap - cnRjDiff
    });
  });

  const centreOrder = [];
  const centreMap = new Map();
  rows.forEach((r) => {
    const centreCode = String(r.c_code || r.C_CODE || '').trim();
    if (!centreCode) return;
    if (!centreMap.has(centreCode)) {
      const centreName = String(r.c_name || r.C_NAME || '').trim();
      const distance = Number(r.c_Distance || r.C_DISTANCE || 0);
      const rates = rateMap.get(centreCode) || { general: 0, early: 0, rejected: 0 };
      centreMap.set(centreCode, {
        CentreCode: centreCode,
        CentreName: centreName,
        c_Distance: distance,
        Early_Rate: Number(rates.early || 0),
        Early_Value: 0,
        Early_Amount: 0,
        Genral_Rate: Number(rates.general || 0),
        Genral_Value: 0,
        Genral_Amount: 0,
        Rejected_Rate: Number(rates.rejected || 0),
        Rejected_Value: 0,
        Rejected_Amount: 0,
        BurntCane_Value: 0,
        BurntCane_Amount: 0
      });
      centreOrder.push(centreCode);
    }

    const target = centreMap.get(centreCode);
    const category = String(r.name || r.NAME || '').trim().toLowerCase();
    const weight = Number(r.Weight || r.WEIGHT || 0);
    const amount = Number(r.Amount || r.AMOUNT || 0);

    if (category === 'genral' || category === 'general') {
      target.Genral_Value = weight;
      target.Genral_Amount = amount;
    } else if (category === 'burnt cane' || category === 'burnt') {
      target.BurntCane_Value = weight;
      target.BurntCane_Amount = amount;
    } else if (category === 'early') {
      target.Early_Value = weight;
      target.Early_Amount = amount;
    } else if (category === 'rejected') {
      target.Rejected_Value = weight;
      target.Rejected_Amount = amount;
    }
  });

  const output = centreOrder.map((code) => centreMap.get(code));

  const fcodeSingle = String(fcode).split(',').map((v) => v.trim()).filter(Boolean)[0] || fcode;
  const societyRowsRaw = await reportRepository.fetchSocietyReport(fcodeSingle, fromDate, toDate, season).catch(() => []);
  const societyRows = Array.isArray(societyRowsRaw) ? societyRowsRaw : [];
  if (societyRows.length) {
    const sumFields = (rows) => rows.reduce((acc, r) => {
      acc.Weight += Number(r.Weight || 0);
      acc.Amount += Number(r.Amount || 0);
      acc.Early_Weight += Number(r.Early_Weight || 0);
      acc.Early_Amount += Number(r.Early_Amount || 0);
      acc.General_Weight += Number(r.General_Weight || 0);
      acc.General_Amount += Number(r.General_Amount || 0);
      acc.Rejected_Weight += Number(r.Rejected_Weight || 0);
      acc.Rejected_Amount += Number(r.Rejected_Amount || 0);
      acc.Burnt_Weight += Number(r.Burnt_Weight || 0);
      acc.Burnt_Amount += Number(r.Burnt_Amount || 0);
      return acc;
    }, {
      Weight: 0, Amount: 0,
      Early_Weight: 0, Early_Amount: 0,
      General_Weight: 0, General_Amount: 0,
      Rejected_Weight: 0, Rejected_Amount: 0,
      Burnt_Weight: 0, Burnt_Amount: 0
    });

    const gateTotals = sumFields(societyRows.filter((r) => String(r.Type || '').toLowerCase() === 'gate'));
    const centreTotals = sumFields(societyRows.filter((r) => String(r.Type || '').toLowerCase() === 'centre'));
    const grandTotals = sumFields([
      gateTotals,
      centreTotals
    ]);

    societyRows.push({
      so_code: '',
      SO_Name: 'Total Gate',
      Type: 'Total Gate',
      ...gateTotals
    });
    societyRows.push({
      so_code: '',
      SO_Name: 'Total Centre',
      Type: 'Total Centre',
      ...centreTotals
    });
    societyRows.push({
      so_code: '',
      SO_Name: 'Grand Total',
      Type: 'Grand Total',
      ...grandTotals
    });
  }
  return { centres: output, societies: societyRows };
}
module.exports = {
  getDriageSummary,
  getDriageDetail,
  getDriageClerkSummary,
  getTargetActualMISReport,
  getTargetActualMISPeriodReport,
  getIndentFailSummaryNew,
  getIndentFailDetails,
  getEffectedCaneAreaReport,
  getCentreCode
};
