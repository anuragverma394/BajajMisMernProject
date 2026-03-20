/**
 * Database Query Executor Wrapper
 * Simplified interface: executeQuery, executeScalar, executeProcedure
 */

const {
  withSeason,
  query,
  scalar,
  executeProcedure: execProcedure,
  executeInTransaction
} = require('./mssql');

/**
 * Execute SQL query and return rows
 * @param {string} sqlText - SQL query
 * @param {Object} params - Query parameters
 * @param {string} season - Season code
 * @param {Object} options - Query options (timeoutMs, transaction)
 * @returns {Promise<Array>} Array of result rows
 */
async function executeQuery(sqlText, params = {}, season, options = {}) {
  try {
    const result = await query(sqlText, params, withSeason(season), options);
    return result?.rows || [];
  } catch (error) {
    console.error('[DB][executeQuery] failed', {
      message: error?.message,
      stack: error?.stack
    });
    return [];
  }
}

/**
 * Execute SQL query and return single value
 * @param {string} sqlText - SQL query
 * @param {Object} params - Query parameters
 * @param {string} season - Season code
 * @param {Object} options - Query options
 * @returns {Promise<*>} Single scalar value
 */
async function executeScalar(sqlText, params = {}, season, options = {}) {
  try {
    const value = await scalar(sqlText, params, withSeason(season), options);
    return value ?? 0;
  } catch (error) {
    console.error('[DB][executeScalar] failed', {
      message: error?.message,
      stack: error?.stack
    });
    return 0;
  }
}

/**
 * Execute stored procedure
 * @param {string} name - Procedure name
 * @param {Object} params - Procedure parameters
 * @param {string} season - Season code
 * @param {Object} options - Query options
 * @returns {Promise<Object>} Procedure result with rows, recordsets, rowsAffected
 */
async function executeProcedure(name, params = {}, season, options = {}) {
  try {
    const result = await execProcedure(name, params, withSeason(season), options);
    return {
      ...(result || {}),
      rows: result?.rows || [],
      recordsets: result?.recordsets || [],
      rowsAffected: result?.rowsAffected || []
    };
  } catch (error) {
    console.error('[DB][executeProcedure] failed', {
      name,
      message: error?.message,
      stack: error?.stack
    });
    return { rows: [], recordsets: [], rowsAffected: [] };
  }
}

async function safeProcedure(name, params = {}, season, options = {}) {
  return executeProcedure(name, params, season, options);
}

async function safeQuery(sqlText, params = {}, season, options = {}) {
  return executeQuery(sqlText, params, season, options);
}

async function safeScalar(sqlText, params = {}, season, options = {}) {
  return executeScalar(sqlText, params, season, options);
}

module.exports = {
  withSeason,
  executeQuery,
  executeScalar,
  executeProcedure,
  safeProcedure,
  safeQuery,
  safeScalar,
  executeInTransaction
};
