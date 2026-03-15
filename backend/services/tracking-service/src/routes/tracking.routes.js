const express = require('express');
const controller = require('../controllers/tracking.controller');
const modernController = controller;

const router = express.Router();

router.all('/test', controller.Test);
router.get('/target-entry', modernController.TargetEntry);
router.all('/unit-wise-officer', modernController.UnitWiseOfficer);
router.post('/target-entry-2', modernController.TargetEntry_2);
router.all('/live-location-rpt', modernController.LiveLocationRpt);
router.all('/live-location-rpt-data', modernController.LiveLocationRptData);
router.get('/view-map-live', modernController.ViewMapLive);
router.all('/tracking-map-live', modernController.TrackingMapLive);
router.all('/target-rpt', modernController.TargetRpt);
router.get('/trackinglog', modernController.Trackinglog);
router.all('/trackinglogg', modernController.Trackinglogg);
router.all('/tracking-report', modernController.TrackingReport);
router.all('/tracking-report-data', modernController.TrackingReportData);
router.all('/grower-meeting-report', modernController.GrowerMeetingReport);
router.all('/unit-zone', modernController.UnitZone);
router.all('/unit-zone-block', modernController.UnitZoneBlock);

module.exports = router;
