const express = require('express');
const controller = require('../controllers/survey-report.controller');

const router = express.Router();

router.all('/daily-team-wise-survey-progress-report', controller.DailyTeamWiseSurveyProgressReport);
router.all('/daily-team-wise-hourly-survey-progress-report', controller.DailyTeamWiseHourlySurveyProgressReport);
router.all('/final-village-first-survey-report', controller.FinalVillageFirstSurveyReport);
router.all('/final-village-first-survey-summery-report', controller.FinalVillageFirstSurveySummeryReport);
router.all('/survey-unit-wise-survey-status', controller.SurveyUnitWiseSurveyStatus);
router.all('/survey-unit-wise-survey-area-summary', controller.SurveyUnitWiseSurveyAreaSummary);
router.all('/survey-actual-varietywise', controller.SurveyActualVarietywise);
router.get('/factory-wise-cane-area-report', controller.FactoryWiseCaneAreaReport);
router.get('/plot-wise-details', controller.PlotWiseDetails);
router.get('/category-wise-summary', controller.categoryWiseSummary);
router.all('/category-wise-summary-data', controller.CategoryWiseSummaryData);
router.all('/cane-vierity-village-grower', controller.CaneVierityVillageGrower);
router.all('/weekly-submissionof-autumn-planting-indent', controller.WeeklySubmissionofAutumnPlantingIndent);
router.all('/weekly-submissionof-indents', controller.WeeklySubmissionofIndents);

module.exports = router;
