const { catchAsync } = require('@bajaj/shared');
const roleService = require('../../services/role.service');

exports.AddRoll_2 = catchAsync(async (req, res) => {
  await roleService.upsertRole(req.validatedRoleBody || req.body, req.user?.season);
  res.apiSuccess('Role saved successfully', null);
});
