const { catchAsync } = require('@bajaj/shared');
const service = require('../../services/new-report.service');

function getSeason(req) {
  return req.user?.season || req.query?.season || req.body?.season || process.env.DEFAULT_SEASON || '2526';
}

function getParams(req) {
  return { ...(req.query || {}), ...(req.body || {}) };
}

function parseJson(value) {
  if (!value) return value;
  if (Array.isArray(value) || typeof value === 'object') return value;
  try {
    return JSON.parse(value);
  } catch {
    return value;
  }
}

function sendSuccess(res, message, data, extra = {}) {
  return res.status(200).json({ success: true, message, data, ...extra });
}

function sendError(res, status, message) {
  return res.status(status || 500).json({ success: false, message });
}

function handleResult(res, message, result) {
  if (result && result.error) {
    return sendError(res, result.status, result.message || 'Request failed');
  }
  if (result && typeof result.status === 'number' && result.data !== undefined) {
    return res.status(result.status).json({ success: !result.error, message, data: result.data, ...result });
  }
  return sendSuccess(res, message, result);
}

exports.TargetVsActualMisPeriodcallyNewSap = catchAsync(async (req, res) => {
  const data = await service.getTargetVsActualMisPeriodically(getSeason(req));
  return sendSuccess(res, 'Target vs actual MIS periodically', data);
});

exports.TargetActualMISData = catchAsync(async (req, res) => {
  const params = getParams(req);
  const factoryName = params.FactoryName || params.factoryName || params.F_Name || params.F_Name1 || params.F_name;
  const dateFrom = params.DateFrom || params.dateFrom || params.FromDate || params.fromDate;
  const dateTo = params.DateTo || params.dateTo || params.ToDate || params.toDate;
  const data = await service.getTargetActualMISData(factoryName, dateFrom, dateTo, getSeason(req));
  return sendSuccess(res, 'Target actual MIS data', data);
});

exports.TargetActualMisSapNew = catchAsync(async (req, res) => {
  const params = getParams(req);
  const factoryCode = params.FactoryCode || params.factoryCode || params.F_Code || params.F_code || params.F_Name || params.F_name || params.FactoryName;
  const date = params.Date || params.date || params.CP_Date || params.CPDate || params.cpDate;
  const userCode = params.UserId || params.userId || req.user?.userId;
  const data = await service.getTargetActualMisSapNew(factoryCode, date, userCode, getSeason(req));
  return sendSuccess(res, 'Target actual MIS SAP', data);
});

exports.TargetActualMISDataMis = catchAsync(async (req, res) => {
  const params = getParams(req);
  const factoryName = params.FactoryName || params.factoryName || params.F_Name || params.F_Name1 || params.F_name;
  const cpDate = params.CPDate || params.cpDate || params.CP_Date || params.CpDate;
  const data = await service.getTargetActualMISDataMis(factoryName, cpDate, getSeason(req));
  return sendSuccess(res, 'Target actual MIS data (MIS)', data);
});

exports.ExceptionReportMaster = catchAsync(async (req, res) => {
  const data = await service.getExceptionReportMaster(getSeason(req));
  return sendSuccess(res, 'Exception report master', data);
});

exports.ExceptionReportMaster_2 = catchAsync(async (req, res) => {
  const params = getParams(req);
  const command = params.Command || params.command || params.Action || params.action || 'Upsert';
  const result = await service.mutateExceptionReportMaster(params, command);
  return handleResult(res, 'Exception report master updated', result);
});

exports.CONSECUTIVEGROSSWEIGHT = catchAsync(async (req, res) => {
  const data = await service.getConsecutiveGrossWeight(getSeason(req));
  return sendSuccess(res, 'Consecutive gross weight', data);
});

exports.ExceptionReport = catchAsync(async (req, res) => {
  const params = getParams(req);
  const selectedIds = parseJson(params.SelectedIds || params.selectedIds || params.ids || []);
  const userid = params.UserId || params.userId || req.user?.userId;
  const downloadToken = params.downloadToken || params.DownloadToken;
  const result = await service.getExceptionReport(params, selectedIds, userid, downloadToken);
  return handleResult(res, 'Exception report', result);
});

exports.ExportAllAbnormalWeighments = catchAsync(async (req, res) => {
  const params = getParams(req);
  const factoryCode = params.FactoryCode || params.factoryCode || params.F_code || params.F_Code;
  const factoryName = params.FactoryName || params.factoryName || params.F_Name || params.F_name;
  const dateFrom = params.DateFrom || params.dateFrom || params.FromDate || params.fromDate;
  const dateTo = params.DateTo || params.dateTo || params.ToDate || params.toDate;
  const result = await service.exportAllAbnormalWeighments(factoryCode, factoryName, dateFrom, dateTo);
  return handleResult(res, 'Abnormal weighments exported', result);
});

exports.ExportExcel = catchAsync(async (req, res) => {
  const params = getParams(req);
  const selectedIds = parseJson(params.SelectedIds || params.selectedIds || params.ids || []);
  const factoryCode = params.FactoryCode || params.factoryCode || params.F_code || params.F_Code;
  const factoryName = params.FactoryName || params.factoryName || params.F_Name || params.F_name;
  const dateFrom = params.DateFrom || params.dateFrom || params.FromDate || params.fromDate;
  const dateTo = params.DateTo || params.dateTo || params.ToDate || params.toDate;
  const downloadToken = params.downloadToken || params.DownloadToken;
  const result = await service.exportToExcel(selectedIds, factoryCode, factoryName, dateFrom, dateTo, downloadToken);
  return handleResult(res, 'Export report', result);
});

exports.AuditReport = catchAsync(async (req, res) => {
  const params = getParams(req);
  const selectedIds = parseJson(params.SelectedIds || params.selectedIds || params.ids || []);
  const factoryCode = params.FactoryCode || params.factoryCode || params.F_code || params.F_Code;
  const factoryName = params.FactoryName || params.factoryName || params.F_Name || params.F_name;
  const dateFrom = params.DateFrom || params.dateFrom || params.FromDate || params.fromDate;
  const dateTo = params.DateTo || params.dateTo || params.ToDate || params.toDate;
  const downloadToken = params.downloadToken || params.DownloadToken;
  const result = await service.getAuditReport(selectedIds, factoryCode, factoryName, dateFrom, dateTo, downloadToken);
  return handleResult(res, 'Audit report', result);
});

exports.LoadReasonWiseReport = catchAsync(async (req, res) => {
  const params = getParams(req);
  const factoryCode = params.FactoryCode || params.factoryCode || params.F_code || params.F_Code;
  const data = await service.getReasonWiseReport(factoryCode);
  return sendSuccess(res, 'Reason wise report', data);
});

exports.LoadAuditReport = catchAsync(async (req, res) => {
  const params = getParams(req);
  const factoryCode = params.FactoryCode || params.factoryCode || params.F_code || params.F_Code;
  const data = await service.getLoadAuditReport(factoryCode);
  return sendSuccess(res, 'Load audit report', data);
});

exports.AuditReportMaster = catchAsync(async (req, res) => {
  const data = await service.getAuditReportMaster(getSeason(req));
  return sendSuccess(res, 'Audit report master', data);
});

exports.AuditReportMaster_2 = catchAsync(async (req, res) => {
  const params = getParams(req);
  const command = params.Command || params.command || params.Action || params.action || 'Upsert';
  const result = await service.mutateAuditReportMaster(params, command);
  return handleResult(res, 'Audit report master updated', result);
});
