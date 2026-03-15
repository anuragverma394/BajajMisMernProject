const express = require('express');
const controller = require('../controllers/report-new.controller');

const router = express.Router();

router.all('/hourly-cane-arrival-wieght', controller.HourlyCaneArrivalWieght);
router.all('/indent-purchase-report-new', controller.IndentPurchaseReportNew);
router.post('/indent-purchase-report-new-2', controller.IndentPurchaseReportNew_2);
router.all('/center-indent-purchase-report', controller.CenterIndentPurchaseReport);
router.all('/centre-purchase-truck-report-new', controller.CentrePurchaseTruckReportNew);
router.post('/centre-purchase-truck-report-new-2', controller.CentrePurchaseTruckReportNew_2);
router.all('/zone-centre-wise-truckdetails', controller.ZoneCentreWiseTruckdetails);
router.all('/center-blance-report', controller.CenterBlanceReport);
router.post('/center-blance-report-2', controller.CenterBlanceReport_2);
router.all('/center-bind', controller.centerBind);
router.all('/cane-purchase-report', controller.CanePurchaseReport);
router.post('/cane-purchase-report-2', controller.CanePurchaseReport_2);
router.get('/sample-of-transporter', controller.SampleOfTransporter);
router.post('/sample-of-transporter-2', controller.SampleOfTransporter_2);
router.all('/get-zone-by-factory', controller.GetZoneByFactory);
router.all('/get-transporter-by-factory', controller.GetTransporterByFactory);
router.get('/api-status-report', controller.ApiStatusReport);
router.post('/api-status-report-2', controller.ApiStatusReport_2);
router.all('/api-status-report-resend', controller.ApiStatusReportResend);

module.exports = router;
