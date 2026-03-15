/**
 * Shared HTTP Response Utilities
 * Provides standardized response helpers and error building
 */

const CONFIG = require('../config/constants');

/**
 * Convert error to string
 * @param {*} error - Error object or value
 * @returns {string|undefined} Error message
 */
function toErrorString(error) {
  if (!error) return undefined;
  if (typeof error === 'string') return error;
  if (error.message) return error.message;
  return String(error);
}

/**
 * Build standardized response payload
 * @param {boolean} success - Success indicator
 * @param {string} message - Response message
 * @param {*} data - Response data
 * @param {object} error - Error object (if any)
 * @returns {Object} Standardized response object
 */
function buildPayload(success, message, data, error) {
  const payload = {
    success: Boolean(success),
    message: String(message || (success ? 'OK' : 'Request failed')),
    data: data === undefined ? null : data
  };

  // Only include error field if error exists
  if (error !== undefined && error !== null) {
    payload.error = toErrorString(error);
  }

  return payload;
}

/**
 * Send success response
 * @param {Object} res - Express response
 * @param {string} message - Success message
 * @param {*} data - Response data
 * @param {number} statusCode - HTTP status (default: 200)
 * @returns {Object} Response object
 */
function sendSuccess(res, message, data, statusCode = 200) {
  const status = Number.isFinite(statusCode) ? statusCode : CONFIG.HTTP_STATUS.OK;
  return res.status(status).json(buildPayload(true, message, data));
}

/**
 * Send error response
 * @param {Object} res - Express response
 * @param {string} message - Error message
 * @param {*} error - Error object or code
 * @param {number} statusCode - HTTP status (default: 500)
 * @param {*} data - Optional additional data
 * @returns {Object} Response object
 */
function sendError(res, message, error, statusCode = 500, data = null) {
  const status = Number.isFinite(statusCode) ? statusCode : CONFIG.HTTP_STATUS.INTERNAL_ERROR;
  return res.status(status).json(buildPayload(false, message, data, error));
}

/**
 * Attach response helper methods to Express response
 * Middleware to be used early in app initialization
 * @param {Object} req - Express request
 * @param {Object} res - Express response
 * @param {Function} next - Express next middleware
 */
function attachResponseHelpers(req, res, next) {
  /**
   * Send API success response
   * Usage: res.apiSuccess('User created', userData, 201)
   */
  res.apiSuccess = (message, data, statusCode = 200) => {
    return sendSuccess(res, message, data, statusCode);
  };

  /**
   * Send API error response
   * Usage: res.apiError('User not found', 'NOT_FOUND', 404)
   */
  res.apiError = (message, error, statusCode = 500, data = null) => {
    return sendError(res, message, error, statusCode, data);
  };

  next();
}

module.exports = {
  toErrorString,
  buildPayload,
  sendSuccess,
  sendError,
  attachResponseHelpers
};
