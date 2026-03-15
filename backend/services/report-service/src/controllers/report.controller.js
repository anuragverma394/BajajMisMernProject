const { executeQuery, executeProcedure } = require('../core/db/query-executor');
const reportService = require('../services/report.service');
const reportRepository = require('../repositories/report.repository');
const reportControllerRepository = require('../repositories/report.controller.repository');

const CONTROLLER = 'Report';

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Creates a handler that executes a stored procedure
 * @param {string} controller - Controller name for logging
 * @param {string} action - Procedure name to execute
 * @param {string} signature - Signature (for documentation)
 * @returns {Function} Async handler function
 */
function createProcedureHandler(controller, action, signature) {
  return async (req, res, next) => {
    try {
      const season = req.user?.season || req.query?.season || req.body?.season || process.env.DEFAULT_SEASON || '2526';
      const params = { ...(req.query || {}), ...(req.body || {}) };
      const result = await executeProcedure(action, params, season);
      return res.status(200).json({
        success: true,
        message: `${controller}.${action} executed`,
        data: result?.rows || [],
        recordsets: result?.recordsets || []
      });
    } catch (error) {
      if (typeof next === 'function') return next(error);
      throw error;
    }
  };
}

/**
 * Normalizes date input to DD/MM/YYYY format
 * @param {any} raw - Raw date input (string or Date object)
 * @returns {string} Normalized date in DD/MM/YYYY format or empty string
 */
function normalizeDateInput(raw) {
  const value = String(raw || '').trim();
  if (!value) return '';

  // Already in YYYY-MM-DD format
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    const [yyyy, mm, dd] = value.split('-');
    return `${dd}/${mm}/${yyyy}`;
  }

  // Already in DD/MM/YYYY format
  if (/^\d{2}\/\d{2}\/\d{4}$/.test(value)) {
    return value;
  }

  // DD-MM-YYYY format
  if (/^\d{2}-\d{2}-\d{4}$/.test(value)) {
    return value.replace(/-/g, '/');
  }

  // Try parsing as Date object
  const dt = new Date(value);
  if (Number.isNaN(dt.getTime())) return '';
  const dd = String(dt.getDate()).padStart(2, '0');
  const mm = String(dt.getMonth() + 1).padStart(2, '0');
  const yyyy = dt.getFullYear();
  return `${dd}/${mm}/${yyyy}`;
}


/**
 * Converts normalized date to SQL format (YYYY-MM-DD)
 * @param {any} raw - Raw date input
 * @returns {string} SQL formatted date or empty string
 */
function toSqlDate(raw) {
  const value = normalizeDateInput(raw);
  if (!value) return '';
  const [dd, mm, yyyy] = value.split('/');
  return `${yyyy}-${mm}-${dd}`;
}

/**
 * Gets season from request
 * @param {Object} req - Express request object
 * @returns {string} Season value (e.g., '2526')
 */
function getSeason(req) {
  return req.user?.season || req.query?.season || req.body?.season || process.env.DEFAULT_SEASON || '2526';
}

/**
 * Gets factory code from request with multiple key fallbacks
 * @param {Object} req - Express request object
 * @param {...string} keys - Keys to check for factory code
 * @returns {string} Factory code or empty string
 */
function getFactoryCode(req, ...keys) {
  for (const key of keys) {
    const value = req.query?.[key] ?? req.body?.[key];
    if (value !== undefined && value !== null && String(value).trim() !== '' && String(value).trim() !== 'All') {
      return String(value).trim();
    }
  }
  return '';
}

/**
 * Safely executes a stored procedure with error handling
 * @param {string} name - Procedure name
 * @param {Object} params - Parameters to pass
 * @param {string} season - Season for execution
 * @returns {Promise<Array>} Rows from procedure or empty array
 */
async function safeProcedure(name, params, season) {
  try {
    const result = await executeProcedure(name, params, season);
    return result.rows || [];
  } catch (error) {
    const message = String(error?.message || '');
    if (message.toLowerCase().includes('could not find stored procedure')) {
      return [];
    }
    throw error;
  }
}

// ============================================================================
// HANDLERS
// ============================================================================

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

    console.log(`[CrushingReport] Request - Factory: ${F_code}, Date: ${Date}, Season: ${season}`);
    
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
    console.error('[CrushingReport] Error:', error.message);
    return next(error);
  }
};

// Use repository handler to gracefully fall back when stored proc is missing
exports.Imagesblub = reportControllerRepository.Imagesblub;
exports.LOADMODEWISEDATA = async (req, res, next) => {
  try {
    const data = await reportService.loadModeWiseData(req);
    return res.status(200).json({
      success: true,
      message: 'Report.LOADMODEWISEDATA executed',
      data
    });
  } catch (error) {
    if (typeof next === 'function') return next(error);
    throw error;
  }
};
exports.LOADFACTORYDATA = async (req, res, next) => {
  try {
    const data = await reportService.loadFactoryData(req);
    return res.status(200).json({
      success: true,
      message: 'Report.LOADFACTORYDATA executed',
      data
    });
  } catch (error) {
    if (typeof next === 'function') return next(error);
    throw error;
  }
};
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

    console.log(`[Analysisdata] Fetching analysis data for Factory: ${F_code}, Date: ${Date}`);
    const data = await reportService.getAnalysisData(req);
    return res.status(200).json(data);
  } catch (error) {
    console.error('[Analysisdata] Error:', error.message);
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

    console.log(`[CentrePurchase] Request - Factory: ${F_Code}, Date: ${Date}, Season: ${season}`);

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

    console.log(`[CentrePurchase] Parsed dates - From: ${fromDate}, To: ${toDate}`);

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
    console.error('[CentrePurchase] Error:', error.message);
    return next(error);
  }
};

// TruckDispatchWeighed - use handler from repository with full logic
exports.TruckDispatchWeighed = reportControllerRepository.TruckDispatchWeighed;

exports.IndentFailSummary = createProcedureHandler(CONTROLLER, 'IndentFailSummary', '');
exports.IndentFailSummaryData = createProcedureHandler(CONTROLLER, 'IndentFailSummaryData', 'string F_code, string Date');
exports.IndentFaillDetails = createProcedureHandler(CONTROLLER, 'IndentFaillDetails', '');
exports.IndentFaillDetailsData = createProcedureHandler(CONTROLLER, 'IndentFaillDetailsData', 'string Date, string FACT');
exports.TargetActualMISReport = createProcedureHandler(CONTROLLER, 'TargetActualMISReport', '');
exports.TargetActualMISPeriodReport = createProcedureHandler(CONTROLLER, 'TargetActualMISPeriodReport', '');
exports.txtdate_TextChanged = createProcedureHandler(CONTROLLER, 'txtdate_TextChanged', 'string Date');
exports.next = createProcedureHandler(CONTROLLER, 'next', 'string Date');
exports.prev = createProcedureHandler(CONTROLLER, 'prev', 'string Date');
exports.DriageSummary = createProcedureHandler(CONTROLLER, 'DriageSummary', '');
exports.DriageDetail = createProcedureHandler(CONTROLLER, 'DriageDetail', 'string FACT, string DATE, string CENTER');
exports.DriageClerkSummary = createProcedureHandler(CONTROLLER, 'DriageClerkSummary', '');
exports.DriageClerkDetail = createProcedureHandler(CONTROLLER, 'DriageClerkDetail', 'string FACT, string DATE, string CLERK');
exports.DriageCentreDetail = createProcedureHandler(CONTROLLER, 'DriageCentreDetail', 'string FACT, string DATE, string CLERK, string CENTER');
exports.DriageCentreClerkDetail = createProcedureHandler(CONTROLLER, 'DriageCentreClerkDetail', '');
exports.DriageClerkCentreDetail = createProcedureHandler(CONTROLLER, 'DriageClerkCentreDetail', '');
exports.BudgetVSActual = createProcedureHandler(CONTROLLER, 'BudgetVSActual', '');
exports.IndentFailSummaryNew = createProcedureHandler(CONTROLLER, 'IndentFailSummaryNew', '');
exports.IndentFailSummaryNewData = createProcedureHandler(CONTROLLER, 'IndentFailSummaryNewData', 'string F_code, string Date');
exports.HourlyCaneArrival = createProcedureHandler(CONTROLLER, 'HourlyCaneArrival', '');
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
