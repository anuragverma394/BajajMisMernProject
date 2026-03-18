const { executeQuery } = require('../core/db/query-executor');
const { buildParametrizedInClause, quoteSqlIdentifier, quoteSqlObjectName } = require('../utils/sql.util');
const { splitDateRange, daysBetweenInclusive, parseFlexibleDateToIso, addDaysIso } = require('../utils/date.util');
const { isTimeoutError } = require('../utils/request.util');

const surveySourceCache = new Map();

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

async function resolveSurveyAggregateSource(season) {
  if (surveySourceCache.has(season)) {
    return surveySourceCache.get(season);
  }

  const candidates = [
    { table: 'gashti_ly', factory: 'gh_factory', date: 'gh_ent_date', value: 'gh_area' },
    { table: 'gashti_lynew', factory: 'gh_factory', date: 'gh_ent_date', value: 'gh_area' },
    { table: 'gashti', factory: 'gh_factory', date: 'gh_ent_date', value: 'gh_area' }
  ];

  for (const item of candidates) {
    try {
      const cols = await getTableColumnList(season, item.table);
      const set = new Set(cols.map((c) => String(c || '').toLowerCase()));
      if (
        set.has(String(item.factory).toLowerCase())
        && set.has(String(item.date).toLowerCase())
        && set.has(String(item.value).toLowerCase())
      ) {
        surveySourceCache.set(season, item);
        return item;
      }
    } catch (error) {
      // try next candidate
    }
  }

  surveySourceCache.set(season, null);
  return null;
}

async function runHomeFactChunkQuery({ season, factoryFilter, fromDate, toDate, timeoutMs, userId, extraParams = {} }) {
  const chunkQuery = `WITH agg AS (
     SELECT p.M_FACTORY AS F_Code,
            CONVERT(date, p.M_DATE) AS M_DATE,
            SUM(ISNULL(p.M_GROSS, 0) - ISNULL(p.M_TARE, 0) - ISNULL(p.M_JOONA, 0)) AS M_FinalWt
     FROM Purchase p WITH (NOLOCK)
     WHERE p.M_DATE >= @fromDate
       AND p.M_DATE < DATEADD(day, 1, @toDate)
       AND p.M_FACTORY BETWEEN 50 AND 63
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

async function runHomeFactSurveyChunkQuery({ season, factoryFilter, fromDate, toDate, timeoutMs, userId, extraParams = {} }) {
  const source = await resolveSurveyAggregateSource(season);
  if (!source) {
    return runHomeFactChunkQuery({ season, factoryFilter, fromDate, toDate, timeoutMs, userId, extraParams });
  }

  const tableName = quoteSqlObjectName(source.table);
  const factoryCol = quoteSqlIdentifier(source.factory);
  const dateCol = quoteSqlIdentifier(source.date);
  const valueCol = quoteSqlIdentifier(source.value);

  const query = `WITH agg AS (
     SELECT s.${factoryCol} AS F_Code,
            CONVERT(date, s.${dateCol}) AS M_DATE,
            SUM(ISNULL(s.${valueCol}, 0)) AS M_FinalWt
     FROM ${tableName} s WITH (NOLOCK)
     WHERE s.${dateCol} >= @fromDate
       AND s.${dateCol} < DATEADD(day, 1, @toDate)
       ${factoryFilter}
     GROUP BY s.${factoryCol}, CONVERT(date, s.${dateCol})
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
    query,
    { fromDate, toDate, userId, ...extraParams },
    season,
    { timeoutMs }
  );
}

async function fetchHomeFactRowsAdaptive({ season, factoryFilter, fromDate, toDate, userId, extraParams = {}, mode = 'marketing' }) {
  const initialChunkDays = Math.max(1, Number(process.env.HOMEFACT_CHUNK_DAYS || 30));
  const minChunkDays = Math.max(1, Number(process.env.HOMEFACT_MIN_CHUNK_DAYS || 3));
  const timeoutMs = Math.max(30000, Number(process.env.HOMEFACT_QUERY_TIMEOUT_MS || 120000));

  const rows = [];
  const queue = splitDateRange(fromDate, toDate, initialChunkDays);

  while (queue.length) {
    const current = queue.shift();
    try {
      const chunkRows = mode === 'survey'
        ? await runHomeFactSurveyChunkQuery({
            season,
            factoryFilter,
            fromDate: current.from,
            toDate: current.to,
            timeoutMs,
            userId,
            extraParams
          })
        : await runHomeFactChunkQuery({
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

async function fetchHomeFactHourly({ season, codes, userId, dateIso, applyUserFactoryFilter = false }) {
  const params = { dateIso, userId };
  const factoryPredicate = codes
    ? buildParametrizedInClause('src.factory_code', codes, params, 'fh')
    : (applyUserFactoryFilter ? ' AND src.factory_code IN (SELECT FactID FROM MI_UserFact WITH (NOLOCK) WHERE UserID = @userId)' : '');

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
         AND p.M_FACTORY BETWEEN 50 AND 63
         AND p.M_CENTRE IN (100)
       GROUP BY p.m_factory, DATEPART(hour, p.M_TARE_DT)
       UNION ALL
       SELECT r.tt_factory AS factory_code,
              DATEPART(hour, r.TT_TARE_DT) AS hou,
              SUM(ISNULL(r.tt_grossweight, 0) - ISNULL(r.tt_tareweight, 0) - ISNULL(r.tt_joonaweight, 0)) AS FinWt
       FROM Receipt r WITH (NOLOCK)
       WHERE CAST(r.TT_DATE AS date) = @dateIso
         AND r.tt_factory BETWEEN 50 AND 63
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

async function hasUserFactoryAccess(season, userId) {
  const uid = String(userId || '').trim();
  if (!uid) return false;
  try {
    const rows = await executeQuery(
      `SELECT TOP 1 1 AS hasRow
       FROM MI_UserFact WITH (NOLOCK)
       WHERE UserID = @userId`,
      { userId: uid },
      season
    );
    return rows.length > 0;
  } catch (error) {
    return false;
  }
}

async function resolveLatestDashboardRange(season, spanDays = 15) {
  const candidates = [
    { sql: `SELECT CONVERT(date, MAX([M_DATE])) AS maxDate FROM [Purchase] WITH (NOLOCK)` },
    { sql: `SELECT CONVERT(date, MAX([TT_TARE_DT])) AS maxDate FROM [Receipt] WITH (NOLOCK)` },
    { sql: `SELECT CONVERT(date, MAX([Ch_dep_date])) AS maxDate FROM [challan_final] WITH (NOLOCK)` }
  ];

  for (const c of candidates) {
    try {
      const rows = await executeQuery(
        c.sql,
        {},
        season
      );
      const maxDateRaw = rows?.[0]?.maxDate;
      const maxIso = parseFlexibleDateToIso(maxDateRaw ? String(maxDateRaw) : '');
      if (!maxIso) continue;
      return {
        from: addDaysIso(maxIso, -Math.max(0, Number(spanDays || 15))),
        to: maxIso
      };
    } catch (error) {
      // try next source table
    }
  }
  return null;
}

module.exports = {
  resolveSurveyAggregateSource,
  fetchHomeFactRowsAdaptive,
  fetchHomeFactHourly,
  hasUserFactoryAccess,
  resolveLatestDashboardRange,
  buildParametrizedInClause
};
