const { catchAsync } = require('@bajaj/shared');
const distilleryService = require('../../services/distillery.service');
const validation = require('../../validations/distillery.validation');

const CONTROLLER = 'DISTILLERY';

const { numberField, sumFields, buildReport } = distilleryService;

const cHeavyColumns = [
  'AD_CH_OS_PLANT', 'AD_CH_OS_PORT', 'AD_CH_PROD_MONTH', 'AD_CH_TR_DRUG_DIV', 'AD_CH_SALE_RS',
  'AD_CH_SALE_ENA', 'AD_CH_SALE_AA', 'AD_CH_SALE_SDS', 'AD_CH_SALE_ACET_SOL', 'AD_CH_SALE_DAA',
  'AD_CH_SALE_FO', 'AD_CH_EXP_RS', 'AD_CH_EXP_ENA', 'AD_CH_EXP_AA', 'AD_CH_EXP_SDS',
  'AD_CH_EXP_ACET_SOL', 'AD_CH_EXP_DAA', 'AD_CH_EXP_FO', 'AD_CH_GS_PLANT', 'AD_CH_GS_PORT',
  'AD_CH_CL_PLANT', 'AD_CH_CL_PORT', 'AD_CH_CL_RS', 'AD_CH_CL_ENA', 'AD_CH_CL_AA', 'AD_CH_CL_SDS',
  'AD_CH_CL_ACET_SOL', 'AD_CH_CL_DAA', 'AD_CH_CL_FO', 'AD_CH_MOL_OWN_CONS', 'AD_CH_MOL_OUTS_CONS'
];

const bHeavyColumns = [
  'AD_BH_OS_PLANT', 'AD_BH_OS_PORT', 'AD_BH_PROD_MONTH', 'AD_BH_TR_DRUG_DIV', 'AD_BH_SALE_AA',
  'AD_BH_SALE_DAA', 'AD_BH_EXP_AA', 'AD_BH_EXP_DAA', 'AD_BH_GS_PLANT', 'AD_BH_GS_PORT',
  'AD_BH_EX_SH', 'AD_BH_CL_PLANT', 'AD_BH_CL_PORT', 'AD_BH_CL_AA', 'AD_BH_CL_DAA', 'AD_BH_CL_FO',
  'AD_BH_MOL_OUTS_CONS', 'AD_BH_MOL_OWN_CONS'
];

const syrupColumns = [
  'AD_SYP_OS_PLANT', 'AD_SYP_OS_PORT', 'AD_SYP_PROD_MONTH', 'AD_SYP_TR_DRUG_DIV', 'AD_SYP_SALE_RS',
  'AD_SYP_SALE_ENA', 'AD_SYP_SALE_AA', 'AD_SYP_SALE_SDS', 'AD_SYP_SALE_ACET_SOL', 'AD_SYP_SALE_DAA',
  'AD_SYP_SALE_FO', 'AD_SYP_EXP_RS', 'AD_SYP_EXP_ENA', 'AD_SYP_EXP_AA', 'AD_SYP_EXP_SDS',
  'AD_SYP_EXP_ACET_SOL', 'AD_SYP_EXP_DAA', 'AD_SYP_EXP_FO', 'AD_SYP_CL_GS_PLANT', 'AD_SYP_CL_GS_PORT',
  'AD_SYP_EX_SH', 'AD_SYP_CL_RS', 'AD_SYP_CL_ENA', 'AD_SYP_CL_SDS', 'AD_SYP_CL_AA', 'AD_SYP_CL_DAA',
  'AD_SYP_CL_FO', 'AD_SYP_MOL_OUTS_CONS', 'AD_SYP_MOL_OWN_CONS'
];

const cHeavyMappings = [
  { label: 'Opening Stock Plant', um: 'BL', compute: numberField('AD_CH_OS_PLANT') },
  { label: 'Opening Stock Port', um: 'BL', compute: numberField('AD_CH_OS_PORT') },
  { label: 'Sub Total Opening Stock', um: 'BL', bold: true, compute: sumFields('AD_CH_OS_PLANT', 'AD_CH_OS_PORT') },
  { label: 'Production During Month', um: 'BL', compute: numberField('AD_CH_PROD_MONTH') },
  { label: 'Transfer To Drug Division', um: 'BL', compute: numberField('AD_CH_TR_DRUG_DIV') },
  { label: 'Domestic Sale Total', um: 'BL', bold: true, compute: sumFields('AD_CH_SALE_RS', 'AD_CH_SALE_ENA', 'AD_CH_SALE_AA', 'AD_CH_SALE_SDS', 'AD_CH_SALE_ACET_SOL', 'AD_CH_SALE_DAA', 'AD_CH_SALE_FO') },
  { label: 'Export Sale Total', um: 'BL', bold: true, compute: sumFields('AD_CH_EXP_RS', 'AD_CH_EXP_ENA', 'AD_CH_EXP_AA', 'AD_CH_EXP_SDS', 'AD_CH_EXP_ACET_SOL', 'AD_CH_EXP_DAA', 'AD_CH_EXP_FO') },
  { label: 'Gain / Shortage', um: 'BL', bold: true, compute: sumFields('AD_CH_GS_PLANT', 'AD_CH_GS_PORT') },
  { label: 'Closing Stock Plant + Port', um: 'BL', bold: true, compute: sumFields('AD_CH_CL_PLANT', 'AD_CH_CL_PORT') },
  { label: 'Closing Stock Breakup', um: 'BL', bold: true, compute: sumFields('AD_CH_CL_RS', 'AD_CH_CL_ENA', 'AD_CH_CL_AA', 'AD_CH_CL_SDS', 'AD_CH_CL_ACET_SOL', 'AD_CH_CL_DAA', 'AD_CH_CL_FO') },
  { label: 'Molasses Own Consumption', um: 'QTL', compute: numberField('AD_CH_MOL_OWN_CONS') },
  { label: 'Molasses Outside Consumption', um: 'QTL', compute: numberField('AD_CH_MOL_OUTS_CONS') }
];

const bHeavyMappings = [
  { label: 'Opening Stock Plant', um: 'BL', compute: numberField('AD_BH_OS_PLANT') },
  { label: 'Opening Stock Port', um: 'BL', compute: numberField('AD_BH_OS_PORT') },
  { label: 'Sub Total Opening Stock', um: 'BL', bold: true, compute: sumFields('AD_BH_OS_PLANT', 'AD_BH_OS_PORT') },
  { label: 'Production During Month', um: 'BL', compute: numberField('AD_BH_PROD_MONTH') },
  { label: 'Transfer To Drug Division', um: 'BL', compute: numberField('AD_BH_TR_DRUG_DIV') },
  { label: 'Domestic Sale Total', um: 'BL', bold: true, compute: sumFields('AD_BH_SALE_AA', 'AD_BH_SALE_DAA') },
  { label: 'Export Sale Total', um: 'BL', bold: true, compute: sumFields('AD_BH_EXP_AA', 'AD_BH_EXP_DAA') },
  { label: 'Gain / Shortage', um: 'BL', bold: true, compute: sumFields('AD_BH_GS_PLANT', 'AD_BH_GS_PORT', 'AD_BH_EX_SH') },
  { label: 'Closing Stock Plant + Port', um: 'BL', bold: true, compute: sumFields('AD_BH_CL_PLANT', 'AD_BH_CL_PORT') },
  { label: 'Closing Stock Breakup', um: 'BL', bold: true, compute: sumFields('AD_BH_CL_AA', 'AD_BH_CL_DAA', 'AD_BH_CL_FO') },
  { label: 'Molasses Outside Consumption', um: 'QTL', compute: numberField('AD_BH_MOL_OUTS_CONS') },
  { label: 'Total Molasses Consumed', um: 'QTL', bold: true, compute: sumFields('AD_BH_MOL_OWN_CONS', 'AD_BH_MOL_OUTS_CONS') }
];

const syrupMappings = [
  { label: 'Opening Stock Plant', um: 'BL', compute: numberField('AD_SYP_OS_PLANT') },
  { label: 'Opening Stock Port', um: 'BL', compute: numberField('AD_SYP_OS_PORT') },
  { label: 'Sub Total Opening Stock', um: 'BL', bold: true, compute: sumFields('AD_SYP_OS_PLANT', 'AD_SYP_OS_PORT') },
  { label: 'Production During Month', um: 'BL', compute: numberField('AD_SYP_PROD_MONTH') },
  { label: 'Transfer To Drug Division', um: 'BL', compute: numberField('AD_SYP_TR_DRUG_DIV') },
  { label: 'Domestic Sale Total', um: 'BL', bold: true, compute: sumFields('AD_SYP_SALE_RS', 'AD_SYP_SALE_ENA', 'AD_SYP_SALE_AA', 'AD_SYP_SALE_SDS', 'AD_SYP_SALE_ACET_SOL', 'AD_SYP_SALE_DAA', 'AD_SYP_SALE_FO') },
  { label: 'Export Sale Total', um: 'BL', bold: true, compute: sumFields('AD_SYP_EXP_RS', 'AD_SYP_EXP_ENA', 'AD_SYP_EXP_AA', 'AD_SYP_EXP_SDS', 'AD_SYP_EXP_ACET_SOL', 'AD_SYP_EXP_DAA', 'AD_SYP_EXP_FO') },
  { label: 'Closing Gain / Shortage', um: 'BL', compute: sumFields('AD_SYP_CL_GS_PLANT', 'AD_SYP_CL_GS_PORT', 'AD_SYP_EX_SH') },
  { label: 'Closing Stock Total', um: 'BL', bold: true, compute: sumFields('AD_SYP_CL_RS', 'AD_SYP_CL_ENA', 'AD_SYP_CL_SDS', 'AD_SYP_CL_AA', 'AD_SYP_CL_DAA', 'AD_SYP_CL_FO') },
  { label: 'Molasses Own Consumption', um: 'QTL', compute: numberField('AD_SYP_MOL_OWN_CONS') },
  { label: 'Molasses Outside Consumption', um: 'QTL', compute: numberField('AD_SYP_MOL_OUTS_CONS') }
];

exports.Index = (_req, res) => res.status(200).json({ success: true, message: `${CONTROLLER} service ready`, data: null });

exports.CHeavyEthanolReport = catchAsync(async (req, res) => {
  const parsed = validation.parseReport(req);
  if (!parsed.ok) {
    return res.status(400).json({ success: false, message: parsed.message, data: null });
  }
  const data = await buildReport({
    factoryRaw: parsed.data.factory || '',
    fromRaw: parsed.data.from,
    toRaw: parsed.data.to,
    columns: cHeavyColumns,
    mappings: cHeavyMappings
  });
  return res.status(200).json({ success: true, message: 'C-heavy ethanol report', data });
});

exports.CHeavyEthanolReport_2 = exports.CHeavyEthanolReport;

exports.BHeavyEthanolReport = catchAsync(async (req, res) => {
  const parsed = validation.parseReport(req);
  if (!parsed.ok) {
    return res.status(400).json({ success: false, message: parsed.message, data: null });
  }
  const data = await buildReport({
    factoryRaw: parsed.data.factory || '',
    fromRaw: parsed.data.from,
    toRaw: parsed.data.to,
    columns: bHeavyColumns,
    mappings: bHeavyMappings
  });
  return res.status(200).json({ success: true, message: 'B-heavy ethanol report', data });
});

exports.BHeavyEthanolReport_2 = exports.BHeavyEthanolReport;

exports.SyrupEthanolReport = catchAsync(async (req, res) => {
  const parsed = validation.parseReport(req);
  if (!parsed.ok) {
    return res.status(400).json({ success: false, message: parsed.message, data: null });
  }
  const data = await buildReport({
    factoryRaw: parsed.data.factory || '',
    fromRaw: parsed.data.from,
    toRaw: parsed.data.to,
    columns: syrupColumns,
    mappings: syrupMappings
  });
  return res.status(200).json({ success: true, message: 'Syrup ethanol report', data });
});

exports.SyrupEthanolReport_2 = exports.SyrupEthanolReport;
