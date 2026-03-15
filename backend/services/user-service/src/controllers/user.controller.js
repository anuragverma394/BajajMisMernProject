const { catchAsync } = require('@bajaj/shared');
const userService = require('../services/user.service');
const { asId, asTrimmedString } = require('../validations/common.validation');

exports.AddUserView = (req, res) => res.apiSuccess('User API metadata', { action: 'add-user-view' });
exports.AddUser = (req, res) => res.apiSuccess('User API metadata', { action: 'add-user' });
exports.AddUserByID = (req, res) => res.apiSuccess('User id payload', { sid: req.query.Rid || null });
exports.LabModulePermision = (req, res) => res.apiSuccess('Lab permission endpoint available', {});

exports.GetUserTypes = catchAsync(async (req, res) => {
  const data = await userService.getUserTypes(req.user?.season);
  res.apiSuccess('User types fetched', data);
});

exports.GetUsers = catchAsync(async (req, res) => {
  const filters = {
    id: asTrimmedString(req.query.id, 20),
    unit: asId(req.query.unit || req.query.F_code, 20),
    userType: asTrimmedString(req.query.userType || req.query.UTID, 10),
    userId: asId(req.query.userId || req.query.userid, 50)
  };
  const data = await userService.getUsers(filters, req.user?.season);
  res.apiSuccess('Users fetched', data);
});

exports.insertUser = catchAsync(async (req, res) => {
  await userService.insertUser(req.validatedUserBody || req.body, req.user?.season);
  res.apiSuccess('User saved successfully', null);
});

exports.GetUserDetails = catchAsync(async (req, res) => {
  const { BadRequestError, NotFoundError } = require('@bajaj/shared');
  const userId = asId(req.params.userId, 50);
  if (!userId) {
    throw new BadRequestError('Invalid user id');
  }
  const data = await userService.getUserNameAndFactories(userId, req.user?.season);
  if (!data) throw new NotFoundError('User not found');
  res.apiSuccess('User details fetched', data);
});

exports.UserCodeChanged = catchAsync(async (req, res) => {
  const userId = asId(req.query.Userid || req.body?.Userid, 50);
  const exists = await userService.userCodeChanged(userId, req.user?.season);
  res.apiSuccess('User code check complete', { exists });
});

exports.GetUserDataByFact = catchAsync(async (req, res) => {
  const factId = asId(req.query.F_Name || req.body?.F_Name, 20);
  const data = await userService.getUsersByFactory(factId, req.user?.season);
  res.apiSuccess('Users by factory fetched', data);
});

exports.GetUserDataByFact1 = catchAsync(async (req, res) => {
  const factId = asId(req.query.F_code || req.body?.F_code, 20);
  const data = await userService.getUsersByFactory(factId, req.user?.season);
  res.apiSuccess('Users by factory fetched', data);
});

exports.txtusercode_TextChanged = catchAsync(async (req, res) => {
  const userId = asId(req.query.Userid || req.body?.Userid, 50);
  if (!userId) return res.apiSuccess('User code empty', { exists: false });
  const data = await userService.getUserNameAndFactories(userId, req.user?.season);
  if (!data) return res.apiSuccess('User not found', { exists: false });
  res.apiSuccess('User found', { exists: true, ...data });
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

exports.GetUserFactData = catchAsync(async (req, res) => {
  const { BadRequestError } = require('@bajaj/shared');
  const factId = asId(req.query.fcode || req.body?.fcode, 20);
  if (!factId) throw new BadRequestError('fcode is required');
  const data = await userService.getUserFactData(factId, req.user?.season);
  res.apiSuccess('Factory user data fetched', data);
});

exports.UpsertUser = catchAsync(async (req, res) => {
  const result = await userService.upsertUser(req.validatedUserBody || req.body, req.user?.season);
  const message = req.body.ID ? 'User updated successfully' : 'User created successfully';
  res.apiSuccess(message, result);
});

exports.UpdateLapNotification = catchAsync(async (req, res) => {
  const updated = await userService.updateLabNotificationFlags(req.validatedLabNotifications || [], req.user?.season);
  res.apiSuccess('Lab notification updated', { updated });
});
