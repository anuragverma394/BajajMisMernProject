const repository = require("../repositories/tracking.index.repository.js");
const { validateRequest } = require("../validations/tracking.validation.js");
const { logServiceError } = require('../../../../shared/utils/logger.utils');

function wrapHandler(name, fn) {
  return async (...args) => {
    try {
      if (validateRequest && typeof validateRequest[name] === "function") {
        validateRequest[name](...args);
      }
      return await fn(...args);
    } catch (error) {
      logServiceError("tracking.service", name, error);
      throw error;
    }
  };
}

const service = {};
for (const [key, value] of Object.entries(repository)) {
  service[key] = typeof value === "function" ? wrapHandler(key, value) : value;
}

module.exports = service;
