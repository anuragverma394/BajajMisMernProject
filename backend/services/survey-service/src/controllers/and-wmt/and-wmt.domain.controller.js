const { catchAsync } = require('@bajaj/shared');
const andWmtService = require('../../services/and-wmt.service');

const CONTROLLER = 'AndWmt';

function getSeason(req) {
  return req.user?.season || req.query?.season || req.body?.season || process.env.DEFAULT_SEASON || '2526';
}

function getParams(req) {
  return { ...(req.query || {}), ...(req.body || {}) };
}

function sendProcedureResult(res, action, result) {
  return res.status(200).json({
    success: true,
    message: `${CONTROLLER}.${action} executed`,
    data: result?.rows || [],
    recordsets: result?.recordsets || []
  });
}

function makeProcedureHandler(action) {
  return catchAsync(async (req, res) => {
    const season = getSeason(req);
    const params = getParams(req);
    const result = await andWmtService.executeAndWmtProcedure({ action, params, season });
    return sendProcedureResult(res, action, result);
  });
}

exports.getSetting = makeProcedureHandler('GetSetting');
exports.getOpr = makeProcedureHandler('OPR');
exports.getPregrs = makeProcedureHandler('PREGRS');
exports.getGrs = makeProcedureHandler('GRS');
exports.getPretre = makeProcedureHandler('PRETRE');
exports.getTre = makeProcedureHandler('TRE');
exports.getClg = makeProcedureHandler('CLG');
exports.getDps = makeProcedureHandler('DPS');
exports.getMastersData = makeProcedureHandler('MastersData');
exports.getGrowerData = makeProcedureHandler('GrowerData');
exports.getVillageData = makeProcedureHandler('VillageData');
exports.getIssuedData = makeProcedureHandler('IssuedData');
exports.getVarietyData = makeProcedureHandler('VarietyData');
exports.getCeneTypeData = makeProcedureHandler('CeneTypeData');
exports.getVarietyControl = makeProcedureHandler('VarietyControl');
exports.getMode = makeProcedureHandler('Mode');
exports.getPurchyFormat = makeProcedureHandler('PurchyFormat');
exports.getPurchyQuality = makeProcedureHandler('PurchyQuality');

exports.GetSetting = exports.getSetting;
exports.OPR = exports.getOpr;
exports.PREGRS = exports.getPregrs;
exports.GRS = exports.getGrs;
exports.PRETRE = exports.getPretre;
exports.TRE = exports.getTre;
exports.CLG = exports.getClg;
exports.DPS = exports.getDps;
exports.MastersData = exports.getMastersData;
exports.GrowerData = exports.getGrowerData;
exports.VillageData = exports.getVillageData;
exports.IssuedData = exports.getIssuedData;
exports.VarietyData = exports.getVarietyData;
exports.CeneTypeData = exports.getCeneTypeData;
exports.VarietyControl = exports.getVarietyControl;
exports.Mode = exports.getMode;
exports.PurchyFormat = exports.getPurchyFormat;
exports.PurchyQuality = exports.getPurchyQuality;
