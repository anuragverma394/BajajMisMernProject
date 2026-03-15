const { executeProcedure } = require('../core/db/query-executor');
const service = require('../services/new-report.service');

const CONTROLLER = 'NewReport';

// Utility: Get season from request
function getSeason(req) {
  return req.user?.season || req.query?.season || req.body?.season || process.env.DEFAULT_SEASON || '2526';
}

// Utility: Get factory code from request
function getFactoryCode(req, ...keys) {
  for (const key of keys) {
    const value = req.query?.[key] ?? req.body?.[key];
    if (value !== undefined && value !== null && String(value).trim() !== '') {
      return String(value).trim();
    }
  }
  return '';
}

// Utility: Error logging
function logError(scope, req, error, extra = {}) {
  console.error(`[${CONTROLLER}.${scope}] Error:`, {
    scope,
    method: req.method,
    url: req.originalUrl,
    userId: req.user?.userId,
    season: getSeason(req),
    ...extra,
    message: error?.message
  });
}

// GET: Target vs Actual MIS Periodically New SAP
exports.TargetVsActualMisPeriodcallyNewSap = async (req, res, next) => {
  try {
    const season = getSeason(req);
    const data = await service.getTargetVsActualMisPeriodically(season);
    return res.status(200).json({ success: true, message: 'Target vs Actual MIS (Periodic) data', data });
  } catch (error) {
    logError('TargetVsActualMisPeriodcallyNewSap', req, error);
    return next(error);
  }
};

// GET: Target Actual MIS Data
exports.TargetActualMISData = async (req, res, next) => {
  try {
    const season = getSeason(req);
    const F_Name = getFactoryCode(req, 'F_Name', 'FactoryName', 'F_Code');
    const Date = req.query?.Date || req.body?.Date || '';
    const Todate = req.query?.Todate || req.body?.Todate || Date;
    
    if (!F_Name) {
      return res.status(400).json({ success: false, message: 'Factory name is required' });
    }
    
    const data = await service.getTargetActualMISData(F_Name, Date, Todate, season);
    return res.status(200).json({ success: true, message: 'Target/Actual MIS data', data });
  } catch (error) {
    logError('TargetActualMISData', req, error, { F_Name: getFactoryCode(req, 'F_Name'), Date: req.query?.Date });
    return next(error);
  }
};

// GET: Target Actual MIS SAP New
exports.TargetActualMisSapNew = async (req, res, next) => {
  try {
    const season = getSeason(req);
    const data = await service.getTargetActualMisSapNew(season);
    return res.status(200).json({ success: true, message: 'Target/Actual MIS SAP (New) data', data });
  } catch (error) {
    logError('TargetActualMisSapNew', req, error);
    return next(error);
  }
};

// GET: Target Actual MIS Data MIS
exports.TargetActualMISDataMis = async (req, res, next) => {
  try {
    const season = getSeason(req);
    const F_Name = getFactoryCode(req, 'F_Name', 'FactoryName', 'F_Code');
    const CP_Date = req.query?.CP_Date || req.body?.CP_Date || '';
    
    if (!F_Name) {
      return res.status(400).json({ success: false, message: 'Factory name is required' });
    }
    
    const data = await service.getTargetActualMISDataMis(F_Name, CP_Date, season);
    return res.status(200).json({ success: true, message: 'Target/Actual MIS data (MIS)', data });
  } catch (error) {
    logError('TargetActualMISDataMis', req, error, { F_Name: getFactoryCode(req, 'F_Name'), CP_Date: req.query?.CP_Date });
    return next(error);
  }
};

// GET: Exception Report Master
exports.ExceptionReportMaster = async (req, res, next) => {
  try {
    const season = getSeason(req);
    const data = await service.getExceptionReportMaster(season);
    return res.status(200).json({ success: true, message: 'Exception report master', data });
  } catch (error) {
    logError('ExceptionReportMaster', req, error);
    return next(error);
  }
};

// POST: Exception Report Master (Create/Update)
exports.ExceptionReportMaster_2 = async (req, res, next) => {
  try {
    const { Command = 'Insert', ...model } = req.body;
    const result = await service.mutateExceptionReportMaster(model, Command);
    if (result.error) {
      return res.status(result.status || 400).json({ success: false, message: result.message });
    }
    return res.status(201).json({ success: true, message: `${Command} completed`, data: result.data });
  } catch (error) {
    logError('ExceptionReportMaster_2', req, error, { Command: req.body?.Command });
    return next(error);
  }
};

// GET: Consecutive Gross Weight
exports.CONSECUTIVEGROSSWEIGHT = async (req, res, next) => {
  try {
    const season = getSeason(req);
    const data = await service.getConsecutiveGrossWeight(season);
    return res.status(200).json({ success: true, message: 'Consecutive gross weight data', data });
  } catch (error) {
    logError('CONSECUTIVEGROSSWEIGHT', req, error);
    return next(error);
  }
};

// POST: Exception Report (with export)
exports.ExceptionReport = async (req, res, next) => {
  try {
    const { selectedIds = [], userid = '', downloadToken = '', ...model } = req.body;
    
    const result = await service.getExceptionReport(model, selectedIds, userid, downloadToken);
    if (result.error) {
      return res.status(result.status || 400).json({ success: false, message: result.message });
    }
    
    return res.status(200).json({
      success: true,
      message: 'Exception report generated',
      data: result.data,
      downloadUrl: result.downloadUrl
    });
  } catch (error) {
    logError('ExceptionReport', req, error, { selectedIds: req.body?.selectedIds?.length || 0 });
    return next(error);
  }
};

// POST: Export All Abnormal Weighments
exports.ExportAllAbnormalWeighments = async (req, res, next) => {
  try {
    const { factoryCode, factoryName, dateFrom, dateTo } = req.query;
    
    if (!factoryCode || !dateFrom || !dateTo) {
      return res.status(400).json({ 
        success: false, 
        message: 'factoryCode, dateFrom, and dateTo are required' 
      });
    }
    
    const result = await service.exportAllAbnormalWeighments(factoryCode, factoryName, dateFrom, dateTo);
    if (result.error) {
      return res.status(result.status || 400).json({ success: false, message: result.message });
    }
    
    return res.status(200).json({
      success: true,
      message: 'Export generated',
      data: result.data,
      downloadUrl: result.downloadUrl,
      fileName: result.fileName
    });
  } catch (error) {
    logError('ExportAllAbnormalWeighments', req, error, { 
      factoryCode: req.query?.factoryCode,
      dateFrom: req.query?.dateFrom,
      dateTo: req.query?.dateTo
    });
    return next(error);
  }
};

// POST: Export Excel
exports.ExportExcel = async (req, res, next) => {
  try {
    const { selectedIds = [], factoryCode, factoryName, dateFrom, dateTo, downloadToken = '' } = req.body;
    
    if (!factoryCode || !dateFrom || !dateTo) {
      return res.status(400).json({
        success: false,
        message: 'factoryCode, dateFrom, and dateTo are required'
      });
    }
    
    const result = await service.exportToExcel(selectedIds, factoryCode, factoryName, dateFrom, dateTo, downloadToken);
    if (result.error) {
      return res.status(result.status || 400).json({ success: false, message: result.message });
    }
    
    return res.status(200).json({
      success: true,
      message: 'Excel export generated',
      data: result.data,
      downloadUrl: result.downloadUrl,
      fileName: result.fileName
    });
  } catch (error) {
    logError('ExportExcel', req, error, { 
      selectedIds: req.body?.selectedIds?.length || 0,
      factoryCode: req.body?.factoryCode
    });
    return next(error);
  }
};

// POST: Audit Report (with export)
exports.AuditReport = async (req, res, next) => {
  try {
    const { selectedIds = [], factoryCode, factoryName, dateFrom, dateTo, downloadToken = '' } = req.body;
    
    if (!factoryCode || !dateFrom || !dateTo) {
      return res.status(400).json({
        success: false,
        message: 'factoryCode, dateFrom, and dateTo are required'
      });
    }
    
    const result = await service.getAuditReport(selectedIds, factoryCode, factoryName, dateFrom, dateTo, downloadToken);
    if (result.error) {
      return res.status(result.status || 400).json({ success: false, message: result.message });
    }
    
    return res.status(200).json({
      success: true,
      message: 'Audit report generated',
      data: result.data,
      downloadUrl: result.downloadUrl
    });
  } catch (error) {
    logError('AuditReport', req, error, { 
      selectedIds: req.body?.selectedIds?.length || 0,
      factoryCode: req.body?.factoryCode
    });
    return next(error);
  }
};

// GET: Load Reason Wise Report
exports.LoadReasonWiseReport = async (req, res, next) => {
  try {
    const fcode = getFactoryCode(req, 'fcode', 'Fcode', 'F_Code');
    if (!fcode) {
      return res.status(400).json({ success: false, message: 'Factory code is required' });
    }
    
    const data = await service.getReasonWiseReport(fcode);
    return res.status(200).json({ success: true, message: 'Reason-wise report loaded', data });
  } catch (error) {
    logError('LoadReasonWiseReport', req, error, { fcode: getFactoryCode(req, 'fcode') });
    return next(error);
  }
};

// GET: Load Audit Report
exports.LoadAuditReport = async (req, res, next) => {
  try {
    const fcode = getFactoryCode(req, 'fcode', 'Fcode', 'F_Code');
    if (!fcode) {
      return res.status(400).json({ success: false, message: 'Factory code is required' });
    }
    
    const data = await service.getLoadAuditReport(fcode);
    return res.status(200).json({ success: true, message: 'Audit report loaded', data });
  } catch (error) {
    logError('LoadAuditReport', req, error, { fcode: getFactoryCode(req, 'fcode') });
    return next(error);
  }
};

// GET: Audit Report Master
exports.AuditReportMaster = async (req, res, next) => {
  try {
    const season = getSeason(req);
    const data = await service.getAuditReportMaster(season);
    return res.status(200).json({ success: true, message: 'Audit report master', data });
  } catch (error) {
    logError('AuditReportMaster', req, error);
    return next(error);
  }
};

// POST: Audit Report Master (Create/Update)
exports.AuditReportMaster_2 = async (req, res, next) => {
  try {
    const { Command = 'Insert', ...model } = req.body;
    const result = await service.mutateAuditReportMaster(model, Command);
    if (result.error) {
      return res.status(result.status || 400).json({ success: false, message: result.message });
    }
    return res.status(201).json({ success: true, message: `${Command} completed`, data: result.data });
  } catch (error) {
    logError('AuditReportMaster_2', req, error, { Command: req.body?.Command });
    return next(error);
  }
};
