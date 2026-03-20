const mainController = require('../main.controller');

const CONTROLLER = 'WhatsApp';
const MAX_HTML_ROWS = 500;
const MAIN_FORWARD_TIMEOUT_MS = 45000;

function toIsoFromDDMMYYYY(value) {
  const m = String(value || '').match(/^(\d{2})[-/](\d{2})[-/](\d{4})$/);
  if (!m) return null;
  return `${m[3]}-${m[2]}-${m[1]}`;
}

function parseFlexibleDateToIso(value) {
  const raw = String(value || '').trim();
  if (!raw) return null;
  const iso = raw.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (iso) return `${iso[1]}-${iso[2]}-${iso[3]}`;
  return toIsoFromDDMMYYYY(raw);
}

function toDDMMYYYY(value) {
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '';
  const dd = String(d.getDate()).padStart(2, '0');
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const yyyy = d.getFullYear();
  return `${dd}/${mm}/${yyyy}`;
}

function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function sanitizeText(value, max = 2000) {
  const text = String(value ?? '');
  return text.length > max ? text.slice(0, max) : text;
}

function toNumber(value) {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
}

function normalizeFactoryCode(value) {
  const raw = String(value ?? '').trim();
  if (!raw || raw === '0') return '';
  if (!/^\d+$/.test(raw)) return '';
  const n = Number(raw);
  if (!Number.isSafeInteger(n) || n <= 0) return '';
  return String(n);
}

function isIsoDateInRange(isoDate, yearsBack = 30, yearsAhead = 2) {
  const d = new Date(`${isoDate}T00:00:00Z`);
  if (Number.isNaN(d.getTime())) return false;
  const now = new Date();
  const min = new Date(now.getFullYear() - yearsBack, 0, 1);
  const max = new Date(now.getFullYear() + yearsAhead, 11, 31);
  return d >= min && d <= max;
}

function withTimeout(promise, ms, message = 'Request timeout') {
  let timer;
  const timeout = new Promise((_, reject) => {
    timer = setTimeout(() => {
      const err = new Error(message);
      err.code = 'ETIMEOUT';
      reject(err);
    }, ms);
  });
  return Promise.race([
    promise.finally(() => clearTimeout(timer)),
    timeout
  ]);
}

function normalizeDistilleryRows(rows = []) {
  return (Array.isArray(rows) ? rows : []).slice(0, MAX_HTML_ROWS).map((r) => ({
    Unit: sanitizeText(r?.Unit ?? '', 120),
    Dist_RSProd_OnDate: toNumber(r?.Dist_RSProd_OnDate),
    Dist_RSProd_ToDate: toNumber(r?.Dist_RSProd_ToDate),
    RSProdType: sanitizeText(r?.RSProdType ?? r?.Dist_RSProd_ProdType ?? '', 20),
    Dist_AAProd_OnDate: toNumber(r?.Dist_AAProd_OnDate),
    Dist_AAProd_ToDate: toNumber(r?.Dist_AAProd_ToDate),
    AAProdType: sanitizeText(r?.AAProdType ?? r?.Dist_AAProd_ProdType ?? '', 20),
    Dist_Rec_OnDate: toNumber(r?.Dist_Rec_OnDate),
    Dist_Rec_ToDate: toNumber(r?.Dist_Rec_ToDate),
    Dist_Cap_OnDate: toNumber(r?.Dist_Cap_OnDate),
    Dist_Cap_ToDate: toNumber(r?.Dist_Cap_ToDate),
    Dist_Stoppage: sanitizeText(r?.Dist_Stoppage ?? '', 2000),
    Dist_Remark: sanitizeText(r?.Dist_Remark ?? '', 2000)
  }));
}

async function fetchMainDistilleryRows(req) {
  return new Promise((resolve, reject) => {
    const resMock = {
      status(code) {
        this.statusCode = code;
        return this;
      },
      json(payload) {
        if ((this.statusCode || 200) >= 400) {
          reject(new Error(payload?.message || 'Failed to fetch distillery rows'));
        } else {
          resolve(Array.isArray(payload) ? payload : []);
        }
        return this;
      }
    };
    mainController.distilleryReportEntryView(req, resMock, reject);
  });
}

function buildDistilleryHtml(dateLabel, rows = []) {
  if (!rows.length) return 'Data Not Found...?';

  const tr = (a, b) => `<tr><td><p style='margin-bottom:-14px'>${a}</p></td><td><p style='margin-bottom:-14px'>${b}</p></td></tr>`;
  const safe = (v) => escapeHtml(v);
  const fmt = (v) => toNumber(v).toFixed(2);

  const rs = rows.map((r) => tr(
    `${safe(r.Unit)}&nbsp;&nbsp;&nbsp;`,
    `${safe(r.RSProdType ? `${r.RSProdType}` : '')}${fmt(r.Dist_RSProd_OnDate)} / ${fmt(r.Dist_RSProd_ToDate)}`
  )).join('');
  const aa = rows.map((r) => tr(
    `${safe(r.Unit)}&nbsp;&nbsp;&nbsp;`,
    `${safe(r.AAProdType ? `${r.AAProdType}` : '')}${fmt(r.Dist_AAProd_OnDate)} / ${fmt(r.Dist_AAProd_ToDate)}`
  )).join('');
  const rec = rows.map((r) => tr(`${safe(r.Unit)}&nbsp;&nbsp;&nbsp;`, `${fmt(r.Dist_Rec_OnDate)} / ${fmt(r.Dist_Rec_ToDate)}`)).join('');
  const cap = rows.map((r) => tr(`${safe(r.Unit)}&nbsp;&nbsp;&nbsp;`, `${fmt(r.Dist_Cap_OnDate)} / ${fmt(r.Dist_Cap_ToDate)}`)).join('');
  const stop = rows
    .filter((r) => String(r.Dist_Stoppage || '').trim())
    .map((r) => tr(`${safe(r.Unit)}&nbsp;&nbsp;&nbsp;`, safe(r.Dist_Stoppage).replace(/\r?\n/g, '<br/>')))
    .join('');
  const rem = rows
    .filter((r) => String(r.Dist_Remark || '').trim())
    .map((r) => tr(`${safe(r.Unit)}&nbsp;&nbsp;&nbsp;`, safe(r.Dist_Remark)))
    .join('');

  return `
    <table cellpadding='5' cellspacing='0' style='border:0;font-size:9pt;font-family:Arial;width:524px;'>
      <tr><th colspan='2' style='text-align:left;font-weight:bold;'><p style='margin-bottom:-14px'> Distillery Report - ${escapeHtml(dateLabel)}</p></th></tr>
      <tr><td><p style='margin-bottom:-22px'><br/></p></td></tr>
      <tr><td colspan='2' style='text-align:left;font-weight:bold;'><p style='margin-bottom:-14px'> RS Production (Lac BL) </p></td></tr>
      ${rs}
      <tr><td><p style='margin-bottom:-22px'><br/></p></td></tr>
      <tr><td colspan='2' style='text-align:left;font-weight:bold;'><p style='margin-bottom:-14px'> AA Production (Lac BL) </p></td></tr>
      ${aa}
      <tr><td><p style='margin-bottom:-22px'><br/></p></td></tr>
      <tr><td colspan='2' style='text-align:left;font-weight:bold;'><p style='margin-bottom:-14px'> Recovery (BL/Qtl) </p></td></tr>
      ${rec}
      <tr><td><p style='margin-bottom:-22px'><br/></p></td></tr>
      <tr><td colspan='2' style='text-align:left;font-weight:bold;'><p style='margin-bottom:-14px'> Capacity Utilisation (%) </p></td></tr>
      ${cap}
      ${stop ? `<tr><td><p style='margin-bottom:-22px'><br/></p></td></tr><tr><td colspan='2' style='text-align:left;font-weight:bold;'><p style='margin-bottom:-14px'> Stoppage (Reason Time in hour format)</p></td></tr>${stop}` : ''}
      ${rem ? `<tr><td><p style='margin-bottom:-22px'><br/></p></td></tr><tr><td colspan='2' style='text-align:left;font-weight:bold;'><p style='margin-bottom:-14px'> Remark </p></td></tr>${rem}` : ''}
    </table>
  `;
}

exports.UploadLabReport = async (req, res) => {
  return res.status(200).json({
    success: true,
    message: 'UploadLabReport endpoint is available. File import pipeline is not yet ported to Node.'
  });
};

exports.UploadLabReport_2 = async (req, res) => {
  return res.status(200).json({
    success: false,
    message: 'Excel upload processing is not yet ported. Use the current upload flow for this endpoint.'
  });
};

exports.exceldetail = async (req, res) => {
  return res.status(200).json({
    success: false,
    message: 'exceldetail processing is not yet ported.'
  });
};

exports.distilleryReportEntryViewNew = async (req, res) => {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return res.status(200).json({
    success: true,
    Dist_Date: `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`
  });
};

exports.distilleryReportEntryViewNewR = async (req, res, next) => {
  try {
    const dateRaw = req.query.Date || req.query.date || '';
    const fCodeRaw = normalizeFactoryCode(req.query.F_code || req.query.factoryCode || '');
    const dateIso = parseFlexibleDateToIso(dateRaw);
    if (!dateIso) {
      return res.status(400).json({ success: false, message: 'Date is required (DD-MM-YYYY or YYYY-MM-DD)' });
    }
    if (!isIsoDateInRange(dateIso)) {
      return res.status(400).json({ success: false, message: 'Date is out of allowed range' });
    }

    const normalizedDate = toDDMMYYYY(dateIso);
    req.query.fromDate = normalizedDate;
    req.query.toDate = normalizedDate;
    req.query.factoryCode = fCodeRaw;
    const rowsRaw = await withTimeout(fetchMainDistilleryRows(req), MAIN_FORWARD_TIMEOUT_MS, 'Distillery fetch timeout');
    const rows = normalizeDistilleryRows(rowsRaw);
    return res.status(200).json(buildDistilleryHtml(toDDMMYYYY(dateIso), rows));
  } catch (error) {
    if (error?.code === 'ETIMEOUT') {
      return res.status(504).json({ success: false, message: 'Request timeout' });
    }
    return next(error);
  }
};

exports.DistilleryReportEntryView = async (req, res, next) => {
  return mainController.distilleryReportEntryView(req, res, next);
};

exports.DistilleryReportEntryData = async (req, res, next) => {
  try {
    const dateRaw = req.query.txtDate || req.query.Date || '';
    const fCodeRaw = req.query.ddunits || req.query.F_code || '';
    req.query.Date = dateRaw;
    req.query.F_code = fCodeRaw;
    return exports.distilleryReportEntryViewNewR(req, res, next);
  } catch (error) {
    return next(error);
  }
};

exports.ActualVarietyWiseArea = async (req, res) => {
  return mainController.ActualVarietyWiseArea(req, res);
};
