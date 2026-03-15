const express = require('express');
const controller = require('../controllers/distillery.controller');

const router = express.Router();

router.all('/index', controller.Index);
router.get('/cheavy-ethanol-report', controller.CHeavyEthanolReport);
router.post('/cheavy-ethanol-report-2', controller.CHeavyEthanolReport_2);
router.get('/bheavy-ethanol-report', controller.BHeavyEthanolReport);
router.post('/bheavy-ethanol-report-2', controller.BHeavyEthanolReport_2);
router.get('/syrup-ethanol-report', controller.SyrupEthanolReport);
router.post('/syrup-ethanol-report-2', controller.SyrupEthanolReport_2);

module.exports = router;
