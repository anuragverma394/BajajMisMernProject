const { createNotImplementedHandler } = require('@bajaj/shared');

const CONTROLLER = 'DISTILLERY';

exports.Index = createNotImplementedHandler(CONTROLLER, 'Index', '');
exports.CHeavyEthanolReport = createNotImplementedHandler(CONTROLLER, 'CHeavyEthanolReport', '');
exports.CHeavyEthanolReport_2 = createNotImplementedHandler(CONTROLLER, 'CHeavyEthanolReport', 'CHeavyEthanolReportViewModel model, string Command');
exports.BHeavyEthanolReport = createNotImplementedHandler(CONTROLLER, 'BHeavyEthanolReport', '');
exports.BHeavyEthanolReport_2 = createNotImplementedHandler(CONTROLLER, 'BHeavyEthanolReport', 'BHeavyEthanolReportViewModel model, string Command');
exports.SyrupEthanolReport = createNotImplementedHandler(CONTROLLER, 'SyrupEthanolReport', '');
exports.SyrupEthanolReport_2 = createNotImplementedHandler(CONTROLLER, 'SyrupEthanolReport', 'SyrupEthanolReportViewModel model, string Command');
