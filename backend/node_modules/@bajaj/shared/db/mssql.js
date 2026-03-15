const { sql, getPool } = require('./sqlserver');

const shouldSkipDb = () => String(process.env.SKIP_DB_CONNECT || 'false').toLowerCase() === 'true';

function withSeason(value) {
  return String(value || process.env.DEFAULT_SEASON || '2526');
}

function bindInput(request, params = {}) {
  Object.entries(params).forEach(([name, value]) => {
    request.input(name, value === undefined ? null : value);
  });
}

async function query(sqlText, params = {}, season, options = {}) {
  if (shouldSkipDb()) {
    return { rows: [], rowsAffected: [] };
  }
  const activeSeason = withSeason(season);
  const request = options.transaction
    ? new sql.Request(options.transaction)
    : (await getPool(activeSeason)).request();

  if (options.timeoutMs && Number.isFinite(Number(options.timeoutMs))) {
    request.timeout = Number(options.timeoutMs);
  }

  bindInput(request, params);
  const result = await request.query(sqlText);
  return {
    rows: result.recordset || [],
    rowsAffected: result.rowsAffected || []
  };
}

async function scalar(sqlText, params = {}, season, options = {}) {
  const result = await query(sqlText, params, season, options);
  if (!result.rows.length) return null;
  const first = result.rows[0];
  const key = Object.keys(first)[0];
  return key ? first[key] : null;
}

async function procedure(name, params = {}, season, options = {}) {
  if (shouldSkipDb()) {
    return { rows: [], recordsets: [], rowsAffected: [] };
  }
  const activeSeason = withSeason(season);
  const request = options.transaction
    ? new sql.Request(options.transaction)
    : (await getPool(activeSeason)).request();

  bindInput(request, params);
  const result = await request.execute(name);
  return {
    rows: result.recordset || [],
    recordsets: result.recordsets || [],
    rowsAffected: result.rowsAffected || []
  };
}

async function executeInTransaction(season, operation) {
  if (shouldSkipDb()) {
    return { rows: [], rowsAffected: [] };
  }
  const activeSeason = withSeason(season);
  const pool = await getPool(activeSeason);
  const transaction = pool.transaction();
  await transaction.begin();

  try {
    const data = await operation(transaction);
    await transaction.commit();
    return data;
  } catch (error) {
    try {
      await transaction.rollback();
    } catch (rollbackError) {
      console.error('[DB][ROLLBACK_FAILED]', rollbackError.message);
    }
    throw error;
  }
}

module.exports = {
  sql,
  withSeason,
  query,
  scalar,
  procedure,
  executeInTransaction
};
