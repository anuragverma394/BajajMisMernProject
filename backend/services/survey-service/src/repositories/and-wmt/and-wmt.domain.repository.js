const { executeProcedure } = require('../../core/db/query-executor');

async function executeAndWmtProcedure(action, params, season) {
  return executeProcedure(action, params, season);
}

module.exports = {
  executeAndWmtProcedure
};
