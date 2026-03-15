function toErrorString(error) {
  if (!error) return undefined;
  if (typeof error === 'string') return error;
  if (error.message) return error.message;
  return String(error);
}

function buildPayload(success, message, data, error) {
  const payload = {
    success: Boolean(success),
    message: String(message || (success ? 'OK' : 'Request failed')),
    data: data === undefined ? null : data
  };

  if (error !== undefined && error !== null) {
    payload.error = toErrorString(error);
  }

  return payload;
}

function sendSuccess(res, message, data, statusCode = 200) {
  return res.status(statusCode).json(buildPayload(true, message, data));
}

function sendError(res, message, error, statusCode = 500, data = null) {
  return res.status(statusCode).json(buildPayload(false, message, data, error));
}

function attachResponseHelpers(req, res, next) {
  res.apiSuccess = (message, data, statusCode = 200) => sendSuccess(res, message, data, statusCode);
  res.apiError = (message, error, statusCode = 500, data = null) => sendError(res, message, error, statusCode, data);
  next();
}

module.exports = {
  buildPayload,
  sendSuccess,
  sendError,
  attachResponseHelpers
};
