/**
 * Unified Error Definitions and Handling
 * Provides consistent error codes and messages across microservices
 */

class AppError extends Error {
  constructor(message, statusCode = 500, errorCode = 'INTERNAL_ERROR') {
    super(message);
    this.statusCode = statusCode;
    this.errorCode = errorCode;
    this.timestamp = new Date().toISOString();
  }

  toJSON() {
    return {
      message: this.message,
      errorCode: this.errorCode,
      statusCode: this.statusCode,
      timestamp: this.timestamp
    };
  }
}

// HTTP Error Classes
class BadRequestError extends AppError {
  constructor(message = 'Bad Request', errorCode = 'BAD_REQUEST') {
    super(message, 400, errorCode);
  }
}

class UnauthorizedError extends AppError {
  constructor(message = 'Unauthorized', errorCode = 'UNAUTHORIZED') {
    super(message, 401, errorCode);
  }
}

class ForbiddenError extends AppError {
  constructor(message = 'Forbidden', errorCode = 'FORBIDDEN') {
    super(message, 403, errorCode);
  }
}

class NotFoundError extends AppError {
  constructor(message = 'Not Found', errorCode = 'NOT_FOUND') {
    super(message, 404, errorCode);
  }
}

class ConflictError extends AppError {
  constructor(message = 'Conflict', errorCode = 'CONFLICT') {
    super(message, 409, errorCode);
  }
}

class ValidationError extends AppError {
  constructor(message = 'Validation Error', details = null, errorCode = 'VALIDATION_ERROR') {
    super(message, 422, errorCode);
    this.details = details;
  }
}

class InternalServerError extends AppError {
  constructor(message = 'Internal Server Error', errorCode = 'INTERNAL_ERROR') {
    super(message, 500, errorCode);
  }
}

class ServiceUnavailableError extends AppError {
  constructor(message = 'Service Unavailable', errorCode = 'SERVICE_UNAVAILABLE') {
    super(message, 503, errorCode);
  }
}

// Error Handler Middleware
function errorHandler(err, req, res, next) {
  const requestId = req.id || 'unknown';
  
  // Log error
  console.error(`[ERROR] ${requestId}:`, {
    message: err.message,
    stack: err.stack,
    statusCode: err.statusCode,
    errorCode: err.errorCode
  });

  // AppError (known errors)
  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      success: false,
      message: err.message,
      errorCode: err.errorCode,
      details: err.details || undefined,
      timestamp: err.timestamp,
      requestId
    });
  }

  // Validation Error from Zod or other validators
  if (err.name === 'ZodError') {
    return res.status(422).json({
      success: false,
      message: 'Validation Error',
      errorCode: 'VALIDATION_ERROR',
      details: err.errors.reduce((acc, e) => {
        acc[e.path.join('.')] = e.message;
        return acc;
      }, {}),
      timestamp: new Date().toISOString(),
      requestId
    });
  }

  // JWT Error
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({
      success: false,
      message: 'Invalid or expired token',
      errorCode: 'INVALID_TOKEN',
      timestamp: new Date().toISOString(),
      requestId
    });
  }

  // Database Error
  if (err.name === 'ConnectionError' || err.code === 'ECONNREFUSED') {
    return res.status(503).json({
      success: false,
      message: 'Database connection failed',
      errorCode: 'DATABASE_ERROR',
      timestamp: new Date().toISOString(),
      requestId
    });
  }

  // Unknown Error
  const statusCode = err.statusCode || 500;
  const isDevelopment = process.env.NODE_ENV === 'development';

  return res.status(statusCode).json({
    success: false,
    message: isDevelopment ? err.message : 'Internal server error',
    errorCode: err.errorCode || 'INTERNAL_ERROR',
    ...(isDevelopment && { stack: err.stack }),
    timestamp: new Date().toISOString(),
    requestId
  });
}

// Helper functions to create errors
function createError(statusCode, message, errorCode = 'ERROR') {
  switch (statusCode) {
    case 400:
      return new BadRequestError(message, errorCode);
    case 401:
      return new UnauthorizedError(message, errorCode);
    case 403:
      return new ForbiddenError(message, errorCode);
    case 404:
      return new NotFoundError(message, errorCode);
    case 409:
      return new ConflictError(message, errorCode);
    case 422:
      return new ValidationError(message, null, errorCode);
    case 503:
      return new ServiceUnavailableError(message, errorCode);
    default:
      return new InternalServerError(message, errorCode);
  }
}

module.exports = {
  // Error Classes
  AppError,
  BadRequestError,
  UnauthorizedError,
  ForbiddenError,
  NotFoundError,
  ConflictError,
  ValidationError,
  InternalServerError,
  ServiceUnavailableError,
  
  // Middleware
  errorHandler,
  
  // Helpers
  createError
};
