/**
 * Shared Utility Functions
 */

const { getLogger, setLogLevel, Logger, LOG_LEVELS } = require('./logger');
const cache = require('./cache');
const { createNotImplementedHandler } = require('./notImplemented');

// Date utilities
const date = require('../../utils/date');
const sql = require('./sql');

module.exports = {
  // Logger
  getLogger,
  setLogLevel,
  Logger,
  LOG_LEVELS,
  
  // Cache
  cache,
  
  // Date utils
  date,

  // SQL utils
  sql,

  // Not implemented helper
  createNotImplementedHandler,
  
  // Helper: Create cache key
  cacheKey: (...parts) => parts.filter(Boolean).join(':'),
  
  // Helper: Retry with exponential backoff
  retry: async (fn, options = {}) => {
    const maxAttempts = options.maxAttempts || 3;
    const delayMs = options.delayMs || 1000;
    const backoffMultiplier = options.backoffMultiplier || 2;
    
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        return await fn();
      } catch (err) {
        if (attempt === maxAttempts) throw err;
        
        const delay = delayMs * Math.pow(backoffMultiplier, attempt - 1);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }
};
