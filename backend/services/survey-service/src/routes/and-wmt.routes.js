const express = require('express');
const controller = require('../controllers/and-wmt.controller');

const router = express.Router();

router.get('/get-setting', controller.GetSetting);
router.get('/opr', controller.OPR);
router.get('/pregrs', controller.PREGRS);
router.get('/grs', controller.GRS);
router.get('/pretre', controller.PRETRE);
router.get('/tre', controller.TRE);
router.get('/clg', controller.CLG);
router.get('/dps', controller.DPS);
router.get('/masters-data', controller.MastersData);
router.get('/grower-data', controller.GrowerData);
router.get('/village-data', controller.VillageData);
router.get('/issued-data', controller.IssuedData);
router.get('/variety-data', controller.VarietyData);
router.get('/cene-type-data', controller.CeneTypeData);
router.get('/variety-control', controller.VarietyControl);
router.get('/mode', controller.Mode);
router.get('/purchy-format', controller.PurchyFormat);
router.get('/purchy-quality', controller.PurchyQuality);

module.exports = router;
