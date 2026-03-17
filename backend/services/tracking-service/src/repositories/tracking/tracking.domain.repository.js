const { executeQuery, executeProcedure } = require('../../core/db/query-executor');

const CONTROLLER = 'Tracking';

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

async function executeTrackingProcedure(action, params, season) {
  return executeProcedure(action, params, season);
}

exports.executeTrackingProcedure = executeTrackingProcedure;

function parseUnitCode(req) {
  const unitRaw = String(req.query.unit || req.query.factoryCode || req.body?.unit || req.body?.factoryCode || '').trim();
  const unit = Number(unitRaw);
  if (!unitRaw || !Number.isFinite(unit) || unit <= 0) return null;
  return unit;
}

function parseFlagCsv(raw) {
  return String(raw || '')
    .split(',')
    .map((x) => String(x || '').trim())
    .filter(Boolean);
}

function buildAreaClause(areaFlags = []) {
  const selected = new Set(areaFlags);
  if (!selected.size || selected.has('all') || (selected.has('big') && selected.has('marginal') && selected.has('small'))) {
    return '';
  }
  if (selected.has('big') && selected.has('small') && !selected.has('marginal')) {
    return ' AND (g.g_cul_area < 1 OR g.g_cul_area > 2)';
  }
  if (selected.has('big') && selected.has('marginal') && !selected.has('small')) {
    return ' AND (g.g_cul_area BETWEEN 1 AND 2 OR g.g_cul_area > 2)';
  }
  if (selected.has('marginal') && selected.has('small') && !selected.has('big')) {
    return ' AND (g.g_cul_area BETWEEN 1 AND 2 OR g.g_cul_area < 1)';
  }
  if (selected.has('big')) return ' AND g.g_cul_area > 2';
  if (selected.has('small')) return ' AND g.g_cul_area < 1';
  if (selected.has('marginal')) return ' AND g.g_cul_area BETWEEN 1 AND 2';
  return '';
}

function buildSupplierClause(supplierFlags = []) {
  const selected = new Set(supplierFlags);
  const hasSupplier = selected.has('supplier');
  const hasNonSupplier = selected.has('nonSupplier');
  const hasSurveyed = selected.has('surveyed');

  if (!selected.size || selected.has('all') || (hasSupplier && hasNonSupplier && hasSurveyed)) {
    return '';
  }

  if (hasSupplier && hasNonSupplier && !hasSurveyed) {
    return '';
  }
  if (hasSupplier && hasSurveyed && !hasNonSupplier) {
    return ` AND (
      EXISTS (SELECT 1 FROM purchase p WHERE p.m_factory = g.g_factory AND p.m_vill = g.g_vill AND p.m_grow = g.g_code)
      OR EXISTS (SELECT 1 FROM gashti h WHERE h.gh_factory = g.g_factory AND h.gh_vill = g.g_vill AND h.gh_grow = g.g_code)
    )`;
  }
  if (hasNonSupplier && hasSurveyed && !hasSupplier) {
    return ` AND (
      NOT EXISTS (SELECT 1 FROM purchase p WHERE p.m_factory = g.g_factory AND p.m_vill = g.g_vill AND p.m_grow = g.g_code)
      OR EXISTS (SELECT 1 FROM gashti h WHERE h.gh_factory = g.g_factory AND h.gh_vill = g.g_vill AND h.gh_grow = g.g_code)
    )`;
  }
  if (hasSupplier) {
    return ' AND EXISTS (SELECT 1 FROM purchase p WHERE p.m_factory = g.g_factory AND p.m_vill = g.g_vill AND p.m_grow = g.g_code)';
  }
  if (hasNonSupplier) {
    return ' AND NOT EXISTS (SELECT 1 FROM purchase p WHERE p.m_factory = g.g_factory AND p.m_vill = g.g_vill AND p.m_grow = g.g_code)';
  }
  if (hasSurveyed) {
    return ' AND EXISTS (SELECT 1 FROM gashti h WHERE h.gh_factory = g.g_factory AND h.gh_vill = g.g_vill AND h.gh_grow = g.g_code)';
  }
  return '';
}

exports.Test = createProcedureHandler(CONTROLLER, 'Test', '');
exports.getTest = exports.Test;

exports.TargetEntry = async (req, res, next) => {
  try {
    const season = req.user?.season;
    const unit = parseUnitCode(req);
    const officerRaw = String(req.query.officer || req.query.cdo_code || req.body?.officer || req.body?.cdo_code || '0').trim();
    const officer = Number(officerRaw || 0);
    const areaFlags = parseFlagCsv(req.query.area || req.body?.area || '');
    const supplierFlags = parseFlagCsv(req.query.supplier || req.body?.supplier || '');
    const areaClause = buildAreaClause(areaFlags);
    const supplierClause = buildSupplierClause(supplierFlags);

    if (!unit) {
      return res.status(200).json({ success: true, data: [] });
    }
    if (!Number.isFinite(officer) || officer < 0) {
      return res.status(400).json({ success: false, message: 'officer/cdo_code must be zero or a positive number' });
    }

    let rows = [];
    let data = [];

    if (officer > 0) {
      rows = await executeQuery(
        `SELECT
            v.v_code AS officer_code,
            ISNULL(v.v_name, '') AS officer_name,
            @officer AS cdo_code,
            COUNT(DISTINCT CONCAT(CAST(g.g_vill AS varchar(20)), '-', CAST(g.g_code AS varchar(20)))) AS total_grower,
            CAST(0 AS int) AS target_grower,
            CAST(0 AS decimal(10,2)) AS target_percent
         FROM cdo_mst cdo
         JOIN block b
           ON b.bl_inchargecode = cdo.cdo_code
          AND b.bl_factcode = cdo.CDO_Factcode
         JOIN village v
           ON v.v_block = b.bl_code
          AND v.v_factory = b.bl_factcode
         JOIN grower g
           ON g.g_vill = v.v_code
          AND g.g_factory = v.v_factory
         WHERE cdo.CDO_Factcode = @unit
           AND cdo.cdo_code = @officer
           ${areaClause}
           ${supplierClause}
         GROUP BY v.v_code, v.v_name
         ORDER BY v.v_name`,
        { unit, officer },
        season
      );

      data = rows.map((r) => ({
        officer_code: Number(r.officer_code || 0),
        officer_name: String(r.officer_name || ''),
        cdo_code: Number(r.cdo_code || 0),
        village_code: Number(r.officer_code || 0),
        total_grower: Number(r.total_grower || 0),
        target_grower: Number(r.target_grower || 0),
        target_percent: Number(r.target_percent || 0)
      }));
    } else {
      rows = await executeQuery(
        `SELECT
            cdo.cdo_code AS officer_code,
            ISNULL(cdo.cdo_name, '') AS officer_name,
            COUNT(DISTINCT CONCAT(CAST(g.g_vill AS varchar(20)), '-', CAST(g.g_code AS varchar(20)))) AS total_grower,
            CAST(0 AS int) AS target_grower,
            CAST(0 AS decimal(10,2)) AS target_percent
         FROM cdo_mst cdo
         JOIN block b
           ON b.bl_inchargecode = cdo.cdo_code
          AND b.bl_factcode = cdo.CDO_Factcode
         JOIN village v
           ON v.v_block = b.bl_code
          AND v.v_factory = b.bl_factcode
         JOIN grower g
           ON g.g_vill = v.v_code
          AND g.g_factory = v.v_factory
         WHERE cdo.CDO_Factcode = @unit
           ${areaClause}
           ${supplierClause}
         GROUP BY cdo.cdo_code, cdo.cdo_name
         ORDER BY cdo.cdo_name`,
        { unit },
        season
      );

      data = rows.map((r) => ({
        officer_code: Number(r.officer_code || 0),
        officer_name: String(r.officer_name || ''),
        cdo_code: Number(r.officer_code || 0),
        village_code: 0,
        total_grower: Number(r.total_grower || 0),
        target_grower: Number(r.target_grower || 0),
        target_percent: Number(r.target_percent || 0)
      }));
    }

    return res.status(200).json({ success: true, data });
  } catch (error) {
    return next(error);
  }
};

exports.UnitWiseOfficer = async (req, res, next) => {
  try {
    const season = req.user?.season;
    const unit = parseUnitCode(req);
    if (!unit) {
      return res.status(200).json({ success: true, data: [] });
    }

    const rows = await executeQuery(
      `SELECT
          cdo.cdo_code,
          ISNULL(cdo.cdo_name, '') AS cdo_name
       FROM cdo_mst cdo
       WHERE cdo.CDO_Factcode = @unit
       GROUP BY cdo.cdo_code, cdo.cdo_name
       ORDER BY cdo_name`,
      { unit },
      season
    );

    const data = rows.map((r) => ({
      cdo_code: Number(r.cdo_code || 0),
      cdo_name: String(r.cdo_name || '')
    }));

    return res.status(200).json({ success: true, data });
  } catch (error) {
    return next(error);
  }
};

exports.TargetEntry_2 = async (req, res, next) => {
  try {
    const season = req.user?.season;
    const unitRaw = String(req.body.unit || req.body.factoryCode || '').trim();
    const targetTypeRaw = String(req.body.targetType || req.body.target || '0').trim();
    const entries = Array.isArray(req.body.entries) ? req.body.entries : [];
    const areaFlags = parseFlagCsv(req.body.area || '');
    const supplierFlags = parseFlagCsv(req.body.supplier || '');
    const areaClause = buildAreaClause(areaFlags);
    const supplierClause = buildSupplierClause(supplierFlags);
    const userId = String(req.user?.userId || req.body?.userId || '').trim();

    const unit = Number(unitRaw);
    const targetType = Number(targetTypeRaw || 0);
    if (!Number.isFinite(unit) || unit <= 0) {
      return res.status(400).json({ success: false, message: 'unit/factoryCode must be a positive number' });
    }
    if (!entries.length) {
      return res.status(200).json({ success: true, message: 'No target rows to save' });
    }

    let totalInserted = 0;
    for (const row of entries) {
      const officer = Number(row.officer_code || row.cdo_code || 0);
      const villageCode = Number(row.village_code || row.v_code || row.officer_code || 0);
      const targetPercent = Number(row.target_percent ?? row.targetPercent ?? 0);

      if (!Number.isFinite(officer) || officer <= 0 || !Number.isFinite(villageCode) || villageCode <= 0 || !Number.isFinite(targetPercent) || targetPercent <= 0) {
        continue;
      }

      const inserted = await executeQuery(
        `;WITH candidates AS (
            SELECT
              g.g_factory,
              g.g_vill,
              g.g_code,
              ROW_NUMBER() OVER (ORDER BY NEWID()) AS rn,
              COUNT(1) OVER() AS total_rows
            FROM grower g
            JOIN village v
              ON v.v_code = g.g_vill
             AND v.v_factory = g.g_factory
            JOIN block b
              ON b.bl_code = v.v_block
             AND b.bl_factcode = v.v_factory
            WHERE g.g_factory = @unit
              AND g.g_vill = @villageCode
              AND b.bl_inchargecode = @officer
              ${areaClause}
              ${supplierClause}
              AND NOT EXISTS (
                SELECT 1
                FROM target_tran t
                WHERE t.trg_factory = g.g_factory
                AND t.trg_vill = g.g_vill
                  AND t.trg_grow = g.g_code
                  AND t.trg_code = @targetType
              )
          )
          INSERT INTO target_tran (trg_factory, trg_vill, trg_grow, trg_code, trg_crdate, trg_crby, trg_status)
          SELECT
            c.g_factory,
            c.g_vill,
            c.g_code,
            @targetType,
            GETDATE(),
            @userId,
            0
          FROM candidates c
          WHERE c.rn <= CEILING((@targetPercent / 100.0) * c.total_rows);
          SELECT @@ROWCOUNT AS insertedCount;`,
        { unit, villageCode, officer, targetType, userId, targetPercent },
        season
      );

      totalInserted += Number(inserted?.[0]?.insertedCount || 0);
    }

    return res.status(200).json({
      success: true,
      message: 'Targets saved successfully',
      insertedCount: totalInserted
    });
  } catch (error) {
    return next(error);
  }
};

function formatOfflineDuration(createdAt) {
  const dt = createdAt ? new Date(createdAt) : null;
  if (!dt || Number.isNaN(dt.getTime())) return 'Device status unknown';
  const diffMins = Math.max(0, Math.floor((Date.now() - dt.getTime()) / 60000));
  const h = Math.floor(diffMins / 60);
  const m = diffMins % 60;
  return `Device not Connected since ${h} hours ${m} minutes`;
}

exports.LiveLocationRpt = async (req, res, next) => {
  try {
    const season = req.user?.season;
    const factoryRaw = String(req.query.F_code || req.query.factoryCode || req.body?.F_code || req.body?.factoryCode || '0').trim();
    const empCode = String(req.query.Emp_code || req.query.empCode || req.body?.Emp_code || req.body?.empCode || '').trim();
    const empName = String(req.query.Emp_name || req.query.empName || req.body?.Emp_name || req.body?.empName || '').trim();

    const factoryCode = Number(factoryRaw || 0);
    if (!Number.isFinite(factoryCode) || factoryCode < 0) {
      return res.status(400).json({ success: false, message: 'F_code/factoryCode must be zero or a positive number' });
    }
    const probe = await executeQuery(
      `SELECT OBJECT_ID('MI_UserFact') AS userFactObj`,
      {},
      season
    );
    const hasUserFact = !!probe?.[0]?.userFactObj;
    const factoryFilter = hasUserFact
      ? `(@factoryCode = 0 OR EXISTS (
            SELECT 1
            FROM MI_UserFact uf
            WHERE uf.UserID = mu.Userid
              AND uf.FactID = @factoryCode
         ))`
      : `(@factoryCode = 0 OR 1 = 1)`;

    let rows = [];
    try {
      rows = await executeQuery(
        `SELECT
            ROW_NUMBER() OVER (ORDER BY mu.Userid) AS srnno,
            mu.Userid AS USERCODE,
            ISNULL(mu.Name, '') AS Name,
            ISNULL(mu.Mobile, '') AS Mobile,
            ISNULL(gd.APPVERSION, '') AS APPVERSION,
            ISNULL(gd.BATTERY, '') AS BATTERY,
            ISNULL(gd.LAT, 0) AS LAT,
            ISNULL(gd.LNG, 0) AS LNG,
            ISNULL(gd.ADDRESS, '') AS address,
            gd.CREATEDAT,
            CONVERT(varchar(20), gd.CREATEDAT, 113) AS cordinatedate
         FROM GPSData_EMP gd
         JOIN MI_User mu ON mu.Userid = gd.USERCODE
       WHERE ISNULL(gd.GPS_FLG, 0) = 1
         AND gd.USERCODE <> 'admin'
         AND ${factoryFilter}
         AND (@empCode = '' OR mu.Userid = @empCode)
         AND (@empName = '' OR mu.Name LIKE '%' + @empName + '%')
       ORDER BY mu.Userid`,
        { factoryCode, empCode, empName },
        season
      );
    } catch (primaryError) {
      // Fallback for databases without GPSData_EMP / APPVERSION / BATTERY schema.
      rows = await executeQuery(
        `;WITH latest AS (
            SELECT
              gd.USERCODE,
              gd.IMEI,
              gd.LAT,
              gd.LNG,
              gd.SPEED,
              gd.ADDRESS,
              gd.CREATEDAT,
              ROW_NUMBER() OVER (PARTITION BY gd.USERCODE ORDER BY gd.CREATEDAT DESC) AS rn
            FROM GPSData gd
            WHERE gd.USERCODE <> 'admin'
          )
          SELECT
            ROW_NUMBER() OVER (ORDER BY mu.Userid) AS srnno,
            mu.Userid AS USERCODE,
            ISNULL(mu.Name, '') AS Name,
            ISNULL(mu.Mobile, '') AS Mobile,
            '' AS APPVERSION,
            '' AS BATTERY,
            ISNULL(l.LAT, 0) AS LAT,
            ISNULL(l.LNG, 0) AS LNG,
            ISNULL(l.ADDRESS, '') AS address,
            l.CREATEDAT,
            CONVERT(varchar(20), l.CREATEDAT, 113) AS cordinatedate
          FROM latest l
          JOIN MI_User mu ON mu.Userid = l.USERCODE
          WHERE l.rn = 1
            AND ${factoryFilter}
            AND (@empCode = '' OR mu.Userid = @empCode)
            AND (@empName = '' OR mu.Name LIKE '%' + @empName + '%')
          ORDER BY mu.Userid`,
        { factoryCode, empCode, empName },
        season
      );
    }

    const data = rows.map((r) => {
      const lat = Number(r.LAT || 0);
      const lng = Number(r.LNG || 0);
      const hasCoords = Number.isFinite(lat) && Number.isFinite(lng) && lat !== 0 && lng !== 0;
      const offlineMsg = formatOfflineDuration(r.CREATEDAT);
      const addressText = String(r.address || '').trim();
      return {
        srnno: String(r.srnno || ''),
        USERCODE: String(r.USERCODE || ''),
        Name: String(r.Name || ''),
        Mobile: String(r.Mobile || ''),
        LAT: lat,
        LNG: lng,
        cordinatedate: String(r.cordinatedate || ''),
        APPVERSION: String(r.APPVERSION || ''),
        BATTERY: String(r.BATTERY || ''),
        status: hasCoords ? '1' : '0',
        address: hasCoords
          ? `${offlineMsg}<br/>App Version : ${String(r.APPVERSION || '')}`
          : `No Data Found<br/>App Version : ${String(r.APPVERSION || '')}`,
        lastLocationReceived: hasCoords ? String(r.cordinatedate || '') : 'No Data Found',
        deviceStatus: hasCoords ? offlineMsg : 'No Data Found'
      };
    });

    return res.status(200).json({ success: true, data });
  } catch (error) {
    return next(error);
  }
};

exports.LiveLocationRptData = async (req, res, next) => {
  return exports.LiveLocationRpt(req, res, next);
};

function normalizeDateToYmd(raw) {
  const value = String(raw || '').trim();
  if (!value) return '';
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) return value;
  if (/^\d{8}$/.test(value)) return `${value.slice(0, 4)}-${value.slice(4, 6)}-${value.slice(6, 8)}`;
  const ddmmyyyy = value.match(/^(\d{2})[/-](\d{2})[/-](\d{4})$/);
  if (ddmmyyyy) {
    const [, dd, mm, yyyy] = ddmmyyyy;
    return `${yyyy}-${mm}-${dd}`;
  }
  const dt = new Date(value);
  if (!Number.isNaN(dt.getTime())) {
    const y = dt.getFullYear();
    const m = String(dt.getMonth() + 1).padStart(2, '0');
    const d = String(dt.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }
  return '';
}

function normalizeDateToYmdCompact(raw) {
  const ymd = normalizeDateToYmd(raw);
  return ymd ? ymd.replace(/-/g, '') : '';
}

function normalizeTimeToHHmm(raw, fallback = 0) {
  const value = String(raw || '').trim();
  if (!value) return fallback;
  const hhmmDigits = value.replace(/[^0-9]/g, '');
  if (hhmmDigits.length < 3 || hhmmDigits.length > 4) return fallback;
  const padded = hhmmDigits.padStart(4, '0');
  const hh = Number(padded.slice(0, 2));
  const mm = Number(padded.slice(2, 4));
  if (!Number.isFinite(hh) || !Number.isFinite(mm) || hh < 0 || hh > 23 || mm < 0 || mm > 59) {
    return fallback;
  }
  return (hh * 100) + mm;
}

function formatDurationFromMinutes(totalMins) {
  const mins = Math.max(0, Number(totalMins || 0));
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return `${h} hours ${m} minutes`;
}

function haversineMeters(lat1, lon1, lat2, lon2) {
  const toRad = (x) => (x * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2)
    + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2))
    * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return 6371000 * c;
}

async function buildTrackingLogRows({ season, factoryCode, empCode, empName, ymdDate }) {
  const probe = await executeQuery(`SELECT OBJECT_ID('MI_UserFact') AS userFactObj`, {}, season);
  const hasUserFact = !!probe?.[0]?.userFactObj;
  const factoryFilter = hasUserFact
    ? `(@factoryCode = 0 OR EXISTS (SELECT 1 FROM MI_UserFact uf WHERE uf.UserID = mu.Userid AND uf.FactID = @factoryCode))`
    : `(@factoryCode = 0 OR 1 = 1)`;

  let summaryRows = [];
  try {
    summaryRows = await executeQuery(
      `SELECT
          ROW_NUMBER() OVER (ORDER BY mu.Userid) AS srnno,
          mu.Userid AS ucode,
          ISNULL(mu.Name, '') AS Name,
          ISNULL(mu.Mobile, '') AS Mobile,
          CONVERT(varchar(10), MIN(gd.CREATEDAT), 103) AS cdate,
          CONVERT(varchar(5), MIN(gd.CREATEDAT), 108) AS MinTime,
          CONVERT(varchar(5), MAX(gd.CREATEDAT), 108) AS MaxTime,
          DATEDIFF(MINUTE, MIN(gd.CREATEDAT), MAX(gd.CREATEDAT)) AS TimeDiffMins,
          SUM(ISNULL(gd.distance, 0)) / 1000.0 AS DistanceKm,
          MAX(gd.CREATEDAT) AS LastCreatedAt,
          MAX(ISNULL(gd.ADDRESS, '')) AS address,
          MAX(ISNULL(gd.BATTERY, '')) AS BATTERY,
          MAX(ISNULL(gd.LAT, 0)) AS LAT,
          MAX(ISNULL(gd.LNG, 0)) AS LNG
       FROM GPSData_EMP gd
       JOIN MI_User mu ON mu.Userid = gd.USERCODE
       WHERE gd.USERCODE <> 'admin'
         AND (@ymdDate = '' OR CAST(gd.CREATEDAT AS date) = @ymdDate)
         AND ${factoryFilter}
         AND (@empCode = '' OR mu.Userid = @empCode)
         AND (@empName = '' OR mu.Name LIKE '%' + @empName + '%')
       GROUP BY mu.Userid, mu.Name, mu.Mobile
       ORDER BY mu.Userid`,
      { factoryCode, empCode, empName, ymdDate },
      season
    );
  } catch (primaryError) {
    summaryRows = await executeQuery(
      `SELECT
          ROW_NUMBER() OVER (ORDER BY mu.Userid) AS srnno,
          mu.Userid AS ucode,
          ISNULL(mu.Name, '') AS Name,
          ISNULL(mu.Mobile, '') AS Mobile,
          CONVERT(varchar(10), MIN(gd.CREATEDAT), 103) AS cdate,
          CONVERT(varchar(5), MIN(gd.CREATEDAT), 108) AS MinTime,
          CONVERT(varchar(5), MAX(gd.CREATEDAT), 108) AS MaxTime,
          DATEDIFF(MINUTE, MIN(gd.CREATEDAT), MAX(gd.CREATEDAT)) AS TimeDiffMins,
          SUM(ISNULL(gd.distance, 0)) / 1000.0 AS DistanceKm,
          MAX(gd.CREATEDAT) AS LastCreatedAt,
          MAX(ISNULL(gd.ADDRESS, '')) AS address,
          '' AS BATTERY,
          MAX(ISNULL(gd.LAT, 0)) AS LAT,
          MAX(ISNULL(gd.LNG, 0)) AS LNG
       FROM GPSData gd
       JOIN MI_User mu ON mu.Userid = gd.USERCODE
       WHERE gd.USERCODE <> 'admin'
         AND (@ymdDate = '' OR CAST(gd.CREATEDAT AS date) = @ymdDate)
         AND ${factoryFilter}
         AND (@empCode = '' OR mu.Userid = @empCode)
         AND (@empName = '' OR mu.Name LIKE '%' + @empName + '%')
       GROUP BY mu.Userid, mu.Name, mu.Mobile
       ORDER BY mu.Userid`,
      { factoryCode, empCode, empName, ymdDate },
      season
    );
  }

  return summaryRows.map((row) => {
    const lat = Number(row.LAT || 0);
    const lng = Number(row.LNG || 0);
    const hasCoords = Number.isFinite(lat) && Number.isFinite(lng) && lat !== 0 && lng !== 0;
    const lastCreatedAt = row.LastCreatedAt ? new Date(row.LastCreatedAt) : null;
    const minsOffline = lastCreatedAt && !Number.isNaN(lastCreatedAt.getTime())
      ? Math.floor((Date.now() - lastCreatedAt.getTime()) / 60000)
      : Number.NaN;
    const offlineText = Number.isFinite(minsOffline) && minsOffline >= 20
      ? `Device not Connected since ${Math.floor(minsOffline / 60)} hours ${Math.max(0, minsOffline % 60)} minutes`
      : '';
    const lastAtText = row.LastCreatedAt
      ? new Date(row.LastCreatedAt).toLocaleString('en-GB', { hour12: false })
      : '';
    const address = String(row.address || '').trim();
    const battery = String(row.BATTERY || '').trim();
    return {
      srnno: String(row.srnno || ''),
      USERCODE: String(row.ucode || ''),
      Name: String(row.Name || ''),
      MobNo: String(row.Mobile || ''),
      TDate: String(row.cdate || ''),
      intime: String(row.MinTime || ''),
      outtime: String(row.MaxTime || ''),
      ActiveMinutes: Number(row.TimeDiffMins || 0),
      timedifference: formatDurationFromMinutes(Number(row.TimeDiffMins || 0)),
      Distance: Number(Number(row.DistanceKm || 0).toFixed(2)),
      status: hasCoords ? '1' : '0',
      cordinatedate: hasCoords ? lastAtText : 'No Data Found',
      address: hasCoords
        ? `${offlineText || address || 'Location available'}${battery ? ` BATTERY : ${battery}` : ''}`.trim()
        : 'No Data Found'
    };
  });
}

exports.ViewMapLive = async (req, res, next) => {
  try {
    const season = req.user?.season;
    const factRaw = String(req.query.fact || req.query.F_code || req.query.factoryCode || '0').trim();
    const empCode = String(req.query.EmpCode || req.query.empCode || '').trim();
    const userId = String(req.query.userid || req.query.userid || '').trim();
    const fact = Number(factRaw || 0);

    const probe = await executeQuery(`SELECT OBJECT_ID('MI_UserFact') AS userFactObj`, {}, season);
    const hasUserFact = !!probe?.[0]?.userFactObj;
    const factClause = hasUserFact
      ? `(@fact = 0 OR EXISTS (SELECT 1 FROM MI_UserFact uf WHERE uf.UserID = mu.Userid AND uf.FactID = @fact))`
      : `(@fact = 0 OR 1 = 1)`;

    let rows = [];
    try {
      rows = await executeQuery(
        `;WITH latest AS (
            SELECT
              gd.USERCODE,
              gd.LAT,
              gd.LNG,
              gd.SPEED,
              ISNULL(gd.ADDRESS, '') AS ADDRESS,
              gd.CREATEDAT,
              ROW_NUMBER() OVER (PARTITION BY gd.USERCODE ORDER BY gd.CREATEDAT DESC) AS rn
            FROM GPSData_EMP gd
            WHERE gd.USERCODE <> 'admin'
          )
          SELECT
            mu.Userid AS tr_no,
            ISNULL(mu.Name, '') AS emp_name,
            ISNULL(l.LAT, 0) AS lat,
            ISNULL(l.LNG, 0) AS lng,
            ISNULL(l.SPEED, 0) AS speed,
            ISNULL(l.ADDRESS, '') AS address,
            CONVERT(varchar(20), l.CREATEDAT, 113) AS cordinatedate
          FROM latest l
          JOIN MI_User mu ON mu.Userid = l.USERCODE
          WHERE l.rn = 1
            AND ${factClause}
            AND (@empCode = '' OR mu.Userid = @empCode)
            AND (@userId = '' OR mu.Userid = @userId)
          ORDER BY mu.Userid`,
        { fact, empCode, userId },
        season
      );
    } catch (primaryError) {
      rows = await executeQuery(
        `;WITH latest AS (
            SELECT
              gd.USERCODE,
              gd.LAT,
              gd.LNG,
              gd.SPEED,
              ISNULL(gd.ADDRESS, '') AS ADDRESS,
              gd.CREATEDAT,
              ROW_NUMBER() OVER (PARTITION BY gd.USERCODE ORDER BY gd.CREATEDAT DESC) AS rn
            FROM GPSData gd
            WHERE gd.USERCODE <> 'admin'
          )
          SELECT
            mu.Userid AS tr_no,
            ISNULL(mu.Name, '') AS emp_name,
            ISNULL(l.LAT, 0) AS lat,
            ISNULL(l.LNG, 0) AS lng,
            ISNULL(l.SPEED, 0) AS speed,
            ISNULL(l.ADDRESS, '') AS address,
            CONVERT(varchar(20), l.CREATEDAT, 113) AS cordinatedate
          FROM latest l
          JOIN MI_User mu ON mu.Userid = l.USERCODE
          WHERE l.rn = 1
            AND ${factClause}
            AND (@empCode = '' OR mu.Userid = @empCode)
            AND (@userId = '' OR mu.Userid = @userId)
          ORDER BY mu.Userid`,
        { fact, empCode, userId },
        season
      );
    }

    return res.status(200).json(rows.map((r) => ({
      tr_no: String(r.tr_no || ''),
      emp_name: String(r.emp_name || ''),
      lat: Number(r.lat || 0),
      lng: Number(r.lng || 0),
      speed: Number(r.speed || 0),
      address: String(r.address || ''),
      cordinatedate: String(r.cordinatedate || '')
    })));
  } catch (error) {
    return next(error);
  }
};

exports.TrackingMapLive = async (req, res, next) => {
  try {
    const season = req.user?.season;
    const empId = String(req.query.EmpID || req.query.EmpCode || req.query.empCode || '').trim();
    const dtFromRaw = String(req.query.DtFrom || req.query.dtFrom || req.query.dateFrom || '').trim();
    const dtToRaw = String(req.query.DtTo || req.query.dtTo || req.query.dateTo || dtFromRaw).trim();
    const timeFromRaw = String(req.query.TimeFrom || req.query.timeFrom || req.query.startTime || '').trim();
    const timeToRaw = String(req.query.TimeTo || req.query.timeTo || req.query.endTime || '').trim();
    const dtFrom = normalizeDateToYmd(dtFromRaw);
    const dtTo = normalizeDateToYmd(dtToRaw);
    const timeFrom = normalizeTimeToHHmm(timeFromRaw, 0);
    const timeTo = normalizeTimeToHHmm(timeToRaw, 2359);

    if (!empId) {
      return res.status(200).json([]);
    }

    let rows = [];
    try {
      rows = await executeQuery(
        `SELECT
           ISNULL(gd.LAT, 0) AS lat,
           ISNULL(gd.LNG, 0) AS lng,
           ISNULL(gd.SPEED, 0) AS speed,
           ISNULL(gd.ADDRESS, '') AS address,
           CONVERT(varchar(20), gd.CREATEDAT, 113) AS cordinatedate
         FROM GPSData_EMP gd
         WHERE gd.USERCODE = @empId
           AND (@dtFrom = '' OR CAST(gd.CREATEDAT AS date) >= @dtFrom)
           AND (@dtTo = '' OR CAST(gd.CREATEDAT AS date) <= @dtTo)
           AND (@timeFrom = 0 OR (DATEPART(HOUR, gd.CREATEDAT) * 100 + DATEPART(MINUTE, gd.CREATEDAT)) >= @timeFrom)
           AND (@timeTo = 2359 OR (DATEPART(HOUR, gd.CREATEDAT) * 100 + DATEPART(MINUTE, gd.CREATEDAT)) <= @timeTo)
         ORDER BY gd.CREATEDAT`,
        { empId, dtFrom, dtTo, timeFrom, timeTo },
        season
      );
    } catch (primaryError) {
      rows = await executeQuery(
        `SELECT
           ISNULL(gd.LAT, 0) AS lat,
           ISNULL(gd.LNG, 0) AS lng,
           ISNULL(gd.SPEED, 0) AS speed,
           ISNULL(gd.ADDRESS, '') AS address,
           CONVERT(varchar(20), gd.CREATEDAT, 113) AS cordinatedate
         FROM GPSData gd
         WHERE gd.USERCODE = @empId
           AND (@dtFrom = '' OR CAST(gd.CREATEDAT AS date) >= @dtFrom)
           AND (@dtTo = '' OR CAST(gd.CREATEDAT AS date) <= @dtTo)
           AND (@timeFrom = 0 OR (DATEPART(HOUR, gd.CREATEDAT) * 100 + DATEPART(MINUTE, gd.CREATEDAT)) >= @timeFrom)
           AND (@timeTo = 2359 OR (DATEPART(HOUR, gd.CREATEDAT) * 100 + DATEPART(MINUTE, gd.CREATEDAT)) <= @timeTo)
         ORDER BY gd.CREATEDAT`,
        { empId, dtFrom, dtTo, timeFrom, timeTo },
        season
      );
    }

    return res.status(200).json(rows.map((r) => ({
      lat: Number(r.lat || 0),
      lng: Number(r.lng || 0),
      speed: Number(r.speed || 0),
      address: String(r.address || ''),
      cordinatedate: String(r.cordinatedate || '')
    })));
  } catch (error) {
    return next(error);
  }
};

exports.Trackinglog = async (req, res, next) => {
  try {
    const season = req.user?.season;
    const factoryCode = Number(String(req.query.F_code || req.query.factoryCode || '0').trim() || 0);
    const empCode = String(req.query.Emp_code || req.query.empCode || '').trim();
    const empName = String(req.query.Emp_name || req.query.empName || '').trim();
    const ymdDate = normalizeDateToYmd(req.query.TDate || req.query.date || '');
    const data = await buildTrackingLogRows({ season, factoryCode, empCode, empName, ymdDate });
    return res.status(200).json(data);
  } catch (error) {
    return next(error);
  }
};

exports.Trackinglogg = async (req, res, next) => {
  try {
    const season = req.user?.season;
    const factoryCode = Number(String(req.query.F_code || req.query.factoryCode || req.body?.F_code || req.body?.factoryCode || '0').trim() || 0);
    const empCode = String(req.query.Emp_code || req.query.empCode || req.body?.Emp_code || req.body?.empCode || '').trim();
    const empName = String(req.query.Emp_name || req.query.empName || req.body?.Emp_name || req.body?.empName || '').trim();
    const ymdDate = normalizeDateToYmd(req.query.TDate || req.query.date || req.body?.TDate || req.body?.date || '');
    const data = await buildTrackingLogRows({ season, factoryCode, empCode, empName, ymdDate });
    return res.status(200).json(data);
  } catch (error) {
    return next(error);
  }
};

exports.TargetRpt = async (req, res, next) => {
  try {
    const season = req.user?.season;
    const unit = Number(String(req.query.unit || req.query.F_Name || req.query.F_code || req.query.factoryCode || '0').trim() || 0);
    const zone = String(req.query.zone || req.query.zonecode || req.query.z_code || '0').trim();
    const block = String(req.query.block || req.query.bl_code || '0').trim();
    const fromDate = normalizeDateToYmd(req.query.fromDate || req.query.starttime || req.query.date || '');
    const toDate = normalizeDateToYmd(req.query.toDate || req.query.endtime || req.query.Todate || req.query.fromDate || req.query.starttime || req.query.date || '');

    if (!Number.isFinite(unit) || unit < 0) {
      return res.status(400).json({ success: false, message: 'unit must be zero or a positive number' });
    }

    const rows = await executeQuery(
      `SELECT
          ROW_NUMBER() OVER (
            ORDER BY
              ISNULL(t.trg_updt, t.trg_crdate) DESC,
              z.z_code,
              b.bl_code,
              v.v_code,
              g.g_code
          ) AS srnno,
          CAST(z.z_code AS varchar(20)) AS z_code,
          ISNULL(z.z_name, '') AS z_name,
          CAST(b.bl_code AS varchar(20)) AS bl_code,
          ISNULL(b.bl_name, '') AS bl_name,
          COUNT(1) OVER (PARTITION BY z.z_code, b.bl_code) AS nos,
          CAST(v.v_code AS varchar(20)) AS v_code,
          ISNULL(v.v_name, '') AS v_name,
          CAST(g.g_code AS varchar(20)) AS g_code,
          ISNULL(g.g_name, '') AS g_name,
          ISNULL(mu.Name, '') AS name,
          ISNULL(t.trg_rem, '') AS TRG_REM,
          CASE WHEN ISNULL(t.trg_img, '') = '' THEN '' ELSE '../../Meeting/' + t.trg_img END AS TRG_IMG,
          CONVERT(varchar(16), ISNULL(t.trg_updt, t.trg_crdate), 120) AS MeetingTime
       FROM target_tran t
       JOIN factory f
         ON f.f_code = t.trg_factory
       JOIN village v
         ON v.v_factory = t.trg_factory
        AND v.v_code = t.trg_vill
       JOIN grower g
         ON g.g_factory = t.trg_factory
        AND g.g_vill = t.trg_vill
        AND g.g_code = t.trg_grow
       JOIN circle c
         ON c.factory = v.v_factory
        AND c.cr_code = v.v_circle
       JOIN block b
         ON b.bl_factcode = c.factory
        AND b.bl_code = c.cr_bl_code
        AND ISNULL(b.b_type, 1) = 1
       JOIN zone z
         ON z.z_factory = b.bl_factcode
        AND z.z_code = b.bl_zonecode
        AND ISNULL(z.z_type, 1) = 1
       LEFT JOIN mi_user mu
         ON CAST(mu.userid AS varchar(50)) = CAST(t.trg_sup AS varchar(50))
       WHERE (@unit = 0 OR t.trg_factory = @unit)
         AND (@zone = '' OR @zone = '0' OR CAST(z.z_code AS varchar(20)) = @zone)
         AND (@block = '' OR @block = '0' OR CAST(b.bl_code AS varchar(20)) = @block)
         AND (@fromDate = '' OR CAST(ISNULL(t.trg_updt, t.trg_crdate) AS date) >= @fromDate)
         AND (@toDate = '' OR CAST(ISNULL(t.trg_updt, t.trg_crdate) AS date) <= @toDate)
       ORDER BY ISNULL(t.trg_updt, t.trg_crdate) DESC`,
      { unit, zone, block, fromDate, toDate },
      season
    );

    const data = rows.map((r) => ({
      srnno: String(r.srnno || ''),
      z_code: String(r.z_code || ''),
      z_name: String(r.z_name || ''),
      bl_code: String(r.bl_code || ''),
      bl_name: String(r.bl_name || ''),
      nos: Number(r.nos || 0),
      v_code: String(r.v_code || ''),
      v_name: String(r.v_name || ''),
      g_code: String(r.g_code || ''),
      g_name: String(r.g_name || ''),
      name: String(r.name || ''),
      TRG_REM: String(r.TRG_REM || ''),
      TRG_IMG: String(r.TRG_IMG || ''),
      MeetingTime: String(r.MeetingTime || '')
    }));

    return res.status(200).json({ success: true, data });
  } catch (error) {
    console.error('[tracking-service] TargetRpt failed', {
      message: error?.message,
      stack: error?.stack,
      query: req.query
    });
    return next(error);
  }
};

exports.TrackingReport = async (req, res, next) => {
  try {
    const season = req.user?.season;
    const unit = String(
      req.query.unit
      || req.query.FACID
      || req.query.factoryCode
      || req.query.F_code
      || req.query.fcode
      || req.body?.unit
      || req.body?.FACID
      || req.body?.factoryCode
      || req.body?.F_code
      || req.body?.fcode
      || ''
    ).trim();
    const zone = String(req.query.zone || req.query.zcode || req.query.z_code || req.body?.zone || req.body?.zcode || req.body?.z_code || '0').trim();
    const block = String(req.query.block || req.query.blcode || req.query.bl_code || req.body?.block || req.body?.blcode || req.body?.bl_code || '0').trim();
    const date = normalizeDateToYmd(
      req.query.date
      || req.query.fromDate
      || req.query.FormDate
      || req.query.TDate
      || req.body?.date
      || req.body?.fromDate
      || req.body?.FormDate
      || req.body?.TDate
      || ''
    );

    if (!unit) {
      return res.status(200).json([]);
    }

    const staffRows = await executeQuery(
              `SELECT DISTINCT
              CAST(z.z_code AS varchar(20)) AS zoneCode,
              ISNULL(z.z_name, '') AS zoneName,
              CAST(b.bl_code AS varchar(20)) AS blockCode,
              ISNULL(b.bl_name, '') AS blockName,
              ISNULL(
              CAST(
              COALESCE(mu.userid, bc.cdo_sapcode, bc.cdo_code, b.bl_inchargecode) AS varchar(50)
              ),
              ''
              ) AS empCode,
              ISNULL(mu.name, ISNULL(bc.cdo_name, '-')) AS empName
              FROM zone z
              JOIN block b
              ON CAST(b.bl_zonecode AS varchar(20)) = CAST(z.z_code AS varchar(20))
              AND CAST(b.bl_factcode AS varchar(20)) = CAST(z.z_factory AS varchar(20))
              AND ISNULL(b.b_type, 1) = 1
              LEFT JOIN cdo_mst bc
              ON CAST(bc.cdo_code AS varchar(50)) = CAST(b.bl_inchargecode AS varchar(50))
              AND CAST(bc.CDO_Factcode AS varchar(20)) = CAST(b.bl_factcode AS varchar(20))
              LEFT JOIN MI_UserFact uf
              ON uf.userid = CAST(COALESCE(bc.cdo_sapcode, bc.cdo_code, b.bl_inchargecode) AS varchar(50))
              AND CAST(uf.factid AS varchar(20)) = CAST(z.z_factory AS varchar(20))
              LEFT JOIN MI_User mu
              ON mu.userid = uf.userid
              WHERE CAST(z.z_factory AS varchar(20)) = @unit
              AND ISNULL(z.z_type, 1) = 1
              AND (@zone = '0' OR @zone = '' OR CAST(z.z_code AS varchar(20)) = @zone)
              AND (@block = '0' OR @block = '' OR CAST(b.bl_code AS varchar(20)) = @block)
              ORDER BY z.z_name, b.bl_name, empName`,
      { unit, zone, block },
      season
    );

    let effectiveStaffRows = Array.isArray(staffRows) ? staffRows : [];

    // Fallback when zone/block mappings are missing: still return tracked users for selected unit.
    if (!effectiveStaffRows.length) {
      effectiveStaffRows = await executeQuery(
        `SELECT DISTINCT
            'General' AS zoneCode,
            'General' AS zoneName,
            'General' AS blockCode,
            'General' AS blockName,
            CAST(mu.Userid AS varchar(50)) AS empCode,
            ISNULL(mu.Name, '-') AS empName
         FROM MI_UserFact uf
         JOIN MI_User mu
           ON mu.Userid = uf.UserID
         WHERE CAST(uf.FactID AS varchar(20)) = @unit
           AND (@zone = '0' OR @zone = '' OR @zone = 'General')
           AND (@block = '0' OR @block = '' OR @block = 'General')
         ORDER BY empName`,
        { unit, zone, block },
        season
      );
    }

    let gpsRows = [];
    try {
      gpsRows = await executeQuery(
              `SELECT
              gd.USERCODE AS userCode,
              CONVERT(varchar(5), MIN(gd.CREATEDAT), 108) AS startTime,
              CONVERT(varchar(5), MAX(gd.CREATEDAT), 108) AS endTime,
              SUM(ISNULL(gd.distance, 0)) / 1000.0 AS distanceKm,
              COUNT(DISTINCT t.trg_grow) AS growerCount
              FROM GPSData_EMP gd
              LEFT JOIN target_tran t
              ON CAST(t.trg_sup AS varchar(50)) = CAST(gd.USERCODE AS varchar(50))
              AND (@date = '' OR CAST(ISNULL(t.trg_updt, t.trg_crdate) AS date) = @date)
              WHERE (@date = '' OR CAST(gd.CREATEDAT AS date) = @date)
              GROUP BY gd.USERCODE`,
        { date },
        season
      );
    } catch (primaryError) {
      gpsRows = await executeQuery(
            `SELECT
            gd.USERCODE AS userCode,
            CONVERT(varchar(5), MIN(gd.CREATEDAT), 108) AS startTime,
            CONVERT(varchar(5), MAX(gd.CREATEDAT), 108) AS endTime,
            SUM(ISNULL(gd.distance, 0)) / 1000.0 AS distanceKm,
            COUNT(DISTINCT t.trg_grow) AS growerCount
            FROM GPSData gd
            LEFT JOIN target_tran t
            ON CAST(t.trg_sup AS varchar(50)) = CAST(gd.USERCODE AS varchar(50))
            AND (@date = '' OR CAST(ISNULL(t.trg_updt, t.trg_crdate) AS date) = @date)
            WHERE (@date = '' OR CAST(gd.CREATEDAT AS date) = @date)
            GROUP BY gd.USERCODE`,
        { date },
        season
      );
    }

    const gpsMap = new Map(
      gpsRows.map((r) => [
        String(r.userCode || ''),
        {
          start: String(r.startTime || ''),
          end: String(r.endTime || ''),
          distance: Number(Number(r.distanceKm || 0).toFixed(2)),
          growers: Number(r.growerCount || 0)
        }
      ])
    );

    const zoneBucket = new Map();
    effectiveStaffRows.forEach((row) => {
      const zoneName = String(row.zoneName || '');
      const blockName = String(row.blockName || '');
      if (!zoneBucket.has(zoneName)) zoneBucket.set(zoneName, new Map());
      const blockBucket = zoneBucket.get(zoneName);
      if (!blockBucket.has(blockName)) blockBucket.set(blockName, []);

      const code = String(row.empCode || '');
      const gps = gpsMap.get(code) || { start: '', end: '', distance: 0, growers: 0 };
      blockBucket.get(blockName).push({
        empCode: code,
        empName: String(row.empName || ''),
        duty: gps.start ? 'On Duty' : 'Off Duty',
        start: gps.start || '-',
        end: gps.end || '-',
        distance: `${gps.distance.toFixed(2)} KM`,
        growers: gps.growers
      });
    });

    const data = Array.from(zoneBucket.entries()).map(([zoneName, blockMap]) => ({
      zone: zoneName,
      blocks: Array.from(blockMap.entries()).map(([blockName, staff]) => ({
        block: blockName,
        staff
      }))
    }));

    return res.status(200).json(data);
  } catch (error) {
    return next(error);
  }
};

exports.TrackingReportData = async (req, res, next) => {
  try {
    const season = req.user?.season;
    const factoryCodeRaw = String(req.query.factoryCode || req.query.FACID || '').trim();
    const factoryCode = Number(factoryCodeRaw || 0);
    const userCode = String(req.query.userCode || '').trim();
    const date = normalizeDateToYmd(req.query.date || req.query.FormDate || '');
    const factoryParam = Number.isFinite(factoryCode) && factoryCode > 0 ? factoryCode : 0;

    let users = [];
    try {
      users = await executeQuery(
        `;WITH gps_users AS (
            SELECT DISTINCT CAST(USERCODE AS varchar(50)) AS USERCODE FROM GPSData_EMP
            UNION
            SELECT DISTINCT CAST(USERCODE AS varchar(50)) AS USERCODE FROM GPSData
          )
          SELECT
            uf.FactID AS factid,
            f.F_NAME,
            mu.Userid,
            ISNULL(mu.Name, '') AS Name,
            ISNULL(mu.Mobile, '') AS Mobile
          FROM gps_users gu
          JOIN MI_User mu
            ON mu.Userid = gu.USERCODE
           AND ISNULL(mu.gps_flg, 0) = 1
          JOIN MI_UserFact uf
            ON uf.UserID = mu.Userid
          JOIN Factory f
            ON f.F_CODE = uf.FactID
          WHERE (@factoryCode = 0 OR uf.FactID = @factoryCode)
            AND (@userCode = '' OR mu.Userid = @userCode)
          ORDER BY f.F_NAME, mu.Name, mu.Userid`,
        { factoryCode: factoryParam, userCode },
        season
      );
    } catch (usersFromGpsError) {
      users = await executeQuery(
        `SELECT
            uf.FactID AS factid,
            f.F_NAME,
            mu.Userid,
            ISNULL(mu.Name, '') AS Name,
            ISNULL(mu.Mobile, '') AS Mobile
         FROM MI_UserFact uf
         JOIN MI_User mu
           ON mu.Userid = uf.UserID
          AND ISNULL(mu.gps_flg, 0) = 1
         JOIN Factory f
           ON f.F_CODE = uf.FactID
         WHERE (@factoryCode = 0 OR uf.FactID = @factoryCode)
           AND (@userCode = '' OR mu.Userid = @userCode)
         ORDER BY f.F_NAME, mu.Name, mu.Userid`,
        { factoryCode: factoryParam, userCode },
        season
      );
    }

    const trackingRows = await buildTrackingLogRows({
      season,
      factoryCode: factoryParam,
      empCode: userCode,
      empName: '',
      ymdDate: date
    });

    const trackingByUser = new Map();
    for (const row of trackingRows) {
      trackingByUser.set(String(row.USERCODE || ''), row);
    }

    const summaryMap = new Map();
    const details = [];
    let srNo = 0;

    for (const user of users) {
      const factKey = String(user.factid || '');
      if (!summaryMap.has(factKey)) {
        summaryMap.set(factKey, {
          factid: Number(user.factid || 0),
          F_NAME: String(user.F_NAME || ''),
          totalUsers: 0,
          activeUsers: 0,
          activeMinutes: [],
          distances: []
        });
      }

      const summary = summaryMap.get(factKey);
      summary.totalUsers += 1;

      const tr = trackingByUser.get(String(user.Userid || ''));
      const activeMinutes = Number(tr?.ActiveMinutes || 0);
      const distance = Number(tr?.Distance || 0);
      if (activeMinutes > 0) {
        summary.activeUsers += 1;
        summary.activeMinutes.push(activeMinutes);
      }
      if (distance > 0) {
        summary.distances.push(distance);
      }

      srNo += 1;
      details.push({
        factid: Number(user.factid || 0),
        F_NAME: String(user.F_NAME || ''),
        SrNO: srNo,
        Userid: String(user.Userid || ''),
        Name: String(user.Name || ''),
        MobNo: String(user.Mobile || ''),
        MinTime: String(tr?.intime || ''),
        MaxTime: String(tr?.outtime || ''),
        ActiveMinutes: activeMinutes,
        ActiveHours: activeMinutes > 0 ? formatDurationFromMinutes(activeMinutes) : '0',
        DistanceCovers: Number(distance.toFixed(2)),
        status: String(tr?.status || '0'),
        cordinatedate: String(tr?.cordinatedate || ''),
        address: String(tr?.address || '')
      });
    }

    const summary = Array.from(summaryMap.values())
      .sort((a, b) => String(a.F_NAME).localeCompare(String(b.F_NAME)))
      .map((row) => {
        const avgMins = row.activeMinutes.length
          ? Math.round(row.activeMinutes.reduce((p, c) => p + c, 0) / row.activeMinutes.length)
          : 0;
        const minMins = row.activeMinutes.length ? Math.min(...row.activeMinutes) : 0;
        const maxMins = row.activeMinutes.length ? Math.max(...row.activeMinutes) : 0;
        const avgDist = row.distances.length
          ? Number((row.distances.reduce((p, c) => p + c, 0) / row.distances.length).toFixed(3))
          : 0;
        const minDist = row.distances.length ? Number(Math.min(...row.distances).toFixed(3)) : 0;
        const maxDist = row.distances.length ? Number(Math.max(...row.distances).toFixed(3)) : 0;

        return {
          factid: row.factid,
          F_NAME: row.F_NAME,
          TotalTrackingUser: row.totalUsers,
          ActiveUser: row.activeUsers,
          AvgActiveHours: row.activeUsers > 0 ? formatDurationFromMinutes(avgMins) : 'hours minutes',
          MinActiveHours: row.activeUsers > 0 ? formatDurationFromMinutes(minMins) : 'hours minutes',
          MaxActiveHours: row.activeUsers > 0 ? formatDurationFromMinutes(maxMins) : 'hours minutes',
          AvgCoverDistance: row.distances.length ? avgDist : '',
          MinCoverDistance: row.distances.length ? minDist : '',
          MaxCoverDistance: row.distances.length ? maxDist : ''
        };
      });

    const offlineUsers = details.filter((x) => Number(x.ActiveMinutes || 0) === 0);
    return res.status(200).json({ success: true, data: { summary, offlineUsers, details } });
  } catch (error) {
    console.error('[tracking-service] TrackingReportData failed', {
      message: error?.message,
      stack: error?.stack,
      query: req.query
    });
    return next(error);
  }
};

exports.GrowerMeetingReport = async (req, res, next) => {
  try {
    const season = req.user?.season;
    const unit = Number(String(req.query.unit || req.query.F_Name || req.query.factoryCode || '0').trim() || 0);
    const zone = String(req.query.zone || req.query.z_code || '0').trim();
    const block = String(req.query.block || req.query.bl_code || '0').trim();
    const fromDate = normalizeDateToYmd(req.query.fromDate || req.query.starttime || '');
    const toDate = normalizeDateToYmd(req.query.toDate || req.query.endtime || req.query.fromDate || req.query.starttime || '');

    if (!unit) {
      return res.status(200).json([]);
    }

    const rows = await executeQuery(
      `SELECT
          ROW_NUMBER() OVER (ORDER BY ISNULL(t.trg_updt, t.trg_crdate) DESC) AS srnno,
          v.v_code,
          ISNULL(v.v_name, '') AS v_name,
          g.g_code,
          ISNULL(g.g_name, '') AS g_name,
          ISNULL(g.g_father, '') AS g_father,
          ISNULL(t.trg_rem, '') AS TRG_REM,
          CASE
            WHEN ISNULL(t.trg_img, '') = '' THEN ''
            ELSE '../../Meeting/' + t.trg_img
          END AS TRG_IMG,
          CONVERT(varchar(17), ISNULL(t.trg_updt, t.trg_crdate), 103) + ' ' + CONVERT(varchar(8), ISNULL(t.trg_updt, t.trg_crdate), 108) AS MeetingTime
       FROM target_tran t
       JOIN village v ON v.v_factory = t.trg_factory AND v.v_code = t.trg_vill
       JOIN grower g ON g.g_factory = t.trg_factory AND g.g_vill = t.trg_vill AND g.g_code = t.trg_grow
       JOIN circle c ON c.factory = v.v_factory AND c.cr_code = v.v_circle
       JOIN block b ON b.bl_factcode = c.factory AND b.bl_code = c.cr_bl_code AND ISNULL(b.b_type, 1) = 1
       JOIN zone z ON z.z_factory = b.bl_factcode AND z.z_code = b.bl_zonecode AND ISNULL(z.z_type, 1) = 1
       WHERE t.trg_factory = @unit
         AND (@zone = '0' OR @zone = '' OR z.z_code = @zone)
         AND (@block = '0' OR @block = '' OR b.bl_code = @block)
         AND (@fromDate = '' OR CAST(ISNULL(t.trg_updt, t.trg_crdate) AS date) >= @fromDate)
         AND (@toDate = '' OR CAST(ISNULL(t.trg_updt, t.trg_crdate) AS date) <= @toDate)
       ORDER BY ISNULL(t.trg_updt, t.trg_crdate) DESC`,
      { unit, zone, block, fromDate, toDate },
      season
    );

    return res.status(200).json(rows.map((r) => ({
      srnno: String(r.srnno || ''),
      v_code: String(r.v_code || ''),
      v_name: String(r.v_name || ''),
      g_code: String(r.g_code || ''),
      g_name: String(r.g_name || ''),
      g_father: String(r.g_father || ''),
      TRG_REM: String(r.TRG_REM || ''),
      TRG_IMG: String(r.TRG_IMG || ''),
      MeetingTime: String(r.MeetingTime || '')
    })));
  } catch (error) {
    return next(error);
  }
};

exports.UnitZone = async (req, res, next) => {
  try {
    const season = req.user?.season;
    const unit = Number(
      String(
        req.query.unit
        || req.query.factCode
        || req.query.factoryCode
        || req.query.F_code
        || req.query.fcode
        || req.body?.unit
        || req.body?.factCode
        || req.body?.factoryCode
        || req.body?.F_code
        || req.body?.fcode
        || '0'
      ).trim() || 0
    );
    if (!Number.isFinite(unit) || unit < 0) {
      return res.status(400).json({ success: false, message: 'unit must be zero or a positive number' });
    }

    const rows = await executeQuery(
      `SELECT z_code, z_name
       FROM zone
       WHERE (@unit = 0 OR z_factory = @unit)
         AND ISNULL(z_type, 1) = 1
       ORDER BY z_name`,
      { unit },
      season
    );

    return res.status(200).json(rows.map((r) => ({
      z_code: String(r.z_code || ''),
      z_name: String(r.z_name || '')
    })));
  } catch (error) {
    return next(error);
  }
};

exports.UnitZoneBlock = async (req, res, next) => {
  try {
    const season = req.user?.season;
    const zoneCode = String(
      req.query.zoneCode
      || req.query.zonecode
      || req.query.z_code
      || req.query.zone
      || req.query.zcode
      || req.body?.zoneCode
      || req.body?.zonecode
      || req.body?.z_code
      || req.body?.zone
      || req.body?.zcode
      || ''
    ).trim();
    const unit = Number(
      String(
        req.query.unit
        || req.query.factCode
        || req.query.factoryCode
        || req.query.F_code
        || req.query.fcode
        || req.body?.unit
        || req.body?.factCode
        || req.body?.factoryCode
        || req.body?.F_code
        || req.body?.fcode
        || '0'
      ).trim() || 0
    );

    if (!zoneCode) {
      return res.status(200).json([]);
    }
    if (!Number.isFinite(unit) || unit < 0) {
      return res.status(400).json({ success: false, message: 'unit must be zero or a positive number' });
    }

    const rows = await executeQuery(
      `SELECT bl_code, bl_name
       FROM block
       WHERE bl_zonecode = @zoneCode
         AND (@unit = 0 OR bl_factcode = @unit)
         AND ISNULL(b_type, 1) = 1
       ORDER BY bl_name`,
      { zoneCode, unit },
      season
    );

    return res.status(200).json(rows.map((r) => ({
      bl_code: String(r.bl_code || ''),
      bl_name: String(r.bl_name || '')
    })));
  } catch (error) {
    return next(error);
  }
};

