const { catchAsync } = require('@bajaj/shared');
const roleService = require('../../services/role.service');
const { asId, asTrimmedString } = require('../../validations/common.validation');

exports.GetRoles = catchAsync(async (req, res) => {
  const data = await roleService.getRoles(
    {
      rollCode: asTrimmedString(req.query.rollCode, 40),
      rollName: asTrimmedString(req.query.rollName, 120)
    },
    req.user?.season
  );
  res.apiSuccess('Roles fetched', data);
});

exports.AddRoll = catchAsync(async (req, res) => {
  const roleCode = asId(req.query.sid, 20);
  if (!roleCode) return res.apiSuccess('Role not found', null);
  const data = await roleService.getRoleByCode(roleCode, req.user?.season);
  if (!data) return res.apiSuccess('Role not found', null);
  res.apiSuccess('Role fetched', data);
});

exports.AddUserRollData = catchAsync(async (req, res) => {
  const roleCode = asId(req.query.R_Code || req.body?.R_Code, 20);
  const data = await roleService.getRolePermissionProjection(roleCode, req.user?.season);
  res.apiSuccess('Role module matrix fetched', data);
});

exports.GetRollModual = catchAsync(async (req, res) => {
  const roleCode = asId(req.query.R_Code || req.body?.R_Code, 20);
  const moduleId = asId(req.query.MID || req.body?.MID, 20);
  const data = await roleService.getRoleModule(roleCode, moduleId, req.user?.season);
  res.apiSuccess('Role module fetched', data);
});

exports.GetRollDataSingle = catchAsync(async (req, res) => {
  const userId = asTrimmedString(req.query.ID || req.body?.ID || '0', 50);
  const factId = asId(req.query.factid || req.body?.factid, 20);
  const data = await roleService.getRoleDataSingle(userId, factId, req.user?.season);
  res.apiSuccess('Role selection matrix fetched', data);
});

exports.RollModualData = catchAsync(async (req, res) => {
  const userId = asId(req.query.ID || req.body?.ID, 50);
  const factId = asId(req.query.factid || req.body?.factid || req.query.r_code || req.body?.r_code, 20);
  const roleCodes = req.validatedRoleCodes || [];
  const data = await roleService.getRoleModuleData(userId, factId, roleCodes, req.user?.season);
  res.apiSuccess('Role module data fetched', data);
});

exports.RollDetailData = catchAsync(async (req, res) => {
  const roleCodes = req.validatedRoleCodes || [];
  const data = await roleService.getRoleDetailData(roleCodes, req.user?.season);
  res.apiSuccess('Role detail data fetched', data);
});
