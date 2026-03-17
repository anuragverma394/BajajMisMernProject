const { catchAsync } = require('@bajaj/shared');
const permissionService = require('../../services/permission.service');

exports.AddUserRightInsert = catchAsync(async (req, res) => {
  await permissionService.assignUserRights(req.validatedPermissionBody || req.body, req.user?.season);
  res.apiSuccess('User rights saved successfully', null);
});
