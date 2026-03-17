const { catchAsync } = require('@bajaj/shared');
const userService = require('../../services/user.service');
const { asId, asTrimmedString } = require('../../validations/common.validation');

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

exports.GetUserFactData = catchAsync(async (req, res) => {
  const { BadRequestError } = require('@bajaj/shared');
  const factId = asId(
    req.query.fcode
      || req.body?.fcode
      || req.query.F_code
      || req.body?.F_code
      || req.query.factoryCode
      || req.body?.factoryCode
      || req.query.factId
      || req.body?.factId
      || req.user?.factId,
    20
  );
  if (!factId) throw new BadRequestError('fcode is required');
  const data = await userService.getUserFactData(factId, req.user?.season);
  res.apiSuccess('Factory user data fetched', data);
});
