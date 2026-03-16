const { executeProcedure } = require('../core/db/query-executor');

/**
 * Creates a handler that executes a stored procedure
 * @param {string} controller - Controller name for logging
 * @param {string} action - Procedure name to execute
 * @param {string} signature - Signature (for documentation)
 * @returns {Function} Async handler function
 */
function createProcedureHandler(controller, action, signature) {
  return async (req, res, next) => {
    try {
      const season = req.user?.season || req.query?.season || req.body?.season || process.env.DEFAULT_SEASON || '2526';
      const params = { ...(req.query || {}), ...(req.body || {}) };
      const result = await executeProcedure(action, params, season);
      return res.status(200).json({
        success: true,
        message: `${controller}.${action} executed`,
        data: result?.rows || [],
        recordsets: result?.recordsets || []
      });
    } catch (error) {
      if (typeof next === 'function') return next(error);
      throw error;
    }
  };
}

/**
 * Safely executes a stored procedure with error handling
 * @param {string} name - Procedure name
 * @param {Object} params - Parameters to pass
 * @param {string} season - Season for execution
 * @returns {Promise<Array>} Rows from procedure or empty array
 */
async function safeProcedure(name, params, season) {
  try {
    const result = await executeProcedure(name, params, season);
    return result.rows || [];
  } catch (error) {
    const message = String(error?.message || '');
    if (message.toLowerCase().includes('could not find stored procedure')) {
      return [];
    }
    throw error;
  }
}

module.exports = {
  createProcedureHandler,
  safeProcedure
};
