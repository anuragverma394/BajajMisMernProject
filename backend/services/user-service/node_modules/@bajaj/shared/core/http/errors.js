/**
 * Shared Custom Error Classes
 * Standardized error definitions for all services
 */

const CONFIG = require('../../config/constants');

/**
 * BASE: Application Error Class
 * Foundation for all custom errors
 */
class AppError extends Error {
  constructor(message, statusCode = 500, code = CONFIG.ERROR_CODES.INTERNAL_ERROR, details = null) {
    super(message || 'Application error');
    this.name = 'AppError';
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
  }
}

/**
 * Bad Request Error (400)
 * Used for invalid input, validation failures
 */
function badRequest(message, details = null) {
  return new AppError(
    message || 'Invalid request parameters',
    CONFIG.HTTP_STATUS.BAD_REQUEST,
    CONFIG.ERROR_CODES.BAD_REQUEST,
    details
  );
}

/**
 * Unauthorized Error (401)
 * Used when authentication fails or token missing
 */
function unauthorized(message, details = null) {
  return new AppError(
    message || 'Authentication required',
    CONFIG.HTTP_STATUS.UNAUTHORIZED,
    CONFIG.ERROR_CODES.UNAUTHORIZED,
    details
  );
}

/**
 * Forbidden Error (403)
 * Used when user lacks permission
 */
function forbidden(message, details = null) {
  return new AppError(
    message || 'Access forbidden',
    CONFIG.HTTP_STATUS.FORBIDDEN,
    CONFIG.ERROR_CODES.FORBIDDEN,
    details
  );
}

/**
 * Not Found Error (404)
 * Used when resource doesn't exist
 */
function notFound(message, details = null) {
  return new AppError(
    message || 'Resource not found',
    CONFIG.HTTP_STATUS.NOT_FOUND,
    CONFIG.ERROR_CODES.NOT_FOUND,
    details
  );
}

/**
 * Validation Error (422)
 * Used for validation failures
 */
function validationError(message, details = null) {
  return new AppError(
    message || 'Validation failed',
    CONFIG.HTTP_STATUS.UNPROCESSABLE,
    CONFIG.ERROR_CODES.VALIDATION_ERROR,
    details
  );
}

/**
 * Conflict Error (409)
 * Used for duplicate or conflicting data
 */
function conflict(message, details = null) {
  return new AppError(
    message || 'Resource conflict',
    CONFIG.HTTP_STATUS.CONFLICT,
    CONFIG.ERROR_CODES.INTERNAL_ERROR,
    details
  );
}

/**
 * Service Unavailable Error (503)
 * Used when dependent service is down
 */
function serviceUnavailable(message, details = null) {
  return new AppError(
    message || 'Service temporarily unavailable',
    CONFIG.HTTP_STATUS.SERVICE_UNAVAILABLE,
    CONFIG.ERROR_CODES.SERVICE_UNAVAILABLE,
    details
  );
}

/**
 * Database Error (500)
 * Used for database-related errors
 */
function databaseError(message, details = null) {
  return new AppError(
    message || 'Database operation failed',
    CONFIG.HTTP_STATUS.INTERNAL_ERROR,
    CONFIG.ERROR_CODES.DATABASE_ERROR,
    details
  );
}

module.exports = {
  AppError,
  badRequest,
  unauthorized,
  forbidden,
  notFound,
  validationError,
  conflict,
  serviceUnavailable,
  databaseError
};
