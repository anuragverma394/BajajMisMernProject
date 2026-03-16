const express = require('express');
const controller = require('../controllers/lab.controller');

const router = express.Router();

router.all('/index', controller.Index || ((req, res) => res.status(200).json({ success: true })));

// Sugar Bag Produced
router.get('/sugar-bag-produced-view', controller.SugarBagProducedView);
router.get('/sugar-bag-produced-add-id', controller.SugarBagProducedAddID);
router.get('/sugar-bag-produced-delete', controller.SugarBagProducedDelete);
router.post('/sugar-bag-produced-add-2', controller.SugarBagProducedAdd_2);

// Daily Lab Analysis
router.get('/daily-lab-analysis-entry', controller.DailyLabAnalysisEntry);
router.get('/daily-lab-analysis-view', controller.DailyLabAnalysisView);
router.get('/daily-lab-analysis-add-delete', controller.DailyLabAnalysisAddDelete);
router.post('/daily-lab-analysis-add-2', controller.DailyLabAnalysisAdd_2);

// Massecuite (A/A1/B/C/C1/R1/R2)
router.get('/amassecuite-view', controller.AMassecuiteView);
router.get('/amassecuite', controller.AMassecuite);
router.get('/amassecuite-upid', controller.AMassecuiteUPId);
router.get('/amassecuite-delete', controller.AMassecuiteDelete);
router.post('/amassecuite-2', controller.AMassecuite_2);

router.get('/a1-massecuite-view', controller.A1MassecuiteView);
router.get('/a1-massecuite', controller.A1Massecuite);
router.get('/a1-massecuite-upid', controller.A1MassecuiteUPId);
router.get('/a1-massecuite-delete', controller.A1MassecuiteDelete);
router.post('/a1-massecuite-2', controller.A1Massecuite_2);

router.get('/bmassecuite-view', controller.BMassecuiteView);
router.get('/bmassecuite', controller.BMassecuite);
router.get('/bmassecuite-upid', controller.BMassecuiteUPId);
router.get('/bmassecuite-delete', controller.BMassecuiteDelete);
router.post('/bmassecuite-2', controller.BMassecuite_2);

router.get('/cmassecuite-view', controller.CMassecuiteView);
router.get('/cmassecuite', controller.CMassecuite);
router.get('/cmassecuite-upid', controller.CMassecuiteUPId);
router.get('/cmassecuite-delete', controller.CMassecuiteDelete);
router.post('/cmassecuite-2', controller.CMassecuite_2);

router.get('/c1-massecuite-view', controller.C1MassecuiteView);
router.get('/c1-massecuite', controller.C1Massecuite);
router.get('/c1-massecuite-upid', controller.C1MassecuiteUPId);
router.get('/c1-massecuite-delete', controller.C1MassecuiteDelete);
router.post('/c1-massecuite-2', controller.C1Massecuite_2);

router.get('/r1-view', controller.R1View);
router.get('/r1', controller.R1);
router.get('/r1-upid', controller.R1UPId);
router.get('/r1-delete', controller.R1Delete);
router.post('/r1-2', controller.R1_2);

router.get('/r2-view', controller.R2View);
router.get('/r2', controller.R2);
router.get('/r2-upid', controller.R2UPId);
router.get('/r2-delete', controller.R2Delete);
router.post('/r2-2', controller.R2_2);

// Molasses Analysis
router.get('/molasses-analysis-view', controller.MolassesAnalysisView);
router.get('/molasses-analysis', controller.MolassesAnalysis);
router.get('/molasses-analysis-upid', controller.MolassesAnalysisUPId);
router.get('/molasses-analysis-delete', controller.MolassesAnalysisDelete);
router.post('/molasses-analysis-2', controller.MolassesAnalysis_2);

// BC Magma
router.get('/bc-magma-view', controller.BcMagmaView);
router.get('/bc-magma', controller.BcMagma);
router.get('/bc-magma-upid', controller.BcMagmaUPId);
router.get('/bc-magma-delete', controller.BcMagmaDelete);
router.post('/bc-magma-2', controller.BcMagma_2);

// Cane Plan
router.get('/add-cane-plan-view', controller.AddCanePlanView);
router.get('/add-cane-plan-id', controller.AddCanePlanID);
router.get('/add-cane-plan-search-id', controller.AddCanePlanSearchID);
router.post('/add-cane-plan-2', controller.AddCanePlan_2);

// Budget
router.get('/add-budgetview', controller.AddBudgetview);
router.get('/add-budget-by-id', controller.AddBudgetById);
router.get('/add-budget-delete', controller.AddBudgetDelete);
router.post('/add-budget-2', controller.AddBudget_2);

// Target vs Actual MIS
router.get('/target-actual-misview', controller.TargetActualMISView);
router.get('/target-actual-mis', controller.TargetActualMISView);
router.get('/taregetvs-actual-mis', controller.TaregetvsActualMIS);
router.post('/taregetvs-actual-mis-2', controller.TaregetvsActualMIS_2);

module.exports = router;
