const { catchAsync } = require('@bajaj/shared');
const userService = require('../../services/user.service');
const { asId } = require('../../validations/common.validation');

exports.UserCodeChanged = catchAsync(async (req, res) => {
  const userId = asId(req.query.Userid || req.body?.Userid, 50);
  const exists = await userService.userCodeChanged(userId, req.user?.season);
  res.apiSuccess('User code check complete', { exists });
});

exports.txtusercode_TextChanged = catchAsync(async (req, res) => {
  const userId = asId(req.query.Userid || req.body?.Userid, 50);
  if (!userId) return res.apiSuccess('User code empty', { exists: false });
  const data = await userService.getUserNameAndFactories(userId, req.user?.season);
  if (!data) return res.apiSuccess('User not found', { exists: false });
  res.apiSuccess('User found', { exists: true, ...data });
});
