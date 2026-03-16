const { executeProcedure, executeQuery } = require('../core/db/query-executor');
const reportService = require('../services/report.service');

const CONTROLLER = 'Report';

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
'Imagesblub', 'LOADMODEWISEDATA', 'LOADFACTORYDATA'
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
const result = await executeProcedure(action, params, season);
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
       where isnull((case when isnull(cte.HH, '') = '' then ct1.HH when isnull(cte.HH, '') = '' then cte.HH else cte.HH end ),0)= @Hour 
       order by (case when isnull(cte.HH,'')= '' then ct1.HH when isnull(cte.HH,'')= '' then cte.HH else  cte.HH end )`;

    const getHourlyArrivalData = async (unit, date, hour) => {
      const rows = await executeQuery(arrivalSql, { Unit: unit, Date: date, Hour: hour }, season).catch(() => []);
      return rows && rows.length ? rows[0] : null;
    };

    const dt = hoursRows.map((r) => ({
      DIS_HOU: r.DIS_HOU,
      hours: Number(r.hours),
      TwoDBeforeCart: 0, TwoDBeforeTrolly: 0, TwoDBeforeTruck: 0,
      OneDBeforeCart: 0, OneDBeforeTrolly: 0, OneDBeforeTruck: 0,
      RDBeforeCart: 0, RDBeforeTrolly: 0, RDBeforeTruck: 0
    }));

    for (const row of dt) {
      let hour = String(row.hours);
      if (hour === '24') hour = '0';
      const h = Number(hour);

      const t2 = await getHourlyArrivalData(fcode, TDBDT, h);
      if (t2) {
        row.TwoDBeforeCart = Number(t2.CART) || 0;
        row.TwoDBeforeTrolly = Number(t2.TROLLY) || 0;
        row.TwoDBeforeTruck = Number(t2.Truck) || 0;
      }
      const t1 = await getHourlyArrivalData(fcode, ODBDT, h);
      if (t1) {
        row.OneDBeforeCart = Number(t1.CART) || 0;
        row.OneDBeforeTrolly = Number(t1.TROLLY) || 0;
        row.OneDBeforeTruck = Number(t1.Truck) || 0;
      }
      const t0 = await getHourlyArrivalData(fcode, CURDATE, h);
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

exports.LoansummaryRpt = createProcedureHandler(CONTROLLER, 'LoansummaryRpt', '');
exports.LoansummaryRpt_2 = createProcedureHandler(CONTROLLER, 'LoansummaryRpt', 'LoanSummaryModel model');
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


