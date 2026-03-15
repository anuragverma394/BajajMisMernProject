const { createNotImplementedHandler } = require('../utils/notImplemented');

const CONTROLLER = 'BajajMisService';

exports.GetCrushDate = createNotImplementedHandler(CONTROLLER, 'GetCrushDate', '');
exports.GATEHOURWISECRUSHINGApp = createNotImplementedHandler(CONTROLLER, 'GATEHOURWISECRUSHINGApp', 'DateTime DATE, string GATECODE, string FACTCODE, string hou');
exports.Value = createNotImplementedHandler(CONTROLLER, 'Value', 'string a');
exports.SendNotification = createNotImplementedHandler(CONTROLLER, 'SendNotification', 'string firebaseid, string title, string body');
exports.getEmpCodeForNotification = createNotImplementedHandler(CONTROLLER, 'getEmpCodeForNotification', 'string EmpID, string Type, ref string Factory');
