const { executeProcedure } = require('../core/db/query-executor');
const service = require('../services/report-new.service');

const CONTROLLER = 'ReportNew';

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

// GET: Hourly Cane Arrival Weight
exports.HourlyCaneArrivalWieght = async (req, res, next) => {
  try {
    const season = getSeason(req);
    const data = await service.getHourlyCaneArrivalWeight(season);
    return res.status(200).json({ success: true, message: 'Hourly cane arrival weight data', data });
  } catch (error) {
    logError('HourlyCaneArrivalWieght', req, error);
    return next(error);
  }
};

// GET: Indent Purchase Report New
exports.IndentPurchaseReportNew = async (req, res, next) => {
  try {
    const season = getSeason(req);
    const data = await service.getIndentPurchaseReportNew(season);
    return res.status(200).json({ success: true, message: 'Indent purchase report', data });
  } catch (error) {
    logError('IndentPurchaseReportNew', req, error);
    return next(error);
  }
};

// POST: Indent Purchase Report New (Create/Update)
exports.IndentPurchaseReportNew_2 = async (req, res, next) => {
  try {
    const { Command = 'Insert', ...model } = req.body;
    const result = await service.mutateIndentPurchaseReport(model, Command);
    if (result.error) {
      return res.status(result.status || 400).json({ success: false, message: result.message });
    }
    return res.status(201).json({ success: true, message: `${Command} completed`, data: result.data });
  } catch (error) {
    logError('IndentPurchaseReportNew_2', req, error, { Command: req.body?.Command });
    return next(error);
  }
};

// GET: Center Indent Purchase Report
exports.CenterIndentPurchaseReport = async (req, res, next) => {
  try {
    const season = getSeason(req);
    const centerCode = getFactoryCode(req, 'centerCode', 'Center_Code', 'CenterCode');
    const data = await service.getCenterIndentPurchaseReport(centerCode, season);
    return res.status(200).json({ success: true, message: 'Center indent purchase report', data });
  } catch (error) {
    logError('CenterIndentPurchaseReport', req, error);
    return next(error);
  }
};

// GET: Centre Purchase Truck Report New
exports.CentrePurchaseTruckReportNew = async (req, res, next) => {
  try {
    const season = getSeason(req);
    const data = await service.getCentrePurchaseTruckReportNew(season);
    return res.status(200).json({ success: true, message: 'Centre purchase truck report', data });
  } catch (error) {
    logError('CentrePurchaseTruckReportNew', req, error);
    return next(error);
  }
};

// POST: Centre Purchase Truck Report New (Create/Update)
exports.CentrePurchaseTruckReportNew_2 = async (req, res, next) => {
  try {
    const { Command = 'Insert', ...model } = req.body;
    const result = await service.mutateCentrePurchaseTruckReport(model, Command);
    if (result.error) {
      return res.status(result.status || 400).json({ success: false, message: result.message });
    }
    return res.status(201).json({ success: true, message: `${Command} completed`, data: result.data });
  } catch (error) {
    logError('CentrePurchaseTruckReportNew_2', req, error, { Command: req.body?.Command });
    return next(error);
  }
};

// GET: Zone Centre Wise Truck Details
exports.ZoneCentreWiseTruckdetails = async (req, res, next) => {
  try {
    const season = getSeason(req);
    const zone = req.query?.Zone || req.body?.Zone || '';
    const centre = req.query?.Centre || req.body?.Centre || '';
    const data = await service.getZoneCentreWiseTruckDetails(zone, centre, season);
    return res.status(200).json({ success: true, message: 'Zone-centre-wise truck details', data });
  } catch (error) {
    logError('ZoneCentreWiseTruckdetails', req, error, { zone: req.query?.Zone, centre: req.query?.Centre });
    return next(error);
  }
};

// GET: Center Balance Report
exports.CenterBlanceReport = async (req, res, next) => {
  try {
    const season = getSeason(req);
    const data = await service.getCenterBalanceReport(season);
    return res.status(200).json({ success: true, message: 'Center balance report', data });
  } catch (error) {
    logError('CenterBlanceReport', req, error);
    return next(error);
  }
};

// POST: Center Balance Report (Create/Update)
exports.CenterBlanceReport_2 = async (req, res, next) => {
  try {
    const { Command = 'Insert', ...model } = req.body;
    const result = await service.mutateCenterBalanceReport(model, Command);
    if (result.error) {
      return res.status(result.status || 400).json({ success: false, message: result.message });
    }
    return res.status(201).json({ success: true, message: `${Command} completed`, data: result.data });
  } catch (error) {
    logError('CenterBlanceReport_2', req, error, { Command: req.body?.Command });
    return next(error);
  }
};

// GET: Center Bind (Load centers for factory)
exports.centerBind = async (req, res, next) => {
  try {
    const factCode = getFactoryCode(req, 'Fact', 'FactCode', 'Factory_Code');
    if (!factCode) {
      return res.status(400).json({ success: false, message: 'Factory code is required' });
    }
    const data = await service.getCentersForFactory(factCode);
    return res.status(200).json({ success: true, message: 'Centers loaded', data });
  } catch (error) {
    logError('centerBind', req, error, { factCode: getFactoryCode(req, 'Fact') });
    return next(error);
  }
};

// GET: Cane Purchase Report
exports.CanePurchaseReport = async (req, res, next) => {
  try {
    const season = getSeason(req);
    const data = await service.getCanePurchaseReport(season);
    return res.status(200).json({ success: true, message: 'Cane purchase report', data });
  } catch (error) {
    logError('CanePurchaseReport', req, error);
    return next(error);
  }
};

// POST: Cane Purchase Report (Create/Update)
exports.CanePurchaseReport_2 = async (req, res, next) => {
  try {
    const { Command = 'Insert', ...model } = req.body;
    const result = await service.mutateCanePurchaseReport(model, Command);
    if (result.error) {
      return res.status(result.status || 400).json({ success: false, message: result.message });
    }
    return res.status(201).json({ success: true, message: `${Command} completed`, data: result.data });
  } catch (error) {
    logError('CanePurchaseReport_2', req, error, { Command: req.body?.Command });
    return next(error);
  }
};

// GET: Sample Of Transporter
exports.SampleOfTransporter = async (req, res, next) => {
  try {
    const season = getSeason(req);
    const data = await service.getSampleOfTransporter(season);
    return res.status(200).json({ success: true, message: 'Transporter sample data', data });
  } catch (error) {
    logError('SampleOfTransporter', req, error);
    return next(error);
  }
};

// POST: Sample Of Transporter (Create/Update)
exports.SampleOfTransporter_2 = async (req, res, next) => {
  try {
    const { Command = 'Insert', ...model } = req.body;
    const result = await service.mutateSampleOfTransporter(model, Command);
    if (result.error) {
      return res.status(result.status || 400).json({ success: false, message: result.message });
    }
    return res.status(201).json({ success: true, message: `${Command} completed`, data: result.data });
  } catch (error) {
    logError('SampleOfTransporter_2', req, error, { Command: req.body?.Command });
    return next(error);
  }
};

// GET: Get Zone By Factory
exports.GetZoneByFactory = async (req, res, next) => {
  try {
    const zone = req.query?.Zone || req.body?.Zone || '';
    const userid = req.query?.userid || req.body?.userid || '';
    if (!zone || !userid) {
      return res.status(400).json({ success: false, message: 'Zone and userid are required' });
    }
    const data = await service.getZoneByFactory(zone, userid);
    return res.status(200).json({ success: true, message: 'Zones retrieved', data });
  } catch (error) {
    logError('GetZoneByFactory', req, error, { zone: req.query?.Zone, userid: req.query?.userid });
    return next(error);
  }
};

// GET: Get Transporter By Factory
exports.GetTransporterByFactory = async (req, res, next) => {
  try {
    const fcode = getFactoryCode(req, 'Fcode', 'FCode', 'F_Code');
    if (!fcode) {
      return res.status(400).json({ success: false, message: 'Factory code is required' });
    }
    const data = await service.getTransporterByFactory(fcode);
    return res.status(200).json({ success: true, message: 'Transporters retrieved', data });
  } catch (error) {
    logError('GetTransporterByFactory', req, error, { fcode });
    return next(error);
  }
};

// GET: API Status Report
exports.ApiStatusReport = async (req, res, next) => {
  try {
    const season = getSeason(req);
    const data = await service.getApiStatusReport(season);
    return res.status(200).json({ success: true, message: 'API status report', data });
  } catch (error) {
    logError('ApiStatusReport', req, error);
    return next(error);
  }
};

// POST: API Status Report (Create/Update)
exports.ApiStatusReport_2 = async (req, res, next) => {
  try {
    const { Command = 'Insert', ...model } = req.body;
    const result = await service.mutateApiStatusReport(model, Command);
    if (result.error) {
      return res.status(result.status || 400).json({ success: false, message: result.message });
    }
    return res.status(201).json({ success: true, message: `${Command} completed`, data: result.data });
  } catch (error) {
    logError('ApiStatusReport_2', req, error, { Command: req.body?.Command });
    return next(error);
  }
};

// POST: API Status Report Resend
exports.ApiStatusReportResend = async (req, res, next) => {
  try {
    const id = req.query?.id || req.body?.id;
    const fcode = getFactoryCode(req, 'fcode', 'Fcode');
    if (!id || !fcode) {
      return res.status(400).json({ success: false, message: 'ID and factory code are required' });
    }
    const result = await service.resendApiStatusReport(id, fcode);
    if (result.error) {
      return res.status(result.status || 400).json({ success: false, message: result.message });
    }
    return res.status(200).json({ success: true, message: 'Report resent successfully', data: result.data });
  } catch (error) {
    logError('ApiStatusReportResend', req, error, { id: req.query?.id, fcode: getFactoryCode(req, 'fcode') });
    return next(error);
  }
};
