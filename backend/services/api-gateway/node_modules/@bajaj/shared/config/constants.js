/**
 * Shared Configuration Constants
 * Centralized hardcoded values and configuration
 */

const CONFIG = {
  // Database Configuration
  DATABASE: {
    DEFAULT_SEASON: process.env.DEFAULT_SEASON || '2526',
    REQUEST_TIMEOUT_MS: Number(process.env.SQL_REQUEST_TIMEOUT_MS || 300000), // 5 minutes
    CONNECTION_TIMEOUT_MS: Number(process.env.SQL_CONNECTION_TIMEOUT_MS || 30000), // 30 seconds
    SUPPORTED_SEASONS: ['2021', '2122', '2223', '2324', '2425', '2526'],
    MAX_POOL_SIZE: 10,
    MIN_POOL_SIZE: 2
  },

  // API Configuration
  API: {
    DEFAULT_LIMIT: 100,
    MAX_LIMIT: 1000,
    TIMEOUT_MS: 45000, // 45 seconds
    MAX_JSON_SIZE: '5mb',
    MAX_URLENCODED_SIZE: '5mb'
  },

  // Security
  SECURITY: {
    BCRYPT_ROUNDS: 10,
    JWT_EXPIRY_DEFAULT: '24h',
    PASSWORD_MIN_LENGTH: 6,
    SESSION_TIMEOUT_MS: 86400000 // 24 hours
  },

  // Error Codes
  ERROR_CODES: {
    NOT_FOUND: 'NOT_FOUND',
    UNAUTHORIZED: 'UNAUTHORIZED',
    FORBIDDEN: 'FORBIDDEN',
    BAD_REQUEST: 'BAD_REQUEST',
    VALIDATION_ERROR: 'VALIDATION_ERROR',
    INTERNAL_ERROR: 'INTERNAL_ERROR',
    SERVICE_UNAVAILABLE: 'SERVICE_UNAVAILABLE',
    DATABASE_ERROR: 'DATABASE_ERROR'
  },

  // HTTP Status Codes
  HTTP_STATUS: {
    OK: 200,
    CREATED: 201,
    BAD_REQUEST: 400,
    UNAUTHORIZED: 401,
    FORBIDDEN: 403,
    NOT_FOUND: 404,
    CONFLICT: 409,
    UNPROCESSABLE: 422,
    INTERNAL_ERROR: 500,
    SERVICE_UNAVAILABLE: 503
  },

  // Logging
  LOGGING: {
    LEVELS: ['debug', 'info', 'warn', 'error'],
    DEFAULT_LEVEL: process.env.LOG_LEVEL || 'info',
    FORMAT: 'timestamp service requestId level message'
  },

  // Rate Limiting
  RATE_LIMIT: {
    WINDOW_MS: 60000, // 1 minute
    MAX_REQUESTS: 300,
    LOGIN_WINDOW_MS: 900000, // 15 minutes
    LOGIN_MAX_ATTEMPTS: 5
  }
};

module.exports = CONFIG;
