/**
 * Unified MSSQL Connection Manager
 * Handles connection pooling and lifecycle
 */

const mssql = require('mssql');
let sqlNative = null;

try {
  sqlNative = require('mssql/msnodesqlv8');
} catch (error) {
  sqlNative = null;
}

const { getLogger } = require('../utils/logger');

const logger = getLogger('mssql-connection');

const connectionPools = new Map();
const pendingPools = new Map();

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

function resolveServerAddress(server, instance, port) {
  if (instance) {
    return `${server}\\${instance}`;
  }
  if (server && port) {
    return server;
  }
  return server;
}

function buildWindowsAuthPoolConfig(config = {}) {
  const server = config.server || process.env.DB_SERVER;
  const instance = config.instance || process.env.DB_INSTANCE;
  const database = config.database || process.env.DB_NAME;

  if (!server || !database) return null;
  if (!sqlNative) {
    throw new Error('DB_USE_WINDOWS_AUTH=true but msnodesqlv8 driver is not available');
  }

  const serverAddress = resolveServerAddress(server, instance);
  const connectionString = config.connectionString
    || `Driver={ODBC Driver 18 for SQL Server};Server=${serverAddress};Database=${database};Trusted_Connection=Yes;TrustServerCertificate=Yes;`;

  return {
    driver: sqlNative,
    config: {
      connectionString,
      requestTimeout: config.requestTimeout || Number(process.env.SQL_REQUEST_TIMEOUT_MS || 300000),
      connectionTimeout: config.connectionTimeout || Number(process.env.SQL_CONNECTION_TIMEOUT_MS || 30000)
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
    // Reuse in-flight connection to avoid duplicate logs/creation
    if (pendingPools.has(poolName)) {
      return pendingPools.get(poolName);
    }

    const useWindowsAuth = String((config.useWindowsAuth ?? process.env.DB_USE_WINDOWS_AUTH) || 'false').toLowerCase() === 'true';

    let driver = mssql;
    let poolConfig = null;

    if (useWindowsAuth) {
      const winCfg = buildWindowsAuthPoolConfig(config);
      if (!winCfg) {
        throw new Error('No SQL configuration found for Windows Auth. Set DB_SERVER/DB_INSTANCE and DB_NAME.');
      }
      driver = winCfg.driver;
      poolConfig = winCfg.config;
    } else {
      // Create new pool (SQL auth)
      poolConfig = {
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
          encrypt: config.encrypt !== false,
          trustServerCertificate: config.trustServerCertificate || true,
          enableKeepAlive: true,
          keepAliveInitialDelayMillis: 0
        },
        connectionTimeout: config.connectionTimeout || 15000,
        requestTimeout: config.requestTimeout || 30000,
        ...config
      };

      if (!poolConfig.server || !poolConfig.database || !poolConfig.user || !poolConfig.password) {
        throw new Error('No SQL configuration found. Set DB_USER/DB_PASSWORD or enable Windows Auth.');
      }
    }

    logger.info('Creating connection pool', {
      server: poolConfig.server || process.env.DB_SERVER,
      database: poolConfig.database || process.env.DB_NAME,
      poolName
    });

    const pool = new driver.ConnectionPool(poolConfig);

    // Handle pool errors
    pool.on('error', (err) => {
      logger.error('Connection pool error', err);
    });

    // Connect
    const connectPromise = pool.connect().then(() => {
      logger.info('Connection pool connected', { poolName });
      connectionPools.set(poolName, pool);
      pendingPools.delete(poolName);
      return pool;
    }).catch((err) => {
      pendingPools.delete(poolName);
      throw err;
    });
    pendingPools.set(poolName, connectPromise);
    return connectPromise;

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
    logger.error('Failed to close pools', err);
    throw err;
  }
}

module.exports = {
  getConnectionPool,
  query,
  scalar,
  procedure,
  closeAllPools
};

