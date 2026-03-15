const express = require('express');
const { requireAuth } = require('@bajaj/shared');
const controller = require('../controllers/account.controller');

const router = express.Router();

router.get('/login', controller.Login);
router.post('/login', controller.Login_2);
router.post('/login-2', controller.Login_2);
router.get('/convert-login-id', controller.ConvertLoginId);

router.get('/change-password', requireAuth, controller.ChangePassword);
router.post('/change-password-2', requireAuth, controller.ChangePassword_2);
router.post('/change-password', requireAuth, controller.ChangePassword_2);
router.post('/logout', requireAuth, controller.Logout);

router.get('/page-load', requireAuth, controller.PageLoad);
router.get('/check-page-vald', requireAuth, controller.CheckPageVald);
router.get('/manage-tbl-control', requireAuth, controller.ManageTblControl);
router.post('/update-date', requireAuth, controller.UpdateDate);
router.post('/migrate-passwords', requireAuth, controller.MigratePasswords);
router.post('/verify', requireAuth, controller.Verify);

module.exports = router;
