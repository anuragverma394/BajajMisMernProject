const { executeProcedure, executeQuery } = require('../core/db/query-executor');
const reportService = require('../services/report.service');

const CONTROLLER = 'Report';

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
* Normalizes a date string to 'YYYY-MM-DD' format for SQL queries.
* Accepts dd/mm/yyyy, dd-mm-yyyy or yyyy-mm-dd.
*/
function toSqlDateAnalysis(raw) {
const s = String(raw || '').trim();
if (!s) return '';
// dd/mm/yyyy or dd-mm-yyyy
const ddmmyyyy = s.match(/^(\d{2})[\-\/](\d{2})[\-\/](\d{4})$/);
if (ddmmyyyy) return `${ddmmyyyy[3]}-${ddmmyyyy[2]}-${ddmmyyyy[1]}`;
// yyyy-mm-dd
if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s;
return '';
}

/**
* Fetches all 4 analysis datasets by running direct SQL queries
* (mirroring the .NET sugarReportDataAccess.cs methods).
*
* Section 1 – Main hours table (cane crush + lab hour):  GetHours × GetCaneCrush × GetLabhourdata
* Section 2 – Juice analysis:                            GetTimeJuiceData / GetJuicedata
* Section 3 – Bagasse:                                   GetBagass
* Section 4 – Final Molasses:                            GetFMolasses
*/
function createAnalysisHandler() {
return async (req, res, next) => {
try {
const season = req.user?.season || req.query?.season || req.body?.season || process.env.DEFAULT_SEASON || '2526';
const p = { ...(req.query || {}), ...(req.body || {}) };

// Resolve factory code
const fcode = String(
p.F_code ?? p.F_Code ?? p.factcode ?? p.FACTCODE ?? p.unit ?? p.factoryCode ?? p.FACTORY ?? p.factory ?? ''
).trim();

// Resolve and normalise date → YYYY-MM-DD for SQL
const rawDate = String(p.Date ?? p.DATE ?? p.date ?? p.DDATE ?? p.DDate ?? '').trim();
const sqlDate = toSqlDateAnalysis(rawDate);

if (!sqlDate) {
return res.status(200).json(buildAnalysisDefaults());
}

// ── Shared query parameters (safe, parameterized – prevents SQL injection) ──
// All user-supplied values are passed as named @params through mssql request.input()
// so they are NEVER concatenated into the SQL string.
const hasFactory = !(!fcode || fcode === '0');
const qpDate = { Date: sqlDate };                              // @Date
const qpAll = { Date: sqlDate, Factory: fcode };             // @Date + @Factory

// ── Section 1a: All hour slots from Mi_Hours (static, no user input) ─────
const hoursQ = `SELECT SN, HOURS, SNCC FROM Mi_Hours ORDER BY SN ASC`;

// ── Section 1b: Cane crush weight per hour for the selected day ───────────
const caneCrushQ = hasFactory
? `SELECT hou, SUM(FinWt) AS FinWt FROM (
SELECT SUM(CAST(M_GROSS - M_TARE - M_JOONA AS DECIMAL(18,2))) AS FinWt,
DATEPART(hour, M_TARE_DT) AS hou
FROM PURCHASE
WHERE CAST(M_DATE AS DATE) = @Date AND M_FACTORY = @Factory AND M_CENTRE IN (100)
GROUP BY DATEPART(hour, M_TARE_DT)
UNION ALL
SELECT SUM(CAST(tt_grossweight - tt_tareweight - tt_joonaweight AS DECIMAL(18,2))) AS FinWt,
DATEPART(hour, TT_TARE_DT) AS hou
FROM RECEIPT
WHERE CAST(TT_DATE AS DATE) = @Date AND TT_FACTORY = @Factory
AND TT_CENTER NOT IN (100) AND tt_tareweight > 0
GROUP BY DATEPART(hour, TT_TARE_DT)
) Temp GROUP BY hou`
: `SELECT hou, SUM(FinWt) AS FinWt FROM (
SELECT SUM(CAST(M_GROSS - M_TARE - M_JOONA AS DECIMAL(18,2))) AS FinWt,
DATEPART(hour, M_TARE_DT) AS hou
FROM PURCHASE
WHERE CAST(M_DATE AS DATE) = @Date AND M_CENTRE IN (100)
GROUP BY DATEPART(hour, M_TARE_DT)
UNION ALL
SELECT SUM(CAST(tt_grossweight - tt_tareweight - tt_joonaweight AS DECIMAL(18,2))) AS FinWt,
DATEPART(hour, TT_TARE_DT) AS hou
FROM RECEIPT
WHERE CAST(TT_DATE AS DATE) = @Date AND TT_CENTER NOT IN (100) AND tt_tareweight > 0
GROUP BY DATEPART(hour, TT_TARE_DT)
) Temp GROUP BY hou`;

// ── Section 1c: Lab hour readings per hour ────────────────────────────────


const labHourQ = hasFactory
? `SELECT SHIFT, Time,
CAST(ISNULL(Col2, 0) AS NUMERIC(18,0)) AS Juice,
ADD_WATER, '0' AS MDF,
ISNULL(L_31,0)+ISNULL(L_30,0)+ISNULL(L_29,0)
+ISNULL(M_31,0)+ISNULL(M_30,0)+ISNULL(M_29,0)
+ISNULL(S_31,0)+ISNULL(S_30,0)+ISNULL(S_29,0) AS SugarBags
FROM LAB_HOUR
WHERE factory = @Factory AND CAST(H_DATE AS DATE) = @Date`
: (hasFactory   
? `SELECT Time,
SUM(CAST(ISNULL(Col2, 0) AS NUMERIC(18,0))) AS Juice,
SUM(ADD_WATER) AS ADD_WATER, '0' AS MDF,
SUM(ISNULL(L_31,0)+ISNULL(L_30,0)+ISNULL(L_29,0)
+ISNULL(M_31,0)+ISNULL(M_30,0)+ISNULL(M_29,0)
+ISNULL(S_31,0)+ISNULL(S_30,0)+ISNULL(S_29,0)) AS SugarBags
FROM LAB_HOUR
WHERE factory = @Factory AND CAST(H_DATE AS DATE) = @Date
GROUP BY Time`
: `SELECT Time,
SUM(CAST(ISNULL(Col2, 0) AS NUMERIC(18,0))) AS Juice,
SUM(ADD_WATER) AS ADD_WATER, '0' AS MDF,
SUM(ISNULL(L_31,0)+ISNULL(L_30,0)+ISNULL(L_29,0)
+ISNULL(M_31,0)+ISNULL(M_30,0)+ISNULL(M_29,0)
+ISNULL(S_31,0)+ISNULL(S_30,0)+ISNULL(S_29,0)) AS SugarBags
FROM LAB_HOUR
WHERE CAST(H_DATE AS DATE) = @Date
GROUP BY Time`);

// ── Section 2: Juice analysis per hour ────────────────────────────────────
const juiceDataQ = hasFactory
? `SELECT h.Hours AS TIME1,
AVG(PJ_BX) AS PrimaryBrix, AVG(PJ_POL) AS PrimaryPol, AVG(PJ_PY) AS PrimaryPurity,
AVG(MJ_BX) AS MixBrix,     AVG(MJ_POL) AS MixPol,     AVG(MJ_PY) AS MixPurity,
AVG(LMJ_BX) AS BrixML
FROM LAB_DAILY lab
JOIN MI_Hours h ON h.SN = lab.TIME1
WHERE factory = @Factory AND CAST(DDATE AS DATE) = @Date
AND MJ_PY > 0 AND PJ_PY > 0
GROUP BY h.SN, h.Hours
ORDER BY h.SN ASC`
: `SELECT h.Hours AS TIME1,
AVG(PJ_BX) AS PrimaryBrix, AVG(PJ_POL) AS PrimaryPol, AVG(PJ_PY) AS PrimaryPurity,
AVG(MJ_BX) AS MixBrix,     AVG(MJ_POL) AS MixPol,     AVG(MJ_PY) AS MixPurity,
AVG(LMJ_BX) AS BrixML
FROM LAB_DAILY lab
JOIN MI_Hours h ON h.SN = lab.TIME1
WHERE CAST(DDATE AS DATE) = @Date
AND MJ_PY > 0 AND PJ_PY > 0
GROUP BY h.SN, h.Hours
ORDER BY h.SN ASC`;

// ── Section 3: Bagasse (Pol + Moisture) per hour ──────────────────────────
const bagasseQ = hasFactory
? `SELECT h.Hours AS Time, AVG(B_POL) AS Pol, AVG(B_MOIS) AS Mois
FROM LAB_DAILY lab
JOIN MI_Hours h ON h.SN = lab.TIME1
WHERE factory = @Factory AND CAST(DDATE AS DATE) = @Date
GROUP BY h.SN, h.Hours
ORDER BY h.SN ASC`
: `SELECT h.Hours AS Time, AVG(B_POL) AS Pol, AVG(B_MOIS) AS Mois
FROM LAB_DAILY lab
JOIN MI_Hours h ON h.SN = lab.TIME1
WHERE CAST(DDATE AS DATE) = @Date
GROUP BY h.SN, h.Hours
ORDER BY h.SN ASC`;

// ── Section 4: Final Molasses per hour ────────────────────────────────────
const molassesQ = hasFactory
? `SELECT h.SN, h.Hours AS Time,
FM_BX AS Brix, FM_POL AS Pol, FM_PY AS Purity,
ISNULL((SELECT SUM(SS_BX) FROM LAB_DAILY
WHERE factory = lab.factory AND TIME1 = lab.TIME AND DDATE = lab.DDATE), 0) AS QuadBrix
FROM LAB_ABC_HEAVY lab
JOIN MI_Hours h ON h.SN = lab.TIME
WHERE lab.factory = @Factory AND CAST(lab.DDATE AS DATE) = @Date
ORDER BY h.SN ASC`
: `SELECT h.SN, h.Hours AS Time,
FM_BX AS Brix, FM_POL AS Pol, FM_PY AS Purity,
ISNULL((SELECT SUM(SS_BX) FROM LAB_DAILY
WHERE TIME1 = lab.TIME AND DDATE = lab.DDATE), 0) AS QuadBrix
FROM LAB_ABC_HEAVY lab
JOIN MI_Hours h ON h.SN = lab.TIME
WHERE CAST(lab.DDATE AS DATE) = @Date
ORDER BY h.SN ASC`;

// ── Execute all queries in parallel using safe parameterized inputs ────────
const labHourParams = (hasFactory && !isGola) ? qpAll : (hasFactory ? qpAll : qpDate);
const [hoursRows, caneCrushRows, labHourRows, juiceRows, bagasseRows, molassesRows] = await Promise.all([
executeQuery(hoursQ, {}, season).catch(() => []),
executeQuery(caneCrushQ, hasFactory ? qpAll : qpDate, season).catch(() => []),
executeQuery(labHourQ, labHourParams, season).catch(() => []),
executeQuery(juiceDataQ, hasFactory ? qpAll : qpDate, season).catch(() => []),
executeQuery(bagasseQ, hasFactory ? qpAll : qpDate, season).catch(() => []),
executeQuery(molassesQ, hasFactory ? qpAll : qpDate, season).catch(() => [])
]);

// ── Build Section 1: merge hours + caneCrush + labHour ───────────────────
// Build a map from hour→caneCrush weight
const caneCrushMap = {};
for (const r of caneCrushRows) {
const h = String(r.hou ?? '').trim();
if (h) caneCrushMap[h] = Number(r.FinWt || 0);
}
// Build a map from Time→labHour row
const labHourMap = {};
for (const r of labHourRows) {
const t = String(r.Time ?? '').trim();
if (t) labHourMap[t] = r;
}

let tccrush = 0;
let tjtank = 0;
let twhtank = 0;
let tsbag = 0;

const mainRows = (hoursRows || []).map((hourRow) => {
const sncc = String(hourRow.SNCC ?? '').trim();
const hourLabel = String(hourRow.HOURS ?? '').trim();
const hourNum = String(hourRow.SN ?? '').trim();

const crushWt = caneCrushMap[sncc] || 0;
const lab = labHourMap[hourNum] || null;

if (crushWt > 0) tccrush += crushWt;

let juice = 0, addWater = 0, sugarBags = 0;
let juicePct = 0, waterPct = 0, baggingRecoveryPct = 0, dmf = 0;

if (lab) {
juice = Number(lab.Juice || 0);
addWater = Number(lab.ADD_WATER || 0);
sugarBags = Number(lab.SugarBags || 0);

tjtank += juice;
twhtank += addWater;
tsbag += sugarBags;

if (tjtank > 0 && tccrush > 0) juicePct = Math.round(((tjtank * 10) / tccrush) * 100 * 100) / 100;
if (twhtank > 0 && tccrush > 0) waterPct = Math.round(((twhtank * 10) / tccrush) * 100 * 100) / 100;
if (tsbag > 0 && tccrush > 0) baggingRecoveryPct = Math.round(((tsbag / tccrush) * 100) * 100) / 100;
if (juicePct > 0 && waterPct > 0) dmf = Math.round((juicePct - (juicePct * 0.4 / 100) - waterPct) * 100) / 100;
}

return {
Time: hourLabel,
CaneCrush: Math.round(crushWt * 100) / 100,
JuiceInTon: Math.round(juice * 100) / 100,
JuicePct: juicePct,
WaterInTon: Math.round(addWater * 100) / 100,
WaterPct: waterPct,
DMF: dmf,
SugarBags: sugarBags,
BaggingRecoveryPct: baggingRecoveryPct
};
});

// ── Build Section 2: juice analysis rows ─────────────────────────────────
const juiceAnalysisRows = (juiceRows || []).map((r) => ({
Time: String(r.TIME1 ?? ''),
PrimaryBrix: Number(r.PrimaryBrix || 0),
PrimaryPol: Number(r.PrimaryPol || 0),
PrimaryPurity: Number(r.PrimaryPurity || 0),
MixBrix: Number(r.MixBrix || 0),
MixPol: Number(r.MixPol || 0),
MixPurity: Number(r.MixPurity || 0),
BrixML: Number(r.BrixML || 0)
}));

// ── Build Section 3: bagasse rows ────────────────────────────────────────
const bagasseDataRows = (bagasseRows || []).map((r) => ({
Time: String(r.Time ?? ''),
Pol: Number(r.Pol || 0),
Mois: Number(r.Mois || 0)
}));

// ── Build Section 4: molasses rows ───────────────────────────────────────
const molassesDataRows = (molassesRows || []).map((r) => ({
Time: String(r.Time ?? ''),
Brix: Number(r.Brix || 0),
Pol: Number(r.Pol || 0),
Purity: Number(r.Purity || 0),
QuadBrix: Number(r.QuadBrix || 0)
}));

return res.status(200).json({
success: true,
message: 'Report.Analysisdata executed',
data: mainRows,
recordsets: [mainRows, juiceAnalysisRows, bagasseDataRows, molassesDataRows]
});
} catch (error) {
if (typeof next === 'function') return next(error);
throw error;
}
};
}

exports.CrushingReport = createProcedureHandler(CONTROLLER, 'CrushingReport', '');
exports.Imagesblub = createCrushingHandler('Imagesblub');
exports.LOADMODEWISEDATA = createCrushingHandler('LOADMODEWISEDATA');
exports.LOADFACTORYDATA = createCrushingHandler('LOADFACTORYDATA');
exports.Value = createProcedureHandler(CONTROLLER, 'Value', 'string a');
exports.GetYesterdaytransitDetail = createProcedureHandler(CONTROLLER, 'GetYesterdaytransitDetail', '');
exports.GetTodaytransitDetail = createProcedureHandler(CONTROLLER, 'GetTodaytransitDetail', '');
exports.Analysisdata = createAnalysisHandler();
/**
* CentrePurchase – mirrors CenterPurchase.cs → GetCentrePurchaseByCDO
* Returns rows: SN, m_Centre, C_Name, 1stwmtTime, LastWmtTime, PurchyNos,
*               PurQty, VehDispatchNos, 1stdisptchAt, LastDisptchAt, Recieved, Balance
*/
function createCentrePurchaseHandler() {
return async (req, res, next) => {
try {
const season = req.user?.season || req.query?.season || req.body?.season || process.env.DEFAULT_SEASON || '2526';
const p = { ...(req.query || {}), ...(req.body || {}) };

const fcode = String(
p.F_code ?? p.F_Code ?? p.factcode ?? p.FACTCODE ?? p.unit ?? p.factory ?? p.FACTORY ?? ''
).trim();

const rawDate = String(p.Date ?? p.DATE ?? p.date ?? p.DDATE ?? p.DDate ?? '').trim();
const sqlDate = toSqlDateAnalysis(rawDate); // reuse existing date normalizer

if (!sqlDate || !fcode || fcode === '0' || fcode === 'All') {
return res.status(200).json({ success: true, message: 'CentrePurchase: missing params', data: [], recordsets: [[]] });
}

// Direct SQL – mirrors the .NET DAL (CenterPurchase.cs) – no CDO filter applied
// (CDO-based block restriction only applies in the .NET mobile app flow)
const sql = `
WITH cet AS (
SELECT m_Centre, M_Factory,
CASE WHEN CAST(MIN(M_GROS_DT) AS DATE) = @Date
THEN CASE WHEN CONVERT(varchar(5), ISNULL(MIN(M_GROS_DT), 0), 8) = '0'
THEN CONVERT(varchar(5), ISNULL(MIN(M_TARE_DT), 0), 8)
ELSE CONVERT(varchar(5), ISNULL(MIN(M_GROS_DT), 0), 8) END
ELSE CONVERT(varchar(5), ISNULL(MIN(M_TARE_DT), 0), 8)
END AS [1stwmtTime],
CONVERT(varchar(5), ISNULL(MAX(M_TARE_DT), 0), 8) AS LastWmtTime,
COUNT(m_Number) AS PurchyNos,
SUM(ISNULL((M_GROSS - M_TARE - M_JOONA), 0)) AS PurQty
FROM Purchase
WHERE M_TARE_DT != '1900-01-01'
AND CAST(M_TARE_DT AS DATE) = @Date
AND M_FACTORY = @Factory
GROUP BY m_Centre, M_Factory
),
etc AS (
SELECT CH_Centre, ch_Factory,
COUNT(DISTINCT ch_Challan) AS VehDispatchNos,
CONVERT(varchar(5), ISNULL(MIN(Ch_dep_date), 0), 8) AS [1stdisptchAt],
CONVERT(varchar(5), ISNULL(MAX(Ch_dep_date), 0), 8) AS LastDisptchAt,
SUM(CASE WHEN CH_status > 0 THEN 1 ELSE 0 END) AS Recieved
FROM challan_Final
WHERE Ch_Cancel = 0
AND CAST(Ch_dep_date AS DATE) = @Date
AND Ch_dep_date != '1900-01-01'
AND CH_Factory = @Factory
GROUP BY CH_Centre, ch_Factory
)
SELECT
ROW_NUMBER() OVER (ORDER BY cn.c_code) AS SN,
cn.c_code  AS m_Centre,
cn.C_Name,
ISNULL(c.[1stwmtTime],  0) AS [1stwmtTime],
ISNULL(c.LastWmtTime,   0) AS LastWmtTime,
ISNULL(c.PurchyNos,     0) AS PurchyNos,
ISNULL(c.PurQty,        0) AS PurQty,
ISNULL(e.VehDispatchNos,0) AS VehDispatchNos,
ISNULL(e.[1stdisptchAt],0) AS [1stdisptchAt],
ISNULL(e.LastDisptchAt, 0) AS LastDisptchAt,
ISNULL(e.Recieved,      0) AS Recieved,
ISNULL((e.VehDispatchNos - e.Recieved), 0) AS Balance
FROM Centre cn
LEFT JOIN cet c ON c.M_CENTRE = cn.c_code AND c.M_FACTORY = cn.c_factory
LEFT JOIN etc e ON e.CH_Centre = cn.c_code
WHERE cn.c_factory = @Factory AND cn.C_HHC_Centre > 0
ORDER BY c_code`;

const rows = await executeQuery(sql, { Date: sqlDate, Factory: fcode }, season).catch(() => []);

return res.status(200).json({
success: true,
message: 'CentrePurchase executed',
data: rows,
recordsets: [rows]
});
} catch (error) {
if (typeof next === 'function') return next(error);
throw error;
}
};
}

exports.CentrePurchase = createCentrePurchaseHandler();
/**
* TruckDispatchWeighed – mirrors sugarReportDataAccess.cs
* filterType (query param): all | yesterday-transit | transit | at-yard | at-donga | weighed
* Returns columns: SN, C_Code, c_name, ChalanNo, TruckNo, Transporter,
*                  DepartureTime, ArrivalTime, WeighmentTime, TravelTime, WailtTime
*/
function createTruckDispatchWeighedHandler() {
return async (req, res, next) => {
try {
const season = req.user?.season || req.query?.season || req.body?.season || process.env.DEFAULT_SEASON || '2526';
const p = { ...(req.query || {}), ...(req.body || {}) };

console.log(`[TruckDispatchWeighed] Raw request - Query:`, JSON.stringify(req.query), `Body:`, JSON.stringify(req.body));

const fcode = String(
p.F_code ?? p.F_Code ?? p.factcode ?? p.FACTCODE ?? p.unit ?? p.factory ?? p.FACTORY ?? ''
).trim();

const rawDate = String(p.Date ?? p.DATE ?? p.date ?? p.DDATE ?? p.DDate ?? '').trim();
const sqlDate = toSqlDateAnalysis(rawDate);
const filterType = String(p.filterType ?? p.type ?? 'all').toLowerCase().trim();

console.log(`[TruckDispatchWeighed] Parsed - Factory: '${fcode}', RawDate: '${rawDate}', SqlDate: '${sqlDate}', Filter: '${filterType}', Season: '${season}'`);

if (!sqlDate || !fcode || fcode === '0' || fcode === 'All') {
console.log(`[TruckDispatchWeighed] Missing parameters - Factory: '${fcode}', Date: '${sqlDate}'`);
return res.status(200).json({ success: true, message: 'TruckDispatchWeighed: missing params', data: [], recordsets: [[]] });
}

// ── Shared SELECT & FROM ──────────────────────────────────────────────────
// Identical column set in all 4 .NET methods
const BASE_SELECT = `
SELECT
ROW_NUMBER() OVER (ORDER BY cf.Ch_Centre) AS SN,
cf.Ch_Centre                              AS C_Code,
c.C_Name,
cf.ch_challan                             AS ChalanNo,
t.TR_CODE                                 AS Tr_Code,
t.TR_NAME                                 AS Transporter,
cf.Ch_truck_no                            AS TruckNo,
CONVERT(varchar, ISNULL(cf.Ch_dep_date, '01/01/1900'), 103)
+ ' ' + CONVERT(varchar, ISNULL(cf.Ch_dep_date, '01/01/1900'), 8)
AS DepartureTime,
CONVERT(varchar,
CASE WHEN ISNULL(TK.tt_TokDatetime, '01/01/1900') = '01/01/1900'
THEN ISNULL(r.tt_Date, '01/01/1900')
ELSE ISNULL(TK.tt_TokDatetime, '01/01/1900') END, 103)
+ ' ' + CONVERT(varchar,
CASE WHEN ISNULL(TK.tt_TokDatetime, '01/01/1900') = '01/01/1900'
THEN ISNULL(r.tt_Date, '01/01/1900')
ELSE ISNULL(TK.tt_TokDatetime, '01/01/1900') END, 8)
AS ArrivalTime,
CONVERT(varchar, ISNULL(r.tt_TARE_DT, '01/01/1900'), 103)
+ ' ' + CONVERT(varchar, ISNULL(r.tt_TARE_DT, '01/01/1900'), 8)
AS WeighmentTime,
CONVERT(varchar(5),
DATEADD(minute, DATEDIFF(minute,
CONVERT(varchar, ISNULL(cf.Ch_dep_date, '01/01/1900'), 8),
CONVERT(varchar,
CASE WHEN ISNULL(TK.tt_TokDatetime, '01/01/1900') = '01/01/1900'
THEN ISNULL(r.tt_Date, cf.Ch_dep_date)
ELSE ISNULL(TK.tt_TokDatetime, '01/01/1900') END, 8)), 0), 114)
AS TravelTime,
CONVERT(varchar(5),
DATEADD(minute, DATEDIFF(minute,
CONVERT(varchar,
CASE WHEN ISNULL(TK.tt_TokDatetime, '01/01/1900') = '01/01/1900'
THEN ISNULL(r.tt_Date, '01/01/1900')
ELSE ISNULL(TK.tt_TokDatetime, '01/01/1900') END, 8),
CONVERT(varchar,
CASE WHEN ISNULL(r.tt_TARE_DT, '1900-01-01') = '1900-01-01'
THEN ISNULL(r.tt_Date, ISNULL(TK.tt_TokDatetime, '01/01/1900'))
ELSE ISNULL(r.tt_TARE_DT, '1900-01-01') END, 8)), 0), 114)
AS WailtTime
FROM challan_final cf
LEFT JOIN Receipt    r  ON r.tt_factory = cf.ch_Factory
          AND r.tt_center  = cf.Ch_Centre
          AND r.tt_chalanNo = cf.ch_challan
JOIN  centre         c  ON c.c_factory   = cf.ch_Factory
          AND c.C_Code      = cf.Ch_Centre
JOIN  Transporter    t  ON t.TR_FACTORY  = cf.ch_Factory
          AND t.TR_CODE     = cf.ch_trans
LEFT JOIN T_TOKEN    TK ON TK.TT_FACTORY = cf.CH_FACTORY
          AND TK.TT_CHLN    = cf.CH_CHALLAN
WHERE cf.ch_cancel = 0
AND cf.ch_Factory = @Factory`;

// ── Per-type WHERE additions ──────────────────────────────────────────────
let extraWhere = '';
let postFilter = '';   // applied after the subquery (ArrivalTime check)

switch (filterType) {
case 'yesterday-transit':
extraWhere = ` AND CAST(cf.Ch_dep_date AS DATE) < @Date`;
postFilter = ` AND ArrivalTime = '01/01/1900 00:00:00'`;
break;
case 'transit':
extraWhere = ` AND CAST(cf.Ch_dep_date AS DATE) = @Date`;
postFilter = ` AND ArrivalTime = '01/01/1900 00:00:00'`;
break;
case 'at-yard':
// Has a token (arrived at yard) but not yet weighed
extraWhere = ` AND CAST(cf.Ch_dep_date AS DATE) = @Date
AND cf.ch_challan IN (SELECT TT_CHLN FROM T_Token WHERE TT_FACTORY = @Factory AND CAST(TT_DATE AS DATE) <= @Date)`;
break;
case 'at-donga':
// Arrived (has receipt) but tare weight = 0 (at donga – not weighed yet)
extraWhere = ` AND CAST(cf.Ch_dep_date AS DATE) = @Date AND r.tt_tareWeight = 0`;
break;
case 'weighed':
extraWhere = ` AND CAST(cf.Ch_dep_date AS DATE) = @Date AND r.tt_TARE_DT IS NOT NULL AND r.tt_TARE_DT != '1900-01-01'`;
break;
case 'all':
default:
extraWhere = ` AND CAST(cf.Ch_dep_date AS DATE) = @Date`;
break;
}

const sql = postFilter
? `SELECT * FROM (${BASE_SELECT}${extraWhere}) AS Tmp WHERE 1=1${postFilter} ORDER BY C_Code`
: `${BASE_SELECT}${extraWhere} ORDER BY cf.Ch_Centre`;

console.log(`[TruckDispatchWeighed] Executing SQL for filter: ${filterType}, with params: Date=${sqlDate}, Factory=${fcode}`);

const rows = await executeQuery(sql, { Date: sqlDate, Factory: fcode }, season).catch((err) => {
  console.error(`[TruckDispatchWeighed] SQL Error:`, err.message);
  return [];
});

console.log(`[TruckDispatchWeighed] Retrieved ${rows.length} rows`);

return res.status(200).json({
success: true,
message: `TruckDispatchWeighed [${filterType}] executed`,
data: rows,
recordsets: [rows]
});
} catch (error) {
if (typeof next === 'function') return next(error);
throw error;
}
};
}

exports.TruckDispatchWeighed = createTruckDispatchWeighedHandler();
/**
* IndentFailSummary – mirrors sugarReportDataAccess.cs
*   GETINDENTFAILURESUMMARY  → main rows with Early / OtherThanEarly / Total columns
*   GETINDENTFAILURE2DAYBACK → pipeline balance (PIPBALIND) merged per date
*
* Returned columns (match screenshot header):
*   IS_IS_DT (Date)
*   ERINDQTY, EINDWT, EACTWT, EPURCHYPERC, EWTPERC                 ← Early
*   OTINDQTY, OTINDWT, OTACTWT, OTPURCHYPERC, OTWTPERC             ← Other Than Early
*   TOTINDQTY, TOTINDWT, TOTACTWT, TOTPURCHYPERC, TOTWTPERC         ← Total
*   BALTOTINDQTY, PIPBALIND, TOTBALIND                              ← Balance
*/
function createIndentFailSummaryHandler() {
return async (req, res, next) => {
try {
const season = req.user?.season || req.query?.season || req.body?.season || process.env.DEFAULT_SEASON || '2526';
const p = { ...(req.query || {}), ...(req.body || {}) };

const fcode = String(
p.F_code ?? p.F_Code ?? p.FACT ?? p.unit ?? p.factory ?? p.FACTORY ?? ''
).trim();

const rawDate = String(p.Date ?? p.DATE ?? p.date ?? p.DDATE ?? '').trim();
const sqlDate = toSqlDateAnalysis(rawDate); // gives YYYY-MM-DD

if (!sqlDate || !fcode || fcode === '0' || fcode === 'All') {
return res.status(200).json({ success: true, message: 'IndentFailSummary: missing params', data: [], recordsets: [[]] });
}

// .NET computes a ±5 day window around the given date
const centerDate = new Date(sqlDate);
const startDate = new Date(centerDate); startDate.setDate(centerDate.getDate() - 5);
const endDate = new Date(centerDate); endDate.setDate(centerDate.getDate() + 5);
const fmtYMD = (d) => `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, '0')}${String(d.getDate()).padStart(2, '0')}`;
const dtStart = fmtYMD(startDate);
const dtEnd   = fmtYMD(endDate);
// Precompute the 2-day-back pipeline window dates (used in pipSql)
const pipEndDate   = new Date(endDate); pipEndDate.setDate(endDate.getDate() - 1);
const pipStartDate = new Date(endDate); pipStartDate.setDate(endDate.getDate() - 2);
const pipEnd   = fmtYMD(pipEndDate);
const pipStart = fmtYMD(pipStartDate);

// ── Query 1: Main summary rows ────────────────────────────────────────────
const mainSql = `
WITH CT AS (
SELECT IS_FACTORY, IS_DS_DT,
ISNULL(SUM(CASE WHEN IS_CATEG IN (10,11,12,13) THEN MD_QTY ELSE 0 END), 0) ERINDQTY,
ISNULL(SUM(CASE WHEN IS_CATEG IN (10,11,12,13) AND IS_STATUS IN (1,5) THEN MD_QTY ELSE 0 END), 0) EINDWT,
ISNULL(SUM(CASE WHEN IS_CATEG NOT IN (10,11,12,13) THEN MD_QTY ELSE 0 END), 0) OTINDQTY,
ISNULL(SUM(CASE WHEN IS_CATEG NOT IN (10,11,12,13) AND IS_STATUS IN (1,5) THEN MD_QTY ELSE 0 END), 0) OTINDWT
FROM ISSUED LEFT JOIN MODE ON IS_MODE = MD_CODE AND MD_FACTORY = IS_FACTORY
WHERE IS_FACTORY = @Fact
AND CONVERT(NVARCHAR, IS_DS_DT, 112) BETWEEN @DtStart AND @DtEnd
GROUP BY IS_FACTORY, IS_DS_DT
),
CTE AS (
SELECT M_FACTORY, M_IND_DT,
ISNULL(SUM(CASE WHEN M_CATEG NOT IN (10,11,12,13) THEN (M_GROSS - M_TARE - M_JOONA) ELSE 0 END), 0) OTACTWT,
ISNULL(SUM(CASE WHEN M_CATEG IN (10,11,12,13) THEN (M_GROSS - M_TARE - M_JOONA) ELSE 0 END), 0) EACTWT
FROM PURCHASE LEFT JOIN MODE ON M_MODE = MD_CODE AND MD_FACTORY = M_FACTORY
WHERE M_FACTORY = @Fact
AND CONVERT(NVARCHAR, M_IND_DT, 112) BETWEEN @DtStart AND @DtEnd
GROUP BY M_FACTORY, M_IND_DT
)
SELECT
IS_FACTORY,
CONVERT(NVARCHAR, IS_DS_DT, 103) AS IS_IS_DT,
ISNULL(ERINDQTY, 0) AS ERINDQTY,
ISNULL(EINDWT,   0) AS EINDWT,
ISNULL(EACTWT,   0) AS EACTWT,
'0' AS EPURCHYPERC,
'0' AS EWTPERC,
ISNULL(OTINDQTY, 0) AS OTINDQTY,
ISNULL(OTINDWT,  0) AS OTINDWT,
ISNULL(OTACTWT,  0) AS OTACTWT,
'0' AS OTPURCHYPERC,
'0' AS OTWTPERC,
(ISNULL(ERINDQTY, 0) + ISNULL(OTINDQTY, 0)) AS TOTINDQTY,
(ISNULL(EINDWT,   0) + ISNULL(OTINDWT,  0)) AS TOTINDWT,
(ISNULL(EACTWT,   0) + ISNULL(OTACTWT,  0)) AS TOTACTWT,
'0' AS TOTPURCHYPERC,
'0' AS TOTWTPERC,
((ISNULL(ERINDQTY, 0) + ISNULL(OTINDQTY, 0)) - (ISNULL(EINDWT, 0) + ISNULL(OTINDWT, 0))) AS BALTOTINDQTY,
'0' AS PIPBALIND,
'0' AS TOTBALIND
FROM CT
LEFT JOIN CTE ON CT.IS_DS_DT = CTE.M_IND_DT AND CT.IS_FACTORY = CTE.M_FACTORY
ORDER BY CT.IS_DS_DT`;

// ── Query 2: 2-day-back pipeline balance ──────────────────────────────────
const pipSql = `
WITH CT AS (
SELECT IS_FACTORY, IS_DS_DT,
ISNULL(SUM(CASE WHEN LEFT(CAST(IS_CATEG AS VARCHAR), 1) = '1' THEN MD_QTY ELSE 0 END), 0) TDERINDQTY,
ISNULL(SUM(CASE WHEN LEFT(CAST(IS_CATEG AS VARCHAR), 1) != '1' THEN MD_QTY ELSE 0 END), 0) TDOTINDQTY
FROM ISSUED LEFT JOIN MODE ON IS_MODE = MD_CODE AND MD_FACTORY = IS_FACTORY
WHERE IS_FACTORY = @Fact
AND CONVERT(NVARCHAR, IS_DS_DT, 112) BETWEEN @PipStart AND @PipEnd
GROUP BY IS_FACTORY, IS_DS_DT
),
CTE AS (
SELECT M_FACTORY, M_IND_DT,
ISNULL(SUM(CASE WHEN LEFT(CAST(M_CATEG AS VARCHAR), 1) = '1' THEN MD_QTY ELSE 0 END), 0) TDEINDWT,
ISNULL(SUM(CASE WHEN LEFT(CAST(M_CATEG AS VARCHAR), 1) != '1' THEN MD_QTY ELSE 0 END), 0) TDOTINDWT
FROM PURCHASE LEFT JOIN MODE ON M_MODE = MD_CODE AND MD_FACTORY = M_FACTORY
WHERE M_FACTORY = @Fact
AND CONVERT(NVARCHAR, M_IND_DT, 112) BETWEEN @PipStart AND @PipEnd
GROUP BY M_FACTORY, M_IND_DT
)
SELECT
CONVERT(NVARCHAR, CT.IS_DS_DT, 103) AS IS_DS_DT,
ISNULL((TDERINDQTY + TDOTINDQTY), 0) AS TDQTY,
ISNULL((TDEINDWT + TDOTINDWT), 0)    AS TDWT,
ISNULL(((TDERINDQTY + TDOTINDQTY) - (TDEINDWT + TDOTINDWT)), 0) AS BAL
FROM CT
LEFT JOIN CTE ON CT.IS_DS_DT = CTE.M_IND_DT AND CT.IS_FACTORY = CTE.M_FACTORY
ORDER BY CT.IS_DS_DT`;

const [mainRows, pipRows] = await Promise.all([
executeQuery(mainSql, { Fact: fcode, DtStart: dtStart, DtEnd: dtEnd }, season).catch(() => []),
executeQuery(pipSql,  { Fact: fcode, PipStart: pipStart, PipEnd: pipEnd }, season).catch(() => [])
]);

// Compute pipeline balance sum (all 2-day-back rows)
const pipBal = pipRows.reduce((sum, r) => sum + (Number(r.BAL) || 0), 0);

// Merge percentages and pipeline balance into each main row
const n = (v) => Number(String(v ?? '').replace(/,/g, '')) || 0;
const pct = (a, b) => (b > 0 ? ((a / b) * 100).toFixed(2) : '0.00');

const merged = mainRows.map(row => {
const erIndQty = n(row.ERINDQTY);
const eIndWt = n(row.EINDWT);
const eActWt = n(row.EACTWT);
const otIndQty = n(row.OTINDQTY);
const otIndWt = n(row.OTINDWT);
const otActWt = n(row.OTACTWT);
const totIndQty = erIndQty + otIndQty;
const totIndWt = eIndWt + otIndWt;
const totActWt = eActWt + otActWt;
const balTot = totIndQty - totIndWt;
const totBal = balTot + pipBal;

return {
...row,
EPURCHYPERC: pct(erIndQty - eIndWt, erIndQty),
EWTPERC: pct(erIndQty - eActWt, erIndQty),
OTPURCHYPERC: pct(otIndQty - otIndWt, otIndQty),
OTWTPERC: pct(otIndQty - otActWt, otIndQty),
TOTINDQTY: totIndQty,
TOTINDWT: totIndWt,
TOTACTWT: totActWt,
TOTPURCHYPERC: pct(totIndQty - totIndWt, totIndQty),
TOTWTPERC: pct(totIndQty - totActWt, totIndQty),
BALTOTINDQTY: balTot,
PIPBALIND: pipBal,
TOTBALIND: totBal
};
});

return res.status(200).json({
success: true,
message: 'IndentFailSummary executed',
data: merged,
recordsets: [merged]
});
} catch (error) {
if (typeof next === 'function') return next(error);
throw error;
}
};
}

exports.IndentFailSummary = createIndentFailSummaryHandler();
exports.IndentFailSummaryData = createIndentFailSummaryHandler(); // same handler, kept for route compat
exports.IndentFaillDetails = createProcedureHandler(CONTROLLER, 'IndentFaillDetails', '');
exports.IndentFaillDetailsData = createProcedureHandler(CONTROLLER, 'IndentFaillDetailsData', 'string Date, string FACT');
exports.TargetActualMISReport = createProcedureHandler(CONTROLLER, 'TargetActualMISReport', '');
exports.TargetActualMISPeriodReport = createProcedureHandler(CONTROLLER, 'TargetActualMISPeriodReport', '');
exports.txtdate_TextChanged = createProcedureHandler(CONTROLLER, 'txtdate_TextChanged', 'string Date');
exports.next = createProcedureHandler(CONTROLLER, 'next', 'string Date');
exports.prev = createProcedureHandler(CONTROLLER, 'prev', 'string Date');
/**
 * DriageSummary — mirrors DriageClerkCentreDetail.cs: GETDRIAGESUMMARY + GETCLOSINGBALANCE
 * Columns: SLNO, C_CODE, C_NAME, PQTY, RQTY, CLBAL, TOTREPT, DRQTY, PERC
 */
function createDriageSummaryHandler() {
  return async (req, res, next) => {
    try {
      const p = { ...(req.query || {}), ...(req.body || {}) };
      const fcode = String(p.F_code ?? p.F_Code ?? p.FACT ?? p.unit ?? p.factory ?? '').trim();
      const rawDate = String(p.Date ?? p.DATE ?? p.date ?? p.DDATE ?? '').trim();
      const sqlDate = toSqlDateAnalysis(rawDate);

      if (!sqlDate || !fcode) {
        return res.status(200).json({ success: true, data: [], recordsets: [[]] });
      }

      const fmtYMD = (d) => `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, '0')}${String(d.getDate()).padStart(2, '0')}`;
      const dt = fmtYMD(new Date(sqlDate));

      const season = p.season || process.env.DEFAULT_SEASON || '2526';

      // ── Main GETDRIAGESUMMARY query ───────────────────────────────────────
      const mainSql = `
        WITH CEN AS (
          SELECT C_FACTORY, C_CODE, C_NAME FROM CENTRE WHERE C_FACTORY = @Fact
        ),
        PUR AS (
          SELECT MC_GCode AS M_CENTRE,
            ISNULL(SUM(ISNULL(M_GROSS,0) - ISNULL(M_TARE,0) - ISNULL(M_JOONA,0)), 0) PQTY
          FROM PURCHASE
          JOIN MI_MargeCenter ON MC_CCODE = M_CENTRE AND MC_FACTORY = M_FACTORY
            AND CONVERT(NVARCHAR, M_DATE, 112) <= @Dt AND M_FACTORY = @Fact
          GROUP BY MC_GCode
        ),
        REP AS (
          SELECT TT_CENTER,
            ISNULL(SUM(ISNULL(TT_GROSSWEIGHT,0) - ISNULL(TT_TAREWEIGHT,0) - ISNULL(TT_JOONAWEIGHT,0)), 0) RQTY
          FROM RECEIPT
          JOIN CENTRE ON C_CODE = TT_CENTER AND C_FACTORY = TT_FACTORY
            AND CONVERT(NVARCHAR, tt_DpDate, 112) <= @Dt AND TT_FACTORY = @Fact
          GROUP BY TT_CENTER
        )
        SELECT
          C_FACTORY, C_CODE, C_NAME,
          ISNULL(PQTY, 0) PQTY,
          ISNULL(RQTY, 0) RQTY,
          '0' AS CLBAL, '0' AS TOTREPT, '0' AS DRQTY, '0' AS PERC
        FROM CEN
        JOIN PUR ON C_CODE = M_CENTRE
        LEFT JOIN REP ON M_CENTRE = TT_CENTER
        WHERE C_CODE != 100
        ORDER BY C_CODE`;

      const mainRows = await executeQuery(mainSql, { Fact: fcode, Dt: dt }, season).catch(() => []);

      // ── Fetch CLBal per centre from CHALLAN_FINAL ─────────────────────────
      const balSql = `
        SELECT CH_CENTRE, MAX(CH_CHALLAN) CH_CHALLAN, ISNULL(CH_BALANCE, 0) CH_BALANCE
        FROM CHALLAN_FINAL
        WHERE Ch_Cancel = 0 AND CH_FACTORY = @Fact
          AND CONVERT(NVARCHAR, CH_DEP_DATE, 112) = @Dt
        GROUP BY CH_CENTRE, CH_BALANCE
        ORDER BY CH_CHALLAN DESC`;

      const balRows = await executeQuery(balSql, { Fact: fcode, Dt: dt }, season).catch(() => []);
      const balMap = {};
      balRows.forEach(r => {
        const cc = String(r.CH_CENTRE);
        if (!balMap[cc]) balMap[cc] = Number(r.CH_BALANCE) || 0;
      });

      // ── Compute derived columns ───────────────────────────────────────────
      const n = (v) => Number(String(v ?? '').replace(/,/g, '')) || 0;
      const pct = (a, b) => (b > 0 ? ((a / b) * 100).toFixed(2) : '0.00');
      const merged = mainRows.map((row, idx) => {
        const pqty = n(row.PQTY);
        const rqty = n(row.RQTY);
        const clbal = balMap[String(row.C_CODE)] ?? 0;
        const total = rqty + clbal;           // TOTREPT = RQTY + CLBAL
        const drqty = pqty - total;           // DRQTY = PQTY - TOTREPT
        const perc = pct(drqty, pqty);
        return {
          ...row,
          SLNO: idx + 1,
          CLBAL: clbal,
          TOTREPT: total,
          DRQTY: drqty < 0 ? 0 : drqty,
          PERC: perc
        };
      });

      return res.status(200).json({ success: true, data: merged, recordsets: [merged] });
    } catch (error) {
      if (typeof next === 'function') return next(error);
      throw error;
    }
  };
}

exports.DriageSummary = createDriageSummaryHandler();
exports.DriageDetail = createProcedureHandler(CONTROLLER, 'DriageDetail', 'string FACT, string DATE, string CENTER');
/**
 * DriageClerkSummary — mirrors DriageClerkCentreDetail.cs:
 *   GETDRIAGEDETAILSClerk  → clerks grouped from PURCHASE/RECEIPT via USERS table
 *   GETOpeningGBALANCEClerk → opening balance per clerk from CHALLAN_FINAL (date-1)
 *   GETCLOSINGBALANCEClerk → closing balance per clerk from CHALLAN_FINAL
 * Columns: SLNO, u_code (Code), u_Name (Name Of Clerk), OPBAL, PQTY, RQTY, CLBAL, TOTREPT, DRQTY, PERC
 */
function createDriageClerkSummaryHandler() {
  return async (req, res, next) => {
    try {
      const p = { ...(req.query || {}), ...(req.body || {}) };
      const fcode = String(p.F_code ?? p.F_Code ?? p.FACT ?? p.unit ?? p.factory ?? '').trim();
      const rawDate = String(p.Date ?? p.DATE ?? p.date ?? p.DDATE ?? '').trim();
      const sqlDate = toSqlDateAnalysis(rawDate);

      if (!sqlDate || !fcode) {
        return res.status(200).json({ success: true, data: [], recordsets: [[]] });
      }

      const fmtYMD = (d) => `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, '0')}${String(d.getDate()).padStart(2, '0')}`;
      const dt = fmtYMD(new Date(sqlDate));
      // date - 1 day (for opening/closing balance queries)
      const dtPrev = (() => { const d = new Date(sqlDate); d.setDate(d.getDate() - 1); return fmtYMD(d); })();

      const season = p.season || process.env.DEFAULT_SEASON || '2526';

      // ── Main clerk summary query (GETDRIAGEDETAILSClerk) ──────────────────
      const mainSql = `
        WITH PUR AS (
          SELECT M_TARE_OPR,
            MIN(CAST(M_DATE AS Date)) Mfrom,
            MAX(CAST(M_DATE AS Date)) MTill,
            ISNULL(SUM(ISNULL(M_GROSS,0) - ISNULL(M_TARE,0) - ISNULL(M_JOONA,0)), 0) PQTY
          FROM PURCHASE
          WHERE CONVERT(NVARCHAR, M_DATE, 112) <= @Dt
            AND M_FACTORY = @Fact AND M_CENTRE != 100
          GROUP BY M_TARE_OPR
        ),
        REP AS (
          SELECT tt_Clerk,
            MAX(CAST(tt_DpDate AS Date)) TFrom,
            MAX(CAST(tt_DpDate AS Date)) TTill,
            ISNULL(SUM(ISNULL(TT_GROSSWEIGHT,0) - ISNULL(TT_TAREWEIGHT,0) - ISNULL(TT_JOONAWEIGHT,0)), 0) RQTY
          FROM RECEIPT
          WHERE CONVERT(NVARCHAR, tt_DpDate, 112) <= @Dt
            AND TT_FACTORY = @Fact
          GROUP BY tt_Clerk
        )
        SELECT
          U_factory AS factory, U_code, U_Name,
          CONVERT(VARCHAR, MIN(Mfrom), 103) MFrom,
          CONVERT(VARCHAR, MAX(MTill), 103) Till,
          ISNULL(SUM(PQTY), 0) PQTY,
          ISNULL(SUM(RQTY), 0) RQTY,
          '0' AS CLBAL, '0' AS OPBAL, '0' AS TOTREPT, '0' AS DRQTY, '0' AS PERC
        FROM PUR
        FULL OUTER JOIN REP ON M_TARE_OPR = tt_Clerk
        JOIN users ON U_code = M_TARE_OPR AND U_code = tt_Clerk
        WHERE U_factory = @Fact
        GROUP BY U_factory, U_code, U_Name
        ORDER BY MIN(Mfrom), MAX(MTill)`;

      const mainRows = await executeQuery(mainSql, { Fact: fcode, Dt: dt }, season).catch(() => []);

      // ── Opening balance per clerk (CHALLAN_FINAL, date <= dtPrev) ──────────
      const opSql = `
        SELECT ch_op_code, ISNULL(CH_BALANCE, 0) CH_BALANCE
        FROM CHALLAN_FINAL
        WHERE Ch_Cancel = 0 AND CH_FACTORY = @Fact
          AND CONVERT(NVARCHAR, CH_DEP_DATE, 112) <= @DtPrev
          AND CH_CHALLAN = (
            SELECT MAX(CH_CHALLAN) FROM CHALLAN_FINAL cf2
            WHERE cf2.Ch_Cancel = 0 AND cf2.CH_FACTORY = CHALLAN_FINAL.CH_FACTORY
              AND cf2.ch_op_code = CHALLAN_FINAL.ch_op_code
              AND CONVERT(NVARCHAR, cf2.CH_DEP_DATE, 112) <= @DtPrev
          )`;

      const opRows = await executeQuery(opSql, { Fact: fcode, DtPrev: dtPrev }, season).catch(() => []);
      const opMap = {};
      opRows.forEach(r => { opMap[String(r.ch_op_code)] = Number(r.CH_BALANCE) || 0; });

      // ── Closing balance per clerk (CHALLAN_FINAL, exact date) ─────────────
      const clSql = `
        SELECT ch_op_code, ISNULL(CH_BALANCE, 0) CH_BALANCE
        FROM CHALLAN_FINAL
        WHERE Ch_Cancel = 0 AND CH_FACTORY = @Fact
          AND CONVERT(NVARCHAR, CH_DEP_DATE, 112) = @Dt
          AND CH_CHALLAN = (
            SELECT MAX(CH_CHALLAN) FROM CHALLAN_FINAL cf2
            WHERE cf2.Ch_Cancel = 0 AND cf2.CH_FACTORY = CHALLAN_FINAL.CH_FACTORY
              AND cf2.ch_op_code = CHALLAN_FINAL.ch_op_code
              AND CONVERT(NVARCHAR, cf2.CH_DEP_DATE, 112) = @Dt
          )`;

      const clRows = await executeQuery(clSql, { Fact: fcode, Dt: dt }, season).catch(() => []);
      const clMap = {};
      clRows.forEach(r => { clMap[String(r.ch_op_code)] = Number(r.CH_BALANCE) || 0; });

      // ── Merge & compute derived columns ───────────────────────────────────
      const nv = (v) => Number(String(v ?? '').replace(/,/g, '')) || 0;
      const pct = (a, b) => (b > 0 ? ((a / b) * 100).toFixed(2) : '0.00');
      const merged = mainRows.map((row, idx) => {
        const pqty = nv(row.PQTY);
        const rqty = nv(row.RQTY);
        const opbal = opMap[String(row.U_code)] ?? 0;
        const clbal = clMap[String(row.U_code)] ?? 0;
        const total = rqty + clbal;          // TOTREPT = RQTY + CLBAL
        const drqty = Math.max(0, pqty - total);
        const perc = pct(drqty, pqty);
        return {
          ...row,
          SLNO: idx + 1,
          OPBAL: opbal,
          CLBAL: clbal,
          TOTREPT: total,
          DRQTY: drqty,
          PERC: perc
        };
      });

      return res.status(200).json({ success: true, data: merged, recordsets: [merged] });
    } catch (error) {
      if (typeof next === 'function') return next(error);
      throw error;
    }
  };
}

exports.DriageClerkSummary = createDriageClerkSummaryHandler();
exports.DriageClerkDetail = createProcedureHandler(CONTROLLER, 'DriageClerkDetail', 'string FACT, string DATE, string CLERK');
exports.DriageCentreDetail = createProcedureHandler(CONTROLLER, 'DriageCentreDetail', 'string FACT, string DATE, string CLERK, string CENTER');
exports.DriageCentreClerkDetail = createProcedureHandler(CONTROLLER, 'DriageCentreClerkDetail', '');
exports.DriageClerkCentreDetail = createProcedureHandler(CONTROLLER, 'DriageClerkCentreDetail', '');
exports.BudgetVSActual = createProcedureHandler(CONTROLLER, 'BudgetVSActual', '');
exports.IndentFailSummaryNew = createProcedureHandler(CONTROLLER, 'IndentFailSummaryNew', '');
exports.IndentFailSummaryNewData = createProcedureHandler(CONTROLLER, 'IndentFailSummaryNewData', 'string F_code, string Date');
/**
 * HourlyCaneArrival – mirrors HourlyCaneArrival stored procedure
 * Returns arrival counts per hour for selected date, yesterday, and day before.
 * Categories: Cart (Group 1), Trolly (Group 2,3), Truck (Group 4)
 */
exports.HourlyCaneArrival = async (req, res, next) => {
  try {
    const season = req.user?.season || req.query?.season || req.body?.season || process.env.DEFAULT_SEASON || '2526';
    const p = { ...(req.query || {}), ...(req.body || {}) };
    const fcode = String(p.F_code ?? p.F_Code ?? p.unit ?? p.factory ?? 'All').trim();
    const rawDate = String(p.Fdate ?? p.Date ?? p.date ?? '').trim();
    const sqlDate = toSqlDateAnalysis(rawDate);

    if (!sqlDate) return res.status(200).json({ status: 'error', message: 'Invalid date' });

    // Dates for T, T-1, T-2
    const d1 = sqlDate;
    const d2 = new Date(sqlDate); d2.setDate(d2.getDate() - 1);
    const d2str = d2.toISOString().split('T')[0];
    const d3 = new Date(sqlDate); d3.setDate(d3.getDate() - 2);
    const d3str = d3.toISOString().split('T')[0];

    const fmtDate = (d) => {
      const dt = new Date(d);
      return `${String(dt.getDate()).padStart(2, '0')}/${String(dt.getMonth() + 1).padStart(2, '0')}/${dt.getFullYear()}`;
    };

    const qp = { D1: d1, D2: d2str, D3: d3str, Fact: fcode };
    const factFilter = (fcode === 'All' || fcode === '0') ? '' : 'AND M_FACTORY = @Fact';
    const factFilterR = (fcode === 'All' || fcode === '0') ? '' : 'AND TT_FACTORY = @Fact';

    const sql = `
      WITH RawData AS (
        SELECT 
          DATEPART(HOUR, M_GROS_DT) AS HOU,
          CASE 
            WHEN M_DATE = @D1 THEN 'T'
            WHEN M_DATE = @D2 THEN 'T1'
            WHEN M_DATE = @D3 THEN 'T2'
          END AS DTAG,
          CASE 
            WHEN md.md_groupcode = 1 THEN 'Cart'
            WHEN md.md_groupcode IN (2, 3) THEN 'Trolly'
            WHEN md.md_groupcode = 4 THEN 'Truck'
            ELSE 'Other'
          END AS CAT,
          COUNT(*) AS NOS
        FROM PURCHASE p
        JOIN Mode md ON p.M_MODE = md.md_code AND md.MD_FACTORY = p.M_FACTORY
        WHERE M_DATE IN (@D1, @D2, @D3) ${factFilter}
        GROUP BY DATEPART(HOUR, M_GROS_DT), M_DATE, md.md_groupcode
        UNION ALL
        SELECT 
          DATEPART(HOUR, TT_TARE_DT) AS HOU,
          CASE 
            WHEN TT_DATE = @D1 THEN 'T'
            WHEN TT_DATE = @D2 THEN 'T1'
            WHEN TT_DATE = @D3 THEN 'T2'
          END AS DTAG,
          CASE 
            WHEN md.md_groupcode = 1 THEN 'Cart'
            WHEN md.md_groupcode IN (2, 3) THEN 'Trolly'
            WHEN md.md_groupcode = 4 THEN 'Truck'
            ELSE 'Other'
          END AS CAT,
          COUNT(*) AS NOS
        FROM RECEIPT r
        JOIN Mode md ON r.TT_MODE = md.md_code AND md.MD_FACTORY = r.TT_FACTORY
        WHERE TT_DATE IN (@D1, @D2, @D3) ${factFilterR}
        GROUP BY DATEPART(HOUR, TT_TARE_DT), TT_DATE, md.md_groupcode
      )
      SELECT HOU, DTAG, CAT, SUM(NOS) AS TOTAL_NOS
      FROM RawData
      WHERE HOU IS NOT NULL
      GROUP BY HOU, DTAG, CAT`;

    const rows = await executeQuery(sql, qp, season).catch(() => []);

    // Pivot logic
    const pivot = {};
    for (let i = 0; i < 24; i++) {
        pivot[i] = {
            DIS_HOU: `${String(i).padStart(2, '0')}-${String((i + 1) % 24).padStart(2, '0')}`,
            TwoDBeforeCart: 0, TwoDBeforeTrolly: 0, TwoDBeforeTruck: 0,
            OneDBeforeCart: 0, OneDBeforeTrolly: 0, OneDBeforeTruck: 0,
            RDBeforeCart: 0, RDBeforeTrolly: 0, RDBeforeTruck: 0
        };
    }

    rows.forEach(r => {
        const h = r.HOU;
        const tag = r.DTAG;
        const cat = r.CAT;
        const val = r.TOTAL_NOS;

        if (tag === 'T2') {
            if (cat === 'Cart') pivot[h].TwoDBeforeCart += val;
            else if (cat === 'Trolly') pivot[h].TwoDBeforeTrolly += val;
            else if (cat === 'Truck') pivot[h].TwoDBeforeTruck += val;
        } else if (tag === 'T1') {
            if (cat === 'Cart') pivot[h].OneDBeforeCart += val;
            else if (cat === 'Trolly') pivot[h].OneDBeforeTrolly += val;
            else if (cat === 'Truck') pivot[h].OneDBeforeTruck += val;
        } else if (tag === 'T') {
            if (cat === 'Cart') pivot[h].RDBeforeCart += val;
            else if (cat === 'Trolly') pivot[h].RDBeforeTrolly += val;
            else if (cat === 'Truck') pivot[h].RDBeforeTruck += val;
        }
    });

    const data = Object.values(pivot);
    const totals = {
        TwoDBeforeCart: 0, TwoDBeforeTrolly: 0, TwoDBeforeTruck: 0,
        OneDBeforeCart: 0, OneDBeforeTrolly: 0, OneDBeforeTruck: 0,
        RDBeforeCart: 0, RDBeforeTrolly: 0, RDBeforeTruck: 0
    };

    data.forEach(row => {
        totals.TwoDBeforeCart += row.TwoDBeforeCart;
        totals.TwoDBeforeTrolly += row.TwoDBeforeTrolly;
        totals.TwoDBeforeTruck += row.TwoDBeforeTruck;
        totals.OneDBeforeCart += row.OneDBeforeCart;
        totals.OneDBeforeTrolly += row.OneDBeforeTrolly;
        totals.OneDBeforeTruck += row.OneDBeforeTruck;
        totals.RDBeforeCart += row.RDBeforeCart;
        totals.RDBeforeTrolly += row.RDBeforeTrolly;
        totals.RDBeforeTruck += row.RDBeforeTruck;
    });

    return res.status(200).json({
        status: 'success',
        data: data,
        grandTotals: totals,
        dates: {
            date1: fmtDate(d1),
            date2: fmtDate(d2str),
            date3: fmtDate(d3str)
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
            AND CAST(p.M_DATE AS DATE) = @Date
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
            AND CAST(p.M_DATE AS DATE) <= @Date
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
        WHERE CAST(tt_Date AS DATE) = @Date
          AND tt_center NOT IN (SELECT value FROM STRING_SPLIT(@GC, ','))
          AND TT_FACTORY = @F
          AND ISNULL(TT_TAREWEIGHT,0) > 0`;

      // ─── Step 9: Centre TDC ──────────────────────────────────────────────────
      // GETCENTREVEHICLECOUNTTODATE / GETCENTRETODATEQUANTITY
      const cenTDCQ = `
        SELECT ISNULL(COUNT(tt_chalanNo),0) AS TDCNos,
               ISNULL(SUM(tt_grossweight-tt_tareweight-tt_joonaweight),0) AS TDCWt
        FROM RECEIPT
        WHERE CAST(tt_Date AS DATE) <= @Date
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
        WHERE CAST(M_DATE AS DATE) = @Date
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
        WHERE CAST(TT_DATE AS DATE) = @Date
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
        WHERE CAST(M_DATE AS DATE) = @Date
          AND DATEPART(HOUR,M_TARE_DT) BETWEEN 6 AND 17
          AND M_FACTORY=@F AND M_CENTRE IN (SELECT value FROM STRING_SPLIT(@GC,','))
        UNION ALL
        SELECT 'CENTER_TODAY',
               ISNULL(SUM(TT_GROSSWEIGHT-TT_TAREWEIGHT-TT_JOONAWEIGHT),0)
        FROM RECEIPT
        WHERE CAST(TT_DATE AS DATE) = @Date
          AND DATEPART(HOUR,TT_TARE_DT) BETWEEN 6 AND 17
          AND TT_FACTORY=@F AND TT_CENTER NOT IN (SELECT value FROM STRING_SPLIT(@GC,','))
        UNION ALL
        SELECT 'GATE_TOD_PM',
               ISNULL(SUM(M_GROSS-M_TARE-M_JOONA),0)
        FROM PURCHASE
        WHERE CAST(M_DATE AS DATE) = @Date
          AND DATEPART(HOUR,M_TARE_DT) IN (0,1,2,3,4,5,18,19,20,21,22,23)
          AND M_FACTORY=@F AND M_CENTRE IN (SELECT value FROM STRING_SPLIT(@GC,','))
        UNION ALL
        SELECT 'CENTER_TOD_PM',
               ISNULL(SUM(TT_GROSSWEIGHT-TT_TAREWEIGHT-TT_JOONAWEIGHT),0)
        FROM RECEIPT
        WHERE CAST(TT_DATE AS DATE) = @Date
          AND DATEPART(HOUR,TT_TARE_DT) IN (0,1,2,3,4,5,18,19,20,21,22,23)
          AND TT_FACTORY=@F AND TT_CENTER NOT IN (SELECT value FROM STRING_SPLIT(@GC,','))
          AND tt_tareWeight > 0
        UNION ALL
        SELECT 'GATE_YES',
               ISNULL(SUM(M_GROSS-M_TARE-M_JOONA),0)
        FROM PURCHASE
        WHERE CAST(M_DATE AS DATE) = DATEADD(DAY,-1,@Date)
          AND DATEPART(HOUR,M_TARE_DT) BETWEEN 6 AND 17
          AND M_FACTORY=@F AND M_CENTRE IN (SELECT value FROM STRING_SPLIT(@GC,','))
        UNION ALL
        SELECT 'CENTER_YES',
               ISNULL(SUM(TT_GROSSWEIGHT-TT_TAREWEIGHT-TT_JOONAWEIGHT),0)
        FROM RECEIPT
        WHERE CAST(TT_DATE AS DATE) = DATEADD(DAY,-1,@Date)
          AND DATEPART(HOUR,TT_TARE_DT) BETWEEN 6 AND 17
          AND TT_FACTORY=@F AND TT_CENTER NOT IN (SELECT value FROM STRING_SPLIT(@GC,','))
        UNION ALL
        SELECT 'GATE_YES_PM',
               ISNULL(SUM(M_GROSS-M_TARE-M_JOONA),0)
        FROM PURCHASE
        WHERE CAST(M_DATE AS DATE) = DATEADD(DAY,-1,@Date)
          AND DATEPART(HOUR,M_TARE_DT) IN (0,1,2,3,4,5,18,19,20,21,22,23)
          AND M_FACTORY=@F AND M_CENTRE IN (SELECT value FROM STRING_SPLIT(@GC,','))
        UNION ALL
        SELECT 'CENTER_YES_PM',
               ISNULL(SUM(TT_GROSSWEIGHT-TT_TAREWEIGHT-TT_JOONAWEIGHT),0)
        FROM RECEIPT
        WHERE CAST(TT_DATE AS DATE) = DATEADD(DAY,-1,@Date)
          AND DATEPART(HOUR,TT_TARE_DT) IN (0,1,2,3,4,5,18,19,20,21,22,23)
          AND TT_FACTORY=@F AND TT_CENTER NOT IN (SELECT value FROM STRING_SPLIT(@GC,','))
          AND tt_tareWeight > 0`;

      // ─── Step 15: Centre operated today (distinct centres in PURCHASE, not gate) ─
      // CENTEROPERATED
      const cenOperQ = `
        SELECT COUNT(DISTINCT M_CENTRE) AS NOS
        FROM PURCHASE
        WHERE CAST(M_DATE AS DATE) = @Date
          AND M_CENTRE NOT IN (SELECT value FROM STRING_SPLIT(@GC,','))
          AND M_FACTORY=@F`;

      // ─── Step 16: Centre purchase weight today (not gate) ──────────────────
      // CENTERPURCHASE
      const cenPurQ = `
        SELECT ISNULL(SUM(M_GROSS-M_TARE-M_JOONA),0) AS WT
        FROM PURCHASE
        WHERE CAST(M_DATE AS DATE) = @Date
          AND M_CENTRE NOT IN (SELECT value FROM STRING_SPLIT(@GC,','))
          AND M_FACTORY=@F`;

      // ─── Step 17: Truck dispatched today (CHALLAN_FINAL, all challans) ──────
      // TRUCKDISPATCHED: COUNT(CH_CHALLAN) from challan_final for today, ch_cancel=0
      const truckDispQ = `
        SELECT COUNT(CH_CHALLAN) AS NOS
        FROM challan_final
        WHERE Ch_Cancel=0 AND CH_FACTORY=@F
          AND CAST(CH_DEP_DATE AS DATE) = @Date`;

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
          AND CAST(CH_DEP_DATE AS DATE) = @Date
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
          AND CAST(CH_DEP_DATE AS DATE) <= DATEADD(DAY,-1,@Date)
          AND CH_STATUS = 0
          AND CH_Challan NOT IN (
            SELECT TT_CHLN FROM T_TOKEN WHERE TT_FACTORY=@F
            UNION SELECT tt_chalanNo FROM RECEIPT WHERE TT_FACTORY=@F
            UNION SELECT CL_CHALLAN FROM CHALLANLOCK WHERE cl_factory=@F
          )`;

      // ─── Execute all queries in parallel ─────────────────────────────────────
      const qp = { F: fcode, Date: sqlDate, GC: GATECODE };

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
