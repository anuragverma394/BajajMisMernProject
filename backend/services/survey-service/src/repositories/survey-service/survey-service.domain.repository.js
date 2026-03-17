const { executeProcedure } = require('../../core/db/query-executor');

async function executeSurveyServiceProcedure(action, params, season) {
  return executeProcedure(action, params, season);
}

module.exports = {
  executeSurveyServiceProcedure
};
