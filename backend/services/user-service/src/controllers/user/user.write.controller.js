const { catchAsync } = require('@bajaj/shared');
const userService = require('../../services/user.service');
const { asId, asTrimmedString } = require('../../validations/common.validation');

exports.insertUser = catchAsync(async (req, res) => {
  await userService.insertUser(req.validatedUserBody || req.body, req.user?.season);
  res.apiSuccess('User saved successfully', null);
});

exports.UpsertUser = catchAsync(async (req, res) => {
  const result = await userService.upsertUser(req.validatedUserBody || req.body, req.user?.season);
  const message = req.body.ID ? 'User updated successfully' : 'User created successfully';
  res.apiSuccess(message, result);
});

exports.btndelete_Click = catchAsync(async (req, res) => {
  const { BadRequestError } = require('@bajaj/shared');
  const id = asTrimmedString(req.query.id || req.body?.id, 20);
  const userId = asId(req.query.Userid || req.body?.Userid, 50);
  if (!id || !userId) {
    throw new BadRequestError('id and Userid are required');
  }
  await userService.deleteUser(id, userId, req.user?.season);
  res.apiSuccess('User deleted successfully', null);
});

exports.UpdateLapNotification = catchAsync(async (req, res) => {
  const updated = await userService.updateLabNotificationFlags(req.validatedLabNotifications || [], req.user?.season);
  res.apiSuccess('Lab notification updated', { updated });
});
