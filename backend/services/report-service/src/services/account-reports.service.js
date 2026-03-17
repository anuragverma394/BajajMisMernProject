const repository = require('../repositories/account-reports');
const validation = require('../validations/account-reports.validation');

function resolveSeason(value) {
  return String(value || process.env.DEFAULT_SEASON || '2526');
}

async function getTransferData(req) {
  const season = resolveSeason(req.user?.season);
  const { rid, factoryCodeRaw, factoryCode } = validation.normalizeTransferReadQuery(req);

  if (factoryCodeRaw !== '' && (!Number.isFinite(factoryCode) || factoryCode <= 0)) {
    return { error: { status: 400, message: 'factoryCode must be a valid positive number' } };
  }

  if (rid) {
    const row = await repository.findTransferById(rid, season);
    return { data: row, status: 200 };
  }

  const rows = await repository.listTransfers(factoryCode, season);
  return { data: rows, status: 200 };
}

async function mutateTransferData(req) {
  const season = resolveSeason(req.user?.season);
  const payload = validation.normalizeTransferWriteBody(req);

  if (!payload.T_Factory || !payload.R_Factory || !payload.R_TDate) {
    return { error: { status: 400, message: 't_Factory, r_Factory and r_TDate are required' } };
  }

  if (payload.command === 'btupdate' || payload.command === 'update') {
    if (!payload.id) {
      return { error: { status: 400, message: 'id is required for update' } };
    }
    await repository.updateTransfer(payload, season);
    return { data: { success: true, message: 'Updated successfully' }, status: 200 };
  }

  if (payload.command === 'delete') {
    if (!payload.id) {
      return { error: { status: 400, message: 'id is required for delete' } };
    }
    await repository.deleteTransfer(payload.id, season);
    return { data: { success: true, message: 'Deleted successfully' }, status: 200 };
  }

  await repository.createTransfer(payload, season);
  return { data: { success: true, message: 'Saved successfully' }, status: 200 };
}

async function deleteTransferById(req) {
  const season = resolveSeason(req.user?.season);
  const id = String(req.query.id || req.body.id || '').trim();
  if (!id) {
    return { error: { status: 400, message: 'id is required' } };
  }
  await repository.deleteTransfer(id, season);
  return { data: { success: true }, status: 200 };
}

module.exports = {
  getTransferData,
  mutateTransferData,
  deleteTransferById
};
