const { getLogger } = require('../lib/utils/logger');

function logServiceError(serviceName, action, error) {
  const logger = getLogger(serviceName);
  const message = error && error.message ? error.message : String(error || 'Unknown error');
  logger.error(`${action} failed`, { error: message });
}

module.exports = {
  logServiceError
};
