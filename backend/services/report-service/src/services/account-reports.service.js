const repository = require('../repositories/account-reports');

function parseDateDdMmYyyy(value) {
  const raw = String(value || '').trim();
  if (!raw) return '';
  const iso = raw.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (iso) {
    const yyyy = Number(iso[1]);
    const mm = Number(iso[2]);
    const dd = Number(iso[3]);
    if (!yyyy || mm < 1 || mm > 12 || dd < 1) return '';
    const daysInMonth = new Date(yyyy, mm, 0).getDate();
    if (dd > daysInMonth) return '';
    return `${yyyy}-${String(mm).padStart(2, '0')}-${String(dd).padStart(2, '0')}`;
  }
  const m = raw.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (!m) {
    const alt = raw.match(/^(\d{2})-(\d{2})-(\d{4})$/);
    if (alt) {
      const dd = Number(alt[1]);
      const mm = Number(alt[2]);
      const yyyy = Number(alt[3]);
      if (!yyyy || mm < 1 || mm > 12 || dd < 1) return '';
      const daysInMonth = new Date(yyyy, mm, 0).getDate();
      if (dd > daysInMonth) return '';
      return `${yyyy}-${String(mm).padStart(2, '0')}-${String(dd).padStart(2, '0')}`;
    }
    const parsed = new Date(raw);
    if (Number.isNaN(parsed.getTime())) return '';
    const dd = String(parsed.getDate()).padStart(2, '0');
    const mm = String(parsed.getMonth() + 1).padStart(2, '0');
    const yyyy = parsed.getFullYear();
    return `${yyyy}-${mm}-${dd}`;
  }
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

    const createRow = (part, varName, isBold = false) => ({
      particular: part,
      variety: varName,
      uom: 'QTL',
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

    const rows = await repository.getVarietyWiseCanePurchaseRows(fCode, fromDate, toIso, season);
    rows.forEach(row => {
      const idx = factIndexMap.get(row.M_FACTORY);
      if (idx === undefined) return;
      const cat = Number(row.category);
      const qty = Number(row.qty || 0);

      if (row.isGate) {
        if (Number(row.dt_state) === 0) {
          const tIdx = [1, 2, 3, 0].indexOf(cat);
          if (tIdx !== -1) { rowsMap.gateUP[tIdx].data[idx] += qty; rowsMap.gateUP[tIdx].total += qty; rowsMap.gateUPTotal.data[idx] += qty; rowsMap.gateUPTotal.total += qty; }
        } else {
          const tIdx = [1, 2, 3, 0].indexOf(cat);
          if (tIdx !== -1) { rowsMap.gateBihar[tIdx].data[idx] += qty; rowsMap.gateBihar[tIdx].total += qty; rowsMap.gateBiharTotal.data[idx] += qty; rowsMap.gateBiharTotal.total += qty; }
        }
      } else {
        if (Number(row.v_alloted) === 9 && Number(row.dt_state) === 0) {
          const tIdx = [1, 2, 3].indexOf(cat);
          if (tIdx !== -1) { rowsMap.centerUPNew[tIdx].data[idx] += qty; rowsMap.centerUPNew[tIdx].total += qty; rowsMap.centerUPTotal.data[idx] += qty; rowsMap.centerUPTotal.total += qty; }
        }
        if (Number(row.c_state) === 0) {
          const tIdx = [1, 2, 3].indexOf(cat);
          if (tIdx !== -1) { rowsMap.centerUP[tIdx].data[idx] += qty; rowsMap.centerUP[tIdx].total += qty; rowsMap.centerUPTotal.data[idx] += qty; rowsMap.centerUPTotal.total += qty; }
        }
        if (Number(row.C_centalloted) === 1 && Number(row.c_state) === 1) {
          const tIdx = [1, 2, 3].indexOf(cat);
          if (tIdx !== -1) { rowsMap.centerBihar[tIdx].data[idx] += qty; rowsMap.centerBihar[tIdx].total += qty; rowsMap.centerBiharTotal.data[idx] += qty; rowsMap.centerBiharTotal.total += qty; }
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

    const summaryRows = ['EARLY', 'GENERAL', 'REJECTED', 'BURNT'].map(n => createRow('Variety Wise Cane Purchase', n));
    const grandSum = createRow('Variety Wise Cane Purchase', 'Grand Total', true);
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
  async getCapacityUtilisation(req) {
    const season = resolveSeason(req.user?.season);
    const params = { ...(req.query || {}), ...(req.body || {}) };
    const fCode = String(params.F_code || params.F_Code || '0').trim();
    const toIso = parseDateDdMmYyyy(params.toDate || params.ToDate || params.date || '');
    if (!toIso) {
      return { error: { status: 400, message: 'Invalid or missing To Date (dd/MM/yyyy).' } };
    }

    const factories = await repository.getFactories(fCode, season);
    const data = [];

    for (const f of factories) {
      const factCode = String(f.f_Code || f.F_Code || '').trim();
      if (!factCode) continue;
      const rows = await repository.getCapacityUtilisationRow(factCode, toIso, season);
      if (!rows || !rows.length) continue;

      const totalCapacityAvailableforPlantSum = rows.reduce((s, r) => s + Number(r.TotalCapacityAvailableforPlant || 0), 0);
      const totalCaneCrushed = rows.reduce((s, r) => s + Number(r.TotalCaneCrushed || 0), 0);

      let totalPlantRunDays = 0;
      if (totalCapacityAvailableforPlantSum === 0) {
        totalPlantRunDays = rows.reduce((s, r) => s + (Number(r.TotalPlantRunDays || 0) * Number(r.TotalCapacityAvailableforPlant || 0)), 0);
      } else {
        totalPlantRunDays = rows.reduce((s, r) => s + (Number(r.TotalPlantRunDays || 0) * Number(r.TotalCapacityAvailableforPlant || 0)), 0) / totalCapacityAvailableforPlantSum;
      }

      const crushingCapacityPerday = rows.reduce((s, r) => s + Number(r.CrushingCapacityPerday || 0), 0) / rows.length;
      const operationalCapacity = rows.reduce((s, r) => s + Number(r.OperationalCapacity || 0), 0) / rows.length;
      const cnDate = rows[0]?.CnDate || '';
      const toDateCapUt = Number(rows[0]?.ToDateCapUt || 0);

      data.push({
        factoryCode: factCode,
        factory: f.F_Name || f.f_Name || '',
        TotalCapacityAvailableforPlant: totalCapacityAvailableforPlantSum,
        TotalCaneCrushed: totalCaneCrushed,
        TotalPlantRunDays: Number(Number(totalPlantRunDays || 0).toFixed(2)),
        CrushingCapacityPerday: Number(Number(crushingCapacityPerday || 0).toFixed(2)),
        OperationalCapacity: Number(Number(operationalCapacity || 0).toFixed(2)),
        CnDate: cnDate,
        ToDateCapUt: Number(Number(toDateCapUt || 0).toFixed(2))
      });
    }

    return { status: 'success', data };
  }
  ,
  async getCapacityUtilisationPeriodical(req) {
    const season = resolveSeason(req.user?.season);
    const params = { ...(req.query || {}), ...(req.body || {}) };
    const fCode = String(params.F_code || params.F_Code || '0').trim();
    const fromIso = parseDateDdMmYyyy(params.fromDate || params.FromDate || '');
    const toIso = parseDateDdMmYyyy(params.toDate || params.ToDate || '');

    if (!fromIso || !toIso) {
      return { error: { status: 400, message: 'Invalid or missing From/To Date (dd/MM/yyyy).' } };
    }

    const factories = await repository.getFactories(fCode, season);
    const data = [];

    for (const f of factories) {
      const factCode = String(f.f_Code || f.F_Code || '').trim();
      if (!factCode) continue;
      const rows = await repository.getCapacityUtilisationPeriodicalRow(factCode, fromIso, toIso, season);
      if (!rows || !rows.length) continue;

      const totalCapacityAvailableforPlantSum = rows.reduce((s, r) => s + Number(r.TotalCapacityAvailableforPlant || 0), 0);
      const totalCaneCrushed = rows.reduce((s, r) => s + Number(r.TotalCaneCrushed || 0), 0);

      let totalPlantRunDays = 0;
      if (totalCapacityAvailableforPlantSum === 0) {
        totalPlantRunDays = rows.reduce((s, r) => s + (Number(r.TotalPlantRunDays || 0) * Number(r.TotalCapacityAvailableforPlant || 0)), 0);
      } else {
        totalPlantRunDays = rows.reduce((s, r) => s + (Number(r.TotalPlantRunDays || 0) * Number(r.TotalCapacityAvailableforPlant || 0)), 0) / totalCapacityAvailableforPlantSum;
      }

      const crushingCapacityPerday = rows.reduce((s, r) => s + Number(r.CrushingCapacityPerday || 0), 0) / rows.length;
      const operationalCapacity = rows.reduce((s, r) => s + Number(r.OperationalCapacity || 0), 0) / rows.length;
      const cnDate = rows[0]?.CnDate || '';
      const toDateCapUt = Number(rows[0]?.ToDateCapUt || 0);

      data.push({
        factoryCode: factCode,
        factory: f.F_Name || f.f_Name || '',
        TotalCapacityAvailableforPlant: totalCapacityAvailableforPlantSum,
        TotalCaneCrushed: totalCaneCrushed,
        TotalPlantRunDays: Number(Number(totalPlantRunDays || 0).toFixed(2)),
        CrushingCapacityPerday: Number(Number(crushingCapacityPerday || 0).toFixed(2)),
        OperationalCapacity: Number(Number(operationalCapacity || 0).toFixed(2)),
        CnDate: cnDate,
        ToDateCapUt: Number(Number(toDateCapUt || 0).toFixed(2))
      });
    }

    return { status: 'success', data };
  }
  ,
  async getDistilleryReport(req) {
    const season = resolveSeason(req.user?.season);
    const params = { ...(req.query || {}), ...(req.body || {}) };
    const fCode = String(params.F_Code || params.F_code || params.factoryCode || '0').trim();
    const fromRaw = params.FDate || params.FromDate || params.fromDate || '';
    const toRaw = params.TDate || params.ToDate || params.toDate || '';
    const toIso = parseDateDdMmYyyy(toRaw);
    const fromIso = parseDateDdMmYyyy(fromRaw) || toIso;

    if (!toIso) {
      return { error: { status: 400, message: 'Invalid or missing To Date (dd/MM/yyyy).' } };
    }

    const start = new Date(fromIso);
    const end = new Date(toIso);
    const monthStart = new Date(start.getFullYear(), start.getMonth(), 1);
    const monthEnd = new Date(end.getFullYear(), end.getMonth(), 1);

    const monthlyData = [];
    for (let dt = new Date(monthStart); dt <= monthEnd; dt.setMonth(dt.getMonth() + 1)) {
      const curStart = new Date(dt.getFullYear(), dt.getMonth(), 1);
      const curEnd = new Date(dt.getFullYear(), dt.getMonth() + 1, 0);
      const startIso = curStart.toISOString().slice(0, 10);
      const endIso = curEnd.toISOString().slice(0, 10);

      const rows = await repository.getDistilleryReportMonthlyTotals(fCode, startIso, endIso, season);
      const r = rows?.[0] || {};

      const AS_DISTBO_BAG_RECD_OTH_PL = Number(r.AS_DISTBO_BAG_RECD_OTH_PL || 0);
      const AS_DISTBO_BAG_RECD_COGEN = Number(r.AS_DISTBO_BAG_RECD_COGEN || 0);
      const AS_SD_BAG_TR_OWN_DIST = Number(r.AS_SD_BAG_TR_OWN_DIST || 0);
      const AS_DISTBO_BAG_CONSU = Number(r.AS_DISTBO_BAG_CONSU || 0);
      const AS_DISTBO_BAG_EX_SH = Number(r.AS_DISTBO_BAG_EX_SH || 0);
      const AS_DISTBO_BAG_CLSTOCK = Number(r.AS_DISTBO_BAG_CLSTOCK || 0);
      const AS_DISTBO_BAG_TRANSIT = Number(r.AS_DISTBO_BAG_TRANSIT || 0);
      const AS_DISTBO_BAG_PHY_STOCK = Number(r.AS_DISTBO_BAG_PHY_STOCK || 0);
      const AS_DISTBO_BAG_PUR_OOTSIDE = Number(r.AS_DISTBO_BAG_PUR_OOTSIDE || 0);
      const AS_COG_BAG_OUTS_TR_DIST = Number(r.AS_COG_BAG_OUTS_TR_DIST || 0);
      const AS_DISTBO_LS_BIOG_CONSU = Number(r.AS_DISTBO_LS_BIOG_CONSU || 0);
      const AS_DISTBO_LS_SLOP_CONSU = Number(r.AS_DISTBO_LS_SLOP_CONSU || 0);
      const AS_DISTBO_LS_GENET_BAG = Number(r.AS_DISTBO_LS_GENET_BAG || 0);
      const AS_DISTBO_LS_GENET_BOIG = Number(r.AS_DISTBO_LS_GENET_BOIG || 0);
      const AS_DISTBO_LS_GENET_SLOP = Number(r.AS_DISTBO_LS_GENET_SLOP || 0);
      const AS_DISTBO_LS_GIV_SUG = Number(r.AS_DISTBO_LS_GIV_SUG || 0);
      const AS_COG_LS_GIV_DIST = Number(r.AS_COG_LS_GIV_DIST || 0);
      const AS_DISTBO_LS_GIV_DIST = Number(r.AS_DISTBO_LS_GIV_DIST || 0);
      const AS_DISTBO_LS_CONSU_DIST = Number(r.AS_DISTBO_LS_CONSU_DIST || 0);
      const AS_DISTBO_LS_CONSU_DISTBOI = Number(r.AS_DISTBO_LS_CONSU_DISTBOI || 0);
      const AS_DISTBO_LS_GIV_BACKP_TURB = Number(r.AS_DISTBO_LS_GIV_BACKP_TURB || 0);
      const AS_DISTBO_LS_GIV_CONDE_TURB = Number(r.AS_DISTBO_LS_GIV_CONDE_TURB || 0);
      const AS_DISTBO_LS_LOSSES = Number(r.AS_DISTBO_LS_LOSSES || 0);
      const AS_DISTBO_EXS_GIV_SUG = Number(r.AS_DISTBO_EXS_GIV_SUG || 0);
      const AS_DISTBO_EXS_GIV_DIST = Number(r.AS_DISTBO_EXS_GIV_DIST || 0);
      const AS_DISTBO_EXS_LOSSES = Number(r.AS_DISTBO_EXS_LOSSES || 0);
      const AS_DISTBO_TUR_PROD_POWER = Number(r.AS_DISTBO_TUR_PROD_POWER || 0);
      const AS_DISTBO_TUR_EXP_UPPCL = Number(r.AS_DISTBO_TUR_EXP_UPPCL || 0);
      const AS_DISTBO_TUR_EXP_LMONTH = Number(r.AS_DISTBO_TUR_EXP_LMONTH || 0);
      const AS_DISTBO_TUR_BNK_MONTH = Number(r.AS_DISTBO_TUR_BNK_MONTH || 0);
      const AS_DISTBO_TUR_TR_POWER_SUG = Number(r.AS_DISTBO_TUR_TR_POWER_SUG || 0);
      const AS_DISTBO_TUR_TR_DIST_PROCESS = Number(r.AS_DISTBO_TUR_TR_DIST_PROCESS || 0);
      const AS_DISTBO_TUR_DIST_BOI = Number(r.AS_DISTBO_TUR_DIST_BOI || 0);
      const AS_DISTBO_TUR_TR_CONGEN = Number(r.AS_DISTBO_TUR_TR_CONGEN || 0);
      const AS_DISTBO_TUR_ECOT = Number(r.AS_DISTBO_TUR_ECOT || 0);
      const AS_DISTBO_TUR_LOSSES = Number(r.AS_DISTBO_TUR_LOSSES || 0);

      const Closing_Stock_Own_Baggase = AS_DISTBO_BAG_RECD_OTH_PL + AS_DISTBO_BAG_RECD_COGEN + AS_DISTBO_BAG_CONSU + AS_DISTBO_BAG_EX_SH;
      const Check = Closing_Stock_Own_Baggase - AS_DISTBO_BAG_CLSTOCK;
      const Bagasse_Purchased_from_Outside_Vendors_recd_from_cogen_div = -AS_COG_BAG_OUTS_TR_DIST;
      const Closing_Stock_from_outside_vendors = AS_DISTBO_BAG_PUR_OOTSIDE + AS_DISTBO_BAG_CONSU + AS_DISTBO_BAG_EX_SH;
      const Live_steam_bagasse_consumed = AS_DISTBO_BAG_CONSU + AS_DISTBO_BAG_CONSU;
      const Live_steam_received_from_Cogen_Boiler = -AS_COG_LS_GIV_DIST;
      const Sub_Total_of_Steam_generation = AS_DISTBO_LS_GENET_BAG + AS_DISTBO_LS_GENET_BOIG + AS_DISTBO_LS_GENET_SLOP;
      const Total_Live_Steam_available_at_Distllery = Sub_Total_of_Steam_generation + Live_steam_received_from_Cogen_Boiler;
      const Check_1 = Total_Live_Steam_available_at_Distllery + AS_DISTBO_LS_GIV_SUG + AS_DISTBO_LS_GIV_DIST + AS_DISTBO_LS_CONSU_DIST + AS_DISTBO_LS_CONSU_DISTBOI + AS_DISTBO_LS_GIV_BACKP_TURB + AS_DISTBO_LS_GIV_CONDE_TURB + AS_DISTBO_LS_LOSSES;
      const Exhaust_Steam_Generated = -AS_DISTBO_LS_GIV_BACKP_TURB;
      const Check_2 = Exhaust_Steam_Generated + AS_DISTBO_EXS_LOSSES + AS_DISTBO_EXS_GIV_DIST + AS_DISTBO_EXS_GIV_SUG;
      const Live_steam_consumed = -(AS_DISTBO_LS_GIV_BACKP_TURB + AS_DISTBO_LS_GIV_CONDE_TURB);
      const Total = AS_DISTBO_TUR_PROD_POWER + AS_DISTBO_TUR_EXP_UPPCL + AS_DISTBO_TUR_EXP_LMONTH + AS_DISTBO_TUR_BNK_MONTH + AS_DISTBO_TUR_TR_POWER_SUG + AS_DISTBO_TUR_TR_DIST_PROCESS + AS_DISTBO_TUR_DIST_BOI + AS_DISTBO_TUR_TR_CONGEN + AS_DISTBO_TUR_ECOT + AS_DISTBO_TUR_LOSSES;
      const Bagasse_to_Steam_Ratio = Live_steam_bagasse_consumed !== 0 ? AS_DISTBO_LS_GENET_BAG / (-Live_steam_bagasse_consumed / 10) : 0;
      const Bio_Gas_to_Steam_ratio = AS_DISTBO_LS_BIOG_CONSU !== 0 ? AS_DISTBO_LS_GENET_BOIG / (-AS_DISTBO_LS_BIOG_CONSU / 10) : 0;
      const Slop_to_Steam_ratio = AS_DISTBO_LS_SLOP_CONSU !== 0 ? AS_DISTBO_LS_GENET_SLOP / (-AS_DISTBO_LS_SLOP_CONSU / 10) : 0;

      monthlyData.push({
        MonthEndDate: endIso,
        AS_SD_BAG_TR_OWN_DIST,
        AS_DISTBO_BAG_RECD_OTH_PL,
        AS_DISTBO_BAG_RECD_COGEN,
        AS_DISTBO_BAG_CONSU,
        AS_DISTBO_BAG_EX_SH,
        Closing_Stock_Own_Baggase,
        AS_DISTBO_BAG_CLSTOCK,
        Check,
        Check_1,
        Check_2,
        Total,
        AS_DISTBO_BAG_TRANSIT,
        AS_DISTBO_BAG_PHY_STOCK,
        AS_DISTBO_BAG_PUR_OOTSIDE,
        Bagasse_Purchased_from_Outside_Vendors_recd_from_cogen_div,
        Closing_Stock_from_outside_vendors,
        Live_steam_bagasse_consumed,
        AS_DISTBO_LS_BIOG_CONSU,
        AS_DISTBO_LS_SLOP_CONSU,
        AS_DISTBO_LS_GENET_BAG,
        AS_DISTBO_LS_GENET_BOIG,
        AS_DISTBO_LS_GENET_SLOP,
        AS_DISTBO_LS_GIV_SUG,
        Live_steam_received_from_Cogen_Boiler,
        AS_DISTBO_LS_GIV_DIST,
        AS_DISTBO_LS_CONSU_DIST,
        AS_DISTBO_LS_CONSU_DISTBOI,
        AS_DISTBO_LS_GIV_BACKP_TURB,
        AS_DISTBO_LS_GIV_CONDE_TURB,
        AS_DISTBO_LS_LOSSES,
        Sub_Total_of_Steam_generation,
        Total_Live_Steam_available_at_Distllery,
        Exhaust_Steam_Generated,
        AS_DISTBO_EXS_GIV_SUG,
        AS_DISTBO_EXS_GIV_DIST,
        AS_DISTBO_EXS_LOSSES,
        Live_steam_consumed,
        AS_DISTBO_TUR_PROD_POWER,
        AS_DISTBO_TUR_EXP_UPPCL,
        AS_DISTBO_TUR_EXP_LMONTH,
        AS_DISTBO_TUR_BNK_MONTH,
        AS_DISTBO_TUR_TR_POWER_SUG,
        AS_DISTBO_TUR_TR_DIST_PROCESS,
        AS_DISTBO_TUR_DIST_BOI,
        AS_DISTBO_TUR_TR_CONGEN,
        AS_DISTBO_TUR_ECOT,
        AS_DISTBO_TUR_LOSSES,
        Bagasse_to_Steam_Ratio,
        Bio_Gas_to_Steam_ratio,
        Slop_to_Steam_ratio
      });
    }

    return { status: 'success', data: { monthlyData } };
  }
};
