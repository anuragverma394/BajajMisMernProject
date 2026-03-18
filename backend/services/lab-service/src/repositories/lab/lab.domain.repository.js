const { executeQuery, executeProcedure } = require('../../core/db/query-executor');

const CONTROLLER = 'Lab';

function createProcedureHandler(controller, action, signature) {
  return async (req, res, next) => {
    try {
      const season = req.user?.season || req.query?.season || req.body?.season || process.env.DEFAULT_SEASON || '2526';
      const params = { ...(req.query || {}), ...(req.body || {}) };
      const result = await executeProcedure(action, params, season);
      return res.status(200).json({
        success: true,
        message: `${controller}.${action} executed`,
        data: result?.rows || [],
        recordsets: result?.recordsets || []
      });
    } catch (error) {
      if (typeof next === 'function') return next(error);
      throw error;
    }
  };
}

function parseFlexibleDateToIso(value) {
  const raw = String(value || '').trim();
  if (!raw) return null;

  const iso = raw.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (iso) return `${iso[1]}-${iso[2]}-${iso[3]}`;

  const ddmmyyyy = raw.match(/^(\d{2})[-\/](\d{2})[-\/](\d{4})$/);
  if (ddmmyyyy) return `${ddmmyyyy[3]}-${ddmmyyyy[2]}-${ddmmyyyy[1]}`;

  return null;
}

async function resolveLabTable(season, baseName) {
  const candidates = [
    baseName,
    `MI_${baseName}`,
    `MI${baseName}`,
    baseName.replace(/^LAB_/, 'MI_LAB_')
  ].filter(Boolean);

  for (const tableName of candidates) {
    try {
      const rows = await executeQuery('SELECT OBJECT_ID(@tableName) AS objectId', { tableName }, season);
      if (rows[0]?.objectId) return tableName;
    } catch (error) {
      // try next
    }
  }
  return baseName;
}

async function resolveCanePlanTable(season) {
  const candidates = ['MI_CanePlan', 'CanePlan'];
  for (const tableName of candidates) {
    const rows = await executeQuery('SELECT OBJECT_ID(@tableName) AS objectId', { tableName }, season);
    if (rows[0]?.objectId) return tableName;
  }
  return 'MI_CanePlan';
}

function createMassecuiteViewHandler({ tableName, includeLocationCode = false }) {
  return async (req, res, next) => {
    try {
      const season = req.user?.season;
      const resolvedTable = await resolveLabTable(season, tableName);
      const factoryRaw = String(
        req.query.FACTORY || req.query.factory || req.body?.FACTORY || req.body?.factory || ''
      ).trim();
      const dateRaw = req.query.DDATE || req.query.date || req.body?.DDATE || req.body?.date || '';
      const dateIso = parseFlexibleDateToIso(dateRaw);

      const hasFactoryInput = factoryRaw !== '';
      const factoryCode = Number(factoryRaw || 0);
      if (hasFactoryInput && factoryRaw !== '0' && !Number.isFinite(factoryCode)) {
        return res.status(400).json({ success: false, message: 'FACTORY/factory must be a number' });
      }

      if (!factoryCode) {
        return res.status(200).json({ success: true, data: [] });
      }

      const dateExpr = `COALESCE(
            TRY_CONVERT(date, m.DDATE),
            TRY_CONVERT(date, m.DDATE, 112),
            TRY_CONVERT(date, m.DDATE, 103),
            TRY_CONVERT(date, m.DDATE, 105)
         )`;

      const rows = await executeQuery(
        `SELECT
            m.FACTORY,
            COALESCE(NULLIF(RTRIM(mf.F_Name), ''), NULLIF(RTRIM(ff.F_Name), ''), CAST(m.FACTORY AS varchar(20))) AS F_NAME,
            COALESCE(NULLIF(RTRIM(mf.F_Name), ''), NULLIF(RTRIM(ff.F_Name), ''), CAST(m.FACTORY AS varchar(20))) AS FACT_NAME,
            CONVERT(varchar(10), m.DDATE, 103) AS DDATE,
            ISNULL(m.SLNO, 0) AS SLNO,
            ISNULL(m.HOUR, 0) AS HOUR,
            ISNULL(h.DIS_HOU, '') AS DIS_HOU,
            ISNULL(m.STRIKE_NO, 0) AS STRIKE_NO,
            ISNULL(m.PAN_NO, 0) AS PAN_NO,
            ISNULL(m.START_AT, 0) AS START_AT,
            ISNULL(m.DROP_AT, 0) AS DROP_AT,
            ISNULL(m.DROP_BY, 0) AS DROP_BY,
            ISNULL(m.CRYST_NO, 0) AS CRYST_NO,
            ISNULL(m.ANAL_BX, 0) AS ANAL_BX,
            ISNULL(m.ANAL_POL, 0) AS ANAL_POL,
            ISNULL(m.ANAL_PY, 0) AS ANAL_PY,
            ISNULL(m.QTY, 0) AS QTY
            ${includeLocationCode ? ", ISNULL(m.LOCATION_CODE, '') AS LOCATION_CODE" : ''}
         FROM ${resolvedTable} m
         LEFT JOIN MI_Hours h ON h.LABSN = m.HOUR
         LEFT JOIN MI_Factory mf ON mf.F_Code = m.FACTORY
         LEFT JOIN Factory ff ON ff.F_Code = m.FACTORY
         WHERE m.FACTORY = @factoryCode
           AND (@dateIso IS NULL OR ${dateExpr} = @dateIso)
         ORDER BY m.DDATE DESC, m.HOUR DESC`,
        { factoryCode, dateIso: dateIso || null },
        season
      );

      return res.status(200).json({ success: true, data: rows });
    } catch (error) {
      return next(error);
    }
  };
}

function createMassecuiteByIdHandler({ tableName, includeLocationCode = false }) {
  return async (req, res, next) => {
    try {
      const season = req.user?.season;
      const resolvedTable = await resolveLabTable(season, tableName);
      const slnoRaw = String(req.query.SLNO || req.query.Rid || req.query.id || req.body?.SLNO || req.body?.Rid || req.body?.id || '').trim();
      const factoryRaw = String(req.query.FACTORY || req.query.factory || req.query.FACT || req.body?.FACTORY || req.body?.factory || req.body?.FACT || '').trim();
      const dateRaw = req.query.DDATE || req.query.DATE || req.query.date || req.body?.DDATE || req.body?.DATE || req.body?.date || '';
      const locationRaw = String(
        req.query.LOCATION_CODE || req.query.locationCode || req.query.DIVN || req.query.LOCATION
        || req.body?.LOCATION_CODE || req.body?.locationCode || req.body?.DIVN || req.body?.LOCATION || ''
      ).trim();

      const slno = Number(slnoRaw || 0);
      if (!slno) {
        return res.status(200).json({ success: true, data: [] });
      }
      if (!Number.isFinite(slno) || slno <= 0) {
        return res.status(400).json({ success: false, message: 'SLNO must be a positive number' });
      }

      const hasFactoryInput = factoryRaw !== '';
      const factoryCode = Number(factoryRaw || 0);
      if (hasFactoryInput && factoryRaw !== '0' && !Number.isFinite(factoryCode)) {
        return res.status(400).json({ success: false, message: 'FACTORY/FACT/factory must be a number' });
      }

      const dateIso = parseFlexibleDateToIso(dateRaw);
      const dateExpr = `COALESCE(
            TRY_CONVERT(date, m.DDATE),
            TRY_CONVERT(date, m.DDATE, 112),
            TRY_CONVERT(date, m.DDATE, 103),
            TRY_CONVERT(date, m.DDATE, 105)
         )`;

      const rows = await executeQuery(
        `SELECT
            m.FACTORY,
            CONVERT(varchar(10), m.DDATE, 23) AS DDATE,
            ISNULL(m.SLNO, 0) AS SLNO,
            ISNULL(m.HOUR, 0) AS HOUR,
            ISNULL(m.STRIKE_NO, 0) AS STRIKE_NO,
            ISNULL(m.PAN_NO, 0) AS PAN_NO,
            ISNULL(m.START_AT, 0) AS START_AT,
            ISNULL(m.DROP_AT, 0) AS DROP_AT,
            ISNULL(m.DROP_BY, 0) AS DROP_BY,
            ISNULL(m.CRYST_NO, 0) AS CRYST_NO,
            ISNULL(m.ANAL_BX, 0) AS ANAL_BX,
            ISNULL(m.ANAL_POL, 0) AS ANAL_POL,
            ISNULL(m.ANAL_PY, 0) AS ANAL_PY,
            ISNULL(m.QTY, 0) AS QTY,
            ISNULL(h.DIS_HOU, '') AS DIS_HOU
            ${includeLocationCode ? ", ISNULL(m.LOCATION_CODE, '') AS LOCATION_CODE" : ''}
         FROM ${resolvedTable} m
         LEFT JOIN MI_Hours h ON h.LABSN = m.HOUR
         WHERE m.SLNO = @slno
           AND (@factoryCode IS NULL OR m.FACTORY = @factoryCode)
           AND (@dateIso IS NULL OR ${dateExpr} = @dateIso)
           ${includeLocationCode ? "AND (@locationCode = '' OR ISNULL(m.LOCATION_CODE, '') = @locationCode)" : ''}`,
        {
          slno,
          factoryCode: hasFactoryInput && factoryCode > 0 ? factoryCode : null,
          dateIso: dateIso || null,
          locationCode: includeLocationCode ? locationRaw : ''
        },
        season
      );

      return res.status(200).json({ success: true, data: rows });
    } catch (error) {
      return next(error);
    }
  };
}

async function getMolassesAnalysisRows({ season, factoryCode, dateIso }) {
  return executeQuery(
    `SELECT
        ab.FACTORY,
        COALESCE(NULLIF(RTRIM(mf.F_Name), ''), NULLIF(RTRIM(ff.F_Name), ''), CAST(ab.FACTORY AS varchar(20))) AS F_NAME,
        CONVERT(varchar(10), ab.DDATE, 103) AS DDATE,
        ISNULL(ab.TIME, 0) AS TIME,
        ISNULL(h.DIS_HOU, '') AS DIS_HOU,
        ISNULL(ab.LOCATION_CODE, '') AS LOCATION_CODE,
        ISNULL(ab.AH_BX, 0) AS AH_BX,
        ISNULL(ab.AH_POL, 0) AS AH_POL,
        ISNULL(ab.AH_PY, 0) AS AH_PY,
        ISNULL(ab.AL_BX, 0) AS AL_BX,
        ISNULL(ab.AL_POL, 0) AS AL_POL,
        ISNULL(ab.AL_PY, 0) AS AL_PY,
        ISNULL(ab.A1_BX, 0) AS A1_BX,
        ISNULL(ab.A1_POL, 0) AS A1_POL,
        ISNULL(ab.A1_PY, 0) AS A1_PY,
        ISNULL(ab.BH_BX, 0) AS BH_BX,
        ISNULL(ab.BH_POL, 0) AS BH_POL,
        ISNULL(ab.BH_PY, 0) AS BH_PY,
        ISNULL(ab.CL_BX, 0) AS CL_BX,
        ISNULL(ab.CL_POL, 0) AS CL_POL,
        ISNULL(ab.CL_PY, 0) AS CL_PY,
        ISNULL(ab.CH_BX, 0) AS CH_BX,
        ISNULL(ab.CH_POL, 0) AS CH_POL,
        ISNULL(ab.CH_PY, 0) AS CH_PY,
        ISNULL(ab.MELT_BX, 0) AS MELT_BX,
        ISNULL(ab.MELT_POL, 0) AS MELT_POL,
        ISNULL(ab.MELT_PY, 0) AS MELT_PY,
        ISNULL(ab.FM_BX, 0) AS FM_BX,
        ISNULL(ab.FM_POL, 0) AS FM_POL,
        ISNULL(ab.FM_PY, 0) AS FM_PY
     FROM LAB_ABC_HEAVY ab
     LEFT JOIN MI_Hours h ON h.LABSN = ab.TIME
     LEFT JOIN MI_Factory mf ON mf.F_Code = ab.FACTORY
     LEFT JOIN Factory ff ON ff.F_Code = ab.FACTORY
     WHERE ab.FACTORY = @factoryCode
       AND (@dateIso IS NULL OR CAST(ab.DDATE AS date) = @dateIso)
     ORDER BY ab.DDATE DESC, ab.TIME DESC`,
    { factoryCode, dateIso: dateIso || null },
    season
  );
}

function normalizeDecimal(value) {
  const num = Number(value);
  if (!Number.isFinite(num) || num < 0) return 0;
  return num;
}

exports.SugarBagProducedView = async (req, res, next) => {
  try {
    const season = req.user?.season;
    const factoryRaw = String(req.query.factory || req.query.FACTORY || req.body?.factory || req.body?.FACTORY || '').trim();
    const dateRaw = req.query.date || req.query.H_DATE || req.query.DDATE || req.body?.date || req.body?.H_DATE || req.body?.DDATE || '';
    const dateIso = parseFlexibleDateToIso(dateRaw);

    if (!dateIso) {
      return res.status(400).json({ success: false, message: 'Valid date is required (DD/MM/YYYY or YYYY-MM-DD)' });
    }

    if (!factoryRaw || factoryRaw === '0' || String(factoryRaw).toLowerCase() === 'all') {
      return res.status(200).json({ success: true, data: [] });
    }

    const factoryCode = Number(factoryRaw);
    if (!Number.isFinite(factoryCode) || factoryCode <= 0) {
      return res.status(400).json({ success: false, message: 'factory/FACTORY must be a positive number' });
    }

    const rows = await executeQuery(
      `SELECT
          ISNULL(lh.TIME, '') AS TIME,
          ISNULL(h.DIS_HOU, '') AS TIME_IN_HOURS,
          ISNULL(lh.SHIFT, '') AS SHIFT,
          CONVERT(varchar(10), lh.H_DATE, 103) AS [DATE],
          CONVERT(varchar(10), lh.H_DATE, 103) AS H_DATE,
          ISNULL(lh.MILL_NO, 0) AS MILLNO,
          ISNULL(lh.MILL_NO, 0) AS MILL_NO,
          lh.FACTORY,
          ISNULL(lh.COL2, 0) AS COL2,
          ISNULL(lh.ADD_WATER, 0) AS ADD_WATER,
          ISNULL(lh.DRAIN_POL1, 0) AS DRAIN_POL1,
          ISNULL(lh.DRAIN_POL2, 0) AS DRAIN_POL2,
          ISNULL(lh.DRAIN_POL3, 0) AS DRAIN_POL3,
          ISNULL(lh.DRAIN_POL4, 0) AS DRAIN_POL4,
          ISNULL(lh.SPRAY_WATER_POL, 0) AS SPRAY_WATER_POL,
          ISNULL(lh.SPRAY_WATER_POL2, 0) AS SPRAY_WATER_POL2,
          ISNULL(lh.EXHST_PRS_DEVCI, 0) AS EXHST_PRS_DEVCI,
          ISNULL(lh.LIVE_ST_PRS, 0) AS LIVE_ST_PRS,
          ISNULL(lh.BACK_PRS_DEVCI, 0) AS BACK_PRS_DEVCI,
          ISNULL(lh.BACK_PRS_DEVCII, 0) AS BACK_PRS_DEVCII,
          ISNULL(lh.L_31, 0) AS L_31,
          ISNULL(lh.L_31CLR, 0) AS L_31CLR,
          ISNULL(lh.L_31RET, 0) AS L_31RET,
          ISNULL(lh.L_30, 0) AS L_30,
          ISNULL(lh.L_30CLR, 0) AS L_30CLR,
          ISNULL(lh.L_30RET, 0) AS L_30RET,
          ISNULL(lh.L_29, 0) AS L_29,
          ISNULL(lh.L_29CLR, 0) AS L_29CLR,
          ISNULL(lh.L_29RET, 0) AS L_29RET,
          ISNULL(lh.LBAG_TEMP, 0) AS LBAG_TEMP,
          ISNULL(lh.M_31, 0) AS M_31,
          ISNULL(lh.M_31CLR, 0) AS M_31CLR,
          ISNULL(lh.M_31RET, 0) AS M_31RET,
          ISNULL(lh.M31BAG_TEMP, 0) AS M31BAG_TEMP,
          ISNULL(lh.M_30, 0) AS M_30,
          ISNULL(lh.M_30CLR, 0) AS M_30CLR,
          ISNULL(lh.M_30RET, 0) AS M_30RET,
          ISNULL(lh.M30BAG_TEMP, 0) AS M30BAG_TEMP,
          ISNULL(lh.M_29, 0) AS M_29,
          ISNULL(lh.M_29CLR, 0) AS M_29CLR,
          ISNULL(lh.M_29RET, 0) AS M_29RET,
          ISNULL(lh.M29BAG_TEMP, 0) AS M29BAG_TEMP,
          ISNULL(lh.S_31, 0) AS S_31,
          ISNULL(lh.S_31CLR, 0) AS S_31CLR,
          ISNULL(lh.S_31RET, 0) AS S_31RET,
          ISNULL(lh.S_30, 0) AS S_30,
          ISNULL(lh.S_30CLR, 0) AS S_30CLR,
          ISNULL(lh.S_30RET, 0) AS S_30RET,
          ISNULL(lh.S_29, 0) AS S_29,
          ISNULL(lh.S_29CLR, 0) AS S_29CLR,
          ISNULL(lh.S_29RET, 0) AS S_29RET,
          ISNULL(lh.SS_31, 0) AS SS_31,
          ISNULL(lh.SS_31CLR, 0) AS SS_31CLR,
          ISNULL(lh.SS_31RET, 0) AS SS_31RET,
          ISNULL(lh.SBAG_TEMP, 0) AS SBAG_TEMP,
          ISNULL(lh.BISS, 0) AS BISS,
          ISNULL(lh.BISSCLR, 0) AS BISSCLR,
          ISNULL(lh.BISSRET, 0) AS BISSRET
       FROM LAB_HOUR lh
       LEFT JOIN MI_Hours h ON h.Labsn = lh.TIME
       WHERE CAST(lh.H_DATE AS date) = @dateIso
         AND lh.FACTORY = @factoryCode
       ORDER BY lh.H_DATE DESC, lh.TIME DESC`,
      { dateIso, factoryCode },
      season
    );

    const data = rows.map((r) => {
      const total = Number(r.L_31 || 0)
        + Number(r.L_30 || 0)
        + Number(r.L_29 || 0)
        + Number(r.M_31 || 0)
        + Number(r.M_30 || 0)
        + Number(r.M_29 || 0)
        + Number(r.S_31 || 0)
        + Number(r.S_30 || 0)
        + Number(r.S_29 || 0)
        + Number(r.SS_31 || 0);

      return {
        ...r,
        GTotal: Number(total.toFixed(2))
      };
    });

    return res.status(200).json({ success: true, data });
  } catch (error) {
    return next(error);
  }
};
exports.SugarBagProducedAdd = createProcedureHandler(CONTROLLER, 'SugarBagProducedAdd', '');
exports.SugarBagProducedAdd_2 = createProcedureHandler(CONTROLLER, 'SugarBagProducedAdd', 'SugarBagProducedView Model,string command');
exports.ShiftSet = createProcedureHandler(CONTROLLER, 'ShiftSet', 'string TIME');
exports.TestAnurag1 = createProcedureHandler(CONTROLLER, 'TestAnurag1', 'string pol,string brix');
exports.TestRohit1 = exports.TestAnurag1;
exports.DailyLabAnalysisAddDelete = createProcedureHandler(CONTROLLER, 'DailyLabAnalysisAddDelete', 'string TIME, string DDATE, string FACTORY, string MILL_NO');
exports.SugarBagProducedDelete = createProcedureHandler(CONTROLLER, 'SugarBagProducedDelete', 'string TIME, string H_DATE_PRIMARY, string FACTORY, string MILL_NO');
exports.SugarBagProducedAddID = createProcedureHandler(CONTROLLER, 'SugarBagProducedAddID', 'string TIME,string H_DATE ,string FACTORY,string MILL_NO');
exports.DailyLabAnalysisEntry = async (req, res, next) => {
  try {
    const season = req.user?.season;
    const factoryRaw = String(req.query.FACTORY || req.query.factory || req.body?.FACTORY || req.body?.factory || '').trim();
    const timeRaw = String(req.query.TIME1 || req.query.time1 || req.body?.TIME1 || req.body?.time1 || '').trim();
    const millRaw = String(req.query.MILL_NO || req.query.mill_no || req.body?.MILL_NO || req.body?.mill_no || '').trim();
    const dateRaw = req.query.DDATE || req.query.date || req.body?.DDATE || req.body?.date || '';
    const dateIso = parseFlexibleDateToIso(dateRaw);

    if (!factoryRaw || !timeRaw || !millRaw || !dateIso) {
      return res.status(200).json({ success: true, data: [] });
    }

    const factoryCode = Number(factoryRaw);
    const millNo = Number(millRaw);
    if (!Number.isFinite(factoryCode) || factoryCode <= 0 || !Number.isFinite(millNo) || millNo <= 0) {
      return res.status(400).json({ success: false, message: 'FACTORY and MILL_NO must be positive numbers' });
    }

    const rows = await executeQuery(
      `SELECT
          ld.factory,
          CONVERT(varchar(10), ld.DDATE, 103) AS DDATE,
          ISNULL(ld.TIME1, '') AS TIME1,
          ISNULL(h.DIS_HOU, '') AS DIS_HOU,
          ISNULL(ld.Shift1, '') AS Shift1,
          ISNULL(ld.MILL_NO, 0) AS MILL_NO,
          ISNULL(ld.PJ_BX, 0) AS PJ_BX,
          ISNULL(ld.PJ_POL, 0) AS PJ_POL,
          ISNULL(ld.PJ_PY, 0) AS PJ_PY,
          ISNULL(ld.MJ_BX, 0) AS MJ_BX,
          ISNULL(ld.MJ_POL, 0) AS MJ_POL,
          ISNULL(ld.MJ_PY, 0) AS MJ_PY,
          ISNULL(ld.LMJ_BX, 0) AS LMJ_BX,
          ISNULL(ld.LMJ_POL, 0) AS LMJ_POL,
          ISNULL(ld.LMJ_PY, 0) AS LMJ_PY,
          ISNULL(ld.FPJU_BX, 0) AS FPJU_BX,
          ISNULL(ld.FPJU_POL, 0) AS FPJU_POL,
          ISNULL(ld.FPJU_PY, 0) AS FPJU_PY,
          ISNULL(ld.FPJT_BX, 0) AS FPJT_BX,
          ISNULL(ld.FPJT_POL, 0) AS FPJT_POL,
          ISNULL(ld.FPJT_PY, 0) AS FPJT_PY,
          ISNULL(ld.CJ_BX, 0) AS CJ_BX,
          ISNULL(ld.CJ_POL, 0) AS CJ_POL,
          ISNULL(ld.CJ_PY, 0) AS CJ_PY,
          ISNULL(ld.DEVC_I_BX, 0) AS DEVC_I_BX,
          ISNULL(ld.DEVC_II_BX, 0) AS DEVC_II_BX,
          ISNULL(ld.US_BX, 0) AS US_BX,
          ISNULL(ld.US_POL, 0) AS US_POL,
          ISNULL(ld.US_PY, 0) AS US_PY,
          ISNULL(ld.UST_BX, 0) AS UST_BX,
          ISNULL(ld.UST_POL, 0) AS UST_POL,
          ISNULL(ld.UST_PY, 0) AS UST_PY,
          ISNULL(ld.SS_BX, 0) AS SS_BX,
          ISNULL(ld.SS_POL, 0) AS SS_POL,
          ISNULL(ld.SS_PY, 0) AS SS_PY,
          ISNULL(ld.B_POL, 0) AS B_POL,
          ISNULL(ld.B_MOIS, 0) AS B_MOIS,
          ISNULL(ld.PC, 0) AS PC,
          ISNULL(ld.PC1, 0) AS PC1,
          ISNULL(ld.PC2, 0) AS PC2,
          ISNULL(ld.PC3, 0) AS PC3,
          ISNULL(ld.PC4, 0) AS PC4,
          ISNULL(ld.PC5, 0) AS PC5,
          ISNULL(ld.PC6, 0) AS PC6,
          ISNULL(ld.ADD_WATER, 0) AS ADD_WATER,
          ISNULL(ld.MAC_FIBRE, 0) AS MAC_FIBRE,
          ISNULL(ld.USER_CODE, '') AS USER_CODE
       FROM Lab_Daily ld
       LEFT JOIN MI_Hours h ON h.Labsn = ld.TIME1
       WHERE ld.factory = @factoryCode
         AND CAST(ld.DDATE AS date) = @dateIso
         AND ld.TIME1 = @timeRaw
         AND ld.MILL_NO = @millNo`,
      { factoryCode, dateIso, timeRaw, millNo },
      season
    );

    return res.status(200).json({ success: true, data: rows });
  } catch (error) {
    return next(error);
  }
};

exports.DailyLabAnalysisView = async (req, res, next) => {
  try {
    const season = req.user?.season;
    const factoryRaw = String(req.query.FACTORY || req.query.factory || req.body?.FACTORY || req.body?.factory || '').trim();
    const dateRaw = req.query.DDATE || req.query.date || req.body?.DDATE || req.body?.date || '';
    const dateIso = parseFlexibleDateToIso(dateRaw);

    const factoryCode = Number(factoryRaw || 0);
    if (factoryRaw && factoryRaw !== '0' && !Number.isFinite(factoryCode)) {
      return res.status(400).json({ success: false, message: 'FACTORY/factory must be a number' });
    }

    if (!factoryCode) {
      return res.status(200).json({ success: true, data: [] });
    }

    const rows = await executeQuery(
      `SELECT
          ISNULL(ld.TIME1, '') AS TIME,
          ISNULL(h.DIS_HOU, '') AS TIME_IN_HOURS,
          ISNULL(ld.Shift1, '') AS SHIFT,
          CONVERT(varchar(10), ld.DDATE, 103) AS DDATE,
          ISNULL(ld.MILL_NO, 0) AS [MILL NO],
          ISNULL(ld.MILL_NO, 0) AS MILL_NO,
          ISNULL(ld.PJ_BX, 0) AS PJ_Brix,
          ISNULL(ld.PJ_BX, 0) AS PJ_BX,
          ISNULL(ld.PJ_POL, 0) AS PJ_POL,
          ISNULL(ld.PJ_PY, 0) AS PJ_PY,
          ISNULL(ld.MJ_BX, 0) AS MJ_BX,
          ISNULL(ld.MJ_POL, 0) AS MJ_POL,
          ISNULL(ld.MJ_PY, 0) AS MJ_PY,
          ISNULL(ld.LMJ_BX, 0) AS LMJ_BX,
          ISNULL(ld.LMJ_POL, 0) AS LMJ_POL,
          ISNULL(ld.LMJ_PY, 0) AS LMJ_PY,
          ISNULL(ld.FPJU_BX, 0) AS FPJU_BX,
          ISNULL(ld.FPJU_POL, 0) AS FPJU_POL,
          ISNULL(ld.FPJU_PY, 0) AS FPJU_PY,
          ISNULL(ld.FPJT_BX, 0) AS FPJT_BX,
          ISNULL(ld.FPJT_POL, 0) AS FPJT_POL,
          ISNULL(ld.FPJT_PY, 0) AS FPJT_PY,
          ISNULL(ld.CJ_BX, 0) AS CJ_BX,
          ISNULL(ld.CJ_POL, 0) AS CJ_POL,
          ISNULL(ld.CJ_PY, 0) AS CJ_PY,
          ISNULL(ld.DEVC_I_BX, 0) AS DEVC_I_BX,
          ISNULL(ld.DEVC_II_BX, 0) AS DEVC_II_BX,
          ISNULL(ld.US_BX, 0) AS US_BX,
          ISNULL(ld.US_POL, 0) AS US_POL,
          ISNULL(ld.US_PY, 0) AS US_PY,
          ISNULL(ld.UST_BX, 0) AS UST_BX,
          ISNULL(ld.UST_POL, 0) AS UST_POL,
          ISNULL(ld.UST_PY, 0) AS UST_PY,
          ISNULL(ld.SS_BX, 0) AS SS_BX,
          ISNULL(ld.SS_POL, 0) AS SS_POL,
          ISNULL(ld.SS_PY, 0) AS SS_PY,
          ISNULL(ld.B_POL, 0) AS B_POL,
          ISNULL(ld.B_MOIS, 0) AS B_MOIS,
          ISNULL(ld.PC, 0) AS PC,
          ISNULL(ld.PC1, 0) AS PC1,
          ISNULL(ld.PC2, 0) AS PC2,
          ISNULL(ld.PC3, 0) AS PC3,
          ISNULL(ld.PC4, 0) AS PC4,
          ISNULL(ld.PC5, 0) AS PC5,
          ISNULL(ld.PC6, 0) AS PC6,
          ISNULL(ld.ADD_WATER, 0) AS ADD_WATER,
          ISNULL(ld.MAC_FIBRE, 0) AS MAC_FIBRE,
          ISNULL(ld.USER_CODE, '') AS USER_CODE,
          ISNULL(ld.factory, 0) AS FACTORY
       FROM Lab_Daily ld
       LEFT JOIN MI_Hours h ON h.Labsn = ld.TIME1
       WHERE ld.factory = @factoryCode
         AND (@dateIso IS NULL OR CAST(ld.DDATE AS date) = @dateIso)
       ORDER BY ld.DDATE DESC, ld.TIME1 DESC`,
      { factoryCode, dateIso: dateIso || null },
      season
    );

    return res.status(200).json({ success: true, data: rows });
  } catch (error) {
    return next(error);
  }
};
exports.DailyLabAnalysisAdd = createProcedureHandler(CONTROLLER, 'DailyLabAnalysisAdd', '');
exports.DailyLabAnalysisAdd_2 = createProcedureHandler(CONTROLLER, 'DailyLabAnalysisAdd', 'DailyLabAnalysisEntry Model,string command');
exports.AMassecuiteView = createMassecuiteViewHandler({ tableName: 'LAB_A_MASS' });
exports.AMassecuite = createProcedureHandler(CONTROLLER, 'AMassecuite', '');
exports.AMassecuite_2 = createProcedureHandler(CONTROLLER, 'AMassecuite', 'AMassecuiteView Model, string Command');
exports.AMassecuiteDelete = createProcedureHandler(CONTROLLER, 'AMassecuiteDelete', 'string FACT, string DATE, string SLNO');
exports.AMassecuiteUPId = createMassecuiteByIdHandler({ tableName: 'LAB_A_MASS' });
exports.A1MassecuiteView = createMassecuiteViewHandler({ tableName: 'LAB_A1_MASS' });
exports.A1Massecuite = createProcedureHandler(CONTROLLER, 'A1Massecuite', '');
exports.A1Massecuite_2 = createProcedureHandler(CONTROLLER, 'A1Massecuite', 'A1MassecuiteView Model, string Command');
exports.A1MassecuiteDelete = createProcedureHandler(CONTROLLER, 'A1MassecuiteDelete', 'string FACTORY, string DDATE, string SLNO');
exports.A1MassecuiteUPId = createMassecuiteByIdHandler({ tableName: 'LAB_A1_MASS' });
exports.BMassecuiteView = createMassecuiteViewHandler({ tableName: 'LAB_B_MASS', includeLocationCode: true });
exports.BMassecuite = createProcedureHandler(CONTROLLER, 'BMassecuite', '');
exports.BMassecuite_2 = createProcedureHandler(CONTROLLER, 'BMassecuite', 'string id, int F_Name, string DDATE, string TIME, string STRIKE_NO, string ANAL_BX, string ANAL_POL, string ANAL_PY, string QTY, string NO, string LOCATION_CODE');
exports.BMassecuiteDelete = createProcedureHandler(CONTROLLER, 'BMassecuiteDelete', 'string FACT, string DATE, string SLNO, string DIVN');
exports.BMassecuiteUPId = createMassecuiteByIdHandler({ tableName: 'LAB_B_MASS', includeLocationCode: true });
exports.CMassecuiteView = createMassecuiteViewHandler({ tableName: 'LAB_C_MASS', includeLocationCode: true });
exports.CMassecuite = createProcedureHandler(CONTROLLER, 'CMassecuite', '');
exports.CMassecuite_2 = createProcedureHandler(CONTROLLER, 'CMassecuite', 'string id, int F_Name, string DDATE, string TIME, string STRIKE_NO, string ANAL_BX, string ANAL_POL, string ANAL_PY, string QTY, string NO, string LOCATION_CODE');
exports.CMassecuiteDelete = createProcedureHandler(CONTROLLER, 'CMassecuiteDelete', 'string FACT, string DATE, string SLNO, string DIVN');
exports.CMassecuiteUPId = createMassecuiteByIdHandler({ tableName: 'LAB_C_MASS', includeLocationCode: true });
exports.C1MassecuiteView = createMassecuiteViewHandler({ tableName: 'LAB_C1_MASS', includeLocationCode: true });
exports.C1Massecuite = createProcedureHandler(CONTROLLER, 'C1Massecuite', '');
exports.C1Massecuite_2 = createProcedureHandler(CONTROLLER, 'C1Massecuite', 'string id, int F_Name, string DDATE, string TIME, string STRIKE_NO, string ANAL_BX, string ANAL_POL, string ANAL_PY, string QTY, string NO, string LOCATION_CODE');
exports.C1MassecuiteDelete = createProcedureHandler(CONTROLLER, 'C1MassecuiteDelete', 'string FACT, string DATE, string SLNO, string DIVN');
exports.C1MassecuiteUPId = createMassecuiteByIdHandler({ tableName: 'LAB_C1_MASS', includeLocationCode: true });
exports.R1View = createMassecuiteViewHandler({ tableName: 'LAB_R1', includeLocationCode: true });
exports.R1 = createProcedureHandler(CONTROLLER, 'R1', '');
exports.R1_2 = createProcedureHandler(CONTROLLER, 'R1', 'string id, int F_Name, string DDATE, string TIME, string STRIKE_NO, string ANAL_BX, string ANAL_POL, string ANAL_PY, string QTY, string No');
exports.R1Delete = createProcedureHandler(CONTROLLER, 'R1Delete', 'string FACT, string DATE, string SLNO');
exports.R1UPId = createMassecuiteByIdHandler({ tableName: 'LAB_R1', includeLocationCode: true });
exports.R2View = createMassecuiteViewHandler({ tableName: 'LAB_R2', includeLocationCode: true });
exports.R2 = createProcedureHandler(CONTROLLER, 'R2', '');
exports.R2_2 = createProcedureHandler(CONTROLLER, 'R2', 'string id, int F_Name, string DDATE, string TIME, string STRIKE_NO, string ANAL_BX, string ANAL_POL, string ANAL_PY, string QTY, string No');
exports.R2Delete = createProcedureHandler(CONTROLLER, 'R2Delete', 'string FACT, string DATE, string SLNO');
exports.R2UPId = createMassecuiteByIdHandler({ tableName: 'LAB_R2', includeLocationCode: true });
exports.MolassesAnalysisView = async (req, res, next) => {
  try {
    const season = req.user?.season;
    const factoryRaw = String(req.query.FACTORY || req.query.factory || req.body?.FACTORY || req.body?.factory || '').trim();
    const dateRaw = req.query.DDATE || req.query.date || req.body?.DDATE || req.body?.date || '';
    const dateIso = parseFlexibleDateToIso(dateRaw);

    const factoryCode = Number(factoryRaw || 0);
    if (factoryRaw && factoryRaw !== '0' && !Number.isFinite(factoryCode)) {
      return res.status(400).json({ success: false, message: 'FACTORY/factory must be a number' });
    }

    if (!factoryCode) {
      return res.status(200).json({ success: true, data: [] });
    }

    const rows = await getMolassesAnalysisRows({ season, factoryCode, dateIso });
    return res.status(200).json({ success: true, data: rows });
  } catch (error) {
    return next(error);
  }
};
exports.MolassesAnalysis = async (req, res, next) => {
  try {
    const season = req.user?.season;
    const factoryRaw = String(req.query.FACTORY || req.query.factory || req.body?.FACTORY || req.body?.factory || '').trim();
    const timeRaw = String(req.query.TIME || req.query.time || req.body?.TIME || req.body?.time || '').trim();
    const dateRaw = req.query.DDATE || req.query.date || req.body?.DDATE || req.body?.date || '';
    const location = String(req.query.LOCATION || req.query.LOCATION_CODE || req.body?.LOCATION || req.body?.LOCATION_CODE || 'P1').trim() || 'P1';
    const dateIso = parseFlexibleDateToIso(dateRaw);

    const factoryCode = Number(factoryRaw || 0);
    const timeCode = Number(timeRaw || 0);
    if (!factoryCode || !timeCode || !dateIso) {
      return res.status(200).json({ success: true, data: [] });
    }

    const rows = await executeQuery(
      `SELECT TOP 1
          ab.FACTORY,
          CONVERT(varchar(10), ab.DDATE, 103) AS DDATE,
          ISNULL(ab.TIME, 0) AS TIME,
          ISNULL(ab.LOCATION_CODE, '') AS LOCATION_CODE,
          ISNULL(ab.AH_BX, 0) AS AH_BX,
          ISNULL(ab.AH_POL, 0) AS AH_POL,
          ISNULL(ab.AH_PY, 0) AS AH_PY,
          ISNULL(ab.AL_BX, 0) AS AL_BX,
          ISNULL(ab.AL_POL, 0) AS AL_POL,
          ISNULL(ab.AL_PY, 0) AS AL_PY,
          ISNULL(ab.A1_BX, 0) AS A1_BX,
          ISNULL(ab.A1_POL, 0) AS A1_POL,
          ISNULL(ab.A1_PY, 0) AS A1_PY,
          ISNULL(ab.BH_BX, 0) AS BH_BX,
          ISNULL(ab.BH_POL, 0) AS BH_POL,
          ISNULL(ab.BH_PY, 0) AS BH_PY,
          ISNULL(ab.CL_BX, 0) AS CL_BX,
          ISNULL(ab.CL_POL, 0) AS CL_POL,
          ISNULL(ab.CL_PY, 0) AS CL_PY,
          ISNULL(ab.CH_BX, 0) AS CH_BX,
          ISNULL(ab.CH_POL, 0) AS CH_POL,
          ISNULL(ab.CH_PY, 0) AS CH_PY,
          ISNULL(ab.MELT_BX, 0) AS MELT_BX,
          ISNULL(ab.MELT_POL, 0) AS MELT_POL,
          ISNULL(ab.MELT_PY, 0) AS MELT_PY,
          ISNULL(ab.FM_BX, 0) AS FM_BX,
          ISNULL(ab.FM_POL, 0) AS FM_POL,
          ISNULL(ab.FM_PY, 0) AS FM_PY
       FROM LAB_ABC_HEAVY ab
       WHERE ab.FACTORY = @factoryCode
         AND CAST(ab.DDATE AS date) = @dateIso
         AND ab.TIME = @timeCode
         AND ISNULL(ab.LOCATION_CODE, '') = @location`,
      { factoryCode, dateIso, timeCode, location },
      season
    );

    return res.status(200).json({ success: true, data: rows });
  } catch (error) {
    return next(error);
  }
};
exports.MolassesAnalysis_2 = async (req, res, next) => {
  try {
    const season = req.user?.season;
    const modeRaw = String(req.body?.id || req.body?.Command || '').toLowerCase();
    const isUpdate = modeRaw === 'btupdate' || modeRaw === 'update';
    const isInsert = modeRaw === 'btninsert' || modeRaw === 'insert' || !isUpdate;

    const factoryCode = Number(req.body?.FACTORY || req.body?.F_Name || 0);
    const timeCode = Number(req.body?.TIME || 0);
    const dateRaw = req.body?.DDATE || req.body?.date || '';
    const dateIso = parseFlexibleDateToIso(dateRaw);
    const location = String(req.body?.LOCATION_CODE || req.body?.LOCATION || 'P1').trim() || 'P1';

    if (!factoryCode || !timeCode || !dateIso) {
      return res.status(400).json({ success: false, message: 'FACTORY, DDATE and TIME are required' });
    }

    const values = {
      AH_BX: normalizeDecimal(req.body?.AH_BX),
      AH_POL: normalizeDecimal(req.body?.AH_POL),
      AH_PY: normalizeDecimal(req.body?.AH_PY),
      AL_BX: normalizeDecimal(req.body?.AL_BX),
      AL_POL: normalizeDecimal(req.body?.AL_POL),
      AL_PY: normalizeDecimal(req.body?.AL_PY),
      A1_BX: normalizeDecimal(req.body?.A1_BX),
      A1_POL: normalizeDecimal(req.body?.A1_POL),
      A1_PY: normalizeDecimal(req.body?.A1_PY),
      BH_BX: normalizeDecimal(req.body?.BH_BX),
      BH_POL: normalizeDecimal(req.body?.BH_POL),
      BH_PY: normalizeDecimal(req.body?.BH_PY),
      CL_BX: normalizeDecimal(req.body?.CL_BX),
      CL_POL: normalizeDecimal(req.body?.CL_POL),
      CL_PY: normalizeDecimal(req.body?.CL_PY),
      CH_BX: normalizeDecimal(req.body?.CH_BX),
      CH_POL: normalizeDecimal(req.body?.CH_POL),
      CH_PY: normalizeDecimal(req.body?.CH_PY),
      MELT_BX: normalizeDecimal(req.body?.MELT_BX),
      MELT_POL: normalizeDecimal(req.body?.MELT_POL),
      MELT_PY: normalizeDecimal(req.body?.MELT_PY),
      FM_BX: normalizeDecimal(req.body?.FM_BX),
      FM_POL: normalizeDecimal(req.body?.FM_POL),
      FM_PY: normalizeDecimal(req.body?.FM_PY)
    };

    if (isUpdate) {
      await executeQuery(
        `UPDATE LAB_ABC_HEAVY
         SET
           isweb = '0',
           AH_BX = @AH_BX, AH_POL = @AH_POL, AH_PY = @AH_PY,
           AL_BX = @AL_BX, AL_POL = @AL_POL, AL_PY = @AL_PY,
           A1_BX = @A1_BX, A1_POL = @A1_POL, A1_PY = @A1_PY,
           BH_BX = @BH_BX, BH_POL = @BH_POL, BH_PY = @BH_PY,
           CL_BX = @CL_BX, CL_POL = @CL_POL, CL_PY = @CL_PY,
           CH_BX = @CH_BX, CH_POL = @CH_POL, CH_PY = @CH_PY,
           MELT_BX = @MELT_BX, MELT_POL = @MELT_POL, MELT_PY = @MELT_PY,
           FM_BX = @FM_BX, FM_POL = @FM_POL, FM_PY = @FM_PY
         WHERE FACTORY = @factoryCode
           AND CAST(DDATE AS date) = @dateIso
           AND TIME = @timeCode
           AND ISNULL(LOCATION_CODE, '') = @location`,
        { ...values, factoryCode, dateIso, timeCode, location },
        season
      );
      return res.status(200).json({ success: true, message: 'Record updated' });
    }

    if (isInsert) {
      const existing = await executeQuery(
        `SELECT TOP 1 1 AS existsFlag
         FROM LAB_ABC_HEAVY
         WHERE FACTORY = @factoryCode
           AND CAST(DDATE AS date) = @dateIso
           AND TIME = @timeCode
           AND ISNULL(LOCATION_CODE, '') = @location`,
        { factoryCode, dateIso, timeCode, location },
        season
      );
      if (existing.length) {
        return res.status(409).json({ success: false, message: 'Hour already exists for selected factory/date/location' });
      }

      await executeQuery(
        `INSERT INTO LAB_ABC_HEAVY (
           FACTORY, TIME, DDATE,
           AH_BX, AH_POL, AH_PY,
           AL_BX, AL_POL, AL_PY,
           BH_BX, BH_POL, BH_PY,
           CL_BX, CL_POL, CL_PY,
           MELT_BX, MELT_POL, MELT_PY,
           FM_BX, FM_POL, FM_PY,
           LOCATION_CODE,
           CH_BX, CH_POL, CH_PY,
           A1_BX, A1_POL, A1_PY,
           D_DATE_PRIMARY
         ) VALUES (
           @factoryCode, @timeCode, @dateIso,
           @AH_BX, @AH_POL, @AH_PY,
           @AL_BX, @AL_POL, @AL_PY,
           @BH_BX, @BH_POL, @BH_PY,
           @CL_BX, @CL_POL, @CL_PY,
           @MELT_BX, @MELT_POL, @MELT_PY,
           @FM_BX, @FM_POL, @FM_PY,
           @location,
           @CH_BX, @CH_POL, @CH_PY,
           @A1_BX, @A1_POL, @A1_PY,
           REPLACE(CONVERT(varchar(10), @dateIso, 23), '-', '')
         )`,
        { ...values, factoryCode, timeCode, dateIso, location },
        season
      );
      return res.status(200).json({ success: true, message: 'Record inserted' });
    }

    return res.status(400).json({ success: false, message: 'Invalid command' });
  } catch (error) {
    return next(error);
  }
};
exports.MolassesAnalysisDelete = async (req, res, next) => {
  try {
    const season = req.user?.season;
    const factoryCode = Number(req.query.FACTORY || req.body?.FACTORY || 0);
    const timeCode = Number(req.query.TIME || req.body?.TIME || 0);
    const dateRaw = req.query.DDATE || req.body?.DDATE || '';
    const location = String(req.query.LOCATION_CODE || req.query.LOCATION || req.body?.LOCATION_CODE || req.body?.LOCATION || 'P1').trim() || 'P1';
    const dateIso = parseFlexibleDateToIso(dateRaw);

    if (!factoryCode || !timeCode || !dateIso) {
      return res.status(400).json({ success: false, message: 'FACTORY, DDATE and TIME are required' });
    }

    await executeQuery(
      `DELETE FROM LAB_ABC_HEAVY
       WHERE FACTORY = @factoryCode
         AND CAST(DDATE AS date) = @dateIso
         AND TIME = @timeCode
         AND ISNULL(LOCATION_CODE, '') = @location`,
      { factoryCode, dateIso, timeCode, location },
      season
    );

    return res.status(200).json({ success: true, message: 'Record deleted' });
  } catch (error) {
    return next(error);
  }
};
exports.MolassesAnalysisUPId = async (req, res, next) => {
  try {
    const season = req.user?.season;
    const factoryRaw = String(req.query.FACTORY || req.query.factory || req.body?.FACTORY || req.body?.factory || '').trim();
    const timeRaw = String(req.query.TIME || req.query.time || req.body?.TIME || req.body?.time || '').trim();
    const dateRaw = req.query.DDATE || req.query.date || req.body?.DDATE || req.body?.date || '';
    const location = String(req.query.LOCATION || req.query.LOCATION_CODE || req.body?.LOCATION || req.body?.LOCATION_CODE || 'P1').trim() || 'P1';
    const dateIso = parseFlexibleDateToIso(dateRaw);

    const factoryCode = Number(factoryRaw || 0);
    const timeCode = Number(timeRaw || 0);
    if (!factoryCode || !timeCode || !dateIso) {
      return res.status(200).json({ success: true, data: [] });
    }

    const rows = await executeQuery(
      `SELECT TOP 1
          FACTORY,
          CONVERT(varchar(10), DDATE, 103) AS DDATE,
          TIME,
          ISNULL(LOCATION_CODE, '') AS LOCATION_CODE,
          ISNULL(AH_BX, 0) AS AH_BX, ISNULL(AH_POL, 0) AS AH_POL, ISNULL(AH_PY, 0) AS AH_PY,
          ISNULL(AL_BX, 0) AS AL_BX, ISNULL(AL_POL, 0) AS AL_POL, ISNULL(AL_PY, 0) AS AL_PY,
          ISNULL(A1_BX, 0) AS A1_BX, ISNULL(A1_POL, 0) AS A1_POL, ISNULL(A1_PY, 0) AS A1_PY,
          ISNULL(BH_BX, 0) AS BH_BX, ISNULL(BH_POL, 0) AS BH_POL, ISNULL(BH_PY, 0) AS BH_PY,
          ISNULL(CL_BX, 0) AS CL_BX, ISNULL(CL_POL, 0) AS CL_POL, ISNULL(CL_PY, 0) AS CL_PY,
          ISNULL(CH_BX, 0) AS CH_BX, ISNULL(CH_POL, 0) AS CH_POL, ISNULL(CH_PY, 0) AS CH_PY,
          ISNULL(MELT_BX, 0) AS MELT_BX, ISNULL(MELT_POL, 0) AS MELT_POL, ISNULL(MELT_PY, 0) AS MELT_PY,
          ISNULL(FM_BX, 0) AS FM_BX, ISNULL(FM_POL, 0) AS FM_POL, ISNULL(FM_PY, 0) AS FM_PY
       FROM LAB_ABC_HEAVY
       WHERE FACTORY = @factoryCode
         AND CAST(DDATE AS date) = @dateIso
         AND TIME = @timeCode
         AND ISNULL(LOCATION_CODE, '') = @location`,
      { factoryCode, dateIso, timeCode, location },
      season
    );

    return res.status(200).json({ success: true, data: rows });
  } catch (error) {
    return next(error);
  }
};
exports.BcMagmaView = async (req, res, next) => {
  try {
    const season = req.user?.season;
    const factoryRaw = String(req.query.FACTORY || req.query.factory || req.body?.FACTORY || req.body?.factory || '').trim();
    const dateRaw = req.query.DDATE || req.query.date || req.body?.DDATE || req.body?.date || '';
    const dateIso = parseFlexibleDateToIso(dateRaw);

    const factoryCode = Number(factoryRaw || 0);
    if (factoryRaw && factoryRaw !== '0' && !Number.isFinite(factoryCode)) {
      return res.status(400).json({ success: false, message: 'FACTORY/factory must be a number' });
    }
    if (!factoryCode) {
      return res.status(200).json({ success: true, data: [] });
    }

    const rows = await executeQuery(
      `SELECT
          bm.FACTORY,
          COALESCE(NULLIF(RTRIM(mf.F_Name), ''), NULLIF(RTRIM(ff.F_Name), ''), CAST(bm.FACTORY AS varchar(20))) AS F_NAME,
          CONVERT(varchar(10), bm.DDATE, 103) AS DDATE,
          ISNULL(bm.HOUR, 0) AS HOUR,
          ISNULL(h.DIS_HOU, '') AS DIS_HOU,
          ISNULL(bm.LOCATION_CODE, '') AS LOCATION_CODE,
          ISNULL(bm.A1_BX, 0) AS A1_BX,
          ISNULL(bm.A1_POL, 0) AS A1_POL,
          ISNULL(bm.A1_PY, 0) AS A1_PY,
          ISNULL(bm.B_BX, 0) AS B_BX,
          ISNULL(bm.B_POL, 0) AS B_POL,
          ISNULL(bm.B_PY, 0) AS B_PY,
          ISNULL(bm.C_BX, 0) AS C_BX,
          ISNULL(bm.C_POL, 0) AS C_POL,
          ISNULL(bm.C_PY, 0) AS C_PY,
          ISNULL(bm.CD_BX, 0) AS CD_BX,
          ISNULL(bm.CD_POL, 0) AS CD_POL,
          ISNULL(bm.CD_PTY, 0) AS CD_PTY,
          ISNULL(bm.C1_FW_BX, 0) AS C1_FW_BX,
          ISNULL(bm.C1_FW_POL, 0) AS C1_FW_POL,
          ISNULL(bm.C1_FW_PY, 0) AS C1_FW_PY
       FROM LAB_MAGMA bm
       LEFT JOIN MI_Hours h ON h.LABSN = bm.HOUR
       LEFT JOIN MI_Factory mf ON mf.F_Code = bm.FACTORY
       LEFT JOIN Factory ff ON ff.F_Code = bm.FACTORY
       WHERE bm.FACTORY = @factoryCode
         AND (@dateIso IS NULL OR CAST(bm.DDATE AS date) = @dateIso)
       ORDER BY bm.DDATE DESC, bm.HOUR DESC`,
      { factoryCode, dateIso: dateIso || null },
      season
    );

    return res.status(200).json({ success: true, data: rows });
  } catch (error) {
    return next(error);
  }
};
exports.BcMagma = async (req, res, next) => {
  try {
    const season = req.user?.season;
    const factoryRaw = String(req.query.FACTORY || req.query.factory || req.body?.FACTORY || req.body?.factory || '').trim();
    const hourRaw = String(req.query.HOUR || req.query.TIME || req.query.hour || req.query.time || req.body?.HOUR || req.body?.TIME || '').trim();
    const dateRaw = req.query.DDATE || req.query.date || req.body?.DDATE || req.body?.date || '';
    const location = String(req.query.LOCATION || req.query.LOCATION_CODE || req.body?.LOCATION || req.body?.LOCATION_CODE || 'P1').trim() || 'P1';
    const dateIso = parseFlexibleDateToIso(dateRaw);

    const factoryCode = Number(factoryRaw || 0);
    const hourCode = Number(hourRaw || 0);
    if (!factoryCode || !hourCode || !dateIso) {
      return res.status(200).json({ success: true, data: [] });
    }

    const rows = await executeQuery(
      `SELECT TOP 1
          FACTORY,
          CONVERT(varchar(10), DDATE, 103) AS DDATE,
          ISNULL(HOUR, 0) AS HOUR,
          ISNULL(LOCATION_CODE, '') AS LOCATION_CODE,
          ISNULL(A1_BX, 0) AS A1_BX,
          ISNULL(A1_POL, 0) AS A1_POL,
          ISNULL(A1_PY, 0) AS A1_PY,
          ISNULL(B_BX, 0) AS B_BX,
          ISNULL(B_POL, 0) AS B_POL,
          ISNULL(B_PY, 0) AS B_PY,
          ISNULL(C_BX, 0) AS C_BX,
          ISNULL(C_POL, 0) AS C_POL,
          ISNULL(C_PY, 0) AS C_PY,
          ISNULL(CD_BX, 0) AS CD_BX,
          ISNULL(CD_POL, 0) AS CD_POL,
          ISNULL(CD_PTY, 0) AS CD_PTY,
          ISNULL(C1_FW_BX, 0) AS C1_FW_BX,
          ISNULL(C1_FW_POL, 0) AS C1_FW_POL,
          ISNULL(C1_FW_PY, 0) AS C1_FW_PY
       FROM LAB_MAGMA
       WHERE FACTORY = @factoryCode
         AND CAST(DDATE AS date) = @dateIso
         AND HOUR = @hourCode
         AND ISNULL(LOCATION_CODE, '') = @location`,
      { factoryCode, dateIso, hourCode, location },
      season
    );

    return res.status(200).json({ success: true, data: rows });
  } catch (error) {
    return next(error);
  }
};
exports.BcMagma_2 = async (req, res, next) => {
  try {
    const season = req.user?.season;
    const modeRaw = String(req.body?.id || req.body?.Command || '').toLowerCase();
    const isUpdate = modeRaw === 'btupdate' || modeRaw === 'update';
    const isInsert = modeRaw === 'btninsert' || modeRaw === 'insert' || !isUpdate;

    const factoryCode = Number(req.body?.FACTORY || req.body?.F_Name || 0);
    const hourCode = Number(req.body?.HOUR || req.body?.TIME || 0);
    const dateRaw = req.body?.DDATE || req.body?.date || '';
    const dateIso = parseFlexibleDateToIso(dateRaw);
    const location = String(req.body?.LOCATION_CODE || req.body?.LOCATION || 'P1').trim() || 'P1';

    if (!factoryCode || !hourCode || !dateIso) {
      return res.status(400).json({ success: false, message: 'FACTORY, DDATE and HOUR are required' });
    }

    const values = {
      A1_BX: normalizeDecimal(req.body?.A1_BX),
      A1_POL: normalizeDecimal(req.body?.A1_POL),
      A1_PY: normalizeDecimal(req.body?.A1_PY),
      B_BX: normalizeDecimal(req.body?.B_BX),
      B_POL: normalizeDecimal(req.body?.B_POL),
      B_PY: normalizeDecimal(req.body?.B_PY),
      C_BX: normalizeDecimal(req.body?.C_BX),
      C_POL: normalizeDecimal(req.body?.C_POL),
      C_PY: normalizeDecimal(req.body?.C_PY),
      CD_BX: normalizeDecimal(req.body?.CD_BX),
      CD_POL: normalizeDecimal(req.body?.CD_POL),
      CD_PTY: normalizeDecimal(req.body?.CD_PTY),
      C1_FW_BX: normalizeDecimal(req.body?.C1_FW_BX),
      C1_FW_POL: normalizeDecimal(req.body?.C1_FW_POL),
      C1_FW_PY: normalizeDecimal(req.body?.C1_FW_PY)
    };

    if (isUpdate) {
      await executeQuery(
        `UPDATE LAB_MAGMA
         SET
           isweb = '0',
           A1_BX = @A1_BX, A1_POL = @A1_POL, A1_PY = @A1_PY,
           B_BX = @B_BX, B_POL = @B_POL, B_PY = @B_PY,
           C_BX = @C_BX, C_POL = @C_POL, C_PY = @C_PY,
           CD_BX = @CD_BX, CD_POL = @CD_POL, CD_PTY = @CD_PTY,
           C1_FW_BX = @C1_FW_BX, C1_FW_POL = @C1_FW_POL, C1_FW_PY = @C1_FW_PY
         WHERE FACTORY = @factoryCode
           AND CAST(DDATE AS date) = @dateIso
           AND HOUR = @hourCode
           AND ISNULL(LOCATION_CODE, '') = @location`,
        { ...values, factoryCode, dateIso, hourCode, location },
        season
      );
      return res.status(200).json({ success: true, message: 'Record updated' });
    }

    if (isInsert) {
      const existing = await executeQuery(
        `SELECT TOP 1 1 AS existsFlag
         FROM LAB_MAGMA
         WHERE FACTORY = @factoryCode
           AND CAST(DDATE AS date) = @dateIso
           AND HOUR = @hourCode
           AND ISNULL(LOCATION_CODE, '') = @location`,
        { factoryCode, dateIso, hourCode, location },
        season
      );
      if (existing.length) {
        return res.status(409).json({ success: false, message: 'Hour already exists for selected factory/date/location' });
      }

      await executeQuery(
        `INSERT INTO LAB_MAGMA (
           FACTORY, HOUR, DDATE,
           A1_BX, A1_POL, A1_PY,
           B_BX, B_POL, B_PY,
           C_BX, C_POL, C_PY,
           CD_BX, CD_POL, CD_PTY,
           C1_FW_BX, C1_FW_POL, C1_FW_PY,
           LOCATION_CODE,
           D_DATE_PRIMARY
         ) VALUES (
           @factoryCode, @hourCode, @dateIso,
           @A1_BX, @A1_POL, @A1_PY,
           @B_BX, @B_POL, @B_PY,
           @C_BX, @C_POL, @C_PY,
           @CD_BX, @CD_POL, @CD_PTY,
           @C1_FW_BX, @C1_FW_POL, @C1_FW_PY,
           @location,
           REPLACE(CONVERT(varchar(10), @dateIso, 23), '-', '')
         )`,
        { ...values, factoryCode, hourCode, dateIso, location },
        season
      );
      return res.status(200).json({ success: true, message: 'Record inserted' });
    }

    return res.status(400).json({ success: false, message: 'Invalid command' });
  } catch (error) {
    return next(error);
  }
};
exports.BcMagmaDelete = async (req, res, next) => {
  try {
    const season = req.user?.season;
    const factoryCode = Number(req.query.FACTORY || req.body?.FACTORY || 0);
    const hourCode = Number(req.query.HOUR || req.query.TIME || req.body?.HOUR || req.body?.TIME || 0);
    const dateRaw = req.query.DDATE || req.body?.DDATE || '';
    const location = String(req.query.LOCATION_CODE || req.query.LOCATION || req.body?.LOCATION_CODE || req.body?.LOCATION || 'P1').trim() || 'P1';
    const dateIso = parseFlexibleDateToIso(dateRaw);

    if (!factoryCode || !hourCode || !dateIso) {
      return res.status(400).json({ success: false, message: 'FACTORY, DDATE and HOUR are required' });
    }

    await executeQuery(
      `DELETE FROM LAB_MAGMA
       WHERE FACTORY = @factoryCode
         AND CAST(DDATE AS date) = @dateIso
         AND HOUR = @hourCode
         AND ISNULL(LOCATION_CODE, '') = @location`,
      { factoryCode, dateIso, hourCode, location },
      season
    );

    return res.status(200).json({ success: true, message: 'Record deleted' });
  } catch (error) {
    return next(error);
  }
};
exports.BcMagmaUPId = async (req, res, next) => {
  try {
    const season = req.user?.season;
    const factoryRaw = String(req.query.FACTORY || req.query.factory || req.body?.FACTORY || req.body?.factory || '').trim();
    const hourRaw = String(req.query.HOUR || req.query.TIME || req.query.hour || req.query.time || req.body?.HOUR || req.body?.TIME || '').trim();
    const dateRaw = req.query.DDATE || req.query.date || req.body?.DDATE || req.body?.date || '';
    const location = String(req.query.LOCATION || req.query.LOCATION_CODE || req.body?.LOCATION || req.body?.LOCATION_CODE || 'P1').trim() || 'P1';
    const dateIso = parseFlexibleDateToIso(dateRaw);

    const factoryCode = Number(factoryRaw || 0);
    const hourCode = Number(hourRaw || 0);
    if (!factoryCode || !hourCode || !dateIso) {
      return res.status(200).json({ success: true, data: [] });
    }

    const rows = await executeQuery(
      `SELECT TOP 1
          FACTORY,
          CONVERT(varchar(10), DDATE, 103) AS DDATE,
          ISNULL(HOUR, 0) AS HOUR,
          ISNULL(LOCATION_CODE, '') AS LOCATION_CODE,
          ISNULL(A1_BX, 0) AS A1_BX,
          ISNULL(A1_POL, 0) AS A1_POL,
          ISNULL(A1_PY, 0) AS A1_PY,
          ISNULL(B_BX, 0) AS B_BX,
          ISNULL(B_POL, 0) AS B_POL,
          ISNULL(B_PY, 0) AS B_PY,
          ISNULL(C_BX, 0) AS C_BX,
          ISNULL(C_POL, 0) AS C_POL,
          ISNULL(C_PY, 0) AS C_PY,
          ISNULL(CD_BX, 0) AS CD_BX,
          ISNULL(CD_POL, 0) AS CD_POL,
          ISNULL(CD_PTY, 0) AS CD_PTY,
          ISNULL(C1_FW_BX, 0) AS C1_FW_BX,
          ISNULL(C1_FW_POL, 0) AS C1_FW_POL,
          ISNULL(C1_FW_PY, 0) AS C1_FW_PY
       FROM LAB_MAGMA
       WHERE FACTORY = @factoryCode
         AND CAST(DDATE AS date) = @dateIso
         AND HOUR = @hourCode
         AND ISNULL(LOCATION_CODE, '') = @location`,
      { factoryCode, dateIso, hourCode, location },
      season
    );

    return res.status(200).json({ success: true, data: rows });
  } catch (error) {
    return next(error);
  }
};
exports.AddCanePlanView = async (req, res, next) => {
  try {
    const season = req.user?.season;
    const unitRaw = String(req.query.CP_Unit || req.query.unit || req.body?.CP_Unit || req.body?.unit || '').trim();
    const tableName = await resolveCanePlanTable(season);

    const unitCode = Number(unitRaw || 0);
    if (!unitCode) {
      return res.status(200).json({ success: true, data: [] });
    }
    if (!Number.isFinite(unitCode) || unitCode <= 0) {
      return res.status(400).json({ success: false, message: 'CP_Unit must be a positive number' });
    }

    const rows = await executeQuery(
      `SELECT
          cp.CPID,
          cp.CP_Unit,
          COALESCE(RTRIM(mf.F_Short), RTRIM(mf.F_Name), RTRIM(ff.F_Name), CAST(cp.CP_Unit AS varchar(20))) AS F_Short,
          ISNULL(cp.CP_Syrup, 0) AS CP_Syrup,
          ISNULL(cp.CP_BHY, 0) AS CP_BHY,
          ISNULL(cp.CP_FM, 0) AS CP_FM,
          ISNULL(cp.CP_Total, 0) AS CP_Total,
          ISNULL(cp.CP_PolPTarget, 0) AS CP_PolPTarget,
          ISNULL(cp.CP_RecPTarget, 0) AS CP_RecPTarget,
          ISNULL(cp.CP_BHPTarget, 0) AS CP_BHPTarget,
          ISNULL(cp.CP_CHPTarget, 0) AS CP_CHPTarget,
          ISNULL(cp.CP_LossMolBHYPTarget, 0) AS CP_LossMolBHYPTarget,
          ISNULL(cp.CP_LossMolCHYPTarget, 0) AS CP_LossMolCHYPTarget,
          ISNULL(cp.CP_LossMolBHYCHYPTarget, 0) AS CP_LossMolBHYCHYPTarget,
          ISNULL(cp.CP_SteamPTarget, 0) AS CP_SteamPTarget,
          ISNULL(cp.CCP_BagassPTarget, 0) AS CCP_BagassPTarget,
          ISNULL(cp.CP_Alcohol_Syrup, 0) AS CP_Alcohol_Syrup,
          ISNULL(cp.CP_Alcohol_BH, 0) AS CP_Alcohol_BH,
          ISNULL(cp.CP_Alcohol_CH, 0) AS CP_Alcohol_CH,
          ISNULL(cp.CP_PlantCapacity, 0) AS CP_PlantCapacity,
          ISNULL(cp.CP_PPTarget, 0) AS CP_PPTarget,
          ISNULL(cp.CP_PETarget, 0) AS CP_PETarget
       FROM ${tableName} cp
       LEFT JOIN MI_Factory mf ON mf.F_Code = cp.CP_Unit
       LEFT JOIN Factory ff ON ff.F_Code = cp.CP_Unit
       WHERE cp.CP_Unit = @unitCode
       ORDER BY cp.CPID DESC`,
      { unitCode },
      season
    );

    return res.status(200).json({ success: true, data: rows });
  } catch (error) {
    return next(error);
  }
};
exports.AddCanePlan = createProcedureHandler(CONTROLLER, 'AddCanePlan', '');
exports.AddCanePlan_2 = createProcedureHandler(CONTROLLER, 'AddCanePlan', 'string id, string CP_Unit, string Date, string CP_Syrup, string CP_BHY, string CP_FM, string CP_Total, string CP_PlantCapacity, string CP_PolPTarget, string CP_RecPTarget, string CP_BHPTarget, string CP_CHPTarget, string CP_LossMolBHYPTarget, string CP_LossMolCHYPTarget, string CP_LossMolBHYCHYPTarget, string CP_SteamPTarget, string CCP_BagassPTarget, string CP_Alcohol_Syrup, string CP_Alcohol_BH, string CP_Alcohol_CH, string CP_PPTarget, string CP_PETarget, string CPID,string Plant_Capacity_2');
exports.AddCanePlanID = async (req, res, next) => {
  try {
    const season = req.user?.season;
    const idRaw = String(req.query.Rid || req.query.CPID || req.query.sid || req.body?.Rid || req.body?.CPID || req.body?.sid || '').trim();
    const tableName = await resolveCanePlanTable(season);
    if (!idRaw) {
      return res.status(200).json({ success: true, data: null });
    }
    const CPID = Number(idRaw);
    if (!Number.isFinite(CPID) || CPID <= 0) {
      return res.status(400).json({ success: false, message: 'CPID must be a positive number' });
    }

    const rows = await executeQuery(
      `SELECT TOP 1 *
       FROM ${tableName}
       WHERE CPID = @CPID`,
      { CPID },
      season
    );

    return res.status(200).json({ success: true, data: rows[0] || null });
  } catch (error) {
    return next(error);
  }
};
exports.AddCanePlanSearchID = async (req, res, next) => {
  req.query.Rid = req.query.Rid || req.query.CPID || req.query.sid || req.body?.Rid || req.body?.CPID || req.body?.sid || '';
  return exports.AddCanePlanID(req, res, next);
};
exports.TargetActualMISView = async (req, res, next) => {
  try {
    const season = req.user?.season;
    const factoryRaw = String(
      req.query.FACTORY ||
      req.query.factory ||
      req.query.factoryCode ||
      req.body?.FACTORY ||
      req.body?.factory ||
      req.body?.factoryCode ||
      ''
    ).trim();
    const fromRaw = req.query.TM_DATE || req.query.fromDate || req.body?.TM_DATE || req.body?.fromDate || '';
    const toRaw = req.query.Date || req.query.toDate || req.body?.Date || req.body?.toDate || '';
    const fromDate = parseFlexibleDateToIso(fromRaw);
    const toDate = parseFlexibleDateToIso(toRaw);

    const factoryCode = Number(factoryRaw || 0);
    if (!Number.isFinite(factoryCode) || factoryCode < 0) {
      return res.status(400).json({ success: false, message: 'factoryCode/FACTORY must be zero or a positive number' });
    }

    const tableName = await resolveLabTable(season, 'CANETARGET');

    const rows = await executeQuery(
      `SELECT
          ID,
          CPID,
          FACTORY,
          CONVERT(varchar(10), TM_DATE, 103) AS TM_DATE,
          ISNULL(TM_POL_TARGETPERC, 0) AS TM_POL_TARGETPERC,
          ISNULL(TM_POL_ONDATEPERC, 0) AS TM_POL_ONDATEPERC,
          ISNULL(TM_POL_TODATEPERC, 0) AS TM_POL_TODATEPERC,
          ISNULL(TM_RECOV_TARGETPERC, 0) AS TM_RECOV_TARGETPERC,
          ISNULL(TM_RECOV_ONDATEPERC, 0) AS TM_RECOV_ONDATEPERC,
          ISNULL(TM_RECOV_TODATEPERC, 0) AS TM_RECOV_TODATEPERC,
          ISNULL(TM_BH_TARGETPERC, 0) AS TM_BH_TARGETPERC,
          ISNULL(TM_BH_ONDATEPERC, 0) AS TM_BH_ONDATEPERC,
          ISNULL(TM_BH_TODATEPERC, 0) AS TM_BH_TODATEPERC,
          ISNULL(TM_BH_ONDATEQTY, 0) AS TM_BH_ONDATEQTY,
          ISNULL(TM_BH_TODATEQTY, 0) AS TM_BH_TODATEQTY,
          ISNULL(TM_CH_TARGETPERC, 0) AS TM_CH_TARGETPERC,
          ISNULL(TM_CH_ONDATEPERC, 0) AS TM_CH_ONDATEPERC,
          ISNULL(TM_CH_TODATEPERC, 0) AS TM_CH_TODATEPERC,
          ISNULL(TM_CH_ONDATEQTY, 0) AS TM_CH_ONDATEQTY,
          ISNULL(TM_CH_TODATEQTY, 0) AS TM_CH_TODATEQTY,
          ISNULL(TM_LMOS_BHY_TARGETPERC, 0) AS TM_LMOS_BHY_TARGETPERC,
          ISNULL(TM_LMOS_BHY_ONDATEPERC, 0) AS TM_LMOS_BHY_ONDATEPERC,
          ISNULL(TM_LMOS_BHY_TODATEPERC, 0) AS TM_LMOS_BHY_TODATEPERC,
          ISNULL(TM_LMOS_CHY_TARGETPERC, 0) AS TM_LMOS_CHY_TARGETPERC,
          ISNULL(TM_LMOS_CHY_ONDATEPERC, 0) AS TM_LMOS_CHY_ONDATEPERC,
          ISNULL(TM_LMOS_CHY_TODATEPERC, 0) AS TM_LMOS_CHY_TODATEPERC,
          ISNULL(TM_LMOS_BCHY_TARGETPERC, 0) AS TM_LMOS_BCHY_TARGETPERC,
          ISNULL(TM_LMOS_BCHY_ONDATEPERC, 0) AS TM_LMOS_BCHY_ONDATEPERC,
          ISNULL(TM_LMOS_BCHY_TODATEPERC, 0) AS TM_LMOS_BCHY_TODATEPERC,
          ISNULL(TM_STM_TARGETPERC, 0) AS TM_STM_TARGETPERC,
          ISNULL(TM_STM_ONDATEPERC, 0) AS TM_STM_ONDATEPERC,
          ISNULL(TM_STM_TODATEPERC, 0) AS TM_STM_TODATEPERC,
          ISNULL(TM_BAGASSE_TARGETPERC, 0) AS TM_BAGASSE_TARGETPERC,
          ISNULL(TM_BAGASSE_ONDATEPERC, 0) AS TM_BAGASSE_ONDATEPERC,
          ISNULL(TM_BAGASSE_TODATEPERC, 0) AS TM_BAGASSE_TODATEPERC,
          ISNULL(TM_BAGASSE_ONDATEQTY, 0) AS TM_BAGASSE_ONDATEQTY,
          ISNULL(TM_BAGASSE_TODATEQTY, 0) AS TM_BAGASSE_TODATEQTY,
          ISNULL(P_PPTareget, 0) AS P_PPTareget,
          ISNULL(P_PPOnDate, 0) AS P_PPOnDate,
          ISNULL(P_PPToDate, 0) AS P_PPToDate,
          ISNULL(P_PETarget, 0) AS P_PETarget,
          ISNULL(P_PEOnDate, 0) AS P_PEOnDate,
          ISNULL(P_PEToDate, 0) AS P_PEToDate
       FROM ${tableName}
       WHERE (@factoryCode = 0 OR FACTORY = @factoryCode)
         AND (@fromDate IS NULL OR CAST(TM_DATE AS date) >= @fromDate)
         AND (@toDate IS NULL OR CAST(TM_DATE AS date) <= @toDate)
       ORDER BY CAST(TM_DATE AS date) DESC`,
      { factoryCode, fromDate: fromDate || null, toDate: toDate || null },
      season
    );

    return res.status(200).json({ success: true, data: rows });
  } catch (error) {
    return next(error);
  }
};
exports.TaregetvsActualMIS = createProcedureHandler(CONTROLLER, 'TaregetvsActualMIS', '');
exports.TaregetvsActualMIS_2 = createProcedureHandler(CONTROLLER, 'TaregetvsActualMIS', 'string id');
exports.GetCanePlanDataA = createProcedureHandler(CONTROLLER, 'GetCanePlanDataA', 'string CP_Unit');
exports.CalToDate = createProcedureHandler(CONTROLLER, 'CalToDate', 'string f_code,string Date');
exports.AddBudgetview = async (req, res, next) => {
  try {
    const season = req.user?.season || req.query?.season || req.body?.season || process.env.DEFAULT_SEASON || '2526';
    const userId = String(req.user?.userId || req.query?.userId || req.body?.userId || '').trim();
    //const userIdInt = Number.isFinite(Number(userId)) ? Number(userId) : null;
    const utid = String(req.user?.utid || req.query?.utid || req.body?.utid || '').trim();
    const factIdRaw = String(req.user?.factId || req.query?.factId || req.body?.factId || '').trim();
    const isAdmin = utid === '1';
    const factoryRaw = String(
      req.query.WB_Factory ||
      req.query.factoryCode ||
      req.query.f_Code ||
      req.query.factory ||
      req.body?.WB_Factory ||
      req.body?.factoryCode ||
      req.body?.f_Code ||
      req.body?.factory ||
      '0'
    ).trim();

    const factoryCode = Number(factoryRaw || 0);
    if (!Number.isFinite(factoryCode) || factoryCode < 0) {
      return res.status(400).json({ success: false, message: 'factoryCode/WB_Factory must be zero or a positive number' });
    }

    const factId = Number(factIdRaw || 0);
    const hasFactId = Number.isFinite(factId) && factId > 0;

    const rows = await executeQuery(
      `SELECT
          wb.WB_ID,
          wb.WB_Factory,
          ISNULL(f.F_Name, CAST(wb.WB_Factory AS varchar(20))) AS F_Name,
          ISNULL(wb.WB_BudgetAmount, 0) AS WB_BudgetAmount,
          CONVERT(varchar(10), wb.WB_FromDate, 103) AS WB_FromDate,
          CONVERT(varchar(10), wb.WB_ToDate, 103) AS WB_ToDate,
          ISNULL(wb.WB_Week, 0) AS WB_Week
       FROM MI_WeeklyBudget wb
       LEFT JOIN MI_Factory f ON f.F_Code = wb.WB_Factory
       WHERE (@factoryCode = 0 OR wb.WB_Factory = @factoryCode)
         AND (
           @isAdmin = 1
           OR wb.WB_Factory IN (
             SELECT uf.FactID
             FROM MI_UserFact uf
             WHERE uf.UserID = @userIdInt
           )
           OR (
             @hasFactId = 1
             AND (@userIdInt IS NULL OR NOT EXISTS (
               SELECT 1
               FROM MI_UserFact uf
               WHERE uf.UserID = @userIdInt
             ))
             AND wb.WB_Factory = @factId
           )
         )
       ORDER BY wb.WB_FromDate ASC, wb.WB_ID ASC`,
      {
        factoryCode,
        isAdmin: isAdmin ? 1 : 0,
        userIdInt,
        hasFactId: hasFactId ? 1 : 0,
        factId: hasFactId ? factId : null
      },
      season
    );

    return res.status(200).json({ success: true, data: rows });
  } catch (error) {
    return next(error);
  }
};

exports.AddBudget = async (req, res, next) => {
  try {
    const season = req.user?.season;
    const wbIdRaw = String(req.query.WB_Id || req.query.WB_ID || req.query.id || req.body?.WB_Id || req.body?.WB_ID || req.body?.id || '').trim();
    const factoryRaw = String(req.query.f_Code || req.query.WB_Factory || req.query.factoryCode || req.body?.f_Code || req.body?.WB_Factory || req.body?.factoryCode || '').trim();

    if (!wbIdRaw || !factoryRaw) {
      return res.status(200).json({ success: true, data: null });
    }

    const WB_ID = Number(wbIdRaw);
    const WB_Factory = Number(factoryRaw);
    if (!Number.isFinite(WB_ID) || WB_ID <= 0 || !Number.isFinite(WB_Factory) || WB_Factory <= 0) {
      return res.status(400).json({ success: false, message: 'WB_ID and WB_Factory must be positive numbers' });
    }

    const rows = await executeQuery(
      `SELECT TOP 1
          WB_ID,
          WB_Factory,
          ISNULL(WB_BudgetAmount, 0) AS WB_BudgetAmount,
          CONVERT(varchar(10), WB_FromDate, 103) AS WB_FromDate,
          CONVERT(varchar(10), WB_ToDate, 103) AS WB_ToDate,
          ISNULL(WB_Week, 0) AS WB_Week
       FROM MI_WeeklyBudget
       WHERE WB_ID = @WB_ID AND WB_Factory = @WB_Factory`,
      { WB_ID, WB_Factory },
      season
    );

    return res.status(200).json({ success: true, data: rows[0] || null });
  } catch (error) {
    return next(error);
  }
};

exports.AddBudget_2 = async (req, res, next) => {
  try {
    const season = req.user?.season || req.body?.season || req.query?.season || process.env.DEFAULT_SEASON || '2526';
    const userId = String(req.user?.userId || req.body?.userId || req.query?.userId || '').trim();
    const userIdInt = Number.isFinite(Number(userId)) ? Number(userId) : null;
    const utid = String(req.user?.utid || req.body?.utid || req.query?.utid || '').trim();
    const factIdRaw = String(req.user?.factId || req.body?.factId || req.query?.factId || '').trim();
    const isAdmin = utid === '1';
    const modeRaw = String(req.body?.id || req.body?.Command || req.body?.command || '').trim().toLowerCase();
    const wbIdRaw = String(req.body?.WB_ID || req.body?.wb_id || req.body?.Rid || req.body?.rid || '').trim();
    const factoryRaw = String(req.body?.WB_Factory || req.body?.wB_Factory || req.body?.factoryCode || req.body?.f_Code || '').trim();
    const fromRaw = String(req.body?.WB_FromDate || req.body?.wB_FromDate || req.body?.fromDate || '').trim();
    const toRaw = String(req.body?.WB_ToDate || req.body?.wB_ToDate || req.body?.toDate || '').trim();
    const amountRaw = String(req.body?.WB_BudgetAmount || req.body?.wB_BudgetAmount || req.body?.budgetAmount || '').trim();

    const WB_Factory = Number(factoryRaw);
    const WB_BudgetAmount = Number(amountRaw);
    const fromDate = parseFlexibleDateToIso(fromRaw);
    const toDate = parseFlexibleDateToIso(toRaw);

    if (!Number.isFinite(WB_Factory) || WB_Factory <= 0) {
      return res.status(400).json({ success: false, message: 'WB_Factory must be a positive number' });
    }
    if (!fromDate || !toDate) {
      return res.status(400).json({ success: false, message: 'WB_FromDate and WB_ToDate are required' });
    }
    if (!Number.isFinite(WB_BudgetAmount) || WB_BudgetAmount <= 0) {
      return res.status(400).json({ success: false, message: 'WB_BudgetAmount must be greater than zero' });
    }

    if (!isAdmin) {
      const factId = Number(factIdRaw || 0);
      const hasFactId = Number.isFinite(factId) && factId > 0;
      const accessRows = await executeQuery(
        `SELECT TOP 1 1 AS hasAccess
         FROM MI_UserFact
         WHERE UserID = @userIdInt AND FactID = @WB_Factory`,
        { userIdInt, WB_Factory },
        season
      );
      const hasAccess = accessRows.length > 0;
      if (!hasAccess && (!hasFactId || factId !== WB_Factory)) {
        return res.status(403).json({ success: false, message: 'You are not allowed to save budget for this factory' });
      }
    }

    const isUpdate = modeRaw === 'btupdate' || modeRaw === 'update';
    if (isUpdate) {
      const WB_ID = Number(wbIdRaw);
      if (!Number.isFinite(WB_ID) || WB_ID <= 0) {
        return res.status(400).json({ success: false, message: 'WB_ID/Rid must be a positive number for update' });
      }

      await executeQuery(
        `UPDATE MI_WeeklyBudget
         SET WB_BudgetAmount = @WB_BudgetAmount,
             WB_FromDate = @fromDate,
             WB_ToDate = @toDate,
             WB_Userid = @userId
         WHERE WB_ID = @WB_ID AND WB_Factory = @WB_Factory`,
        { WB_ID, WB_Factory, WB_BudgetAmount, fromDate, toDate, userId },
        season
      );

      const rows = await executeQuery(
        `SELECT TOP 1
            WB_ID,
            WB_Factory,
            ISNULL(WB_BudgetAmount, 0) AS WB_BudgetAmount,
            CONVERT(varchar(10), WB_FromDate, 103) AS WB_FromDate,
            CONVERT(varchar(10), WB_ToDate, 103) AS WB_ToDate,
            ISNULL(WB_Week, 0) AS WB_Week
         FROM MI_WeeklyBudget
         WHERE WB_ID = @WB_ID AND WB_Factory = @WB_Factory`,
        { WB_ID, WB_Factory },
        season
      );

      return res.status(200).json({ success: true, message: 'Budget updated successfully', data: rows[0] || null });
    }

    const inserted = await executeQuery(
      `INSERT INTO MI_WeeklyBudget (WB_Factory, WB_BudgetAmount, WB_FromDate, WB_ToDate, WB_Week, WB_Userid)
       VALUES (@WB_Factory, @WB_BudgetAmount, @fromDate, @toDate, DATEPART(WEEK, @fromDate), @userId);
       SELECT CAST(SCOPE_IDENTITY() AS int) AS WB_ID;`,
      { WB_Factory, WB_BudgetAmount, fromDate, toDate, userId },
      season
    );

    return res.status(200).json({
      success: true,
      message: 'Budget added successfully',
      data: { WB_ID: inserted?.[0]?.WB_ID || null }
    });
  } catch (error) {
    return next(error);
  }
};

exports.AddBudgetById = async (req, res, next) => {
  try {
    const season = req.user?.season || req.query?.season || req.body?.season || process.env.DEFAULT_SEASON || '2526';
    const userId = String(req.user?.userId || req.query?.userId || req.body?.userId || '').trim();
    const userIdInt = Number.isFinite(Number(userId)) ? Number(userId) : null;
    const utid = String(req.user?.utid || req.query?.utid || req.body?.utid || '').trim();
    const factIdRaw = String(req.user?.factId || req.query?.factId || req.body?.factId || '').trim();
    const isAdmin = utid === '1';
    const wbIdRaw = String(req.query.WB_Id || req.query.WB_ID || req.query.id || req.body?.WB_Id || req.body?.WB_ID || req.body?.id || '').trim();
    const factoryRaw = String(req.query.f_Code || req.query.WB_Factory || req.query.factoryCode || req.body?.f_Code || req.body?.WB_Factory || req.body?.factoryCode || '').trim();

    if (!wbIdRaw || !factoryRaw) {
      return res.status(200).json({ success: true, data: null });
    }

    const WB_ID = Number(wbIdRaw);
    const WB_Factory = Number(factoryRaw);
    if (!Number.isFinite(WB_ID) || WB_ID <= 0 || !Number.isFinite(WB_Factory) || WB_Factory <= 0) {
      return res.status(400).json({ success: false, message: 'WB_ID and WB_Factory must be positive numbers' });
    }

    const factId = Number(factIdRaw || 0);
    const hasFactId = Number.isFinite(factId) && factId > 0;

    const rows = await executeQuery(
      `SELECT TOP 1
          WB_ID,
          WB_Factory,
          ISNULL(WB_BudgetAmount, 0) AS WB_BudgetAmount,
          CONVERT(varchar(10), WB_FromDate, 103) AS WB_FromDate,
          CONVERT(varchar(10), WB_ToDate, 103) AS WB_ToDate,
          ISNULL(WB_Week, 0) AS WB_Week
       FROM MI_WeeklyBudget
       WHERE WB_ID = @WB_ID AND WB_Factory = @WB_Factory
         AND (
           @isAdmin = 1
           OR WB_Factory IN (
             SELECT uf.FactID
             FROM MI_UserFact uf
             WHERE uf.UserID = @userIdInt
           )
           OR (
             @hasFactId = 1
             AND (@userIdInt IS NULL OR NOT EXISTS (
               SELECT 1
               FROM MI_UserFact uf
               WHERE uf.UserID = @userIdInt
             ))
             AND WB_Factory = @factId
           )
         )`,
      {
        WB_ID,
        WB_Factory,
        isAdmin: isAdmin ? 1 : 0,
        userIdInt,
        hasFactId: hasFactId ? 1 : 0,
        factId: hasFactId ? factId : null
      },
      season
    );

    return res.status(200).json({ success: true, data: rows[0] || null });
  } catch (error) {
    return next(error);
  }
};

exports.AddBudgetDelete = async (req, res, next) => {
  try {
    const season = req.user?.season || req.query?.season || req.body?.season || process.env.DEFAULT_SEASON || '2526';
    const userId = String(req.user?.userId || req.query?.userId || req.body?.userId || '').trim();
    const userIdInt = Number.isFinite(Number(userId)) ? Number(userId) : null;
    const utid = String(req.user?.utid || req.query?.utid || req.body?.utid || '').trim();
    const factIdRaw = String(req.user?.factId || req.query?.factId || req.body?.factId || '').trim();
    const isAdmin = utid === '1';
    const wbIdRaw = String(req.query.WB_ID || req.query.WB_Id || req.query.id || req.body?.WB_ID || req.body?.WB_Id || req.body?.id || '').trim();
    const factoryRaw = String(req.query.WB_Factory || req.query.f_Code || req.query.factoryCode || req.body?.WB_Factory || req.body?.f_Code || req.body?.factoryCode || '').trim();

    const WB_ID = Number(wbIdRaw);
    const WB_Factory = Number(factoryRaw || 0);
    if (!Number.isFinite(WB_ID) || WB_ID <= 0) {
      return res.status(400).json({ success: false, message: 'WB_ID is required and must be a positive number' });
    }

    const factId = Number(factIdRaw || 0);
    const hasFactId = Number.isFinite(factId) && factId > 0;

    await executeQuery(
      `DELETE FROM MI_WeeklyBudget
       WHERE WB_ID = @WB_ID
         AND (@WB_Factory = 0 OR WB_Factory = @WB_Factory)
         AND (
           @isAdmin = 1
           OR WB_Factory IN (
             SELECT uf.FactID
             FROM MI_UserFact uf
             WHERE uf.UserID = @userIdInt
           )
           OR (
             @hasFactId = 1
             AND (@userIdInt IS NULL OR NOT EXISTS (
               SELECT 1
               FROM MI_UserFact uf
               WHERE uf.UserID = @userIdInt
             ))
             AND WB_Factory = @factId
           )
         )`,
      {
        WB_ID,
        WB_Factory,
        isAdmin: isAdmin ? 1 : 0,
        userIdInt,
        hasFactId: hasFactId ? 1 : 0,
        factId: hasFactId ? factId : null
      },
      season
    );

    return res.status(200).json({ success: true, message: 'Budget deleted successfully' });
  } catch (error) {
    return next(error);
  }
};
