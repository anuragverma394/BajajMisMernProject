const repository = require('../repositories/new-report');

/**
 * GET: Target vs Actual MIS Periodically
 */
async function getTargetVsActualMisPeriodically(season) {
  try {
    const data = await repository.getTargetVsActualMisPeriodically(season);
    return data || [];
  } catch (error) {
    throw new Error(`Failed to fetch target/actual MIS periodic: ${error.message}`);
  }
}

/**
 * GET: Target Actual MIS Data with date range
 */
async function getTargetActualMISData(factoryName, dateFrom, dateTo, season) {
  try {
    const fromRaw = String(dateFrom || '').trim();
    const toRaw = String(dateTo || '').trim();
    const fm = fromRaw.match(/^(\d{2})[\/\-](\d{2})[\/\-](\d{4})$/);
    const tm = toRaw.match(/^(\d{2})[\/\-](\d{2})[\/\-](\d{4})$/);
    const fromYmd = fm ? `${fm[3]}-${fm[2]}-${fm[1]}` : fromRaw;
    const toYmd = tm ? `${tm[3]}-${tm[2]}-${tm[1]}` : toRaw;
    const fCode = factoryName && String(factoryName).trim() !== '0' ? String(factoryName).trim() : '';

    const targets = await repository.getTargetDataByFactID(fCode, season);
    if (!targets || targets.length === 0) {
      return [];
    }

    const rows = [];
    const sumsByZone = {
      WZ: initSummary(),
      CZ: initSummary(),
      EZ: initSummary()
    };
    const totals = initSummary();

    for (const t of targets) {
      const row = initRow();
      row.FACTORY = String(t.F_Short || '');
      row.CPSYRUP = String(t.CP_Syrup || 0);
      row.CPBHY = String(t.CP_BHY || 0);
      row.CPFM = String(t.CP_FM || 0);
      row.CPTOTAL = String(t.CP_Total || 0);
      row.POL_PERC_TARGET = String(t.CP_PolPTarget || 0);
      row.REC_PERC_TARGET = String(t.CP_RecPTarget || 0);
      row.BH_PERC_TARGET = String(t.CP_BHPTarget || 0);
      row.CH_PERC_TARGET = String(t.CP_CHPTarget || 0);
      row.MOL_PERC_BHY_TARGET = String(t.CP_LossMolBHYPTarget || 0);
      row.MOL_PERC_CHY_TARGET = String(t.CP_LossMolCHYPTarget || 0);
      row.MOL_PERC_BCHY_TARGET = String(t.CP_LossMolBHYCHYPTarget || 0);
      row.STCANE_PERC_TARGET = String(t.CP_SteamPTarget || 0);
      row.BAGASE_PERC_TARGET = String(t.CCP_BagassPTarget || 0);
      row.ALHL_TOTAL_TARGET = String((Number(t.CP_Alcohol_Syrup || 0) + Number(t.CP_Alcohol_BH || 0) + Number(t.CP_Alcohol_CH || 0)));
      row.POWER_PRODUCED_TARGET = String(t.CP_PPTarget || 0);
      row.POWER_EXPORT_TARGET = String(t.CP_PETarget || 0);

      const actuals = await repository.getActualDataRange(String(t.F_Code || '').trim(), fromYmd, toYmd, season);
      if (actuals && actuals.length > 0) {
        let achSyrup = 0;
        let achBhy = 0;
        let achFm = 0;
        let blSyrup = 0;
        let blBhy = 0;
        let blFm = 0;
        for (const a of actuals) {
          const prodType = String(a.Cn_Rec_ThisProdtype || '').trim();
          const crush = Number(a.TCrush || 0);
          if (prodType === '3') {
            achSyrup = crush;
            blSyrup = Number(t.CP_Syrup || 0) - crush;
          } else if (prodType === '1') {
            achBhy = crush;
            blBhy = Number(t.CP_BHY || 0) - crush;
          } else if (prodType === '2') {
            achFm = crush;
            blFm = Number(t.CP_FM || 0) - crush;
          }
        }
        row.ACH_SYRUP = String(achSyrup);
        row.ACH_BHY = String(achBhy);
        row.ACH_FM = String(achFm);
        row.ACHTOTAL = String(achSyrup + achBhy + achFm);
        row.BL_ACH_SYRUP = String(blSyrup);
        row.BL_ACH_BHY = String(blBhy);
        row.BL_ACH_FM = String(blFm);
        row.BLTOTAL = String(blSyrup + blBhy + blFm);
      } else {
        row.ACH_SYRUP = '0';
        row.ACH_BHY = '0';
        row.ACH_FM = '0';
        row.ACHTOTAL = '0';
        row.BL_ACH_SYRUP = String(t.CP_Syrup || 0);
        row.BL_ACH_BHY = String(t.CP_BHY || 0);
        row.BL_ACH_FM = String(t.CP_FM || 0);
        row.BLTOTAL = String(Number(t.CP_Syrup || 0) + Number(t.CP_BHY || 0) + Number(t.CP_FM || 0));
      }

      await repository.getSapData(String(t.F_Code || '').trim(), toYmd, season);

      const pdt = await repository.getPolPercTodateRange(String(t.F_Code || '').trim(), fromYmd, toYmd, season);
      if (pdt && pdt.length > 0) {
        const p = pdt[0];
        row.POL_PERC_ONDATE = posOrZero(p.PolPercOnDate);
        row.POL_PERC_TODATE = posOrZero(p.PolPercToDate);
        row.REC_PERC_ONDATE = posOrZero(p.RecPercOnDate);
        row.REC_PERC_TODATE = posOrZero(p.RecPercToDate);
        row.STCANE_PERC_ONDATE = posOrZero(p.SteamPercOnDate);
        row.STCANE_PERC_TODATE = posOrZero(p.SteamPercToDate);
        row.BAGASE_PERC_ONDATE = nonZeroOrZero(p.BagassePercOnDate);
        row.BAGASE_PERC_TODATE = nonZeroOrZero(p.BagassePercToDate);
      }

      const ppdt = await repository.calculateProductionRange(String(t.F_Code || '').trim(), fromYmd, toYmd, season);
      if (ppdt && ppdt.length > 0) {
        const pp = ppdt[0];
        row.SG_PROD_ONDATE = posOrZero(pp.ProductionOnDate);
        row.SG_PROD_TODATE = posOrZero(pp.ProductionToDate);
        row.BAGASE_QTY_ONDATE = nonZeroOrZero(pp.BagasseQtyOnDate);
        row.BAGASE_QTY_TODATE = nonZeroOrZero(pp.BagasseQtyToDate);
        row.POWER_PRODUCED_ONDATE = posOrZero(pp.PowerProducedKwhOnDate);
        row.POWER_PRODUCED_TODATE = posOrZero(pp.PowerProducedKwhToDate);
        row.POWER_EXPORT_ONDATE = posOrZero(pp.PowerExportKwhOnDate);
        row.POWER_EXPORT_TODATE = posOrZero(pp.PowerExportKwhToDate);
      }

      const ldt = await repository.getLossMolPercOndateTodateDataRange(String(t.F_Code || '').trim(), fromYmd, toYmd, season);
      if (ldt && ldt.length > 0) {
        const l = ldt[0];
        row.MOL_PERC_BHY_ONDATE = posOrZero(l.OnDateBHLossPerc);
        row.MOL_PERC_BHY_TODATE = posOrZero(l.ToDateBHLossPerc);
        row.MOL_PERC_CHY_ONDATE = posOrZero(l.OnDateCHLossPerc);
        row.MOL_PERC_CHY_TODATE = posOrZero(l.ToDateCHLossPerc);
        row.MOL_PERC_BCHY_ONDATE = posOrZero(l.TotalOnDateBCH);
        row.MOL_PERC_BCHY_TODATE = posOrZero(l.TotalToDateBCH);
      }

      const bhch = await repository.getBHCHPercOndateTodateRange(String(t.F_Code || '').trim(), fromYmd, toYmd, season);
      if (bhch && bhch.length > 0) {
        for (const b of bhch) {
          const type = String(b.type || '').trim();
          if (type === '1') {
            row.BH_PERC_ONDATE = posOrZero(b.OnDatePerc);
            row.BH_PERC_TODATE = posOrZero(b.ToDatePerc);
          } else if (type === '2') {
            row.CH_PERC_ONDATE = posOrZero(b.OnDatePerc);
            row.CH_PERC_TODATE = posOrZero(b.ToDatePerc);
          }
        }
      }

      const bhchQty = await repository.getBHCHQtlsOndateTodateRange(String(t.F_Code || '').trim(), fromYmd, toYmd, season);
      if (bhchQty && bhchQty.length > 0) {
        const q = bhchQty[0];
        row.BH_QTY_ONDATE = posOrZero(q.OnDateBHQty);
        row.BH_QTY_TODATE = posOrZero(q.ToDateBHQty);
        row.CH_QTY_ONDATE = posOrZero(q.OnDateCHQty);
        row.CH_QTY_TODATE = posOrZero(q.ToDateCHQty);
      }

      const alco = await repository.getAlcohoOndateTodateDataRange(String(t.F_Code || '').trim(), fromYmd, toYmd, season);
      if (alco && alco.length > 0) {
        const a = alco[0];
        const tonalc = num(a.OnDateSycrup) + num(a.OnDateBH) + num(a.OnDateCH);
        const ttdalc = num(a.ToDateSycrup) + num(a.ToDateBH) + num(a.ToDateCH);
        row.ALHL_TOTAL_ONDATE = String(tonalc);
        row.ALHL_TOTAL_TODATE = String(ttdalc);
      } else {
        row.ALHL_TOTAL_ONDATE = '0';
        row.ALHL_TOTAL_TODATE = '0';
      }

      let onDateCrush = 0;
      let toDateCrush = 0;
      const crushDt = await repository.getOndateTodateCruchRange(String(t.F_Code || '').trim(), fromYmd, toYmd, season);
      if (crushDt && crushDt.length > 0) {
        onDateCrush = num(crushDt[0].OndateCrush);
        toDateCrush = num(crushDt[0].TodateCrush);
      }

      let bhOnDateCrush = 0;
      let bhToDateCrush = 0;
      let chOnDateCrush = 0;
      let chToDateCrush = 0;
      const bhChCrush = await repository.getBhChCaneCrushRange(String(t.F_Code || '').trim(), fromYmd, toYmd, season);
      if (bhChCrush && bhChCrush.length > 0) {
        for (const c of bhChCrush) {
          const type = String(c.type || '').trim();
          if (type === '1') {
            bhOnDateCrush = num(c.OnDate);
            bhToDateCrush = num(c.ToDate);
          } else if (type === '2') {
            chOnDateCrush = num(c.OnDate);
            chToDateCrush = num(c.ToDate);
          }
        }
      }

      rows.push(row);

      const zone = String(t.F_Zone || '').trim();
      if (sumsByZone[zone]) {
        addSummary(sumsByZone[zone], row);
        addCaneCrushWeights(sumsByZone[zone], row, onDateCrush, toDateCrush);
        addBhChWeights(sumsByZone[zone], row, bhOnDateCrush, bhToDateCrush, chOnDateCrush, chToDateCrush);
      }
      addSummary(totals, row);
      addCaneCrushWeights(totals, row, onDateCrush, toDateCrush);
      addBhChWeights(totals, row, bhOnDateCrush, bhToDateCrush, chOnDateCrush, chToDateCrush);
    }

    if (rows.length) {
      rows.push(buildSummaryRow('WZ', sumsByZone.WZ));
      rows.push(buildSummaryRow('CZ', sumsByZone.CZ));
      rows.push(buildSummaryRow('EZ', sumsByZone.EZ));
      rows.push(buildSummaryRow('TOTAL', totals));
    }

    return rows;
  } catch (error) {
    throw new Error(`Failed to fetch target/actual MIS data: ${error.message}`);
  }
}

/**
 * GET: Target Actual MIS SAP New
 */
async function getTargetActualMisSapNew(factoryCode, date, userCode, season) {
  try {
    const data = await repository.getTargetActualMisSapNew(factoryCode, date, userCode, season);
    return data || [];
  } catch (error) {
    throw new Error(`Failed to fetch target/actual MIS SAP: ${error.message}`);
  }
}

function initRow() {
  return {
    FACTORY: '',
    CPSYRUP: '0',
    CPBHY: '0',
    CPFM: '0',
    CPTOTAL: '0',
    ACH_SYRUP: '0',
    ACH_BHY: '0',
    ACH_FM: '0',
    ACHTOTAL: '0',
    BL_ACH_SYRUP: '0',
    BL_ACH_BHY: '0',
    BL_ACH_FM: '0',
    BLTOTAL: '0',
    POL_PERC_TARGET: '0',
    POL_PERC_ONDATE: '0',
    POL_PERC_TODATE: '0',
    REC_PERC_TARGET: '0',
    REC_PERC_ONDATE: '0',
    REC_PERC_TODATE: '0',
    SG_PROD_ONDATE: '0',
    SG_PROD_TODATE: '0',
    BH_PERC_TARGET: '0',
    BH_PERC_ONDATE: '0',
    BH_PERC_TODATE: '0',
    BH_QTY_ONDATE: '0',
    BH_QTY_TODATE: '0',
    CH_PERC_TARGET: '0',
    CH_PERC_ONDATE: '0',
    CH_PERC_TODATE: '0',
    CH_QTY_ONDATE: '0',
    CH_QTY_TODATE: '0',
    MOL_PERC_BHY_TARGET: '0',
    MOL_PERC_BHY_ONDATE: '0',
    MOL_PERC_BHY_TODATE: '0',
    MOL_PERC_CHY_TARGET: '0',
    MOL_PERC_CHY_ONDATE: '0',
    MOL_PERC_CHY_TODATE: '0',
    MOL_PERC_BCHY_TARGET: '0',
    MOL_PERC_BCHY_ONDATE: '0',
    MOL_PERC_BCHY_TODATE: '0',
    STCANE_PERC_TARGET: '0',
    STCANE_PERC_ONDATE: '0',
    STCANE_PERC_TODATE: '0',
    BAGASE_PERC_TARGET: '0',
    BAGASE_PERC_ONDATE: '0',
    BAGASE_PERC_TODATE: '0',
    BAGASE_QTY_ONDATE: '0',
    BAGASE_QTY_TODATE: '0',
    ALHL_TOTAL_TARGET: '0',
    ALHL_TOTAL_ONDATE: '0',
    ALHL_TOTAL_TODATE: '0',
    POWER_PRODUCED_TARGET: '0',
    POWER_PRODUCED_ONDATE: '0',
    POWER_PRODUCED_TODATE: '0',
    POWER_EXPORT_TARGET: '0',
    POWER_EXPORT_ONDATE: '0',
    POWER_EXPORT_TODATE: '0'
  };
}

function num(value) {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
}

function posOrZero(value) {
  const n = num(value);
  return n > 0 ? String(n) : '0';
}

function nonZeroOrZero(value) {
  const n = num(value);
  return n > 0 || n < 0 ? String(n) : '0';
}

function initSummary() {
  return {
    sums: {
      CPSYRUP: 0,
      CPBHY: 0,
      CPFM: 0,
      CPTOTAL: 0,
      ACH_SYRUP: 0,
      ACH_BHY: 0,
      ACH_FM: 0,
      ACHTOTAL: 0,
      BL_ACH_SYRUP: 0,
      BL_ACH_BHY: 0,
      BL_ACH_FM: 0,
      BLTOTAL: 0,
      SG_PROD_ONDATE: 0,
      SG_PROD_TODATE: 0,
      BH_QTY_ONDATE: 0,
      BH_QTY_TODATE: 0,
      CH_QTY_ONDATE: 0,
      CH_QTY_TODATE: 0,
      BAGASE_QTY_ONDATE: 0,
      BAGASE_QTY_TODATE: 0,
      ALHL_TOTAL_TARGET: 0,
      ALHL_TOTAL_ONDATE: 0,
      ALHL_TOTAL_TODATE: 0,
      POWER_PRODUCED_TARGET: 0,
      POWER_PRODUCED_ONDATE: 0,
      POWER_PRODUCED_TODATE: 0,
      POWER_EXPORT_TARGET: 0,
      POWER_EXPORT_ONDATE: 0,
      POWER_EXPORT_TODATE: 0
    },
    weights: {
      polOnDateTotal: 0,
      polOnDateCrush: 0,
      polToDateTotal: 0,
      polToDateCrush: 0,
      recOnDateTotal: 0,
      recOnDateCrush: 0,
      recToDateTotal: 0,
      recToDateCrush: 0,
      stOnDateTotal: 0,
      stOnDateCrush: 0,
      stToDateTotal: 0,
      stToDateCrush: 0,
      bagOnDateTotal: 0,
      bagOnDateCrush: 0,
      bagToDateTotal: 0,
      bagToDateCrush: 0,
      bhOnDateTotal: 0,
      bhOnDateCrush: 0,
      bhToDateTotal: 0,
      bhToDateCrush: 0,
      chOnDateTotal: 0,
      chOnDateCrush: 0,
      chToDateTotal: 0,
      chToDateCrush: 0,
      lmbhOnDateTotal: 0,
      lmbhOnDateCrush: 0,
      lmbhToDateTotal: 0,
      lmbhToDateCrush: 0,
      lmchOnDateTotal: 0,
      lmchOnDateCrush: 0,
      lmchToDateTotal: 0,
      lmchToDateCrush: 0,
      lmbchOnDateTotal: 0,
      lmbchOnDateCrush: 0,
      lmbchToDateTotal: 0,
      lmbchToDateCrush: 0
    }
  };
}

function addSummary(summary, row) {
  summary.sums.CPSYRUP += num(row.CPSYRUP);
  summary.sums.CPBHY += num(row.CPBHY);
  summary.sums.CPFM += num(row.CPFM);
  summary.sums.CPTOTAL += num(row.CPTOTAL);
  summary.sums.ACH_SYRUP += num(row.ACH_SYRUP);
  summary.sums.ACH_BHY += num(row.ACH_BHY);
  summary.sums.ACH_FM += num(row.ACH_FM);
  summary.sums.ACHTOTAL += num(row.ACHTOTAL);
  summary.sums.BL_ACH_SYRUP += num(row.BL_ACH_SYRUP);
  summary.sums.BL_ACH_BHY += num(row.BL_ACH_BHY);
  summary.sums.BL_ACH_FM += num(row.BL_ACH_FM);
  summary.sums.BLTOTAL += num(row.BLTOTAL);
  summary.sums.SG_PROD_ONDATE += num(row.SG_PROD_ONDATE);
  summary.sums.SG_PROD_TODATE += num(row.SG_PROD_TODATE);
  summary.sums.BH_QTY_ONDATE += num(row.BH_QTY_ONDATE);
  summary.sums.BH_QTY_TODATE += num(row.BH_QTY_TODATE);
  summary.sums.CH_QTY_ONDATE += num(row.CH_QTY_ONDATE);
  summary.sums.CH_QTY_TODATE += num(row.CH_QTY_TODATE);
  summary.sums.BAGASE_QTY_ONDATE += num(row.BAGASE_QTY_ONDATE);
  summary.sums.BAGASE_QTY_TODATE += num(row.BAGASE_QTY_TODATE);
  summary.sums.ALHL_TOTAL_TARGET += num(row.ALHL_TOTAL_TARGET);
  summary.sums.ALHL_TOTAL_ONDATE += num(row.ALHL_TOTAL_ONDATE);
  summary.sums.ALHL_TOTAL_TODATE += num(row.ALHL_TOTAL_TODATE);
  summary.sums.POWER_PRODUCED_TARGET += num(row.POWER_PRODUCED_TARGET);
  summary.sums.POWER_PRODUCED_ONDATE += num(row.POWER_PRODUCED_ONDATE);
  summary.sums.POWER_PRODUCED_TODATE += num(row.POWER_PRODUCED_TODATE);
  summary.sums.POWER_EXPORT_TARGET += num(row.POWER_EXPORT_TARGET);
  summary.sums.POWER_EXPORT_ONDATE += num(row.POWER_EXPORT_ONDATE);
  summary.sums.POWER_EXPORT_TODATE += num(row.POWER_EXPORT_TODATE);
}

function addCaneCrushWeights(summary, row, onDateCrush, toDateCrush) {
  const w = summary.weights;
  w.polOnDateTotal += onDateCrush * num(row.POL_PERC_ONDATE);
  w.polOnDateCrush += onDateCrush;
  w.polToDateTotal += toDateCrush * num(row.POL_PERC_TODATE);
  w.polToDateCrush += toDateCrush;

  w.recOnDateTotal += onDateCrush * num(row.REC_PERC_ONDATE);
  w.recOnDateCrush += onDateCrush;
  w.recToDateTotal += toDateCrush * num(row.REC_PERC_TODATE);
  w.recToDateCrush += toDateCrush;

  w.stOnDateTotal += onDateCrush * num(row.STCANE_PERC_ONDATE);
  w.stOnDateCrush += onDateCrush;
  w.stToDateTotal += toDateCrush * num(row.STCANE_PERC_TODATE);
  w.stToDateCrush += toDateCrush;

  w.bagOnDateTotal += onDateCrush * num(row.BAGASE_PERC_ONDATE);
  w.bagOnDateCrush += onDateCrush;
  w.bagToDateTotal += toDateCrush * num(row.BAGASE_PERC_TODATE);
  w.bagToDateCrush += toDateCrush;

  w.lmbchOnDateTotal += onDateCrush * num(row.MOL_PERC_BCHY_ONDATE);
  w.lmbchOnDateCrush += onDateCrush;
  w.lmbchToDateTotal += toDateCrush * num(row.MOL_PERC_BCHY_TODATE);
  w.lmbchToDateCrush += toDateCrush;
}

function addBhChWeights(summary, row, bhOnDateCrush, bhToDateCrush, chOnDateCrush, chToDateCrush) {
  const w = summary.weights;
  w.bhOnDateTotal += bhOnDateCrush * num(row.BH_PERC_ONDATE);
  w.bhOnDateCrush += bhOnDateCrush;
  w.bhToDateTotal += bhToDateCrush * num(row.BH_PERC_TODATE);
  w.bhToDateCrush += bhToDateCrush;

  w.chOnDateTotal += chOnDateCrush * num(row.CH_PERC_ONDATE);
  w.chOnDateCrush += chOnDateCrush;
  w.chToDateTotal += chToDateCrush * num(row.CH_PERC_TODATE);
  w.chToDateCrush += chToDateCrush;

  w.lmbhOnDateTotal += bhOnDateCrush * num(row.MOL_PERC_BHY_ONDATE);
  w.lmbhOnDateCrush += bhOnDateCrush;
  w.lmbhToDateTotal += bhToDateCrush * num(row.MOL_PERC_BHY_TODATE);
  w.lmbhToDateCrush += bhToDateCrush;

  w.lmchOnDateTotal += chOnDateCrush * num(row.MOL_PERC_CHY_ONDATE);
  w.lmchOnDateCrush += chOnDateCrush;
  w.lmchToDateTotal += chToDateCrush * num(row.MOL_PERC_CHY_TODATE);
  w.lmchToDateCrush += chToDateCrush;
}

function weightedAvg(total, crush) {
  if (total > 0 && crush > 0) {
    return String(Math.round((total / crush) * 100) / 100);
  }
  return '0';
}

function buildSummaryRow(label, summary) {
  const row = initRow();
  row.FACTORY = label;
  row.CPSYRUP = String(summary.sums.CPSYRUP || 0);
  row.CPBHY = String(summary.sums.CPBHY || 0);
  row.CPFM = String(summary.sums.CPFM || 0);
  row.CPTOTAL = String(summary.sums.CPTOTAL || 0);
  row.ACH_SYRUP = String(summary.sums.ACH_SYRUP || 0);
  row.ACH_BHY = String(summary.sums.ACH_BHY || 0);
  row.ACH_FM = String(summary.sums.ACH_FM || 0);
  row.ACHTOTAL = String(summary.sums.ACHTOTAL || 0);
  row.BL_ACH_SYRUP = String(summary.sums.BL_ACH_SYRUP || 0);
  row.BL_ACH_BHY = String(summary.sums.BL_ACH_BHY || 0);
  row.BL_ACH_FM = String(summary.sums.BL_ACH_FM || 0);
  row.BLTOTAL = String(summary.sums.BLTOTAL || 0);
  row.SG_PROD_ONDATE = String(summary.sums.SG_PROD_ONDATE || 0);
  row.SG_PROD_TODATE = String(summary.sums.SG_PROD_TODATE || 0);
  row.BH_QTY_ONDATE = String(summary.sums.BH_QTY_ONDATE || 0);
  row.BH_QTY_TODATE = String(summary.sums.BH_QTY_TODATE || 0);
  row.CH_QTY_ONDATE = String(summary.sums.CH_QTY_ONDATE || 0);
  row.CH_QTY_TODATE = String(summary.sums.CH_QTY_TODATE || 0);
  row.BAGASE_QTY_ONDATE = String(summary.sums.BAGASE_QTY_ONDATE || 0);
  row.BAGASE_QTY_TODATE = String(summary.sums.BAGASE_QTY_TODATE || 0);
  row.ALHL_TOTAL_TARGET = String(summary.sums.ALHL_TOTAL_TARGET || 0);
  row.ALHL_TOTAL_ONDATE = String(summary.sums.ALHL_TOTAL_ONDATE || 0);
  row.ALHL_TOTAL_TODATE = String(summary.sums.ALHL_TOTAL_TODATE || 0);
  row.POWER_PRODUCED_TARGET = String(summary.sums.POWER_PRODUCED_TARGET || 0);
  row.POWER_PRODUCED_ONDATE = String(summary.sums.POWER_PRODUCED_ONDATE || 0);
  row.POWER_PRODUCED_TODATE = String(summary.sums.POWER_PRODUCED_TODATE || 0);
  row.POWER_EXPORT_TARGET = String(summary.sums.POWER_EXPORT_TARGET || 0);
  row.POWER_EXPORT_ONDATE = String(summary.sums.POWER_EXPORT_ONDATE || 0);
  row.POWER_EXPORT_TODATE = String(summary.sums.POWER_EXPORT_TODATE || 0);

  row.POL_PERC_TARGET = '0';
  row.REC_PERC_TARGET = '0';
  row.BH_PERC_TARGET = '0';
  row.CH_PERC_TARGET = '0';
  row.MOL_PERC_BHY_TARGET = '0';
  row.MOL_PERC_CHY_TARGET = '0';
  row.MOL_PERC_BCHY_TARGET = '0';
  row.STCANE_PERC_TARGET = '0';
  row.BAGASE_PERC_TARGET = '0';

  row.POL_PERC_ONDATE = weightedAvg(summary.weights.polOnDateTotal, summary.weights.polOnDateCrush);
  row.POL_PERC_TODATE = weightedAvg(summary.weights.polToDateTotal, summary.weights.polToDateCrush);
  row.REC_PERC_ONDATE = weightedAvg(summary.weights.recOnDateTotal, summary.weights.recOnDateCrush);
  row.REC_PERC_TODATE = weightedAvg(summary.weights.recToDateTotal, summary.weights.recToDateCrush);
  row.STCANE_PERC_ONDATE = weightedAvg(summary.weights.stOnDateTotal, summary.weights.stOnDateCrush);
  row.STCANE_PERC_TODATE = weightedAvg(summary.weights.stToDateTotal, summary.weights.stToDateCrush);
  row.BAGASE_PERC_ONDATE = weightedAvg(summary.weights.bagOnDateTotal, summary.weights.bagOnDateCrush);
  row.BAGASE_PERC_TODATE = weightedAvg(summary.weights.bagToDateTotal, summary.weights.bagToDateCrush);
  row.BH_PERC_ONDATE = weightedAvg(summary.weights.bhOnDateTotal, summary.weights.bhOnDateCrush);
  row.BH_PERC_TODATE = weightedAvg(summary.weights.bhToDateTotal, summary.weights.bhToDateCrush);
  row.CH_PERC_ONDATE = weightedAvg(summary.weights.chOnDateTotal, summary.weights.chOnDateCrush);
  row.CH_PERC_TODATE = weightedAvg(summary.weights.chToDateTotal, summary.weights.chToDateCrush);
  row.MOL_PERC_BHY_ONDATE = weightedAvg(summary.weights.lmbhOnDateTotal, summary.weights.lmbhOnDateCrush);
  row.MOL_PERC_BHY_TODATE = weightedAvg(summary.weights.lmbhToDateTotal, summary.weights.lmbhToDateCrush);
  row.MOL_PERC_CHY_ONDATE = weightedAvg(summary.weights.lmchOnDateTotal, summary.weights.lmchOnDateCrush);
  row.MOL_PERC_CHY_TODATE = weightedAvg(summary.weights.lmchToDateTotal, summary.weights.lmchToDateCrush);
  row.MOL_PERC_BCHY_ONDATE = weightedAvg(summary.weights.lmbchOnDateTotal, summary.weights.lmbchOnDateCrush);
  row.MOL_PERC_BCHY_TODATE = weightedAvg(summary.weights.lmbchToDateTotal, summary.weights.lmbchToDateCrush);
  return row;
}

/**
 * GET: Target Actual MIS Data MIS
 */
async function getTargetActualMISDataMis(factoryName, cpDate, season) {
  try {
    const rawDate = String(cpDate || '').trim();
    const m = rawDate.match(/^(\d{2})[\/\-](\d{2})[\/\-](\d{4})$/);
    const dateYmd = m ? `${m[3]}-${m[2]}-${m[1]}` : '';
    const fCode = factoryName && String(factoryName).trim() !== '0' ? String(factoryName).trim() : '';

    const targets = await repository.getTargetDataByFactID(fCode, season);
    if (!targets || targets.length === 0) {
      return [];
    }

    const rows = [];

    const sumsByZone = {
      WZ: initSummary(),
      CZ: initSummary(),
      EZ: initSummary()
    };
    const totals = initSummary();

    for (const t of targets) {
      const row = initRow();
      row.FACTORY = String(t.F_Short || '');
      row.CPSYRUP = String(t.CP_Syrup || 0);
      row.CPBHY = String(t.CP_BHY || 0);
      row.CPFM = String(t.CP_FM || 0);
      row.CPTOTAL = String(t.CP_Total || 0);
      row.POL_PERC_TARGET = String(t.CP_PolPTarget || 0);
      row.REC_PERC_TARGET = String(t.CP_RecPTarget || 0);
      row.BH_PERC_TARGET = String(t.CP_BHPTarget || 0);
      row.CH_PERC_TARGET = String(t.CP_CHPTarget || 0);
      row.MOL_PERC_BHY_TARGET = String(t.CP_LossMolBHYPTarget || 0);
      row.MOL_PERC_CHY_TARGET = String(t.CP_LossMolCHYPTarget || 0);
      row.MOL_PERC_BCHY_TARGET = String(t.CP_LossMolBHYCHYPTarget || 0);
      row.STCANE_PERC_TARGET = String(t.CP_SteamPTarget || 0);
      row.BAGASE_PERC_TARGET = String(t.CCP_BagassPTarget || 0);
      row.ALHL_TOTAL_TARGET = String((Number(t.CP_Alcohol_Syrup || 0) + Number(t.CP_Alcohol_BH || 0) + Number(t.CP_Alcohol_CH || 0)));
      row.POWER_PRODUCED_TARGET = String(t.CP_PPTarget || 0);
      row.POWER_EXPORT_TARGET = String(t.CP_PETarget || 0);

      const actuals = await repository.getActualData(String(t.F_Code || '').trim(), dateYmd, season);
      if (actuals && actuals.length > 0) {
        let achSyrup = 0;
        let achBhy = 0;
        let achFm = 0;
        let blSyrup = 0;
        let blBhy = 0;
        let blFm = 0;
        for (const a of actuals) {
          const prodType = String(a.Cn_Rec_ThisProdtype || '').trim();
          const crush = Number(a.TCrush || 0);
          if (prodType === '3') {
            achSyrup = crush;
            blSyrup = Number(t.CP_Syrup || 0) - crush;
          } else if (prodType === '1') {
            achBhy = crush;
            blBhy = Number(t.CP_BHY || 0) - crush;
          } else if (prodType === '2') {
            achFm = crush;
            blFm = Number(t.CP_FM || 0) - crush;
          }
        }
        row.ACH_SYRUP = String(achSyrup);
        row.ACH_BHY = String(achBhy);
        row.ACH_FM = String(achFm);
        row.ACHTOTAL = String(achSyrup + achBhy + achFm);
        row.BL_ACH_SYRUP = String(blSyrup);
        row.BL_ACH_BHY = String(blBhy);
        row.BL_ACH_FM = String(blFm);
        row.BLTOTAL = String(blSyrup + blBhy + blFm);
      } else {
        row.ACH_SYRUP = '0';
        row.ACH_BHY = '0';
        row.ACH_FM = '0';
        row.ACHTOTAL = '0';
        row.BL_ACH_SYRUP = String(t.CP_Syrup || 0);
        row.BL_ACH_BHY = String(t.CP_BHY || 0);
        row.BL_ACH_FM = String(t.CP_FM || 0);
        row.BLTOTAL = String(Number(t.CP_Syrup || 0) + Number(t.CP_BHY || 0) + Number(t.CP_FM || 0));
      }

      // Execute BajajMic queries for parity (values not used in current view)
      await repository.getSapData(String(t.F_Code || '').trim(), rawDate ? dateYmd : '', season);
      await repository.getPolPercTodate(String(t.F_Code || '').trim(), dateYmd, season);
      await repository.getLossMolPercOndateTodateData(String(t.F_Code || '').trim(), dateYmd, season);
      await repository.getBHCHPercOndateTodate(String(t.F_Code || '').trim(), dateYmd, season);
      await repository.getBHCHQtlsOndateTodate(String(t.F_Code || '').trim(), dateYmd, season);
      await repository.getAlcohoOndateTodateData(String(t.F_Code || '').trim(), dateYmd, season);
      await repository.getOndateTodateCruch(String(t.F_Code || '').trim(), dateYmd, season);
      await repository.getBhChCaneCrush(String(t.F_Code || '').trim(), dateYmd, season);

      rows.push(row);

      const zone = String(t.F_Zone || '').trim();
      if (sumsByZone[zone]) {
        addSummary(sumsByZone[zone], row);
      }
      addSummary(totals, row);
    }

    // Append zone summaries and total summary
    if (rows.length) {
      rows.push(buildSummaryRow('WZ', sumsByZone.WZ));
      rows.push(buildSummaryRow('CZ', sumsByZone.CZ));
      rows.push(buildSummaryRow('EZ', sumsByZone.EZ));
      rows.push(buildSummaryRow('TOTAL', totals));
    }

    return rows;
  } catch (error) {
    throw new Error(`Failed to fetch target/actual MIS data (MIS): ${error.message}`);
  }
}

/**
 * GET: Exception Report Master
 */
async function getExceptionReportMaster(season) {
  try {
    const data = await repository.getExceptionReportMaster(season);
    return data || [];
  } catch (error) {
    throw new Error(`Failed to fetch exception report master: ${error.message}`);
  }
}

/**
 * POST: Exception Report Master (Create/Update)
 */
async function mutateExceptionReportMaster(model, command) {
  try {
    if (!model) {
      return { error: true, status: 400, message: 'Model is required' };
    }
    
    const result = await repository.mutateExceptionReportMaster(model, command);
    return { error: false, status: 201, data: result };
  } catch (error) {
    return { error: true, status: 500, message: error.message };
  }
}

/**
 * GET: Consecutive Gross Weight
 */
async function getConsecutiveGrossWeight(season) {
  try {
    const data = await repository.getConsecutiveGrossWeight(season);
    return data || [];
  } catch (error) {
    throw new Error(`Failed to fetch consecutive gross weight: ${error.message}`);
  }
}

/**
 * POST: Exception Report (with optional export)
 */
async function getExceptionReport(model, selectedIds, userid, downloadToken) {
  try {
    const result = await repository.getExceptionReport(model, selectedIds, userid);
    
    if (downloadToken) {
      return {
        error: false,
        status: 200,
        data: result,
        downloadUrl: `/api/reports/download/${downloadToken}`
      };
    }
    
    return { error: false, status: 200, data: result };
  } catch (error) {
    return { error: true, status: 500, message: error.message };
  }
}

/**
 * GET: Export All Abnormal Weighments
 */
async function exportAllAbnormalWeighments(factoryCode, factoryName, dateFrom, dateTo) {
  try {
    if (!factoryCode || !dateFrom || !dateTo) {
      return { error: true, status: 400, message: 'Factory code, dateFrom, and dateTo are required' };
    }
    
    const data = await repository.getAbnormalWeighments(factoryCode, dateFrom, dateTo);
    
    return {
      error: false,
      status: 200,
      data: data,
      downloadUrl: `/api/reports/download/abnormal-weighments-${factoryCode}-${Date.now()}.xlsx`,
      fileName: `AbnormalWeighments_${factoryName || factoryCode}_${dateFrom}_${dateTo}.xlsx`
    };
  } catch (error) {
    return { error: true, status: 500, message: error.message };
  }
}

/**
 * POST: Export to Excel
 */
async function exportToExcel(selectedIds, factoryCode, factoryName, dateFrom, dateTo, downloadToken) {
  try {
    if (!factoryCode || !dateFrom || !dateTo) {
      return { error: true, status: 400, message: 'Factory code, dateFrom, and dateTo are required' };
    }
    
    const data = await repository.getReportDataForExport(selectedIds, factoryCode, dateFrom, dateTo);
    
    return {
      error: false,
      status: 200,
      data: data,
      downloadUrl: `/api/reports/download/export-${factoryCode}-${Date.now()}.xlsx`,
      fileName: `ExportReport_${factoryName || factoryCode}_${dateFrom}_${dateTo}.xlsx`
    };
  } catch (error) {
    return { error: true, status: 500, message: error.message };
  }
}

/**
 * POST: Get Audit Report (with optional export)
 */
async function getAuditReport(selectedIds, factoryCode, factoryName, dateFrom, dateTo, downloadToken) {
  try {
    if (!factoryCode || !dateFrom || !dateTo) {
      return { error: true, status: 400, message: 'Factory code, dateFrom, and dateTo are required' };
    }
    
    const data = await repository.getAuditReportData(selectedIds, factoryCode, dateFrom, dateTo);
    
    return {
      error: false,
      status: 200,
      data: data,
      downloadUrl: `/api/reports/download/audit-${factoryCode}-${Date.now()}.xlsx`
    };
  } catch (error) {
    return { error: true, status: 500, message: error.message };
  }
}

/**
 * GET: Load Reason Wise Report
 */
async function getReasonWiseReport(factoryCode) {
  try {
    if (!factoryCode) {
      throw new Error('Factory code is required');
    }
    const data = await repository.getReasonWiseReport(factoryCode);
    return data || [];
  } catch (error) {
    throw new Error(`Failed to fetch reason-wise report: ${error.message}`);
  }
}

/**
 * GET: Load Audit Report
 */
async function getLoadAuditReport(factoryCode) {
  try {
    if (!factoryCode) {
      throw new Error('Factory code is required');
    }
    const data = await repository.getLoadAuditReport(factoryCode);
    return data || [];
  } catch (error) {
    throw new Error(`Failed to fetch load audit report: ${error.message}`);
  }
}

/**
 * GET: Audit Report Master
 */
async function getAuditReportMaster(season) {
  try {
    const data = await repository.getAuditReportMaster(season);
    return data || [];
  } catch (error) {
    throw new Error(`Failed to fetch audit report master: ${error.message}`);
  }
}

/**
 * POST: Audit Report Master (Create/Update)
 */
async function mutateAuditReportMaster(model, command) {
  try {
    if (!model) {
      return { error: true, status: 400, message: 'Model is required' };
    }
    
    const result = await repository.mutateAuditReportMaster(model, command);
    return { error: false, status: 201, data: result };
  } catch (error) {
    return { error: true, status: 500, message: error.message };
  }
}

module.exports = {
  getTargetVsActualMisPeriodically,
  getTargetActualMISData,
  getTargetActualMisSapNew,
  getTargetActualMISDataMis,
  getExceptionReportMaster,
  mutateExceptionReportMaster,
  getConsecutiveGrossWeight,
  getExceptionReport,
  exportAllAbnormalWeighments,
  exportToExcel,
  getAuditReport,
  getReasonWiseReport,
  getLoadAuditReport,
  getAuditReportMaster,
  mutateAuditReportMaster
};
