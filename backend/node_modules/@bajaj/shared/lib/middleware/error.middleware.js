/**
 * Unified Error Handling Middleware
 * Catches and properly formats all errors
 */

const { errorHandler } = require('../http/errors');
const { getLogger } = require('../utils/logger');

const logger = getLogger('error-middleware');

/**
 * Main error handler (attach to Express app)
 */
function setupErrorHandler(app) {
  // 404 handler (must be last route)
  app.use((req, res, next) => {
    const err = new Error('Not Found');
    err.statusCode = 404;
    err.errorCode = 'NOT_FOUND';
    next(err);
  });

  // Error handler (must be last middleware)
  app.use(errorHandler);
}

/**
 * Async error wrapper for express route handlers
 * Usage: router.get('/path', catchAsync(async (req, res) => { ... }))
 */
function catchAsync(fn) {
  return (req, res, next) => {
    const promise = fn(req, res, next);
    
    if (promise && typeof promise.catch === 'function') {
      promise.catch(err => {
        logger.error('Async error caught', err, {
          path: req.path,
          method: req.method
        });
        next(err);
      });
    }
  };
}

/**
 * Validation error helper
 */
function validationError(res, errors = {}, message = 'Validation failed', requestId) {
  return res.status(422).json({
    success: false,
    message,
    errorCode: 'VALIDATION_ERROR',
    details: errors,
    timestamp: new Date().toISOString(),
    requestId
  });
}

/**
 * Database error handler
 */
function handleDatabaseError(err, requestId) {
  logger.error('Database error', err, { code: err.code });

  const statusCode = err.statusCode || 500;
  
  return {
    success: false,
    message: 'Database operation failed',
    errorCode: 'DATABASE_ERROR',
    ...(process.env.NODE_ENV === 'development' && { details: err.message }),
    timestamp: new Date().toISOString(),
    requestId
  };
}

/**
 * Service call error handler (for inter-service communication)
 */
function handleServiceError(err, serviceName, requestId) {
  logger.error(`Service error: ${serviceName}`, err);

  const statusCode = err.statusCode || 503;

  return {
    success: false,
    message: `Service ${serviceName} error`,
    errorCode: 'SERVICE_ERROR',
    service: serviceName,
    ...(process.env.NODE_ENV === 'development' && { details: err.message }),
    timestamp: new Date().toISOString(),
    requestId
  };
}

module.exports = {
  setupErrorHandler,
  catchAsync,
  validationError,
  handleDatabaseError,
  handleServiceError,
  errorHandler
};
