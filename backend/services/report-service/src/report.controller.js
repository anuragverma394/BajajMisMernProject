const { catchAsync } = require('@bajaj/shared');
const reportService = require('./report.service');

exports.DriageSummary = catchAsync(async (req, res) => {
  const result = await reportService.getDriageSummary({
    season: req.user?.season || req.query?.season || req.body?.season || process.env.DEFAULT_SEASON || '2526',
    fcode: req.query?.F_code || req.query?.F_Code || req.body?.F_code || req.body?.F_Code || '',
    dateRaw: req.query?.Date || req.query?.date || req.body?.Date || req.body?.date || ''
  });
  return res.status(200).json(result);
});

exports.DriageDetail = catchAsync(async (req, res) => {
  const result = await reportService.getDriageDetail({
    season: req.user?.season || req.query?.season || req.body?.season || process.env.DEFAULT_SEASON || '2526',
    fcode: req.query?.FACT || req.query?.F_code || req.query?.F_Code || req.body?.FACT || req.body?.F_code || req.body?.F_Code || '',
    center: req.query?.CENTER || req.query?.center || req.body?.CENTER || req.body?.center || '',
    dateRaw: req.query?.DATE || req.query?.Date || req.query?.date || req.body?.DATE || req.body?.Date || req.body?.date || ''
  });
  return res.status(200).json(result);
});

exports.DriageClerkSummary = catchAsync(async (req, res) => {
  const result = await reportService.getDriageClerkSummary({
    season: req.user?.season || req.query?.season || req.body?.season || process.env.DEFAULT_SEASON || '2526',
    fcode: req.query?.F_code || req.query?.F_Code || req.body?.F_code || req.body?.F_Code || '',
    dateRaw: req.query?.Date || req.query?.date || req.body?.Date || req.body?.date || ''
  });
  return res.status(200).json(result);
});

exports.TargetActualMISReport = catchAsync(async (req, res) => {
  const result = await reportService.getTargetActualMISReport({
    season: req.user?.season || req.query?.season || req.body?.season || process.env.DEFAULT_SEASON || '2526',
    factoryName: req.query?.FactoryName || req.query?.factoryName || req.query?.F_Code || req.query?.F_code || req.body?.FactoryName || req.body?.factoryName || req.body?.F_Code || req.body?.F_code || '',
    dateRaw: req.query?.Date || req.query?.date || req.query?.CPDate || req.query?.CP_Date || req.body?.Date || req.body?.date || req.body?.CPDate || req.body?.CP_Date || ''
  });
  return res.status(200).json(result);
});

exports.TargetActualMISPeriodReport = catchAsync(async (req, res) => {
  const result = await reportService.getTargetActualMISPeriodReport({
    season: req.user?.season || req.query?.season || req.body?.season || process.env.DEFAULT_SEASON || '2526',
    factoryName: req.query?.FactoryName || req.query?.factoryName || req.query?.F_Code || req.query?.F_code || req.body?.FactoryName || req.body?.factoryName || req.body?.F_Code || req.body?.F_code || '',
    dateFrom: req.query?.DateFrom || req.query?.dateFrom || req.query?.FromDate || req.query?.fromDate || req.body?.DateFrom || req.body?.dateFrom || req.body?.FromDate || req.body?.fromDate || '',
    dateTo: req.query?.DateTo || req.query?.dateTo || req.query?.ToDate || req.query?.toDate || req.body?.DateTo || req.body?.dateTo || req.body?.ToDate || req.body?.toDate || ''
  });
  return res.status(200).json(result);
});
