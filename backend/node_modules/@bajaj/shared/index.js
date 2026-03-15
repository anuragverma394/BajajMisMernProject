/**
 * @bajaj/shared - Unified Microservices Library
 * 
 * Exports:
 * - Unified HTTP response and error handling
 * - Unified middleware (auth, validation, error handling)
 * - Database utilities and connection management
 * - Caching layer with Redis
 * - Logging utilities
 * - Common validation schemas
 * - Configuration management
 */

const http = require('./lib/http');
const middleware = require('./lib/middleware');
const db = require('./lib/db');
const { getLogger, setLogLevel, Logger, cache, createNotImplementedHandler } = require('./lib/utils');
const { config, getConfig, logConfig, validateEnv, validateCritical } = require('./lib/config');

/**
 * Initialize shared services
 * Call this in service startup
 */
async function initialize(serviceName, options = {}) {
  const logger = getLogger(serviceName, options.logLevel);
  
  try {
    logger.info('Initializing shared services', { serviceName });

    // Validate configuration
    validateCritical();

    // Initialize cache if enabled
    if (config.REDIS_ENABLED) {
      await cache.initializeCache({
        host: config.REDIS_HOST,
        port: config.REDIS_PORT
      });
      logger.info('Cache initialized');
    }

    logger.info('Shared services initialized successfully');

  } catch (err) {
    logger.error('Failed to initialize shared services', err);
    throw err;
  }
}

/**
 * Cleanup on shutdown
 */
async function shutdown() {
  try {
    await cache.close();
    await db.closeAllPools();
  } catch (err) {
    console.error('Error during shutdown:', err);
  }
}

module.exports = {
  // HTTP
  ...http,

  // Middleware
  ...middleware,

  // Database
  ...db,

  // Utilities
  getLogger,
  setLogLevel,
  Logger,
  cache,
  createNotImplementedHandler,

  // Configuration
  config,
  getConfig,
  logConfig,
  validateEnv,
  validateCritical,

  // Lifecycle
  initialize,
  shutdown,

  // Version
  version: '1.0.0'
};
