const express = require('express');
const { requireAuth, validate } = require('@bajaj/shared');
const userController = require('../controllers/user.controller');
const roleController = require('../controllers/role.controller');
const permissionController = require('../controllers/permission.controller');
const { validateUpsertUser, validateUpdateLabNotification } = require('../validations/user.validation');
const { validateUpsertRole, validateRoleCodeList } = require('../validations/role.validation');
const { validateAssignPermissions } = require('../validations/permission.validation');

const router = express.Router();

router.use(requireAuth);

router.get('/user-types', userController.GetUserTypes);
router.get('/users', userController.GetUsers);
router.post('/users', validate(validateUpsertUser), userController.UpsertUser);
router.get('/roles', roleController.GetRoles);
router.get('/user-details/:userId', userController.GetUserDetails);

router.get('/add-user-view', userController.AddUserView);
router.get('/add-user', userController.AddUser);
router.all('/user-code-changed', userController.UserCodeChanged);
router.all('/add-roll-view', roleController.AddRollView);
router.all('/add-user-by-id', userController.AddUserByID);
router.all('/add-roll-id', roleController.AddRollID);
router.get('/add-roll', roleController.AddRoll);
router.post('/add-roll-2', validate(validateUpsertRole), roleController.AddRoll_2);
router.all('/add-user-roll-data', roleController.AddUserRollData);
router.all('/get-roll-modual', roleController.GetRollModual);
router.all('/get-user-data-by-fact', userController.GetUserDataByFact);
router.all('/get-user-data-by-fact1', userController.GetUserDataByFact1);
router.all('/add-user-view-right', permissionController.AddUserViewRight);
router.all('/add-user-right', permissionController.AddUserRight);
router.all('/txtusercode-text-changed', userController.txtusercode_TextChanged);
router.all('/get-roll-data-single', roleController.GetRollDataSingle);
router.all('/roll-modual-data', validate(validateRoleCodeList), roleController.RollModualData);
router.all('/roll-detail-data', validate(validateRoleCodeList), roleController.RollDetailData);
router.post('/add-user-right-insert', validate(validateAssignPermissions), permissionController.AddUserRightInsert);
router.all('/btndelete-click', userController.btndelete_Click);
router.all('/lab-module-permision', userController.LabModulePermision);
router.all('/get-user-fact-data', userController.GetUserFactData);
router.post('/update-lap-notification', validate(validateUpdateLabNotification), userController.UpdateLapNotification);

module.exports = router;
