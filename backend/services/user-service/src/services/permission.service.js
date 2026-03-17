const { executeInTransaction, withSeason } = require('../core/db/mssql');
const permissionRepository = require('../repositories/permission');

async function getUserRightsView(filters, seasonValue) {
  return permissionRepository.getUserRightsView(filters, withSeason(seasonValue));
}

async function assignUserRights(payload, seasonValue) {
  const season = withSeason(seasonValue);
  return executeInTransaction(season, async (transaction) => {
    await permissionRepository.replaceUserRights(payload, season, { transaction });
  });
}

module.exports = {
  getUserRightsView,
  assignUserRights
};
