/**
 * Shared Database Query Executor
 * Provides: query, scalar, executeProcedure, transactions
 * Handles: Parameter binding, season management, error handling
 */

const { sql, getPool } = require('./database');
const CONFIG = require('../../config/constants');

/**
 * Normalize and validate season value
 * @param {string|number} value - Season value
 * @returns {string} Normalized season
 */
function withSeason(value) {
  return String(value || CONFIG.DATABASE.DEFAULT_SEASON);
}

/**
 * Bind parameters to SQL request
 * Safely converts undefined to null
 * @param {Object} request - MSSQL Request object
 * @param {Object} params - Parameter object
 */
function bindInput(request, params = {}) {
  Object.entries(params).forEach(([name, value]) => {
    // Convert undefined to null for SQL
    const sqlValue = value === undefined ? null : value;
    request.input(name, sqlValue);
  });
}

/**
 * Execute SQL query for specific season
 * @param {string} sqlText - SQL query text
 * @param {Object} params - Named parameters
 * @param {string} season - Season code
 * @param {Object} options - Optional: transaction, timeoutMs
 * @returns {Promise<Object>} With keys: rows, rowsAffected
 */
async function query(sqlText, params = {}, season, options = {}) {
  const activeSeason = withSeason(season);
  
  // Use transaction request or create new one
  const request = options.transaction
    ? new sql.Request(options.transaction)
    : (await getPool(activeSeason)).request();

  // Set custom timeout if provided
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

/**
 * Execute query and return first column of first row
 * Useful for COUNT, SUM, or single value queries
 * @param {string} sqlText - SQL query text
 * @param {Object} params - Named parameters
 * @param {string} season - Season code
 * @param {Object} options - Optional parameters
 * @returns {Promise<*>} Scalar value or null
 */
async function scalar(sqlText, params = {}, season, options = {}) {
  const result = await query(sqlText, params, season, options);
  
  if (!result.rows || !result.rows.length) {
    return null;
  }
  
  const firstRow = result.rows[0];
  const columnName = Object.keys(firstRow)[0];
  
  return columnName ? firstRow[columnName] : null;
}

/**
 * Execute stored procedure
 * @param {string} name - Procedure name
 * @param {Object} params - Named parameters
 * @param {string} season - Season code
 * @param {Object} options - Optional parameters
 * @returns {Promise<Object>} With keys: rows, recordsets, rowsAffected
 */
async function executeProcedure(name, params = {}, season, options = {}) {
  const activeSeason = withSeason(season);
  
  // Use transaction request or create new one
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

/**
 * Execute operation within database transaction
 * Automatically commits on success, rolls back on error
 * @param {string} season - Season code
 * @param {Function} operation - Async function receiving transaction
 * @returns {Promise<*>} Operation result
 */
async function executeInTransaction(season, operation) {
  const activeSeason = withSeason(season);
  const pool = await getPool(activeSeason);
  const transaction = new sql.Transaction(pool);
  
  await transaction.begin();

  try {
    const result = await operation(transaction);
    await transaction.commit();
    return result;
  } catch (error) {
    try {
      await transaction.rollback();
      console.error(`[DB][TRANSACTION] Rolled back for season ${activeSeason}`, error.message);
    } catch (rollbackError) {
      console.error(`[DB][TRANSACTION] Rollback failed for season ${activeSeason}`, rollbackError.message);
    }
    throw error;
  }
}

module.exports = {
  withSeason,
  bindInput,
  query,
  scalar,
  executeProcedure,
  executeInTransaction
};
