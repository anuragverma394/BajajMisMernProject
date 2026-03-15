/**
 * Unified HTTP Response Handler
 * Ensures consistent response format across all microservices
 * 
 * Response Format:
 * {
 *   success: boolean,
 *   message: string,
 *   data: any,
 *   error?: string (only in failures),
 *   timestamp: ISO8601,
 *   requestId?: string
 * }
 */

function generateRequestId() {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

function toErrorString(error) {
  if (!error) return undefined;
  if (typeof error === 'string') return error;
  if (error.message) return error.message;
  return String(error);
}

function buildPayload(success, message, data, error, requestId) {
  const payload = {
    success: Boolean(success),
    message: String(message || (success ? 'OK' : 'Request failed')),
    data: data === undefined ? null : data,
    timestamp: new Date().toISOString()
  };

  if (requestId) {
    payload.requestId = requestId;
  }

  if (error !== undefined && error !== null) {
    payload.error = toErrorString(error);
  }

  return payload;
}

function sendSuccess(res, message, data, statusCode = 200, requestId) {
  return res.status(statusCode).json(buildPayload(true, message, data, undefined, requestId));
}

function sendError(res, message, error, statusCode = 500, data = null, requestId) {
  return res.status(statusCode).json(buildPayload(false, message, data, error, requestId));
}

/**
 * Middleware to attach response helpers and request tracking
 */
function attachResponseHelpers(req, res, next) {
  // Generate request ID for tracing
  req.id = req.headers['x-request-id'] || generateRequestId();
  res.setHeader('X-Request-ID', req.id);

  // Attach helper methods
  res.apiSuccess = (message = 'OK', data = null, statusCode = 200) => 
    sendSuccess(res, message, data, statusCode, req.id);

  res.apiError = (message = 'Request failed', error = null, statusCode = 500, data = null) => 
    sendError(res, message, error, statusCode, data, req.id);

  res.apiPaginated = (message = 'OK', data = [], total = 0, page = 1, pageSize = 10) => {
    return res.status(200).json({
      success: true,
      message,
      data,
      pagination: {
        total,
        page,
        pageSize,
        totalPages: Math.ceil(total / pageSize)
      },
      timestamp: new Date().toISOString(),
      requestId: req.id
    });
  };

  next();
}

/**
 * Legacy compatibility helpers (for gradual migration)
 */
const successResponse = (res, statusCode, message, data = null) => {
  res.status(statusCode).json({
    success: true,
    message,
    data,
    timestamp: new Date().toISOString()
  });
};

const errorResponse = (res, statusCode, message, error = null) => {
  res.status(statusCode).json({
    success: false,
    message,
    error,
    timestamp: new Date().toISOString()
  });
};

module.exports = {
  buildPayload,
  sendSuccess,
  sendError,
  attachResponseHelpers,
  successResponse,
  errorResponse,
  generateRequestId
};
