const { catchAsync } = require('@bajaj/shared');
const service = require('../../services/report-new.service');

function getSeason(req) {
  return req.user?.season || req.query?.season || req.body?.season || process.env.DEFAULT_SEASON || '2526';
}

function getParams(req) {
  return { ...(req.query || {}), ...(req.body || {}) };
}

function success(res, message, data) {
  return res.status(200).json({ success: true, status: 'success', message, data });
}

exports.HourlyCaneArrivalWieght = catchAsync(async (req, res) => {
  const data = await service.getHourlyCaneArrivalWeight(getSeason(req));
  return success(res, 'Hourly cane arrival weight', data);
});

exports.IndentPurchaseReportNew = catchAsync(async (req, res) => {
  const data = await service.getIndentPurchaseReportNew(getParams(req), getSeason(req));
  return success(res, 'Indent purchase report', data);
});

exports.IndentPurchaseReportNew_2 = catchAsync(async (req, res) => {
  const data = await service.mutateIndentPurchaseReport(getParams(req), getSeason(req));
  return success(res, 'Indent purchase report updated', data);
});

exports.CenterIndentPurchaseReport = catchAsync(async (req, res) => {
  const data = await service.getCenterIndentPurchaseReport(getParams(req), getSeason(req));
  return success(res, 'Center indent purchase report', data);
});

exports.CentrePurchaseTruckReportNew = catchAsync(async (req, res) => {
  const data = await service.getCentrePurchaseTruckReportNew(getParams(req), getSeason(req));
  return success(res, 'Centre purchase truck report', data);
});

exports.CentrePurchaseTruckReportNew_2 = catchAsync(async (req, res) => {
  const data = await service.mutateCentrePurchaseTruckReport(getParams(req), getSeason(req));
  return success(res, 'Centre purchase truck report updated', data);
});

exports.ZoneCentreWiseTruckdetails = catchAsync(async (req, res) => {
  const data = await service.getZoneCentreWiseTruckDetails(getParams(req), getSeason(req));
  return success(res, 'Zone centre wise truck details', data);
});

exports.CenterBlanceReport = catchAsync(async (req, res) => {
  const data = await service.getCenterBalanceReport(getParams(req), getSeason(req));
  return success(res, 'Center balance report', data);
});

exports.CenterBlanceReport_2 = catchAsync(async (req, res) => {
  const data = await service.mutateCenterBalanceReport(getParams(req), getSeason(req));
  return success(res, 'Center balance report updated', data);
});

exports.centerBind = catchAsync(async (req, res) => {
  const data = await service.getCentersForFactory(getParams(req), getSeason(req));
  return success(res, 'Center bind', data);
});

exports.CanePurchaseReport = catchAsync(async (req, res) => {
  const data = await service.getCanePurchaseReport(getParams(req), getSeason(req));
  return res.status(200).json({
    success: true,
    status: 'success',
    message: 'Cane purchase report',
    data: data?.rows || [],
    totals: data?.totals || null,
    extraRows: data?.extraRows || []
  });
});

exports.CanePurchaseReport_2 = catchAsync(async (req, res) => {
  const data = await service.mutateCanePurchaseReport(getParams(req), getSeason(req));
  return success(res, 'Cane purchase report updated', data);
});

exports.SampleOfTransporter = catchAsync(async (req, res) => {
  const data = await service.getSampleOfTransporter(getParams(req), getSeason(req));
  return success(res, 'Sample of transporter', data);
});

exports.SampleOfTransporter_2 = catchAsync(async (req, res) => {
  const data = await service.mutateSampleOfTransporter(getParams(req), getSeason(req));
  return success(res, 'Sample of transporter updated', data);
});

exports.GetZoneByFactory = catchAsync(async (req, res) => {
  const data = await service.getZoneByFactory(getParams(req), getSeason(req));
  return success(res, 'Zone list', data);
});

exports.GetTransporterByFactory = catchAsync(async (req, res) => {
  const data = await service.getTransporterByFactory(getParams(req), getSeason(req));
  return success(res, 'Transporter list', data);
});

exports.ApiStatusReport = catchAsync(async (req, res) => {
  const data = await service.getApiStatusReport(getParams(req), getSeason(req));
  return success(res, 'API status report', data);
});

exports.ApiStatusReport_2 = catchAsync(async (req, res) => {
  const data = await service.mutateApiStatusReport(getParams(req), getSeason(req));
  return success(res, 'API status report updated', data);
});

exports.ApiStatusReportResend = catchAsync(async (req, res) => {
  const data = await service.resendApiStatusReport(getParams(req), getSeason(req));
  return success(res, 'API status report resent', data);
});
