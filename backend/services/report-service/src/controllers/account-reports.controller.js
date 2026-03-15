const { createNotImplementedHandler } = require('@bajaj/shared');
const service = require('../services/account-reports.service');

const CONTROLLER = 'AccountReports';

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

function logControllerError(scope, req, error, extra = {}) {
  console.error(`[${CONTROLLER}] ${scope} failed`, {
    details: {
      scope,
      method: req.method,
      path: req.originalUrl,
      userId: req.user?.userId || null,
      season: req.user?.season || null,
      queryKeys: Object.keys(req.query || {}),
      bodyKeys: Object.keys(req.body || {}),
      ...extra
    },
    message: error?.message,
    stack: error?.stack
  });
}

// GET: Index/Dashboard
exports.Index = async (req, res, next) => {
  try {
    const season = getSeason(req);
    const result = await service.getAccountsDashboard(season);
    return res.status(200).json({ success: true, message: 'Accounts dashboard', data: result });
  } catch (error) {
    logControllerError('Index', req, error);
    return next(error);
  }
};

// GET: Variety Wise Cane Purchase
exports.VarietyWiseCanePurchase = async (req, res, next) => {
  try {
    const season = getSeason(req);
    const result = await service.getVarietyWiseCanePurchase(season);
    return res.status(200).json({ success: true, message: 'Variety-wise cane purchase report', data: result });
  } catch (error) {
    logControllerError('VarietyWiseCanePurchase', req, error);
    return next(error);
  }
};

// POST: Variety Wise Cane Purchase (Create/Update)
exports.VarietyWiseCanePurchase_2 = async (req, res, next) => {
  try {
    const { Command = 'Insert', ...model } = req.body;
    const result = await service.mutateVarietyWiseCanePurchase(model, Command);
    if (result.error) {
      return res.status(result.error.status || 400).json({ success: false, message: result.error.message });
    }
    return res.status(result.status || 201).json({ success: true, message: `${Command} completed`, data: result.data });
  } catch (error) {
    logControllerError('VarietyWiseCanePurchase_2', req, error, { command: req.body?.Command });
    return next(error);
  }
};

// GET: Capacity Utilisation
exports.Capasityutilisation = async (req, res, next) => {
  try {
    const season = getSeason(req);
    const result = await service.getCapacityUtilisation(season);
    return res.status(200).json({ success: true, message: 'Capacity utilisation report', data: result });
  } catch (error) {
    logControllerError('Capasityutilisation', req, error);
    return next(error);
  }
};

// POST: Capacity Utilisation (Create/Update)
exports.Capasityutilisation_2 = async (req, res, next) => {
  try {
    const { Command = 'Insert', ...model } = req.body;
    const result = await service.mutateCapacityUtilisation(model, Command);
    if (result.error) {
      return res.status(result.error.status || 400).json({ success: false, message: result.error.message });
    }
    return res.status(result.status || 201).json({ success: true, message: `${Command} completed`, data: result.data });
  } catch (error) {
    logControllerError('Capasityutilisation_2', req, error, { command: req.body?.Command });
    return next(error);
  }
};

// GET: Cane Qty and Sugar Capacity
exports.CaneQtyandSugarCapacity = async (req, res, next) => {
  try {
    const season = getSeason(req);
    const result = await service.getCaneQtyAndSugarCapacity(season);
    return res.status(200).json({ success: true, message: 'Cane quantity and sugar capacity', data: result });
  } catch (error) {
    logControllerError('CaneQtyandSugarCapacity', req, error);
    return next(error);
  }
};

// POST: Cane Qty and Sugar Capacity (Create/Update)
exports.CaneQtyandSugarCapacity_2 = async (req, res, next) => {
  try {
    const { Command = 'Insert', ...model } = req.body;
    const result = await service.mutateCaneQtyAndSugarCapacity(model, Command);
    if (result.error) {
      return res.status(result.error.status || 400).json({ success: false, message: result.error.message });
    }
    return res.status(result.status || 201).json({ success: true, message: `${Command} completed`, data: result.data });
  } catch (error) {
    logControllerError('CaneQtyandSugarCapacity_2', req, error, { command: req.body?.Command });
    return next(error);
  }
};

// GET: Capacity Utilisation From Date
exports.CapasityutilisationFromdate = async (req, res, next) => {
  try {
    const fcode = getFactoryCode(req, 'fcode', 'F_Code');
    const fromdate = req.query?.fromdate || req.body?.fromdate || '';
    const toDate = req.query?.toDate || req.body?.toDate || '';
    
    if (!fcode) {
      return res.status(400).json({ success: false, message: 'Factory code is required' });
    }
    
    const result = await service.getCapacityUtilisationFromDate(fcode, fromdate, toDate);
    return res.status(200).json({ success: true, message: 'Capacity utilisation (date range)', data: result });
  } catch (error) {
    logControllerError('CapasityutilisationFromdate', req, error, { fcode: getFactoryCode(req, 'fcode') });
    return next(error);
  }
};

// POST: Capacity Utilisation From Date (Create/Update)
exports.CapasityutilisationFromdate_2 = async (req, res, next) => {
  try {
    const { Command = 'Insert', ...model } = req.body;
    const result = await service.mutateCapacityUtilisationFromDate(model, Command);
    if (result.error) {
      return res.status(result.error.status || 400).json({ success: false, message: result.error.message });
    }
    return res.status(result.status || 201).json({ success: true, message: `${Command} completed`, data: result.data });
  } catch (error) {
    logControllerError('CapasityutilisationFromdate_2', req, error, { command: req.body?.Command });
    return next(error);
  }
};

exports.TransferandRecievedUnit = async (req, res, next) => {
  try {
    const result = await service.getTransferData(req);
    if (result.error) {
      return res.status(result.error.status).json({ success: false, message: result.error.message });
    }
    return res.status(result.status || 200).json(result.data);
  } catch (error) {
    logControllerError('TransferandRecievedUnit', req, error, {
      Rid: req.query.Rid || req.query.id || null,
      factoryCode: req.query.factoryCode || req.query.t_Factory || null
    });
    return next(error);
  }
};

exports.TransferandRecievedUnit_2 = async (req, res, next) => {
  try {
    const result = await service.mutateTransferData(req);
    if (result.error) {
      return res.status(result.error.status).json({ success: false, message: result.error.message });
    }
    return res.status(result.status || 200).json(result.data);
  } catch (error) {
    logControllerError('TransferandRecievedUnit_2', req, error, {
      command: req.body.Command || req.body.command || req.body.id || null
    });
    return next(error);
  }
};

exports.DELETEData = async (req, res, next) => {
  try {
    const result = await service.deleteTransferById(req);
    if (result.error) {
      return res.status(result.error.status).json({ success: false, message: result.error.message });
    }
    return res.status(result.status || 200).json(result.data);
  } catch (error) {
    logControllerError('DELETEData', req, error, { id: req.query.id || req.body.id || null });
    return next(error);
  }
};

// GET: Sugar Report
exports.SugarReport = async (req, res, next) => {
  try {
    const season = getSeason(req);
    const result = await service.getSugarReport(season);
    return res.status(200).json({ success: true, message: 'Sugar production report', data: result });
  } catch (error) {
    logControllerError('SugarReport', req, error);
    return next(error);
  }
};

// POST: Sugar Report (Create/Update)
exports.SugarReport_2 = async (req, res, next) => {
  try {
    const { Command = 'Insert', ...model } = req.body;
    const result = await service.mutateSugarReport(model, Command);
    if (result.error) {
      return res.status(result.error.status || 400).json({ success: false, message: result.error.message });
    }
    return res.status(result.status || 201).json({ success: true, message: `${Command} completed`, data: result.data });
  } catch (error) {
    logControllerError('SugarReport_2', req, error, { command: req.body?.Command });
    return next(error);
  }
};

// GET: Cogen Report
exports.CogenReport = async (req, res, next) => {
  try {
    const season = getSeason(req);
    const result = await service.getCogenReport(season);
    return res.status(200).json({ success: true, message: 'Cogeneration report', data: result });
  } catch (error) {
    logControllerError('CogenReport', req, error);
    return next(error);
  }
};

// POST: Cogen Report (Create/Update)
exports.CogenReport_2 = async (req, res, next) => {
  try {
    const { Command = 'Insert', ...model } = req.body;
    const result = await service.mutateCogenReport(model, Command);
    if (result.error) {
      return res.status(result.error.status || 400).json({ success: false, message: result.error.message });
    }
    return res.status(result.status || 201).json({ success: true, message: `${Command} completed`, data: result.data });
  } catch (error) {
    logControllerError('CogenReport_2', req, error, { command: req.body?.Command });
    return next(error);
  }
};

// GET: Distillery Report
exports.DISTILLERYReport = async (req, res, next) => {
  try {
    const season = getSeason(req);
    const result = await service.getDistilleryReport(season);
    return res.status(200).json({ success: true, message: 'Distillery report', data: result });
  } catch (error) {
    logControllerError('DISTILLERYReport', req, error);
    return next(error);
  }
};

// POST: Distillery Report (Create/Update)
exports.DISTILLERYReport_2 = async (req, res, next) => {
  try {
    const { Command = 'Insert', ...model } = req.body;
    const result = await service.mutateDistilleryReport(model, Command);
    if (result.error) {
      return res.status(result.error.status || 400).json({ success: false, message: result.error.message });
    }
    return res.status(result.status || 201).json({ success: true, message: `${Command} completed`, data: result.data });
  } catch (error) {
    logControllerError('DISTILLERYReport_2', req, error, { command: req.body?.Command });
    return next(error);
  }
};

// GET: Distillery Report A
exports.DistilleryReportA = async (req, res, next) => {
  try {
    const season = getSeason(req);
    const result = await service.getDistilleryReportA(season);
    return res.status(200).json({ success: true, message: 'Distillery report (Alternate)', data: result });
  } catch (error) {
    logControllerError('DistilleryReportA', req, error);
    return next(error);
  }
};

// POST: Distillery Report A (Create/Update)
exports.DistilleryReportA_2 = async (req, res, next) => {
  try {
    const { Command = 'Insert', ...model } = req.body;
    const result = await service.mutateDistilleryReportA(model, Command);
    if (result.error) {
      return res.status(result.error.status || 400).json({ success: false, message: result.error.message });
    }
    return res.status(result.status || 201).json({ success: true, message: `${Command} completed`, data: result.data });
  } catch (error) {
    logControllerError('DistilleryReportA_2', req, error, { command: req.body?.Command });
    return next(error);
  }
};

// GET: Variety Wise Cane Purchase Amount
exports.VarietyWiseCanePurchaseAmt = async (req, res, next) => {
  try {
    const season = getSeason(req);
    const result = await service.getVarietyWiseCanePurchaseAmount(season);
    return res.status(200).json({ success: true, message: 'Variety-wise cane purchase amount', data: result });
  } catch (error) {
    logControllerError('VarietyWiseCanePurchaseAmt', req, error);
    return next(error);
  }
};

// POST: Variety Wise Cane Purchase Amount (Create/Update)
exports.VarietyWiseCanePurchaseAmt_2 = async (req, res, next) => {
  try {
    const { Command = 'Insert', ...model } = req.body;
    const result = await service.mutateVarietyWiseCanePurchaseAmount(model, Command);
    if (result.error) {
      return res.status(result.error.status || 400).json({ success: false, message: result.error.message });
    }
    return res.status(result.status || 201).json({ success: true, message: `${Command} completed`, data: result.data });
  } catch (error) {
    logControllerError('VarietyWiseCanePurchaseAmt_2', req, error, { command: req.body?.Command });
    return next(error);
  }
};
