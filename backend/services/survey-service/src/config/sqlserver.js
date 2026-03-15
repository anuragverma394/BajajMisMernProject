const sql = require('mssql');
let sqlNative = null;

try {
  sqlNative = require('mssql/msnodesqlv8');
} catch (error) {
  sqlNative = null;
}

function getConnectionStringBySeason(seasonValue) {
  const season = String(seasonValue || process.env.DEFAULT_SEASON || '2526');

  const keys = {
    '2021': process.env.SQL_CONN_2021,
    '2122': process.env.SQL_CONN_2122,
    '2223': process.env.SQL_CONN_2223,
    '2324': process.env.SQL_CONN_2324,
    '2425': process.env.SQL_CONN_2425,
    '2526': process.env.SQL_CONN_2526
  };

  return keys[season] || process.env.SQL_CONN_2526 || process.env.SQL_CONN_DEFAULT || '';
}

function getServerAddress() {
  const server = process.env.DB_SERVER;
  const instance = process.env.DB_INSTANCE;
  const port = process.env.DB_PORT;

  if (instance) {
    return `${server}\\${instance}`;
  }

  if (server && port) {
    return `${server},${port}`;
  }

  return server;
}

function getDbConfig() {
  const server = getServerAddress();
  const database = process.env.DB_NAME;
  const useWindowsAuth = String(process.env.DB_USE_WINDOWS_AUTH || 'false').toLowerCase() === 'true';

  if (!server || !database) {
    return null;
  }

  if (useWindowsAuth) {
    if (!sqlNative) {
      throw new Error('DB_USE_WINDOWS_AUTH=true but msnodesqlv8 driver is not available');
    }

    return {
      mode: 'windows-auth',
      driver: sqlNative,
      config: {
        connectionString: `Driver={ODBC Driver 18 for SQL Server};Server=${server};Database=${database};Trusted_Connection=Yes;TrustServerCertificate=Yes;`,
        requestTimeout: Number(process.env.SQL_REQUEST_TIMEOUT_MS || 300000),
        connectionTimeout: Number(process.env.SQL_CONNECTION_TIMEOUT_MS || 30000)
      }
    };
  }

  const user = process.env.DB_USER;
  const password = process.env.DB_PASSWORD;
  if (!user || !password) {
    return null;
  }

  return {
    mode: 'sql-auth',
    driver: sql,
    config: {
      server,
      database,
      user,
      password,
      requestTimeout: Number(process.env.SQL_REQUEST_TIMEOUT_MS || 300000),
      connectionTimeout: Number(process.env.SQL_CONNECTION_TIMEOUT_MS || 30000),
      options: {
        encrypt: false,
        trustServerCertificate: true
      }
    }
  };
}

const pools = new Map();

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

async function getPool(seasonValue) {
  const skipDb = String(process.env.SKIP_DB_CONNECT || 'false').toLowerCase() === 'true';
  if (skipDb) {
    const mockKey = '__mock_pool__';
    if (!pools.has(mockKey)) {
      pools.set(mockKey, createMockPool());
    }
    return pools.get(mockKey);
  }

  const season = String(seasonValue || process.env.DEFAULT_SEASON || '2526');
  const conn = getConnectionStringBySeason(season);
  const dbConfig = conn ? null : getDbConfig();

  if (!conn && !dbConfig) {
    throw new Error('No SQL configuration found. Set SQL_CONN_2526/SQL_CONN_DEFAULT or DB_SERVER/DB_NAME with DB_USE_WINDOWS_AUTH=true (or DB_USER/DB_PASSWORD)');
  }

  const poolKey = conn
    ? `${season}:conn:${conn}`
    : `${season}:config:${JSON.stringify(dbConfig.config)}`;

  if (pools.has(poolKey)) {
    const existing = pools.get(poolKey);
    if (existing.connected) {
      return existing;
    }
  }

  const driver = conn ? sql : dbConfig.driver;
  const config = conn
    ? {
        connectionString: conn,
        requestTimeout: Number(process.env.SQL_REQUEST_TIMEOUT_MS || 300000),
        connectionTimeout: Number(process.env.SQL_CONNECTION_TIMEOUT_MS || 30000)
      }
    : dbConfig.config;
  const pool = new driver.ConnectionPool(config);
  pools.set(poolKey, pool);
  await pool.connect();
  return pool;
}

module.exports = {
  sql,
  getPool,
  getConnectionStringBySeason
};
