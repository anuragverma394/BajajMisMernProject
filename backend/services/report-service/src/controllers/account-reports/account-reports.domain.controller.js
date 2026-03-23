const { catchAsync } = require('@bajaj/shared');
const service = require('../../services/account-reports.service');

function respondSuccess(res, message, data) {
  return res.apiSuccess(message, data);
}

function respondServiceResult(res, message, result) {
  if (result?.error) {
    const err = new Error(result.error.message || 'Request failed');
    err.statusCode = result.error.status || 500;
    throw err;
  }
  return res.status(result?.status || 200).json({
    success: true,
    message,
    data: result?.data ?? result
  });
}

function notImplemented(res, name) {
  return respondSuccess(res, `${name} not implemented`, []);
}

function createServiceHandler(fn, message) {
  return catchAsync(async (req, res) => {
    const result = await fn(req);
    return respondServiceResult(res, message, result);
  });
}

exports.Index = catchAsync(async (req, res) => {
  return respondSuccess(res, 'Account reports index', []);
});

exports.VarietyWiseCanePurchase = catchAsync(async (req, res) => {
  const result = await service.getVarietyWiseCanePurchase(req);
  if (result?.error) {
    const err = new Error(result.error.message || 'Request failed');
    err.statusCode = result.error.status || 500;
    throw err;
  }
  return res.status(200).json(result);
});

exports.VarietyWiseCanePurchase_2 = catchAsync(async (req, res) => {
  const result = await service.getVarietyWiseCanePurchase(req);
  if (result?.error) {
    const err = new Error(result.error.message || 'Request failed');
    err.statusCode = result.error.status || 500;
    throw err;
  }
  return res.status(200).json(result);
});

exports.Capasityutilisation = catchAsync(async (req, res) => {
  const result = await service.getCapacityUtilisation(req);
  if (result?.error) {
    const err = new Error(result.error.message || 'Request failed');
    err.statusCode = result.error.status || 500;
    throw err;
  }
  return res.status(200).json(result);
});

exports.Capasityutilisation_2 = catchAsync(async (req, res) => {
  return notImplemented(res, 'Capacity utilisation save');
});

exports.CaneQtyandSugarCapacity = catchAsync(async (req, res) => {
  return notImplemented(res, 'Cane qty and sugar capacity');
});

exports.CaneQtyandSugarCapacity_2 = catchAsync(async (req, res) => {
  return notImplemented(res, 'Cane qty and sugar capacity save');
});

exports.CapasityutilisationFromdate = catchAsync(async (req, res) => {
  const result = await service.getCapacityUtilisationPeriodical(req);
  if (result?.error) {
    const err = new Error(result.error.message || 'Request failed');
    err.statusCode = result.error.status || 500;
    throw err;
  }
  return res.status(200).json(result);
});

exports.CapasityutilisationFromdate_2 = catchAsync(async (req, res) => {
  return notImplemented(res, 'Capacity utilisation from date save');
});

exports.TransferandRecievedUnit = catchAsync(async (req, res) => {
  const result = await service.getTransferData(req);
  return respondServiceResult(res, 'Transfer and received units', result);
});

exports.TransferandRecievedUnit_2 = createServiceHandler(
  service.mutateTransferData,
  'Transfer and received units updated'
);

exports.DELETEData = createServiceHandler(
  service.deleteTransferById,
  'Transfer deleted'
);

exports.SugarReport = catchAsync(async (req, res) => {
  return notImplemented(res, 'Sugar report');
});

exports.SugarReport_2 = catchAsync(async (req, res) => {
  return notImplemented(res, 'Sugar report save');
});

exports.CogenReport = catchAsync(async (req, res) => {
  return notImplemented(res, 'Cogen report');
});

exports.CogenReport_2 = catchAsync(async (req, res) => {
  return notImplemented(res, 'Cogen report save');
});

exports.DISTILLERYReport = catchAsync(async (req, res) => {
  const result = await service.getDistilleryReport(req);
  if (result?.error) {
    const err = new Error(result.error.message || 'Request failed');
    err.statusCode = result.error.status || 500;
    throw err;
  }
  return res.status(200).json(result);
});

exports.DISTILLERYReport_2 = catchAsync(async (req, res) => {
  return notImplemented(res, 'Distillery report save');
});

exports.DistilleryReportA = catchAsync(async (req, res) => {
  return notImplemented(res, 'Distillery report A');
});

exports.DistilleryReportA_2 = catchAsync(async (req, res) => {
  return notImplemented(res, 'Distillery report A save');
});

exports.VarietyWiseCanePurchaseAmt = catchAsync(async (req, res) => {
  const result = await service.getVarietyWiseCanePurchaseAmt(req);
  if (result?.error) {
    const err = new Error(result.error.message || 'Request failed');
    err.statusCode = result.error.status || 500;
    throw err;
  }
  return res.status(200).json(result);
});

exports.VarietyWiseCanePurchaseAmt_2 = catchAsync(async (req, res) => {
  const result = await service.getVarietyWiseCanePurchaseAmt(req);
  if (result?.error) {
    const err = new Error(result.error.message || 'Request failed');
    err.statusCode = result.error.status || 500;
    throw err;
  }
  return res.status(200).json(result);
});
