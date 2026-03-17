const { executeInTransaction, withSeason } = require('../core/db/mssql');
const roleRepository = require('../repositories/role');

async function getRoles(filters, seasonValue) {
  return roleRepository.getRoles(filters, withSeason(seasonValue));
}

async function getRoleByCode(roleCode, seasonValue) {
  return roleRepository.getRoleByCode(roleCode, withSeason(seasonValue));
}

async function upsertRole(payload, seasonValue) {
  const season = withSeason(seasonValue);
  return executeInTransaction(season, async (transaction) => {
    const options = { transaction };
    if (payload.command === 'btninsert') {
      const exists = await roleRepository.roleExists(payload.R_Code, season, options);
      if (exists) {
        const error = new Error(`Role ${payload.R_Code} already exists`);
        error.statusCode = 409;
        throw error;
      }
    }
    await roleRepository.replaceRolePermissions(payload.R_Code, payload.R_Name, payload.permissions, season, options);
  });
}

async function getRolePermissionProjection(roleCode, seasonValue) {
  return roleRepository.getRolePermissionProjection(roleCode, withSeason(seasonValue));
}

async function getRoleModule(roleCode, moduleId, seasonValue) {
  return roleRepository.getRoleModule(roleCode, moduleId, withSeason(seasonValue));
}

async function getRoleDataSingle(userId, factId, seasonValue) {
  return roleRepository.getRoleDataSingle(String(userId || '0'), String(factId || ''), withSeason(seasonValue));
}

async function getRoleModuleData(userId, factId, roleCodes, seasonValue) {
  return roleRepository.getRoleModuleData(String(userId || ''), String(factId || ''), roleCodes || [], withSeason(seasonValue));
}

async function getRoleDetailData(roleCodes, seasonValue) {
  return roleRepository.getRoleDetailData(roleCodes || [], withSeason(seasonValue));
}

module.exports = {
  getRoles,
  getRoleByCode,
  upsertRole,
  getRolePermissionProjection,
  getRoleModule,
  getRoleDataSingle,
  getRoleModuleData,
  getRoleDetailData
};
