const { createNotImplementedHandler } = require('../utils/notImplemented');

const CONTROLLER = 'AndWmt';

exports.GetSetting = createNotImplementedHandler(CONTROLLER, 'GetSetting', 'string EMEI');
exports.OPR = createNotImplementedHandler(CONTROLLER, 'OPR', 'string FACTORY, string CENTRE, string OPERATOR, string PASSWORD, string MACHINEID');
exports.PREGRS = createNotImplementedHandler(CONTROLLER, 'PREGRS', 'string FACTORY, string CENTRE, string OPERATOR, string GROWER, string PURCHY, string MACHINEID');
exports.GRS = createNotImplementedHandler(CONTROLLER, 'GRS', 'string FACTORY, string CENTRE, string OPERATOR, string VILLAGE, string GROWER, string PURCHY, string VARIETY, string CANETYPE, string GROSS, string QUALITY, string WEIGHTFROM, string MACHINEID');
exports.PRETRE = createNotImplementedHandler(CONTROLLER, 'PRETRE', 'string FACTORY, string CENTRE, string OPERATOR, string GROWER, string PURCHY, string MACHINEID');
exports.TRE = createNotImplementedHandler(CONTROLLER, 'TRE', 'string FACTORY, string CENTRE, string OPERATOR, string VILLAGE, string GROWER, string PURCHY, string TARE, string WEIGHTFROM, string MACHINEID');
exports.CLG = createNotImplementedHandler(CONTROLLER, 'CLG', 'string FACTORY, string CENTRE, string OPERATOR, string VILLAGE, string GROWER, string PURCHY, string MACHINEID');
exports.DPS = createNotImplementedHandler(CONTROLLER, 'DPS', 'string FACTORY, string CENTRE, string OPERATOR, string VILLAGE, string GROWER, string PURCHY, string MACHINEID');
exports.MastersData = createNotImplementedHandler(CONTROLLER, 'MastersData', 'string FACTORY');
exports.GrowerData = createNotImplementedHandler(CONTROLLER, 'GrowerData', 'string FACTORY, string CENTRE');
exports.VillageData = createNotImplementedHandler(CONTROLLER, 'VillageData', 'string FACTORY, string CENTRE');
exports.IssuedData = createNotImplementedHandler(CONTROLLER, 'IssuedData', 'string FACTORY, string CENTRE');
exports.VarietyData = createNotImplementedHandler(CONTROLLER, 'VarietyData', 'string FACTORY');
exports.CeneTypeData = createNotImplementedHandler(CONTROLLER, 'CeneTypeData', 'string FACTORY');
exports.VarietyControl = createNotImplementedHandler(CONTROLLER, 'VarietyControl', 'string FACTORY');
exports.Mode = createNotImplementedHandler(CONTROLLER, 'Mode', 'string FACTORY');
exports.PurchyFormat = createNotImplementedHandler(CONTROLLER, 'PurchyFormat', 'string FACTORY');
exports.PurchyQuality = createNotImplementedHandler(CONTROLLER, 'PurchyQuality', 'string FACTORY');
