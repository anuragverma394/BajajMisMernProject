const { executeQuery } = require('../core/db/query-executor');

const CONTROLLER = 'Main';

function toIsoFromDDMMYYYY(value) {
  const m = String(value || '').match(/^(\d{2})[-\/](\d{2})[-\/](\d{4})$/);
  if (!m) return null;
  return `${m[3]}-${m[2]}-${m[1]}`;
}

function normalizeFactoryCodeList(value) {
  const raw = String(value || '').trim();
  if (!raw || raw === '0') return '';
  const compact = raw.replace(/\s+/g, '');
  if (!/^\d+(,\d+)*$/.test(compact)) return '';
  return compact
    .split(',')
    .filter(Boolean)
    .map((v) => String(Number(v)))
    .join(',');
}

function quoteSqlIdentifier(identifier) {
  const raw = String(identifier || '').trim();
  if (!raw || raw.length > 128 || raw.includes('\0') || raw.includes('.')) {
    throw new Error('Invalid SQL identifier');
  }
  return `[${raw.replace(/]/g, ']]')}]`;
}

function quoteSqlObjectName(name) {
  const raw = String(name || '').trim();
  if (!raw) {
    throw new Error('Invalid SQL object name');
  }
  const parts = raw.split('.').map((p) => p.trim()).filter(Boolean);
  if (!parts.length || parts.some((p) => p.length > 128 || p.includes('\0'))) {
    throw new Error('Invalid SQL object name');
  }
  return parts.map((p) => `[${p.replace(/]/g, ']]')}]`).join('.');
}

const CANE_CRUSH_TABLES = new Set(['CaneCrush', 'MI_CaneCrush_Entry']);
const DISTILLERY_TABLES = new Set(['MI_Distillery_Report', 'Distillery_report']);
const RAINFALL_TABLES = new Set(['MI_RainfallDaily', 'RainfallDaily', 'DailyRainfall']);
const MONTHLY_PARAMETER_TABLES = new Set(['MI_ParameterMonthly', 'ParameterMonthly', 'MI_MonthlyParameter']);
const MONTHLY_ENTRY_TABLES = new Set(['MI_MonthlyEntryReport', 'MI_MonthlyEntry', 'MonthlyEntryReport']);

function ensureWhitelistedTable(name, allowedSet, label) {
  const raw = String(name || '').trim();
  if (!allowedSet.has(raw)) {
    throw new Error(`Invalid ${label || 'table'} name`);
  }
  return raw;
}

function parseNumericCsvCodes(codesCsv) {
  if (!codesCsv) return [];
  return String(codesCsv)
    .split(',')
    .map((v) => Number(v))
    .filter((n) => Number.isInteger(n) && n > 0 && n <= 2147483647);
}

function buildParametrizedInClause(columnExpr, codesCsv, params, keyPrefix = 'f') {
  const numbers = Array.from(new Set(parseNumericCsvCodes(codesCsv)));
  if (!numbers.length) return '';
  const placeholders = [];
  numbers.forEach((num, i) => {
    const key = `${keyPrefix}${i}`;
    params[key] = num;
    placeholders.push(`@${key}`);
  });
  return ` AND ${columnExpr} IN (${placeholders.join(',')})`;
}

function parseDateRange(value) {
  const raw = String(value || '').trim();
  if (!raw) return null;

  const iso = raw.match(/^(\d{4}-\d{2}-\d{2})\s*-\s*(\d{4}-\d{2}-\d{2})$/);
  if (iso) {
    return { from: iso[1], to: iso[2] };
  }

  const ddmmyyyy = raw.match(/^(\d{2}[-\/]\d{2}[-\/]\d{4})\s*-\s*(\d{2}[-\/]\d{2}[-\/]\d{4})$/);
  if (ddmmyyyy) {
    const from = toIsoFromDDMMYYYY(ddmmyyyy[1]);
    const to = toIsoFromDDMMYYYY(ddmmyyyy[2]);
    if (from && to) return { from, to };
  }

  const singleIso = raw.match(/^(\d{4}-\d{2}-\d{2})$/);
  if (singleIso) {
    return { from: singleIso[1], to: singleIso[1] };
  }

  const singleDDMMYYYY = toIsoFromDDMMYYYY(raw);
  if (singleDDMMYYYY) {
    return { from: singleDDMMYYYY, to: singleDDMMYYYY };
  }

  return null;
}

function parseIsoDate(value) {
  const raw = String(value || '').trim();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(raw)) {
    return null;
  }
  return raw;
}

function resolveDashboardRange(body = {}, query = {}) {
  const txtdaterange = String(body.txtdaterange || query.txtdaterange || '').trim();
  if (txtdaterange) {
    return parseDateRange(txtdaterange);
  }

  const fromDate = parseIsoDate(body.dateFrom || body.fromDate || query.dateFrom || query.fromDate);
  const toDate = parseIsoDate(body.dateTo || body.toDate || query.dateTo || query.toDate);
  if (!fromDate || !toDate) {
    return null;
  }

  return { from: fromDate, to: toDate };
}

function validateHomeFactRequest(body = {}, query = {}) {
  const range = resolveDashboardRange(body, query);
  if (!range) {
    return {
      ok: false,
      message: 'dateFrom and dateTo (YYYY-MM-DD) or txtdaterange is required'
    };
  }

  if (range.from > range.to) {
    return {
      ok: false,
      message: 'dateFrom cannot be greater than dateTo'
    };
  }

  const F_Code = String(body.F_Code || query.F_Code || body.factoryCode || query.factoryCode || '').trim();
  return { ok: true, range, F_Code };
}

function logControllerError(scope, req, error, extra = {}) {
  const details = {
    scope,
    method: req.method,
    path: req.originalUrl,
    userId: req.user?.userId || null,
    season: req.user?.season || null,
    bodyKeys: Object.keys(req.body || {}),
    queryKeys: Object.keys(req.query || {}),
    ...extra
  };

  console.error(`[${CONTROLLER}] ${scope} failed`, {
    details,
    message: error?.message,
    stack: error?.stack
  });
}

function isSingleFactorySelection(codes) {
  return !!codes && !String(codes).includes(',');
}

function buildDateLabels(fromIso, toIso) {
  const labels = [];
  const from = new Date(`${fromIso}T00:00:00`);
  const to = new Date(`${toIso}T00:00:00`);
  if (Number.isNaN(from.getTime()) || Number.isNaN(to.getTime()) || from > to) {
    return labels;
  }

  for (const d = new Date(from); d <= to; d.setDate(d.getDate() + 1)) {
    const dd = String(d.getDate()).padStart(2, '0');
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const yyyy = d.getFullYear();
    labels.push(`${dd}-${mm}-${yyyy}`);
  }
  return labels;
}

function daysBetweenInclusive(fromIso, toIso) {
  const from = new Date(`${fromIso}T00:00:00`);
  const to = new Date(`${toIso}T00:00:00`);
  if (Number.isNaN(from.getTime()) || Number.isNaN(to.getTime()) || from > to) {
    return 0;
  }
  const diffMs = to.getTime() - from.getTime();
  return Math.floor(diffMs / 86400000) + 1;
}

function splitDateRange(fromIso, toIso, chunkDays = 60) {
  const ranges = [];
  const from = new Date(`${fromIso}T00:00:00`);
  const to = new Date(`${toIso}T00:00:00`);
  if (Number.isNaN(from.getTime()) || Number.isNaN(to.getTime()) || from > to) {
    return ranges;
  }

  const safeChunk = Math.max(1, Number(chunkDays) || 60);
  let cursor = new Date(from);
  while (cursor <= to) {
    const end = new Date(cursor);
    end.setDate(end.getDate() + safeChunk - 1);
    if (end > to) end.setTime(to.getTime());

    const s = `${cursor.getFullYear()}-${String(cursor.getMonth() + 1).padStart(2, '0')}-${String(cursor.getDate()).padStart(2, '0')}`;
    const e = `${end.getFullYear()}-${String(end.getMonth() + 1).padStart(2, '0')}-${String(end.getDate()).padStart(2, '0')}`;
    ranges.push({ from: s, to: e });

    cursor = new Date(end);
    cursor.setDate(cursor.getDate() + 1);
  }

  return ranges;
}

function toDDMMYYYY(value) {
  const isoDate = String(value || '').match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (isoDate) {
    return `${isoDate[3]}-${isoDate[2]}-${isoDate[1]}`;
  }
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '';
  const dd = String(d.getDate()).padStart(2, '0');
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const yyyy = d.getFullYear();
  return `${dd}-${mm}-${yyyy}`;
}

function isTimeoutError(error) {
  return error?.code === 'EREQUEST' && /timeout expired/i.test(String(error?.message || ''));
}

function parseFlexibleDateToIso(value) {
  const raw = String(value || '').trim();
  if (!raw) return null;
  const iso = raw.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (iso) return `${iso[1]}-${iso[2]}-${iso[3]}`;
  const ddmmyyyy = raw.match(/^(\d{2})[-\/](\d{2})[-\/](\d{4})$/);
  if (ddmmyyyy) return `${ddmmyyyy[3]}-${ddmmyyyy[2]}-${ddmmyyyy[1]}`;
  return null;
}

async function resolveCaneCrushTable(season) {
  const probe = await executeQuery(
    `SELECT
       OBJECT_ID('CaneCrush') AS CaneCrushObj,
       OBJECT_ID('MI_CaneCrush_Entry') AS MiCaneCrushObj`,
    {},
    season
  );
  const row = probe[0] || {};
  if (row.CaneCrushObj) return ensureWhitelistedTable('CaneCrush', CANE_CRUSH_TABLES, 'cane crush');
  if (row.MiCaneCrushObj) return ensureWhitelistedTable('MI_CaneCrush_Entry', CANE_CRUSH_TABLES, 'cane crush');
  return ensureWhitelistedTable('CaneCrush', CANE_CRUSH_TABLES, 'cane crush');
}

async function resolveDistilleryTable(season) {
  const candidates = ['MI_Distillery_Report', 'Distillery_report'];
  let defaultTable = 'Distillery_report';

  for (const tableName of candidates) {
    try {
      const colRows = await executeQuery(
        `SELECT c.name AS columnName
         FROM sys.columns c
         WHERE c.object_id = OBJECT_ID(@tableName)`,
        { tableName },
        season
      );
      if (!colRows?.length) continue;

      defaultTable = tableName;
      const cols = new Set(colRows.map((r) => String(r.columnName || '').toLowerCase()));
      // Distillery entry pages need operational columns; prefer table that has them.
      if (cols.has('dist_unit') || cols.has('dist_date') || cols.has('dist_rsstatus')) {
        return ensureWhitelistedTable(tableName, DISTILLERY_TABLES, 'distillery');
      }
    } catch (error) {
      // keep trying next candidate
    }
  }

  return ensureWhitelistedTable(defaultTable, DISTILLERY_TABLES, 'distillery');
}

async function resolveRainfallTable(season) {
  const candidates = ['MI_RainfallDaily', 'RainfallDaily', 'DailyRainfall'];
  for (const tableName of candidates) {
    const rows = await executeQuery(
      `SELECT OBJECT_ID(@tableName) AS objectId`,
      { tableName },
      season
    );
    if (rows[0]?.objectId) return ensureWhitelistedTable(tableName, RAINFALL_TABLES, 'rainfall');
  }
  return ensureWhitelistedTable('MI_RainfallDaily', RAINFALL_TABLES, 'rainfall');
}

async function resolveMonthlyParameterTable(season) {
  const candidates = ['MI_ParameterMonthly', 'ParameterMonthly', 'MI_MonthlyParameter'];
  for (const tableName of candidates) {
    const rows = await executeQuery(
      `SELECT OBJECT_ID(@tableName) AS objectId`,
      { tableName },
      season
    );
    if (rows[0]?.objectId) return ensureWhitelistedTable(tableName, MONTHLY_PARAMETER_TABLES, 'monthly parameter');
  }
  return ensureWhitelistedTable('MI_ParameterMonthly', MONTHLY_PARAMETER_TABLES, 'monthly parameter');
}

async function resolveMonthlyEntryTable(season) {
  const candidates = ['MI_MonthlyEntryReport', 'MI_MonthlyEntry', 'MonthlyEntryReport'];
  for (const tableName of candidates) {
    const rows = await executeQuery(
      `SELECT OBJECT_ID(@tableName) AS objectId`,
      { tableName },
      season
    );
    if (rows[0]?.objectId) return ensureWhitelistedTable(tableName, MONTHLY_ENTRY_TABLES, 'monthly entry');
  }
  return null;
}

function monthlyParameterFallback() {
  return [
    { Id: 1, Pm_Name: 'Crop Day' },
    { Id: 2, Pm_Name: 'Cane Crushed, Qtls' },
    { Id: 3, Pm_Name: 'Avg Crush per Crop Day, Qtls' },
    { Id: 4, Pm_Name: 'Recovery % Cane' },
    { Id: 5, Pm_Name: 'Total Sugar Production, Qtls' },
    { Id: 6, Pm_Name: 'Total Losses % Cane' },
    { Id: 7, Pm_Name: 'Steam Consumption % Cane' },
    { Id: 8, Pm_Name: 'Bagasse Saving % Cane' },
    { Id: 9, Pm_Name: 'Total Lime % Cane(Process & Spray only)' },
    { Id: 10, Pm_Name: 'Sulphur % Cane' },
    { Id: 11, Pm_Name: 'Lubricants/ Grease, Kgs./ 100 Qtls, Cane' },
    { Id: 12, Pm_Name: 'Mill lubricants grease, Kgs./ 100 Qtls, Cane' },
    { Id: 13, Pm_Name: 'Caustic Soda (Eng.+ Prodn.),Kgs/100 Q cane' },
    { Id: 14, Pm_Name: 'Phosphoric Acid, Kgs./100 Q Cane' },
    { Id: 15, Pm_Name: 'Substitute for Phosphoric Acid, Kgs./100 Q Cane' },
    { Id: 16, Pm_Name: 'Viscosity Reducer, Kgs./100 Q Cane' },
    { Id: 17, Pm_Name: 'Flocculent( used for Jc. Clarification only), Kgs./100 Q Cane' },
    { Id: 18, Pm_Name: 'Mill Sanitation Chemical, Kgs./100 Q Cane(only at mills)' },
    { Id: 19, Pm_Name: 'Hydrochloric Acid , Kgs./100 Q Cane' },
    { Id: 20, Pm_Name: 'Power Exported to Grid (KWH) - only for cogen units' }
  ];
}

async function getTableColumns(season, tableName) {
  const rows = await executeQuery(
    `SELECT c.name AS columnName
     FROM sys.columns c
     WHERE c.object_id = OBJECT_ID(@tableName)`,
    { tableName },
    season
  );
  return new Set(rows.map((r) => String(r.columnName || '').trim().toLowerCase()).filter(Boolean));
}

async function getTableColumnList(season, tableName) {
  const rows = await executeQuery(
    `SELECT c.name AS columnName
     FROM sys.columns c
     WHERE c.object_id = OBJECT_ID(@tableName)`,
    { tableName },
    season
  );
  return rows.map((r) => String(r.columnName || '').trim()).filter(Boolean);
}

function pickExistingColumn(columnsSet, candidates = []) {
  for (const c of candidates) {
    const key = String(c || '').trim().toLowerCase();
    if (key && columnsSet.has(key)) {
      return c;
    }
  }
  return null;
}

function pickExistingColumnFromList(columns = [], candidates = []) {
  const byLower = new Map(columns.map((c) => [String(c).toLowerCase(), c]));
  for (const c of candidates) {
    const found = byLower.get(String(c || '').toLowerCase());
    if (found) return found;
  }
  return null;
}

function pickColumnByPattern(columns = [], patterns = []) {
  for (const col of columns) {
    const lc = String(col || '').toLowerCase();
    for (const p of patterns) {
      if (p.test(lc)) return col;
    }
  }
  return null;
}

function buildMappedExpr({ tableAlias = 'd', column, alias, numeric = false }) {
  if (!column) {
    return numeric ? `0 AS ${alias}` : `'' AS ${alias}`;
  }
  return numeric
    ? `ISNULL(${tableAlias}.${column}, 0) AS ${alias}`
    : `ISNULL(${tableAlias}.${column}, '') AS ${alias}`;
}

async function runHomeFactChunkQuery({ season, factoryFilter, fromDate, toDate, timeoutMs, userId, extraParams = {} }) {
  const chunkQuery = `WITH agg AS (
     SELECT p.M_FACTORY AS F_Code,
            CONVERT(date, p.M_DATE) AS M_DATE,
            SUM(ISNULL(p.M_GROSS, 0) - ISNULL(p.M_TARE, 0) - ISNULL(p.M_JOONA, 0)) AS M_FinalWt
     FROM Purchase p WITH (NOLOCK)
     WHERE p.M_DATE >= @fromDate
       AND p.M_DATE < DATEADD(day, 1, @toDate)
       ${factoryFilter}
     GROUP BY p.M_FACTORY, CONVERT(date, p.M_DATE)
   )
   SELECT a.F_Code,
          COALESCE(RTRIM(mf.F_Name), RTRIM(f.F_Name), CAST(a.F_Code AS varchar(10))) AS F_Name,
          CONVERT(varchar(10), a.M_DATE, 23) AS M_DATE,
          a.M_FinalWt
   FROM agg a
   LEFT JOIN MI_Factory mf WITH (NOLOCK) ON mf.F_Code = a.F_Code
   LEFT JOIN Factory f WITH (NOLOCK) ON f.F_Code = a.F_Code
   ORDER BY a.F_Code, a.M_DATE`;

  return executeQuery(
    chunkQuery,
    { fromDate, toDate, userId, ...extraParams },
    season,
    { timeoutMs }
  );
}

async function fetchHomeFactRowsAdaptive({ season, factoryFilter, fromDate, toDate, userId, extraParams = {} }) {
  const initialChunkDays = Math.max(1, Number(process.env.HOMEFACT_CHUNK_DAYS || 30));
  const minChunkDays = Math.max(1, Number(process.env.HOMEFACT_MIN_CHUNK_DAYS || 3));
  const timeoutMs = Math.max(30000, Number(process.env.HOMEFACT_QUERY_TIMEOUT_MS || 120000));

  const rows = [];
  const queue = splitDateRange(fromDate, toDate, initialChunkDays);

  while (queue.length) {
    const current = queue.shift();
    try {
      const chunkRows = await runHomeFactChunkQuery({
        season,
        factoryFilter,
        fromDate: current.from,
        toDate: current.to,
        timeoutMs,
        userId,
        extraParams
      });
      rows.push(...chunkRows);
      continue;
    } catch (error) {
      if (!isTimeoutError(error)) {
        throw error;
      }

      const spanDays = daysBetweenInclusive(current.from, current.to);
      if (spanDays <= minChunkDays) {
        error.statusCode = 500;
        throw error;
      }

      const splitSize = Math.max(minChunkDays, Math.floor(spanDays / 2));
      const subRanges = splitDateRange(current.from, current.to, splitSize);
      queue.unshift(...subRanges);
    }
  }

  return rows;
}

async function fetchHomeFactHourly({ season, codes, userId, dateIso }) {
  const params = { dateIso, userId };
  const factoryPredicate = codes
    ? buildParametrizedInClause('src.factory_code', codes, params, 'fh')
    : (userId ? ' AND src.factory_code IN (SELECT FactID FROM MI_UserFact WITH (NOLOCK) WHERE UserID = @userId)' : '');

  const rows = await executeQuery(
    `SELECT src.factory_code AS F_Code,
            COALESCE(RTRIM(mf.F_Name), RTRIM(f.F_Name), CAST(src.factory_code AS varchar(10))) AS F_Name,
            src.hou AS Time_Order,
            SUM(src.FinWt) AS M_FinalWt
     FROM (
       SELECT p.m_factory AS factory_code,
              DATEPART(hour, p.M_TARE_DT) AS hou,
              SUM(ISNULL(p.M_GROSS, 0) - ISNULL(p.M_TARE, 0) - ISNULL(p.M_JOONA, 0)) AS FinWt
       FROM Purchase p WITH (NOLOCK)
       WHERE CAST(p.M_DATE AS date) = @dateIso
         AND p.M_CENTRE IN (100)
       GROUP BY p.m_factory, DATEPART(hour, p.M_TARE_DT)
       UNION ALL
       SELECT r.tt_factory AS factory_code,
              DATEPART(hour, r.TT_TARE_DT) AS hou,
              SUM(ISNULL(r.tt_grossweight, 0) - ISNULL(r.tt_tareweight, 0) - ISNULL(r.tt_joonaweight, 0)) AS FinWt
       FROM Receipt r WITH (NOLOCK)
       WHERE CAST(r.TT_DATE AS date) = @dateIso
         AND r.TT_CENTER NOT IN (100)
         AND ISNULL(r.tt_tareweight, 0) > 0
       GROUP BY r.tt_factory, DATEPART(hour, r.TT_TARE_DT)
     ) src
     LEFT JOIN MI_Factory mf WITH (NOLOCK) ON mf.F_Code = src.factory_code
     LEFT JOIN Factory f WITH (NOLOCK) ON f.F_Code = src.factory_code
     WHERE 1=1
       ${factoryPredicate}
     GROUP BY src.factory_code, COALESCE(RTRIM(mf.F_Name), RTRIM(f.F_Name), CAST(src.factory_code AS varchar(10))), src.hou
     ORDER BY src.factory_code, src.hou`,
    params,
    season,
    { timeoutMs: 120000 }
  );

  let timeRows = [];
  try {
    timeRows = await executeQuery(
      `SELECT Time_Order, Time_Value
       FROM GraphHourStatus WITH (NOLOCK)
       ORDER BY Time_Order`,
      {},
      season
    );
  } catch (error) {
    timeRows = [];
  }

  const dateList = timeRows.length
    ? timeRows.map((t) => String(t.Time_Value || ''))
    : Array.from(new Set(rows.map((r) => Number(r.Time_Order)).filter((v) => Number.isFinite(v))))
        .sort((a, b) => a - b)
        .map((h) => `${String(h).padStart(2, '0')}:00`);

  const hourIndex = new Map();
  if (timeRows.length) {
    timeRows.forEach((t, i) => {
      hourIndex.set(Number(t.Time_Order), i);
    });
  } else {
    dateList.forEach((label, i) => {
      const hour = Number(String(label).split(':')[0]);
      if (Number.isFinite(hour)) {
        hourIndex.set(hour, i);
      }
    });
  }

  const seriesMap = new Map();
  rows.forEach((row) => {
    const code = String(row.F_Code || '').trim();
    const name = String(row.F_Name || '').trim();
    const key = `${name} (${code})`;
    if (!seriesMap.has(key)) {
      seriesMap.set(key, new Array(dateList.length).fill(0));
    }
    const idx = hourIndex.get(Number(row.Time_Order));
    if (idx !== undefined) {
      seriesMap.get(key)[idx] = Number(row.M_FinalWt) || 0;
    }
  });

  return {
    MyList: Array.from(seriesMap.entries()).map(([name, data]) => ({ name, data })),
    DateList: dateList
  };
}

exports.Index = async (req, res) => {
  return res.status(200).json({ success: true, message: 'Main module ready' });
};

exports.HelpDesk = async (req, res, next) => {
  try {
    const season = req.user?.season;
    const ModulId = String(req.query.ModulId || req.body.ModulId || '').trim();
    const rows = await executeQuery('EXEC Sp_HelpDesk @ModulId', { ModulId }, season);
    return res.status(200).json({ Status: rows.length ? 'OK' : 'Error', list: rows.length ? rows : 0 });
  } catch (error) {
    return next(error);
  }
};

exports.Home = async (req, res) => {
  return res.status(200).json({ success: true, userId: req.user?.userId || null });
};

exports.Units = async (req, res, next) => {
  try {
    const season = req.user?.season;
    const rows = await executeQuery(
      `SELECT f_Code, CONCAT(f_Name, ' (', F_Short, ')') AS F_Name, f_Name, F_Short
       FROM MI_Factory
       ORDER BY SN ASC`,
      {},
      season
    );
    return res.status(200).json(rows);
  } catch (error) {
    return next(error);
  }
};

exports.ModeBind = async (req, res, next) => {
  try {
    const season = req.user?.season;
    const F_Name = String(req.query.F_Name || req.body.F_Name || '').trim();
    const rows = await executeQuery(
      `SELECT md_factory, f.f_Name, md_code, md_name, md_groupcode AS groupcode,
              CASE WHEN md_groupcode=1 THEN 'Cart' WHEN md_groupcode=2 THEN 'Trolly Small'
                   WHEN md_groupcode=3 THEN 'Trolly Large' WHEN md_groupcode=4 THEN 'Truck' ELSE 'NA' END AS md_groupcode
       FROM Mode m
       JOIN Factory f ON m.md_factory=f.f_code
       WHERE md_factory=@F_Name
       ORDER BY md_name ASC`,
      { F_Name },
      season
    );
    return res.status(200).json(rows);
  } catch (error) {
    return next(error);
  }
};

exports.AddSeason = async (req, res, next) => {
  try {
    const season = req.user?.season;
    const sid = String(req.query.sid || '').trim();

    if (!sid) {
      return res.status(200).json({
        S_SEASONSTARTDATE: new Date().toLocaleDateString('en-GB').replace(/-/g, '/'),
        mode: 'insert'
      });
    }

    const rows = await executeQuery(
      `SELECT CONVERT(varchar, S_SEASONSTARTDATE, 103) AS S_SEASONSTARTDATE,
              CAST(ISNULL(S_SHIFTSTARTTIME, '00:00') AS varchar(5)) AS S_SHIFTSTARTTIME,
              S_SHIFTHOUR,
              CAST(ISNULL(S_CHEDATETIME, '00:00') AS varchar(5)) AS S_CHEDATETIME,
              S_SGT_CD,
              FACTORY
       FROM Season
       WHERE FACTORY=@sid`,
      { sid },
      season
    );

    return res.status(200).json(rows[0] || {});
  } catch (error) {
    return next(error);
  }
};

exports.AddSeason_2 = async (req, res, next) => {
  try {
    const season = req.user?.season;
    const id = String(req.body.id || '').trim();
    const FACTORY = String(req.body.FACTORY || '').trim();
    const S_SEASONSTARTDATE = String(req.body.S_SEASONSTARTDATE || '').trim();
    const S_SHIFTSTARTTIME = String(req.body.S_SHIFTSTARTTIME || '').trim();
    const S_SGT_CD = String(req.body.S_SGT_CD || '').trim();
    const S_CHEDATETIME = String(req.body.S_CHEDATETIME || '').trim();

    if (id !== 'btupdate') {
      return res.status(200).json(true);
    }

    const tDate = toIsoFromDDMMYYYY(S_SEASONSTARTDATE);
    if (!FACTORY || !tDate) {
      return res.status(400).json(false);
    }

    await executeQuery(
      `UPDATE Season
       SET S_SEASONSTARTDATE=@tDate,
           S_SHIFTSTARTTIME=@S_SHIFTSTARTTIME,
           S_CHEDATETIME=@S_CHEDATETIME,
           S_SGT_CD=@S_SGT_CD
       WHERE FACTORY=@FACTORY`,
      { tDate, S_SHIFTSTARTTIME, S_CHEDATETIME, S_SGT_CD, FACTORY },
      season
    );

    return res.status(200).json(true);
  } catch (error) {
    return next(error);
  }
};

exports.AddModeGroup = async (req, res, next) => {
  try {
    const season = req.user?.season;
    const sid = String(req.query.sid || '').trim();
    const mcode = String(req.query.Mcode || '').trim();

    if (!sid || !mcode) {
      return res.status(200).json({ mode: 'insert' });
    }

    const rows = await executeQuery(
      `SELECT md_factory, f.f_Name, md_code, md_name, md_groupcode AS groupcode,
              CASE WHEN md_groupcode=1 THEN 'Cart' WHEN md_groupcode=2 THEN 'Trolly Small'
                   WHEN md_groupcode=3 THEN 'Trolly Large' WHEN md_groupcode=4 THEN 'Truck' ELSE 'NA' END AS md_groupcode
       FROM Mode m
       JOIN Factory f ON m.md_factory=f.f_code
       WHERE md_factory=@sid AND md_code=@mcode
       ORDER BY md_name ASC`,
      { sid, mcode },
      season
    );

    return res.status(200).json(rows[0] || {});
  } catch (error) {
    return next(error);
  }
};

exports.AddModeGroup_2 = async (req, res, next) => {
  try {
    const season = req.user?.season;
    const id = String(req.body.id || '').trim();
    const md_factory = String(req.body.md_factory || '').trim();
    const md_code = String(req.body.md_code || '').trim();
    const groupcode = String(req.body.groupcode || '').trim();

    if (!(id === 'btupdate' || id === 'btninsert')) {
      return res.status(200).json('Not Updated...?');
    }

    await executeQuery(
      'UPDATE Mode SET md_groupcode=@groupcode WHERE md_factory=@md_factory AND md_code=@md_code',
      { groupcode, md_factory, md_code },
      season
    );

    return res.status(200).json('Successfully Updated...?');
  } catch (error) {
    return next(error);
  }
};

exports.AddModeGroupView = async (req, res, next) => {
  try {
    const season = req.user?.season;
    const unitRaw = String(req.query.unit || req.body.unit || '').trim();
    const unit = unitRaw === '' ? null : Number(unitRaw);
    if (unitRaw !== '' && (!Number.isFinite(unit) || unit <= 0)) {
      return res.status(400).json({
        success: false,
        message: 'unit must be a valid positive number'
      });
    }

    let rows = [];
    try {
      rows = await executeQuery(
        `SELECT m.md_factory AS f_Code,
                f.F_Name AS factoryName,
                m.md_code AS modeCode,
                m.md_name AS mode,
                m.md_groupcode AS groupCode,
                CASE WHEN m.md_groupcode = 1 THEN 'Cart'
                     WHEN m.md_groupcode = 2 THEN 'Trolly Small'
                     WHEN m.md_groupcode = 3 THEN 'Trolly Large'
                     WHEN m.md_groupcode = 4 THEN 'Truck'
                     ELSE 'NA' END AS groupMode
         FROM Mode m
         JOIN Factory f ON f.f_code = m.md_factory
         WHERE (@unit IS NULL OR m.md_factory = @unit)
         ORDER BY f.F_Name ASC, m.md_name ASC`,
        { unit },
        season
      );
    } catch (primaryError) {
      const primaryMessage = String(primaryError?.message || '');
      const canUseMiFactoryFallback = /invalid object name\s+'?factory'?/i.test(primaryMessage)
        || /invalid column name\s+'?f_name'?/i.test(primaryMessage);
      if (!canUseMiFactoryFallback) {
        throw primaryError;
      }

      rows = await executeQuery(
        `SELECT m.md_factory AS f_Code,
                f.F_Name AS factoryName,
                m.md_code AS modeCode,
                m.md_name AS mode,
                m.md_groupcode AS groupCode,
                CASE WHEN m.md_groupcode = 1 THEN 'Cart'
                     WHEN m.md_groupcode = 2 THEN 'Trolly Small'
                     WHEN m.md_groupcode = 3 THEN 'Trolly Large'
                     WHEN m.md_groupcode = 4 THEN 'Truck'
                     ELSE 'NA' END AS groupMode
         FROM Mode m
         JOIN MI_Factory f ON f.F_Code = m.md_factory
         WHERE (@unit IS NULL OR m.md_factory = @unit)
         ORDER BY f.F_Name ASC, m.md_name ASC`,
        { unit },
        season
      );
    }

    return res.status(200).json(rows);
  } catch (error) {
    logControllerError('AddModeGroupView', req, error, {
      unit: req.query.unit || req.body.unit || null
    });
    return next(error);
  }
};

exports.AddModeGroupViewID = async (req, res) => {
  const sid = String(req.query.ID || req.query.sid || '').trim();
  const mcode = String(req.query.Mcode || '').trim();
  return res.status(200).json({ sid, mcode });
};

exports.AddStopage = async (req, res, next) => {
  try {
    const season = req.user?.season;
    const sid = String(req.query.sid || '').trim();

    if (!sid) {
      return res.status(200).json({ mode: 'insert' });
    }

    const rows = await executeQuery(
      `SELECT STPID, STP_Unit, STP_PIO AS STP_PIOR, STP_PIM, STP_Remark
       FROM MI_Stopage
       WHERE STP_Unit=@sid`,
      { sid },
      season
    );

    return res.status(200).json(rows[0] || {});
  } catch (error) {
    return next(error);
  }
};

exports.AddStopage_2 = async (req, res, next) => {
  try {
    const season = req.user?.season;
    const id = String(req.body.id || '').trim();
    const STP_Unit = String(req.body.STP_Unit || '').trim();
    const STP_PIO = String(req.body.STP_PIO || '').trim();
    const STP_PIM = String(req.body.STP_PIM || '').trim();
    const STP_Remark = String(req.body.STP_Remark || '').trim();
    const userId = String(req.user?.userId || req.body.Userid || '').trim();

    if (!STP_Unit) {
      return res.status(400).json(false);
    }

    if (id === 'btupdate') {
      await executeQuery(
        `UPDATE MI_Stopage
         SET STP_PIO=@STP_PIO, STP_PIM=@STP_PIM, STP_Remark=@STP_Remark, Userid=@userId
         WHERE STP_Unit=@STP_Unit`,
        { STP_PIO, STP_PIM, STP_Remark, userId, STP_Unit },
        season
      );

      const lg = `Factory ${STP_Unit} ,Userid ${userId} ,Plant in Operation ${STP_PIO} ,Plant in Maintenanec ${STP_PIM}, Remark ${STP_Remark} ,Flag Updated`;
      await executeQuery(
        'INSERT INTO MI_Stopage_Log(STP_Unit, StopageLog, UserId, Flag) VALUES(@STP_Unit, @lg, @userId, @flag)',
        { STP_Unit, lg, userId, flag: 'Updated' },
        season
      );

      return res.status(200).json(true);
    }

    if (id === 'btninsert') {
      const exists = await executeQuery('SELECT TOP 1 STPID FROM MI_Stopage WHERE STP_Unit=@STP_Unit', { STP_Unit }, season);
      if (!exists.length) {
        await executeQuery(
          `INSERT INTO MI_Stopage(STP_Unit, STP_PIO, STP_PIM, STP_Remark, Userid)
           VALUES(@STP_Unit, @STP_PIO, @STP_PIM, @STP_Remark, @userId)`,
          { STP_Unit, STP_PIO, STP_PIM, STP_Remark, userId },
          season
        );

        const lg = `Factory ${STP_Unit} ,Userid ${userId} ,Plant in Operation ${STP_PIO} ,Plant in Maintenanec ${STP_PIM}, Remark ${STP_Remark} ,Flag Inserted`;
        await executeQuery(
          'INSERT INTO MI_Stopage_Log(STP_Unit, StopageLog, UserId, Flag) VALUES(@STP_Unit, @lg, @userId, @flag)',
          { STP_Unit, lg, userId, flag: 'Inserted' },
          season
        );
      }

      return res.status(200).json(true);
    }

    return res.status(200).json(true);
  } catch (error) {
    return next(error);
  }
};

exports.AddSeasonView = async (req, res, next) => {
  try {
    const season = req.user?.season;
    const unitRaw = String(req.query.unit || req.body.unit || '').trim();
    const unit = unitRaw === '' ? null : Number(unitRaw);

    if (unitRaw !== '' && (!Number.isFinite(unit) || unit <= 0)) {
      return res.status(400).json({
        success: false,
        message: 'unit must be a valid positive number'
      });
    }


    let rows = [];
    try {
      rows = await executeQuery(
        `SELECT s.FACTORY AS id, s.FACTORY AS f_Code, f.F_Name,
                CONVERT(varchar, s.S_SEASONSTARTDATE, 103) AS seasonStartDate,
                CAST(ISNULL(s.S_SHIFTSTARTTIME, '00:00') AS varchar(5)) AS shiftStartTime,
                ISNULL(s.S_SHIFTHOUR, 0) AS shiftHour,
                CAST(ISNULL(s.S_CHEDATETIME, '00:00') AS varchar(5)) AS changeTime,
                s.S_SGT_CD AS gateCode
         FROM Season s
         JOIN Factory f ON f.f_code = s.FACTORY
         WHERE (@unit IS NULL OR s.FACTORY = @unit)
         ORDER BY f.F_Name ASC, s.S_SEASONSTARTDATE DESC`,
        { unit },
        season
      );
    } catch (primaryError) {
      const primaryMessage = String(primaryError?.message || '');
      const canUseMiFactoryFallback = /invalid object name\s+'?factory'?/i.test(primaryMessage)
        || /invalid column name\s+'?f_name'?/i.test(primaryMessage);

      if (!canUseMiFactoryFallback) {
        throw primaryError;
      }

      rows = await executeQuery(
        `SELECT s.FACTORY AS id, s.FACTORY AS f_Code, f.F_Name,
                CONVERT(varchar, s.S_SEASONSTARTDATE, 103) AS seasonStartDate,
                CAST(ISNULL(s.S_SHIFTSTARTTIME, '00:00') AS varchar(5)) AS shiftStartTime,
                ISNULL(s.S_SHIFTHOUR, 0) AS shiftHour,
                CAST(ISNULL(s.S_CHEDATETIME, '00:00') AS varchar(5)) AS changeTime,
                s.S_SGT_CD AS gateCode
         FROM Season s
         JOIN MI_Factory f ON f.F_Code = s.FACTORY
         WHERE (@unit IS NULL OR s.FACTORY = @unit)
         ORDER BY f.F_Name ASC, s.S_SEASONSTARTDATE DESC`,
        { unit },
        season
      );
    }
    return res.status(200).json(rows);
  } catch (error) {
    logControllerError('AddSeasonView', req, error, {
      unit: req.query.unit || req.body.unit || null
    });
    return next(error);
  }
};

exports.AddStopageView = async (req, res, next) => {
  try {
    const season = req.user?.season;
    const unitRaw = String(req.query.unit || req.body.unit || '').trim();
    const unit = unitRaw === '' ? null : Number(unitRaw);
    if (unitRaw !== '' && (!Number.isFinite(unit) || unit <= 0)) {
      return res.status(400).json({
        success: false,
        message: 'unit must be a valid positive number'
      });
    }

    let rows = [];
    try {
      rows = await executeQuery(
        `SELECT st.STPID AS id, st.STP_Unit, f.F_Name AS unit, f.F_Name AS factoryName,
                CASE WHEN st.STP_PIO > 0 THEN 'Plant in Operation'
                     WHEN st.STP_PIM > 0 THEN 'Plant in Maintenanec'
                     ELSE '' END AS mode,
                st.STP_Remark AS remark
         FROM MI_Stopage st
         JOIN MI_Factory f ON f.F_Code = st.STP_Unit
         WHERE (@unit IS NULL OR st.STP_Unit = @unit)
         ORDER BY f.F_Name ASC, st.STPID DESC`,
        { unit },
        season
      );
    } catch (primaryError) {
      const primaryMessage = String(primaryError?.message || '');
      const canUseFactoryFallback = /invalid object name\s+'?mi_factory'?/i.test(primaryMessage)
        || /invalid column name\s+'?f_name'?/i.test(primaryMessage);
      if (!canUseFactoryFallback) {
        throw primaryError;
      }

      rows = await executeQuery(
        `SELECT st.STPID AS id, st.STP_Unit, f.F_Name AS unit, f.F_Name AS factoryName,
                CASE WHEN st.STP_PIO > 0 THEN 'Plant in Operation'
                     WHEN st.STP_PIM > 0 THEN 'Plant in Maintenanec'
                     ELSE '' END AS mode,
                st.STP_Remark AS remark
         FROM MI_Stopage st
         JOIN Factory f ON f.f_code = st.STP_Unit
         WHERE (@unit IS NULL OR st.STP_Unit = @unit)
         ORDER BY f.F_Name ASC, st.STPID DESC`,
        { unit },
        season
      );
    }
    return res.status(200).json(rows);
  } catch (error) {
    logControllerError('AddStopageView', req, error, {
      unit: req.query.unit || req.body.unit || null
    });
    return next(error);
  }
};

exports.HomeFact = async (req, res, next) => {
  try {
    const season = req.user?.season;
    const validation = validateHomeFactRequest(req.body, req.query);
    if (!validation.ok) {
      return res.status(400).json({
        success: false,
        message: validation.message
      });
    }

    const { F_Code, range } = validation;
    const userId = String(req.user?.userId || '').trim();
    const codes = normalizeFactoryCodeList(F_Code);
    if (F_Code && !codes) {
      return res.status(400).json({
        success: false,
        message: 'F_Code must be a comma-separated numeric list (example: "50,51")'
      });
    }

    const factoryParams = {};
    const factoryFilter = codes
      ? buildParametrizedInClause('p.M_FACTORY', codes, factoryParams, 'hf')
      : (userId ? 'AND p.M_FACTORY IN (SELECT FactID FROM MI_UserFact WITH (NOLOCK) WHERE UserID = @userId)' : '');

    if (range.from === range.to) {
      const hourlyData = await fetchHomeFactHourly({
        season,
        codes,
        userId,
        dateIso: range.from
      });
      return res.status(200).json(hourlyData);
    }

    const rows = await fetchHomeFactRowsAdaptive({
      season,
      factoryFilter,
      fromDate: range.from,
      toDate: range.to,
      userId,
      extraParams: factoryParams
    });

    const dateList = buildDateLabels(range.from, range.to);
    if (!rows.length) {
      return res.status(200).json({ MyList: [], DateList: dateList });
    }

    const byFactory = new Map();
    rows.forEach((row) => {
      const code = String(row.F_Code || '').trim();
      const name = String(row.F_Name || '').trim();
      const key = `${name} (${code})`;
      const dateKey = toDDMMYYYY(row.M_DATE);
      if (!byFactory.has(key)) byFactory.set(key, new Map());
      byFactory.get(key).set(dateKey, Number(row.M_FinalWt) || 0);
    });

    const myList = Array.from(byFactory.entries()).map(([name, values]) => ({
      name,
      data: dateList.map((d) => values.get(d) || 0)
    }));

    return res.status(200).json({ MyList: myList, DateList: dateList });
  } catch (error) {
    if (isTimeoutError(error)) {
      return res.status(500).json({
        success: false,
        message: 'Dashboard query timed out. Please narrow the date range or choose a factory.'
      });
    }
    logControllerError('HomeFact', req, error, {
      F_Code: req.body?.F_Code || req.query?.F_Code || null,
      txtdaterange: req.body?.txtdaterange || req.query?.txtdaterange || null
    });
    return next(error);
  }
};

exports.OverShootForCenters = async (req, res) => {
  try {
    const season = req.user?.season;
    const userId = String(req.user?.userId || '').trim();
    const F_Code = String(req.body.F_Code || req.query.F_Code || '').trim();
    const txtdaterange = String(req.body.txtdaterange || req.query.txtdaterange || '').trim();
    const range = parseDateRange(txtdaterange);

    if (!range) {
      return res.status(200).json([]);
    }

    const codes = normalizeFactoryCodeList(F_Code);
    const singleFactory = isSingleFactorySelection(codes);
    const params = { fromDate: range.from, toDate: range.to, userId };
    const factoryFilter = codes
      ? buildParametrizedInClause('cf.ch_Factory', codes, params, 'os')
      : (userId ? 'AND cf.ch_Factory IN (SELECT FactID FROM MI_UserFact WITH (NOLOCK) WHERE UserID = @userId)' : '');

    const selectLabel = singleFactory
      ? 'mfac.F_Name AS Factory, cnt.C_name AS F_Name,'
      : 'mfac.F_Name AS F_Name,';
    const groupBy = singleFactory
      ? 'GROUP BY c.ch_Factory, mfac.F_Name, cnt.C_name'
      : 'GROUP BY c.ch_Factory, mfac.F_Name';

    const rows = await executeQuery(
      `WITH cte AS (
         SELECT
           ROW_NUMBER() OVER (ORDER BY Ch_Centre) AS SN,
           ch_Factory,
           Ch_Centre AS C_Code,
           c_name,
           ch_challan AS ChalanNo,
           Tr_Code,
           t.TR_NAME AS Transporter,
           Ch_truck_no AS TruckNo,
           CONVERT(varchar, ISNULL(Ch_dep_date, '1900-01-01'), 103) + ' ' + CONVERT(varchar, ISNULL(Ch_dep_date, '1900-01-01'), 8) AS DepartureTime,
           CONVERT(varchar, (CASE WHEN ISNULL(tt_TokDatetime, '1900-01-01') = '1900-01-01' THEN ISNULL(TT_CRDATE, '1900-01-01') ELSE ISNULL(tt_TokDatetime, '1900-01-01') END), 103)
             + ' ' + CONVERT(varchar, (CASE WHEN ISNULL(tt_TokDatetime, '1900-01-01') = '1900-01-01' THEN ISNULL(TT_CRDATE, '1900-01-01') ELSE ISNULL(tt_TokDatetime, '1900-01-01') END), 8) AS ArrivalTime,
           CONVERT(varchar, ISNULL(tt_TARE_DT, '1900-01-01'), 103) + ' ' + CONVERT(varchar, ISNULL(tt_TARE_DT, '1900-01-01'), 8) AS WeighmentTime,
           CONVERT(varchar(5), DATEADD(minute, DATEDIFF(minute, CONVERT(varchar, ISNULL(Ch_dep_date, '1900-01-01'), 8),
             CONVERT(varchar, (CASE WHEN ISNULL(tt_TokDatetime, '1900-01-01') = '1900-01-01' THEN ISNULL(TT_CRDATE, Ch_dep_date) ELSE ISNULL(tt_TokDatetime, '1900-01-01') END), 8)), 0), 114) AS TravelTime,
           CONVERT(varchar(5), DATEADD(minute, DATEDIFF(minute, CONVERT(varchar, (CASE WHEN ISNULL(tt_TokDatetime, '1900-01-01') = '1900-01-01' THEN ISNULL(TT_CRDATE, '1900-01-01') ELSE ISNULL(tt_TokDatetime, '1900-01-01') END), 8),
             CONVERT(varchar, (CASE WHEN ISNULL(tt_TARE_DT, '1900-01-01 00:00:00') = '1900-01-01 00:00:00' THEN ISNULL(TT_CRDATE, ISNULL(tt_TokDatetime, '1900-01-01')) ELSE ISNULL(tt_TARE_DT, '1900-01-01 00:00:00') END), 8)), 0), 114) AS WaitTime
         FROM challan_final cf
         LEFT JOIN Receipt r ON r.tt_factory = cf.ch_Factory AND r.tt_center = cf.Ch_Centre AND r.tt_chalanNo = cf.ch_challan
         JOIN centre c ON c.c_factory = cf.ch_Factory AND c.C_Code = cf.Ch_Centre
         JOIN Transporter t ON t.TR_FACTORY = cf.ch_Factory AND t.TR_CODE = cf.ch_trans
         LEFT JOIN T_TOKEN tk ON tk.TT_FACTORY = ch_factory AND tk.TT_CHLN = ch_challan
         WHERE Ch_Cancel = 0
           AND CAST(Ch_dep_date AS date) BETWEEN @fromDate AND @toDate
           ${factoryFilter}
       )
       SELECT
         c.ch_Factory,
         ${selectLabel}
         COUNT(DISTINCT c.C_Code) AS notruck,
         SUM(DATEDIFF(minute, 0, TravelTime)) AS TotalMinutes,
         CONVERT(varchar(5), SUM(DATEDIFF(minute, 0, TravelTime)) / 60) + ':' + CONVERT(char(2), SUM(DATEDIFF(minute, 0, TravelTime)) % 60) AS TotalTime,
         (SUM(DATEDIFF(minute, 0, TravelTime)) / NULLIF(COUNT(c.C_Code), 0)) AS avgmint,
         CAST(CONVERT(varchar(5), (SUM(DATEDIFF(minute, 0, TravelTime)) / NULLIF(COUNT(c.C_Code), 0)) / 60)
           + ':' + CONVERT(char(2), (SUM(DATEDIFF(minute, 0, TravelTime)) / NULLIF(COUNT(c.C_Code), 0)) % 60) AS varchar) AS avgtime,
         ((SUM(DISTINCT cnt.c_distance / 10.0)) / NULLIF(COUNT(DISTINCT c.C_Code), 0)) AS cntToGate,
         CONVERT(char(5), DATEADD(minute, 60 * ((SUM(DISTINCT cnt.c_distance / 10.0)) / NULLIF(COUNT(DISTINCT c.C_Code), 0)), 0), 108) AS ctogHours,
         DATEDIFF(minute, 0, CONVERT(char(5), DATEADD(minute, 60 * ((SUM(DISTINCT cnt.c_distance / 10.0)) / NULLIF(COUNT(DISTINCT c.C_Code), 0)), 0), 108)) AS ctogateMinute,
         (SUM(DATEDIFF(minute, 0, TravelTime)) / NULLIF(COUNT(c.C_Code), 0))
           - DATEDIFF(minute, 0, CONVERT(char(5), DATEADD(minute, 60 * ((SUM(DISTINCT cnt.c_distance / 10.0)) / NULLIF(COUNT(DISTINCT c.C_Code), 0)), 0), 108)) AS diff,
         ISNULL((
           (
             (SUM(DATEDIFF(minute, 0, TravelTime)) / NULLIF(COUNT(c.C_Code), 0))
             - DATEDIFF(minute, 0, CONVERT(char(5), DATEADD(minute, 60 * ((SUM(DISTINCT cnt.c_distance / 10.0)) / NULLIF(COUNT(DISTINCT c.C_Code), 0)), 0), 108))
           ) * 100.0
         ) / NULLIF(
           DATEDIFF(minute, 0, CONVERT(char(5), DATEADD(minute, 60 * ((SUM(DISTINCT cnt.c_distance / 10.0)) / NULLIF(COUNT(DISTINCT c.C_Code), 0)), 0), 108)),
           0
         ), 0) AS overshootperc
       FROM cte c
       LEFT JOIN Centre cnt ON cnt.c_factory = c.ch_Factory AND cnt.c_code = c.C_Code
       JOIN MI_Factory mfac ON c.ch_Factory = mfac.F_Code
       ${groupBy}`,
      params,
      season,
      { timeoutMs: 120000 }
    );

    const filtered = rows.filter((item) => Number(item.diff || 0) > 0);
    return res.status(200).json(filtered);
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

exports.TokenGrossTare = async (req, res) => {
  try {
    const season = req.user?.season;
    const userId = String(req.user?.userId || '').trim();
    const F_Code = String(req.body.F_Code || req.query.F_Code || '').trim();
    const txtdaterange = String(req.body.txtdaterange || req.query.txtdaterange || '').trim();
    const range = parseDateRange(txtdaterange);

    if (!range) {
      return res.status(200).json([]);
    }

    const codes = normalizeFactoryCodeList(F_Code);
    const singleFactory = isSingleFactorySelection(codes);

    let query = '';
    const params = { fromDate: range.from, toDate: range.to, userId };

    if (singleFactory) {
      query = `
        SELECT c_code, c_name AS F_name, SUM(TGM) AS TGM, SUM(GTrM) AS GTrM, SUM(TTM) AS TTM,
               SUM(TGOvs) AS TGOvs, SUM(GTOvs) AS GTOvs, SUM(TTOvs) AS TTOvs
        FROM (
          SELECT *,
                 (CASE WHEN TGM > 120 THEN TGM - 120 ELSE 0 END) AS TGOvs,
                 (CASE WHEN GTrM > 120 THEN GTrM - 120 ELSE 0 END) AS GTOvs,
                 (CASE WHEN TTM > 240 THEN TTM - 240 ELSE 0 END) AS TTOvs
          FROM (
            SELECT c_code, c_name,
                   DATEDIFF(MINUTE, tt_TokDatetime, tt_GroDateTime) AS TGM,
                   DATEDIFF(MINUTE, tt_GroDateTime, TT_TARE_DT) AS GTrM,
                   DATEDIFF(MINUTE, tt_TokDatetime, TT_TARE_DT) AS TTM
            FROM Receipt
            JOIN Centre f ON f.c_code = tt_center
            WHERE tt_factory = @singleFactory
              AND CAST(TT_TARE_DT AS date) BETWEEN @fromDate AND @toDate
          ) X
          WHERE TGM > 0 AND GTrM > 0 AND TTM > 0
            AND ((CASE WHEN TGM > 120 THEN TGM - 120 ELSE 0 END) > 0
              OR (CASE WHEN GTrM > 120 THEN GTrM - 120 ELSE 0 END) > 0
              OR (CASE WHEN TTM > 240 THEN TTM - 240 ELSE 0 END) > 0)
        ) Y
        GROUP BY c_code, c_name`;
      params.singleFactory = codes;
    } else {
      const factoryPredicate = codes
        ? buildParametrizedInClause('tt_factory', codes, params, 'tg')
        : (userId ? ' AND tt_factory IN (SELECT FactID FROM MI_UserFact WITH (NOLOCK) WHERE UserID = @userId)' : '');
      query = `
        SELECT F_Name, F_Code, SUM(TGM) AS TGM, SUM(GTrM) AS GTrM, SUM(TTM) AS TTM,
               SUM(TGOvs) AS TGOvs, SUM(GTOvs) AS GTOvs, SUM(TTOvs) AS TTOvs
        FROM (
          SELECT *,
                 (CASE WHEN TGM > 120 THEN TGM - 120 ELSE 0 END) AS TGOvs,
                 (CASE WHEN GTrM > 120 THEN GTrM - 120 ELSE 0 END) AS GTOvs,
                 (CASE WHEN TTM > 240 THEN TTM - 240 ELSE 0 END) AS TTOvs
          FROM (
            SELECT COALESCE(RTRIM(mf.F_Name), RTRIM(fa.F_Name), CAST(tt_factory AS varchar(10))) AS F_Name,
                   tt_factory AS F_Code,
                   DATEDIFF(MINUTE, tt_TokDatetime, tt_GroDateTime) AS TGM,
                   DATEDIFF(MINUTE, tt_GroDateTime, TT_TARE_DT) AS GTrM,
                   DATEDIFF(MINUTE, tt_TokDatetime, TT_TARE_DT) AS TTM
            FROM Receipt r
            LEFT JOIN MI_Factory mf ON mf.F_code = r.tt_factory
            LEFT JOIN Factory fa ON fa.F_code = r.tt_factory
            WHERE CAST(TT_TARE_DT AS date) BETWEEN @fromDate AND @toDate
              ${factoryPredicate}
          ) X
          WHERE TGM > 0 AND GTrM > 0 AND TTM > 0
            AND ((CASE WHEN TGM > 120 THEN TGM - 120 ELSE 0 END) > 0
              OR (CASE WHEN GTrM > 120 THEN GTrM - 120 ELSE 0 END) > 0
              OR (CASE WHEN TTM > 240 THEN TTM - 240 ELSE 0 END) > 0)
        ) Y
        GROUP BY F_Name, F_Code`;
    }

    const rows = await executeQuery(query, params, season, { timeoutMs: 120000 });
    return res.status(200).json(rows);
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

exports.SugarWhatsAppReportView = async (req, res, next) => {
  try {
    const season = req.user?.season;
    const factoryCodeRaw = String(req.query.factoryCode || req.query.Cn_Unit || '').trim();
    const fromRaw = req.query.fromDate || req.query.Date || req.query.Cn_Date || '';
    const toRaw = req.query.toDate || req.query.todate || req.query.Cn_Date || '';
    const fromDate = parseFlexibleDateToIso(fromRaw);
    const toDate = parseFlexibleDateToIso(toRaw);
    const factoryCode = factoryCodeRaw === '' ? null : Number(factoryCodeRaw);

    if (factoryCodeRaw !== '' && (!Number.isFinite(factoryCode) || factoryCode <= 0)) {
      return res.status(400).json({ success: false, message: 'factoryCode must be a valid positive number' });
    }
    if (!fromDate || !toDate) {
      return res.status(400).json({ success: false, message: 'fromDate and toDate are required (DD-MM-YYYY or YYYY-MM-DD)' });
    }
    if (fromDate > toDate) {
      return res.status(400).json({ success: false, message: 'fromDate cannot be greater than toDate' });
    }

    
    const tableName = ensureWhitelistedTable(await resolveCaneCrushTable(season), CANE_CRUSH_TABLES, 'cane crush');
    const tableSql = quoteSqlObjectName(tableName);
    const rows = await executeQuery(
      `SELECT c.ID,
              c.Cn_Unit,
              COALESCE(mf.F_Name, ff.F_Name, CAST(c.Cn_Unit AS varchar(20))) AS Unit,
              CONVERT(varchar, c.Cn_Date, 103) AS Cn_Date,
              ISNULL(c.Cn_Crush_OnDate, 0) AS Cn_Crush_OnDate,
              ISNULL(c.Cn_Crush_ToDate, 0) AS Cn_Crush_ToDate,
              ISNULL(c.Cn_Rec_ThisYear1, 0) AS Cn_Rec_ThisYear1,
              ISNULL(c.Cn_Rec_ThisYear2, 0) AS Cn_Rec_ThisYear2,
              ISNULL(c.Cn_Rec_ThisProdtype, '') AS Cn_Rec_ThisProdtype,
              ISNULL(c.Cn_Rec_Estimate, 0) AS Cn_Rec_Estimate,
              ISNULL(c.Cn_MolCatPurity_OnDate, 0) AS Cn_MolCatPurity_OnDate,
              ISNULL(c.Cn_MolCatPurity_ToDate, 0) AS Cn_MolCatPurity_ToDate,
              ISNULL(c.Cn_Loss_OnDate, 0) AS Cn_Loss_OnDate,
              ISNULL(c.Cn_Loss_ToDate, 0) AS Cn_Loss_ToDate,
              ISNULL(c.Cn_SugBagQtl_OnDate, 0) AS Cn_SugBagQtl_OnDate,
              ISNULL(c.Cn_SugBagQtl_ToDate, 0) AS Cn_SugBagQtl_ToDate,
              ISNULL(c.Cn_CnBalGateQtl, 0) AS Cn_CnBalGateQtl,
              ISNULL(c.Cn_Rainfall, 0) AS Cn_Rainfall,
              ISNULL(c.Cn_Stoppage_OnDate, '') AS Cn_Stoppage_OnDate,
              ISNULL(c.Cn_UserID, '') AS Cn_UserID,
              ISNULL(c.Cn_CnBalCentreQtl, 0) AS Cn_CnBalCentreQtl
       FROM ${tableSql} c
       LEFT JOIN MI_Factory mf ON mf.F_Code = c.Cn_Unit
       LEFT JOIN Factory ff ON ff.f_code = c.Cn_Unit
       WHERE CAST(c.Cn_Date AS date) BETWEEN @fromDate AND @toDate
         AND (@factoryCode IS NULL OR c.Cn_Unit = @factoryCode)
       ORDER BY c.Cn_Date DESC, c.ID DESC`,
      { fromDate, toDate, factoryCode },
      season,
      { timeoutMs: 120000 }
    );
    return res.status(200).json(rows);
  } catch (error) {
    logControllerError('SugarWhatsAppReportView', req, error, {
      factoryCode: req.query.factoryCode || req.query.Cn_Unit || null,
      fromDate: req.query.fromDate || req.query.Date || null,
      toDate: req.query.toDate || req.query.todate || null
    });
    return next(error);
  }
};

exports.SugarWhatsAppReport = async (req, res, next) => {
  try {
    const season = req.user?.season;
    const sid = String(req.query.sid || req.query.id || '').trim();
    if (!sid) {
      return res.status(200).json(null);
    }
    const tableName = ensureWhitelistedTable(await resolveCaneCrushTable(season), CANE_CRUSH_TABLES, 'cane crush');
    const tableSql = quoteSqlObjectName(tableName);
    const rows = await executeQuery(`SELECT TOP 1 * FROM ${tableSql} WHERE ID=@sid`, { sid }, season);
    return res.status(200).json(rows[0] || null);
  } catch (error) {
    logControllerError('SugarWhatsAppReport', req, error, {
      sid: req.query.sid || req.query.id || null
    });
    return next(error);
  }
};

exports.SugarWhatsAppReport_2 = async (req, res, next) => {
  try {
    const season = req.user?.season;
    const tableName = ensureWhitelistedTable(await resolveCaneCrushTable(season), CANE_CRUSH_TABLES, 'cane crush');
    const tableSql = quoteSqlObjectName(tableName);
    const id = String(req.body.id || '').trim();
    const command = String(req.body.Command || req.body.command || (id ? 'btupdate' : 'btninsert')).toLowerCase();
    if (command === 'delete' || command === 'btndelete') {
      if (!id) {
        return res.status(400).json({ success: false, message: 'id is required for delete' });
      }
      await executeQuery(`DELETE FROM ${tableSql} WHERE ID=@id`, { id }, season);
      return res.status(200).json({ success: true, message: 'Deleted successfully' });
    }
    const Cn_Unit = Number(req.body.cn_Unit || req.body.Cn_Unit || 0);
    const Cn_Date = parseFlexibleDateToIso(req.body.cn_Date || req.body.Cn_Date);

    if (!Cn_Unit || !Cn_Date) {
      return res.status(400).json({ success: false, message: 'cn_Unit and cn_Date are required' });
    }

    const payload = {
      Cn_Unit,
      Cn_Date,
      Cn_Crush_OnDate: Number(req.body.cn_Crush_OnDate || 0),
      Cn_Crush_ToDate: Number(req.body.cn_Crush_ToDate || 0),
      Cn_Rec_ThisYear1: Number(req.body.cn_Rec_ThisYear1 || 0),
      Cn_Rec_ThisYear2: Number(req.body.cn_Rec_ThisYear2 || 0),
      Cn_Rec_ThisProdtype: String(req.body.cn_Rec_ThisProdtype || ''),
      Cn_Rec_Estimate: Number(req.body.cn_Rec_Estimate || 0),
      Cn_MolCatPurity_OnDate: Number(req.body.cn_MolCatPurity_OnDate || 0),
      Cn_MolCatPurity_ToDate: Number(req.body.cn_MolCatPurity_ToDate || 0),
      Cn_Loss_OnDate: Number(req.body.cn_Loss_OnDate || 0),
      Cn_Loss_ToDate: Number(req.body.cn_Loss_ToDate || 0),
      Cn_SugBagQtl_OnDate: Number(req.body.cn_SugBagQtl_OnDate || 0),
      Cn_SugBagQtl_ToDate: Number(req.body.cn_SugBagQtl_ToDate || 0),
      Cn_CnBalGateQtl: Number(req.body.cn_CnBalGateQtl || 0),
      Cn_CnBalCentreQtl: Number(req.body.cn_CnBalCentreQtl || 0),
      Cn_Rainfall: Number(req.body.cn_Rainfall || 0),
      Cn_Cap_OnDate: Number(req.body.cn_Cap_OnDate || 0),
      Cn_Cap_ToDate: Number(req.body.cn_Cap_ToDate || 0),
      Cn_Stoppage_OnDate: String(req.body.cn_Stoppage_OnDate || ''),
      Cn_Remark: String(req.body.cn_Remark || ''),
      Cn_UserID: String(req.user?.userId || '')
    };

    if (command === 'btupdate' || command === 'update') {
      if (!id) {
        return res.status(400).json({ success: false, message: 'id is required for update' });
      }
      await executeQuery(
        `UPDATE ${tableSql}
         SET Cn_Unit=@Cn_Unit, Cn_Date=@Cn_Date,
             Cn_Crush_OnDate=@Cn_Crush_OnDate, Cn_Crush_ToDate=@Cn_Crush_ToDate,
             Cn_Rec_ThisYear1=@Cn_Rec_ThisYear1, Cn_Rec_ThisYear2=@Cn_Rec_ThisYear2,
             Cn_Rec_ThisProdtype=@Cn_Rec_ThisProdtype, Cn_Rec_Estimate=@Cn_Rec_Estimate,
             Cn_MolCatPurity_OnDate=@Cn_MolCatPurity_OnDate, Cn_MolCatPurity_ToDate=@Cn_MolCatPurity_ToDate,
             Cn_Loss_OnDate=@Cn_Loss_OnDate, Cn_Loss_ToDate=@Cn_Loss_ToDate,
             Cn_SugBagQtl_OnDate=@Cn_SugBagQtl_OnDate, Cn_SugBagQtl_ToDate=@Cn_SugBagQtl_ToDate,
             Cn_CnBalGateQtl=@Cn_CnBalGateQtl, Cn_CnBalCentreQtl=@Cn_CnBalCentreQtl,
             Cn_Rainfall=@Cn_Rainfall, Cn_Cap_OnDate=@Cn_Cap_OnDate, Cn_Cap_ToDate=@Cn_Cap_ToDate,
             Cn_Stoppage_OnDate=@Cn_Stoppage_OnDate, Cn_Remark=@Cn_Remark, Cn_UserID=@Cn_UserID
         WHERE ID=@id`,
        { ...payload, id },
        season
      );
      return res.status(200).json({ success: true, message: 'Updated successfully' });
    }

    await executeQuery(
      `INSERT INTO ${tableSql}
        (Cn_Unit, Cn_Date, Cn_Crush_OnDate, Cn_Crush_ToDate, Cn_Rec_ThisYear1, Cn_Rec_ThisYear2,
         Cn_Rec_ThisProdtype, Cn_Rec_Estimate, Cn_MolCatPurity_OnDate, Cn_MolCatPurity_ToDate,
         Cn_Loss_OnDate, Cn_Loss_ToDate, Cn_SugBagQtl_OnDate, Cn_SugBagQtl_ToDate, Cn_CnBalGateQtl,
         Cn_CnBalCentreQtl, Cn_Rainfall, Cn_Cap_OnDate, Cn_Cap_ToDate, Cn_Stoppage_OnDate, Cn_Remark, Cn_UserID)
       VALUES
        (@Cn_Unit, @Cn_Date, @Cn_Crush_OnDate, @Cn_Crush_ToDate, @Cn_Rec_ThisYear1, @Cn_Rec_ThisYear2,
         @Cn_Rec_ThisProdtype, @Cn_Rec_Estimate, @Cn_MolCatPurity_OnDate, @Cn_MolCatPurity_ToDate,
         @Cn_Loss_OnDate, @Cn_Loss_ToDate, @Cn_SugBagQtl_OnDate, @Cn_SugBagQtl_ToDate, @Cn_CnBalGateQtl,
         @Cn_CnBalCentreQtl, @Cn_Rainfall, @Cn_Cap_OnDate, @Cn_Cap_ToDate, @Cn_Stoppage_OnDate, @Cn_Remark, @Cn_UserID)`,
      payload,
      season
    );
    return res.status(200).json({ success: true, message: 'Saved successfully' });
  } catch (error) {
    logControllerError('SugarWhatsAppReport_2', req, error, {
      id: req.body.id || null
    });
    return next(error);
  }
};

exports.SWRD = async (req, res, next) => {
  try {
    const season = req.user?.season;
    const userId = String(req.user?.userId || '').trim();
    const utid = String(req.user?.utid || '').trim();
    const isAdmin = utid === '1';
    const factoryRaw = String(req.query.F_code || req.query.factoryCode || req.query.Cn_Unit || '').trim();
    const cnDateRaw = req.query.Cn_Date || req.query.Date || req.query.date || '';
    const dateIso = parseFlexibleDateToIso(cnDateRaw);

    if (!dateIso) {
      return res.status(400).json({ success: false, message: 'Cn_Date is required (DD-MM-YYYY or YYYY-MM-DD)' });
    }

    const tableName = ensureWhitelistedTable(await resolveCaneCrushTable(season), CANE_CRUSH_TABLES, 'cane crush');
    const tableSql = quoteSqlObjectName(tableName);
    const codes = normalizeFactoryCodeList(factoryRaw);
    const prevDateObj = new Date(`${dateIso}T00:00:00`);
    prevDateObj.setFullYear(prevDateObj.getFullYear() - 1);
    const prevDate = `${prevDateObj.getFullYear()}-${String(prevDateObj.getMonth() + 1).padStart(2, '0')}-${String(prevDateObj.getDate()).padStart(2, '0')}`;

    const currentParams = { dateIso, userId };
    let unitsWhere = '';
    if (codes) {
      unitsWhere += buildParametrizedInClause('f.F_Code', codes, currentParams, 'swu');
    } else if (!isAdmin && userId) {
      unitsWhere += ' AND f.F_Code IN (SELECT FactID FROM MI_UserFact WITH (NOLOCK) WHERE UserID = @userId)';
    }

    const currentRows = await executeQuery(
      `WITH units AS (
         SELECT f.F_Code AS Cn_Unit, RTRIM(f.F_Name) AS Unit
         FROM MI_Factory f WITH (NOLOCK)
         WHERE 1=1 ${unitsWhere}
       )
       SELECT u.Cn_Unit,
              u.Unit,
              CASE WHEN CAST(c.Cn_Date AS date) = @dateIso THEN ISNULL(c.Cn_Crush_OnDate, 0) ELSE 0 END AS Cn_Crush_OnDate,
              ISNULL(c.Cn_Crush_ToDate, 0) AS Cn_Crush_ToDate,
              CASE WHEN CAST(c.Cn_Date AS date) = @dateIso THEN ISNULL(c.Cn_MolCatPurity_OnDate, 0) ELSE 0 END AS Cn_MolCatPurity_OnDate,
              ISNULL(c.Cn_MolCatPurity_ToDate, 0) AS Cn_MolCatPurity_ToDate,
              CASE WHEN CAST(c.Cn_Date AS date) = @dateIso THEN ISNULL(c.Cn_Rec_ThisYear1, 0) ELSE 0 END AS Cn_Rec_ThisYear1,
              ISNULL(c.Cn_Rec_ThisYear2, 0) AS Cn_Rec_ThisYear2,
              ISNULL(c.Cn_Rec_ThisProdtype, '') AS Cn_Rec_ThisProdtype,
              ISNULL(c.Cn_Rec_Estimate, 0) AS Cn_Rec_Estimate,
              CASE WHEN CAST(c.Cn_Date AS date) = @dateIso THEN ISNULL(c.Cn_Loss_OnDate, 0) ELSE 0 END AS Cn_Loss_OnDate,
              ISNULL(c.Cn_Loss_ToDate, 0) AS Cn_Loss_ToDate,
              CASE WHEN CAST(c.Cn_Date AS date) = @dateIso THEN ISNULL(c.Cn_SugBagQtl_OnDate, 0) ELSE 0 END AS Cn_SugBagQtl_OnDate,
              ISNULL(c.Cn_SugBagQtl_ToDate, 0) AS Cn_SugBagQtl_ToDate,
              CASE WHEN CAST(c.Cn_Date AS date) = @dateIso THEN ISNULL(c.Cn_Cap_OnDate, 0) ELSE 0 END AS Cn_Cap_OnDate,
              ISNULL(c.Cn_Cap_ToDate, 0) AS Cn_Cap_ToDate,
              CASE WHEN CAST(c.Cn_Date AS date) = @dateIso THEN ISNULL(c.Cn_CnBalGateQtl, 0) ELSE 0 END AS Cn_CnBalGateQtl,
              CASE WHEN CAST(c.Cn_Date AS date) = @dateIso THEN ISNULL(c.Cn_CnBalCentreQtl, 0) ELSE 0 END AS Cn_CnBalCentreQtl,
              ISNULL(c.Cn_Rainfall, 0) AS Cn_Rainfall,
              ISNULL(c.Cn_Stoppage_OnDate, '') AS Cn_Stoppage_OnDate,
              ISNULL(c.Cn_Remark, '') AS Cn_Remark
       FROM units u
       OUTER APPLY (
         SELECT TOP 1 c.*
         FROM ${tableSql} c WITH (NOLOCK)
         WHERE c.Cn_Unit = u.Cn_Unit
           AND CAST(c.Cn_Date AS date) <= @dateIso
         ORDER BY CAST(c.Cn_Date AS date) DESC, c.ID DESC
       ) c
       WHERE c.ID IS NOT NULL
       ORDER BY u.Unit`,
      currentParams,
      season,
      { timeoutMs: 120000 }
    );

    const previousRows = [];
    const unitIds = Array.from(new Set(currentRows.map((r) => Number(r.Cn_Unit)).filter((n) => Number.isFinite(n) && n > 0)));
    if (unitIds.length) {
      const prevParams = { prevDate };
      const placeholders = unitIds.map((unitId, idx) => {
        const key = `pu${idx}`;
        prevParams[key] = unitId;
        return `@${key}`;
      });

      const rows = await executeQuery(
        `SELECT u.Cn_Unit,
                CASE WHEN CAST(c.Cn_Date AS date) = @prevDate THEN ISNULL(c.Cn_MolCatPurity_OnDate, 0) ELSE 0 END AS Cn_MolCatPurity_OnDate,
                ISNULL(c.Cn_MolCatPurity_ToDate, 0) AS Cn_MolCatPurity_ToDate,
                CASE WHEN CAST(c.Cn_Date AS date) = @prevDate THEN ISNULL(c.Cn_Rec_ThisYear1, 0) ELSE 0 END AS Cn_Rec_ThisYear1,
                ISNULL(c.Cn_Rec_ThisYear2, 0) AS Cn_Rec_ThisYear2,
                ISNULL(c.Cn_Rec_ThisProdtype, '') AS Cn_Rec_ThisProdtype,
                CASE WHEN CAST(c.Cn_Date AS date) = @prevDate THEN ISNULL(c.Cn_Crush_OnDate, 0) ELSE 0 END AS Cn_Crush_OnDate,
                ISNULL(c.Cn_Crush_ToDate, 0) AS Cn_Crush_ToDate
         FROM (SELECT DISTINCT Cn_Unit FROM ${tableSql} WITH (NOLOCK) WHERE Cn_Unit IN (${placeholders.join(',')})) u
         OUTER APPLY (
           SELECT TOP 1 c.*
           FROM ${tableSql} c WITH (NOLOCK)
           WHERE c.Cn_Unit = u.Cn_Unit
             AND CAST(c.Cn_Date AS date) <= @prevDate
           ORDER BY CAST(c.Cn_Date AS date) DESC, c.ID DESC
         ) c`,
        prevParams,
        season,
        { timeoutMs: 120000 }
      );
      previousRows.push(...rows);
    }

    const prevMap = new Map(previousRows.map((r) => [String(r.Cn_Unit), r]));
    const rows = currentRows.map((r) => {
      const prev = prevMap.get(String(r.Cn_Unit)) || {};
      return {
        ...r,
        Prev_Mol_OnDate: Number(prev.Cn_MolCatPurity_OnDate || 0),
        Prev_Mol_ToDate: Number(prev.Cn_MolCatPurity_ToDate || 0),
        Prev_Rec_OnDate: Number(prev.Cn_Rec_ThisYear1 || 0),
        Prev_Rec_ToDate: Number(prev.Cn_Rec_ThisYear2 || 0),
        Prev_ProdType: String(prev.Cn_Rec_ThisProdtype || ''),
        Prev_Crush_OnDate: Number(prev.Cn_Crush_OnDate || 0),
        Prev_Crush_ToDate: Number(prev.Cn_Crush_ToDate || 0)
      };
    });

    const totals = rows.reduce((acc, r) => {
      acc.crushOn += Number(r.Cn_Crush_OnDate || 0);
      acc.crushTo += Number(r.Cn_Crush_ToDate || 0);
      acc.prevCrushOn += Number(r.Prev_Crush_OnDate || 0);
      acc.prevCrushTo += Number(r.Prev_Crush_ToDate || 0);
      acc.bagOn += Number(r.Cn_SugBagQtl_OnDate || 0);
      acc.bagTo += Number(r.Cn_SugBagQtl_ToDate || 0);
      return acc;
    }, { crushOn: 0, crushTo: 0, prevCrushOn: 0, prevCrushTo: 0, bagOn: 0, bagTo: 0 });

    return res.status(200).json({
      success: true,
      reportDate: toDDMMYYYY(dateIso),
      difference: {
        onDate: totals.crushOn - totals.prevCrushOn,
        toDate: totals.crushTo - totals.prevCrushTo
      },
      totals: {
        crushOn: totals.crushOn,
        crushTo: totals.crushTo,
        sugarBagOn: totals.bagOn,
        sugarBagTo: totals.bagTo
      },
      rows
    });
  } catch (error) {
    logControllerError('SWRD', req, error, {
      F_code: req.query.F_code || req.query.factoryCode || null,
      Cn_Date: req.query.Cn_Date || req.query.Date || null
    });
    return next(error);
  }
};

exports.distilleryReportEntryView = async (req, res, next) => {
  try {
    const season = req.user?.season;
    const factoryCodeRaw = String(req.query.factoryCode || req.query.F_Code || '').trim();
    const fromRaw = req.query.fromDate || req.query.Date || req.query.Dist_Date || '';
    const toRaw = req.query.toDate || req.query.todate || req.query.Dist_Date || '';
    const fromDate = parseFlexibleDateToIso(fromRaw);
    const toDate = parseFlexibleDateToIso(toRaw);
    const factoryCode = factoryCodeRaw === '' ? null : Number(factoryCodeRaw);

    if (factoryCodeRaw !== '' && (!Number.isFinite(factoryCode) || factoryCode <= 0)) {
      return res.status(400).json({ success: false, message: 'factoryCode must be a valid positive number' });
    }
    if (!fromDate || !toDate) {
      return res.status(400).json({ success: false, message: 'fromDate and toDate are required (DD-MM-YYYY or YYYY-MM-DD)' });
    }
    if (fromDate > toDate) {
      return res.status(400).json({ success: false, message: 'fromDate cannot be greater than toDate' });
    }

    const tableName = ensureWhitelistedTable(await resolveDistilleryTable(season), DISTILLERY_TABLES, 'distillery');
    const tableSql = quoteSqlObjectName(tableName);
    const tableColumns = await getTableColumns(season, tableName);
    const tableColumnList = await getTableColumnList(season, tableName);
    const c = {
      id: pickExistingColumnFromList(tableColumnList, ['ID', 'Id']) || pickColumnByPattern(tableColumnList, [/(^|_)id$/]),
      unit: pickExistingColumnFromList(tableColumnList, ['Dist_Unit', 'D_Factory', 'F_Code', 'Unit']) || pickColumnByPattern(tableColumnList, [/unit/, /factory/, /f_code/]),
      date: pickExistingColumnFromList(tableColumnList, ['Dist_Date', 'D_Date', 'Date', 'Dist_RSDate']) || pickColumnByPattern(tableColumnList, [/dist.*date/, /(^|_)date$/]),
      rsStatus: pickExistingColumnFromList(tableColumnList, ['Dist_RSStatus', 'RSStatus']),
      rsDate: pickExistingColumnFromList(tableColumnList, ['Dist_RSDate', 'RSDate', 'Dist_Date', 'D_Date', 'Date']) || pickColumnByPattern(tableColumnList, [/rs.*date/, /restart.*date/]),
      rsProdOnDate: pickExistingColumnFromList(tableColumnList, ['Dist_RSProd_OnDate', 'RS_Prod_OnDate']),
      rsProdToDate: pickExistingColumnFromList(tableColumnList, ['Dist_RSProd_ToDate', 'RS_Prod_ToDate']),
      rsProdType: pickExistingColumnFromList(tableColumnList, ['Dist_RSProd_ProdType', 'RS_Prod_ProdType']),
      aaProdOnDate: pickExistingColumnFromList(tableColumnList, ['Dist_AAProd_OnDate', 'AA_Prod_OnDate']),
      aaProdToDate: pickExistingColumnFromList(tableColumnList, ['Dist_AAProd_ToDate', 'AA_Prod_ToDate']),
      aaProdType: pickExistingColumnFromList(tableColumnList, ['Dist_AAProd_ProdType', 'AA_Prod_ProdType']),
      recOnDate: pickExistingColumnFromList(tableColumnList, ['Dist_Rec_OnDate', 'Rec_OnDate']),
      recToDate: pickExistingColumnFromList(tableColumnList, ['Dist_Rec_ToDate', 'Rec_ToDate']),
      capOnDate: pickExistingColumnFromList(tableColumnList, ['Dist_Cap_OnDate', 'Cap_OnDate']),
      capToDate: pickExistingColumnFromList(tableColumnList, ['Dist_Cap_ToDate', 'Cap_ToDate']),
      financialYear: pickExistingColumnFromList(tableColumnList, ['Dist_FinancialYear', 'FinancialYear']),
      prod: pickExistingColumnFromList(tableColumnList, ['Dist_Prod', 'Prod']),
      stoppage: pickExistingColumnFromList(tableColumnList, ['Dist_Stoppage', 'Stoppage']),
      remark: pickExistingColumnFromList(tableColumnList, ['Dist_Remark', 'Remark']),
      userId: pickExistingColumnFromList(tableColumnList, ['Dist_UserID', 'Userid', 'UserID'])
    };

    const qc = {
      id: c.id ? quoteSqlIdentifier(c.id) : null,
      unit: c.unit ? quoteSqlIdentifier(c.unit) : null,
      date: c.date ? quoteSqlIdentifier(c.date) : null
    };

    const whereFactory = qc.unit ? `AND (@factoryCode IS NULL OR d.${qc.unit} = @factoryCode)` : '';
    const whereDate = qc.date ? `WHERE CAST(d.${qc.date} AS date) BETWEEN @fromDate AND @toDate` : 'WHERE 1=1';
    const orderBy = qc.date
      ? `ORDER BY d.${qc.date} DESC${qc.id ? `, d.${qc.id} DESC` : ''}`
      : (qc.id ? `ORDER BY d.${qc.id} DESC` : '');

    if (!c.date) {
      console.warn(`[${CONTROLLER}] distilleryReportEntryView: no date column found on ${tableName}. Continuing without date filter.`, {
        season,
        tableName,
        columns: tableColumnList
      });
    }

    const rawRows = await executeQuery(
      `SELECT d.*,
              ${qc.unit ? `COALESCE(mf.F_Name, ff.F_Name, CAST(d.${qc.unit} AS varchar(20)))` : "''"} AS Unit
       FROM ${tableSql} d
       LEFT JOIN MI_Factory mf ON ${qc.unit ? `mf.F_Code = d.${qc.unit}` : '1=0'}
       LEFT JOIN Factory ff ON ${qc.unit ? `ff.f_code = d.${qc.unit}` : '1=0'}
       ${whereDate}
         ${whereFactory}
       ${orderBy}`,
      { fromDate, toDate, factoryCode },
      season,
      { timeoutMs: 120000 }
    );
    const pick = (row, candidates, defaultValue = null) => {
      for (const key of candidates) {
        if (Object.prototype.hasOwnProperty.call(row, key) && row[key] !== undefined && row[key] !== null) {
          return row[key];
        }
      }
      return defaultValue;
    };
    const fmtDate = (value) => (value ? toDDMMYYYY(value) : '');
    const num = (v) => Number(v || 0);
    const txt = (v) => String(v || '');

    const rows = rawRows.map((r) => ({
      ID: num(pick(r, ['ID', 'Id'], 0)),
      Dist_Unit: num(pick(r, ['Dist_Unit', 'D_Factory', 'F_Code', 'Unit'], 0)),
      Unit: txt(pick(r, ['Unit'], '')),
      Dist_Date: fmtDate(pick(r, ['Dist_Date', 'D_Date', 'Date', 'Dist_RSDate'], '')),
      Dist_RSStatus: num(pick(r, ['Dist_RSStatus', 'RSStatus'], 0)),
      Dist_RSDate: fmtDate(pick(r, ['Dist_RSDate', 'RSDate', 'Dist_Date', 'D_Date', 'Date'], '')),
      Dist_RSProd_OnDate: num(pick(r, ['Dist_RSProd_OnDate', 'RS_Prod_OnDate'], 0)),
      Dist_RSProd_ToDate: num(pick(r, ['Dist_RSProd_ToDate', 'RS_Prod_ToDate'], 0)),
      Dist_RSProd_ProdType: txt(pick(r, ['Dist_RSProd_ProdType', 'RS_Prod_ProdType'], '')),
      Dist_AAProd_OnDate: num(pick(r, ['Dist_AAProd_OnDate', 'AA_Prod_OnDate'], 0)),
      Dist_AAProd_ToDate: num(pick(r, ['Dist_AAProd_ToDate', 'AA_Prod_ToDate'], 0)),
      Dist_AAProd_ProdType: txt(pick(r, ['Dist_AAProd_ProdType', 'AA_Prod_ProdType'], '')),
      Dist_Rec_OnDate: num(pick(r, ['Dist_Rec_OnDate', 'Rec_OnDate'], 0)),
      Dist_Rec_ToDate: num(pick(r, ['Dist_Rec_ToDate', 'Rec_ToDate'], 0)),
      Dist_Cap_OnDate: num(pick(r, ['Dist_Cap_OnDate', 'Cap_OnDate'], 0)),
      Dist_Cap_ToDate: num(pick(r, ['Dist_Cap_ToDate', 'Cap_ToDate'], 0)),
      Dist_FinancialYear: txt(pick(r, ['Dist_FinancialYear', 'FinancialYear'], '')),
      Dist_Prod: txt(pick(r, ['Dist_Prod', 'Prod'], '')),
      Dist_Stoppage: txt(pick(r, ['Dist_Stoppage', 'Stoppage'], '')),
      Dist_Remark: txt(pick(r, ['Dist_Remark', 'Remark'], '')),
      Dist_UserID: txt(pick(r, ['Dist_UserID', 'Userid', 'UserID'], ''))
    }));

    return res.status(200).json(rows);
  } catch (error) {
    logControllerError('distilleryReportEntryView', req, error, {
      factoryCode: req.query.factoryCode || req.query.F_Code || null,
      fromDate: req.query.fromDate || req.query.Date || null,
      toDate: req.query.toDate || req.query.todate || null
    });
    return next(error);
  }
};

exports.distilleryReportEntry = async (req, res, next) => {
  try {
    const season = req.user?.season;
    const sid = String(req.query.sid || req.query.id || '').trim();
    if (!sid) {
      return res.status(200).json(null);
    }
    const tableName = ensureWhitelistedTable(await resolveDistilleryTable(season), DISTILLERY_TABLES, 'distillery');
    const tableSql = quoteSqlObjectName(tableName);
    const rows = await executeQuery(`SELECT TOP 1 * FROM ${tableSql} WHERE ID=@sid`, { sid }, season);
    return res.status(200).json(rows[0] || null);
  } catch (error) {
    logControllerError('distilleryReportEntry', req, error, {
      sid: req.query.sid || req.query.id || null
    });
    return next(error);
  }
};

exports.distilleryReportEntry_2 = async (req, res, next) => {
  try {
    const season = req.user?.season;
    const tableName = ensureWhitelistedTable(await resolveDistilleryTable(season), DISTILLERY_TABLES, 'distillery');
    const tableColumns = await getTableColumns(season, tableName);
    const tableColumnList = await getTableColumnList(season, tableName);
    const c = {
      id: pickExistingColumnFromList(tableColumnList, ['ID', 'Id']) || pickColumnByPattern(tableColumnList, [/(^|_)id$/]),
      unit: pickExistingColumnFromList(tableColumnList, ['Dist_Unit', 'D_Factory', 'F_Code', 'Unit']) || pickColumnByPattern(tableColumnList, [/unit/, /factory/, /f_code/]),
      date: pickExistingColumnFromList(tableColumnList, ['Dist_Date', 'D_Date', 'Date', 'Dist_RSDate']) || pickColumnByPattern(tableColumnList, [/dist.*date/, /(^|_)date$/]),
      rsStatus: pickExistingColumnFromList(tableColumnList, ['Dist_RSStatus', 'RSStatus']),
      rsDate: pickExistingColumnFromList(tableColumnList, ['Dist_RSDate', 'RSDate', 'Dist_Date', 'D_Date', 'Date']) || pickColumnByPattern(tableColumnList, [/rs.*date/, /restart.*date/]),
      rsProdOnDate: pickExistingColumnFromList(tableColumnList, ['Dist_RSProd_OnDate', 'RS_Prod_OnDate']),
      rsProdToDate: pickExistingColumnFromList(tableColumnList, ['Dist_RSProd_ToDate', 'RS_Prod_ToDate']),
      rsProdType: pickExistingColumnFromList(tableColumnList, ['Dist_RSProd_ProdType', 'RS_Prod_ProdType']),
      aaProdOnDate: pickExistingColumnFromList(tableColumnList, ['Dist_AAProd_OnDate', 'AA_Prod_OnDate']),
      aaProdToDate: pickExistingColumnFromList(tableColumnList, ['Dist_AAProd_ToDate', 'AA_Prod_ToDate']),
      aaProdType: pickExistingColumnFromList(tableColumnList, ['Dist_AAProd_ProdType', 'AA_Prod_ProdType']),
      recOnDate: pickExistingColumnFromList(tableColumnList, ['Dist_Rec_OnDate', 'Rec_OnDate']),
      recToDate: pickExistingColumnFromList(tableColumnList, ['Dist_Rec_ToDate', 'Rec_ToDate']),
      capOnDate: pickExistingColumnFromList(tableColumnList, ['Dist_Cap_OnDate', 'Cap_OnDate']),
      capToDate: pickExistingColumnFromList(tableColumnList, ['Dist_Cap_ToDate', 'Cap_ToDate']),
      financialYear: pickExistingColumnFromList(tableColumnList, ['Dist_FinancialYear', 'FinancialYear']),
      prod: pickExistingColumnFromList(tableColumnList, ['Dist_Prod', 'Prod']),
      stoppage: pickExistingColumnFromList(tableColumnList, ['Dist_Stoppage', 'Stoppage']),
      remark: pickExistingColumnFromList(tableColumnList, ['Dist_Remark', 'Remark']),
      userId: pickExistingColumnFromList(tableColumnList, ['Dist_UserID', 'Userid', 'UserID'])
    };

    if (!c.unit || !c.date) {
      return res.status(500).json({
        success: false,
        message: `${tableName} is missing required columns for save`,
        debugColumns: tableColumnList
      });
    }
    const id = String(req.body.id || '').trim();
    const command = String(req.body.Command || req.body.command || (id ? 'btupdate' : 'btninsert')).toLowerCase();
    const Dist_Unit = Number(req.body.Dist_Unit || req.body.dist_Unit || 0);
    const Dist_Date = parseFlexibleDateToIso(req.body.Dist_Date || req.body.dist_Date);
    const Dist_RSDate = parseFlexibleDateToIso(req.body.Dist_RSDate || req.body.dist_RSDate || req.body.Dist_Date || req.body.dist_Date);

    if (!Dist_Unit || !Dist_Date) {
      return res.status(400).json({ success: false, message: 'Dist_Unit and Dist_Date are required' });
    }

    const payload = {
      Dist_Unit,
      Dist_Date,
      Dist_RSStatus: Number(req.body.Dist_RSStatus || 0),
      Dist_RSDate: Dist_RSDate || Dist_Date,
      Dist_RSProd_OnDate: Number(req.body.Dist_RSProd_OnDate || 0),
      Dist_RSProd_ToDate: Number(req.body.Dist_RSProd_ToDate || 0),
      Dist_RSProd_ProdType: String(req.body.Dist_RSProd_ProdType || req.body.ProdType || ''),
      Dist_AAProd_OnDate: Number(req.body.Dist_AAProd_OnDate || 0),
      Dist_AAProd_ToDate: Number(req.body.Dist_AAProd_ToDate || 0),
      Dist_AAProd_ProdType: String(req.body.Dist_AAProd_ProdType || req.body.ProdType2 || ''),
      Dist_Rec_OnDate: Number(req.body.Dist_Rec_OnDate || 0),
      Dist_Rec_ToDate: Number(req.body.Dist_Rec_ToDate || 0),
      Dist_Cap_OnDate: Number(req.body.Dist_Cap_OnDate || 0),
      Dist_Cap_ToDate: Number(req.body.Dist_Cap_ToDate || 0),
      Dist_FinancialYear: String(req.body.Dist_FinancialYear || season || ''),
      Dist_Prod: String(req.body.Dist_Prod || ''),
      Dist_Stoppage: String(req.body.Dist_Stoppage || ''),
      Dist_Remark: String(req.body.Dist_Remark || ''),
      Dist_UserID: String(req.user?.userId || req.body.Dist_UserID || '')
    };

    const mappedPayload = {};
    const add = (column, value) => {
      if (column) mappedPayload[column] = value;
    };
    add(c.unit, payload.Dist_Unit);
    add(c.date, payload.Dist_Date);
    add(c.rsStatus, payload.Dist_RSStatus);
    add(c.rsDate, payload.Dist_RSDate);
    add(c.rsProdOnDate, payload.Dist_RSProd_OnDate);
    add(c.rsProdToDate, payload.Dist_RSProd_ToDate);
    add(c.rsProdType, payload.Dist_RSProd_ProdType);
    add(c.aaProdOnDate, payload.Dist_AAProd_OnDate);
    add(c.aaProdToDate, payload.Dist_AAProd_ToDate);
    add(c.aaProdType, payload.Dist_AAProd_ProdType);
    add(c.recOnDate, payload.Dist_Rec_OnDate);
    add(c.recToDate, payload.Dist_Rec_ToDate);
    add(c.capOnDate, payload.Dist_Cap_OnDate);
    add(c.capToDate, payload.Dist_Cap_ToDate);
    add(c.financialYear, payload.Dist_FinancialYear);
    add(c.prod, payload.Dist_Prod);
    add(c.stoppage, payload.Dist_Stoppage);
    add(c.remark, payload.Dist_Remark);
    add(c.userId, payload.Dist_UserID);

    if (command === 'btupdate' || command === 'update') {
      if (!id) {
        return res.status(400).json({ success: false, message: 'id is required for update' });
      }
      if (!c.id) {
        return res.status(500).json({ success: false, message: `${tableName} does not have ID column for update` });
      }
      const updateCols = Object.keys(mappedPayload);
      if (!updateCols.length) {
        return res.status(500).json({ success: false, message: `No writable distillery columns found in ${tableName}` });
      }
      const setClause = updateCols.map((col) => `${quoteSqlIdentifier(col)}=@${col}`).join(', ');
      const idCol = quoteSqlIdentifier(c.id);
      await executeQuery(
        `UPDATE ${tableSql}
         SET ${setClause}
         WHERE ${idCol}=@id`,
        { ...mappedPayload, id },
        season
      );
      return res.status(200).json({ success: true, message: 'Updated successfully' });
    }

    const insertCols = Object.keys(mappedPayload);
    if (!insertCols.length) {
      return res.status(500).json({ success: false, message: `No writable distillery columns found in ${tableName}` });
    }
    const insertVals = insertCols.map((col) => `@${col}`);
    const insertColsSql = insertCols.map((col) => quoteSqlIdentifier(col)).join(', ');
    await executeQuery(
      `INSERT INTO ${tableSql}
        (${insertColsSql})
       VALUES
        (${insertVals.join(', ')})`,
      mappedPayload,
      season
    );
    return res.status(200).json({ success: true, message: 'Saved successfully' });
  } catch (error) {
    logControllerError('distilleryReportEntry_2', req, error, {
      id: req.body.id || null
    });
    return next(error);
  }
};

exports.DistilleryReportEntryDelete = async (req, res, next) => {
  try {
    const season = req.user?.season;
    const id = String(req.query.id || req.body.id || '').trim();
    if (!id) {
      return res.status(400).json({ success: false, message: 'id is required' });
    }
    const tableName = ensureWhitelistedTable(await resolveDistilleryTable(season), DISTILLERY_TABLES, 'distillery');
    const tableSql = quoteSqlObjectName(tableName);
    await executeQuery(`DELETE FROM ${tableSql} WHERE ID=@id`, { id }, season);
    return res.status(200).json({ success: true });
  } catch (error) {
    logControllerError('DistilleryReportEntryDelete', req, error, { id: req.query.id || req.body.id || null });
    return next(error);
  }
};


exports.AddSeasonByID = async (req, res, next) => {
  req.query.sid = req.query.sid || req.query.ID || req.query.id || req.body?.ID || req.body?.id || '';
  return exports.AddSeason(req, res, next);
};

exports.AddStopageID = async (req, res, next) => {
  req.query.sid = req.query.sid || req.query.Rid || req.query.rid || req.body?.Rid || req.body?.rid || '';
  return exports.AddStopage(req, res, next);
};

exports.SugarWhatsAppReportID = async (req, res, next) => {
  req.query.sid = req.query.sid || req.query.Rid || req.query.rid || req.body?.Rid || req.body?.rid || '';
  return exports.SugarWhatsAppReport(req, res, next);
};

exports.SugarWhatsAppReportDelete = async (req, res, next) => {
  try {
    const season = req.user?.season;
    const tableName = ensureWhitelistedTable(await resolveCaneCrushTable(season), CANE_CRUSH_TABLES, 'cane crush');
    const tableSql = quoteSqlObjectName(tableName);
    const id = String(req.query.id || req.body.id || '').trim();
    if (!id) {
      return res.status(400).json({ success: false, message: 'id is required' });
    }
    await executeQuery(`DELETE FROM ${tableSql} WHERE ID=@id`, { id }, season);
    return res.status(200).json({ success: true });
  } catch (error) {
    logControllerError('SugarWhatsAppReportDelete', req, error, { id: req.query.id || req.body.id || null });
    return next(error);
  }
};

exports.distilleryReportEntryID = async (req, res, next) => {
  req.query.sid = req.query.sid || req.query.Rid || req.query.rid || req.body?.Rid || req.body?.rid || '';
  return exports.distilleryReportEntry(req, res, next);
};

exports.SugarWhatsAppReportNew = async (req, res) => {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return res.status(200).json({
    success: true,
    CapOnDate: `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`
  });
};

exports.SugarWhatsAppReportNewData = async (req, res, next) => {
  try {
    req.query.F_code = req.query.F_code || req.body?.F_code || req.query.factoryCode || '';
    req.query.Cn_Date = req.query.Cn_Date || req.query.C_date || req.body?.Cn_Date || req.body?.C_date || '';

    const payload = await new Promise((resolve, reject) => {
      const resMock = {
        status(code) {
          this.statusCode = code;
          return this;
        },
        json(body) {
          if ((this.statusCode || 200) >= 400) {
            reject(new Error(body?.message || 'Failed to generate report'));
          } else {
            resolve(body);
          }
          return this;
        }
      };
      exports.SWRD(req, resMock, reject);
    });

    return res.status(200).json({
      success: true,
      data: Array.isArray(payload?.rows) ? payload.rows : [],
      summary: payload
    });
  } catch (error) {
    logControllerError('SugarWhatsAppReportNewData', req, error, {
      F_code: req.query.F_code || null,
      C_date: req.query.C_date || req.query.Cn_Date || null
    });
    return next(error);
  }
};

exports.SugarWhatsAppReportsData = async (req, res, next) => {
  req.query.Cn_Date = req.query.Cn_Date || req.query.C_date || req.body?.Cn_Date || req.body?.C_date || '';
  req.query.F_code = req.query.F_code || req.body?.F_code || req.query.factoryCode || '';
  return exports.SWRD(req, res, next);
};

exports.DailyRainfallview = async (req, res, next) => {
  return exports.DailyRainfallData(req, res, next);
};

exports.DailyRainfallData = async (req, res, next) => {
  try {
    const season = req.user?.season;
    const tableName = ensureWhitelistedTable(await resolveRainfallTable(season), RAINFALL_TABLES, 'rainfall');
    const tableSql = quoteSqlObjectName(tableName);
    const dateIso = parseFlexibleDateToIso(req.query.date || req.query.RD_EDate || req.body?.date || req.body?.RD_EDate || '');
    const factoryRaw = String(req.query.f_code || req.query.factoryCode || req.body?.f_code || req.body?.factoryCode || '').trim();
    const factoryCode = (!factoryRaw || factoryRaw === '0' || factoryRaw.toLowerCase() === 'all') ? null : Number(factoryRaw);

    if (factoryRaw && factoryRaw !== '0' && factoryRaw.toLowerCase() !== 'all' && (!Number.isFinite(factoryCode) || factoryCode <= 0)) {
      return res.status(400).json({ success: false, message: 'f_code/factoryCode must be a positive number' });
    }

    const rows = await executeQuery(
      `SELECT r.RD_ID,
              r.RD_Unit,
              r.RD_Day,
              CONVERT(varchar(10), r.RD_EDate, 103) AS RD_EDate,
              ISNULL(r.RD_PreYear_Ondate, 0) AS RD_PreYear_Ondate,
              ISNULL(r.RD_PreYear_Todate, 0) AS RD_PreYear_Todate,
              ISNULL(r.RD_CurYear_Ondate, 0) AS RD_CurYear_Ondate,
              ISNULL(r.RD_CurYear_Todate, 0) AS RD_CurYear_Todate,
              ISNULL(r.RD_Remark, '') AS RD_Remark,
              COALESCE(mf.F_Name, ff.F_Name, CAST(r.RD_Unit AS varchar(20))) AS F_Name
       FROM ${tableSql} r
       LEFT JOIN MI_Factory mf ON mf.F_Code = r.RD_Unit
       LEFT JOIN Factory ff ON ff.F_Code = r.RD_Unit
       WHERE (@factoryCode IS NULL OR r.RD_Unit = @factoryCode)
         AND (@dateIso IS NULL OR CAST(r.RD_EDate AS date) = @dateIso)
       ORDER BY r.RD_EDate DESC, r.RD_ID DESC`,
      { factoryCode, dateIso },
      season
    );

    return res.status(200).json({ success: true, data: rows });
  } catch (error) {
    logControllerError('DailyRainfallData', req, error, {
      date: req.query.date || req.query.RD_EDate || null,
      f_code: req.query.f_code || req.query.factoryCode || null
    });
    return next(error);
  }
};

exports.DailyRainfall = async (req, res, next) => {
  try {
    const season = req.user?.season;
    const tableName = ensureWhitelistedTable(await resolveRainfallTable(season), RAINFALL_TABLES, 'rainfall');
    const tableSql = quoteSqlObjectName(tableName);
    const RD_ID = String(req.query.RD_ID || req.query.id || '').trim();

    if (!RD_ID) {
      const today = new Date();
      return res.status(200).json({
        success: true,
        data: {
          RD_ID: 0,
          RD_Unit: '',
          RD_Day: today.getDate(),
          RD_EDate: toDDMMYYYY(today),
          RD_PreYear_Ondate: 0,
          RD_PreYear_Todate: 0,
          RD_CurYear_Ondate: 0,
          RD_CurYear_Todate: 0,
          RD_Remark: ''
        }
      });
    }

    const rows = await executeQuery(
      `SELECT TOP 1
              RD_ID, RD_Unit, RD_Day,
              CONVERT(varchar(10), RD_EDate, 103) AS RD_EDate,
              ISNULL(RD_PreYear_Ondate, 0) AS RD_PreYear_Ondate,
              ISNULL(RD_PreYear_Todate, 0) AS RD_PreYear_Todate,
              ISNULL(RD_CurYear_Ondate, 0) AS RD_CurYear_Ondate,
              ISNULL(RD_CurYear_Todate, 0) AS RD_CurYear_Todate,
              ISNULL(RD_Remark, '') AS RD_Remark
       FROM ${tableSql}
       WHERE RD_ID=@RD_ID`,
      { RD_ID },
      season
    );

    return res.status(200).json({ success: true, data: rows[0] || null });
  } catch (error) {
    logControllerError('DailyRainfall', req, error, { RD_ID: req.query.RD_ID || req.query.id || null });
    return next(error);
  }
};

exports.DailyRainfall_2 = async (req, res, next) => {
  try {
    const season = req.user?.season;
    const tableName = ensureWhitelistedTable(await resolveRainfallTable(season), RAINFALL_TABLES, 'rainfall');
    const tableSql = quoteSqlObjectName(tableName);
    const command = String(req.body.Command || req.body.command || '').trim().toLowerCase();
    const id = String(req.body.id || req.body.RD_ID || '').trim();
    const RD_Unit = Number(req.body.rD_Unit ?? req.body.RD_Unit ?? 0);
    const RD_EDate = parseFlexibleDateToIso(req.body.rD_EDate || req.body.RD_EDate || '');
    const RD_Day = Number(req.body.rD_Day ?? req.body.RD_Day ?? (RD_EDate ? new Date(`${RD_EDate}T00:00:00`).getDate() : 0));
    const RD_PreYear_Ondate = Number(req.body.rD_PreYear_Ondate ?? req.body.RD_PreYear_Ondate ?? 0);
    const RD_PreYear_Todate = Number(req.body.rD_PreYear_Todate ?? req.body.RD_PreYear_Todate ?? 0);
    const RD_CurYear_Ondate = Number(req.body.rD_CurYear_Ondate ?? req.body.RD_CurYear_Ondate ?? 0);
    const RD_CurYear_Todate = Number(req.body.rD_CurYear_Todate ?? req.body.RD_CurYear_Todate ?? 0);
    const RD_Remark = String(req.body.rD_Remark ?? req.body.RD_Remark ?? '');
    const RD_Userid = String(req.user?.userId || req.body.RD_Userid || '');

    if (command === 'delete' || command === 'btndelete') {
      if (!id) return res.status(400).json({ success: false, message: 'RD_ID is required for delete' });
      await executeQuery(`DELETE FROM ${tableSql} WHERE RD_ID=@id`, { id }, season);
      return res.status(200).json({ success: true });
    }

    if (!RD_Unit || !RD_EDate) {
      return res.status(400).json({ success: false, message: 'RD_Unit and RD_EDate are required' });
    }

    const payload = {
      RD_Unit,
      RD_Day,
      RD_EDate,
      RD_PreYear_Ondate,
      RD_PreYear_Todate,
      RD_CurYear_Ondate,
      RD_CurYear_Todate,
      RD_Remark,
      RD_Userid
    };

    if (id) {
      await executeQuery(
        `UPDATE ${tableSql}
         SET RD_Unit=@RD_Unit,
             RD_Day=@RD_Day,
             RD_EDate=@RD_EDate,
             RD_PreYear_Ondate=@RD_PreYear_Ondate,
             RD_PreYear_Todate=@RD_PreYear_Todate,
             RD_CurYear_Ondate=@RD_CurYear_Ondate,
             RD_CurYear_Todate=@RD_CurYear_Todate,
             RD_Remark=@RD_Remark,
             RD_Userid=@RD_Userid
         WHERE RD_ID=@id`,
        { ...payload, id },
        season
      );
      return res.status(200).json({ success: true, message: 'Updated successfully' });
    }

    await executeQuery(
      `INSERT INTO ${tableSql}
        (RD_Unit, RD_Day, RD_EDate, RD_PreYear_Ondate, RD_PreYear_Todate, RD_CurYear_Ondate, RD_CurYear_Todate, RD_Remark, RD_Userid)
       VALUES
        (@RD_Unit, @RD_Day, @RD_EDate, @RD_PreYear_Ondate, @RD_PreYear_Todate, @RD_CurYear_Ondate, @RD_CurYear_Todate, @RD_Remark, @RD_Userid)`,
      payload,
      season
    );
    return res.status(200).json({ success: true, message: 'Saved successfully' });
  } catch (error) {
    logControllerError('DailyRainfall_2', req, error, { id: req.body.id || req.body.RD_ID || null });
    return next(error);
  }
};

exports.DailyRainfallId = async (req, res, next) => {
  req.query.RD_ID = req.query.RD_ID || req.query.id || req.body?.RD_ID || req.body?.id || '';
  return exports.DailyRainfall(req, res, next);
};

exports.DailyRainfallDelete = async (req, res, next) => {
  try {
    const season = req.user?.season;
    const tableName = ensureWhitelistedTable(await resolveRainfallTable(season), RAINFALL_TABLES, 'rainfall');
    const tableSql = quoteSqlObjectName(tableName);
    const RD_ID = String(req.query.RD_ID || req.query.id || req.body.RD_ID || req.body.id || '').trim();
    if (!RD_ID) {
      return res.status(400).json({ success: false, message: 'RD_ID is required' });
    }
    await executeQuery(`DELETE FROM ${tableSql} WHERE RD_ID=@RD_ID`, { RD_ID }, season);
    return res.status(200).json({ success: true });
  } catch (error) {
    logControllerError('DailyRainfallDelete', req, error, { RD_ID: req.query.RD_ID || req.query.id || null });
    return next(error);
  }
};

exports.MonthlyEntryReportView = async (req, res, next) => {
  try {
    const season = req.user?.season;
    const unitRaw = String(
      req.query.unit ||
      req.query.factoryCode ||
      req.query.Tpm_Unit ||
      req.query.tpm_unit ||
      req.body?.unit ||
      req.body?.factoryCode ||
      req.body?.Tpm_Unit ||
      req.body?.tpm_unit ||
      ''
    ).trim();
    const dateRaw = req.query.date || req.query.Tpm_DATE || req.query.tpm_date || req.body?.date || req.body?.Tpm_DATE || req.body?.tpm_date || '';
    const dateIso = parseFlexibleDateToIso(dateRaw);
    const unit = (!unitRaw || unitRaw === '0' || unitRaw.toLowerCase() === 'all') ? null : Number(unitRaw);

    if (unitRaw && unitRaw !== '0' && unitRaw.toLowerCase() !== 'all' && (!Number.isFinite(unit) || unit <= 0)) {
      return res.status(400).json({ success: false, message: 'unit/factoryCode/Tpm_Unit must be a positive number' });
    }

    const parameterTableName = ensureWhitelistedTable(await resolveMonthlyParameterTable(season), MONTHLY_PARAMETER_TABLES, 'monthly parameter');
    const parameterTableSql = quoteSqlObjectName(parameterTableName);
    let parameterRows = [];
    try {
      parameterRows = await executeQuery(
        `SELECT Id, Pm_Name
         FROM ${parameterTableSql}
         ORDER BY Id`,
        {},
        season
      );
    } catch (queryError) {
      parameterRows = monthlyParameterFallback();
    }

    const normalizedParameters = parameterRows.map((r, i) => ({
      id: Number(r.Id || i + 1),
      Id: Number(r.Id || i + 1),
      Pm_Name: String(r.Pm_Name || r.name || ''),
      name: String(r.Pm_Name || r.name || '')
    }));

    // Without search filters this API returns parameter master list.
    if (!unit && !dateIso) {
      return res.status(200).json({ success: true, data: normalizedParameters });
    }

    const entryTableNameRaw = await resolveMonthlyEntryTable(season);
    if (!entryTableNameRaw) {
      return res.status(200).json({ success: true, data: [] });
    }

    const entryTableName = ensureWhitelistedTable(entryTableNameRaw, MONTHLY_ENTRY_TABLES, 'monthly entry');
    const entryColumns = await getTableColumnList(season, entryTableName);
    const c = {
      id: pickExistingColumnFromList(entryColumns, ['ID', 'Id']),
      unit: pickExistingColumnFromList(entryColumns, ['Tpm_Unit', 'TPM_Unit', 'Unit']),
      date: pickExistingColumnFromList(entryColumns, ['Tpm_DATE', 'TPM_DATE', 'Date']),
      pmid: pickExistingColumnFromList(entryColumns, ['Tpm_PMID', 'TPM_PMID', 'Pm_ID', 'ParameterId']),
      cur: pickExistingColumnFromList(entryColumns, ['Tpm_CurToDate', 'TPM_CurToDate', 'CurrentValue']),
      pre: pickExistingColumnFromList(entryColumns, ['Tpm_PreToDate', 'TPM_PreToDate', 'PreviousValue'])
    };

    if (!c.unit || !c.date || !c.pmid || !c.cur || !c.pre) {
      return res.status(200).json({ success: true, data: [] });
    }

    const q = {
      id: c.id ? quoteSqlIdentifier(c.id) : null,
      unit: quoteSqlIdentifier(c.unit),
      date: quoteSqlIdentifier(c.date),
      pmid: quoteSqlIdentifier(c.pmid),
      cur: quoteSqlIdentifier(c.cur),
      pre: quoteSqlIdentifier(c.pre)
    };
    const entryTableSql = quoteSqlObjectName(entryTableName);

    const rows = await executeQuery(
      `SELECT
          ${q.id ? `e.${q.id}` : '0'} AS rowId,
          e.${q.unit} AS Tpm_Unit,
          COALESCE(mf.F_Name, ff.F_Name, CAST(e.${q.unit} AS varchar(20))) AS F_Name,
          CONVERT(varchar(10), e.${q.date}, 103) AS Tpm_DATE,
          e.${q.pmid} AS Id,
          ISNULL(pm.Pm_Name, '') AS Pm_Name,
          ISNULL(e.${q.cur}, 0) AS [current],
          ISNULL(e.${q.pre}, 0) AS [previous]
       FROM ${entryTableSql} e
       LEFT JOIN ${parameterTableSql} pm ON pm.Id = e.${q.pmid}
       LEFT JOIN MI_Factory mf ON mf.F_Code = e.${q.unit}
       LEFT JOIN Factory ff ON ff.F_Code = e.${q.unit}
       WHERE (@unit IS NULL OR e.${q.unit} = @unit)
         AND (@dateIso IS NULL OR CAST(e.${q.date} AS date) = @dateIso)
       ORDER BY CAST(e.${q.date} AS date) DESC, e.${q.pmid} ASC`,
      { unit, dateIso: dateIso || null },
      season
    );

    const nameById = new Map(normalizedParameters.map((p) => [Number(p.Id || p.id || 0), p.Pm_Name || p.name || '']));
    const data = rows.map((r, i) => ({
      rowId: Number(r.rowId || 0),
      id: Number(r.Id || i + 1),
      Id: Number(r.Id || i + 1),
      Pm_Name: String(r.Pm_Name || nameById.get(Number(r.Id || 0)) || ''),
      name: String(r.Pm_Name || nameById.get(Number(r.Id || 0)) || ''),
      current: Number(r.current || 0),
      previous: Number(r.previous || 0),
      Tpm_Unit: Number(r.Tpm_Unit || 0),
      F_Name: String(r.F_Name || ''),
      Tpm_DATE: String(r.Tpm_DATE || '')
    }));

    return res.status(200).json({ success: true, data });
  } catch (error) {
    logControllerError('MonthlyEntryReportView', req, error);
    return next(error);
  }
};

exports.MonthlyEntryReport = async (req, res, next) => {
  try {
    const id = String(req.query.id || req.query.Sid || '').trim();
    if (!id) {
      return exports.MonthlyEntryReportView(req, res, next);
    }

    const season = req.user?.season;
    const tableName = ensureWhitelistedTable(await resolveMonthlyParameterTable(season), MONTHLY_PARAMETER_TABLES, 'monthly parameter');
    const tableSql = quoteSqlObjectName(tableName);
    const rows = await executeQuery(
      `SELECT TOP 1 Id, Pm_Name
       FROM ${tableSql}
       WHERE Id=@id`,
      { id },
      season
    );

    const row = rows[0]
      ? { id: Number(rows[0].Id), Id: Number(rows[0].Id), Pm_Name: String(rows[0].Pm_Name || ''), name: String(rows[0].Pm_Name || '') }
      : null;
    return res.status(200).json({ success: true, data: row });
  } catch (error) {
    logControllerError('MonthlyEntryReport', req, error, { id: req.query.id || req.query.Sid || null });
    return next(error);
  }
};

exports.MonthlyEntryReport_2 = async (req, res, next) => {
  try {
    const season = req.user?.season;
    const command = String(req.body.Command || req.body.command || '').trim().toLowerCase();
    const id = String(req.body.id || '').trim();
    const tableNameRaw = await resolveMonthlyEntryTable(season);
    if (!tableNameRaw) {
      return res.status(200).json({
        success: true,
        message: 'Monthly entry persistence is not configured in this database. Request acknowledged.'
      });
    }

    const tableName = ensureWhitelistedTable(tableNameRaw, MONTHLY_ENTRY_TABLES, 'monthly entry');
    const tableSql = quoteSqlObjectName(tableName);
    const columns = await getTableColumnList(season, tableName);
    const c = {
      id: pickExistingColumnFromList(columns, ['ID', 'Id']),
      unit: pickExistingColumnFromList(columns, ['Tpm_Unit', 'TPM_Unit', 'Unit']),
      date: pickExistingColumnFromList(columns, ['Tpm_DATE', 'TPM_DATE', 'Date']),
      pmid: pickExistingColumnFromList(columns, ['Tpm_PMID', 'TPM_PMID', 'Pm_ID', 'ParameterId']),
      cur: pickExistingColumnFromList(columns, ['Tpm_CurToDate', 'TPM_CurToDate', 'CurrentValue']),
      pre: pickExistingColumnFromList(columns, ['Tpm_PreToDate', 'TPM_PreToDate', 'PreviousValue']),
      user: pickExistingColumnFromList(columns, ['Tpm_UserID', 'TPM_UserID', 'UserID', 'Userid'])
    };

    if (command === 'delete' || command === 'btndelete') {
      if (!id || !c.id) {
        return res.status(400).json({ success: false, message: 'id is required for delete' });
      }
      const idCol = quoteSqlIdentifier(c.id);
      await executeQuery(`DELETE FROM ${tableSql} WHERE ${idCol}=@id`, { id }, season);
      return res.status(200).json({ success: true });
    }

    const unit = Number(req.body.unit || req.body.Tpm_Unit || 0);
    const dateIso = parseFlexibleDateToIso(req.body.date || req.body.Tpm_DATE || '');
    const entriesRaw = req.body.entries;
    const entries = Array.isArray(entriesRaw)
      ? entriesRaw
      : (typeof entriesRaw === 'string' && entriesRaw.trim() ? JSON.parse(entriesRaw) : []);

    if (!unit || !dateIso || !entries.length) {
      return res.status(200).json({ success: true, message: 'No monthly entries to save' });
    }
    if (!c.unit || !c.date || !c.pmid || !c.cur || !c.pre) {
      return res.status(500).json({ success: false, message: `${tableName} is missing monthly entry columns` });
    }

    const qUnit = quoteSqlIdentifier(c.unit);
    const qDate = quoteSqlIdentifier(c.date);
    const qPmid = quoteSqlIdentifier(c.pmid);
    const qCur = quoteSqlIdentifier(c.cur);
    const qPre = quoteSqlIdentifier(c.pre);
    const qUser = c.user ? quoteSqlIdentifier(c.user) : null;

    await executeQuery(
      `DELETE FROM ${tableSql}
       WHERE ${qUnit}=@unit
         AND CAST(${qDate} AS date)=@dateIso`,
      { unit, dateIso },
      season
    );

    for (const item of entries) {
      const pmid = Number(item.id || item.Id || item.Tpm_PMID || 0);
      if (!pmid) continue;
      const current = Number(item.current ?? item.Tpm_CurToDate ?? 0);
      const previous = Number(item.previous ?? item.Tpm_PreToDate ?? 0);
      const params = {
        unit,
        dateIso,
        pmid,
        current,
        previous,
        userId: String(req.user?.userId || '')
      };

      const cols = [qUnit, qDate, qPmid, qCur, qPre];
      const vals = ['@unit', '@dateIso', '@pmid', '@current', '@previous'];
      if (qUser) {
        cols.push(qUser);
        vals.push('@userId');
      }

      await executeQuery(
        `INSERT INTO ${tableSql} (${cols.join(', ')})
         VALUES (${vals.join(', ')})`,
        params,
        season
      );
    }

    return res.status(200).json({ success: true, message: 'Saved successfully' });
  } catch (error) {
    logControllerError('MonthlyEntryReport_2', req, error, { id: req.body.id || null });
    return next(error);
  }
};

exports.TargetEntry = async (req, res) => {
  return res.status(200).json({
    success: true,
    message: 'Use /tracking/target-entry and /tracking/target-entry-2 for target workflows.'
  });
};
