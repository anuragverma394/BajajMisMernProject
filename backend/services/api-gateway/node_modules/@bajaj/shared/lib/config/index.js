/**
 * Centralized Configuration Management
 */

require('dotenv').config();

const { getLogger } = require('../utils/logger');

const logger = getLogger('config');

/**
 * Validate required environment variables
 */
function validateEnv(requiredVars = []) {
  const missing = requiredVars.filter(varName => !process.env[varName]);
  
  if (missing.length > 0) {
    logger.error('Missing required environment variables', new Error(missing.join(', ')));
    throw new Error(`Missing environment variables: ${missing.join(', ')}`);
  }
}

/**
 * Common configuration object
 */
const config = {
  // Environment
  NODE_ENV: process.env.NODE_ENV || 'development',
  isDevelopment: process.env.NODE_ENV !== 'production',
  isProduction: process.env.NODE_ENV === 'production',

  // Service
  SERVICE_NAME: process.env.SERVICE_NAME || 'unknown-service',
  SERVICE_PORT: parseInt(process.env.SERVICE_PORT) || 3001,
  SERVICE_HOST: process.env.SERVICE_HOST || '0.0.0.0',

  // Logging
  LOG_LEVEL: process.env.LOG_LEVEL || (process.env.NODE_ENV === 'production' ? 'INFO' : 'DEBUG'),

  // Database
  DB_SERVER: process.env.DB_SERVER || 'localhost',
  DB_PORT: parseInt(process.env.DB_PORT) || 1433,
  DB_NAME: process.env.DB_NAME || 'BajajCane2526',
  DB_USER: process.env.DB_USER || '',
  DB_PASSWORD: process.env.DB_PASSWORD || '',
  DB_ENCRYPT: process.env.DB_ENCRYPT !== 'false',
  DB_TRUST_CERTIFICATE: process.env.DB_TRUST_CERTIFICATE !== 'true',
  DB_POOL_MAX: parseInt(process.env.DB_POOL_MAX) || 10,
  DB_POOL_MIN: parseInt(process.env.DB_POOL_MIN) || 2,
  SKIP_DB_CONNECT: process.env.SKIP_DB_CONNECT === 'true',

  // Redis/Cache
  REDIS_HOST: process.env.REDIS_HOST || 'localhost',
  REDIS_PORT: parseInt(process.env.REDIS_PORT) || 6379,
  REDIS_PASSWORD: process.env.REDIS_PASSWORD || '',
  REDIS_ENABLED: process.env.REDIS_ENABLED !== 'false',

  // Authentication
  JWT_SECRET: process.env.APP_JWT_SECRET || process.env.JWT_SECRET || 'change_me_in_production',
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '1d',
  DEFAULT_SEASON: process.env.DEFAULT_SEASON || '2526',

  // API Gateway
  API_GATEWAY_URL: process.env.API_GATEWAY_URL || 'http://localhost:5000',
  AUTH_SERVICE_URL: process.env.AUTH_SERVICE_URL || 'http://localhost:5001',

  // Service URLs (for inter-service communication)
  USER_SERVICE_URL: process.env.USER_SERVICE_URL || 'http://localhost:5002',
  DASHBOARD_SERVICE_URL: process.env.DASHBOARD_SERVICE_URL || 'http://localhost:5003',
  REPORT_SERVICE_URL: process.env.REPORT_SERVICE_URL || 'http://localhost:5004',
  LAB_SERVICE_URL: process.env.LAB_SERVICE_URL || 'http://localhost:5005',
  SURVEY_SERVICE_URL: process.env.SURVEY_SERVICE_URL || 'http://localhost:5006',
  TRACKING_SERVICE_URL: process.env.TRACKING_SERVICE_URL || 'http://localhost:5007',
  DISTILLERY_SERVICE_URL: process.env.DISTILLERY_SERVICE_URL || 'http://localhost:5008',
  WHATSAPP_SERVICE_URL: process.env.WHATSAPP_SERVICE_URL || 'http://localhost:5009',

  // Features
  FEATURE_CACHE: process.env.FEATURE_CACHE === 'true',
  FEATURE_AUDIT_LOG: process.env.FEATURE_AUDIT_LOG === 'true',

  // Bcrypt
  BCRYPT_ROUNDS: parseInt(process.env.BCRYPT_ROUNDS) || 10
};

/**
 * Get config with defaults
 */
function getConfig(overrides = {}) {
  return {
    ...config,
    ...overrides
  };
}

/**
 * Log configuration (excluding secrets)
 */
function logConfig() {
  const safeConfig = {
    NODE_ENV: config.NODE_ENV,
    SERVICE_NAME: config.SERVICE_NAME,
    SERVICE_PORT: config.SERVICE_PORT,
    LOG_LEVEL: config.LOG_LEVEL,
    DB_SERVER: config.DB_SERVER,
    DB_NAME: config.DB_NAME,
    REDIS_HOST: config.REDIS_HOST,
    REDIS_ENABLED: config.REDIS_ENABLED,
    FEATURE_CACHE: config.FEATURE_CACHE,
    FEATURE_AUDIT_LOG: config.FEATURE_AUDIT_LOG
  };

  logger.info('Configuration loaded', safeConfig);
}

// Validate critical variables on startup
function validateCritical() {
  const critical = ['DB_SERVER', 'DB_NAME'];
  
  if (config.isProduction) {
    critical.push(
      'JWT_SECRET',
      'DB_PASSWORD'
    );
  }

  validateEnv(critical);
}

module.exports = {
  config,
  getConfig,
  logConfig,
  validateEnv,
  validateCritical
};
