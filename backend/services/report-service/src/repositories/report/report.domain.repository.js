const { executeProcedure, executeQuery } = require('../../core/db/query-executor');
const reportService = require('../../services/report.service');
const readRepository = require('./report.read.repository');

const CONTROLLER = 'Report';

async function runProcedure(name, params, season) {
  return executeProcedure(name, params, season);
}

exports.runProcedure = runProcedure;

// Normalize incoming date to YYYY-MM-DD for SQL usage
function toSqlDateAnalysis(raw) {
  const value = String(raw || '').trim();
  if (!value) return '';

  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) return value;
  if (/^\d{2}\/\d{2}\/\d{4}$/.test(value)) {
    const [dd, mm, yyyy] = value.split('/');
    return `${yyyy}-${mm}-${dd}`;
  }
  if (/^\d{2}-\d{2}-\d{4}$/.test(value)) {
    const [dd, mm, yyyy] = value.split('-');
    return `${yyyy}-${mm}-${dd}`;
  }

  const dt = new Date(value);
  if (Number.isNaN(dt.getTime())) return '';
  const dd = String(dt.getDate()).padStart(2, '0');
  const mm = String(dt.getMonth() + 1).padStart(2, '0');
  const yyyy = dt.getFullYear();
  return `${yyyy}-${mm}-${dd}`;
}

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
  const ymd = `${yyyy}-${mm}-${dd}`;
  const yyyymmdd = `${yyyy}${mm}${dd}`;
  return { dmy, ymd, yyyymmdd };
}

function toYyyymmddFromDmy(raw) {
  const parsed = normalizeDmyInput(raw);
  return parsed ? parsed.yyyymmdd : '';
}

function truncateDecimal(value, precision) {
  const step = Math.pow(10, precision);
  const tmp = Math.trunc(Number(value || 0) * step);
  return tmp / step;
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

function parseDmyToDate(raw) {
  const parsed = normalizeDmyInput(raw);
  if (!parsed) return null;
  const [dd, mm, yyyy] = parsed.dmy.split('/');
  const dt = new Date(Number(yyyy), Number(mm) - 1, Number(dd));
  return Number.isNaN(dt.getTime()) ? null : dt;
}

function formatYyyymmdd(dateObj) {
  if (!dateObj || Number.isNaN(dateObj.getTime())) return '';
  const yyyy = dateObj.getFullYear();
  const mm = String(dateObj.getMonth() + 1).padStart(2, '0');
  const dd = String(dateObj.getDate()).padStart(2, '0');
  return `${yyyy}${mm}${dd}`;
}

function formatDmy(dateObj) {
  if (!dateObj || Number.isNaN(dateObj.getTime())) return '';
  const dd = String(dateObj.getDate()).padStart(2, '0');
  const mm = String(dateObj.getMonth() + 1).padStart(2, '0');
  const yyyy = dateObj.getFullYear();
  return `${dd}/${mm}/${yyyy}`;
}

// ── Stored-procedure whitelist (security) ─────────────────────────────────────
// Only procedures listed here may be executed via createProcedureHandler.
// Add new procedures here before wiring up a new export.
const ALLOWED_PROCEDURES = new Set([
'CrushingReport', 'Value', 'GetYesterdaytransitDetail', 'GetTodaytransitDetail',
'IndentFaillDetails', 'IndentFaillDetailsData', 'TargetActualMISReport',
'TargetActualMISPeriodReport', 'txtdate_TextChanged', 'next', 'prev',
'DriageDetail', 'DriageClerkDetail', 'DriageCentreDetail',
'DriageCentreClerkDetail', 'DriageClerkCentreDetail', 'BudgetVSActual',
'IndentFailSummaryNew', 'IndentFailSummaryNewData', 'HourlyCaneArrival',
'LoansummaryRpt', 'SurveyPLot', 'SurveyPLotDetails', 'DiseaseDetailsOnMap',
'DiseaseDetailsOnMapTodate', 'SuveryCheckPlotsOnMapCurrent',
'Checking_logPlots', 'CheckingDetailsOnMap', 'DiseaseDetails',
'Imagesblub', 'LOADMODEWISEDATA', 'LOADFACTORYDATA',
'IndentFailSummary', 'IndentFailSummaryData', 'CentrePurchase'
]);

// ── Generic stored-procedure handler factory ─────────────────────────────────
function createProcedureHandler(controller, action, _signature) {
if (!ALLOWED_PROCEDURES.has(action)) {
// Return a handler that immediately rejects the request
return (_req, res) => res.status(403).json({
success: false,
message: `Procedure '${action}' is not permitted.`
});
}
return async (req, res, next) => {
try {
const season = req.user?.season || req.query?.season || req.body?.season || process.env.DEFAULT_SEASON || '2526';
const params = { ...(req.query || {}), ...(req.body || {}) };
let result;
try {
  result = await executeProcedureWithSchema(action, params, season);
} catch (error) {
  const msg = String(error?.message || '').toLowerCase();
  if (action === 'Imagesblub' && msg.includes('could not find stored procedure')) {
    result = { rows: [], recordsets: [], rowsAffected: [] };
  } else {
    throw error;
  }
}
return res.status(200).json({
success: true,
message: `${controller}.${action} executed`,
data: result?.rows || [],
recordsets: result?.recordsets || []
});
} catch (error) {
if (typeof next === 'function') return next(error);
throw error;
}
};
}

function normalizeDateToDb(value) {
  const raw = String(value || '').trim();
  if (!raw) return '';
  if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) return raw;
  if (/^\d{2}\/\d{2}\/\d{4}$/.test(raw)) {
    const [dd, mm, yyyy] = raw.split('/');
    return `${yyyy}-${mm}-${dd}`;
  }
  if (/^\d{2}-\d{2}-\d{4}$/.test(raw)) {
    const [dd, mm, yyyy] = raw.split('-');
    return `${yyyy}-${mm}-${dd}`;
  }
  const dt = new Date(raw);
  if (Number.isNaN(dt.getTime())) return '';
  const dd = String(dt.getDate()).padStart(2, '0');
  const mm = String(dt.getMonth() + 1).padStart(2, '0');
  const yyyy = dt.getFullYear();
  return `${yyyy}-${mm}-${dd}`;
}

async function executeProcedureWithSchema(procName, params, season) {
  const schema = String(process.env.DB_SCHEMA || '').trim();
  const qualified = schema ? `${schema}.${procName}` : procName;
  try {
    return await executeProcedure(qualified, params, season);
  } catch (error) {
    if (schema && String(error?.message || '').includes('Could not find stored procedure')) {
      return await executeProcedure(procName, params, season);
    }
    throw error;
  }
}

// ------------------------------------------------------------
// Column discovery helpers (avoid invalid column errors)
// ------------------------------------------------------------
const tableColumnCache = new Map();
async function getTableColumnList(season, tableName) {
  const key = `${season || ''}:${tableName}`;
  if (tableColumnCache.has(key)) return tableColumnCache.get(key);
  const rows = await executeQuery(
    `SELECT c.name AS columnName
     FROM sys.columns c
     WHERE c.object_id = OBJECT_ID(@tableName)`,
    { tableName },
    season
  );
  const cols = (rows || []).map((r) => String(r.columnName));
  tableColumnCache.set(key, cols);
  return cols;
}

function pickExistingColumnFromList(cols, candidates, fallback) {
  const set = new Set((cols || []).map((c) => c.toLowerCase()));
  for (const c of candidates) {
    if (set.has(String(c).toLowerCase())) return c;
  }
  return fallback;
}

async function resolveColumn(season, tableName, candidates, fallback) {
  try {
    const cols = await getTableColumnList(season, tableName);
    return pickExistingColumnFromList(cols, candidates, fallback);
  } catch (error) {
    return fallback;
  }
}

function buildCrushingDefaults(req) {
const dateRaw = String(req.query.Date || req.query.DATE || req.body?.Date || req.body?.DATE || '').trim();
const factCode = String(req.query.FACTCODE || req.body?.FACTCODE || req.query.F_code || req.body?.F_code || '0').trim();
const dtpDate = dateRaw || '';
const zero = '0.00';
const data = {
FACTCODE: factCode || '0',
dtpDate,
lblcrop: '',
STP_Remark: '',
STP_PIO: 0,
STP_PIM: 0,
lblshiftA: '<------06 AM TO 02 PM------>',
lblshiftB: '<------02 PM TO 10 PM------>',
lblshiftC: '<------10 PM TO 06 AM------>',
Label51: '',
lblNHour: zero,
lblcrushrate: zero,
lblExp: zero,
lblopr: zero,
lblCenPur: zero,
lblTruckDisp: zero,
lblTruckRecv: zero,
lblTRANSTODAY: zero,
lbltransitwtyesterday: zero,
lblYDTWEIGHT: zero,
lblYESToT: zero,
lblToDToT: zero,
lblYes6AMto6PMWT: zero,
lblYes6PMto6AMWT: zero,
lblToday6AMto6PMWT: zero,
lblToday6PMto6AMWT: zero,
lbltyarddobga: zero,
lblAtotal: zero,
lblBtotal: zero,
lblCtotal: zero
};

const keys = [
'Cart', 'Trolly40', 'Trolly60', 'Truck', 'Gate', 'Center', 'GtCen'
];
keys.forEach((k) => {
data[`lbl${k}OYNos`] = '0';
data[`lbl${k}OYWt`] = zero;
data[`lbl${k}AtDNos`] = '0';
data[`lbl${k}AtDWt`] = zero;
data[`lbl${k}ODCNos`] = '0';
data[`lbl${k}ODCWt`] = zero;
data[`lbl${k}ODCAvg`] = zero;
data[`lbl${k}TDCNos`] = '0';
data[`lbl${k}TDCWt`] = zero;
data[`lbl${k}TDCAvg`] = zero;
});

const hourly = [
'1amto2am', '2amto3am', '3amto4am', '4amto5am', '5amto6am',
'6amto7am', '7amto8am', '8amto9am', '9amto10am', '10amto11am', '11amto12pm', '12amto1am',
'1pmto2pm', '2pmto3pm', '3pmto4pm', '4pmto5pm', '5pmto6pm', '6pmto7pm', '7pmto8pm', '8pmto9pm', '9pmto10pm', '10pmto11pm', '11pmto12pm', '12pmto1pm'
];
hourly.forEach((slot) => {
data[`lbl${slot}Wt`] = zero;
data[`lbl${slot}TWt`] = zero;
});

return data;
}

async function procedureExists(season, name) {
const rows = await executeQuery(
`SELECT
COALESCE(
OBJECT_ID(@procName, 'P'),
OBJECT_ID(CONCAT('dbo.', @procName), 'P')
) AS procId`,
{ procName: name },
season
);
return !!rows?.[0]?.procId;
}

async function resolveProcedureName(season, name) {
const rows = await executeQuery(
`SELECT TOP 1
s.name AS schemaName,
p.name AS procName
FROM sys.procedures p
JOIN sys.schemas s ON p.schema_id = s.schema_id
WHERE p.name = @procName
ORDER BY CASE WHEN s.name = 'dbo' THEN 0 ELSE 1 END, s.name`,
{ procName: name },
season
);
if (!rows?.length) return null;
return `${rows[0].schemaName}.${rows[0].procName}`;
}

function createCrushingHandler(procName) {
return async (req, res, next) => {
try {
const season = req.user?.season || req.query?.season || req.body?.season || process.env.DEFAULT_SEASON || '2526';
const params = { ...(req.query || {}), ...(req.body || {}) };
const resolved = await resolveProcedureName(season, procName);
if (!resolved) {
return res.status(200).json(buildCrushingDefaults(req));
}
try {
const result = await executeProcedure(resolved, params, season);
return res.status(200).json((result?.rows && result.rows[0]) ? result.rows[0] : (result?.rows || []));
} catch (error) {
const message = String(error?.message || '');
if (message.toLowerCase().includes('could not find stored procedure')) {
return res.status(200).json(buildCrushingDefaults(req));
}
throw error;
}
} catch (error) {
if (typeof next === 'function') return next(error);
throw error;
}
};
}

function buildAnalysisDefaults() {
return {
success: true,
message: 'Report.Analysisdata fallback',
data: [],
recordsets: [[], [], [], []]
};
}

// ============================================================================
// Driage Clerk Summary (ported from BajajMic ReportController)
// ============================================================================
exports.DriageClerkSummary = async (req, res, next) => {
  try {
    const season = req.user?.season || req.query?.season || req.body?.season || process.env.DEFAULT_SEASON || '2526';
    const fRaw = req.query?.F_code || req.query?.F_Code || req.body?.F_code || req.body?.F_Code || '';
    const dateRaw = req.query?.Date || req.query?.date || req.body?.Date || req.body?.date || '';

    const fcode = String(fRaw || '').trim();
    const dateInfo = normalizeDmyInput(dateRaw);

    if (!fcode || fcode === '0' || fcode.toLowerCase() === 'all') {
      return res.status(200).json({ success: true, data: [], recordsets: [[]], message: 'Please select a Factory' });
    }
    if (!dateInfo) {
      return res.status(200).json({ success: true, data: [], recordsets: [[]], message: 'Invalid Date' });
    }

    const dt = dateInfo.yyyymmdd;

    const clerkSummarySql = `
      WITH CEN AS (
        SELECT U_factory as Factory, u_code SUPVCODE, u_name as SUPVNAME
        FROM Users
        WHERE U_factory = @fact
      ),
      PUR AS (
        SELECT M_TARE_OPR, MIN(M_DATE) FDate, MAX(M_DATE) TDate,
          ISNULL(SUM(ISNULL(M_GROSS,0) - ISNULL(M_TARE,0) - ISNULL(M_JOONA,0)), 0) PQTY
        FROM PURCHASE
        WHERE CONVERT(NVARCHAR, M_DATE,112) <= @dt
          AND M_FACTORY = @fact
          AND M_CENTRE != 100
        GROUP BY M_TARE_OPR
      ),
      REP AS (
        SELECT tt_Clerk, MIN(tt_DpDate) tFDate, MAX(tt_DpDate) tTDate,
          ISNULL(SUM(ISNULL(TT_GROSSWEIGHT,0) - ISNULL(TT_TAREWEIGHT,0) - ISNULL(TT_JOONAWEIGHT,0)), 0) RQTY
        FROM RECEIPT
        WHERE CONVERT(NVARCHAR, tt_DpDate,112) <= @dt
          AND TT_FACTORY = @fact
        GROUP BY tt_Clerk
      )
      SELECT Factory as C_FACTORY, SUPVCODE as C_CODE, SUPVNAME as C_NAME,
        CONVERT(varchar, FDate,103) FDate,
        CONVERT(varchar, TDate,103) TDate,
        ISNULL(PQTY,0) PQTY, ISNULL(RQTY,0) RQTY
      FROM CEN
      JOIN PUR on SUPVCODE = M_TARE_OPR
      FULL OUTER JOIN REP on M_TARE_OPR = tt_Clerk
      WHERE SUPVCODE is not null
      ORDER BY SUPVCODE`;

    const clerkRows = await executeQuery(clerkSummarySql, { fact: fcode, dt }, season).catch(() => []);
    if (!clerkRows || clerkRows.length === 0) {
      return res.status(200).json({ success: true, data: [], recordsets: [[]], message: 'No data found' });
    }

    const detailSql = `
      WITH PUR AS (
        SELECT M_CENTRE, MIN(CAST(M_DATE as Date)) Mfrom, MAX(CAST(M_DATE as Date)) MTill,
          ISNULL(SUM(ISNULL(M_GROSS,0) - ISNULL(M_TARE,0) - ISNULL(M_JOONA,0)), 0) PQTY
        FROM PURCHASE
        WHERE CONVERT(NVARCHAR, M_DATE,112) <= @dt
          AND M_FACTORY = @fact
          AND M_TARE_OPR = @clerk
        GROUP BY M_CENTRE
      ),
      REP AS (
        SELECT tt_center, MIN(CAST(tt_DpDate as Date)) TFrom, MAX(CAST(tt_DpDate as Date)) TTill,
          ISNULL(SUM(ISNULL(TT_GROSSWEIGHT,0) - ISNULL(TT_TAREWEIGHT,0) - ISNULL(TT_JOONAWEIGHT,0)), 0) RQTY
        FROM RECEIPT
        WHERE CONVERT(NVARCHAR, tt_DpDate,112) <= @dt
          AND TT_FACTORY = @fact
          AND tt_Clerk = @clerk
        GROUP BY tt_center
      )
      SELECT c_factory as factory, c_code, C_Name,
        CONVERT(varchar, (case when Mfrom > TFrom then TFrom else Mfrom end),103) MFrom,
        CONVERT(varchar, (case when MTill > TTill then MTill else TTill end),103) Till,
        ISNULL(SUM(PQTY),0) PQTY, ISNULL(SUM(RQTY),0) RQTY
      FROM PUR
      FULL OUTER JOIN REP ON M_CENTRE = tt_center
      JOIN Centre on c_code = M_CENTRE and c_code = tt_center
      WHERE c_factory = @fact
      GROUP BY c_factory, c_code, C_Name, Mfrom, MTill, TFrom, TTill
      ORDER BY (case when Mfrom > TFrom then TFrom else Mfrom end),
               (case when MTill > TTill then MTill else TTill end)`;

    const openingSql = `
      SELECT TOP 1 MAX(CH_CHALLAN) AS CH_CHALLAN, ISNULL(CH_BALANCE,0) AS CH_BALANCE
      FROM CHALLAN_FINAL
      WHERE Ch_Cancel = 0
        AND CH_FACTORY = @fact
        AND CONVERT(NVARCHAR, CH_DEP_DATE,112) <= @dt
        AND Ch_Centre = @centre
      GROUP BY CH_BALANCE
      ORDER BY MAX(CH_CHALLAN) DESC`;

    const closingSql = `
      SELECT TOP 1 MAX(CH_CHALLAN) AS CH_CHALLAN, ISNULL(CH_BALANCE,0) AS CH_BALANCE
      FROM CHALLAN_FINAL
      WHERE Ch_Cancel = 0
        AND CH_FACTORY = @fact
        AND CONVERT(NVARCHAR, CH_DEP_DATE,112) = @dt
        AND CH_CENTRE = @centre
      GROUP BY CH_BALANCE
      ORDER BY CH_CHALLAN DESC`;

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

      const detailRows = await executeQuery(
        detailSql,
        { fact: fcode, dt, clerk: clerkCode },
        season
      ).catch(() => []);

      if (detailRows && detailRows.length) {
        for (const d of detailRows) {
          const mfrom = String(d.MFrom || '').trim();
          const till = String(d.Till || '').trim();
          const centreCode = String(d.c_code || d.C_CODE || '').trim();

          const openDt = addDaysToYyyymmdd(toYyyymmddFromDmy(mfrom), -1);
          if (openDt) {
            const ob = await executeQuery(openingSql, { fact: fcode, dt: openDt, centre: centreCode }, season).catch(() => []);
            if (ob && ob.length && fcode !== '51') {
              obal += Number(ob[0].CH_BALANCE || 0);
            }
          }

          const closeDt = toYyyymmddFromDmy(till);
          if (closeDt) {
            const cb = await executeQuery(closingSql, { fact: fcode, dt: closeDt, centre: clerkCode }, season).catch(() => []);
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

    return res.status(200).json({
      success: true,
      data: rows,
      recordsets: [rows]
    });
  } catch (error) {
    if (typeof next === 'function') return next(error);
    throw error;
  }
};

// ============================================================================
// Driage Summary (Centre-wise)
// ============================================================================
exports.DriageSummary = async (req, res, next) => {
  try {
    const season = req.user?.season || req.query?.season || req.body?.season || process.env.DEFAULT_SEASON || '2526';
    const fRaw = req.query?.F_code || req.query?.F_Code || req.body?.F_code || req.body?.F_Code || '';
    const dateRaw = req.query?.Date || req.query?.date || req.body?.Date || req.body?.date || '';

    const fcode = String(fRaw || '').trim();
    const dateInfo = normalizeDmyInput(dateRaw);

    if (!fcode || fcode === '0' || fcode.toLowerCase() === 'all') {
      return res.status(200).json({ success: true, data: [], recordsets: [[]], message: 'Please select a Factory' });
    }
    if (!dateInfo) {
      return res.status(200).json({ success: true, data: [], recordsets: [[]], message: 'Invalid Date' });
    }

    const dt = dateInfo.yyyymmdd;

    const summarySql = `
      WITH CEN AS (
        SELECT C_FACTORY, C_CODE, C_NAME FROM CENTRE WHERE C_FACTORY = @fact
      ),
      PUR AS (
        SELECT MC_GCode as M_CENTRE,
          ISNULL(SUM(ISNULL(M_GROSS,0) - ISNULL(M_TARE,0) - ISNULL(M_JOONA,0)), 0) PQTY
        FROM PURCHASE
        JOIN MI_MargeCenter ON MC_CCODE = M_CENTRE AND MC_FACTORY = M_FACTORY
        WHERE CONVERT(NVARCHAR, M_DATE,112) <= @dt
          AND M_FACTORY = @fact
        GROUP BY MC_GCode
      ),
      REP AS (
        SELECT TT_CENTER,
          ISNULL(SUM(ISNULL(TT_GROSSWEIGHT,0) - ISNULL(TT_TAREWEIGHT,0) - ISNULL(TT_JOONAWEIGHT,0)), 0) RQTY
        FROM RECEIPT
        JOIN CENTRE ON C_CODE = TT_CENTER AND C_FACTORY = TT_FACTORY
        WHERE CONVERT(NVARCHAR, tt_DpDate,112) <= @dt
          AND TT_FACTORY = @fact
        GROUP BY TT_CENTER
      )
      SELECT C_FACTORY, C_CODE, C_NAME, ISNULL(PQTY,0) PQTY, ISNULL(RQTY,0) RQTY
      FROM CEN
      JOIN PUR ON C_CODE = M_CENTRE
      LEFT JOIN REP ON M_CENTRE = TT_CENTER
      WHERE C_CODE != 100
      ORDER BY C_CODE`;

    const closingSql = `
      SELECT MAX(CH_CHALLAN) AS CH_CHALLAN, ISNULL(CH_BALANCE,0) AS CH_BALANCE
      FROM CHALLAN_FINAL
      WHERE Ch_Cancel = 0
        AND CH_FACTORY = @fact
        AND CONVERT(NVARCHAR, CH_DEP_DATE,112) = @dt
        AND CH_CENTRE = @centre
      GROUP BY CH_BALANCE
      ORDER BY CH_CHALLAN DESC`;

    const rowsRaw = await executeQuery(summarySql, { fact: fcode, dt }, season).catch(() => []);
    if (!rowsRaw || rowsRaw.length === 0) {
      return res.status(200).json({ success: true, data: [], recordsets: [[]], message: 'No data found' });
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

      const cb = await executeQuery(closingSql, { fact: fcode, dt, centre }, season).catch(() => []);
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

    return res.status(200).json({ success: true, data: rows, recordsets: [rows] });
  } catch (error) {
    if (typeof next === 'function') return next(error);
    throw error;
  }
};

// ============================================================================
// Driage Detail (Centre-wise)
// ============================================================================
exports.DriageDetail = async (req, res, next) => {
  try {
    const season = req.user?.season || req.query?.season || req.body?.season || process.env.DEFAULT_SEASON || '2526';
    const fRaw = req.query?.FACT || req.query?.F_code || req.query?.F_Code || req.body?.FACT || req.body?.F_code || req.body?.F_Code || '';
    const dateRaw = req.query?.DATE || req.query?.Date || req.query?.date || req.body?.DATE || req.body?.Date || req.body?.date || '';
    const centerRaw = req.query?.CENTER || req.query?.center || req.body?.CENTER || req.body?.center || '';

    const fcode = String(fRaw || '').trim();
    const center = String(centerRaw || '').trim();
    const dateInfo = normalizeDmyInput(dateRaw);
    if (!fcode || fcode === '0') return res.status(200).json({ success: true, data: [], recordsets: [[]], message: 'Please select a Factory' });
    if (!center || center === '0') return res.status(200).json({ success: true, data: [], recordsets: [[]], message: 'Please select a Center' });
    if (!dateInfo) return res.status(200).json({ success: true, data: [], recordsets: [[]], message: 'Invalid Date' });

    const dt = dateInfo.yyyymmdd;
    const edt = addDaysToYyyymmdd(dt, -10);

    const detailBeforeSql = `
      WITH PUR AS (
        SELECT MAX(CAST(M_DATE as Date)) MDATE,
          ISNULL(SUM(ISNULL(M_GROSS,0) - ISNULL(M_TARE,0) - ISNULL(M_JOONA,0)), 0) PQTY
        FROM PURCHASE
        JOIN MI_MargeCenter ON MC_CCODE = M_CENTRE AND MC_FACTORY = M_FACTORY
        WHERE CONVERT(NVARCHAR, M_DATE,112) < @edt
          AND M_FACTORY = @fact
          AND MC_GCode = @center
          AND M_CENTRE != 100
      ),
      REP AS (
        SELECT MAX(CAST(tt_DpDate as Date)) TDATE,
          ISNULL(SUM(ISNULL(TT_GROSSWEIGHT,0) - ISNULL(TT_TAREWEIGHT,0) - ISNULL(TT_JOONAWEIGHT,0)), 0) RQTY
        FROM RECEIPT
        JOIN CENTRE ON C_CODE = TT_CENTER AND C_FACTORY = TT_FACTORY
        WHERE CONVERT(NVARCHAR, tt_DpDate,112) < @edt
          AND TT_FACTORY = @fact
          AND TT_CENTER = @center
      )
      SELECT
        CASE WHEN MDATE is null THEN CONVERT(varchar, TDATE,103) ELSE CONVERT(varchar, MDATE,103) END AS DATE,
        CASE WHEN PQTY is null THEN 0 ELSE PQTY END PQTY,
        CASE WHEN RQTY is null THEN 0 ELSE RQTY END RQTY
      FROM PUR FULL OUTER JOIN REP ON PUR.MDATE = REP.TDATE
      WHERE MDATE is not null
      ORDER BY MDATE ASC`;

    const detailRangeSql = `
      WITH PUR AS (
        SELECT CAST(M_DATE as Date) MDATE,
          ISNULL(SUM(ISNULL(M_GROSS,0) - ISNULL(M_TARE,0) - ISNULL(M_JOONA,0)), 0) PQTY
        FROM PURCHASE
        JOIN MI_MargeCenter ON MC_CCODE = M_CENTRE AND MC_FACTORY = M_FACTORY
        WHERE CONVERT(NVARCHAR, M_DATE,112) BETWEEN @edt AND @dt
          AND M_FACTORY = @fact
          AND MC_GCode = @center
          AND M_CENTRE != 100
        GROUP BY CAST(M_DATE as Date)
      ),
      REP AS (
        SELECT CAST(tt_DpDate as Date) TDATE,
          ISNULL(SUM(ISNULL(TT_GROSSWEIGHT,0) - ISNULL(TT_TAREWEIGHT,0) - ISNULL(TT_JOONAWEIGHT,0)), 0) RQTY
        FROM RECEIPT
        JOIN CENTRE ON C_CODE = TT_CENTER AND C_FACTORY = TT_FACTORY
        WHERE CONVERT(NVARCHAR, tt_DpDate,112) BETWEEN @edt AND @dt
          AND TT_FACTORY = @fact
          AND TT_CENTER = @center
        GROUP BY CAST(tt_DpDate as Date)
      )
      SELECT
        CASE WHEN MDATE is null THEN CONVERT(varchar, TDATE,103) ELSE CONVERT(varchar, MDATE,103) END AS DATE,
        CASE WHEN PQTY is null THEN 0 ELSE PQTY END PQTY,
        CASE WHEN RQTY is null THEN 0 ELSE RQTY END RQTY
      FROM PUR FULL OUTER JOIN REP ON PUR.MDATE = REP.TDATE
      ORDER BY MDATE ASC`;

    const openingSql = `
      SELECT TOP 1 MAX(CH_CHALLAN) AS CH_CHALLAN, ISNULL(CH_BALANCE,0) AS CH_BALANCE
      FROM CHALLAN_FINAL
      WHERE Ch_Cancel = 0
        AND CH_FACTORY = @fact
        AND CONVERT(NVARCHAR, CH_DEP_DATE,112) <= @dt
        AND CH_CENTRE = @center
      GROUP BY CH_BALANCE
      ORDER BY MAX(CH_CHALLAN) DESC`;

    const closingSql = `
      SELECT MAX(CH_CHALLAN) AS CH_CHALLAN, ISNULL(CH_BALANCE,0) AS CH_BALANCE
      FROM CHALLAN_FINAL
      WHERE Ch_Cancel = 0
        AND CH_FACTORY = @fact
        AND CONVERT(NVARCHAR, CH_DEP_DATE,112) = @dt
        AND CH_CENTRE = @center
      GROUP BY CH_BALANCE
      ORDER BY CH_CHALLAN DESC`;

    const beforeRows = await executeQuery(detailBeforeSql, { fact: fcode, edt, center }, season).catch(() => []);
    const rangeRows = await executeQuery(detailRangeSql, { fact: fcode, edt, dt, center }, season).catch(() => []);

    const rows = [];
    let srno = 0;
    const fmt2 = (v) => truncateDecimal(v, 2).toFixed(2);

    const buildRow = async (labelDate, pqty, rqty, dateForBal) => {
      const openDt = addDaysToYyyymmdd(toYyyymmddFromDmy(dateForBal), -1);
      let opbal = 0;
      if (openDt) {
        const ob = await executeQuery(openingSql, { fact: fcode, dt: openDt, center }, season).catch(() => []);
        if (ob && ob.length) opbal = Number(ob[0].CH_BALANCE || 0);
      }

      let clbal = 0;
      const cb = await executeQuery(closingSql, { fact: fcode, dt: toYyyymmddFromDmy(dateForBal), center }, season).catch(() => []);
      if (cb && cb.length) clbal = Number(cb[0].CH_BALANCE || 0);

      let tot = Number(rqty || 0) + clbal - opbal;
      tot = truncateDecimal(tot, 2);
      let dr = tot - Number(pqty || 0);
      dr = truncateDecimal(dr, 2);
      let perc = 0;
      if (dr !== 0 && Number(pqty || 0) > 0) perc = truncateDecimal((dr / Number(pqty || 0)) * 100, 2);

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

    return res.status(200).json({ success: true, data: rows, recordsets: [rows] });
  } catch (error) {
    if (typeof next === 'function') return next(error);
    throw error;
  }
};

// ============================================================================
// Driage Clerk Detail
// ============================================================================
exports.DriageClerkDetail = async (req, res, next) => {
  try {
    const season = req.user?.season || req.query?.season || req.body?.season || process.env.DEFAULT_SEASON || '2526';
    const fRaw = req.query?.FACT || req.query?.F_code || req.query?.F_Code || req.body?.FACT || req.body?.F_code || req.body?.F_Code || '';
    const dateRaw = req.query?.DATE || req.query?.Date || req.query?.date || req.body?.DATE || req.body?.Date || req.body?.date || '';
    const clerkRaw = req.query?.CLERK || req.query?.clerk || req.body?.CLERK || req.body?.clerk || '';

    const fcode = String(fRaw || '').trim();
    const clerk = String(clerkRaw || '').trim();
    const dateInfo = normalizeDmyInput(dateRaw);
    if (!fcode || fcode === '0') return res.status(200).json({ success: true, data: [], recordsets: [[]], message: 'Please select a Factory' });
    if (!clerk || clerk === '0') return res.status(200).json({ success: true, data: [], recordsets: [[]], message: 'Please select a Clerk' });
    if (!dateInfo) return res.status(200).json({ success: true, data: [], recordsets: [[]], message: 'Invalid Date' });

    const dt = dateInfo.yyyymmdd;

    const detailSql = `
      WITH PUR AS (
        SELECT M_CENTRE, MIN(CAST(M_DATE as Date)) Mfrom, MAX(CAST(M_DATE as Date)) MTill,
          ISNULL(SUM(ISNULL(M_GROSS,0) - ISNULL(M_TARE,0) - ISNULL(M_JOONA,0)), 0) PQTY
        FROM PURCHASE
        WHERE CONVERT(NVARCHAR, M_DATE,112) <= @dt
          AND M_FACTORY = @fact
          AND M_TARE_OPR = @clerk
        GROUP BY M_CENTRE
      ),
      REP AS (
        SELECT tt_center, MIN(CAST(tt_DpDate as Date)) TFrom, MAX(CAST(tt_DpDate as Date)) TTill,
          ISNULL(SUM(ISNULL(TT_GROSSWEIGHT,0) - ISNULL(TT_TAREWEIGHT,0) - ISNULL(TT_JOONAWEIGHT,0)), 0) RQTY
        FROM RECEIPT
        WHERE CONVERT(NVARCHAR, tt_DpDate,112) <= @dt
          AND TT_FACTORY = @fact
          AND tt_Clerk = @clerk
        GROUP BY tt_center
      )
      SELECT c_factory as factory, c_code, C_Name,
        CONVERT(varchar, (case when Mfrom > TFrom then TFrom else Mfrom end),103) MFrom,
        CONVERT(varchar, (case when MTill > TTill then MTill else TTill end),103) Till,
        ISNULL(SUM(PQTY),0) PQTY, ISNULL(SUM(RQTY),0) RQTY
      FROM PUR
      FULL OUTER JOIN REP ON M_CENTRE = tt_center
      JOIN Centre on c_code = M_CENTRE and c_code = tt_center
      WHERE c_factory = @fact
      GROUP BY c_factory, c_code, C_Name, Mfrom, MTill, TFrom, TTill
      ORDER BY (case when Mfrom > TFrom then TFrom else Mfrom end),
               (case when MTill > TTill then MTill else TTill end)`;

    const openingSql = `
      SELECT TOP 1 MAX(CH_CHALLAN) AS CH_CHALLAN, ISNULL(CH_BALANCE,0) AS CH_BALANCE
      FROM CHALLAN_FINAL
      WHERE Ch_Cancel = 0
        AND CH_FACTORY = @fact
        AND CONVERT(NVARCHAR, CH_DEP_DATE,112) <= @dt
        AND Ch_Centre = @centre
      GROUP BY CH_BALANCE
      ORDER BY MAX(CH_CHALLAN) DESC`;

    const closingSql = `
      SELECT TOP 1 MAX(CH_CHALLAN) AS CH_CHALLAN, ISNULL(CH_BALANCE,0) AS CH_BALANCE
      FROM CHALLAN_FINAL
      WHERE Ch_Cancel = 0
        AND CH_FACTORY = @fact
        AND CONVERT(NVARCHAR, CH_DEP_DATE,112) = @dt
        AND CH_CENTRE = @centre
      GROUP BY CH_BALANCE
      ORDER BY CH_CHALLAN DESC`;

    const rowsRaw = await executeQuery(detailSql, { fact: fcode, dt, clerk }, season).catch(() => []);
    const rows = [];
    let srno = 0;
    const fmt2 = (v) => truncateDecimal(v, 2).toFixed(2);

    for (const r of rowsRaw || []) {
      srno += 1;
      const mfrom = String(r.MFrom || '').trim();
      const till = String(r.Till || '').trim();
      const centreCode = String(r.c_code || r.C_CODE || '').trim();
      const pqty = Number(r.PQTY || 0);
      const rqty = Number(r.RQTY || 0);

      let opbal = 0;
      const openDt = addDaysToYyyymmdd(toYyyymmddFromDmy(mfrom), -1);
      if (openDt) {
        const ob = await executeQuery(openingSql, { fact: fcode, dt: openDt, centre: centreCode }, season).catch(() => []);
        if (ob && ob.length && fcode !== '51') opbal = Number(ob[0].CH_BALANCE || 0);
      }

      let clbal = 0;
      const closeDt = toYyyymmddFromDmy(till);
      if (closeDt) {
        const cb = await executeQuery(closingSql, { fact: fcode, dt: closeDt, centre: clerk }, season).catch(() => []);
        if (cb && cb.length && fcode !== '51') clbal = Number(cb[0].CH_BALANCE || 0);
      }

      let totrqty = rqty + clbal - opbal;
      totrqty = truncateDecimal(totrqty, 2);
      let drqty = totrqty - pqty;
      drqty = truncateDecimal(drqty, 2);
      let perc = 0;
      if (drqty !== 0 && pqty > 0) perc = truncateDecimal((drqty / pqty) * 100, 2);

      rows.push({
        SLNO: String(srno),
        clerk,
        CCode: centreCode,
        CName: String(r.C_Name || ''),
        MFrom: mfrom,
        Till: till,
        OQty: fmt2(opbal),
        PQty: fmt2(pqty),
        RQty: fmt2(rqty),
        CLBal: fmt2(clbal),
        TRQty: fmt2(totrqty),
        DRQty: fmt2(drqty),
        ToDRQty: fmt2(drqty),
        PER: fmt2(perc)
      });
    }

    return res.status(200).json({ success: true, data: rows, recordsets: [rows] });
  } catch (error) {
    if (typeof next === 'function') return next(error);
    throw error;
  }
};

// ============================================================================
// Driage Centre Detail
// ============================================================================
exports.DriageCentreDetail = async (req, res, next) => {
  try {
    const season = req.user?.season || req.query?.season || req.body?.season || process.env.DEFAULT_SEASON || '2526';
    const fRaw = req.query?.FACT || req.query?.F_code || req.query?.F_Code || req.body?.FACT || req.body?.F_code || req.body?.F_Code || '';
    const dateRaw = req.query?.DATE || req.query?.Date || req.query?.date || req.body?.DATE || req.body?.Date || req.body?.date || '';
    const centerRaw = req.query?.CENTER || req.query?.center || req.body?.CENTER || req.body?.center || '';

    const fcode = String(fRaw || '').trim();
    const center = String(centerRaw || '').trim();
    const dateInfo = normalizeDmyInput(dateRaw);
    if (!fcode || fcode === '0') return res.status(200).json({ success: true, data: [], recordsets: [[]], message: 'Please select a Factory' });
    if (!center || center === '0') return res.status(200).json({ success: true, data: [], recordsets: [[]], message: 'Please select a Center' });
    if (!dateInfo) return res.status(200).json({ success: true, data: [], recordsets: [[]], message: 'Invalid Date' });

    const dt = dateInfo.yyyymmdd;

    const centreSql = `
      WITH PUR AS (
        SELECT CAST(M_DATE as Date) MDATE,
          ISNULL(SUM(ISNULL(M_GROSS,0) - ISNULL(M_TARE,0) - ISNULL(M_JOONA,0)), 0) PQTY
        FROM PURCHASE
        JOIN CENTRE ON C_CODE = M_CENTRE AND C_FACTORY = M_FACTORY
        WHERE CONVERT(NVARCHAR, M_DATE,112) <= @dt
          AND M_FACTORY = @fact
          AND M_CENTRE = @center
          AND M_CENTRE != 100
        GROUP BY CAST(M_DATE as Date)
      ),
      REP AS (
        SELECT CAST(tt_DpDate as Date) TDATE,
          ISNULL(SUM(ISNULL(TT_GROSSWEIGHT,0) - ISNULL(TT_TAREWEIGHT,0) - ISNULL(TT_JOONAWEIGHT,0)), 0) RQTY
        FROM RECEIPT
        JOIN CENTRE ON C_CODE = TT_CENTER AND C_FACTORY = TT_FACTORY
        WHERE CONVERT(NVARCHAR, tt_DpDate,112) <= @dt
          AND TT_FACTORY = @fact
          AND TT_CENTER = @center
        GROUP BY CAST(tt_DpDate as Date)
      )
      SELECT
        CASE WHEN MDATE is null THEN CONVERT(varchar, TDATE,103) ELSE CONVERT(varchar, MDATE,103) END AS DATE,
        CASE WHEN PQTY is null THEN 0 ELSE PQTY END PQTY,
        CASE WHEN RQTY is null THEN 0 ELSE RQTY END RQTY
      FROM PUR FULL OUTER JOIN REP ON PUR.MDATE = REP.TDATE
      ORDER BY MDATE ASC`;

    const openingSql = `
      SELECT TOP 1 MAX(CH_CHALLAN) AS CH_CHALLAN, ISNULL(CH_BALANCE,0) AS CH_BALANCE
      FROM CHALLAN_FINAL
      WHERE Ch_Cancel = 0
        AND CH_FACTORY = @fact
        AND CONVERT(NVARCHAR, CH_DEP_DATE,112) <= @dt
        AND CH_CENTRE = @center
      GROUP BY CH_BALANCE
      ORDER BY MAX(CH_CHALLAN) DESC`;

    const closingSql = `
      SELECT MAX(CH_CHALLAN) AS CH_CHALLAN, ISNULL(CH_BALANCE,0) AS CH_BALANCE
      FROM CHALLAN_FINAL
      WHERE Ch_Cancel = 0
        AND CH_FACTORY = @fact
        AND CONVERT(NVARCHAR, CH_DEP_DATE,112) = @dt
        AND CH_CENTRE = @center
      GROUP BY CH_BALANCE
      ORDER BY CH_CHALLAN DESC`;

    const rowsRaw = await executeQuery(centreSql, { fact: fcode, dt, center }, season).catch(() => []);
    const rows = [];
    let srno = 0;
    const fmt2 = (v) => truncateDecimal(v, 2).toFixed(2);

    for (const r of rowsRaw || []) {
      srno += 1;
      const cdate = String(r.DATE || '').trim();
      const pqty = Number(r.PQTY || 0);
      const rqty = Number(r.RQTY || 0);

      let opbal = 0;
      const openDt = addDaysToYyyymmdd(toYyyymmddFromDmy(cdate), -1);
      if (openDt) {
        const ob = await executeQuery(openingSql, { fact: fcode, dt: openDt, center }, season).catch(() => []);
        if (ob && ob.length && fcode !== '51') opbal = Number(ob[0].CH_BALANCE || 0);
      }

      let clbal = 0;
      const closeDt = toYyyymmddFromDmy(cdate);
      if (closeDt) {
        const cb = await executeQuery(closingSql, { fact: fcode, dt: closeDt, center }, season).catch(() => []);
        if (cb && cb.length && fcode !== '51') clbal = Number(cb[0].CH_BALANCE || 0);
      }

      let totrqty = rqty + clbal - opbal;
      totrqty = truncateDecimal(totrqty, 2);
      let drqty = totrqty - pqty;
      drqty = truncateDecimal(drqty, 2);
      let perc = 0;
      if (drqty !== 0 && pqty > 0) perc = truncateDecimal((drqty / pqty) * 100, 2);

      rows.push({
        SLNO: String(srno),
        DATE: cdate,
        OQty: fmt2(opbal),
        PQty: fmt2(pqty),
        RQty: fmt2(rqty),
        CLBal: fmt2(clbal),
        TRQty: fmt2(totrqty),
        DRQty: fmt2(drqty),
        PER: fmt2(perc)
      });
    }

    return res.status(200).json({ success: true, data: rows, recordsets: [rows] });
  } catch (error) {
    if (typeof next === 'function') return next(error);
    throw error;
  }
};

// ============================================================================
// Driage Centre Clerk Detail
// ============================================================================
exports.DriageCentreClerkDetail = async (req, res, next) => {
  try {
    const season = req.user?.season || req.query?.season || req.body?.season || process.env.DEFAULT_SEASON || '2526';
    const fRaw = req.query?.F_code || req.query?.F_Code || req.body?.F_code || req.body?.F_Code || '';
    const dateRaw = req.query?.Date || req.query?.date || req.body?.Date || req.body?.date || '';

    const fcode = String(fRaw || '').trim();
    const dateInfo = normalizeDmyInput(dateRaw);
    if (!fcode || fcode === '0' || fcode.toLowerCase() === 'all') {
      return res.status(200).json({ success: true, data: [], recordsets: [[]], message: 'Please select a Factory' });
    }
    if (!dateInfo) {
      return res.status(200).json({ success: true, data: [], recordsets: [[]], message: 'Invalid Date' });
    }

    const dt = dateInfo.yyyymmdd;

    const centreBaseSql = `
      WITH PUR AS (
        SELECT M_CENTRE, MIN(CAST(M_DATE as Date)) Mfrom, MAX(CAST(M_DATE as Date)) MTill,
          ISNULL(SUM(ISNULL(M_GROSS,0) - ISNULL(M_TARE,0) - ISNULL(M_JOONA,0)), 0) PQTY
        FROM PURCHASE
        WHERE CONVERT(NVARCHAR, M_DATE,112) <= @dt
          AND M_FACTORY = @fact
        GROUP BY M_CENTRE
      ),
      REP AS (
        SELECT tt_center, MIN(CAST(tt_DpDate as Date)) TFrom, MAX(CAST(tt_DpDate as Date)) TTill,
          ISNULL(SUM(ISNULL(TT_GROSSWEIGHT,0) - ISNULL(TT_TAREWEIGHT,0) - ISNULL(TT_JOONAWEIGHT,0)), 0) RQTY
        FROM RECEIPT
        WHERE CONVERT(NVARCHAR, tt_DpDate,112) <= @dt
          AND TT_FACTORY = @fact
        GROUP BY tt_center
      )
      SELECT c_factory as factory, c_code, C_Name,
        CONVERT(varchar, MIN(MFrom),103) MFrom,
        CONVERT(varchar, MAX(MTill),103) Till,
        ISNULL(SUM(PQTY),0) PQTY, ISNULL(SUM(RQTY),0) RQTY
      FROM PUR
      FULL OUTER JOIN REP ON M_CENTRE = tt_center
      JOIN Centre on c_code = M_CENTRE and c_code = tt_center
      WHERE c_factory = @fact
      GROUP BY c_factory, c_code, C_Name
      ORDER BY c_code, MIN(MFrom), MAX(MTill)`;

    const openingSql = `
      SELECT TOP 1 MAX(CH_CHALLAN) AS CH_CHALLAN, ISNULL(CH_BALANCE,0) AS CH_BALANCE
      FROM CHALLAN_FINAL
      WHERE Ch_Cancel = 0
        AND CH_FACTORY = @fact
        AND CONVERT(NVARCHAR, CH_DEP_DATE,112) <= @dt
        AND Ch_Centre = @centre
      GROUP BY CH_BALANCE
      ORDER BY MAX(CH_CHALLAN) DESC`;

    const closingCentreSql = `
      SELECT TOP 1 MAX(CH_CHALLAN) AS CH_CHALLAN, ISNULL(CH_BALANCE,0) AS CH_BALANCE
      FROM CHALLAN_FINAL
      WHERE Ch_Cancel = 0
        AND CH_FACTORY = @fact
        AND CONVERT(NVARCHAR, CH_DEP_DATE,112) = @dt
        AND ch_centre = @centre
      GROUP BY CH_BALANCE
      ORDER BY MAX(CH_CHALLAN) DESC`;

    const clerkSummarySql = `
      WITH CEN AS (
        SELECT U_factory as Factory, u_code SUPVCODE, u_name as SUPVNAME
        FROM Users WHERE U_factory = @fact
      ),
      PUR AS (
        SELECT M_TARE_OPR, MIN(M_DATE) FM_DATE, MAX(M_DATE) TM_DATE,
          ISNULL(SUM(ISNULL(M_GROSS,0) - ISNULL(M_TARE,0) - ISNULL(M_JOONA,0)), 0) PQTY
        FROM PURCHASE
        WHERE CONVERT(NVARCHAR, M_DATE,112) <= @dt
          AND M_FACTORY = @fact
          AND M_CENTRE != 100
          AND M_CENTRE = @center
        GROUP BY M_TARE_OPR
      ),
      REP AS (
        SELECT tt_Clerk, MIN(tt_DpDate) Ftt_DpDate, MAX(tt_DpDate) Ttt_DpDate,
          ISNULL(SUM(ISNULL(TT_GROSSWEIGHT,0) - ISNULL(TT_TAREWEIGHT,0) - ISNULL(TT_JOONAWEIGHT,0)), 0) RQTY
        FROM RECEIPT
        WHERE CONVERT(NVARCHAR, tt_DpDate,112) <= @dt
          AND TT_FACTORY = @fact
          AND tt_center = @center
        GROUP BY tt_Clerk
      )
      SELECT Factory as C_FACTORY, SUPVCODE as C_CODE, SUPVNAME as C_NAME,
        CONVERT(varchar, FM_DATE,103) FM_DATE,
        CONVERT(varchar, TM_DATE,103) TM_DATE,
        ISNULL(PQTY,0) PQTY, ISNULL(RQTY,0) RQTY
      FROM CEN
      JOIN PUR on SUPVCODE = M_TARE_OPR
      FULL OUTER JOIN REP on M_TARE_OPR = tt_Clerk
      WHERE SUPVCODE is not null
      ORDER BY PUR.FM_DATE, PUR.TM_DATE asc`;

    const centres = await executeQuery(centreBaseSql, { fact: fcode, dt }, season).catch(() => []);
    const rows = [];
    let srno = 0;
    const fmt2 = (v) => truncateDecimal(v, 2).toFixed(2);

    for (const c of centres || []) {
      srno += 1;
      const centreCode = String(c.c_code || c.C_CODE || '').trim();
      const mfrom = String(c.MFrom || '').trim();
      const till = String(c.Till || '').trim();
      const pqty = Number(c.PQTY || 0);
      const rqty = Number(c.RQTY || 0);

      let opbal = 0;
      const openDt = addDaysToYyyymmdd(toYyyymmddFromDmy(mfrom), -1);
      if (openDt) {
        const ob = await executeQuery(openingSql, { fact: fcode, dt: openDt, centre: centreCode }, season).catch(() => []);
        if (ob && ob.length && fcode !== '51') opbal = Number(ob[0].CH_BALANCE || 0);
      }

      let clbal = 0;
      const closeDt = toYyyymmddFromDmy(till);
      if (closeDt) {
        const cb = await executeQuery(closingCentreSql, { fact: fcode, dt: closeDt, centre: centreCode }, season).catch(() => []);
        if (cb && cb.length && fcode !== '51') clbal = Number(cb[0].CH_BALANCE || 0);
      }

      let totrqty = rqty + clbal - opbal;
      totrqty = truncateDecimal(totrqty, 2);
      let drqty = totrqty - pqty;
      drqty = truncateDecimal(drqty, 2);
      let perc = 0;
      if (drqty !== 0 && pqty > 0) perc = truncateDecimal((drqty / pqty) * 100, 2);

      rows.push({
        SLNO: String(srno),
        Clerk: '',
        ClerkName: '',
        c_code: centreCode,
        C_Name: String(c.C_Name || ''),
        MFrom: mfrom,
        Till: till,
        PQty: fmt2(pqty),
        RQty: fmt2(rqty),
        TRQty: fmt2(totrqty),
        DRQty: fmt2(drqty),
        TODRQty: fmt2(drqty),
        PER: fmt2(perc)
      });

      const clerks = await executeQuery(clerkSummarySql, { fact: fcode, dt, center: centreCode }, season).catch(() => []);
      (clerks || []).forEach((k) => {
        const cpqty = Number(k.PQTY || 0);
        const crqty = Number(k.RQTY || 0);
        const cdr = truncateDecimal(crqty - cpqty, 2);
        let cperc = 0;
        if (cdr !== 0 && cpqty > 0) cperc = truncateDecimal((cdr / cpqty) * 100, 2);

        rows.push({
          SLNO: '',
          Clerk: String(k.C_CODE || ''),
          ClerkName: String(k.C_NAME || ''),
          c_code: '',
          C_Name: '',
          MFrom: String(k.FM_DATE || ''),
          Till: String(k.TM_DATE || ''),
          PQty: fmt2(cpqty),
          RQty: fmt2(crqty),
          TRQty: fmt2(crqty),
          DRQty: fmt2(cdr),
          TODRQty: fmt2(cdr),
          PER: fmt2(cperc)
        });
      });
    }

    return res.status(200).json({ success: true, data: rows, recordsets: [rows] });
  } catch (error) {
    if (typeof next === 'function') return next(error);
    throw error;
  }
};

// ============================================================================
// Budget Vs Actual (Distillery)
// ============================================================================
exports.BudgetVSActual = async (req, res, next) => {
  try {
    const season = req.user?.season || req.query?.season || req.body?.season || process.env.DEFAULT_SEASON || '2526';
    const fRaw = req.query?.F_code || req.query?.F_Code || req.body?.F_code || req.body?.F_Code || '0';
    const dateRaw = req.query?.date || req.query?.Date || req.body?.date || req.body?.Date || '';

    const fcode = String(fRaw || '0').trim();
    const dateInfo = normalizeDmyInput(dateRaw);
    if (!dateInfo) return res.status(200).json({ success: true, data: [], recordsets: [[]], message: 'Invalid Date' });

    const CDate = dateInfo.ymd; // yyyy-MM-dd

    const unitSql = fcode && fcode !== '0'
      ? `select f_Code,f_Name + ' (' + F_Short + ')' As F_Name,f_Name as FName from MI_Factory where ISDist=1 and f_code=@fcode`
      : `select f_Code,f_Name + ' (' + F_Short + ')' As F_Name,f_Name as FName from MI_Factory where ISDist=1 ORDER BY SN ASC`;

    const units = await executeQuery(unitSql, { fcode }, season).catch(() => []);
    if (!units || units.length === 0) {
      return res.status(200).json({ success: true, data: [], recordsets: [[]], message: 'Data Not Found' });
    }

    const weeklyDateSql = `
      select top 1
        CONVERT(varchar,WB_FromDate,103) fromdate,
        CONVERT(varchar,WB_ToDate,103) ToDate,
        CONVERT(varchar, cast(@cdate as date), 6) CDate
      from MI_WeeklyBudget
      where cast(WB_FromDate as Date) <= @cdate
        and cast(WB_ToDate as Date) >= @cdate`;

    let bfrom = '';
    let bto = '';
    const dtd = await executeQuery(weeklyDateSql, { cdate: CDate }, season).catch(() => []);
    if (dtd && dtd.length) {
      bfrom = String(dtd[0].fromdate || '').trim();
      bto = String(dtd[0].ToDate || '').trim();
    }

    if (!bfrom || !bto) {
      try {
        const proc = await executeProcedure('getFirstDate', { CDate }, season);
        const v = proc?.rows?.[0];
        const val = v ? Object.values(v)[0] : null;
        bfrom = String(val || CDate).trim();
      } catch {
        bfrom = CDate;
      }
      bto = CDate;
    }

    const fmtDMYtoDMMM = (dmy) => {
      const parsed = normalizeDmyInput(dmy);
      if (!parsed) return dmy;
      const [dd, mm, yyyy] = parsed.dmy.split('/');
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      const mmm = months[Number(mm) - 1] || mm;
      return `${dd}-${mmm}-${yyyy}`;
    };

    const bfromLabel = fmtDMYtoDMMM(bfrom);
    const btoLabel = fmtDMYtoDMMM(bto);
    const bfromSql = (normalizeDmyInput(bfrom)?.ymd) || (normalizeDmyInput(bfromLabel)?.ymd) || bfrom || CDate;
    const monLabel = fmtDMYtoDMMM(dateInfo.dmy);

    const toNum = (v) => {
      const n = Number(v);
      return Number.isFinite(n) ? n : 0;
    };
    const fmt2 = (v) => Number(toNum(v)).toFixed(2);

    const weeklyBudgetSql = `
      select isnull(WB_BudgetAmount,0) WB_BudgetAmount
      from MI_WeeklyBudget
      where WB_Factory=@fact and cast(WB_FromDate as Date)<=@cdate and cast(WB_ToDate as Date)>=@cdate`;

    const weeklyActualSql = `
      select isnull(sum(Dist_RSProd_OnDate)+sum(Dist_AAProd_OnDate),0) as ABWeekly
      from MI_Distillery_Report
      where Dist_Unit=@fact and cast(Dist_Date as date) between @from and @to`;

    const monthlyBudgetSql = `
      select isnull(sum(WB_BudgetAmount),0) BMonthly
      from MI_WeeklyBudget
      where WB_Factory=@fact
        and cast(WB_FromDate as Date)>= (select dateadd(mm, -1, dateadd(dd, +1, eomonth(@cdate))))
        and cast(WB_ToDate as Date)<= (select eomonth(@cdate))`;

    const monthlyActualSql = `
      select isnull(sum(Dist_RSProd_OnDate)+sum(Dist_AAProd_OnDate),0) as ABWeekly
      from MI_Distillery_Report
      where Dist_Unit=@fact
        and cast(Dist_Date as date) between (select dateadd(mm, -1, dateadd(dd, +1, eomonth(@cdate))))
        and (select eomonth(@cdate))`;

    const yearlyBudgetSql = `
      select isnull(sum(WB_BudgetAmount),0) BMonthly
      from MI_WeeklyBudget
      where WB_Factory=@fact and cast(WB_FromDate as Date)>='2021-11-01' and cast(WB_ToDate as Date)<='2022-10-31'`;

    const yearlyActualSql = `
      select isnull(sum(Dist_RSProd_OnDate)+sum(Dist_AAProd_OnDate),0) as ABWeekly
      from MI_Distillery_Report
      where Dist_Unit=@fact and cast(Dist_Date as date) between '2021-11-01' and '2022-10-31'`;

    const preYearSql = `
      select isnull(ActualAmt,0) ActualAmt
      from MI_Distillery_PreY_Actual
      where F_Code=@fact`;

    const remarkSql = `
      select Dist_Remark
      from MI_Distillery_Report
      where Dist_Unit=@fact and cast(Dist_Date as date)=@cdate`;

    const rows = [];
    // Header row
    rows.push({
      FACTORY: 'Distillery Unit',
      BudgetWeeklys: `(${bfromLabel} To ${btoLabel})`,
      ActualWeeklys: `(${bfromLabel} To ${btoLabel})`,
      BudgetMonthlys: `(${monLabel})`,
      ActualMonthlys: `(${monLabel})`,
      BudgetYearlys: '(Nav-Oct)',
      ActualYearlys: '(Nav-Oct)',
      ActualPreYearlys: '(Nav-Oct)',
      Remark: ''
    });

    for (let a = 0; a < units.length; a++) {
      const unit = units[a];
      const fact = String(unit.f_Code || unit.F_Code || '').trim();
      const name = String(unit.FName || unit.F_NAME || unit.F_Name || '').trim();

      const wb = await executeQuery(weeklyBudgetSql, { fact, cdate: CDate }, season).catch(() => []);
      const wa = await executeQuery(weeklyActualSql, { fact, from: bfromSql, to: CDate }, season).catch(() => []);
      const mb = await executeQuery(monthlyBudgetSql, { fact, cdate: CDate }, season).catch(() => []);
      const ma = await executeQuery(monthlyActualSql, { fact, cdate: CDate }, season).catch(() => []);
      const yb = await executeQuery(yearlyBudgetSql, { fact }, season).catch(() => []);
      const ya = await executeQuery(yearlyActualSql, { fact }, season).catch(() => []);
      const py = await executeQuery(preYearSql, { fact }, season).catch(() => []);
      const rm = await executeQuery(remarkSql, { fact, cdate: CDate }, season).catch(() => []);

      const row = {
        FACTORY: name,
        BudgetWeeklys: fmt2(wb?.[0]?.WB_BudgetAmount || 0),
        ActualWeeklys: fmt2(wa?.[0]?.ABWeekly || 0),
        BudgetMonthlys: fmt2(mb?.[0]?.BMonthly || 0),
        ActualMonthlys: fmt2(ma?.[0]?.ABWeekly || 0),
        BudgetYearlys: fmt2(yb?.[0]?.BMonthly || 0),
        ActualYearlys: fmt2(ya?.[0]?.ABWeekly || 0),
        ActualPreYearlys: fmt2(py?.[0]?.ActualAmt || 0),
        Remark: String(rm?.[0]?.Dist_Remark || '')
      };
      rows.push(row);

      const sumRange = (startIdx) => {
        const sum = { bw: 0, aw: 0, bm: 0, am: 0, by: 0, ay: 0, py: 0 };
        for (let i = startIdx; i < rows.length; i++) {
          const r = rows[i];
          sum.bw += toNum(r.BudgetWeeklys);
          sum.aw += toNum(r.ActualWeeklys);
          sum.bm += toNum(r.BudgetMonthlys);
          sum.am += toNum(r.ActualMonthlys);
          sum.by += toNum(r.BudgetYearlys);
          sum.ay += toNum(r.ActualYearlys);
          sum.py += toNum(r.ActualPreYearlys);
        }
        return sum;
      };

      if (a === 1) {
        const s = sumRange(1);
        rows.push({
          FACTORY: 'Sub Total- West',
          BudgetWeeklys: fmt2(s.bw),
          ActualWeeklys: fmt2(s.aw),
          BudgetMonthlys: fmt2(s.bm),
          ActualMonthlys: fmt2(s.am),
          BudgetYearlys: fmt2(s.by),
          ActualYearlys: fmt2(s.ay),
          ActualPreYearlys: fmt2(s.py),
          Remark: ''
        });
      }

      if (a === 4) {
        const s = sumRange(4);
        rows.push({
          FACTORY: 'Sub Total- Central',
          BudgetWeeklys: fmt2(s.bw),
          ActualWeeklys: fmt2(s.aw),
          BudgetMonthlys: fmt2(s.bm),
          ActualMonthlys: fmt2(s.am),
          BudgetYearlys: fmt2(s.by),
          ActualYearlys: fmt2(s.ay),
          ActualPreYearlys: fmt2(s.py),
          Remark: ''
        });
      }

      if (a === 5) {
        const s = sumRange(8);
        rows.push({
          FACTORY: 'Sub Total- East',
          BudgetWeeklys: fmt2(s.bw),
          ActualWeeklys: fmt2(s.aw),
          BudgetMonthlys: fmt2(s.bm),
          ActualMonthlys: fmt2(s.am),
          BudgetYearlys: fmt2(s.by),
          ActualYearlys: fmt2(s.ay),
          ActualPreYearlys: fmt2(s.py),
          Remark: ''
        });

        const pickIdx = [3, 7, 9];
        const g = { bw: 0, aw: 0, bm: 0, am: 0, by: 0, ay: 0, py: 0 };
        pickIdx.forEach((i) => {
          const r = rows[i];
          if (!r) return;
          g.bw += toNum(r.BudgetWeeklys);
          g.aw += toNum(r.ActualWeeklys);
          g.bm += toNum(r.BudgetMonthlys);
          g.am += toNum(r.ActualMonthlys);
          g.by += toNum(r.BudgetYearlys);
          g.ay += toNum(r.ActualYearlys);
          g.py += toNum(r.ActualPreYearlys);
        });
        rows.push({
          FACTORY: 'G.Total- Total',
          BudgetWeeklys: fmt2(g.bw),
          ActualWeeklys: fmt2(g.aw),
          BudgetMonthlys: fmt2(g.bm),
          ActualMonthlys: fmt2(g.am),
          BudgetYearlys: fmt2(g.by),
          ActualYearlys: fmt2(g.ay),
          ActualPreYearlys: fmt2(g.py),
          Remark: ''
        });
      }
    }

    return res.status(200).json({ success: true, data: rows, recordsets: [rows] });
  } catch (error) {
    if (typeof next === 'function') return next(error);
    throw error;
  }
};

// ============================================================================
// Driage Clerk + Centre Detail (ported from BajajMic ReportController)
// ============================================================================
exports.DriageClerkCentreDetail = async (req, res, next) => {
  try {
    const season = req.user?.season || req.query?.season || req.body?.season || process.env.DEFAULT_SEASON || '2526';
    const fRaw = req.query?.F_code || req.query?.F_Code || req.query?.unit || req.body?.F_code || req.body?.F_Code || req.body?.unit || '';
    const dateRaw = req.query?.Date || req.query?.date || req.body?.Date || req.body?.date || '';

    const fcode = String(fRaw || '').trim();
    const dateInfo = normalizeDmyInput(dateRaw);

    if (!fcode || fcode === '0' || fcode.toLowerCase() === 'all') {
      return res.status(200).json({
        API_STATUS: 'ERROR',
        Message: 'Please Select Factory !!',
        Data: [],
        success: false,
        data: []
      });
    }
    if (!dateInfo) {
      return res.status(200).json({
        API_STATUS: 'ERROR',
        Message: 'Invalid Date',
        Data: [],
        success: false,
        data: []
      });
    }

    const dt = dateInfo.yyyymmdd;

    const clerkSql = `
      WITH PUR AS (
        SELECT M_TARE_OPR,
          MIN(CAST(M_DATE as date)) MFrom,
          MAX(CAST(M_DATE as date)) MTill,
          ISNULL(SUM(ISNULL(M_GROSS,0) - ISNULL(M_TARE,0) - ISNULL(M_JOONA,0)), 0) PQTY
        FROM PURCHASE
        WHERE CONVERT(NVARCHAR, M_DATE,112) <= @dt
          AND M_FACTORY = @fact
          AND M_CENTRE != 100
        GROUP BY M_TARE_OPR
      ),
      REP AS (
        SELECT tt_Clerk,
          MAX(CAST(tt_DpDate as date)) TFrom,
          MAX(CAST(tt_DpDate as date)) TTill,
          ISNULL(SUM(ISNULL(TT_GROSSWEIGHT,0) - ISNULL(TT_TAREWEIGHT,0) - ISNULL(TT_JOONAWEIGHT,0)), 0) RQTY
        FROM RECEIPT
        WHERE CONVERT(NVARCHAR, tt_DpDate,112) <= @dt
          AND TT_FACTORY = @fact
        GROUP BY tt_Clerk
      )
      SELECT u_factory as factory, u_code, u_Name,
        CONVERT(varchar, MIN(MFrom),103) MFrom,
        CONVERT(varchar, MAX(MTill),103) Till,
        ISNULL(SUM(PQTY),0) PQTY,
        ISNULL(SUM(RQTY),0) RQTY
      FROM PUR
      FULL OUTER JOIN REP ON M_TARE_OPR = tt_Clerk
      JOIN users ON u_code = M_TARE_OPR AND u_code = tt_Clerk
      WHERE U_factory = @fact
      GROUP BY u_factory, u_code, u_Name
      ORDER BY MIN(MFrom), MAX(MTill)`;

    const clerkRows = await executeQuery(clerkSql, { fact: fcode, dt }, season).catch(() => []);
    if (!clerkRows || clerkRows.length === 0) {
      return res.status(200).json({
        API_STATUS: 'ERROR',
        Message: 'Data Not Found !!',
        Data: [],
        success: false,
        data: []
      });
    }

    const centreSql = `
      WITH CEN AS (
        SELECT C_factory as Factory, C_code SUPVCODE, C_name as SUPVNAME
        FROM Centre
        WHERE C_factory = @fact
      ),
      PUR AS (
        SELECT M_Centre,
          MIN(M_DATE) FM_DATE,
          MAX(M_DATE) TM_DATE,
          ISNULL(SUM(ISNULL(M_GROSS,0) - ISNULL(M_TARE,0) - ISNULL(M_JOONA,0)), 0) PQTY
        FROM PURCHASE
        WHERE CONVERT(NVARCHAR, M_DATE,112) <= @dt
          AND M_FACTORY = @fact
          AND M_CENTRE != 100
          AND M_TARE_OPR = @clerk
        GROUP BY M_Centre
      ),
      REP AS (
        SELECT tt_center,
          MIN(tt_DpDate) Ftt_DpDate,
          MAX(tt_DpDate) Ttt_DpDate,
          ISNULL(SUM(ISNULL(TT_GROSSWEIGHT,0) - ISNULL(TT_TAREWEIGHT,0) - ISNULL(TT_JOONAWEIGHT,0)), 0) RQTY
        FROM RECEIPT
        WHERE CONVERT(NVARCHAR, tt_DpDate,112) <= @dt
          AND TT_FACTORY = @fact
          AND tt_Clerk = @clerk
        GROUP BY tt_center
      )
      SELECT Factory as C_FACTORY, SUPVCODE as C_CODE, SUPVNAME as C_NAME,
        CONVERT(varchar, FM_DATE,103) FM_DATE,
        CONVERT(varchar, TM_DATE,103) TM_DATE,
        ISNULL(PQTY,0) PQTY,
        ISNULL(RQTY,0) RQTY
      FROM CEN
      JOIN PUR on SUPVCODE = M_Centre
      FULL OUTER JOIN REP on tt_center = M_Centre
      WHERE SUPVCODE is not null
      ORDER BY PUR.FM_DATE, PUR.TM_DATE asc`;

    const openingSql = `
      SELECT TOP 1 MAX(CH_CHALLAN) AS CH_CHALLAN, ISNULL(CH_BALANCE,0) AS CH_BALANCE
      FROM CHALLAN_FINAL
      WHERE Ch_Cancel = 0
        AND CH_FACTORY = @fact
        AND CONVERT(NVARCHAR, CH_DEP_DATE,112) <= @dt
        AND ch_op_code = @clerk
      GROUP BY CH_BALANCE
      ORDER BY MAX(CH_CHALLAN) DESC`;

    const closingSql = `
      SELECT TOP 1 MAX(CH_CHALLAN) AS CH_CHALLAN, ISNULL(CH_BALANCE,0) AS CH_BALANCE
      FROM CHALLAN_FINAL
      WHERE Ch_Cancel = 0
        AND CH_FACTORY = @fact
        AND CONVERT(NVARCHAR, CH_DEP_DATE,112) = @dt
        AND ch_op_code = @clerk
      GROUP BY CH_BALANCE
      ORDER BY MAX(CH_CHALLAN) DESC`;

    const results = [];
    const fmt = (v) => truncateDecimal(v, 2).toFixed(2);

    for (const row of clerkRows) {
      const clerkCode = String(row.u_code || row.U_code || row.U_CODE || '').trim();
      const clerkName = String(row.u_Name || row.U_Name || row.U_NAME || '').trim();
      const mFrom = String(row.MFrom || row.mfrom || '').trim();
      const mTill = String(row.Till || row.till || '').trim();
      if (!clerkCode) continue;

      const opRows = await executeQuery(openingSql, { fact: fcode, clerk: clerkCode, dt: addDaysToYyyymmdd(dt, -1) }, season).catch(() => []);
      const clRows = await executeQuery(closingSql, { fact: fcode, clerk: clerkCode, dt }, season).catch(() => []);
      const opBal = Number(opRows?.[0]?.CH_BALANCE || 0);
      const clBal = Number(clRows?.[0]?.CH_BALANCE || 0);

      const pqty = truncateDecimal(Number(row.PQTY || 0), 2);
      const rqty = truncateDecimal(Number(row.RQTY || 0), 2);
      const totRqty = truncateDecimal(rqty + clBal - opBal, 2);
      const dqty = truncateDecimal(totRqty - pqty, 2);
      const perc = (dqty !== 0 && pqty > 0) ? truncateDecimal((dqty / pqty) * 100, 2) : 0;

      results.push({
        clerkCode,
        clerkName,
        centreCode: '',
        centreName: '',
        weighed: fmt(pqty),
        crushed: fmt(rqty),
        driage: fmt(dqty),
        percent: fmt(perc),
        MFrom: mFrom,
        Till: mTill
      });

      const centres = await executeQuery(
        centreSql,
        { fact: fcode, clerk: clerkCode, dt },
        season
      ).catch(() => []);

      (centres || []).forEach((c) => {
        const cpqty = truncateDecimal(Number(c.PQTY || 0), 2);
        const crqty = truncateDecimal(Number(c.RQTY || 0), 2);
        const cdqty = truncateDecimal(crqty - cpqty, 2);
        const cperc = (cdqty !== 0 && cpqty > 0) ? truncateDecimal((cdqty / cpqty) * 100, 2) : 0;

        results.push({
          clerkCode,
          clerkName,
          centreCode: String(c.C_CODE || '').trim(),
          centreName: String(c.C_NAME || '').trim(),
          weighed: fmt(cpqty),
          crushed: fmt(crqty),
          driage: fmt(cdqty),
          percent: fmt(cperc)
        });
      });
    }

    if (!results.length) {
      return res.status(200).json({
        API_STATUS: 'ERROR',
        Message: 'Data Not Found !!',
        Data: [],
        success: false,
        data: []
      });
    }

    return res.status(200).json({
      API_STATUS: 'OK',
      Message: 'Success',
      Data: results,
      success: true,
      data: results
    });
  } catch (error) {
    if (typeof next === 'function') return next(error);
    throw error;
  }
};

/**
 * HourlyCaneArrival - mirrors ReportController.HourlyCaneArrivalReport (BajajMIS)
 * Uses MI_Hours + GetHourlyArrivalData logic and builds Shift A/B/C totals.
 */
exports.HourlyCaneArrival = async (req, res, next) => {
  try {
    const season = req.user?.season || req.query?.season || req.body?.season || process.env.DEFAULT_SEASON || '2526';
    const p = { ...(req.query || {}), ...(req.body || {}) };
    const fcode = String(p.F_code ?? p.F_Code ?? p.unit ?? p.factory ?? 'All').trim();
    const rawDate = String(p.Fdate ?? p.Date ?? p.date ?? '').trim();
    const sqlDate = toSqlDateAnalysis(rawDate);

    if (!sqlDate) return res.status(200).json({ status: 'error', message: 'Invalid date' });

    const parseDate = (ymd) => {
      const [y, m, d] = String(ymd).split('-').map((v) => parseInt(v, 10));
      return new Date(y, (m || 1) - 1, d || 1);
    };
    const formatYMD = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    const formatDMY = (d) => `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;

    const baseDate = parseDate(sqlDate);
    const d1 = new Date(baseDate);
    const d2 = new Date(baseDate); d2.setDate(d2.getDate() - 1);
    const d3 = new Date(baseDate); d3.setDate(d3.getDate() - 2);

    const CURDATE = formatYMD(d1);
    const ODBDT = formatYMD(d2);
    const TDBDT = formatYMD(d3);

    const hoursSql = `
      select DIS_HOU,hours,
      0 as TwoDBeforeCart,0 as TwoDBeforeTrolly,0 as TwoDBeforeTruck,
      0 as OneDBeforeCart,0 as OneDBeforeTrolly,0 as OneDBeforeTruck,
      0 as RDBeforeCart,0 as RDBeforeTrolly,0 as RDBeforeTruck
      from MI_Hours order by LABSN`;
    const hoursRows = await executeQuery(hoursSql, {}, season).catch(() => []);

    const purchaseTokDtColRaw = await resolveColumn(season, 'Purchase', [
      'm_tokdatetime', 'M_TOKDateTime', 'M_TokDateTime', 'M_TokDatetime'
    ], 'm_tokdatetime');  
    const purchaseTokDateColRaw = await resolveColumn(season, 'Purchase', [
      'm_tok_dt', 'M_TOK_DT', 'M_Tok_DT', 'M_DATE'
    ], 'm_tok_dt');

    const grossTokDtColRaw = await resolveColumn(season, 'gross', [
      'G_TokDatetime', 'G_TokDateTime', 'G_TokDDate'
    ], 'G_TokDatetime');
    const grossTokDateColRaw = await resolveColumn(season, 'gross', [
      'G_TokDDate', 'G_TokDatetime', 'G_TokDateTime'
    ], 'G_TokDatetime');

    const tokenHourColRaw = await resolveColumn(season, 'Token', [
      'T_Cr_Date', 'T_CRDATE', 'T_CrDate'
    ], 'T_Cr_Date');
    const tokenDateColRaw = await resolveColumn(season, 'Token', [
      'T_Date', 'T_DATE', 'T_Cr_Date'
    ], 'T_Date');

    const receiptTokDtColRaw = await resolveColumn(season, 'Receipt', [
      'tt_TokDatetime', 'TT_TokDatetime', 'tt_tokdatetime', 'TT_DATE', 'TT_TARE_DT'
    ], 'tt_TokDatetime');
    const receiptTokDateColRaw = await resolveColumn(season, 'Receipt', [
      'tt_tok_Date', 'TT_DATE', 'tt_Date', 'TT_TARE_DT', 'tt_TokDatetime'
    ], 'TT_DATE');

    const tTokenHourColRaw = await resolveColumn(season, 'T_Token', [
      'TT_CRDATE', 'TT_CrDate', 'TT_DATE'
    ], 'TT_CRDATE');
    const tTokenDateColRaw = await resolveColumn(season, 'T_Token', [
      'TT_DATE', 'TT_CRDATE'
    ], 'TT_DATE');

    const purchaseTokDtCol = `[${purchaseTokDtColRaw}]`;
    const purchaseTokDateCol = `[${purchaseTokDateColRaw}]`;
    const grossTokDtCol = `[${grossTokDtColRaw}]`;
    const grossTokDateCol = `[${grossTokDateColRaw}]`;
    const tokenHourCol = `[${tokenHourColRaw}]`;
    const tokenDateCol = `[${tokenDateColRaw}]`;
    const receiptTokDtCol = `[${receiptTokDtColRaw}]`;
    const receiptTokDateCol = `[${receiptTokDateColRaw}]`;
    const tTokenHourCol = `[${tTokenHourColRaw}]`;
    const tTokenDateCol = `[${tTokenDateColRaw}]`;

    const arrivalSql = `
      with cte as
      (Select HH,SUM(CART)CART,SUM(TROLLY)TROLLY from
      (select cast(Format(${purchaseTokDtCol}, 'HH') as int)HH,
      (CASE WHEN md_groupcode in(1) THEN 1 ELSE 0 END)CART,
      (CASE WHEN md_groupcode in(2,3) THEN 1 ELSE 0 END)TROLLY from Purchase
       JOIN Mode ON MD_CODE = M_MODE and md_factory=M_FACTORY WHERE M_CENTRE = 100 and CAST(${purchaseTokDateCol} AS DATE) = @Date and (@Unit='All' OR @Unit='0' OR M_FACTORY= @Unit) 
       UNION ALL  
       select cast(Format(${grossTokDtCol}, 'HH') as int)HH,(CASE WHEN md_groupcode = 1 THEN 1 ELSE 0 END)CART,(CASE WHEN md_groupcode in(2,3) THEN
       1 ELSE 0 END)TROLLY from gross JOIN Mode ON MD_CODE = G_ModSupp and md_factory=G_Factory WHERE CAST(${grossTokDateCol} AS DATE) = @Date and (@Unit='All' OR @Unit='0' OR G_Factory= @Unit) 
       UNION ALL 
       select cast(Format(${tokenHourCol}, 'HH') as int)HH, (CASE WHEN md_groupcode = 1 THEN 1 ELSE 0 END)CART, (CASE WHEN md_groupcode in(2,3) 
       THEN 1 ELSE 0 END)TROLLY from Token JOIN Mode ON MD_CODE = T_ModSupp and md_factory=T_Factory WHERE CAST(${tokenDateCol} AS DATE) = @Date and (@Unit='All' OR @Unit='0' OR T_Factory= @Unit))x 
      GROUP BY HH )
       ,ct1 as( Select HH,SUM(T_TRUCK)T_TRUCK FROM ( select cast(Format(${receiptTokDtCol},'HH') as int)HH,1 T_TRUCK  
       from Receipt where CAST(${receiptTokDateCol} AS DATE) = @Date  and (@Unit='All' OR @Unit='0' OR tt_factory= @Unit)
       UNION ALL 
       select cast(Format(${tTokenHourCol},'HH') as int)HH,1 T_TRUCK from T_Token where CAST(${tTokenDateCol} AS DATE) = @Date  and (@Unit='All' OR @Unit='0' OR tt_factory= @Unit))x 
       GROUP BY HH)select isnull((case when isnull(cte.HH,'')= '' then ct1.HH when isnull(cte.HH,'')= '' then cte.HH else  cte.HH end ),0)HHH,
       isnull(CART,0)CART,isnull(TROLLY,0)TROLLY,isnull(T_TRUCK,0)Truck   from cte full outer join   ct1 on  cte.HH= ct1.HH   
       order by (case when isnull(cte.HH,'')= '' then ct1.HH when isnull(cte.HH,'')= '' then cte.HH else  cte.HH end )`;

    const getHourlyArrivalMap = async (unit, date) => {
      const rows = await executeQuery(arrivalSql, { Unit: unit, Date: date }, season).catch(() => []);
      const map = new Map();
      if (rows && rows.length) {
        rows.forEach((r) => {
          const h = Number(r.HHH);
          if (!Number.isNaN(h)) map.set(h, r);
        });
      }
      return map;
    };

    const dt = hoursRows.map((r) => ({
      DIS_HOU: r.DIS_HOU,
      hours: Number(r.hours),
      TwoDBeforeCart: 0, TwoDBeforeTrolly: 0, TwoDBeforeTruck: 0,
      OneDBeforeCart: 0, OneDBeforeTrolly: 0, OneDBeforeTruck: 0,
      RDBeforeCart: 0, RDBeforeTrolly: 0, RDBeforeTruck: 0
    }));

    const t2Map = await getHourlyArrivalMap(fcode, TDBDT);
    const t1Map = await getHourlyArrivalMap(fcode, ODBDT);
    const t0Map = await getHourlyArrivalMap(fcode, CURDATE);

    for (const row of dt) {
      let hour = String(row.hours);
      if (hour === '24') hour = '0';
      const h = Number(hour);

      const t2 = t2Map.get(h);
      if (t2) {
        row.TwoDBeforeCart = Number(t2.CART) || 0;
        row.TwoDBeforeTrolly = Number(t2.TROLLY) || 0;
        row.TwoDBeforeTruck = Number(t2.Truck) || 0;
      }
      const t1 = t1Map.get(h);
      if (t1) {
        row.OneDBeforeCart = Number(t1.CART) || 0;
        row.OneDBeforeTrolly = Number(t1.TROLLY) || 0;
        row.OneDBeforeTruck = Number(t1.Truck) || 0;
      }
      const t0 = t0Map.get(h);
      if (t0) {
        row.RDBeforeCart = Number(t0.CART) || 0;
        row.RDBeforeTrolly = Number(t0.TROLLY) || 0;
        row.RDBeforeTruck = Number(t0.Truck) || 0;
      }
    }

    const columns = [
      'TwoDBeforeCart', 'TwoDBeforeTrolly', 'TwoDBeforeTruck',
      'OneDBeforeCart', 'OneDBeforeTrolly', 'OneDBeforeTruck',
      'RDBeforeCart', 'RDBeforeTrolly', 'RDBeforeTruck'
    ];

    const sdt = [];
    let cout = 0;
    for (let i = 0; i < dt.length; i++) {
      let DR1 = {};
      const Nhours = Number(dt[i].hours);

      if (cout === 0 || cout < 8) {
        cout++;
        DR1 = { ...dt[i] };

        if (cout === 8 && Nhours < 6) {
          sdt.push(DR1);
          DR1 = {};
          columns.forEach((col) => {
            const sum = sdt
              .filter((y) => y.hours >= 22 || (y.hours < 6 && y.hours !== 0))
              .reduce((acc, y) => acc + (Number(y[col]) || 0), 0);
            DR1[col] = sum;
          });
          DR1.DIS_HOU = 'Shift C';
          DR1.hours = 0;
        }
      } else {
        if (Nhours >= 6 && Nhours <= 14) {
          columns.forEach((col) => {
            const sum = sdt
              .filter((y) => y.hours >= 6 && y.hours <= 14)
              .reduce((acc, y) => acc + (Number(y[col]) || 0), 0);
            DR1[col] = sum;
          });
          DR1.DIS_HOU = 'Shift A';
          DR1.hours = 0;
          sdt.push(DR1);
          cout = 0;
          DR1 = { ...dt[i] };
          cout++;
        } else if (Nhours > 14 && Nhours <= 22) {
          columns.forEach((col) => {
            const sum = sdt
              .filter((y) => y.hours >= 14 && y.hours < 22)
              .reduce((acc, y) => acc + (Number(y[col]) || 0), 0);
            DR1[col] = sum;
          });
          DR1.DIS_HOU = 'Shift B';
          DR1.hours = 0;
          sdt.push(DR1);
          cout = 0;
          DR1 = { ...dt[i] };
          cout++;
        } else {
          DR1 = { ...dt[i] };
        }
      }
      sdt.push(DR1);
    }

    const grandTotals = {
      TwoDBeforeCart: 0, TwoDBeforeTrolly: 0, TwoDBeforeTruck: 0,
      OneDBeforeCart: 0, OneDBeforeTrolly: 0, OneDBeforeTruck: 0,
      RDBeforeCart: 0, RDBeforeTrolly: 0, RDBeforeTruck: 0
    };
    sdt
      .filter((row) => Number(row.hours) === 0)
      .forEach((row) => {
        columns.forEach((col) => {
          grandTotals[col] += Number(row[col]) || 0;
        });
      });

    return res.status(200).json({
      status: 'success',
      data: sdt,
      grandTotals,
      dates: {
        date1: formatDMY(d1),
        date2: formatDMY(d2),
        date3: formatDMY(d3)
      }
    });
  } catch (error) {
    if (typeof next === 'function') return next(error);
    throw error;
  }
};

exports.LoansummaryRpt = async (req, res, next) => {
  try {
    const season = req.user?.season || req.query?.season || req.body?.season || process.env.DEFAULT_SEASON || '2526';
    const params = { ...(req.query || {}), ...(req.body || {}) };
    const fCodeRaw = String(params.F_code || params.F_Code || params.FACT || params.factory || '0').trim();
    const reportType = String(params.ReportType || params.reportType || '1').trim();
    const fromRaw = String(params.FromDate || params.fromDate || '').trim();
    const toRaw = String(params.ToDate || params.toDate || '').trim();

    const fromDmy = normalizeDmyInput(fromRaw)?.dmy || '';
    const toDmy = normalizeDmyInput(toRaw)?.dmy || '';
    const fcode = Number(fCodeRaw || 0);

    const list1 = [];
    const list2 = [];
    const list3 = [];

    if (reportType === '1') {
      const factWiseSql = `
        SELECT  
          f.f_code,
          f.f_Name,
          SUM(CASE WHEN lt.lt_StdLoanHeadCode IN (103, 105,109) THEN l.Lo_Amount ELSE 0 END) AS NeedySugarLoan,
          SUM(CASE WHEN lt.lt_StdLoanHeadCode IN (103, 105,109) THEN l.Lo_RecAmount ELSE 0 END) AS NeedySugarDeduct,
          SUM(CASE WHEN lt.lt_StdLoanHeadCode = 104 AND l.lo_factory = 58 THEN (l.Lo_Amount - l.Lo_RecAmount) ELSE 0 END) AS NonDeductible,
          SUM(CASE 
                  WHEN l.lo_factory = 58 AND lt.lt_StdLoanHeadCode NOT IN (103, 105,104,109) THEN l.Lo_Amount
                  WHEN l.lo_factory != 58 AND lt.lt_StdLoanHeadCode NOT IN (103, 105,109) THEN l.Lo_Amount
                  ELSE 0 
              END) AS AgriInputsOther,
          SUM(CASE 
                  WHEN l.lo_factory = 58 AND lt.lt_StdLoanHeadCode NOT IN (103, 105,104,109) THEN l.Lo_RecAmount
                  WHEN l.lo_factory != 58 AND lt.lt_StdLoanHeadCode NOT IN (103, 105,109) THEN l.Lo_RecAmount
                  ELSE 0 
              END) AS AgriInputsOtherDeduct
        FROM loan l
        LEFT JOIN LoanType lt 
          ON l.Lo_Type = lt.LT_LoanTCode AND l.lo_factory = lt.Lt_factory
        LEFT JOIN Factory f 
          ON f.f_code = l.lo_factory
        WHERE (lt.LT_LoanTypeGroup = 0 OR (lt.lt_StdLoanHeadCode = 104 AND l.lo_factory = 58))
          AND (@fcode = 0 OR l.lo_factory = @fcode)
          AND (@fromDate = '' OR @toDate = '' OR convert(date,l.Lo_LoanDate) BETWEEN convert(date,@fromDate,103) AND convert(date,@toDate,103))
        GROUP BY f.f_Name, f.f_code
        ORDER BY f.f_code`;

      const factRows = await executeQuery(
        factWiseSql,
        { fcode, fromDate: fromDmy, toDate: toDmy },
        season
      ).catch(() => []);

      const factoryBalances = new Map();
      factRows.forEach((dr) => {
        const fcodeRow = Number(dr.f_code || dr.F_Code || dr.fcode || 0) || 0;
        const needyTotal = Number(dr.NeedySugarLoan ?? 0);
        const needyDeduct = Number(dr.NeedySugarDeduct ?? 0);
        const agriTotal = Number(dr.AgriInputsOther ?? 0);
        const agriDeduct = Number(dr.AgriInputsOtherDeduct ?? 0);
        const nonDeductible = Number(dr.NonDeductible ?? 0);
        factoryBalances.set(fcodeRow, {
          fcode: fcodeRow,
          name: String(dr.f_Name || dr.F_Name || ''),
          needyBalance: needyTotal - needyDeduct,
          agriBalance: agriTotal - agriDeduct,
          nonDeductible
        });
        list1.push({
          Fname: String(dr.f_Name || dr.F_Name || ''),
          NeedySugarLoan: String(dr.NeedySugarLoan ?? '0'),
          NeedySugarDeduct: String(dr.NeedySugarDeduct ?? '0'),
          NonDeductible: String(dr.NonDeductible ?? '0'),
          AgriInputsOther: String(dr.AgriInputsOther ?? '0'),
          AgriInputsOtherDeduct: String(dr.AgriInputsOtherDeduct ?? '0')
        });
      });

      const factSocSql = `
        SELECT  
          f.f_code,
          f.f_Name,
          SUM(CASE 
                  WHEN lt.lt_StdLoanHeadCode IN (103, 105, 109) AND lt.LT_LoanTypeGroup = 0 
                  THEN (l.Lo_Amount - l.Lo_RecAmount) 
                  ELSE 0 
              END) AS NeedySugarLoan,
          SUM(CASE WHEN lt.lt_StdLoanHeadCode = 104 AND f.f_code = 58 THEN (l.Lo_Amount - l.Lo_RecAmount) ELSE 0 END) AS NonDeductible,
          SUM(CASE 
                WHEN f.f_code = 58 AND lt.lt_StdLoanHeadCode NOT IN (103, 105, 109,104)  AND lt.LT_LoanTypeGroup = 0 
                     THEN (l.Lo_Amount - l.Lo_RecAmount)
                WHEN f.f_code != 58 AND lt.lt_StdLoanHeadCode NOT IN (103, 105, 109) 
                     AND lt.LT_LoanTypeGroup = 0 
                     THEN (l.Lo_Amount - l.Lo_RecAmount)
                ELSE 0 
            END) AS AgriInputsOther,
          SUM(CASE 
                  WHEN lt.LT_LoanTypeGroup = 1 
                    OR (lt.lt_StdLoanHeadCode = 104 AND f.f_code = 58) 
                  THEN ((l.Lo_Amount + l.lo_intAmt + l.lo_DegreeAmt) 
                       - (l.Lo_RecAmount + l.lo_intRec + l.lo_degreeRecAmt)) 
                  ELSE 0 
              END) AS SocietyTotal
        FROM loan l
        LEFT JOIN LoanType lt 
          ON l.Lo_Type = lt.LT_LoanTCode AND l.lo_factory = lt.Lt_factory
        LEFT JOIN Factory f 
          ON f.f_code = l.lo_factory
        WHERE 1 = 1
          AND (@fcode = 0 OR l.lo_factory = @fcode)
          AND (@fromDate = '' OR @toDate = '' OR convert(date,l.Lo_LoanDate) BETWEEN convert(date,@fromDate,103) AND convert(date,@toDate,103))
        GROUP BY f.f_Name, f.f_code
        ORDER BY f.f_code`;

      const factSocRows = await executeQuery(
        factSocSql,
        { fcode, fromDate: fromDmy, toDate: toDmy },
        season
      ).catch(() => []);

      if (factSocRows && factSocRows.length) {
        factSocRows.forEach((dr) => {
          list2.push({
            Fname: String(dr.f_Name || dr.F_Name || ''),
            NeedySugarLoan: String(dr.NeedySugarLoan ?? '0'),
            AgriInputsOther: String(dr.AgriInputsOther ?? '0'),
            NonDeductible: String(dr.NonDeductible ?? '0'),
            SocietyTotal: String(dr.SocietyTotal ?? '0')
          });
        });
      } else if (factoryBalances.size) {
        // Fallback: derive factory balances from list1 aggregation and fetch society totals separately.
        const societySql = `
          SELECT  
            f.f_code,
            f.f_Name,
            SUM(CASE 
                  WHEN lt.LT_LoanTypeGroup = 1 
                    OR (lt.lt_StdLoanHeadCode = 104 AND f.f_code = 58) 
                  THEN ((l.Lo_Amount + l.lo_intAmt + l.lo_DegreeAmt) 
                       - (l.Lo_RecAmount + l.lo_intRec + l.lo_degreeRecAmt)) 
                  ELSE 0 
                END) AS SocietyTotal
          FROM loan l
          LEFT JOIN LoanType lt 
            ON l.Lo_Type = lt.LT_LoanTCode AND l.lo_factory = lt.Lt_factory
          LEFT JOIN Factory f 
            ON f.f_code = l.lo_factory
          WHERE 1 = 1
            AND (@fcode = 0 OR l.lo_factory = @fcode)
            AND (@fromDate = '' OR @toDate = '' OR convert(date,l.Lo_LoanDate) BETWEEN convert(date,@fromDate,103) AND convert(date,@toDate,103))
          GROUP BY f.f_Name, f.f_code
          ORDER BY f.f_code`;

        const societyRows = await executeQuery(
          societySql,
          { fcode, fromDate: fromDmy, toDate: toDmy },
          season
        ).catch(() => []);

        const societyByCode = new Map();
        societyRows.forEach((dr) => {
          const code = Number(dr.f_code || dr.F_Code || dr.fcode || 0) || 0;
          societyByCode.set(code, {
            name: String(dr.f_Name || dr.F_Name || ''),
            total: Number(dr.SocietyTotal ?? 0)
          });
        });

        factoryBalances.forEach((row) => {
          const society = societyByCode.get(row.fcode);
          list2.push({
            Fname: String(row.name || society?.name || ''),
            NeedySugarLoan: String(row.needyBalance ?? 0),
            AgriInputsOther: String(row.agriBalance ?? 0),
            NonDeductible: String(row.nonDeductible ?? 0),
            SocietyTotal: String(society?.total ?? 0)
          });
        });
      }
    } else {
      const typeSql = `
        SELECT  
          f.f_Name,
          CASE 
            WHEN lt.lt_StdLoanHeadCode = 101 THEN 'CaneSeed'
            WHEN lt.lt_StdLoanHeadCode = 102 THEN 'AgriInputs'
            ELSE 'Other'
          END AS LoanCategory,
          SUM(l.Lo_Amount) AS TotalLoanAmount,
          SUM(l.Lo_RecAmount) AS TotalDeductedAmount
        FROM loan l
        LEFT JOIN LoanType lt 
          ON l.Lo_Type = lt.LT_LoanTCode AND l.lo_factory = lt.Lt_factory
        LEFT JOIN Factory f 
          ON f.f_code = l.lo_factory
        WHERE lt.LT_LoanTypeGroup = 0
          AND NOT (lt.lt_StdLoanHeadCode = 104 AND f.f_code = 58)
          AND (@fcode = 0 OR f.f_code = @fcode)
          AND (@fromDate = '' OR @toDate = '' OR convert(date,l.Lo_LoanDate) BETWEEN convert(date,@fromDate,103) AND convert(date,@toDate,103))
        GROUP BY f.f_Name, f.f_code,
          CASE 
            WHEN lt.lt_StdLoanHeadCode = 101 THEN 'CaneSeed'
            WHEN lt.lt_StdLoanHeadCode = 102 THEN 'AgriInputs'
            ELSE 'Other'
          END
        ORDER BY f.f_code, LoanCategory`;

      const typeRows = await executeQuery(
        typeSql,
        { fcode, fromDate: fromDmy, toDate: toDmy },
        season
      ).catch(() => []);

      typeRows.forEach((dr) => {
        list3.push({
          Fname: String(dr.f_Name || dr.F_Name || ''),
          LoanCategory: String(dr.LoanCategory || ''),
          AgriInputsOther: String(dr.TotalLoanAmount ?? '0'),
          NeedySugarLoan: String(dr.TotalDeductedAmount ?? '0')
        });
      });
    }

    return res.status(200).json({
      success: true,
      status: 'success',
      list1,
      list2,
      list3
    });
  } catch (error) {
    if (typeof next === 'function') return next(error);
    throw error;
  }
};

exports.LoansummaryRpt_2 = exports.LoansummaryRpt;
exports.SurveyPLot = createProcedureHandler(CONTROLLER, 'SurveyPLot', '');
exports.SurveyPLot_2 = createProcedureHandler(CONTROLLER, 'SurveyPLot', 'Surveyplot model, string Command');
exports.SurveyPLotDetails = createProcedureHandler(CONTROLLER, 'SurveyPLotDetails', '');
exports.DiseaseDetailsOnMap = createProcedureHandler(CONTROLLER, 'DiseaseDetailsOnMap', 'string usercode, string Factorycode, string Disease, string FromDate, string ToDate, string PlotType');
exports.DiseaseDetailsOnMapTodate = createProcedureHandler(CONTROLLER, 'DiseaseDetailsOnMapTodate', 'string usercode, string Factorycode, string Disease, string ToDate, string PlotType');
exports.SuveryCheckPlotsOnMapCurrent = createProcedureHandler(CONTROLLER, 'SuveryCheckPlotsOnMapCurrent', 'string usercode, string Factorycode, string FromDate, string ToDate, string PlotType');
exports.Checking_logPlots = createProcedureHandler(CONTROLLER, 'Checking_logPlots', 'string F_code, string UserCode, string PlotType, string Flag, string fromdate, string todate');
exports.Checking_logPlots_2 = createProcedureHandler(CONTROLLER, 'Checking_logPlots', 'Checking_logPlotsModel model, string Command');
exports.CheckingDetailsOnMap = createProcedureHandler(CONTROLLER, 'CheckingDetailsOnMap', 'string usercode, string Factorycode, string PlotType, string FromDate, string ToDate');
exports.DiseaseDetails = createProcedureHandler(CONTROLLER, 'DiseaseDetails', 'string F_code, string UserCode, string PlotType, string Flag, string todate');

// Generic procedure-backed handlers (legacy ReportController)
exports.Imagesblub = createProcedureHandler(CONTROLLER, 'Imagesblub', '');
exports.Value = createProcedureHandler(CONTROLLER, 'Value', '');
exports.GetYesterdaytransitDetail = createProcedureHandler(CONTROLLER, 'GetYesterdaytransitDetail', '');
exports.GetTodaytransitDetail = createProcedureHandler(CONTROLLER, 'GetTodaytransitDetail', '');
exports.IndentFaillDetails = createProcedureHandler(CONTROLLER, 'IndentFaillDetails', '');
exports.IndentFaillDetailsData = createProcedureHandler(CONTROLLER, 'IndentFaillDetailsData', '');
exports.TargetActualMISReport = createProcedureHandler(CONTROLLER, 'TargetActualMISReport', '');
exports.TargetActualMISPeriodReport = createProcedureHandler(CONTROLLER, 'TargetActualMISPeriodReport', '');
exports.txtdate_TextChanged = createProcedureHandler(CONTROLLER, 'txtdate_TextChanged', '');
exports.next = createProcedureHandler(CONTROLLER, 'next', '');
exports.prev = createProcedureHandler(CONTROLLER, 'prev', '');
exports.IndentFailSummary = async (req, res, next) => {
  try {
    const season = req.user?.season || req.query?.season || req.body?.season || process.env.DEFAULT_SEASON || '2526';
    const fCode = String(req.query?.F_Code || req.query?.F_code || req.query?.fcode || req.query?.FACT || req.body?.F_Code || req.body?.F_code || req.body?.fcode || req.body?.FACT || '').trim();
    const dateRaw = req.query?.Date || req.query?.date || req.body?.Date || req.body?.date || '';
    const baseDate = parseDmyToDate(dateRaw);

    if (!fCode || !baseDate) {
      return res.status(200).json({ success: true, data: [], recordsets: [[]] });
    }

    const startDate = new Date(baseDate);
    startDate.setDate(startDate.getDate() - 5);
    const endDate = new Date(baseDate);
    endDate.setDate(endDate.getDate() + 5);

    const dt = formatYyyymmdd(startDate);
    const edt = formatYyyymmdd(endDate);

    const summaryQuery = "WITH CT AS(SELECT IS_FACTORY,IS_DS_DT, ISNULL(SUM(CASE WHEN IS_CATEG in(10,11,12,13) THEN MD_QTY ELSE 0 END),0)ERINDQTY,ISNULL(SUM(CASE WHEN IS_CATEG in (10, 11, 12, 13) and IS_STATUS in (1, 5) THEN MD_QTY ELSE 0 END), 0)EINDWT,ISNULL(SUM(CASE WHEN IS_CATEG not in (10, 11, 12, 13) THEN MD_QTY ELSE 0 END), 0)OTINDQTY  ,ISNULL(SUM(CASE WHEN IS_CATEG not in (10, 11, 12, 13) and IS_STATUS in (1, 5) THEN MD_QTY ELSE 0 END), 0)OTINDWT FROM ISSUED LEFT JOIN MODE ON IS_MODE = MD_CODE AND MD_FACTORY = IS_FACTORY WHERE IS_FACTORY = '" + fCode + "' AND CONVERT(NVARCHAR, IS_DS_DT,112) BETWEEN '" + dt + "' AND '" + edt + "' GROUP BY IS_FACTORY,IS_DS_DT)," +
      "CTE AS(SELECT M_FACTORY,M_IND_DT, ISNULL(SUM(CASE WHEN M_CATEG not in(10,11,12,13) THEN(M_GROSS - M_TARE - M_JOONA) ELSE 0 END),0)OTACTWT,ISNULL(SUM(CASE WHEN M_CATEG in(10,11,12,13) THEN(M_GROSS - M_TARE - M_JOONA) ELSE 0 END),0)EACTWT      FROM PURCHASE LEFT JOIN MODE ON M_MODE = MD_CODE AND MD_FACTORY = M_FACTORY WHERE M_FACTORY = '" + fCode + "' AND CONVERT(NVARCHAR, M_IND_DT,112) BETWEEN '" + dt + "' AND '" + edt + "' GROUP BY M_FACTORY,M_IND_DT )" +
      " SELECT IS_FACTORY,CONVERT(NVARCHAR,IS_DS_DT,103)IS_IS_DT ,isnull(ERINDQTY,0)ERINDQTY,isnull(EINDWT,0)EINDWT," +
      " isnull(EACTWT, 0)EACTWT,'0' AS EPURCHYPERC, '0' AS EWTPERC, isnull(OTINDQTY, 0)OTINDQTY,isnull(OTINDWT, 0)OTINDWT,isnull(OTACTWT, 0)OTACTWT," +
      " '0' AS OTPURCHYPERC,'0' AS OTWTPERC, (isnull(ERINDQTY, 0) + isnull(OTINDQTY, 0))TOTINDQTY, (isnull(EINDWT, 0) + isnull(OTINDWT, 0))TOTINDWT," +
      " (isnull(EACTWT, 0) + isnull(OTACTWT, 0))TOTACTWT, '0' AS TOTPURCHYPERC,'0' AS TOTWTPERC, " +
      "   ((isnull(ERINDQTY, 0) + isnull(OTINDQTY, 0)) - (isnull(EINDWT, 0) + isnull(OTINDWT, 0)))BALTOTINDQTY,'0' AS PIPBALIND,'0' AS TOTBALIND " +
      " FROM CT left join CTE on CT.IS_DS_DT = CTE.M_IND_DT AND CT.IS_FACTORY = CTE.M_FACTORY  ORDER BY CT.IS_DS_DT";

    const summaryRows = await executeQuery(summaryQuery, season);
    if (!summaryRows || summaryRows.length === 0) {
      return res.status(200).json({ success: true, data: [], recordsets: [[]] });
    }

    const output = [];
    for (const row of summaryRows) {
      const rowDate = row.IS_IS_DT ? String(row.IS_IS_DT).trim() : '';
      let prev = 0;
      if (rowDate) {
        const dtRow = parseDmyToDate(rowDate);
        if (dtRow) {
          const dtVal = formatYyyymmdd(dtRow);
          const backQuery = "WITH CT AS(SELECT IS_FACTORY,IS_DS_DT,ISNULL(SUM(CASE WHEN LEFT(IS_CATEG, 1) = 1 THEN MD_QTY ELSE 0 END),0)TDERINDQTY,ISNULL(SUM(CASE WHEN LEFT(IS_CATEG, 1) != 1 THEN MD_QTY ELSE 0 END),0)TDOTINDQTY FROM ISSUED LEFT JOIN MODE ON IS_MODE = MD_CODE AND MD_FACTORY = IS_FACTORY WHERE IS_FACTORY = '" + fCode + "' AND CONVERT(NVARCHAR, IS_DS_DT,112) BETWEEN dateadd(d,-2,'" + dtVal + "') AND dateadd(d,-1,'" + dtVal + "')   GROUP BY IS_FACTORY,IS_DS_DT)," +
            "CTE AS(SELECT M_FACTORY,M_IND_DT,ISNULL(SUM(CASE WHEN LEFT(M_CATEG, 1) = 1 THEN MD_QTY ELSE 0 END),0)TDEINDWT,ISNULL(SUM(CASE WHEN LEFT(M_CATEG, 1) != 1 THEN MD_QTY ELSE 0 END),0)TDOTINDWT FROM PURCHASE LEFT JOIN MODE ON M_MODE = MD_CODE AND MD_FACTORY = M_FACTORY WHERE M_FACTORY = '" + fCode + "' AND CONVERT(NVARCHAR, M_IND_DT,112) BETWEEN dateadd(d,-2,'" + dtVal + "') AND dateadd(d,-1,'" + dtVal + "') GROUP BY M_FACTORY,M_IND_DT)" +
            " SELECT CONVERT(NVARCHAR,CT.IS_DS_DT,103)IS_DS_DT,isnull((TDERINDQTY+TDOTINDQTY),0)TDQTY,isnull((TDEINDWT+TDOTINDWT),0)TDWT," +
            " isnull(((TDERINDQTY + TDOTINDQTY) - (TDEINDWT + TDOTINDWT)), 0)BAL FROM CT left join CTE on CT.IS_DS_DT = CTE.M_IND_DT AND CT.IS_FACTORY = CTE.M_FACTORY  ORDER BY CT.IS_DS_DT";
          const backRows = await executeQuery(backQuery, season);
          if (backRows && backRows.length > 0) {
            for (const bRow of backRows) {
              prev += Number(bRow.BAL || 0);
            }
            prev = truncateDecimal(prev, 2);
          }
        }
      }

      const totalBal = Number(row.BALTOTINDQTY || 0) + Number(prev || 0);
      const erInd = Number(row.ERINDQTY || 0);
      const eIndWt = Number(row.EINDWT || 0);
      const eActWt = Number(row.EACTWT || 0);
      const otInd = Number(row.OTINDQTY || 0);
      const otIndWt = Number(row.OTINDWT || 0);
      const otActWt = Number(row.OTACTWT || 0);
      const totInd = Number(row.TOTINDQTY || 0);
      const totIndWt = Number(row.TOTINDWT || 0);
      const totActWt = Number(row.TOTACTWT || 0);

      const perc = (num, den) => (den > 0 ? truncateDecimal((num / den) * 100, 2) : 0);

      const ePurchyPerc = perc(erInd - eIndWt, erInd);
      const eWtPerc = perc(eIndWt - eActWt, eIndWt);
      const otPurchyPerc = perc(otInd - otIndWt, otInd);
      const otWtPerc = perc(otIndWt - otActWt, otIndWt);
      const totPurchyPerc = perc(totInd - totIndWt, totInd);
      const totWtPerc = perc(totIndWt - totActWt, totIndWt);

      output.push({
        ERINDQTY: row.ERINDQTY,
        IS_FACTORY: row.IS_FACTORY,
        IS_IS_DT: row.IS_IS_DT,
        EINDWT: row.EINDWT,
        EACTWT: row.EACTWT,
        EPURCHYPERC: ePurchyPerc,
        EWTPERC: eWtPerc,
        OTINDQTY: row.OTINDQTY,
        OTACTWT: row.OTACTWT,
        OTINDWT: row.OTINDWT,
        OTPURCHYPERC: otPurchyPerc,
        OTWTPERC: otWtPerc,
        TOTINDQTY: row.TOTINDQTY,
        TOTINDWT: row.TOTINDWT,
        TOTACTWT: row.TOTACTWT,
        TOTPURCHYPERC: totPurchyPerc,
        TOTWTPERC: totWtPerc,
        BALTOTINDQTY: row.BALTOTINDQTY,
        TOTBALIND: totalBal,
        PIPBALIND: prev
      });
    }

    return res.status(200).json({ success: true, data: output, recordsets: [output] });
  } catch (error) {
    if (typeof next === 'function') return next(error);
    throw error;
  }
};

exports.IndentFailSummaryData = async (req, res, next) => {
  try {
    const season = req.user?.season || req.query?.season || req.body?.season || process.env.DEFAULT_SEASON || '2526';
    const fCode = String(req.query?.F_Code || req.query?.F_code || req.query?.fcode || req.query?.FACT || req.body?.F_Code || req.body?.F_code || req.body?.fcode || req.body?.FACT || '').trim();
    const dateRaw = req.query?.Date || req.query?.date || req.body?.Date || req.body?.date || '';
    const baseDate = parseDmyToDate(dateRaw);

    if (!fCode || !baseDate) {
      return res.status(200).json({ success: true, data: [], recordsets: [[]] });
    }

    const dt = formatYyyymmdd(baseDate);
    const detailQuery = "WITH CT AS(SELECT IS_FACTORY,IS_CNT_CD,C_NAME, ISNULL(SUM(CASE WHEN IS_CATEG in(10,11,12,13) THEN MD_QTY ELSE 0 END),0)ERINDQTY,ISNULL(SUM(CASE WHEN IS_CATEG in (10, 11, 12, 13) and IS_STATUS in (1, 5) THEN MD_QTY ELSE 0 END), 0)EINDWT,ISNULL(SUM(CASE WHEN IS_CATEG not in (10, 11, 12, 13) THEN MD_QTY ELSE 0 END), 0)OTINDQTY  ,ISNULL(SUM(CASE WHEN IS_CATEG not in (10, 11, 12, 13) and IS_STATUS in (1, 5) THEN MD_QTY ELSE 0 END), 0)OTINDWT FROM ISSUED LEFT JOIN MODE ON IS_MODE = MD_CODE AND MD_FACTORY = IS_FACTORY JOIN CENTRE ON IS_CNT_CD=C_CODE AND C_FACTORY=IS_FACTORY WHERE IS_FACTORY = '" + fCode + "' AND CONVERT(NVARCHAR, IS_DS_DT,112) = '" + dt + "'  GROUP BY IS_FACTORY,IS_CNT_CD,C_NAME)," +
      "CTE AS(SELECT M_FACTORY,IS_CNT_CD,C_NAME,ISNULL(SUM(CASE WHEN M_CATEG not in(10,11,12,13) THEN(M_GROSS - M_TARE - M_JOONA) ELSE 0 END),0)OTACTWT,ISNULL(SUM(CASE WHEN M_CATEG in(10,11,12,13) THEN(M_GROSS - M_TARE - M_JOONA) ELSE 0 END),0)EACTWT FROM PURCHASE p LEFT JOIN MODE ON M_MODE = MD_CODE AND MD_FACTORY = M_FACTORY join ISSUED i on i.IS_FACTORY = p.m_factory and i.IS_SPRNO = p.M_IND_NO JOIN CENTRE ON i.IS_CNT_CD = C_CODE AND i.IS_FACTORY = C_FACTORY   WHERE M_FACTORY = '" + fCode + "' AND CONVERT(NVARCHAR, M_IND_DT,112) = '" + dt + "'  GROUP BY M_FACTORY,IS_CNT_CD,C_NAME)" +
      " SELECT CT.IS_FACTORY,CT.IS_CNT_CD,CT.C_NAME ,isnull(ERINDQTY,0)ERINDQTY,isnull(EINDWT,0)EINDWT,isnull(EACTWT,0)EACTWT,'0' AS EPURCHYPERC,'0' AS EWTPERC ,isnull(OTINDQTY, 0)OTINDQTY,isnull(OTINDWT, 0)OTINDWT,isnull(OTACTWT, 0)OTACTWT,'0' AS OTPURCHYPERC,'0' AS OTWTPERC, isnull((ERINDQTY + OTINDQTY), 0)TOTINDQTY,isnull((EINDWT + OTINDWT), 0)TOTINDWT,isnull((EACTWT + OTACTWT), 0)TOTACTWT,'0' AS TOTPURCHYPERC,'0' AS TOTWTPERC, isnull(((ERINDQTY + OTINDQTY) - (EINDWT + OTINDWT)), 0)BALTOTINDQTY,'0' AS PIPBALIND,'0' AS TOTBALIND  FROM  CT left join CTE on  CT.IS_CNT_CD = CTE.IS_CNT_CD  AND CT.IS_FACTORY = CTE.M_FACTORY ORDER BY CT.IS_FACTORY,CT.IS_CNT_CD";

    const detailRows = await executeQuery(detailQuery, season);
    if (!detailRows || detailRows.length === 0) {
      return res.status(200).json({ success: true, data: [], recordsets: [[]] });
    }

    const output = [];
    for (const row of detailRows) {
      const center = row.IS_CNT_CD ? String(row.IS_CNT_CD).trim() : '';
      let prev = 0;
      if (center) {
        const backQuery = "WITH CT AS(SELECT IS_FACTORY, IS_DS_DT, IS_CNT_CD, ISNULL(SUM(CASE WHEN IS_CATEG in(10,11,12,13) THEN MD_QTY ELSE 0 END),0)TDERINDQTY,ISNULL(SUM(CASE WHEN IS_CATEG in (10, 11, 12, 13) and IS_STATUS in (1, 5) THEN MD_QTY ELSE 0 END), 0)TDEINDWT,ISNULL(SUM(CASE WHEN IS_CATEG not in (10, 11, 12, 13) THEN MD_QTY ELSE 0 END), 0)TDOTINDQTY ,ISNULL(SUM(CASE WHEN IS_CATEG not in (10, 11, 12, 13) and IS_STATUS in (1, 5) THEN MD_QTY ELSE 0 END), 0)TDOTINDWT        FROM ISSUED LEFT JOIN MODE ON IS_MODE = MD_CODE AND MD_FACTORY = IS_FACTORY JOIN CENTRE ON IS_CNT_CD = C_CODE AND C_FACTORY = IS_FACTORY  WHERE IS_FACTORY = '" + fCode + "' AND CONVERT(NVARCHAR, IS_DS_DT,112) BETWEEN dateadd(d,-2,'" + dt + "') AND dateadd(d,-1,'" + dt + "') AND IS_CNT_CD = '" + center + "'  GROUP BY IS_FACTORY,IS_DS_DT,IS_CNT_CD), " +
          "CTE AS(SELECT M_FACTORY, M_IND_DT, M_CENTRE FROM PURCHASE LEFT JOIN MODE ON M_MODE = MD_CODE AND MD_FACTORY = M_FACTORY JOIN CENTRE ON M_CENTRE = C_CODE AND M_FACTORY = C_FACTORY  WHERE M_FACTORY = '" + fCode + "' AND CONVERT(NVARCHAR, M_IND_DT,112) BETWEEN dateadd(d,-2,'" + dt + "') AND dateadd(d,-1,'" + dt + "') AND M_CENTRE = '" + center + "'  GROUP BY M_FACTORY,M_IND_DT,M_CENTRE) " +
          "SELECT CT.IS_FACTORY,CONVERT(NVARCHAR,CT.IS_DS_DT,103)IS_DS_DT,CT.IS_CNT_CD,(TDERINDQTY + TDOTINDQTY)TDQTY,(TDEINDWT + TDOTINDWT)TDWT,((TDERINDQTY + TDOTINDQTY) - (TDEINDWT + TDOTINDWT))BAL FROM CT left join  CTE on CT.IS_DS_DT = CTE.M_IND_DT AND CT.IS_CNT_CD = CTE.M_CENTRE AND CT.IS_FACTORY = CTE.M_FACTORY ORDER BY CT.IS_DS_DT";
        const backRows = await executeQuery(backQuery, season);
        if (backRows && backRows.length > 0) {
          for (const bRow of backRows) {
            prev += Number(bRow.BAL || 0);
          }
          prev = truncateDecimal(prev, 2);
        }
      }

      const totalBal = Number(row.BALTOTINDQTY || 0) + Number(prev || 0);
      const erInd = Number(row.ERINDQTY || 0);
      const eIndWt = Number(row.EINDWT || 0);
      const eActWt = Number(row.EACTWT || 0);
      const otInd = Number(row.OTINDQTY || 0);
      const otIndWt = Number(row.OTINDWT || 0);
      const otActWt = Number(row.OTACTWT || 0);
      const totInd = Number(row.TOTINDQTY || 0);
      const totIndWt = Number(row.TOTINDWT || 0);
      const totActWt = Number(row.TOTACTWT || 0);

      const perc = (num, den) => (den > 0 ? truncateDecimal((num / den) * 100, 2) : 0);

      const ePurchyPerc = perc(erInd - eIndWt, erInd);
      const eWtPerc = perc(eIndWt - eActWt, eIndWt);
      const otPurchyPerc = perc(otInd - otIndWt, otInd);
      const otWtPerc = perc(otIndWt - otActWt, otIndWt);
      const totPurchyPerc = perc(totInd - totIndWt, totInd);
      const totWtPerc = perc(totIndWt - totActWt, totIndWt);

      output.push({
        ERINDQTY: row.ERINDQTY,
        IS_CNT_CD: row.IS_CNT_CD,
        C_NAME: row.C_NAME,
        IS_FACTORY: row.IS_FACTORY,
        EINDWT: row.EINDWT,
        EACTWT: row.EACTWT,
        EPURCHYPERC: ePurchyPerc,
        EWTPERC: eWtPerc,
        OTINDQTY: row.OTINDQTY,
        OTACTWT: row.OTACTWT,
        OTINDWT: row.OTINDWT,
        OTPURCHYPERC: otPurchyPerc,
        OTWTPERC: otWtPerc,
        TOTINDQTY: row.TOTINDQTY,
        TOTINDWT: row.TOTINDWT,
        TOTACTWT: row.TOTACTWT,
        TOTPURCHYPERC: totPurchyPerc,
        TOTWTPERC: totWtPerc,
        BALTOTINDQTY: row.BALTOTINDQTY,
        TOTBALIND: totalBal,
        PIPBALIND: prev
      });
    }

    return res.status(200).json({ success: true, data: output, recordsets: [output] });
  } catch (error) {
    if (typeof next === 'function') return next(error);
    throw error;
  }
};
exports.IndentFailSummaryNew = createProcedureHandler(CONTROLLER, 'IndentFailSummaryNew', '');
exports.IndentFailSummaryNewData = createProcedureHandler(CONTROLLER, 'IndentFailSummaryNewData', '');
exports.CentrePurchase = async (req, res, next) => {
  try {
    const season = req.user?.season || req.query?.season || req.body?.season || process.env.DEFAULT_SEASON || '2526';
    const fCode = String(req.query?.F_Code || req.query?.F_code || req.query?.fcode || req.query?.FACT || req.body?.F_Code || req.body?.F_code || req.body?.fcode || req.body?.FACT || '').trim();
    const dateRaw = req.query?.Date || req.query?.date || req.body?.Date || req.body?.date || '';
    const fromDate = normalizeDateToDb(dateRaw);

    if (!fCode || !fromDate) {
      return res.status(200).json({ success: true, data: [], recordsets: [[]] });
    }

    const rows = await readRepository.getCentreCode({ fCode, fromDate }, season);
    return res.status(200).json({
      success: true,
      message: `${CONTROLLER}.CentrePurchase executed`,
      data: rows || [],
      recordsets: [rows || []]
    });
  } catch (error) {
    if (typeof next === 'function') return next(error);
    throw error;
  }
};

// Crushing report helper endpoints
exports.LOADFACTORYDATA = async (req, res, next) => {
  try {
    const data = await reportService.loadFactoryData(req);
    return res.status(200).json({ success: true, data });
  } catch (error) {
    if (typeof next === 'function') return next(error);
    throw error;
  }
};

exports.LOADMODEWISEDATA = async (req, res, next) => {
  try {
    const data = await reportService.loadModeWiseData(req);
    return res.status(200).json({ success: true, data });
  } catch (error) {
    if (typeof next === 'function') return next(error);
    throw error;
  }
};

exports.TruckDispatchWeighed = async (req, res, next) => {
  try {
    const data = await reportService.getTruckDispatchWeighed(req);
    return res.status(200).json({ success: true, data });
  } catch (error) {
    if (typeof next === 'function') return next(error);
    throw error;
  }
};

exports.Analysisdata = async (req, res, next) => {
  try {
    const data = await reportService.getAnalysisData(req);
    return res.status(200).json({ success: true, data });
  } catch (error) {
    if (typeof next === 'function') return next(error);
    throw error;
  }
};

exports.LatestCrushingDate = async (req, res, next) => {
  try {
    const data = await reportService.getLatestCrushingDate(req);
    return res.status(200).json({ success: true, data });
  } catch (error) {
    if (typeof next === 'function') return next(error);
    throw error;
  }
};

exports.EffectedCaneAreaReport = async (req, res, next) => {
  try {
    const data = await reportService.getEffectedCaneAreaReport(req);
    return res.status(200).json({ success: true, message: 'Effected cane area report', data });
  } catch (error) {
    return next(error);
  }
};

exports.CentreCode = async (req, res, next) => {
  try {
    const data = await reportService.getCentreCode(req);
    return res.status(200).json({ success: true, message: 'Centre code report', data });
  } catch (error) {
    return next(error);
  }
};

exports.CentreCode_2 = exports.CentreCode;

exports.Getdisease = async (req, res, next) => {
  try {
    const data = await reportService.getDiseaseList(req);
    return res.status(200).json({ success: true, message: 'Disease list', data });
  } catch (error) {
    return next(error);
  }
};

exports.SummaryReportUnitWise = async (req, res, next) => {
  try {
    const data = await reportService.getSummaryReportUnitWise(req);
    return res.status(200).json({ success: true, message: 'Summary report unit wise', data });
  } catch (error) {
    console.error('[report-service] SummaryReportUnitWise failed', {
      message: error?.message,
      stack: error?.stack,
      query: req.query,
      body: req.body
    });
    return next(error);
  }
};

exports.SummaryReportUnitWise_2 = exports.SummaryReportUnitWise;

// ── Crushing Report – Exact SQL mirror of ReportDataAccess.cs ────────────────
// Tables used: SEASON, Mode, Token, GROSS, PURCHASE, RECEIPT, challan_final, T_TOKEN, CHALLANLOCK
// All user-input parameters (@F, @Date) are named-parameter bindings – no SQL injection risk.

function createCrushingDataHandler() {
  return async (req, res, next) => {
    try {
      const season = req.user?.season || req.query?.season || req.body?.season || process.env.DEFAULT_SEASON || '2526';
      const p = { ...(req.query || {}), ...(req.body || {}) };
      const fcode = String(p.FACTCODE ?? p.F_code ?? p.F_Code ?? p.factory ?? '0').trim();
      const rawDate = String(p.Date ?? p.DATE ?? p.date ?? '').trim();
      const sqlDate = toSqlDateAnalysis(rawDate);
      const date111 = sqlDate ? sqlDate.replace(/-/g, '/') : '';

      const defaults = buildCrushingDefaults(req);
      if (!sqlDate || !fcode || fcode === '0') {
        return res.status(200).json(defaults);
      }

      // ─── Step 1: Get GATECODE (comma-separated gate centre codes from SEASON) ───
      // SEASON.S_SGT_CD is a comma-separated list like "10,11,12" representing gate centres
      const gateCodeRows = await executeQuery(
        `SELECT ISNULL(S_SGT_CD,'0') AS GATECODE,
                ISNULL(S_SEASONSTARTDATE, @Date) AS SEASONSTART,
                ISNULL(S_ShiftStartTime, '06:00:00') AS ShiftStartTime,
                ISNULL(S_ShiftHour, 8) AS ShiftHours
         FROM SEASON WHERE FACTORY = @F`,
        { F: fcode, Date: sqlDate }, season
      ).catch(() => []);
      const GATECODE = String(gateCodeRows?.[0]?.GATECODE || '0');
      const SEASONSTART = String(gateCodeRows?.[0]?.SEASONSTART || sqlDate);
      const shiftStartRaw = String(gateCodeRows?.[0]?.ShiftStartTime || '06:00:00');
      const shiftHours = Number(gateCodeRows?.[0]?.ShiftHours || 8);

      // ─── Step 2: Crop days (SEASON table) ────────────────────────────────────
      const cropQ = `SELECT ISNULL(DATEDIFF(DAY, CAST(S_SEASONSTARTDATE AS DATE), CAST(@Date AS DATE))+1, 0) AS lblcrop
                     FROM SEASON WHERE FACTORY=@F`;

      // ─── Step 3: Mode quantities (Mode table, md_groupcode 1-4) ─────────────
      // md_groupcode: 1=Cart, 2=SmallTrolly(40), 3=LargeTrolly(60), 4=Truck
      const modesQ = `SELECT ISNULL(md_qty,0) AS md_qty, md_code, md_name,
                             ISNULL(md_groupcode,0) AS md_groupcode
                      FROM Mode WHERE MD_FACTORY=@F`;

      // ─── Step 4: Out Yard (Token table – vehicles at farm yard awaiting dispatch)
      // GETCOUNTVEHICLEOUTYARD: Count from Token table where T_ModSupp in mode codes for this factory
      const oyQ = `
        SELECT md.md_groupcode,
               COUNT(t.T_IndentNo) AS OYNos
        FROM Mode md
        LEFT JOIN Token t ON t.T_ModSupp IN (
              SELECT md2.md_code FROM Mode md2
              WHERE md2.md_groupcode = md.md_groupcode AND md2.MD_FACTORY = @F
            ) AND t.T_FACTORY = @F
        WHERE md.MD_FACTORY = @F AND md.md_groupcode BETWEEN 1 AND 4
        GROUP BY md.md_groupcode`;

      // ─── Step 5: At Donga (GROSS table – at factory weighbridge, gross recorded)
      // GETCOUNTVEHICLEATDONGA: Count from GROSS where G_MODSUPP in mode codes and G_GROSSWT>0
      const dongaQ = `
        SELECT md.md_groupcode,
               COUNT(g.G_TOKENNO) AS AtDNos
        FROM Mode md
        LEFT JOIN GROSS g ON g.G_MODSUPP IN (
              SELECT md2.md_code FROM Mode md2
              WHERE md2.md_groupcode = md.md_groupcode AND md2.MD_FACTORY = @F
            ) AND ISNULL(g.G_GROSSWT,0) > 0 AND g.G_FACTORY = @F
        WHERE md.MD_FACTORY = @F AND md.md_groupcode BETWEEN 1 AND 4
        GROUP BY md.md_groupcode`;

      // ─── Step 6: On Date Crushed (PURCHASE, gate centres, M_CENTRE IN GATECODE) ─
      // GETONDATECRUSHINGCOUNTNOOFVEHICLE / GETONDATECRUCHINGQUANTITY
      const odcQ = `
        SELECT md.md_groupcode,
               COUNT(p.M_IND_NO)                          AS ODCNos,
               ISNULL(SUM(p.M_GROSS-p.M_TARE-p.M_JOONA), 0) AS ODCWt
        FROM Mode md
        LEFT JOIN PURCHASE p ON p.M_MODE IN (
              SELECT md2.md_code FROM Mode md2
              WHERE md2.md_groupcode = md.md_groupcode AND md2.MD_FACTORY = @F
            )
            AND CONVERT(NVARCHAR, p.M_DATE, 111) = @Date111
            AND p.M_CENTRE IN (SELECT value FROM STRING_SPLIT(@GC, ','))
            AND p.M_FACTORY = @F
        WHERE md.MD_FACTORY = @F AND md.md_groupcode BETWEEN 1 AND 4
        GROUP BY md.md_groupcode`;

      // ─── Step 7: Todate Crushed (PURCHASE, gate centres, M_DATE <= selected date) ─
      // GETCOUNTVEHICLETODATE / GETTODATEQUANTITY
      const tdcQ = `
        SELECT md.md_groupcode,
               COUNT(p.M_IND_NO)                          AS TDCNos,
               ISNULL(SUM(p.M_GROSS-p.M_TARE-p.M_JOONA), 0) AS TDCWt
        FROM Mode md
        LEFT JOIN PURCHASE p ON p.M_MODE IN (
              SELECT md2.md_code FROM Mode md2
              WHERE md2.md_groupcode = md.md_groupcode AND md2.MD_FACTORY = @F
            )
            AND CONVERT(NVARCHAR, p.M_DATE, 111) <= @Date111
            AND p.M_CENTRE IN (SELECT value FROM STRING_SPLIT(@GC, ','))
            AND p.M_FACTORY = @F
        WHERE md.MD_FACTORY = @F AND md.md_groupcode BETWEEN 1 AND 4
        GROUP BY md.md_groupcode`;

      // ─── Step 8: Centre ODC – RECEIPT table, tt_center NOT IN GATECODE ──────
      // GETCENTREVEHICLECOUNTONDATE / GETCENTREONDATEQUANTITY
      const cenODCQ = `
        SELECT ISNULL(COUNT(tt_chalanNo),0) AS ODCNos,
               ISNULL(SUM(tt_grossweight-tt_tareweight-tt_joonaweight),0) AS ODCWt
        FROM RECEIPT
        WHERE CONVERT(NVARCHAR, tt_Date, 111) = @Date111
          AND tt_center NOT IN (SELECT value FROM STRING_SPLIT(@GC, ','))
          AND TT_FACTORY = @F
          AND ISNULL(TT_TAREWEIGHT,0) > 0`;

      // ─── Step 9: Centre TDC ──────────────────────────────────────────────────
      // GETCENTREVEHICLECOUNTTODATE / GETCENTRETODATEQUANTITY
      const cenTDCQ = `
        SELECT ISNULL(COUNT(tt_chalanNo),0) AS TDCNos,
               ISNULL(SUM(tt_grossweight-tt_tareweight-tt_joonaweight),0) AS TDCWt
        FROM RECEIPT
        WHERE CONVERT(NVARCHAR, tt_Date, 111) <= @Date111
          AND tt_center NOT IN (SELECT value FROM STRING_SPLIT(@GC, ','))
          AND TT_FACTORY = @F
          AND ISNULL(TT_TAREWEIGHT,0) > 0`;

      // ─── Step 10: Centre Out Yard (T_token, no gate filter) ──────────────────
      // GETCENTREVEHICLECOUNTOUTYARD: Count from T_token for this factory
      const cenOYQ = `SELECT ISNULL(COUNT(TT_CHLN),0) AS OYNos FROM T_token WHERE TT_FACTORY=@F`;

      // ─── Step 11: Centre At Donga (RECEIPT, gross>0, tare=0) ─────────────────
      // GETCENTREVEHICLECOUNTATDONGA
      const cenDongaQ = `
        SELECT ISNULL(COUNT(TT_CHALANNO),0) AS AtDNos
        FROM RECEIPT
        WHERE ISNULL(TT_GROSSWEIGHT,0) > 0
          AND ISNULL(TT_TAREWEIGHT,0) = 0
          AND TT_FACTORY = @F`;

      // ─── Step 12: Gate hourly crushing (PURCHASE, M_CENTRE IN GATECODE) ──────
      // GATEHOURWISECRUSHING: uses M_TARE_DT hour (tare/weigh time at factory)
      const gateHourQ = `
        SELECT DATEPART(HOUR, M_TARE_DT) AS hou,
        ISNULL(SUM(M_GROSS-M_TARE-M_JOONA),0) AS FinWt
        FROM PURCHASE
        WHERE CONVERT(NVARCHAR, M_DATE, 111) = @Date111
          AND M_FACTORY = @F
          AND M_CENTRE IN (SELECT value FROM STRING_SPLIT(@GC, ','))
        GROUP BY DATEPART(HOUR, M_TARE_DT)
        ORDER BY DATEPART(HOUR, M_TARE_DT)`;

      // ─── Step 13: Centre hourly crushing (RECEIPT, tt_center NOT IN GATECODE)
      // CENTERHOURWISECRUSHING: uses TT_TARE_DT hour, tt_tareweight>0
      const centreHourQ = `
        SELECT DATEPART(HOUR, TT_TARE_DT) AS hou,
        ISNULL(SUM(tt_grossweight-tt_tareweight-tt_joonaweight),0) AS FinWt
        FROM RECEIPT
        WHERE CONVERT(NVARCHAR, TT_DATE, 111) = @Date111
          AND TT_FACTORY = @F
          AND TT_CENTER NOT IN (SELECT value FROM STRING_SPLIT(@GC, ','))
          AND tt_tareweight > 0
        GROUP BY DATEPART(HOUR, TT_TARE_DT)
        ORDER BY DATEPART(HOUR, TT_TARE_DT)`;

      // ─── Step 14: Cane purchasing 6AM-6PM (Gate+Centre) today & yesterday ───
      // CALCULATETODAYGATECENTER6AMTO6PM: DATEPART(HOUR,M_TARE_DT) BETWEEN 6 AND 17
      const canePurchQ = `
        SELECT 'GATE_TODAY' AS TAG,
               ISNULL(SUM(M_GROSS-M_TARE-M_JOONA),0) AS FinWt
        FROM PURCHASE
        WHERE CONVERT(NVARCHAR, M_DATE, 111) = @Date111
          AND DATEPART(HOUR,M_TARE_DT) BETWEEN 6 AND 17
          AND M_FACTORY=@F AND M_CENTRE IN (SELECT value FROM STRING_SPLIT(@GC,','))
        UNION ALL
        SELECT 'CENTER_TODAY',
               ISNULL(SUM(TT_GROSSWEIGHT-TT_TAREWEIGHT-TT_JOONAWEIGHT),0)
        FROM RECEIPT
        WHERE CONVERT(NVARCHAR, TT_DATE, 111) = @Date111
          AND DATEPART(HOUR,TT_TARE_DT) BETWEEN 6 AND 17
          AND TT_FACTORY=@F AND TT_CENTER NOT IN (SELECT value FROM STRING_SPLIT(@GC,','))
        UNION ALL
        SELECT 'GATE_TOD_PM',
               ISNULL(SUM(M_GROSS-M_TARE-M_JOONA),0)
        FROM PURCHASE
        WHERE CONVERT(NVARCHAR, M_DATE, 111) = @Date111
          AND DATEPART(HOUR,M_TARE_DT) IN (0,1,2,3,4,5,18,19,20,21,22,23)
          AND M_FACTORY=@F AND M_CENTRE IN (SELECT value FROM STRING_SPLIT(@GC,','))
        UNION ALL
        SELECT 'CENTER_TOD_PM',
               ISNULL(SUM(TT_GROSSWEIGHT-TT_TAREWEIGHT-TT_JOONAWEIGHT),0)
        FROM RECEIPT
        WHERE CONVERT(NVARCHAR, TT_DATE, 111) = @Date111
          AND DATEPART(HOUR,TT_TARE_DT) IN (0,1,2,3,4,5,18,19,20,21,22,23)
          AND TT_FACTORY=@F AND TT_CENTER NOT IN (SELECT value FROM STRING_SPLIT(@GC,','))
          AND tt_tareWeight > 0
        UNION ALL
        SELECT 'GATE_YES',
               ISNULL(SUM(M_GROSS-M_TARE-M_JOONA),0)
        FROM PURCHASE
        WHERE CONVERT(NVARCHAR, M_DATE, 111) = DATEADD(DAY,-1,@Date111)
          AND DATEPART(HOUR,M_TARE_DT) BETWEEN 6 AND 17
          AND M_FACTORY=@F AND M_CENTRE IN (SELECT value FROM STRING_SPLIT(@GC,','))
        UNION ALL
        SELECT 'CENTER_YES',
               ISNULL(SUM(TT_GROSSWEIGHT-TT_TAREWEIGHT-TT_JOONAWEIGHT),0)
        FROM RECEIPT
        WHERE CONVERT(NVARCHAR, TT_DATE, 111) = DATEADD(DAY,-1,@Date111)
          AND DATEPART(HOUR,TT_TARE_DT) BETWEEN 6 AND 17
          AND TT_FACTORY=@F AND TT_CENTER NOT IN (SELECT value FROM STRING_SPLIT(@GC,','))
        UNION ALL
        SELECT 'GATE_YES_PM',
               ISNULL(SUM(M_GROSS-M_TARE-M_JOONA),0)
        FROM PURCHASE
        WHERE CONVERT(NVARCHAR, M_DATE, 111) = DATEADD(DAY,-1,@Date111)
          AND DATEPART(HOUR,M_TARE_DT) IN (0,1,2,3,4,5,18,19,20,21,22,23)
          AND M_FACTORY=@F AND M_CENTRE IN (SELECT value FROM STRING_SPLIT(@GC,','))
        UNION ALL
        SELECT 'CENTER_YES_PM',
               ISNULL(SUM(TT_GROSSWEIGHT-TT_TAREWEIGHT-TT_JOONAWEIGHT),0)
        FROM RECEIPT
        WHERE CONVERT(NVARCHAR, TT_DATE, 111) = DATEADD(DAY,-1,@Date111)
          AND DATEPART(HOUR,TT_TARE_DT) IN (0,1,2,3,4,5,18,19,20,21,22,23)
          AND TT_FACTORY=@F AND TT_CENTER NOT IN (SELECT value FROM STRING_SPLIT(@GC,','))
          AND tt_tareWeight > 0`;

      // ─── Step 15: Centre operated today (distinct centres in PURCHASE, not gate) ─
      // CENTEROPERATED
      const cenOperQ = `
        SELECT COUNT(DISTINCT M_CENTRE) AS NOS
        FROM PURCHASE
        WHERE CONVERT(NVARCHAR, M_DATE, 111) = @Date111
          AND M_CENTRE NOT IN (SELECT value FROM STRING_SPLIT(@GC,','))
          AND M_FACTORY=@F`;

      // ─── Step 16: Centre purchase weight today (not gate) ──────────────────
      // CENTERPURCHASE
      const cenPurQ = `
        SELECT ISNULL(SUM(M_GROSS-M_TARE-M_JOONA),0) AS WT
        FROM PURCHASE
        WHERE CONVERT(NVARCHAR, M_DATE, 111) = @Date111
          AND M_CENTRE NOT IN (SELECT value FROM STRING_SPLIT(@GC,','))
          AND M_FACTORY=@F`;

      // ─── Step 17: Truck dispatched today (CHALLAN_FINAL, all challans) ──────
      // TRUCKDISPATCHED: COUNT(CH_CHALLAN) from challan_final for today, ch_cancel=0
      const truckDispQ = `
        SELECT COUNT(CH_CHALLAN) AS NOS
        FROM challan_final
        WHERE Ch_Cancel=0 AND CH_FACTORY=@F
          AND CONVERT(NVARCHAR, CH_DEP_DATE, 111) = @Date111`;

      // ─── Step 18: Truck received (challan_final, CH_status>0 = received) ────
      // TRUCKRECEIVED: SUM CASE CH_status>0
      const truckRecvQ = `
        SELECT SUM(CASE WHEN CH_status > 0 THEN 1 ELSE 0 END) AS NOS
        FROM challan_Final
        WHERE CH_FACTORY=@F AND CAST(Ch_dep_date AS DATE) = @Date`;

      // ─── Step 19: Truck transit TODAY (CH_STATUS=0, not in Token/Receipt/Lock) ─
      // TRUCKTRANSITTODAY (uses CH_STATUS=0 flag, not T_Token presence)
      const transitTodayQ = `
        SELECT COUNT(*) AS NOS
        FROM challan_final
        WHERE Ch_Cancel=0 AND CH_FACTORY=@F
          AND CONVERT(NVARCHAR, CH_DEP_DATE, 111) = @Date111
          AND CH_STATUS = 0
          AND CH_Challan NOT IN (
            SELECT TT_CHLN FROM T_TOKEN WHERE TT_FACTORY=@F
            UNION SELECT tt_chalanNo FROM RECEIPT WHERE TT_FACTORY=@F
            UNION SELECT CL_CHALLAN FROM CHALLANLOCK WHERE cl_factory=@F
          )`;

      // ─── Step 20: Truck transit YESTERDAY (dep before today, CH_STATUS=0) ───
      // TRUCKTRANSITYESTERDAY
      const transitYestQ = `
        SELECT COUNT(*) AS NOS
        FROM challan_final
        WHERE Ch_Cancel=0 AND CH_FACTORY=@F
          AND CONVERT(NVARCHAR, CH_DEP_DATE, 111) <= DATEADD(DAY,-1,@Date111)
          AND CH_STATUS = 0
          AND CH_Challan NOT IN (
            SELECT TT_CHLN FROM T_TOKEN WHERE TT_FACTORY=@F
            UNION SELECT tt_chalanNo FROM RECEIPT WHERE TT_FACTORY=@F
            UNION SELECT CL_CHALLAN FROM CHALLANLOCK WHERE cl_factory=@F
          )`;

      // ─── Execute all queries in parallel ─────────────────────────────────────
      const qp = { F: fcode, Date: sqlDate, Date111: date111, GC: GATECODE };

      const [cropRows, modesRows, oyRows, dongaRows, odcRows, tdcRows,
        cenODC, cenTDC, cenOY, cenDonga, gateHourRows, centreHourRows,
        canePurchRows, cenOperRows, cenPurRows,
        trDispRows, trRecvRows, transTodayRows, transYestRows
      ] = await Promise.all([
        executeQuery(cropQ, { F: fcode, Date: sqlDate }, season).catch(() => []),
        executeQuery(modesQ, { F: fcode }, season).catch(() => []),
        executeQuery(oyQ, qp, season).catch(() => []),
        executeQuery(dongaQ, qp, season).catch(() => []),
        executeQuery(odcQ, qp, season).catch(() => []),
        executeQuery(tdcQ, qp, season).catch(() => []),
        executeQuery(cenODCQ, qp, season).catch(() => []),
        executeQuery(cenTDCQ, qp, season).catch(() => []),
        executeQuery(cenOYQ, { F: fcode }, season).catch(() => []),
        executeQuery(cenDongaQ, { F: fcode }, season).catch(() => []),
        executeQuery(gateHourQ, qp, season).catch(() => []),
        executeQuery(centreHourQ, qp, season).catch(() => []),
        executeQuery(canePurchQ, qp, season).catch(() => []),
        executeQuery(cenOperQ, qp, season).catch(() => []),
        executeQuery(cenPurQ, qp, season).catch(() => []),
        executeQuery(truckDispQ, qp, season).catch(() => []),
        executeQuery(truckRecvQ, qp, season).catch(() => []),
        executeQuery(transitTodayQ, qp, season).catch(() => []),
        executeQuery(transitYestQ, qp, season).catch(() => [])
      ]);

      // ─── Build mode map by md_groupcode ───────────────────────────────────────
      const byGrp = (rows, key) => {
        const m = {};
        (rows || []).forEach(r => { m[String(r.md_groupcode ?? r.md_groupCode ?? '')] = r; });
        return m;
      };
      const oyM = byGrp(oyRows);
      const dongaM = byGrp(dongaRows);
      const odcM = byGrp(odcRows);
      const tdcM = byGrp(tdcRows);

      // md_qty default from modes table (fallback average weight per vehicle)
      const mdQty = {};
      (modesRows || []).forEach(m => {
        const grp = String(m.md_groupcode || '');
        if (grp && !mdQty[grp]) mdQty[grp] = Number(m.md_qty || 0);
      });

      const fmt = v => Number(v || 0).toFixed(2);
      const nos = v => String(Number(v || 0));
      const avg = (w, n) => n > 0 ? Number(w / n).toFixed(2) : '0.00';
      const trunc = (v, p) => Number(Math.round(Number(v) + 'e' + p) + 'e-' + p).toFixed(p);

      const result = { ...defaults, FACTCODE: fcode, dtpDate: rawDate };

      const pad2 = (v) => String(v).padStart(2, '0');
      const formatShiftLabel = (dt) => {
        const h = dt.getHours();
        const ampm = h >= 12 ? 'PM' : 'AM';
        const hour12 = h % 12 === 0 ? 12 : h % 12;
        return `${pad2(hour12)} ${ampm}`;
      };

      const parseShiftStart = (raw) => {
        const parts = String(raw || '').split(':');
        if (parts.length < 2) return { hh: 6, mm: 0, ss: 0 };
        const hh = Number(parts[0]);
        const mm = Number(parts[1]);
        const ss = Number(parts[2] || 0);
        if (!Number.isFinite(hh) || !Number.isFinite(mm) || !Number.isFinite(ss)) return { hh: 6, mm: 0, ss: 0 };
        return { hh, mm, ss };
      };

      const shiftStartParts = parseShiftStart(shiftStartRaw);
      const shiftStartBase = new Date();
      shiftStartBase.setHours(shiftStartParts.hh, shiftStartParts.mm, shiftStartParts.ss, 0);
      const shiftAStart = new Date(shiftStartBase);
      const shiftBStart = new Date(shiftStartBase);
      const shiftCStart = new Date(shiftStartBase);
      shiftBStart.setHours(shiftBStart.getHours() + shiftHours);
      shiftCStart.setHours(shiftCStart.getHours() + (shiftHours * 2));
      const shiftAEnd = new Date(shiftAStart); shiftAEnd.setHours(shiftAEnd.getHours() + shiftHours);
      const shiftBEnd = new Date(shiftBStart); shiftBEnd.setHours(shiftBEnd.getHours() + shiftHours);
      const shiftCEnd = new Date(shiftCStart); shiftCEnd.setHours(shiftCEnd.getHours() + shiftHours);

      result.lblshiftA = `<------${formatShiftLabel(shiftAStart)} TO ${formatShiftLabel(shiftAEnd)}------>`;
      result.lblshiftB = `<------${formatShiftLabel(shiftBStart)} TO ${formatShiftLabel(shiftBEnd)}------>`;
      result.lblshiftC = `<------${formatShiftLabel(shiftCStart)} TO ${formatShiftLabel(shiftCEnd)}------>`;

      // crop days
      result.lblcrop = String(cropRows?.[0]?.lblcrop || '0');

      // Per-mode calculation exactly as .NET HourlyCrushingReport():
      // OY/AtD weight = Avg × Nos; Avg derived from TDC (then ODC, then md_qty fallback)
      const GATE_GROUPS = [
        { key: 'Cart', grp: '1' },
        { key: 'Trolly40', grp: '2' },
        { key: 'Trolly60', grp: '3' },
        { key: 'Truck', grp: '4' }
      ];

      let gateOYNos = 0, gateOYWt = 0, gateAtDNos = 0, gateAtDWt = 0;
      let gateODCNos = 0, gateODCWt = 0, gateTDCNos = 0, gateTDCWt = 0;

      GATE_GROUPS.forEach(({ key, grp }) => {
        const oy = oyM[grp] || {};
        const dg = dongaM[grp] || {};
        const odc = odcM[grp] || {};
        const tdc = tdcM[grp] || {};

        const oyNos = Number(oy.OYNos || 0);
        const atdNos = Number(dg.AtDNos || 0);
        const odcNos = Number(odc.ODCNos || 0);
        const odcWt = Number(odc.ODCWt || 0);
        const tdcNos = Number(tdc.TDCNos || 0);
        const tdcWt = Number(tdc.TDCWt || 0);

        // Average weight per vehicle (TDC preferred, then ODC, then md_qty default)
        let Avg = 0;
        if (tdcNos > 0) Avg = Number(trunc(tdcWt / tdcNos, 2));
        else if (odcNos > 0) Avg = Number(trunc(odcWt / odcNos, 2));
        else Avg = Number(mdQty[grp] || 0);

        // OY/AtD weight is ESTIMATED (Avg × Nos), not actual challan weight
        const oyWt = Number(trunc(Avg * oyNos, 2));
        const atdWt = Number(trunc(Avg * atdNos, 2));

        // ODC Avg
        const odcAvg = odcNos > 0 ? Number(trunc(odcWt / odcNos, 2)) : 0;
        // TDC Avg
        const tdcAvg = tdcNos > 0 ? Number(trunc(tdcWt / tdcNos, 2)) : 0;

        result[`lbl${key}OYNos`] = nos(oyNos);
        result[`lbl${key}OYWt`] = fmt(oyWt);
        result[`lbl${key}AtDNos`] = nos(atdNos);
        result[`lbl${key}AtDWt`] = fmt(atdWt);
        result[`lbl${key}ODCNos`] = nos(odcNos);
        result[`lbl${key}ODCWt`] = fmt(odcWt);
        result[`lbl${key}ODCAvg`] = fmt(odcAvg);
        result[`lbl${key}TDCNos`] = nos(tdcNos);
        result[`lbl${key}TDCWt`] = fmt(tdcWt);
        result[`lbl${key}TDCAvg`] = fmt(tdcAvg);

        gateOYNos += oyNos; gateOYWt += oyWt;
        gateAtDNos += atdNos; gateAtDWt += atdWt;
        gateODCNos += odcNos; gateODCWt += odcWt;
        gateTDCNos += tdcNos; gateTDCWt += tdcWt;
      });

      result.lblGateOYNos = nos(gateOYNos); result.lblGateOYWt = fmt(gateOYWt);
      result.lblGateAtDNos = nos(gateAtDNos); result.lblGateAtDWt = fmt(gateAtDWt);
      result.lblGateODCNos = nos(gateODCNos); result.lblGateODCWt = fmt(gateODCWt);
      result.lblGateODCAvg = avg(gateODCWt, gateODCNos);
      result.lblGateTDCNos = nos(gateTDCNos); result.lblGateTDCWt = fmt(gateTDCWt);
      result.lblGateTDCAvg = avg(gateTDCWt, gateTDCNos);

      // ─── Centre ───────────────────────────────────────────────────────────────
      const cenODCR = cenODC?.[0] || {}; const cenTDCR = cenTDC?.[0] || {};
      const cenOYR = cenOY?.[0] || {}; const cenDongaR = cenDonga?.[0] || {};
      const cenODCNos = Number(cenODCR.ODCNos || 0); const cenODCWt = Number(cenODCR.ODCWt || 0);
      const cenTDCNos = Number(cenTDCR.TDCNos || 0); const cenTDCWt = Number(cenTDCR.TDCWt || 0);
      const cenOYNos = Number(cenOYR.OYNos || 0);
      const cenAtDNos = Number(cenDongaR.AtDNos || 0);

      // Centre OY/AtD weight also estimated from centre TDC avg
      let cenAvg = 0;
      if (cenTDCNos > 0) cenAvg = Number(trunc(cenTDCWt / cenTDCNos, 2));
      else if (cenODCNos > 0) cenAvg = Number(trunc(cenODCWt / cenODCNos, 2));
      const cenOYWt = Number(trunc(cenAvg * cenOYNos, 2));
      const cenAtDWt = Number(trunc(cenAvg * cenAtDNos, 2));
      const cenODCAvg = cenODCNos > 0 ? Number(trunc(cenODCWt / cenODCNos, 2)) : 0;
      const cenTDCAvg = cenTDCNos > 0 ? Number(trunc(cenTDCWt / cenTDCNos, 2)) : 0;

      result.lblCenterOYNos = nos(cenOYNos); result.lblCenterOYWt = fmt(cenOYWt);
      result.lblCenterAtDNos = nos(cenAtDNos); result.lblCenterAtDWt = fmt(cenAtDWt);
      result.lblCenterODCNos = nos(cenODCNos); result.lblCenterODCWt = fmt(cenODCWt);
      result.lblCenterODCAvg = fmt(cenODCAvg);
      result.lblCenterTDCNos = nos(cenTDCNos); result.lblCenterTDCWt = fmt(cenTDCWt);
      result.lblCenterTDCAvg = fmt(cenTDCAvg);

      // ─── Gate + Centre totals ─────────────────────────────────────────────────
      const totOYNos = gateOYNos + cenOYNos; const totOYWt = gateOYWt + cenOYWt;
      const totAtDNos = gateAtDNos + cenAtDNos; const totAtDWt = gateAtDWt + cenAtDWt;
      const totODCNos = gateODCNos + cenODCNos; const totODCWt = gateODCWt + cenODCWt;
      const totTDCNos = gateTDCNos + cenTDCNos; const totTDCWt = gateTDCWt + cenTDCWt;
      result.lblGtCenOYNos = nos(totOYNos); result.lblGtCenOYWt = fmt(totOYWt);
      result.lblGtCenAtDNos = nos(totAtDNos); result.lblGtCenAtDWt = fmt(totAtDWt);
      result.lblGtCenODCNos = nos(totODCNos); result.lblGtCenODCWt = fmt(totODCWt);
      result.lblGtCenODCAvg = avg(totODCWt, totODCNos);
      result.lblGtCenTDCNos = nos(totTDCNos); result.lblGtCenTDCWt = fmt(totTDCWt);
      result.lblGtCenTDCAvg = avg(totTDCWt, totTDCNos);

      // ─── Hourly crushing – gate + centre combined per hour ───────────────────
      // Build hour→weight map, gate first, then add centre
      const hrWt = {}; // hour (0-23) → aggregate weight
      (gateHourRows || []).forEach(r => {
        const h = String(r.hou); hrWt[h] = (hrWt[h] || 0) + Number(r.FinWt || 0);
      });
      (centreHourRows || []).forEach(r => {
        const h = String(r.hou); hrWt[h] = (hrWt[h] || 0) + Number(r.FinWt || 0);
      });

      // Map hour → field key pairs (from frontend shifts definition)
      const hourFields = {
        '6': '6amto7am', '7': '7amto8am', '8': '8amto9am', '9': '9amto10am',
        '10': '10amto11am', '11': '11amto12pm', '12': '12pmto1pm', '13': '1pmto2pm',
        '14': '2pmto3pm', '15': '3pmto4pm', '16': '4pmto5pm', '17': '5pmto6pm',
        '18': '6pmto7pm', '19': '7pmto8pm', '20': '8pmto9pm', '21': '9pmto10pm',
        '22': '10pmto11pm', '23': '11pmto12pm', '0': '12amto1am', '1': '1amto2am',
        '2': '2amto3am', '3': '3amto4am', '4': '4amto5am', '5': '5amto6am'
      };
      Object.entries(hourFields).forEach(([h, key]) => {
        result[`lbl${key}Wt`] = fmt(hrWt[h] || 0);
      });

      // Cumulative total (runs from 6am onward, wrapping through midnight)
      const shiftOrder = ['6', '7', '8', '9', '10', '11', '12', '13',
        '14', '15', '16', '17', '18', '19', '20', '21',
        '22', '23', '0', '1', '2', '3', '4', '5'];
      let cumWt = 0;
      shiftOrder.forEach(h => {
        cumWt += Number(hrWt[h] || 0);
        const key = hourFields[h];
        if (key) result[`lbl${key}TWt`] = fmt(cumWt);
      });

      // Shift totals (A=6-13, B=14-21, C=22-5)
      const Atotal = ['6', '7', '8', '9', '10', '11', '12', '13'].reduce((s, h) => s + (hrWt[h] || 0), 0);
      const Btotal = ['14', '15', '16', '17', '18', '19', '20', '21'].reduce((s, h) => s + (hrWt[h] || 0), 0);
      const Ctotal = ['22', '23', '0', '1', '2', '3', '4', '5'].reduce((s, h) => s + (hrWt[h] || 0), 0);
      result.lblAtotal = fmt(Atotal);
      result.lblBtotal = fmt(Btotal);
      result.lblCtotal = fmt(Ctotal);

      // ─── Cane purchasing 6AM-6PM / 6PM-6AM ──────────────────────────────────
      const cp = {};
      (canePurchRows || []).forEach(r => { cp[String(r.TAG)] = Number(r.FinWt || 0); });
      result.lblToday6AMto6PMWT = fmt((cp['GATE_TODAY'] || 0) + (cp['CENTER_TODAY'] || 0));
      result.lblToday6PMto6AMWT = fmt((cp['GATE_TOD_PM'] || 0) + (cp['CENTER_TOD_PM'] || 0));
      result.lblYes6AMto6PMWT = fmt((cp['GATE_YES'] || 0) + (cp['CENTER_YES'] || 0));
      result.lblYes6PMto6AMWT = fmt((cp['GATE_YES_PM'] || 0) + (cp['CENTER_YES_PM'] || 0));
      result.lblToDToT = fmt((cp['GATE_TODAY'] || 0) + (cp['CENTER_TODAY'] || 0) + (cp['GATE_TOD_PM'] || 0) + (cp['CENTER_TOD_PM'] || 0));
      result.lblYESToT = fmt((cp['GATE_YES'] || 0) + (cp['CENTER_YES'] || 0) + (cp['GATE_YES_PM'] || 0) + (cp['CENTER_YES_PM'] || 0));

      // ─── Centre operated / purchase ───────────────────────────────────────────
      result.lblopr = nos(cenOperRows?.[0]?.NOS);
      result.lblCenPur = fmt(cenPurRows?.[0]?.WT);

      // ─── Truck dispatched / received ──────────────────────────────────────────
      result.lblTruckDisp = nos(trDispRows?.[0]?.NOS);
      result.lblTruckRecv = nos(trRecvRows?.[0]?.NOS);

      // ─── Truck transit (as NOS/WT format like .NET) ───────────────────────────
      // Weight = NOS * Avg (where Avg = cenTDCWt/cenTDCNos, the .NET approach)
      const transitAvg = cenTDCNos > 0 ? Number(trunc(cenTDCWt / cenTDCNos, 2)) : 0;
      const transNosToday = Number(transTodayRows?.[0]?.NOS || 0);
      const transNosYest = Number(transYestRows?.[0]?.NOS || 0);
      const transWtToday = Number(trunc(transNosToday * transitAvg, 2));
      const transWtYest = Number(trunc(transNosYest * transitAvg, 2));
      result.lblTRANSTODAY = `${transNosToday}/${transWtToday.toFixed(2)}`;
      result.lbltransitwtyesterday = `${transNosYest}/${transWtYest.toFixed(2)}`;

      // ─── Yard+Donga (OYWt + AtDWt for Gate+Centre) ───────────────────────────
      const yardDongaWt = totOYWt + totAtDWt;
      result.lbltyarddobga = fmt(yardDongaWt);
      result.lblYDTWEIGHT = fmt(yardDongaWt + transWtYest + transWtToday);

      // ─── Crush rate per hour (Atotal+Btotal+Ctotal / running minutes * 60) ───
      // GetShiftRunningHours: minutes elapsed since shift start (6am default)
      const now = new Date();
      const reportDate = new Date(sqlDate);
      const isSameDay = reportDate.toDateString() === now.toDateString();
      const shiftStartMinutes = (shiftStartParts.hh * 60) + shiftStartParts.mm;
      const nowMinutes = (now.getHours() * 60) + now.getMinutes();
      let minutesElapsed;
      if (isSameDay) {
        minutesElapsed = nowMinutes - shiftStartMinutes;
        if (minutesElapsed <= 0) minutesElapsed += 24 * 60;
      } else {
        minutesElapsed = 24 * 60;
      }
      minutesElapsed = Math.max(1, Math.min(minutesElapsed, 24 * 60));
      if (minutesElapsed > 24 * 60) minutesElapsed = 24 * 60;
      const SHTOTAL = Atotal + Btotal + Ctotal;
      const crushRate = minutesElapsed > 0 ? Number(trunc((SHTOTAL / minutesElapsed) * 60, 2)) : 0;
      const exCrush = Number(trunc(crushRate * 24, 2));
      result.lblcrushrate = fmt(crushRate);
      result.lblExp = fmt(exCrush);

      // Hours of cane available (Yard+Donga / crush rate)
      result.lblNHour = crushRate > 0 ? String(Math.floor(yardDongaWt / crushRate)) : '0';

      return res.status(200).json(result);
    } catch (error) {
      if (typeof next === 'function') return next(error);
      throw error;
    }
  };
}

exports.CrushingReport = createCrushingDataHandler();


