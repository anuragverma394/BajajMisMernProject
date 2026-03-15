/**
 * Shared Error Middleware
 * Standardized error handling for all services
 * Provides: notFoundHandler, errorHandler
 */

const CONFIG = require('../config/constants');

/**
 * 404 Not Found Handler
 * Called when no route matches
 * @param {Object} req - Express request
 * @param {Object} res - Express response
 */
function notFoundHandler(req, res) {
  res.status(CONFIG.HTTP_STATUS.NOT_FOUND).json({
    success: false,
    message: `Route not found: ${req.method} ${req.originalUrl}`,
    data: null,
    error: CONFIG.ERROR_CODES.NOT_FOUND
  });
}

/**
 * Global Error Handler
 * Catches and processes all errors in the application
 * @param {Error} err - Error object
 * @param {Object} req - Express request
 * @param {Object} res - Express response
 * @param {Function} next - Express next middleware
 */
function errorHandler(err, req, res, next) {
  // Determine appropriate HTTP status code
  let statusCode = Number(err.statusCode || err.status || CONFIG.HTTP_STATUS.INTERNAL_ERROR);
  
  // Validate status code is in valid HTTP range
  if (!Number.isFinite(statusCode) || statusCode < 400 || statusCode >= 600) {
    statusCode = CONFIG.HTTP_STATUS.INTERNAL_ERROR;
  }

  // Check if it's a server error (5xx)
  const isServerError = statusCode >= 500;

  // Log error details for debugging
  console.error('[API_ERROR]', {
    requestId: req.id || 'N/A',
    method: req.method,
    path: req.originalUrl,
    statusCode,
    userId: req.user?.userId || null,
    season: req.user?.season || null,
    query: Object.keys(req.query || {}).length > 0 ? req.query : null,
    bodyKeys: Object.keys(req.body || {}),
    errorMessage: err.message,
    errorCode: err.code || err.name || 'UNKNOWN',
    sqlCode: err.code || null, // SQL error code
    sqlNumber: err.number || null, // SQL error number
    stack: err.stack
  });

  // Build response message
  const responseMessage = isServerError
    ? 'Internal server error occurred'
    : (err.message || 'Request processing failed');

  // Send standardized error response
  res.status(statusCode).json({
    success: false,
    message: responseMessage,
    data: null,
    error: err.code || err.name || CONFIG.ERROR_CODES.INTERNAL_ERROR
  });
}

module.exports = {
  notFoundHandler,
  errorHandler
};
