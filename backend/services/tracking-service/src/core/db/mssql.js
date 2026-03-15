const { sql, getPool } = require('../../config/sqlserver');

function withSeason(value) {
  return String(value || process.env.DEFAULT_SEASON || '2526');
}

function bindInput(request, params = {}) {
  Object.entries(params).forEach(([name, value]) => {
    request.input(name, value === undefined ? null : value);
  });
}

async function query(sqlText, params = {}, season, options = {}) {
  const activeSeason = withSeason(season);
  const request = options.transaction && options.transaction._isRequestTransaction
    ? options.transaction._request
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
  const activeSeason = withSeason(season);
  const request = options.transaction && options.transaction._isRequestTransaction
    ? options.transaction._request
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
  const activeSeason = withSeason(season);
  const pool = await getPool(activeSeason);
  const request = pool.request();

  try {
    await request.query('BEGIN TRANSACTION;');
    const transactionWrapper = {
      _isRequestTransaction: true,
      _request: request
    };
    const data = await operation(transactionWrapper);
    await request.query('COMMIT TRANSACTION;');
    return data;
  } catch (error) {
    try {
      await request.query('ROLLBACK TRANSACTION;');
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
