const { catchAsync } = require('@bajaj/shared');
const permissionService = require('../../services/permission.service');
const { asTrimmedString } = require('../../validations/common.validation');

exports.AddUserViewRight = catchAsync(async (req, res) => {
  const filters = {
    command: asTrimmedString(req.query.Commmand || req.body?.Commmand, 20),
    fcode: asTrimmedString(req.query.fcode || req.body?.fcode, 20),
    userid: asTrimmedString(req.query.userid || req.body?.userid, 50)
  };
  const data = await permissionService.getUserRightsView(filters, req.user?.season);
  res.apiSuccess('User permission mapping fetched', data);
});
