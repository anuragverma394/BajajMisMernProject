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
    // Check if it's our request-based transaction wrapper
    if (options.transaction._isRequestTransaction) {
      request = options.transaction._request;
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
    // Check if it's our request-based transaction wrapper
    if (options.transaction._isRequestTransaction) {
      request = options.transaction._request;
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
  const activeSeason = withSeason(season);
  const pool = await getPool(activeSeason);

  // For mssql 11.x, use request-based transactions which are more reliable
  // than creating transactions directly from a ConnectionPool
  const request = pool.request();

  try {
    // Initialize transaction with manual BEGIN
    await request.query('BEGIN TRANSACTION;');

    // Create a wrapper object that mimics transaction interface
    // but uses the request for actual operations
    const transactionWrapper = {
      _isRequestTransaction: true,
      _request: request
    };

    const data = await operation(transactionWrapper);

    // Commit the transaction
    await request.query('COMMIT TRANSACTION;');
    return data;
  } catch (error) {
    try {
      // Rollback on any error
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
