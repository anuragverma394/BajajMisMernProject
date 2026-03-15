const express = require('express');
const controller = require('../controllers/account-reports.controller');

const router = express.Router();

router.all('/index', controller.Index);
router.get('/variety-wise-cane-purchase', controller.VarietyWiseCanePurchase);
router.post('/variety-wise-cane-purchase-2', controller.VarietyWiseCanePurchase_2);
router.get('/capasityutilisation', controller.Capasityutilisation);
router.post('/capasityutilisation-2', controller.Capasityutilisation_2);
router.get('/cane-qtyand-sugar-capacity', controller.CaneQtyandSugarCapacity);
router.post('/cane-qtyand-sugar-capacity-2', controller.CaneQtyandSugarCapacity_2);
router.get('/capasityutilisation-fromdate', controller.CapasityutilisationFromdate);
router.post('/capasityutilisation-fromdate-2', controller.CapasityutilisationFromdate_2);
router.get('/transferand-recieved-unit', controller.TransferandRecievedUnit);
router.post('/transferand-recieved-unit-2', controller.TransferandRecievedUnit_2);
router.all('/deletedata', controller.DELETEData);
router.get('/sugar-report', controller.SugarReport);
router.post('/sugar-report-2', controller.SugarReport_2);
router.get('/cogen-report', controller.CogenReport);
router.post('/cogen-report-2', controller.CogenReport_2);
router.get('/distilleryreport', controller.DISTILLERYReport);
router.post('/distilleryreport-2', controller.DISTILLERYReport_2);
router.get('/distillery-report-a', controller.DistilleryReportA);
router.post('/distillery-report-a-2', controller.DistilleryReportA_2);
router.get('/variety-wise-cane-purchase-amt', controller.VarietyWiseCanePurchaseAmt);
router.all('/variety-wise-cane-purchase-amt-2', controller.VarietyWiseCanePurchaseAmt_2);

module.exports = router;
