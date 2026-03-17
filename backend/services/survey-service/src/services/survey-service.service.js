const repository = require('../repositories/survey-service');

async function executeSurveyServiceProcedure({ action, params, season }) {
  return repository.executeSurveyServiceProcedure(action, params, season);
}

module.exports = {
  executeSurveyServiceProcedure
};
