const { catchAsync } = require('@bajaj/shared');
const reportService = require('../services/report.service');
const read = require('./report/report.read.controller');
const write = require('./report/report.write.controller');
const validation = require('./report/report.validation.controller');
const meta = require('./report/report.meta.controller');
const legacyDomain = require('./report/report.domain.controller');
const {
  IndentFaillDetailsData: _legacyIndentFaillDetailsData,
  IndentFailSummaryNewData: _legacyIndentFailSummaryNewData,
  IndentFailSummaryNew: _legacyIndentFailSummaryNew,
  ...legacyHandlers
} = legacyDomain;

const DriageSummary = catchAsync(async (req, res) => {
  const result = await reportService.getDriageSummary({
    season: req.user?.season || req.query?.season || req.body?.season || process.env.DEFAULT_SEASON || '2526',
    fcode: req.query?.F_code || req.query?.F_Code || req.body?.F_code || req.body?.F_Code || '',
    dateRaw: req.query?.Date || req.query?.date || req.body?.Date || req.body?.date || ''
  });
  return res.status(200).json(result);
});

const DriageDetail = catchAsync(async (req, res) => {
  const result = await reportService.getDriageDetail({
    season: req.user?.season || req.query?.season || req.body?.season || process.env.DEFAULT_SEASON || '2526',
    fcode: req.query?.FACT || req.query?.F_code || req.query?.F_Code || req.body?.FACT || req.body?.F_code || req.body?.F_Code || '',
    center: req.query?.CENTER || req.query?.center || req.body?.CENTER || req.body?.center || '',
    dateRaw: req.query?.DATE || req.query?.Date || req.query?.date || req.body?.DATE || req.body?.Date || req.body?.date || ''
  });
  return res.status(200).json(result);
});

const DriageClerkSummary = catchAsync(async (req, res) => {
  const result = await reportService.getDriageClerkSummary({
    season: req.user?.season || req.query?.season || req.body?.season || process.env.DEFAULT_SEASON || '2526',
    fcode: req.query?.F_code || req.query?.F_Code || req.body?.F_code || req.body?.F_Code || '',
    dateRaw: req.query?.Date || req.query?.date || req.body?.Date || req.body?.date || ''
  });
  return res.status(200).json(result);
});

const TargetActualMISReport = catchAsync(async (req, res) => {
  const result = await reportService.getTargetActualMISReport({
    season: req.user?.season || req.query?.season || req.body?.season || process.env.DEFAULT_SEASON || '2526',
    factoryName: req.query?.FactoryName || req.query?.factoryName || req.query?.F_Code || req.query?.F_code || req.body?.FactoryName || req.body?.factoryName || req.body?.F_Code || req.body?.F_code || '',
    dateRaw: req.query?.Date || req.query?.date || req.query?.CPDate || req.query?.CP_Date || req.body?.Date || req.body?.date || req.body?.CPDate || req.body?.CP_Date || ''
  });
  return res.status(200).json(result);
});

const TargetActualMISPeriodReport = catchAsync(async (req, res) => {
  const result = await reportService.getTargetActualMISPeriodReport({
    season: req.user?.season || req.query?.season || req.body?.season || process.env.DEFAULT_SEASON || '2526',
    factoryName: req.query?.FactoryName || req.query?.factoryName || req.query?.F_Code || req.query?.F_code || req.body?.FactoryName || req.body?.factoryName || req.body?.F_Code || req.body?.F_code || '',
    dateFrom: req.query?.DateFrom || req.query?.dateFrom || req.query?.FromDate || req.query?.fromDate || req.body?.DateFrom || req.body?.dateFrom || req.body?.FromDate || req.body?.fromDate || '',
    dateTo: req.query?.DateTo || req.query?.dateTo || req.query?.ToDate || req.query?.toDate || req.body?.DateTo || req.body?.dateTo || req.body?.ToDate || req.body?.toDate || ''
  });
  return res.status(200).json(result);
});

const IndentFailSummaryNew = catchAsync(async (_req, res) => {
  const now = new Date();
  const dd = String(now.getDate()).padStart(2, '0');
  const mm = String(now.getMonth() + 1).padStart(2, '0');
  const yyyy = now.getFullYear();
  return res.status(200).json({ success: true, data: { date: `${dd}/${mm}/${yyyy}` } });
});

const IndentFailSummaryNewData = catchAsync(async (req, res) => {
  const result = await reportService.getIndentFailSummaryNew({
    season: req.user?.season || req.query?.season || req.body?.season || process.env.DEFAULT_SEASON || '2526',
    fcode: req.query?.F_code || req.query?.F_Code || req.body?.F_code || req.body?.F_Code || '',
    dateRaw: req.query?.Date || req.query?.date || req.body?.Date || req.body?.date || ''
  });
  return res.status(200).json(result);
});

const IndentFaillDetailsData = catchAsync(async (req, res) => {
  const result = await reportService.getIndentFailDetails({
    season: req.user?.season || req.query?.season || req.body?.season || process.env.DEFAULT_SEASON || '2526',
    fcode: req.query?.FACT || req.query?.F_code || req.query?.F_Code || req.body?.FACT || req.body?.F_code || req.body?.F_Code || '',
    dateRaw: req.query?.Date || req.query?.date || req.body?.Date || req.body?.date || ''
  });
  return res.status(200).json(result);
});

module.exports = {
  ...read,
  ...write,
  ...validation,
  ...meta,
  ...legacyHandlers,
  DriageSummary,
  DriageDetail,
  DriageClerkSummary,
  TargetActualMISReport,
  TargetActualMISPeriodReport,
  IndentFailSummaryNew,
  IndentFailSummaryNewData,
  IndentFaillDetailsData
};
