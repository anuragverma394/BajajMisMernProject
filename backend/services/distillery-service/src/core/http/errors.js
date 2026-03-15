class AppError extends Error {
  constructor(message, statusCode = 500, code = 'APP_ERROR', details = null) {
    super(message || 'Application error');
    this.name = 'AppError';
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
  }
}

function badRequest(message, details = null) {
  return new AppError(message || 'Bad request', 400, 'BAD_REQUEST', details);
}

function unauthorized(message, details = null) {
  return new AppError(message || 'Unauthorized', 401, 'UNAUTHORIZED', details);
}

function notFound(message, details = null) {
  return new AppError(message || 'Not found', 404, 'NOT_FOUND', details);
}

module.exports = {
  AppError,
  badRequest,
  unauthorized,
  notFound
};
