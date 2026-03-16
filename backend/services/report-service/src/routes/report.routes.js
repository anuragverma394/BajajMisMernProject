const express = require('express');
const controller = require('../controllers/report.controller');
const reportControllerRepository = require('../repositories/report.controller.repository');

// Fallback: ensure core handlers exist even if controller export is missing
controller.CrushingReport = controller.CrushingReport || reportControllerRepository.CrushingReport;

const router = express.Router();
const handler = (name) => (typeof controller[name] === 'function'
  ? controller[name]
  : (_req, res) => res.status(501).json({ success: false, message: `Handler not implemented: ${name}` }));


router.all('/crushing-report', handler('CrushingReport'));
router.all('/imagesblub', handler('Imagesblub'));
router.all('/loadmodewisedata', handler('LOADMODEWISEDATA'));
router.all('/loadfactorydata', handler('LOADFACTORYDATA'));
router.get('/latest-crushing-date', handler('LatestCrushingDate'));
router.all('/value', handler('Value'));
router.all('/get-yesterdaytransit-detail', handler('GetYesterdaytransitDetail'));
router.all('/get-todaytransit-detail', handler('GetTodaytransitDetail'));
router.get('/analysisdata', handler('Analysisdata'));
router.get('/centre-purchase', handler('CentrePurchase'));
router.all('/truck-dispatch-weighed', handler('TruckDispatchWeighed'));
router.get('/indent-fail-summary', handler('IndentFailSummary'));
router.all('/indent-fail-summary-data', handler('IndentFailSummaryData'));
router.all('/indent-faill-details', handler('IndentFaillDetails'));
router.all('/indent-faill-details-data', handler('IndentFaillDetailsData'));
router.get('/target-actual-misreport', handler('TargetActualMISReport'));
router.all('/target-actual-misperiod-report', handler('TargetActualMISPeriodReport'));
router.all('/txtdate-text-changed', handler('txtdate_TextChanged'));
router.all('/next', handler('next'));
router.all('/prev', handler('prev'));
router.all('/driage-summary', handler('DriageSummary'));
router.all('/driage-detail', handler('DriageDetail'));
router.all('/driage-clerk-summary', handler('DriageClerkSummary'));
router.all('/driage-clerk-detail', handler('DriageClerkDetail'));
router.all('/driage-centre-detail', handler('DriageCentreDetail'));
router.all('/driage-centre-clerk-detail', handler('DriageCentreClerkDetail'));
router.all('/driage-clerk-centre-detail', handler('DriageClerkCentreDetail'));
router.all('/budget-vsactual', handler('BudgetVSActual'));
router.get('/effected-cane-area-report', handler('EffectedCaneAreaReport'));
router.get('/indent-fail-summary-new', handler('IndentFailSummaryNew'));
router.all('/indent-fail-summary-new-data', handler('IndentFailSummaryNewData'));
router.all('/hourly-cane-arrival', handler('HourlyCaneArrival'));
router.get('/centre-code', handler('CentreCode'));
router.post('/centre-code-2', handler('CentreCode_2'));
router.all('/loansummary-rpt', handler('LoansummaryRpt'));
router.post('/loansummary-rpt-2', handler('LoansummaryRpt_2'));
router.get('/survey-plot', handler('SurveyPLot'));
router.post('/survey-plot-2', handler('SurveyPLot_2'));
router.get('/survey-plot-details', handler('SurveyPLotDetails'));
router.all('/getdisease', handler('Getdisease'));
router.all('/disease-details-on-map', handler('DiseaseDetailsOnMap'));
router.all('/disease-details-on-map-todate', handler('DiseaseDetailsOnMapTodate'));
router.all('/suvery-check-plots-on-map-current', handler('SuveryCheckPlotsOnMapCurrent'));
router.get('/checking-log-plots', handler('Checking_logPlots'));
router.post('/checking-log-plots-2', handler('Checking_logPlots_2'));
router.get('/checking-details-on-map', handler('CheckingDetailsOnMap'));
router.get('/disease-details', handler('DiseaseDetails'));
router.get('/summary-report-unit-wise', handler('SummaryReportUnitWise'));
router.post('/summary-report-unit-wise-2', handler('SummaryReportUnitWise_2'));

module.exports = router;