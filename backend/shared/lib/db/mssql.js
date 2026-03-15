/**
 * Unified MSSQL Connection Manager
 * Handles connection pooling and lifecycle
 */

const mssql = require('mssql');
const { getLogger } = require('../utils/logger');

const logger = getLogger('mssql-connection');

const connectionPools = new Map();

/**
 * Create a mock connection pool for testing without database
 */
function createMockPool() {
  return {
    connected: true,
    request() {
      const state = { inputs: {} };
      return {
        input(name, value) {
          state.inputs[name] = value;
          return this;
        },
        async query() {
          return { recordset: [], recordsets: [] };
        },
        async execute() {
          return { recordset: [], recordsets: [] };
        }
      };
    }
  };
}

/**
 * Get or create connection pool
 */
async function getConnectionPool(config = {}, poolName = 'default') {
  try {
    // Check if database operations should be skipped
    const skipDb = String(process.env.SKIP_DB_CONNECT || 'false').toLowerCase() === 'true';
    if (skipDb) {
      const mockKey = '__mock_pool__';
      if (connectionPools.has(mockKey)) {
        return connectionPools.get(mockKey);
      }
      logger.info('Using mock connection pool (SKIP_DB_CONNECT=true)');
      const mockPool = createMockPool();
      connectionPools.set(mockKey, mockPool);
      return mockPool;
    }

    // Return existing pool if available
    if (connectionPools.has(poolName)) {
      const pool = connectionPools.get(poolName);
      if (pool.connected) {
        return pool;
      }
    }

    // Create new pool
    const poolConfig = {
      user: config.user || process.env.DB_USER,
      password: config.password || process.env.DB_PASSWORD,
      database: config.database || process.env.DB_NAME,
      server: config.server || process.env.DB_SERVER || 'localhost',
      port: config.port || parseInt(process.env.DB_PORT) || 1433,
      pool: {
        max: config.poolMax || 10,
        min: config.poolMin || 2,
        idleTimeoutMillis: config.idleTimeout || 30000
      },
      options: {
        encrypt: config.encrypt !== false, // Encrypt connection
        trustServerCertificate: config.trustServerCertificate || true,
        enableKeepAlive: true,
        keepAliveInitialDelayMillis: 0
      },
      connectionTimeout: config.connectionTimeout || 15000,
      requestTimeout: config.requestTimeout || 30000,
      ...config
    };

    logger.info('Creating connection pool', {
      server: poolConfig.server,
      database: poolConfig.database,
      poolName
    });

    const pool = new mssql.ConnectionPool(poolConfig);

    // Handle pool errors
    pool.on('error', (err) => {
      logger.error('Connection pool error', err);
    });

    // Connect
    await pool.connect();
    logger.info('Connection pool connected', { poolName });

    connectionPools.set(poolName, pool);
    return pool;

  } catch (err) {
    logger.error('Failed to create connection pool', err);
    throw err;
  }
}

/**
 * Execute query using pool
 */
async function query(sqlText, params = {}, poolName = 'default') {
  try {
    const pool = connectionPools.get(poolName);
    if (!pool || !pool.connected) {
      throw new Error(`Connection pool '${poolName}' not available`);
    }

    const request = pool.request();

    // Add parameters
    if (params && typeof params === 'object') {
      Object.entries(params).forEach(([key, value]) => {
        request.input(key, value);
      });
    }

    const result = await request.query(sqlText);
    return result;

  } catch (err) {
    logger.error('Query execution failed', err);
    throw err;
  }
}

/**
 * Execute scalar query
 */
async function scalar(sqlText, params = {}, poolName = 'default') {
  try {
    const result = await query(sqlText, params, poolName);
    const records = result.recordset || [];

    if (records.length === 0) return null;

    const firstRow = records[0];
    const firstKey = Object.keys(firstRow)[0];
    
    return firstRow[firstKey] || null;

  } catch (err) {
    logger.error('Scalar query failed', err);
    throw err;
  }
}

/**
 * Execute stored procedure
 */
async function procedure(procedureName, params = {}, poolName = 'default') {
  try {
    const pool = connectionPools.get(poolName);
    if (!pool || !pool.connected) {
      throw new Error(`Connection pool '${poolName}' not available`);
    }

    const request = pool.request();

    // Add parameters
    if (params && typeof params === 'object') {
      Object.entries(params).forEach(([key, value]) => {
        request.input(key, value);
      });
    }

    const result = await request.execute(procedureName);
    logger.debug('Procedure executed', { procedure: procedureName });

    return result;

  } catch (err) {
    logger.error('Procedure execution failed', err, { procedure: procedureName });
    throw err;
  }
}

/**
 * Close all connection pools
 */
async function closeAllPools() {
  try {
    for (const [poolName, pool] of connectionPools.entries()) {
      if (pool && pool.connected) {
        await pool.close();
        logger.info('Connection pool closed', { poolName });
      }
    }
    connectionPools.clear();
  } catch (err) {
    logger.error('Error closing pools', err);
  }
}

/**
 * Close specific connection pool
 */
async function closePool(poolName = 'default') {
  try {
    const pool = connectionPools.get(poolName);
    if (pool && pool.connected) {
      await pool.close();
      connectionPools.delete(poolName);
      logger.info('Connection pool closed', { poolName });
    }
  } catch (err) {
    logger.error('Error closing pool', err, { poolName });
  }
}

/**
 * Get pool statistics
 */
function getPoolStats(poolName = 'default') {
  const pool = connectionPools.get(poolName);
  if (!pool) return null;

  return {
    poolName,
    connected: pool.connected,
    connecting: pool.connecting,
    size: pool.pool?.size || 0,
    available: pool.pool?.available?.length || 0,
    pending: pool.pool?.queue?.length || 0
  };
}

module.exports = {
  getConnectionPool,
  query,
  scalar,
  procedure,
  closeAllPools,
  closePool,
  getPoolStats,
  mssql
};
