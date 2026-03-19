const repository = require('../repositories/report');

function normalizeDateInput(raw) {
  const value = String(raw || '').trim();
  if (!value) return '';

  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    const [yyyy, mm, dd] = value.split('-');
    return `${dd}/${mm}/${yyyy}`;
  }

  if (/^\d{2}\/\d{2}\/\d{4}$/.test(value)) {
    return value;
  }

  if (/^\d{2}-\d{2}-\d{4}$/.test(value)) {
    return value.replace(/-/g, '/');
  }

  const dt = new Date(value);
  if (Number.isNaN(dt.getTime())) return '';
  const dd = String(dt.getDate()).padStart(2, '0');
  const mm = String(dt.getMonth() + 1).padStart(2, '0');
  const yyyy = dt.getFullYear();
  return `${dd}/${mm}/${yyyy}`;
}

function toSqlDate(raw) {
  const value = normalizeDateInput(raw);
  if (!value) return '';
  const [dd, mm, yyyy] = value.split('/');
  return `${yyyy}-${mm}-${dd}`;
}

function getSeason(req) {
  return req.user?.season || req.query?.season || req.body?.season || process.env.DEFAULT_SEASON || '2526';
}

function getFactoryCode(req, ...keys) {
  for (const key of keys) {
    const value = req.query?.[key] ?? req.body?.[key];
    if (value !== undefined && value !== null && String(value).trim() !== '' && String(value).trim() !== 'All') {
      return String(value).trim();
    }
  }
  return '';
}

async function safeProcedure(name, params, season) {
  try {
    return await repository.runProcedure(name, params, season);
  } catch (error) {
    const message = String(error?.message || '');
    if (message.toLowerCase().includes('could not find stored procedure')) {
      return [];
    }
    throw error;
  }
}

async function getEffectedCaneAreaReport(req) {
  const season = getSeason(req);
  const fCode = getFactoryCode(req, 'F_code', 'factoryCode', 'F_Code');
  const caneArea = String(req.query.CaneArea || req.body?.CaneArea || '1').trim();
  const stateDropdown = String(req.query.stateDropdown || req.body?.stateDropdown || '').trim();

  const procedure = caneArea === '2' ? 'mis_rptGASHTIAmity1' : 'mis_rpt1';
  const rows = await safeProcedure(procedure, { fact: fCode, state: stateDropdown }, season);
  return rows.map((row) => ({
    F_code: Number(row.F_code || row.f_code || 0),
    V_Code: Number(row.V_Code || row.v_code || 0),
    V_Name: String(row.V_Name || row.v_name || ''),
    CaneArea: Number(row.CaneArea || row.caneArea || 0),
    EffectedArea: Number(row.EffectedCaneArea || row.EffectedArea || row.effectedArea || 0),
    EffectedCaneArea: Number(row.EffectedCaneArea || row.EffectedArea || row.effectedArea || 0),
    Percent: Number(row.Percent || row.percent || 0),
    Remarks: Number(row.EffectedCaneArea || row.EffectedArea || row.effectedArea || 0) > 0 ? 'Critical Impact Noted' : 'No critical impact'
  }));
}

async function getCentreCode(req) {
  const season = getSeason(req);
  const fCode = getFactoryCode(req, 'F_code', 'factoryCode', 'F_Code');
  const fromDate = toSqlDate(req.query.Fdate || req.query.fromDate || req.query.FromDate || req.query.dateFrom);
  const toDate = toSqlDate(req.query.Todate || req.query.toDate || req.query.ToDate || req.query.dateTo || req.query.Fdate || req.query.fromDate);

  return repository.getCentreCode({ fCode, fromDate, toDate }, season);
}

async function getDiseaseList(req) {
  const season = getSeason(req);
  const fcode = getFactoryCode(req, 'fcode', 'F_code', 'factoryCode');
  return repository.getDiseaseList({ fcode }, season);
}

async function getSummaryReportUnitWise(req) {
  const season = getSeason(req);
  const factoryCode = getFactoryCode(req, 'F_code', 'factoryCode', 'FACID');
  const userCode = String(req.query.ucode || req.query.userCode || req.body?.ucode || req.body?.userCode || '').trim();
  const date = toSqlDate(req.query.FormDate || req.query.date || req.body?.FormDate || req.body?.date);

  return repository.getSummaryReportUnitWise({ factoryCode, userCode, date }, season);
}

async function getTruckDispatchWeighed(req) {
  const season = getSeason(req);
  const params = { ...(req.query || {}), ...(req.body || {}) };
  if (req.user?.userId || req.user?.userid) {
    params.userId = params.userId || params.userid || req.user.userId || req.user.userid;
  }
  return repository.getTruckDispatchWeighedData(params, season);
}

function ensureGateCenterTotals(payload = {}) {
  const num = (v) => {
    const n = Number(v);
    return Number.isFinite(n) ? n : 0;
  };
  const isEmpty = (v) => v === undefined || v === null || v === '';
  const setIfEmpty = (key, value) => {
    if (isEmpty(payload[key])) payload[key] = value;
  };

  const gate = {
    OYNos: num(payload.lblGateOYNos),
    OYWt: num(payload.lblGateOYWt),
    AtDNos: num(payload.lblGateAtDNos),
    AtDWt: num(payload.lblGateAtDWt),
    ODCNos: num(payload.lblGateODCNos),
    ODCWt: num(payload.lblGateODCWt),
    TDCNos: num(payload.lblGateTDCNos),
    TDCWt: num(payload.lblGateTDCWt)
  };
  const center = {
    OYNos: num(payload.lblCenterOYNos),
    OYWt: num(payload.lblCenterOYWt),
    AtDNos: num(payload.lblCenterAtDNos),
    AtDWt: num(payload.lblCenterAtDWt),
    ODCNos: num(payload.lblCenterODCNos),
    ODCWt: num(payload.lblCenterODCWt),
    TDCNos: num(payload.lblCenterTDCNos),
    TDCWt: num(payload.lblCenterTDCWt)
  };

  const gtCenOYNos = gate.OYNos + center.OYNos;
  const gtCenOYWt = gate.OYWt + center.OYWt;
  const gtCenAtDNos = gate.AtDNos + center.AtDNos;
  const gtCenAtDWt = gate.AtDWt + center.AtDWt;
  const gtCenODCNos = gate.ODCNos + center.ODCNos;
  const gtCenODCWt = gate.ODCWt + center.ODCWt;
  const gtCenTDCNos = gate.TDCNos + center.TDCNos;
  const gtCenTDCWt = gate.TDCWt + center.TDCWt;

  setIfEmpty('lblGtCenOYNos', String(gtCenOYNos));
  setIfEmpty('lblGtCenOYWt', gtCenOYWt.toFixed(2));
  setIfEmpty('lblGtCenAtDNos', String(gtCenAtDNos));
  setIfEmpty('lblGtCenAtDWt', gtCenAtDWt.toFixed(2));
  setIfEmpty('lblGtCenODCNos', String(gtCenODCNos));
  setIfEmpty('lblGtCenODCWt', gtCenODCWt.toFixed(2));
  setIfEmpty('lblGtCenODCAvg', gtCenODCNos > 0 ? (gtCenODCWt / gtCenODCNos).toFixed(2) : '0.00');
  setIfEmpty('lblGtCenTDCNos', String(gtCenTDCNos));
  setIfEmpty('lblGtCenTDCWt', gtCenTDCWt.toFixed(2));
  setIfEmpty('lblGtCenTDCAvg', gtCenTDCNos > 0 ? (gtCenTDCWt / gtCenTDCNos).toFixed(2) : '0.00');

  return payload;
}

// Crushing Report - Load Factory Data
async function loadFactoryData(req) {
  const season = getSeason(req);
  const factCode = getFactoryCode(req, 'FACTCODE', 'FactCode', 'factoryCode', 'F_code', 'F_Code', 'fcode', 'unit');
  const date = normalizeDateInput(
    req.query.Date || req.query.DATE || req.query.date || req.body?.Date || req.body?.DATE || req.body?.date
  );

  if (!factCode) throw new Error('Factory code is required');
  if (!date) throw new Error('Date is required');

  try {
    const data = await repository.getCrushingReportData({ factCode, date }, season);
    return ensureGateCenterTotals(data || {});
  } catch (error) {
    console.error('[loadFactoryData Error]', error.message);
    // Return empty structure on error instead of crashing
    return getCrushingReportTemplate();
  }
}

// Crushing Report - Load Mode-wise Data
async function loadModeWiseData(req) {
  const season = getSeason(req);
  const factCode = getFactoryCode(req, 'FACTCODE', 'FactCode', 'factoryCode', 'F_code', 'F_Code', 'fcode', 'unit');
  const date = normalizeDateInput(
    req.query.Date || req.query.DATE || req.query.date || req.body?.Date || req.body?.DATE || req.body?.date
  );

  if (!factCode) throw new Error('Factory code is required');
  if (!date) throw new Error('Date is required');

  try {
    const data = await repository.getCrushingReportData({ factCode, date }, season);
    return ensureGateCenterTotals(data || {});
  } catch (error) {
    console.error('[loadModeWiseData Error]', error.message);
    return getCrushingReportTemplate();
  }
}

async function getLatestCrushingDate(req) {
  const season = getSeason(req);
  const factCode = getFactoryCode(req, 'FACTCODE', 'FactCode', 'factoryCode', 'F_code');
  if (!factCode) throw new Error('Factory code is required');
  const latest = await repository.getLatestCrushingDate({ factCode }, season);
  if (!latest) return '';
  const dt = new Date(latest);
  if (Number.isNaN(dt.getTime())) return '';
  const dd = String(dt.getDate()).padStart(2, '0');
  const mm = String(dt.getMonth() + 1).padStart(2, '0');
  const yyyy = dt.getFullYear();
  return `${dd}/${mm}/${yyyy}`;
}

// Empty template for error handling
function getCrushingReportTemplate() {
  return {
    dtpDate: new Date().toLocaleDateString('en-GB'),
    lblcrop: '0',
    lblCartOYNos: '0', lblCartOYWt: '0.00', lblCartAtDNos: '0', lblCartAtDWt: '0.00',
    lblCartODCNos: '0', lblCartODCWt: '0.00', lblCartODCAvg: '0.00',
    lblCartTDCNos: '0', lblCartTDCWt: '0.00', lblCartTDCAvg: '0.00',
    lblTrolly40OYNos: '0', lblTrolly40OYWt: '0.00', lblTrolly40AtDNos: '0', lblTrolly40AtDWt: '0.00',
    lblTrolly40ODCNos: '0', lblTrolly40ODCWt: '0.00', lblTrolly40ODCAvg: '0.00',
    lblTrolly40TDCNos: '0', lblTrolly40TDCWt: '0.00', lblTrolly40TDCAvg: '0.00',
    lblTrolly60OYNos: '0', lblTrolly60OYWt: '0.00', lblTrolly60AtDNos: '0', lblTrolly60AtDWt: '0.00',
    lblTrolly60ODCNos: '0', lblTrolly60ODCWt: '0.00', lblTrolly60ODCAvg: '0.00',
    lblTrolly60TDCNos: '0', lblTrolly60TDCWt: '0.00', lblTrolly60TDCAvg: '0.00',
    lblTruckOYNos: '0', lblTruckOYWt: '0.00', lblTruckAtDNos: '0', lblTruckAtDWt: '0.00',
    lblTruckODCNos: '0', lblTruckODCWt: '0.00', lblTruckODCAvg: '0.00',
    lblTruckTDCNos: '0', lblTruckTDCWt: '0.00', lblTruckTDCAvg: '0.00',
    lblGateOYNos: '0', lblGateOYWt: '0.00', lblGateAtDNos: '0', lblGateAtDWt: '0.00',
    lblGateODCNos: '0', lblGateODCWt: '0.00', lblGateODCAvg: '0.00',
    lblGateTDCNos: '0', lblGateTDCWt: '0.00', lblGateTDCAvg: '0.00',
    lblCenterOYNos: '0', lblCenterOYWt: '0.00', lblCenterAtDNos: '0', lblCenterAtDWt: '0.00',
    lblCenterODCNos: '0', lblCenterODCWt: '0.00', lblCenterODCAvg: '0.00',
    lblCenterTDCNos: '0', lblCenterTDCWt: '0.00', lblCenterTDCAvg: '0.00',
    lblGtCenOYNos: '0', lblGtCenOYWt: '0.00', lblGtCenAtDNos: '0', lblGtCenAtDWt: '0.00',
    lblGtCenODCNos: '0', lblGtCenODCWt: '0.00', lblGtCenODCAvg: '0.00',
    lblGtCenTDCNos: '0', lblGtCenTDCWt: '0.00', lblGtCenTDCAvg: '0.00',
    Gatereport: [],
    Centerreport: [],
    Message: 'Report loaded'
  };
}

const getAnalysisData = async (req) => {
  try {
    const { F_code, Date } = req.query;
    
    // Normalize date
    const normalizedDate = toSqlDate(Date);
    if (!normalizedDate) {
      throw new Error('Invalid date format. Expected DD/MM/YYYY or YYYY-MM-DD format');
    }
    
    const season = getSeason(req);
    console.log(`[getAnalysisData] Processing - Factory: ${F_code}, Date: ${normalizedDate}, Season: ${season}`);
    
    const data = await repository.getAnalysisData(F_code, normalizedDate, season);
    console.log(`[getAnalysisData] Successfully retrieved data with ${data?.length || 0} recordsets`);
    
    return { recordsets: data };
  } catch (error) {
    console.error('[getAnalysisData] Error:', error.message);
    throw error;
  }
};

module.exports = {
  getEffectedCaneAreaReport,
  getCentreCode,
  getDiseaseList,
  getSummaryReportUnitWise,
  getTruckDispatchWeighed,
  loadFactoryData,
  loadModeWiseData,
  getAnalysisData,
  getCrushingReportTemplate,
  getLatestCrushingDate
};
