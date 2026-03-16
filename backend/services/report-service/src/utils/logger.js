let logger = console;

try {
  const { getLogger } = require('../../../../shared/lib/utils/logger');
  logger = getLogger('report-service');
} catch (error) {
  // Fallback to console if shared logger is unavailable
  logger = console;
}

function logInfo(message, meta) {
  if (meta !== undefined) return logger.info(message, meta);
  return logger.info(message);
}

function logError(message, meta) {
  if (meta !== undefined) return logger.error(message, meta);
  return logger.error(message);
}

module.exports = {
  logInfo,
  logError
};
