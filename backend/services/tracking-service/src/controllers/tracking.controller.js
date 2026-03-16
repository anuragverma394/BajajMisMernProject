const { executeQuery } = require('../core/db/query-executor');
const { createNotImplementedHandler } = require('@bajaj/shared');

const CONTROLLER = 'Tracking';

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

exports.Test = createNotImplementedHandler(CONTROLLER, 'Test', '');

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
            v.v_code AS v_code,
            ISNULL(v.v_name, '') AS v_name,
            @officer AS cdo_code,
            ISNULL(cdo.cdo_name, '') AS cdo_name,
            COUNT(DISTINCT CONCAT(CAST(g.g_vill AS varchar(20)), '-', CAST(g.g_code AS varchar(20)))) AS totalgrower,
            CAST(0 AS int) AS totaltargetgrower,
            CAST(0 AS decimal(10,2)) AS target
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
         GROUP BY v.v_code, v.v_name, cdo.cdo_name
         ORDER BY v.v_name`,
        { unit, officer },
        season
      );

      data = rows.map((r) => ({
        v_code: Number(r.v_code || 0),
        v_name: String(r.v_name || ''),
        cdo_code: Number(r.cdo_code || 0),
        cdo_name: String(r.cdo_name || ''),
        totalgrower: Number(r.totalgrower || 0),
        totaltargetgrower: Number(r.totaltargetgrower || 0),
        target: Number(r.target || 0)
      }));
    } else {
      rows = await executeQuery(
        `SELECT
            cdo.cdo_code AS cdo_code,
            ISNULL(cdo.cdo_name, '') AS cdo_name,
            COUNT(DISTINCT CONCAT(CAST(g.g_vill AS varchar(20)), '-', CAST(g.g_code AS varchar(20)))) AS totalgrower,
            CAST(0 AS int) AS totaltargetgrower,
            CAST(0 AS decimal(10,2)) AS target
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
        v_code: 0,
        v_name: '',
        cdo_code: Number(r.cdo_code || 0),
        cdo_name: String(r.cdo_name || ''),
        totalgrower: Number(r.totalgrower || 0),
        totaltargetgrower: Number(r.totaltargetgrower || 0),
        target: Number(r.target || 0)
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
      const villageCode = Number(row.village_code || row.v_code || 0);
      const officer = Number(
        (villageCode > 0
          ? (row.cdo_code || row.officer_code)
          : (row.officer_code || row.cdo_code)
        ) || 0
      );
      const targetPercent = Number(row.target_percent ?? row.targetPercent ?? row.target ?? 0);
      const hasVillage = Number.isFinite(villageCode) && villageCode > 0;

      if (!Number.isFinite(officer) || officer <= 0 || !Number.isFinite(targetPercent) || targetPercent <= 0) {
        continue;
      }

      const villageClause = hasVillage ? 'AND g.g_vill = @villageCode' : '';
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
              ${villageClause}
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
    const dtFrom = normalizeDateToYmd(dtFromRaw);
    const dtTo = normalizeDateToYmd(dtToRaw);

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
         ORDER BY gd.CREATEDAT`,
        { empId, dtFrom, dtTo },
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
         ORDER BY gd.CREATEDAT`,
        { empId, dtFrom, dtTo },
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

exports.TargetRpt = async (req, res, next) => {
  try {
    const season = req.user?.season;
    const unit = Number(String(req.query.unit || req.query.F_code || req.query.factoryCode || '0').trim() || 0);
    const zone = String(req.query.zone || req.query.z_code || '0').trim();
    const block = String(req.query.block || req.query.bl_code || '0').trim();
    const fromDate = normalizeDateToYmdCompact(req.query.fromDate || req.query.starttime || '');
    const toDate = normalizeDateToYmdCompact(req.query.toDate || req.query.endtime || req.query.fromDate || req.query.starttime || '');

    if (!unit) {
      return res.status(200).json({ success: true, data: [] });
    }

    const rows = await executeQuery(
      `;WITH scope_growers AS (
          SELECT DISTINCT g.g_factory, g.g_vill, g.g_code
          FROM grower g
          JOIN village v ON v.v_factory = g.g_factory AND v.v_code = g.g_vill
          JOIN circle c ON c.factory = v.v_factory AND c.cr_code = v.v_circle
          JOIN block b ON b.bl_factcode = c.factory AND b.bl_code = c.cr_bl_code AND ISNULL(b.b_type, 1) = 1
          JOIN zone z ON z.z_factory = b.bl_factcode AND z.z_code = b.bl_zonecode AND ISNULL(z.z_type, 1) = 1
          WHERE g.g_factory = @unit
            AND (@zone = '0' OR @zone = '' OR z.z_code = @zone)
            AND (@block = '0' OR @block = '' OR b.bl_code = @block)
        ),
        target_rows AS (
          SELECT DISTINCT t.trg_factory, t.trg_vill, t.trg_grow
          FROM target_tran t
          JOIN village v ON v.v_factory = t.trg_factory AND v.v_code = t.trg_vill
          JOIN circle c ON c.factory = v.v_factory AND c.cr_code = v.v_circle
          JOIN block b ON b.bl_factcode = c.factory AND b.bl_code = c.cr_bl_code AND ISNULL(b.b_type, 1) = 1
          JOIN zone z ON z.z_factory = b.bl_factcode AND z.z_code = b.bl_zonecode AND ISNULL(z.z_type, 1) = 1
          WHERE t.trg_factory = @unit
            AND (@zone = '0' OR @zone = '' OR z.z_code = @zone)
            AND (@block = '0' OR @block = '' OR b.bl_code = @block)
            AND (@fromDate = '' OR CAST(CONVERT(varchar(8), ISNULL(t.trg_updt, t.trg_crdate), 112) AS int) >= CAST(@fromDate AS int))
            AND (@toDate = '' OR CAST(CONVERT(varchar(8), ISNULL(t.trg_updt, t.trg_crdate), 112) AS int) <= CAST(@toDate AS int))
        )
        SELECT 'Grower Coverage' AS type,
               (SELECT COUNT(1) FROM scope_growers) AS target,
               (SELECT COUNT(1) FROM target_rows) AS achieved`,
      { unit, zone, block, fromDate, toDate },
      season
    );

    const data = rows.map((r) => {
      const target = Number(r.target || 0);
      const achieved = Number(r.achieved || 0);
      const percent = target > 0 ? Number(((achieved * 100) / target).toFixed(2)) : 0;
      return { type: String(r.type || 'Coverage'), target, achieved, percent };
    });

    return res.status(200).json({ success: true, data });
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

exports.TrackingReport = async (req, res, next) => {
  try {
    const season = req.user?.season;
    const unitRaw = String(req.query.unit || req.query.FACID || req.query.F_code || req.query.factoryCode || '').trim();
    const unit = Number(unitRaw || 0);
    const zone = String(req.query.zone || req.query.zcode || '0').trim();
    const block = String(req.query.block || req.query.blcode || '0').trim();
    const date = normalizeDateToYmd(req.query.date || req.query.fromDate || req.query.starttime || '');

    if (!Number.isFinite(unit) || unit <= 0) {
      return res.status(200).json([]);
    }

    let staffRows = [];
    try {
      staffRows = await executeQuery(
        `SELECT DISTINCT
            z.z_code AS zoneCode,
            ISNULL(z.z_name, '') AS zoneName,
            b.bl_code AS blockCode,
            ISNULL(b.bl_name, '') AS blockName,
            ISNULL(CAST(bc.cdo_sapcode AS varchar(50)), '') AS empCode,
            ISNULL(mu.name, ISNULL(bc.cdo_name, '')) AS empName
         FROM zone z
         JOIN block b ON b.bl_zonecode = z.z_code AND b.bl_factcode = z.z_factory AND ISNULL(b.b_type, 1) = 1
         JOIN cdo_mst bc ON bc.cdo_code = b.bl_inchargecode AND bc.CDO_Factcode = b.bl_factcode
         LEFT JOIN MI_UserFact uf ON uf.userid = CAST(bc.cdo_sapcode AS varchar(50)) AND uf.factid = z.z_factory
         LEFT JOIN MI_User mu ON mu.userid = uf.userid
         WHERE z.z_factory = @unit
           AND ISNULL(z.z_type, 1) = 1
           AND (@zone = '0' OR @zone = '' OR z.z_code = @zone)
           AND (@block = '0' OR @block = '' OR b.bl_code = @block)
         ORDER BY zoneName, blockName, empName`,
        { unit, zone, block },
        season
      );
    } catch (error) {
      console.error('[tracking-service] TrackingReport staffRows failed', {
        message: error?.message,
        stack: error?.stack,
        query: req.query
      });
      staffRows = [];
    }

    if (!Array.isArray(staffRows) || !staffRows.length) {
      try {
        staffRows = await executeQuery(
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
      } catch (error) {
        console.error('[tracking-service] TrackingReport fallback staffRows failed', {
          message: error?.message,
          stack: error?.stack,
          query: req.query
        });
        staffRows = [];
      }
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
    staffRows.forEach((row) => {
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
    const factoryCode = String(req.query.factoryCode || req.query.FACID || '').trim();
    const userCode = String(req.query.userCode || '').trim();
    const date = normalizeDateToYmd(req.query.date || '');

    const data = await executeQuery(
      `;WITH gps AS (
          SELECT
            uf.FactID AS factId,
            gd.USERCODE AS userCode,
            DATEDIFF(MINUTE, MIN(gd.CREATEDAT), MAX(gd.CREATEDAT)) / 60.0 AS activeHours,
            SUM(ISNULL(gd.distance, 0)) / 1000.0 AS distanceKm
          FROM GPSData gd
          JOIN MI_UserFact uf ON uf.userid = gd.USERCODE
          WHERE gd.USERCODE <> 'admin'
            AND (@date = '' OR CAST(gd.CREATEDAT AS date) = @date)
            AND (@factoryCode = '' OR CAST(uf.FactID AS varchar(20)) = @factoryCode)
            AND (@userCode = '' OR gd.USERCODE = @userCode)
          GROUP BY uf.FactID, gd.USERCODE
        )
        SELECT
          f.F_CODE,
          f.F_NAME,
          COUNT(DISTINCT g.userCode) AS TotalTrackingUser,
          COUNT(DISTINCT CASE WHEN g.activeHours > 0 THEN g.userCode END) AS ActiveUser,
          CAST(ISNULL(AVG(g.activeHours), 0) AS decimal(10,2)) AS AvgActiveHours,
          CAST(ISNULL(MIN(g.activeHours), 0) AS decimal(10,2)) AS MinActiveHours,
          CAST(ISNULL(MAX(g.activeHours), 0) AS decimal(10,2)) AS MaxActiveHours,
          CAST(ISNULL(AVG(g.distanceKm), 0) AS decimal(10,2)) AS AvgCoverDistance,
          CAST(ISNULL(MIN(g.distanceKm), 0) AS decimal(10,2)) AS MinCoverDistance,
          CAST(ISNULL(MAX(g.distanceKm), 0) AS decimal(10,2)) AS MaxCoverDistance
        FROM gps g
        JOIN Factory f ON f.F_CODE = g.factId
        GROUP BY f.F_CODE, f.F_NAME
        ORDER BY f.F_NAME`,
      { factoryCode, userCode, date },
      season
    );

    return res.status(200).json({ success: true, data });
  } catch (error) {
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
          z.z_code,
          ISNULL(z.z_name, '') AS z_name,
          b.bl_code,
          '0' AS nos,
          ISNULL(b.bl_name, '') AS bl_name,
          v.v_code,
          ISNULL(v.v_name, '') AS v_name,
          g.g_code,
          ISNULL(g.g_name, '') AS g_name,
          ISNULL(mu.name, '') AS name,
          ISNULL(t.trg_rem, '') AS TRG_REM,
          CASE
            WHEN ISNULL(t.trg_img, '') = '' THEN ''
            ELSE '../../Meeting/' + t.trg_img
          END AS TRG_IMG
       FROM target_tran t
       JOIN Factory f ON f.F_CODE = t.trg_factory
       JOIN village v ON v.v_factory = t.trg_factory AND v.v_code = t.trg_vill
       JOIN grower g ON g.g_factory = t.trg_factory AND g.g_vill = t.trg_vill AND g.g_code = t.trg_grow
       JOIN circle c ON c.factory = v.v_factory AND c.cr_code = v.v_circle
       JOIN block b ON b.bl_factcode = c.factory AND b.bl_code = c.cr_bl_code AND ISNULL(b.b_type, 1) = 1
       JOIN zone z ON z.z_factory = b.bl_factcode AND z.z_code = b.bl_zonecode AND ISNULL(z.z_type, 1) = 1
       JOIN mi_user mu ON mu.userid = t.trg_sup
       JOIN mi_userfact uf ON uf.userid = mu.userid AND uf.FactID = t.trg_factory
       WHERE t.trg_factory = @unit
         AND (@zone = '0' OR @zone = '' OR z.z_code = @zone)
         AND (@block = '0' OR @block = '' OR b.bl_code = @block)
         AND (@fromDate = '' OR CAST(ISNULL(t.trg_updt, t.trg_crdate) AS date) >= @fromDate)
         AND (@toDate = '' OR CAST(ISNULL(t.trg_updt, t.trg_crdate) AS date) <= @toDate)
       ORDER BY z.z_code, b.bl_code`,
      { unit, zone, block, fromDate, toDate },
      season
    );

    return res.status(200).json(rows.map((r) => ({
      z_code: String(r.z_code || ''),
      z_name: String(r.z_name || ''),
      bl_code: String(r.bl_code || ''),
      bl_name: String(r.bl_name || ''),
      nos: String(r.nos || '0'),
      v_code: String(r.v_code || ''),
      v_name: String(r.v_name || ''),
      g_code: String(r.g_code || ''),
      g_name: String(r.g_name || ''),
      name: String(r.name || ''),
      TRG_REM: String(r.TRG_REM || ''),
      TRG_IMG: String(r.TRG_IMG || '')
    })));
  } catch (error) {
    return next(error);
  }
};

exports.UnitZone = async (req, res, next) => {
  try {
    const season = req.user?.season;
    const unit = Number(String(req.query.unit || req.query.factCode || req.query.factoryCode || '0').trim() || 0);
    if (!unit) {
      return res.status(200).json([]);
    }

    const rows = await executeQuery(
      `SELECT z_code, z_name
       FROM zone
       WHERE z_factory = @unit AND ISNULL(z_type, 1) = 1
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
    const zoneCode = String(req.query.zoneCode || req.query.zonecode || req.query.z_code || '').trim();
    const unit = Number(String(req.query.unit || req.query.factCode || req.query.factoryCode || '0').trim() || 0);

    if (!zoneCode) {
      return res.status(200).json([]);
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
