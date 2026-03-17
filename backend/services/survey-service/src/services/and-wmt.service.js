const repository = require('../repositories/and-wmt');

async function executeAndWmtProcedure({ action, params, season }) {
  return repository.executeAndWmtProcedure(action, params, season);
}

module.exports = {
  executeAndWmtProcedure
};
