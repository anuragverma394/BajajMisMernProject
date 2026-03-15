const express = require('express');
const controller = require('../controllers/new-report.controller');

const router = express.Router();

router.get('/target-vs-actual-mis-periodcally-new-sap', controller.TargetVsActualMisPeriodcallyNewSap);
router.all('/target-actual-misdata', controller.TargetActualMISData);
router.all('/target-actual-mis-sap-new', controller.TargetActualMisSapNew);
router.all('/target-actual-misdata-mis', controller.TargetActualMISDataMis);
router.get('/exception-report-master', controller.ExceptionReportMaster);
router.post('/exception-report-master-2', controller.ExceptionReportMaster_2);
router.get('/consecutivegrossweight', controller.CONSECUTIVEGROSSWEIGHT);
router.post('/exception-report', controller.ExceptionReport);
router.all('/export-all-abnormal-weighments', controller.ExportAllAbnormalWeighments);
router.all('/export-excel', controller.ExportExcel);
router.all('/audit-report', controller.AuditReport);
router.all('/load-reason-wise-report', controller.LoadReasonWiseReport);
router.all('/load-audit-report', controller.LoadAuditReport);
router.get('/audit-report-master', controller.AuditReportMaster);
router.post('/audit-report-master-2', controller.AuditReportMaster_2);

module.exports = router;
