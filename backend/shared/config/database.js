/**
 * Shared Database Configuration
 * Handles SQL Server connection setup for all services
 * Supports: Windows Auth, SQL Auth, and Connection Strings
 */

const sql = require('mssql');
let sqlNative = null;

// Try to load native driver for Windows Authentication
try {
  sqlNative = require('mssql/msnodesqlv8');
} catch (error) {
  sqlNative = null;
}

const CONFIG = require('./constants');

/**
 * Build season-to-connection-string mapping
 * @returns {Object} Season mapping
 */
function getSeasonConnectionMap() {
  return {
    '2021': process.env.SQL_CONN_2021,
    '2122': process.env.SQL_CONN_2122,
    '2223': process.env.SQL_CONN_2223,
    '2324': process.env.SQL_CONN_2324,
    '2425': process.env.SQL_CONN_2425,
    '2526': process.env.SQL_CONN_2526,
    'default': process.env.SQL_CONN_DEFAULT
  };
}

/**
 * Get connection string for specific season
 * @param {string} seasonValue - Season code (e.g., '2526')
 * @returns {string} Connection string
 */
function getConnectionStringBySeason(seasonValue) {
  const season = String(seasonValue || CONFIG.DATABASE.DEFAULT_SEASON);
  const connectionMap = getSeasonConnectionMap();
  
  // Try exact match, then fall back to defaults
  return connectionMap[season] || connectionMap['default'] || connectionMap['2526'] || '';
}

/**
 * Build server address from environment variables
 * Supports: server only, server+port, server+instance
 * @returns {string} Server address
 */
function getServerAddress() {
  const server = process.env.DB_SERVER;
  const instance = process.env.DB_INSTANCE;
  const port = process.env.DB_PORT;

  // Prioritize: instance > port > server only
  if (instance) {
    return `${server}\\${instance}`;
  }

  if (server && port) {
    return `${server},${port}`;
  }

  return server;
}

/**
 * Get database configuration based on environment variables
 * Supports Windows Auth and SQL Authentication
 * @returns {Object|null} Database configuration object
 */
function getDbConfig() {
  const server = getServerAddress();
  const database = process.env.DB_NAME;
  const useWindowsAuth = String(process.env.DB_USE_WINDOWS_AUTH || 'false').toLowerCase() === 'true';

  // Validate required fields
  if (!server || !database) {
    throw new Error('Database configuration missing: DB_SERVER and DB_NAME are required');
  }

  // Windows Authentication mode
  if (useWindowsAuth) {
    if (!sqlNative) {
      throw new Error('Windows Auth selected but msnodesqlv8 driver not available. Install: npm install mssql msnodesqlv8');
    }

    return {
      mode: 'windows-auth',
      driver: sqlNative,
      config: {
        connectionString: `Driver={ODBC Driver 18 for SQL Server};Server=${server};Database=${database};Trusted_Connection=Yes;TrustServerCertificate=Yes;`,
        requestTimeout: CONFIG.DATABASE.REQUEST_TIMEOUT_MS,
        connectionTimeout: CONFIG.DATABASE.CONNECTION_TIMEOUT_MS
      }
    };
  }

  // SQL Authentication mode
  const user = process.env.DB_USER;
  const password = process.env.DB_PASSWORD;
  
  if (!user || !password) {
    throw new Error('Database configuration missing: DB_USER and DB_PASSWORD required for SQL Auth');
  }

  return {
    mode: 'sql-auth',
    driver: sql,
    config: {
      server,
      database,
      user,
      password,
      requestTimeout: CONFIG.DATABASE.REQUEST_TIMEOUT_MS,
      connectionTimeout: CONFIG.DATABASE.CONNECTION_TIMEOUT_MS,
      options: {
        encrypt: false,
        trustServerCertificate: true
      }
    }
  };
}

// Connection pool cache (one pool per season)
const pools = new Map();

/**
 * Get or create connection pool for specific season
 * @param {string} season - Season code
 * @returns {Promise<Object>} MSSQL Connection Pool
 */
async function getPool(season) {
  const activeSeason = String(season || CONFIG.DATABASE.DEFAULT_SEASON);

  // Return cached pool if available
  if (pools.has(activeSeason)) {
    const pool = pools.get(activeSeason);
    if (pool.connected) {
      return pool;
    }
  }

  // Create new connection
  const dbConfig = getDbConfig();
  const driver = dbConfig.driver;
  const config = dbConfig.config;

  const pool = new driver.ConnectionPool(config);
  
  await pool.connect();
  pools.set(activeSeason, pool);
  
  console.log(`[DB][POOL] Connected to database - Season: ${activeSeason}, Mode: ${dbConfig.mode}`);
  
  return pool;
}

/**
 * Close all connection pools
 * @returns {Promise<void>}
 */
async function closeAllPools() {
  for (const [season, pool] of pools.entries()) {
    if (pool && pool.connected) {
      await pool.close();
      console.log(`[DB][POOL] Closed connection pool for season: ${season}`);
    }
  }
  pools.clear();
}

module.exports = {
  sql,
  sqlNative,
  getConnectionStringBySeason,
  getServerAddress,
  getDbConfig,
  getPool,
  closeAllPools,
  CONFIG: CONFIG.DATABASE
};
