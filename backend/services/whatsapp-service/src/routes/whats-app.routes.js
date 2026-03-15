const express = require('express');
const controller = require('../controllers/whats-app.controller');

const router = express.Router();

router.get('/upload-lab-report', controller.UploadLabReport);
router.post('/upload-lab-report-2', controller.UploadLabReport_2);
router.all('/exceldetail', controller.exceldetail);
router.all('/distillery-report-entry-view-new', controller.distilleryReportEntryViewNew);
router.all('/distillery-report-entry-view-new-r', controller.distilleryReportEntryViewNewR);
router.all('/distillery-report-entry-view', controller.DistilleryReportEntryView);
router.all('/distillery-report-entry-data', controller.DistilleryReportEntryData);
router.get('/actual-variety-wise-area', controller.ActualVarietyWiseArea);

module.exports = router;
