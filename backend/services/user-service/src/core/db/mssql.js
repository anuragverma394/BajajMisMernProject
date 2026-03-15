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

  let request;
  if (options.transaction) {
    // Check if it's our pool-based transaction wrapper
    if (options.transaction._isPoolTransaction) {
      // Create a fresh request from the pool for each query
      // This prevents parameter binding conflicts between consecutive queries
      request = options.transaction._pool.request();
    } else {
      // Legacy: assume it's a transaction object from sql.Transaction
      request = new sql.Request(options.transaction);
    }
  } else {
    request = (await getPool(activeSeason)).request();
  }

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

  let request;
  if (options.transaction) {
    // Check if it's our pool-based transaction wrapper
    if (options.transaction._isPoolTransaction) {
      // Create a fresh request from the pool for each procedure call
      request = options.transaction._pool.request();
    } else {
      // Legacy: assume it's a transaction object from sql.Transaction
      request = new sql.Request(options.transaction);
    }
  } else {
    request = (await getPool(activeSeason)).request();
  }

  bindInput(request, params);
  const result = await request.execute(name);
  return {
    rows: result.recordset || [],
    recordsets: result.recordsets || [],
    rowsAffected: result.rowsAffected || []
  };
}

async function executeInTransaction(season, operation) {
  // Like .NET: execute operations sequentially with pool-based transaction
  // Each query gets a fresh request from the pool to avoid parameter binding conflicts
  const activeSeason = withSeason(season);
  const pool = await getPool(activeSeason);

  try {
    // Create wrapper that provides pool for fresh request creation per query
    const transactionWrapper = {
      _isPoolTransaction: true,
      _pool: pool
    };

    const data = await operation(transactionWrapper);
    return data;
  } catch (error) {
    console.error('[DB][OPERATION_FAILED]', error.message);
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
