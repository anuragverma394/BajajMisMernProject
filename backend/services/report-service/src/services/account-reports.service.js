const repository = require('../repositories/account-reports');

function parseDateDdMmYyyy(value) {
  const raw = String(value || '').trim();
  if (!raw) return '';
  const m = raw.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (!m) return '';
  const dd = Number(m[1]);
  const mm = Number(m[2]);
  const yyyy = Number(m[3]);
  if (!yyyy || mm < 1 || mm > 12 || dd < 1) return '';
  const daysInMonth = new Date(yyyy, mm, 0).getDate();
  if (dd > daysInMonth) return '';
  return `${yyyy}-${String(mm).padStart(2, '0')}-${String(dd).padStart(2, '0')}`;
}
const validation = require('../validations/account-reports.validation');

function resolveSeason(value) {
  return String(value || process.env.DEFAULT_SEASON || '2526');
}

function buildError(status, message) {
  return { error: { status, message } };
}

const normalizeCommand = (value) => String(value || '').trim().toLowerCase();

function validateFactoryCode(factoryCodeRaw, factoryCode) {
  if (factoryCodeRaw !== '' && (!Number.isFinite(factoryCode) || factoryCode <= 0)) {
    return buildError(400, 'factoryCode must be a valid positive number');
  }
  return null;
}

function validateTransferPayload(payload) {
  if (!payload.T_Factory || !payload.R_Factory || !payload.R_TDate) {
    return buildError(400, 't_Factory, r_Factory and r_TDate are required');
  }
  return null;
}

function requireId(id, actionLabel) {
  if (!id) return buildError(400, `id is required for ${actionLabel}`);
  return null;
}

async function getTransferData(req) {
  const season = resolveSeason(req.user?.season);
  const { rid, factoryCodeRaw, factoryCode } = validation.normalizeTransferReadQuery(req);

  const factoryError = validateFactoryCode(factoryCodeRaw, factoryCode);
  if (factoryError) return factoryError;

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

  const payloadError = validateTransferPayload(payload);
  if (payloadError) return payloadError;

  const command = normalizeCommand(payload.command);

  if (command === 'btupdate' || command === 'update') {
    const idError = requireId(payload.id, 'update');
    if (idError) return idError;
    await repository.updateTransfer(payload, season);
    return { data: { success: true, message: 'Updated successfully' }, status: 200 };
  }

  if (command === 'delete') {
    const idError = requireId(payload.id, 'delete');
    if (idError) return idError;
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
    return buildError(400, 'id is required');
  }
  await repository.deleteTransfer(id, season);
  return { data: { success: true }, status: 200 };
}

module.exports = {
  getTransferData,
  mutateTransferData,
  deleteTransferById,
  async getVarietyWiseCanePurchaseAmt(req) {
    const season = resolveSeason(req.user?.season);
    const params = { ...(req.query || {}), ...(req.body || {}) };
    const fCode = String(params.F_code || params.F_Code || '0').trim();

    const fromIso = parseDateDdMmYyyy(params.FDate || params.FromDate || '');
    const toIso = parseDateDdMmYyyy(params.TDate || params.ToDate || '');
    if (!toIso) {
      return { error: { status: 400, message: 'Invalid or missing To Date (dd/MM/yyyy).' } };
    }
    const fromDate = fromIso || toIso;

    const factories = await repository.getFactories(fCode, season);
    const factIndexMap = new Map(factories.map((f, i) => [f.f_Code || f.F_Code, i]));
    const rows = await repository.getVarietyWiseCanePurchaseAmtRows(fCode, fromDate, toIso, season);

    const createRow = (part, varName, isBold = false) => ({
      particular: part,
      variety: varName,
      uom: 'AMT',
      isBold,
      total: 0,
      data: new Array(factories.length).fill(0)
    });

    const rowsMap = {
      gateUP: [1, 2, 3, 0].map(id => createRow('Cane Purchase at Gate (UP)', id === 0 ? 'BURNT CANE (U.P)' : `GATE CANE ${id === 1 ? 'EARLY' : id === 2 ? 'GENERAL' : 'REJECTED'} ( U.P)`)),
      gateUPTotal: createRow('Cane Purchase at Gate (UP)', 'Sub Total(UP)', true),
      gateBihar: [1, 2, 3, 0].map(id => createRow('Cane Purchase at Gate (Bihar)', id === 0 ? 'BURNT CANE ( BIHAR/UTTARAKHAND)' : `GATE CANE ${id === 1 ? 'EARLY' : id === 2 ? 'GENERAL' : 'REJECTED'} ( BIHAR/UTTARAKHAND)`)),
      gateBiharTotal: createRow('Cane Purchase at Gate (Bihar)', 'Sub Total (Bihar)', true),
      gateGrandTotal: createRow('Sub Total [I]', 'Cane Purchase at Gate', true),
      centerUP: [1, 2, 3].map(id => createRow('Cane Purchase at Centre (UP)', `CENTER CANE ${id === 1 ? 'EARLY' : id === 2 ? 'GENERAL' : 'REJECTED'} (U.P)`)),
      centerUPNew: [1, 2, 3].map(id => createRow('Cane Purchase at Centre (UP)', `CENTER CANE ${id === 1 ? 'EARLY' : id === 2 ? 'GENERAL' : 'REJECTED'} (U.P) NEW`)),
      centerUPTotal: createRow('Cane Purchase at Centre (UP)', 'CENTER CANE (U.P) [Total]', true),
      centerBihar: [1, 2, 3].map(id => createRow('Cane Purchase at Centre (Bihar)', `CENTER CANE ${id === 1 ? 'EARLY' : id === 2 ? 'GENERAL' : 'REJECTED'} (BIHAR/UTTARAKHAND)`)),
      centerBiharTotal: createRow('Cane Purchase at Centre (Bihar)', 'CENTER CANE ( BIHAR/UTTARAKHAND) Total', true),
      centerGrandTotal: createRow('Sub Total [II]', 'Cane Purchase at Centre', true),
      totalGrandTotal: createRow('TOTAL ( I + II )', 'Total Cane Purchase', true)
    };

    rows.forEach(row => {
      const idx = factIndexMap.get(row.M_FACTORY);
      if (idx === undefined) return;
      const cat = Number(row.category);
      const amt = Number(row.totalAmt || 0);

      if (row.isGate) {
        if (Number(row.dt_state) === 0) {
          const tIdx = [1, 2, 3, 0].indexOf(cat);
          if (tIdx !== -1) { rowsMap.gateUP[tIdx].data[idx] += amt; rowsMap.gateUP[tIdx].total += amt; rowsMap.gateUPTotal.data[idx] += amt; rowsMap.gateUPTotal.total += amt; }
        } else {
          const tIdx = [1, 2, 3, 0].indexOf(cat);
          if (tIdx !== -1) { rowsMap.gateBihar[tIdx].data[idx] += amt; rowsMap.gateBihar[tIdx].total += amt; rowsMap.gateBiharTotal.data[idx] += amt; rowsMap.gateBiharTotal.total += amt; }
        }
      } else {
        if (Number(row.dt_state) === 0) {
          if (Number(row.v_alloted) === 9) {
            const tIdx = [1, 2, 3].indexOf(cat);
            if (tIdx !== -1) { rowsMap.centerUPNew[tIdx].data[idx] += amt; rowsMap.centerUPNew[tIdx].total += amt; rowsMap.centerUPTotal.data[idx] += amt; rowsMap.centerUPTotal.total += amt; }
          } else if (Number(row.c_state) === 0) {
            const tIdx = [1, 2, 3].indexOf(cat);
            if (tIdx !== -1) { rowsMap.centerUP[tIdx].data[idx] += amt; rowsMap.centerUP[tIdx].total += amt; rowsMap.centerUPTotal.data[idx] += amt; rowsMap.centerUPTotal.total += amt; }
          }
        } else if (Number(row.C_centalloted) === 1) {
          const tIdx = [1, 2, 3].indexOf(cat);
          if (tIdx !== -1) { rowsMap.centerBihar[tIdx].data[idx] += amt; rowsMap.centerBihar[tIdx].total += amt; rowsMap.centerBiharTotal.data[idx] += amt; rowsMap.centerBiharTotal.total += amt; }
        }
      }
    });

    for (let i = 0; i < factories.length; i++) {
      rowsMap.gateGrandTotal.data[i] = rowsMap.gateUPTotal.data[i] + rowsMap.gateBiharTotal.data[i];
      rowsMap.gateGrandTotal.total += rowsMap.gateGrandTotal.data[i];
      rowsMap.centerGrandTotal.data[i] = rowsMap.centerUPTotal.data[i] + rowsMap.centerBiharTotal.data[i];
      rowsMap.centerGrandTotal.total += rowsMap.centerGrandTotal.data[i];
      rowsMap.totalGrandTotal.data[i] = rowsMap.gateGrandTotal.data[i] + rowsMap.centerGrandTotal.data[i];
      rowsMap.totalGrandTotal.total += rowsMap.totalGrandTotal.data[i];
    }

    const summaryRows = ['EARLY', 'GENERAL', 'REJECTED', 'BURNT'].map(n => createRow('Variety Wise Amount', n));
    const grandSum = createRow('Variety Wise Amount', 'Grand Total', true);
    const [eSum, gSum, rSum, bSum] = summaryRows;

    for (let i = 0; i < factories.length; i++) {
      eSum.data[i] = rowsMap.gateUP[0].data[i] + rowsMap.gateBihar[0].data[i] + rowsMap.centerUP[0].data[i] + rowsMap.centerUPNew[0].data[i] + rowsMap.centerBihar[0].data[i];
      gSum.data[i] = rowsMap.gateUP[1].data[i] + rowsMap.gateBihar[1].data[i] + rowsMap.centerUP[1].data[i] + rowsMap.centerUPNew[1].data[i] + rowsMap.centerBihar[1].data[i];
      rSum.data[i] = rowsMap.gateUP[2].data[i] + rowsMap.gateBihar[2].data[i] + rowsMap.centerUP[2].data[i] + rowsMap.centerUPNew[2].data[i] + rowsMap.centerBihar[2].data[i];
      bSum.data[i] = rowsMap.gateUP[3].data[i] + rowsMap.gateBihar[3].data[i];
      grandSum.data[i] = eSum.data[i] + gSum.data[i] + rSum.data[i] + bSum.data[i];
      eSum.total += eSum.data[i]; gSum.total += gSum.data[i]; rSum.total += rSum.data[i]; bSum.total += bSum.data[i]; grandSum.total += grandSum.data[i];
    }

    const finalData = [
      ...rowsMap.gateUP, rowsMap.gateUPTotal, ...rowsMap.gateBihar, rowsMap.gateBiharTotal, rowsMap.gateGrandTotal,
      ...rowsMap.centerUP, ...rowsMap.centerUPNew, rowsMap.centerUPTotal, ...rowsMap.centerBihar, rowsMap.centerBiharTotal, rowsMap.centerGrandTotal,
      rowsMap.totalGrandTotal, { type: 'SummaryHeader', id: 'summary-h' }, ...summaryRows, grandSum
    ];
    finalData.forEach((r, idx) => { if (!r.id) r.id = `row-${idx}`; });

    return {
      status: 'success',
      factories: factories.map(f => f.F_Name || f.f_Name || ''),
      data: finalData
    };
  }
  ,
  async getVarietyWiseCanePurchase(req) {
    const season = resolveSeason(req.user?.season);
    const params = { ...(req.query || {}), ...(req.body || {}) };
    const fCode = String(params.F_code || params.F_Code || '0').trim();

    const fromIso = parseDateDdMmYyyy(params.FDate || params.FromDate || '');
    const toIso = parseDateDdMmYyyy(params.TDate || params.ToDate || '');
    if (!toIso) {
      return { error: { status: 400, message: 'Invalid or missing To Date (dd/MM/yyyy).' } };
    }
    const fromDate = fromIso || toIso;

    const factories = await repository.getFactories(fCode, season);
    const factIndexMap = new Map(factories.map((f, i) => [f.f_Code || f.F_Code, i]));

    const varieties = [
      { id: '1', label: 'GATE CANE EARLY ( U.P)' },
      { id: '2', label: 'GATE CANE GENERAL (U.P)' },
      { id: '3', label: 'GATE CANE REJECTED (U.P)' }
    ];

    const reportData = varieties.map(v => ({
      variety: v.label,
      uom: 'QTL',
      total: 0,
      data: new Array(factories.length).fill(0)
    }));

    const rows = await repository.getVarietyWiseCanePurchaseRows(fCode, fromDate, toIso, season);
    rows.forEach(row => {
      const fIdx = factIndexMap.get(row.M_FACTORY);
      const vIdx = varieties.findIndex(v => v.id === row.category);
      if (fIdx !== undefined && vIdx !== -1) {
        reportData[vIdx].data[fIdx] += row.qty || 0;
        reportData[vIdx].total += row.qty || 0;
      }
    });

    return {
      status: 'success',
      factories: factories.map(f => f.F_Name || f.f_Name || ''),
      data: reportData
    };
  }
};
