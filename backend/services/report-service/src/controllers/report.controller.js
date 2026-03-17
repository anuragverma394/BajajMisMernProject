  const reportService = require('../services/report.service');
const reportRepository = require('../repositories/report.repository');
const reportControllerRepository = require('../repositories/report.controller.repository');
const { createProcedureHandler, safeProcedure } = require('../utils/procedure-utils');
const { getSeason, getFactoryCode } = require('../utils/request-utils');const { logInfo, logError } = require('../utils/logger');

const CONTROLLER = 'Report';

// ============================================================================
// HANDLERS
// ============================================================================

exports.CrushingReport = async (req, res, next) => {
  try {
    const F_code = req.query?.F_code || req.body?.F_code;
    const Date = req.query?.Date || req.body?.Date;
    const season = getSeason(req);

    if (!F_code || !Date) {
      return res.status(400).json({
        success: false,
        message: 'Missing required parameters: F_code and Date',
        data: null
      });
    }

    logInfo(`[CrushingReport] Request - Factory: ${F_code}, Date: ${Date}, Season: ${season}`);
    
    const data = await reportRepository.getCrushingReportData(
      { factCode: F_code, date: Date },
      season
    );
    
    return res.status(200).json({
      success: true,
      message: 'Crushing report data retrieved',
      data: data
    });
  } catch (error) {
    logError('[CrushingReport] Error:', error.message);
    return next(error);
  }
};

// Use stored procedure handler for Imagesblub (repository does not export it)
exports.Imagesblub = createProcedureHandler(CONTROLLER, 'Imagesblub', '');
// Crushing report data should use the exact SQL mirror for consistency with BajajMIS
exports.LOADMODEWISEDATA = reportControllerRepository.CrushingReport;
exports.LOADFACTORYDATA = reportControllerRepository.CrushingReport;
exports.LatestCrushingDate = async (req, res, next) => {
  try {
    const date = await reportService.getLatestCrushingDate(req);
    return res.status(200).json({
      success: true,
      message: 'Report.LatestCrushingDate executed',
      data: { date }
    });
  } catch (error) {
    if (typeof next === 'function') return next(error);
    throw error;
  }
};
exports.Value = createProcedureHandler(CONTROLLER, 'Value', 'string a');
exports.GetYesterdaytransitDetail = createProcedureHandler(CONTROLLER, 'GetYesterdaytransitDetail', '');
exports.GetTodaytransitDetail = createProcedureHandler(CONTROLLER, 'GetTodaytransitDetail', '');

exports.Analysisdata = async (req, res, next) => {
  try {
    const { F_code, Date } = req.query;
    
    if (!F_code) {
      return res.status(400).json({ 
        error: 'Missing required parameter: F_code (Factory Code)' 
      });
    }
    if (!Date) {
      return res.status(400).json({ 
        error: 'Missing required parameter: Date' 
      });
    }

    logInfo(`[Analysisdata] Fetching analysis data for Factory: ${F_code}, Date: ${Date}`);
    const data = await reportService.getAnalysisData(req);
    return res.status(200).json(data);
  } catch (error) {
    logError('[Analysisdata] Error:', error.message);
    return next(error);
  }
};

exports.CentrePurchase = async (req, res, next) => {
  try {
    const { F_Code, Date } = req.query;
    const season = getSeason(req);

    if (!F_Code || !Date) {
      return res.status(400).json({
        success: false,
        message: 'Missing required parameters: F_Code and Date',
        data: null
      });
    }

    logInfo(`[CentrePurchase] Request - Factory: ${F_Code}, Date: ${Date}, Season: ${season}`);

    // Parse and format date properly
    let fromDate = '';
    let toDate = '';
    
    if (Date) {
      if (Date.includes('/')) {
        // DD/MM/YYYY format
        const parts = Date.split('/');
        if (parts.length === 3) {
          fromDate = `${parts[2]}-${parts[1]}-${parts[0]}`;
          toDate = fromDate;
        }
      } else if (Date.includes('-')) {
        // Could be DD-MM or DD-MM-YYYY
        const parts = Date.split('-');
        if (parts.length === 2) {
          // DD-MM format, assume current season year
          const year = season.substring(0, 2) === '25' ? '2025' : '2026';
          fromDate = `${year}-${parts[1]}-${parts[0]}`;
          toDate = fromDate;
        } else if (parts.length === 3) {
          // DD-MM-YYYY format
          fromDate = `${parts[2]}-${parts[1]}-${parts[0]}`;
          toDate = fromDate;
        }
      }
    }

    logInfo(`[CentrePurchase] Parsed dates - From: ${fromDate}, To: ${toDate}`);

    const data = await reportRepository.getCentreCode(
      { fCode: F_Code, fromDate, toDate },
      season
    );

    return res.status(200).json({
      success: true,
      message: 'Centre purchase data retrieved',
      data: data
    });
  } catch (error) {
    logError('[CentrePurchase] Error:', error.message);
    return next(error);
  }
};

// TruckDispatchWeighed - use handler from repository with full logic
exports.TruckDispatchWeighed = reportControllerRepository.TruckDispatchWeighed;

// IndentFailSummary - use handler from repository with full logic (no stored proc)
exports.IndentFailSummary = reportControllerRepository.IndentFailSummary;
exports.IndentFailSummaryData = reportControllerRepository.IndentFailSummaryData;
exports.IndentFaillDetails = createProcedureHandler(CONTROLLER, 'IndentFaillDetails', '');
exports.IndentFaillDetailsData = createProcedureHandler(CONTROLLER, 'IndentFaillDetailsData', 'string Date, string FACT');
exports.TargetActualMISReport = createProcedureHandler(CONTROLLER, 'TargetActualMISReport', '');
exports.TargetActualMISPeriodReport = createProcedureHandler(CONTROLLER, 'TargetActualMISPeriodReport', '');
exports.txtdate_TextChanged = createProcedureHandler(CONTROLLER, 'txtdate_TextChanged', 'string Date');
exports.next = createProcedureHandler(CONTROLLER, 'next', 'string Date');
exports.prev = createProcedureHandler(CONTROLLER, 'prev', 'string Date');
// DriageSummary - use handler from repository with full logic (no stored proc)
exports.DriageSummary = reportControllerRepository.DriageSummary;
// DriageDetail - use handler from repository with full logic (no stored proc)
exports.DriageDetail = reportControllerRepository.DriageDetail;
// DriageClerkSummary - use handler from repository with full logic (no stored proc)
exports.DriageClerkSummary = reportControllerRepository.DriageClerkSummary;
// DriageClerkDetail - use handler from repository with full logic (no stored proc)
exports.DriageClerkDetail = reportControllerRepository.DriageClerkDetail;
// DriageCentreDetail - use handler from repository with full logic (no stored proc)
exports.DriageCentreDetail = reportControllerRepository.DriageCentreDetail;
// DriageCentreClerkDetail - use handler from repository with full logic (no stored proc)
exports.DriageCentreClerkDetail = reportControllerRepository.DriageCentreClerkDetail;
// DriageClerkCentreDetail - use handler from repository with full logic (no stored proc)
exports.DriageClerkCentreDetail = reportControllerRepository.DriageClerkCentreDetail;
// BudgetVSActual - use handler from repository with full logic (no stored proc)
exports.BudgetVSActual = reportControllerRepository.BudgetVSActual;
exports.IndentFailSummaryNew = createProcedureHandler(CONTROLLER, 'IndentFailSummaryNew', '');
exports.IndentFailSummaryNewData = createProcedureHandler(CONTROLLER, 'IndentFailSummaryNewData', 'string F_code, string Date');
exports.HourlyCaneArrival = reportControllerRepository.HourlyCaneArrival;
exports.LoansummaryRpt = createProcedureHandler(CONTROLLER, 'LoansummaryRpt', '');
exports.LoansummaryRpt_2 = createProcedureHandler(CONTROLLER, 'LoansummaryRpt', 'LoanSummaryModel model');
exports.SurveyPLot = createProcedureHandler(CONTROLLER, 'SurveyPLot', '');
exports.SurveyPLot_2 = createProcedureHandler(CONTROLLER, 'SurveyPLot', 'Surveyplot model, string Command');
exports.SurveyPLotDetails = createProcedureHandler(CONTROLLER, 'SurveyPLotDetails', '');
exports.DiseaseDetailsOnMap = createProcedureHandler(CONTROLLER, 'DiseaseDetailsOnMap', 'string usercode, string Factorycode, string Disease, string FromDate, string ToDate, string PlotType');
exports.DiseaseDetailsOnMapTodate = createProcedureHandler(CONTROLLER, 'DiseaseDetailsOnMapTodate', 'string usercode, string Factorycode, string Disease, string ToDate, string PlotType');
exports.SuveryCheckPlotsOnMapCurrent = createProcedureHandler(CONTROLLER, 'SuveryCheckPlotsOnMapCurrent', 'string usercode, string Factorycode, string FromDate, string ToDate, string PlotType');
exports.Checking_logPlots = createProcedureHandler(CONTROLLER, 'Checking_logPlots', 'string F_code, string UserCode, string PlotType, string Flag, string fromdate, string todate');
exports.Checking_logPlots_2 = createProcedureHandler(CONTROLLER, 'Checking_logPlots', 'Checking_logPlotsModel model, string Command');
exports.CheckingDetailsOnMap = createProcedureHandler(CONTROLLER, 'CheckingDetailsOnMap', 'string usercode, string Factorycode, string PlotType, string FromDate, string ToDate');
exports.DiseaseDetails = createProcedureHandler(CONTROLLER, 'DiseaseDetails', 'string F_code, string UserCode, string PlotType, string Flag, string todate');

exports.EffectedCaneAreaReport = async (req, res, next) => {
  try {
    const season = getSeason(req);
    const fCode = getFactoryCode(req, 'F_code', 'factoryCode', 'F_Code');
    const caneArea = String(req.query.CaneArea || req.body?.CaneArea || '1').trim();
    const stateDropdown = String(req.query.stateDropdown || req.body?.stateDropdown || '').trim();

    const procedure = caneArea === '2' ? 'mis_rptGASHTIAmity1' : 'mis_rpt1';
    const rows = await safeProcedure(procedure, { fact: fCode, state: stateDropdown }, season);
    const data = rows.map((row) => ({
      F_code: Number(row.F_code || row.f_code || 0),
      V_Code: Number(row.V_Code || row.v_code || 0),
      V_Name: String(row.V_Name || row.v_name || ''),
      CaneArea: Number(row.CaneArea || row.caneArea || 0),
      EffectedArea: Number(row.EffectedCaneArea || row.EffectedArea || row.effectedArea || 0),
      EffectedCaneArea: Number(row.EffectedCaneArea || row.EffectedArea || row.effectedArea || 0),
      Percent: Number(row.Percent || row.percent || 0),
      Remarks: Number(row.EffectedCaneArea || row.EffectedArea || row.effectedArea || 0) > 0 ? 'Critical Impact Noted' : 'No critical impact'
    }));

    return res.status(200).json({ success: true, data });
  } catch (error) {
    return next(error);
  }
};

exports.CentreCode = async (req, res, next) => {
  try {
    const data = await reportService.getCentreCode(req);
    return res.status(200).json({ success: true, message: 'Centre code report', data });
  } catch (error) {
    return next(error);
  }
};

exports.CentreCode_2 = exports.CentreCode;

exports.Getdisease = async (req, res, next) => {
  try {
    const data = await reportService.getDiseaseList(req);
    return res.status(200).json({ success: true, message: 'Disease list', data });
  } catch (error) {
    return next(error);
  }
};

exports.SummaryReportUnitWise = async (req, res, next) => {
  try {
    const data = await reportService.getSummaryReportUnitWise(req);
    return res.status(200).json({ success: true, message: 'Summary report unit wise', data });
  } catch (error) {
    return next(error);
  }
};

exports.SummaryReportUnitWise_2 = exports.SummaryReportUnitWise;
