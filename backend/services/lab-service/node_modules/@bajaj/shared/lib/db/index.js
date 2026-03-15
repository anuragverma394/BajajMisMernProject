/**
 * Shared Database Utilities
 */

const { createQueryExecutor } = require('./query-executor');
const mssqlConnection = require('./mssql');

module.exports = {
  // Query executor factory
  createQueryExecutor,
  
  // MSSQL connection management
  mssqlConnection,
  getConnectionPool: mssqlConnection.getConnectionPool,
  query: mssqlConnection.query,
  scalar: mssqlConnection.scalar,
  procedure: mssqlConnection.procedure,
  closeAllPools: mssqlConnection.closeAllPools,
  closePool: mssqlConnection.closePool,
  getPoolStats: mssqlConnection.getPoolStats
};
