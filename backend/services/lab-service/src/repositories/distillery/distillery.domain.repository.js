const { executeProcedure } = require('../../core/db/query-executor');

const CONTROLLER = 'DISTILLERY';

async function executeDistilleryProcedure(action, params, season) {
  return executeProcedure(action, params, season);
}

function withProcedure(action) {
  return async (params, season) => executeDistilleryProcedure(action, params, season);
}

module.exports = {
  CONTROLLER,
  executeDistilleryProcedure,
  getCHeavyEthanolReport: withProcedure('CHeavyEthanolReport'),
  createCHeavyEthanolReport: withProcedure('CHeavyEthanolReport'),
  getBHeavyEthanolReport: withProcedure('BHeavyEthanolReport'),
  createBHeavyEthanolReport: withProcedure('BHeavyEthanolReport'),
  getSyrupEthanolReport: withProcedure('SyrupEthanolReport'),
  createSyrupEthanolReport: withProcedure('SyrupEthanolReport')
};
