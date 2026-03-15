const repository = require("../repositories/dashboard.repository.js");
const { validateRequest } = require("../validations/dashboard.validation.js");
const { logServiceError } = require('../../../../shared/utils/logger.utils');

function wrapHandler(name, fn) {
  return async (...args) => {
    try {
      if (validateRequest && typeof validateRequest[name] === "function") {
        validateRequest[name](...args);
      }
      return await fn(...args);
    } catch (error) {
      logServiceError("main.service", name, error);
      throw error;
    }
  };
}

const service = {};
for (const [key, value] of Object.entries(repository)) {
  service[key] = typeof value === "function" ? wrapHandler(key, value) : value;
}

module.exports = service;
