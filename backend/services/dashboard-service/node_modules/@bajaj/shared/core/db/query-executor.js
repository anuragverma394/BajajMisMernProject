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
  const result = await query(sqlText, params, withSeason(season), options);
  return result.rows;
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
  return scalar(sqlText, params, withSeason(season), options);
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
  return execProcedure(name, params, withSeason(season), options);
}

module.exports = {
  withSeason,
  executeQuery,
  executeScalar,
  executeProcedure,
  executeInTransaction
};
