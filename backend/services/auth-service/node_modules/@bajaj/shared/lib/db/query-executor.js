/**
 * Unified Query Executor for Database Operations
 */

const { getLogger } = require('../utils/logger');

const logger = getLogger('query-executor');

/**
 * Factory function to create query executor
 * Services should require and use this
 */
function createQueryExecutor(mssqlConnection) {
  /**
   * Execute raw SQL query
   */
  async function executeQuery(sqlText, params = {}, options = {}) {
    try {
      logger.debug('Executing query', { sqlLength: sqlText.length });

      const result = await mssqlConnection.query(sqlText, params, options);
      
      logger.debug('Query executed successfully', { 
        rowsAffected: result.rowsAffected ? result.rowsAffected[0] : 0 
      });

      return result.recordset || result.rows || [];

    } catch (err) {
      logger.error('Query execution failed', err, { sqlLength: sqlText.length });
      throw err;
    }
  }

  /**
   * Execute query returning single scalar value
   */
  async function executeScalar(sqlText, params = {}, options = {}) {
    try {
      logger.debug('Executing scalar query');

      const result = await mssqlConnection.scalar(sqlText, params, options);
      
      return result;

    } catch (err) {
      logger.error('Scalar query execution failed', err);
      throw err;
    }
  }

  /**
   * Execute stored procedure
   */
  async function executeProcedure(procedureName, params = {}, options = {}) {
    try {
      logger.debug('Executing procedure', { procedure: procedureName });

      const result = await mssqlConnection.procedure(procedureName, params, options);
      
      logger.debug('Procedure executed successfully', { procedure: procedureName });

      return result.recordset || result.rows || [];

    } catch (err) {
      logger.error('Procedure execution failed', err, { procedure: procedureName });
      throw err;
    }
  }

  /**
   * Execute query with pagination
   */
  async function executeQueryPaginated(sqlText, params = {}, page = 1, pageSize = 10) {
    try {
      // Get total count
      const countQuery = `SELECT COALESCE(COUNT(*), 0) as total FROM (${sqlText}) as countQuery`;
      const countResult = await executeQuery(countQuery, params);
      const total = countResult[0]?.total || 0;

      // Get paginated results
      const offset = (page - 1) * pageSize;
      const paginatedSql = `
        ${sqlText}
        ORDER BY (SELECT NULL)
        OFFSET ${offset} ROWS
        FETCH NEXT ${pageSize} ROWS ONLY
      `;

      const records = await executeQuery(paginatedSql, params);

      return {
        data: records,
        pagination: {
          total,
          page,
          pageSize,
          totalPages: Math.ceil(total / pageSize),
          hasMore: offset + pageSize < total
        }
      };

    } catch (err) {
      logger.error('Paginated query failed', err);
      throw err;
    }
  }

  /**
   * Execute transaction
   */
  async function executeTransaction(callback) {
    const transaction = mssqlConnection.transaction();

    try {
      await transaction.begin();
      logger.debug('Transaction started');

      const result = await callback(transaction);
      
      await transaction.commit();
      logger.debug('Transaction committed');

      return result;

    } catch (err) {
      await transaction.rollback();
      logger.error('Transaction rolled back', err);
      throw err;
    }
  }

  return {
    executeQuery,
    executeScalar,
    executeProcedure,
    executeQueryPaginated,
    executeTransaction,
    
    // Aliases for compatibility
    query: executeQuery,
    scalar: executeScalar,
    procedure: executeProcedure
  };
}

module.exports = {
  createQueryExecutor
};
