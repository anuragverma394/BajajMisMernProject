const express = require('express');
const controller = require('../controllers/bajaj-mis-service.controller');

const router = express.Router();

router.get('/get-crush-date', controller.GetCrushDate);
router.all('/gatehourwisecrushingapp', controller.GATEHOURWISECRUSHINGApp);
router.all('/value', controller.Value);
router.all('/send-notification', controller.SendNotification);
router.all('/get-emp-code-for-notification', controller.getEmpCodeForNotification);

module.exports = router;
