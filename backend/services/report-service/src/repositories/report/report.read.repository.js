const { executeQuery, executeProcedure } = require('../../core/db/query-executor');

async function runProcedure(name, params, season) {
  const result = await executeProcedure(name, params, season);
  return result.rows || [];
}

const crushingReportCache = new Map();
const CRUSHING_CACHE_TTL_MS = 2 * 60 * 1000;

function getCrushingCacheKey(season, factCode, dbDate) {
  return `${season || ''}::${String(factCode || '')}::${String(dbDate || '')}`;
}

function normalizeDateToDb(raw) {
  const value = String(raw || '').trim();
  if (!value) return '';
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) return value;
  if (/^\d{2}\/\d{2}\/\d{4}$/.test(value)) {
    const [dd, mm, yyyy] = value.split('/');
    return `${yyyy}-${mm}-${dd}`;
  }
  if (/^\d{2}-\d{2}-\d{4}$/.test(value)) {
    const [dd, mm, yyyy] = value.split('-');
    return `${yyyy}-${mm}-${dd}`;
  }
  const dt = new Date(value);
  if (Number.isNaN(dt.getTime())) return '';
  const dd = String(dt.getDate()).padStart(2, '0');
  const mm = String(dt.getMonth() + 1).padStart(2, '0');
  const yyyy = dt.getFullYear();
  return `${yyyy}-${mm}-${dd}`;
}

function addDaysIso(isoDate, days) {
  const dt = new Date(`${isoDate}T00:00:00`);
  if (Number.isNaN(dt.getTime())) return '';
  dt.setDate(dt.getDate() + days);
  const dd = String(dt.getDate()).padStart(2, '0');
  const mm = String(dt.getMonth() + 1).padStart(2, '0');
  const yyyy = dt.getFullYear();
  return `${yyyy}-${mm}-${dd}`;
}

function parseNumericCsv(value) {
  return String(value || '')
    .split(',')
    .map((v) => Number(String(v).trim()))
    .filter((n) => Number.isFinite(n));
}

async function getCentreCode(params, season) {
  return executeQuery(
    `WITH cet AS (
       SELECT 
         m_Centre,
         M_Factory,
         CASE 
           WHEN CAST(MIN(M_GROS_DT) AS DATE) = @fromDate 
           THEN CASE 
             WHEN CONVERT(VARCHAR(5), ISNULL(MIN(M_GROS_DT), 0), 8) = '00:00'
             THEN CONVERT(VARCHAR(5), ISNULL(MIN(M_TARE_DT), 0), 8)
             ELSE CONVERT(VARCHAR(5), ISNULL(MIN(M_GROS_DT), 0), 8)
             END
           ELSE CONVERT(VARCHAR(5), ISNULL(MIN(M_TARE_DT), 0), 8)
         END AS '1stwmtTime',
         CONVERT(VARCHAR(5), ISNULL(MAX(M_TARE_DT), 0), 8) AS LastWmtTime,
         COUNT(m_Number) AS PurchyNos,
         SUM(ISNULL(M_GROSS - M_TARE - M_JOONA, 0)) AS PurQty
       FROM Purchase p
       WHERE M_TARE_DT != '1900-01-01'
         AND CAST(M_TARE_DT AS DATE) = @fromDate
         AND M_FACTORY = @fCode
       GROUP BY m_Centre, M_Factory
     ),
     etc AS (
       SELECT 
         CH_Centre,
         ch_Factory,
         COUNT(DISTINCT ch_Challan) AS VehDispatchNos,
         CONVERT(VARCHAR(5), ISNULL(MIN(Ch_dep_date), 0), 8) AS '1stdisptchAt',
         CONVERT(VARCHAR(5), ISNULL(MAX(Ch_dep_date), 0), 8) AS LastDisptchAt,
         SUM(CASE WHEN CH_status > 0 THEN 1 ELSE 0 END) AS Recieved
       FROM challan_Final
       WHERE Ch_Cancel = 0
         AND CAST(Ch_dep_date AS DATE) = @fromDate
         AND Ch_dep_date != '1900-01-01'
         AND CH_Factory = @fCode
       GROUP BY CH_Centre, ch_Factory
     )
     SELECT 
       ROW_NUMBER() OVER (ORDER BY cn.c_code) AS SN,
       cn.c_code AS m_Centre,
       cn.C_Name,
       ISNULL(c.[1stwmtTime], 0) AS [1stwmtTime],
       ISNULL(c.LastWmtTime, 0) AS LastWmtTime,
       ISNULL(c.PurchyNos, 0) AS PurchyNos,
       ISNULL(c.PurQty, 0) AS PurQty,
       ISNULL(e.VehDispatchNos, 0) AS VehDispatchNos,
       ISNULL(e.[1stdisptchAt], 0) AS [1stdisptchAt],
       ISNULL(e.LastDisptchAt, 0) AS LastDisptchAt,
       ISNULL(e.Recieved, 0) AS Recieved,
       ISNULL(ISNULL(e.VehDispatchNos, 0) - ISNULL(e.Recieved, 0), 0) AS Balance
     FROM Centre cn
     LEFT JOIN cet c ON c.m_Centre = cn.c_code AND c.M_Factory = cn.c_factory
     LEFT JOIN etc e ON e.CH_Centre = cn.c_code AND e.ch_Factory = cn.c_factory
     WHERE cn.c_factory = @fCode
       AND cn.C_HHC_Centre > 0
     ORDER BY cn.c_code`,
    params,
    season
  );
}

async function getDiseaseList(params, season) {
  return executeQuery(
    `SELECT cd_Code, cd_Name
     FROM Cane_Disease
     WHERE (@fcode = '' OR CAST(factory AS varchar(20)) = @fcode)
     ORDER BY cd_Name`,
    params,
    season
  );
}

async function getSummaryReportUnitWise(params, season) {
  return executeQuery(
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
    params,
    season
  );
}

async function getLatestCrushingDate(params, season) {
  const { factCode } = params;
  const rows = await executeQuery(
    `SELECT MAX(d) AS latestDate FROM (
       SELECT CAST(M_DATE AS date) AS d
       FROM PURCHASE
       WHERE M_FACTORY = @factCode
       UNION ALL
       SELECT CAST(TT_DATE AS date) AS d
       FROM RECEIPT
       WHERE TT_FACTORY = @factCode
     ) src`,
    { factCode: String(factCode) },
    season
  );
  return rows?.[0]?.latestDate || null;
}

function toSqlDateOrEmpty(value) {
  const raw = String(value || '').trim();
  if (!raw) return '';
  return normalizeDateToDb(raw);
}

async function getCdoRow(fCode, userId, season) {
  if (!fCode || !userId) return null;
  const rows = await executeQuery(
    `SELECT TOP 1 * FROM cdo_mst
     WHERE CDO_Factcode = @fact
       AND CDO_MOBILENO IN (SELECT Mobile FROM MI_User WHERE Type = 1 AND Userid = @userId)`,
    { fact: fCode, userId: String(userId) },
    season
  );
  return rows?.[0] || null;
}

async function getBlockCodesForUser(fCode, userId, cdoRow, season) {
  if (!cdoRow) return [];
  const mobile = String(cdoRow.CDO_MOBILENO || '').trim();
  const grp = String(cdoRow.CDO_GRP_CODE || '').trim();
  if (!mobile || !grp) return [];

  let sql = '';
  if (grp === 'BI') {
    sql = `SELECT bl_code
           FROM block
           WHERE bl_factcode = @fact
             AND bl_inchargecode IN (
               SELECT CDO_CODE FROM cdo_mst
               WHERE CDO_Factcode = @fact
                 AND CDO_MOBILENO IN (
                   SELECT Mobile FROM MI_User
                   WHERE Type = 1 AND Userid = @userId AND Mobile = @mobile
                 )
             )`;
  } else if (grp === 'DI') {
    sql = `SELECT bl_code
           FROM block
           WHERE bl_factcode = @fact
             AND bl_Zonecode IN (
               SELECT Z_CODE FROM ZONE
               WHERE z_factory = @fact
                 AND z_div_code IN (
                   SELECT Div_Code FROM Division
                   WHERE factory = @fact
                     AND Div_OfficerCode IN (
                       SELECT CDO_CODE FROM cdo_mst
                       WHERE CDO_Factcode = @fact
                         AND CDO_MOBILENO IN (
                           SELECT Mobile FROM MI_User
                           WHERE Type = 1 AND Userid = @userId AND Mobile = @mobile
                         )
                     )
                 )
             )`;
  } else if (grp === 'ZI') {
    sql = `SELECT bl_code
           FROM block
           WHERE bl_factcode = @fact
             AND bl_Zonecode IN (
               SELECT Z_CODE FROM ZONE
               WHERE z_factory = @fact
                 AND Z_ZoneOfficerCode IN (
                   SELECT CDO_CODE FROM cdo_mst
                   WHERE CDO_Factcode = @fact
                     AND CDO_MOBILENO IN (
                       SELECT Mobile FROM MI_User
                       WHERE Type = 1 AND Userid = @userId AND Mobile = @mobile
                     )
                 )
             )`;
  }

  if (!sql) return [];
  const rows = await executeQuery(sql, { fact: fCode, userId: String(userId), mobile }, season);
  return (rows || []).map((r) => Number(r.bl_code)).filter((n) => Number.isFinite(n));
}

async function getTruckDispatchWeighedData(params, season) {
  const fCode = String(params.F_Code || params.F_code || params.fcode || params.FACT || '').trim();
  const dateRaw = params.Date || params.date || '';
  const filterType = String(params.filterType || params.type || 'all').toLowerCase();
  const userId = params.userId || params.userid || params.UserId || params.UserID || params.userID;

  if (!fCode || !dateRaw) return [];

  const tDate = toSqlDateOrEmpty(dateRaw);
  if (!tDate) return [];

  const cdoRow = await getCdoRow(fCode, userId, season);
  const blockCodes = await getBlockCodesForUser(fCode, userId, cdoRow, season);
  const blockIn = blockCodes.length ? blockCodes.join(',') : '';

  const baseSelect = `
    SELECT Ch_Centre AS C_Code, c_name, ch_challan AS ChalanNo,
           Tr_Code, t.TR_NAME Transporter, Ch_truck_no AS TruckNo,
           CONVERT(varchar, ISNULL(Ch_dep_date,'01/01/1900'), 103) + ' ' + CONVERT(varchar, ISNULL(Ch_dep_date,'01/01/1900'), 8) AS DepartureTime,
           CONVERT(varchar, (CASE WHEN ISNULL(tt_TokDatetime,'01/01/1900')='01/01/1900' THEN ISNULL(TT_CRDATE,'01/01/1900') ELSE ISNULL(tt_TokDatetime,'01/01/1900') END), 103)
             + ' ' + CONVERT(varchar, (CASE WHEN ISNULL(tt_TokDatetime,'01/01/1900')='01/01/1900' THEN ISNULL(TT_CRDATE,'01/01/1900') ELSE ISNULL(tt_TokDatetime,'01/01/1900') END), 8) AS ArrivalTime,
           CONVERT(varchar, ISNULL(tt_TARE_DT,'01/01/1900'), 103) + ' ' + CONVERT(varchar, ISNULL(tt_TARE_DT,'01/01/1900'), 8) AS WeighmentTime,
           CONVERT(varchar(5), DATEADD(minute, DATEDIFF(minute,
             CONVERT(varchar, ISNULL(Ch_dep_date,'01/01/1900'), 8),
             CONVERT(varchar, (CASE WHEN ISNULL(tt_TokDatetime,'01/01/1900')='01/01/1900' THEN ISNULL(TT_CRDATE,Ch_dep_date) ELSE ISNULL(tt_TokDatetime,'01/01/1900') END), 8)
           ), 0), 114) AS TravelTime,
           CONVERT(varchar(5), DATEADD(minute, DATEDIFF(minute,
             CONVERT(varchar, (CASE WHEN ISNULL(tt_TokDatetime,'01/01/1900')='01/01/1900' THEN ISNULL(TT_CRDATE,'01/01/1900') ELSE ISNULL(tt_TokDatetime,'01/01/1900') END), 8),
             CONVERT(varchar, (CASE WHEN ISNULL(tt_TARE_DT,'1900-01-01 00:00:00')='1900-01-01 00:00:00' THEN ISNULL(TT_CRDATE,ISNULL(tt_TokDatetime,'01/01/1900')) ELSE ISNULL(tt_TARE_DT,'1900-01-01 00:00:00') END), 8)
           ), 0), 114) AS WailtTime
    FROM challan_final cf
    LEFT JOIN Receipt r ON r.tt_factory = cf.ch_Factory AND r.tt_center = cf.Ch_Centre AND r.tt_chalanNo = cf.ch_challan
    JOIN centre c ON c.c_factory = cf.ch_Factory AND c.C_Code = cf.Ch_Centre
    JOIN Transporter t ON t.TR_FACTORY = cf.ch_Factory AND t.TR_CODE = cf.ch_trans
    LEFT JOIN T_TOKEN TK ON TK.TT_FACTORY = CH_FACTORY AND TK.TT_CHLN = CH_CHALLAN
    WHERE Ch_Cancel = 0`;

  let conditions = ` AND CAST(Ch_dep_date AS date) = @tDate AND ch_Factory = @fact`;
  let wrapperFilter = '';

  if (filterType === 'yesterday-transit') {
    conditions = ` AND CAST(Ch_dep_date AS date) < @tDate AND ch_Factory = @fact`;
    wrapperFilter = `WHERE ArrivalTime = '01/01/1900 00:00:00'`;
  } else if (filterType === 'transit') {
    wrapperFilter = `WHERE ArrivalTime = '01/01/1900 00:00:00'`;
  } else if (filterType === 'at-yard') {
    conditions += ` AND ch_challan IN (SELECT TT_CHLN FROM T_Token WHERE TT_FACTORY = @fact AND CAST(TT_DATE AS date) <= @tDate)`;
  } else if (filterType === 'at-donga') {
    conditions += ` AND ISNULL(r.tt_tareWeight, 0) = 0`;
  } else if (filterType === 'weighed') {
    conditions += ` AND ISNULL(r.tt_tareWeight, 0) > 0`;
  } else if (filterType === 'all') {
    // keep default
  }

  if (blockIn) {
    conditions += ` AND C_block IN (${blockIn})`;
  }

  const sql = `SELECT ROW_NUMBER() OVER (ORDER BY C_Code) AS SN, * FROM (
      ${baseSelect} ${conditions}
    ) AS Temp ${wrapperFilter} ORDER BY C_Code`;

  return executeQuery(sql, { fact: fCode, tDate }, season);
}

// Get crushing report data for factory on given date
async function getCrushingReportData(params, season) {
  const { factCode, date } = params;

  try {
    const dbDate = normalizeDateToDb(date);
    if (!dbDate) {
      throw new Error('Invalid date format');
    }

    const cacheKey = getCrushingCacheKey(season, factCode, dbDate);
    const cached = crushingReportCache.get(cacheKey);
    if (cached && (Date.now() - cached.ts) < CRUSHING_CACHE_TTL_MS) {
      return cached.data;
    }

    const startTime = Date.now();
    const response = {
      dtpDate: date,
      FACTCODE: factCode,
      lblcrop: '0',
      lblshiftA: '',
      lblshiftB: '',
      lblshiftC: '',
      lblToday6AMto6PMWT: '0.00',
      lblYes6AMto6PMWT: '0.00',
      lblToday6PMto6AMWT: '0.00',
      lblYes6PMto6AMWT: '0.00',
      lblToDToT: '0.00',
      lblYESToT: '0.00',
      lblopr: '0',
      lblCenPur: '0.00',
      lblTruckDisp: '0',
      lblTruckRecv: '0',
      lblTRANSTODAY: '0/0.00',
      lbltransitwtyesterday: '0/0.00',
      lblYDTWEIGHT: '0.00',
      lbltyarddobga: '0.00',
      lblcrushrate: '0.00',
      lblExp: '0.00',
      lblNHour: '0',
      Label51: ''
    };

    const keys = ['Cart', 'Trolly40', 'Trolly60', 'Truck'];
    keys.forEach((key) => {
      response[`lbl${key}OYNos`] = '0';
      response[`lbl${key}OYWt`] = '0.00';
      response[`lbl${key}AtDNos`] = '0';
      response[`lbl${key}AtDWt`] = '0.00';
      response[`lbl${key}ODCNos`] = '0';
      response[`lbl${key}ODCWt`] = '0.00';
      response[`lbl${key}ODCAvg`] = '0.00';
      response[`lbl${key}TDCNos`] = '0';
      response[`lbl${key}TDCWt`] = '0.00';
      response[`lbl${key}TDCAvg`] = '0.00';
    });

    ['OYNos', 'OYWt', 'AtDNos', 'AtDWt', 'ODCNos', 'ODCWt', 'ODCAvg', 'TDCNos', 'TDCWt', 'TDCAvg'].forEach((suffix) => {
      response[`lblGate${suffix}`] = suffix.endsWith('Nos') ? '0' : '0.00';
      response[`lblCenter${suffix}`] = suffix.endsWith('Nos') ? '0' : '0.00';
      response[`lblGtCen${suffix}`] = suffix.endsWith('Nos') ? '0' : '0.00';
    });

    const hourLabels = [
      '6amto7am', '7amto8am', '8amto9am', '9amto10am', '10amto11am', '11amto12pm', '12pmto1pm', '1pmto2pm',
      '2pmto3pm', '3pmto4pm', '4pmto5pm', '5pmto6pm', '6pmto7pm', '7pmto8pm', '8pmto9pm', '9pmto10pm',
      '10pmto11pm', '11pmto12pm', '12amto1am', '1amto2am', '2amto3am', '3amto4am', '4amto5am', '5amto6am'
    ];
    hourLabels.forEach((label) => {
      response[`lbl${label}Wt`] = '0.00';
      response[`lbl${label}TWt`] = '0.00';
    });
    response.lblAtotal = '0.00';
    response.lblBtotal = '0.00';
    response.lblCtotal = '0.00';

    const seasonInfo = await executeQuery(
      `SELECT TOP 1 ISNULL(S_SGT_CD, '0') AS S_SGT_CD,
              S_SHIFTSTARTTIME, S_SHIFTHOUR, S_CHEDATETIME, S_SEASONSTARTDATE
       FROM SEASON WHERE FACTORY = @factCode`,
      { factCode: String(factCode) },
      season
    );
    const gateCodeRaw = seasonInfo[0]?.S_SGT_CD || '0';
    const gateCodes = parseNumericCsv(gateCodeRaw);
    const gateIn = gateCodes.length ? gateCodes.join(',') : '0';
    const seasonStartDate = seasonInfo[0]?.S_SEASONSTARTDATE || null;
    const shiftStartTime = seasonInfo[0]?.S_SHIFTSTARTTIME || '06:00:00';

    if (seasonStartDate) {
      const cropRows = await executeQuery(
        `SELECT DATEDIFF(DAY, CAST(@seasonStart AS date), CAST(@dbDate AS date)) + 1 AS days`,
        { seasonStart: seasonStartDate, dbDate },
        season
      );
      response.lblcrop = String(cropRows?.[0]?.days || '0');
    }

    const modeRows = await executeQuery(
      `SELECT ISNULL(md_qty, 0) AS md_qty, md_code, md_name, ISNULL(md_groupcode, 0) AS md_groupcode
       FROM Mode
       WHERE MD_FACTORY = @factCode AND ISNULL(md_groupcode, 0) IN (1,2,3,4)`,
      { factCode: String(factCode) },
      season
    );
    const modeGroups = new Map();
    modeRows.forEach((row) => {
      const group = Number(row.md_groupcode || 0);
      if (!modeGroups.has(group)) {
        modeGroups.set(group, { codes: [], qty: 0 });
      }
      modeGroups.get(group).codes.push(row.md_code);
      if (!modeGroups.get(group).qty && row.md_qty) {
        modeGroups.get(group).qty = Number(row.md_qty || 0);
      }
    });
    const groupKey = { 1: 'Cart', 2: 'Trolly40', 3: 'Trolly60', 4: 'Truck' };

    const scalar = async (sqlText, params) => {
      const rows = await executeQuery(sqlText, params, season);
      return rows?.[0] || {};
    };

    for (const group of [1, 2, 3, 4]) {
      const key = groupKey[group];
      const groupInfo = modeGroups.get(group) || { codes: [], qty: 0 };
      const codes = groupInfo.codes.map((c) => `'${c}'`).join(',') || "'0'";
      const qty = Number(groupInfo.qty || 0);

      const odcRow = await scalar(
        `SELECT ISNULL(COUNT(M_IND_NO), 0) AS nos,
                ISNULL(SUM(M_GROSS - M_TARE - M_JOONA), 0) AS wt
         FROM PURCHASE
         WHERE M_MODE IN (${codes})
           AND M_FACTORY = @factCode
           AND CAST(M_DATE AS date) = @dbDate
           AND M_CENTRE IN (${gateIn})`,
        { factCode: String(factCode), dbDate }
      );

      const tdcRow = await scalar(
        `SELECT ISNULL(COUNT(M_IND_NO), 0) AS nos,
                ISNULL(SUM(M_GROSS - M_TARE - M_JOONA), 0) AS wt
         FROM PURCHASE
         WHERE M_MODE IN (${codes})
           AND M_FACTORY = @factCode
           AND CAST(M_DATE AS date) <= @dbDate
           AND M_CENTRE IN (${gateIn})`,
        { factCode: String(factCode), dbDate }
      );

      let oyNos = 0;
      try {
        const oyRow = await scalar(
          `SELECT ISNULL(COUNT(T_IndentNo), 0) AS nos
           FROM Token
           WHERE T_ModSupp IN (${codes})
             AND T_FACTORY = @factCode`,
          { factCode: String(factCode) }
        );
        oyNos = Number(oyRow.nos || 0);
      } catch (error) {
        const oyFallback = await scalar(
          `SELECT ISNULL(COUNT(M_IND_NO), 0) AS nos
           FROM PURCHASE
           WHERE M_MODE IN (${codes})
             AND M_FACTORY = @factCode
             AND CAST(M_DATE AS date) = @dbDate
             AND M_CounterNo IS NULL`,
          { factCode: String(factCode), dbDate }
        );
        oyNos = Number(oyFallback.nos || 0);
      }

      let atdNos = 0;
      try {
        const atdRow = await scalar(
          `SELECT ISNULL(COUNT(G_TOKENNO), 0) AS nos
           FROM Gross
           WHERE G_MODSUPP IN (${codes})
             AND ISNULL(G_GROSSWT, 0) > 0
             AND G_FACTORY = @factCode`,
          { factCode: String(factCode) }
        );
        atdNos = Number(atdRow.nos || 0);
      } catch (error) {
        const atdFallback = await scalar(
          `SELECT ISNULL(COUNT(M_IND_NO), 0) AS nos
           FROM PURCHASE
           WHERE M_MODE IN (${codes})
             AND M_FACTORY = @factCode
             AND CAST(M_DATE AS date) = @dbDate
             AND M_CounterNo IS NOT NULL
             AND M_TARE_TM IS NULL`,
          { factCode: String(factCode), dbDate }
        );
        atdNos = Number(atdFallback.nos || 0);
      }

      const odcNos = Number(odcRow.nos || 0);
      const odcWt = Number(odcRow.wt || 0);
      const tdcNos = Number(tdcRow.nos || 0);
      const tdcWt = Number(tdcRow.wt || 0);

      const odcAvg = odcNos > 0 ? (odcWt / odcNos) : 0;
      response[`lbl${key}ODCNos`] = String(odcNos);
      response[`lbl${key}ODCWt`] = odcWt.toFixed(2);
      response[`lbl${key}ODCAvg`] = odcAvg.toFixed(2);
      response[`lbl${key}OYNos`] = String(oyNos);
      response[`lbl${key}AtDNos`] = String(atdNos);

      if (odcNos > 0) {
        response[`lbl${key}OYWt`] = (odcAvg * oyNos).toFixed(2);
        response[`lbl${key}AtDWt`] = (odcAvg * atdNos).toFixed(2);
      }

      response[`lbl${key}TDCNos`] = String(tdcNos);
      response[`lbl${key}TDCWt`] = tdcWt.toFixed(2);
      if (tdcNos > 0) {
        const tdcAvg = tdcWt / tdcNos;
        response[`lbl${key}TDCAvg`] = tdcAvg.toFixed(2);
        response[`lbl${key}OYWt`] = (tdcAvg * oyNos).toFixed(2);
        response[`lbl${key}AtDWt`] = (tdcAvg * atdNos).toFixed(2);
      } else {
        response[`lbl${key}TDCAvg`] = '0.00';
        if (qty > 0) {
          response[`lbl${key}OYWt`] = (qty * oyNos).toFixed(2);
          response[`lbl${key}AtDWt`] = (qty * atdNos).toFixed(2);
        }
      }
    }

    let gateOYNos = 0, gateOYWt = 0, gateAtDNos = 0, gateAtDWt = 0;
    let gateODCNos = 0, gateODCWt = 0, gateTDCNos = 0, gateTDCWt = 0;
    keys.forEach((k) => {
      gateOYNos += Number(response[`lbl${k}OYNos`] || 0);
      gateOYWt += Number(response[`lbl${k}OYWt`] || 0);
      gateAtDNos += Number(response[`lbl${k}AtDNos`] || 0);
      gateAtDWt += Number(response[`lbl${k}AtDWt`] || 0);
      gateODCNos += Number(response[`lbl${k}ODCNos`] || 0);
      gateODCWt += Number(response[`lbl${k}ODCWt`] || 0);
      gateTDCNos += Number(response[`lbl${k}TDCNos`] || 0);
      gateTDCWt += Number(response[`lbl${k}TDCWt`] || 0);
    });
    response.lblGateOYNos = String(gateOYNos);
    response.lblGateOYWt = gateOYWt.toFixed(2);
    response.lblGateAtDNos = String(gateAtDNos);
    response.lblGateAtDWt = gateAtDWt.toFixed(2);
    response.lblGateODCNos = String(gateODCNos);
    response.lblGateODCWt = gateODCWt.toFixed(2);
    response.lblGateODCAvg = gateODCNos > 0 ? (gateODCWt / gateODCNos).toFixed(2) : '0.00';
    response.lblGateTDCNos = String(gateTDCNos);
    response.lblGateTDCWt = gateTDCWt.toFixed(2);
    response.lblGateTDCAvg = gateTDCNos > 0 ? (gateTDCWt / gateTDCNos).toFixed(2) : '0.00';

    const centerOYRow = await scalar(
      `SELECT ISNULL(COUNT(TT_CHLN), 0) AS nos
       FROM T_TOKEN
       WHERE TT_FACTORY = @factCode`,
      { factCode: String(factCode) }
    ).catch(() => ({ nos: 0 }));
    const centerAtDRow = await scalar(
      `SELECT ISNULL(COUNT(TT_CHALANNO), 0) AS nos
       FROM RECEIPT
       WHERE ISNULL(TT_GROSSWEIGHT, 0) > 0
         AND ISNULL(TT_TAREWEIGHT, 0) = 0
         AND TT_FACTORY = @factCode`,
      { factCode: String(factCode) }
    );
    const centerOdcRow = await scalar(
      `SELECT ISNULL(COUNT(tt_chalanNo), 0) AS nos,
              ISNULL(SUM(tt_grossweight - tt_tareweight - tt_joonaweight), 0) AS wt
       FROM RECEIPT
       WHERE CAST(tt_Date AS date) = @dbDate
         AND tt_center NOT IN (${gateIn})
         AND TT_FACTORY = @factCode
         AND ISNULL(TT_TAREWEIGHT, 0) > 0`,
      { factCode: String(factCode), dbDate }
    );
    const centerTdcRow = await scalar(
      `SELECT ISNULL(COUNT(tt_chalanNo), 0) AS nos,
              ISNULL(SUM(tt_grossweight - tt_tareweight - tt_joonaweight), 0) AS wt
       FROM RECEIPT
       WHERE CAST(tt_Date AS date) <= @dbDate
         AND tt_center NOT IN (${gateIn})
         AND TT_FACTORY = @factCode
         AND ISNULL(TT_TAREWEIGHT, 0) > 0`,
      { factCode: String(factCode), dbDate }
    );

    const cenOYNos = Number(centerOYRow.nos || 0);
    const cenAtDNos = Number(centerAtDRow.nos || 0);
    const cenOdcNos = Number(centerOdcRow.nos || 0);
    const cenOdcWt = Number(centerOdcRow.wt || 0);
    const cenTdcNos = Number(centerTdcRow.nos || 0);
    const cenTdcWt = Number(centerTdcRow.wt || 0);

    response.lblCenterOYNos = String(cenOYNos);
    response.lblCenterAtDNos = String(cenAtDNos);
    response.lblCenterODCNos = String(cenOdcNos);
    response.lblCenterODCWt = cenOdcWt.toFixed(2);
    response.lblCenterODCAvg = cenOdcNos > 0 ? (cenOdcWt / cenOdcNos).toFixed(2) : '0.00';
    response.lblCenterTDCNos = String(cenTdcNos);
    response.lblCenterTDCWt = cenTdcWt.toFixed(2);
    response.lblCenterTDCAvg = cenTdcNos > 0 ? (cenTdcWt / cenTdcNos).toFixed(2) : '0.00';
    if (cenTdcNos > 0) {
      const avg = cenTdcWt / cenTdcNos;
      response.lblCenterOYWt = (avg * cenOYNos).toFixed(2);
      response.lblCenterAtDWt = (avg * cenAtDNos).toFixed(2);
    } else {
      response.lblCenterOYWt = '0.00';
      response.lblCenterAtDWt = '0.00';
    }

    const gtCenOYNos = gateOYNos + cenOYNos;
    const gtCenOYWt = gateOYWt + Number(response.lblCenterOYWt || 0);
    const gtCenAtDNos = gateAtDNos + cenAtDNos;
    const gtCenAtDWt = gateAtDWt + Number(response.lblCenterAtDWt || 0);
    const gtCenODCNos = gateODCNos + cenOdcNos;
    const gtCenODCWt = gateODCWt + cenOdcWt;
    const gtCenTDCNos = gateTDCNos + cenTdcNos;
    const gtCenTDCWt = gateTDCWt + cenTdcWt;

    response.lblGtCenOYNos = String(gtCenOYNos);
    response.lblGtCenOYWt = gtCenOYWt.toFixed(2);
    response.lblGtCenAtDNos = String(gtCenAtDNos);
    response.lblGtCenAtDWt = gtCenAtDWt.toFixed(2);
    response.lblGtCenODCNos = String(gtCenODCNos);
    response.lblGtCenODCWt = gtCenODCWt.toFixed(2);
    response.lblGtCenODCAvg = gtCenODCNos > 0 ? (gtCenODCWt / gtCenODCNos).toFixed(2) : '0.00';
    response.lblGtCenTDCNos = String(gtCenTDCNos);
    response.lblGtCenTDCWt = gtCenTDCWt.toFixed(2);
    response.lblGtCenTDCAvg = gtCenTDCNos > 0 ? (gtCenTDCWt / gtCenTDCNos).toFixed(2) : '0.00';

    const gateHourly = await executeQuery(
      `SELECT SUM(M_GROSS - M_TARE - M_JOONA) AS FinWt, DATEPART(hour, M_TARE_DT) AS hou
       FROM PURCHASE
       WHERE CAST(M_DATE AS date) = @dbDate
         AND M_FACTORY = @factCode
         AND M_CENTRE IN (${gateIn})
       GROUP BY DATEPART(hour, M_TARE_DT)
       ORDER BY DATEPART(hour, M_TARE_DT)`,
      { dbDate, factCode: String(factCode) },
      season
    );
    const centerHourly = await executeQuery(
      `SELECT SUM(tt_grossweight - tt_tareweight - tt_joonaweight) AS FinWt, DATEPART(hour, TT_TARE_DT) AS hou
       FROM RECEIPT
       WHERE CAST(TT_DATE AS date) = @dbDate
         AND TT_FACTORY = @factCode
         AND TT_CENTER NOT IN (${gateIn})
         AND tt_tareweight > 0
       GROUP BY DATEPART(hour, TT_TARE_DT)
       ORDER BY DATEPART(hour, TT_TARE_DT)`,
      { dbDate, factCode: String(factCode) },
      season
    );
    response.Gatereport = gateHourly || [];
    response.Centerreport = centerHourly || [];

    const hourMap = new Map();
    gateHourly.forEach((r) => {
      hourMap.set(Number(r.hou), Number(r.FinWt || 0));
    });
    centerHourly.forEach((r) => {
      const h = Number(r.hou);
      hourMap.set(h, (hourMap.get(h) || 0) + Number(r.FinWt || 0));
    });

    const hourToLabel = {
      6: 'lbl6amto7am', 7: 'lbl7amto8am', 8: 'lbl8amto9am', 9: 'lbl9amto10am',
      10: 'lbl10amto11am', 11: 'lbl11amto12pm', 12: 'lbl12pmto1pm', 13: 'lbl1pmto2pm',
      14: 'lbl2pmto3pm', 15: 'lbl3pmto4pm', 16: 'lbl4pmto5pm', 17: 'lbl5pmto6pm',
      18: 'lbl6pmto7pm', 19: 'lbl7pmto8pm', 20: 'lbl8pmto9pm', 21: 'lbl9pmto10pm',
      22: 'lbl10pmto11pm', 23: 'lbl11pmto12pm', 0: 'lbl12amto1am', 1: 'lbl1amto2am',
      2: 'lbl2amto3am', 3: 'lbl3amto4am', 4: 'lbl4amto5am', 5: 'lbl5amto6am'
    };

    let shiftA = 0, shiftB = 0, shiftC = 0;
    hourMap.forEach((weight, hour) => {
      const label = hourToLabel[hour];
      if (label && response[label] !== undefined) {
        response[label] = Number(weight || 0).toFixed(2);
      }
      if (hour >= 6 && hour <= 13) shiftA += weight;
      else if (hour >= 14 && hour <= 21) shiftB += weight;
      else shiftC += weight;
    });
    response.lblAtotal = shiftA.toFixed(2);
    response.lblBtotal = shiftB.toFixed(2);
    response.lblCtotal = shiftC.toFixed(2);

    const cumulativeOrder = [
      'lbl6amto7am', 'lbl7amto8am', 'lbl8amto9am', 'lbl9amto10am', 'lbl10amto11am', 'lbl11amto12pm',
      'lbl12pmto1pm', 'lbl1pmto2pm', 'lbl2pmto3pm', 'lbl3pmto4pm', 'lbl4pmto5pm', 'lbl5pmto6pm',
      'lbl6pmto7pm', 'lbl7pmto8pm', 'lbl8pmto9pm', 'lbl9pmto10pm', 'lbl10pmto11pm', 'lbl11pmto12pm',
      'lbl12amto1am', 'lbl1amto2am', 'lbl2amto3am', 'lbl3amto4am', 'lbl4amto5am', 'lbl5amto6am'
    ];
    let running = 0;
    cumulativeOrder.forEach((label) => {
      running += Number(response[label] || 0);
      response[`${label}TWt`] = running.toFixed(2);
    });

    const sumRange = async (dateIso, startHour, endHour) => {
      const gateRows = await executeQuery(
        `SELECT ISNULL(SUM(M_GROSS - M_TARE - M_JOONA), 0) AS wt
         FROM PURCHASE
         WHERE CAST(M_DATE AS date) = @dateIso
           AND M_FACTORY = @factCode
           AND M_CENTRE IN (${gateIn})
           AND DATEPART(hour, M_TARE_DT) BETWEEN @startHour AND @endHour`,
        { dateIso, factCode: String(factCode), startHour, endHour },
        season
      );
      const centerRows = await executeQuery(
        `SELECT ISNULL(SUM(tt_grossweight - tt_tareweight - tt_joonaweight), 0) AS wt
         FROM RECEIPT
         WHERE CAST(TT_DATE AS date) = @dateIso
           AND TT_FACTORY = @factCode
           AND TT_CENTER NOT IN (${gateIn})
           AND tt_tareweight > 0
           AND DATEPART(hour, TT_TARE_DT) BETWEEN @startHour AND @endHour`,
        { dateIso, factCode: String(factCode), startHour, endHour },
        season
      );
      return Number(gateRows?.[0]?.wt || 0) + Number(centerRows?.[0]?.wt || 0);
    };

    const todayDayWt = await sumRange(dbDate, 6, 17);
    const todayNightWt = await sumRange(dbDate, 18, 23) + await sumRange(dbDate, 0, 5);
    response.lblToday6AMto6PMWT = todayDayWt.toFixed(2);
    response.lblToday6PMto6AMWT = todayNightWt.toFixed(2);
    response.lblToDToT = (todayDayWt + todayNightWt).toFixed(2);

    const yesterday = addDaysIso(dbDate, -1);
    const yDayWt = await sumRange(yesterday, 6, 17);
    const yNightWt = await sumRange(yesterday, 18, 23) + await sumRange(yesterday, 0, 5);
    response.lblYes6AMto6PMWT = yDayWt.toFixed(2);
    response.lblYes6PMto6AMWT = yNightWt.toFixed(2);
    response.lblYESToT = (yDayWt + yNightWt).toFixed(2);

    const centerOperated = await scalar(
      `SELECT COUNT(DISTINCT M_CENTRE) AS nos
       FROM PURCHASE
       WHERE CAST(M_DATE AS date) = @dbDate
         AND M_FACTORY = @factCode
         AND M_CENTRE NOT IN (${gateIn})`,
      { dbDate, factCode: String(factCode) }
    );
    response.lblopr = String(centerOperated.nos || '0');

    const centerPurchase = await scalar(
      `SELECT ISNULL(SUM(M_GROSS - M_TARE - M_JOONA), 0) AS wt
       FROM PURCHASE
       WHERE CAST(M_DATE AS date) = @dbDate
         AND M_FACTORY = @factCode
         AND M_CENTRE NOT IN (${gateIn})`,
      { dbDate, factCode: String(factCode) }
    );
    response.lblCenPur = Number(centerPurchase.wt || 0).toFixed(2);

    const truckDisp = await scalar(
      `SELECT ISNULL(COUNT(CH_CHALLAN), 0) AS nos
       FROM challan_final
       WHERE Ch_Cancel = 0
         AND CH_FACTORY = @factCode
         AND CAST(CH_DEP_DATE AS date) = @dbDate`,
      { dbDate, factCode: String(factCode) }
    );
    response.lblTruckDisp = String(truckDisp.nos || '0');

    const truckRecv = await scalar(
      `SELECT ISNULL(SUM(CASE WHEN CH_status > 0 THEN 1 ELSE 0 END), 0) AS nos
       FROM challan_final
       WHERE ch_Factory = @factCode
         AND CAST(Ch_dep_date AS date) = @dbDate`,
      { dbDate, factCode: String(factCode) }
    );
    response.lblTruckRecv = String(truckRecv.nos || '0');

    const avgCenter = cenTdcNos > 0 ? (cenTdcWt / cenTdcNos) : 0;
    const transitToday = await scalar(
      `SELECT ISNULL(COUNT(*), 0) AS nos
       FROM challan_final
       WHERE Ch_Cancel = 0
         AND CH_FACTORY = @factCode
         AND CAST(CH_DEP_DATE AS date) = @dbDate
         AND CH_STATUS = 0
         AND CH_Challan NOT IN (
           SELECT TT_CHLN FROM T_TOKEN WHERE TT_FACTORY = @factCode
           UNION
           SELECT tt_chalanNo FROM RECEIPT WHERE TT_FACTORY = @factCode
           UNION
           SELECT CL_CHALLAN FROM CHALLANLOCK WHERE cl_factory = @factCode
         )`,
      { dbDate, factCode: String(factCode) }
    );
    const transitTodayWt = Number(transitToday.nos || 0) * avgCenter;
    response.lblTRANSTODAY = `${transitToday.nos || 0}/${transitTodayWt.toFixed(2)}`;

    const transitYesterday = await scalar(
      `SELECT ISNULL(COUNT(*), 0) AS nos
       FROM challan_final
       WHERE Ch_Cancel = 0
         AND CH_FACTORY = @factCode
         AND CAST(CH_DEP_DATE AS date) <= @yDate
         AND CH_STATUS = 0
         AND CH_Challan NOT IN (
           SELECT TT_CHLN FROM T_TOKEN WHERE TT_FACTORY = @factCode
           UNION
           SELECT tt_chalanNo FROM RECEIPT WHERE TT_FACTORY = @factCode
           UNION
           SELECT CL_CHALLAN FROM CHALLANLOCK WHERE cl_factory = @factCode
         )`,
      { yDate: yesterday, factCode: String(factCode) }
    );
    const transitYesterdayWt = Number(transitYesterday.nos || 0) * avgCenter;
    response.lbltransitwtyesterday = `${transitYesterday.nos || 0}/${transitYesterdayWt.toFixed(2)}`;

    const ydWeight = Number(response.lblGtCenOYWt || 0)
      + Number(response.lblGtCenAtDWt || 0)
      + transitTodayWt
      + transitYesterdayWt;
    response.lblYDTWEIGHT = ydWeight.toFixed(2);
    response.lbltyarddobga = (Number(response.lblGtCenOYWt || 0) + Number(response.lblGtCenAtDWt || 0)).toFixed(2);

    const nowRow = await executeQuery('SELECT GETDATE() AS now', {}, season);
    const now = new Date(nowRow?.[0]?.now || Date.now());
    const shiftStart = String(shiftStartTime || '06:00:00').split(':');
    const shiftStartHour = Number(shiftStart[0] || 0);
    let totalMinutes = 0;
    if (Number.isFinite(shiftStartHour)) {
      const reportDateObj = new Date(`${dbDate}T00:00:00`);
      if (now.getHours() >= shiftStartHour && reportDateObj < new Date(now.toDateString())) {
        totalMinutes = 24 * 60;
      } else {
        let shiftDate = new Date(now);
        if (now.getHours() < shiftStartHour) {
          shiftDate.setDate(shiftDate.getDate() - 1);
        }
        shiftDate.setHours(shiftStartHour, 0, 0, 0);
        const diffMs = now.getTime() - shiftDate.getTime();
        totalMinutes = diffMs >= 24 * 60 * 60 * 1000 ? 24 * 60 : Math.max(0, Math.floor(diffMs / 60000));
      }
    }
    const shiftTotal = Number(response.lblAtotal || 0) + Number(response.lblBtotal || 0) + Number(response.lblCtotal || 0);
    const crushRate = totalMinutes > 0 ? (shiftTotal / totalMinutes) * 60 : 0;
    const expected = crushRate * 24;
    response.lblcrushrate = crushRate.toFixed(2);
    response.lblExp = expected.toFixed(2);
    const nhour = crushRate > 0 ? (Number(response.lblGtCenOYWt || 0) + Number(response.lblGtCenAtDWt || 0)) / crushRate : 0;
    response.lblNHour = Math.round(nhour).toString();

    crushingReportCache.set(cacheKey, { ts: Date.now(), data: response });
    console.log('[CrushingReport] timings(ms)', {
      total: Date.now() - startTime,
      factCode,
      dbDate
    });
    return response;
  } catch (error) {
    console.error('[getCrushingReportData Error]', error.message);
    throw error;
  }
}


// Analysis Data Function - must be defined BEFORE module.exports
const getAnalysisData = async (fCode, date, season) => {
  // Validate inputs
  if (!fCode || !date) {
    throw new Error('Factory code and date are required parameters');
  }

  try {
    // 1. Get dynamic Gate Code from SEASON table
    const gateResult = await executeQuery(
      `SELECT ISNULL(S_SGT_CD, '100') as GateCode FROM SEASON WHERE FACTORY = @fCode`,
      { fCode },
      season
    );
    const gateCode = gateResult[0]?.GateCode || '100';

    // 2. Get Hours
    const hours = await executeQuery('SELECT * FROM Mi_Hours ORDER BY SN ASC', {}, season);
    
    // 3. Main Data
    let tccrush = 0;
    let tjtank = 0;
    let twhtank = 0;
    let tsbag = 0;
    
    const mainRows = [];
    for (const row of hours) {
      const sncc = row.SNCC;
      const sn = row.SN;
      const disHou = row.DIS_HOU;

      // Get Cane Crush for this hour (using dynamic gateCode)
      const crushQuery = `
        SELECT ISNULL(SUM(FinWt), 0) as FinWt FROM (
          SELECT SUM(CAST(M_GROSS-M_TARE-M_JOONA as decimal(18,2))) as FinWt 
          FROM PURCHASE 
          WHERE CAST(M_DATE as Date) = @date AND M_FACTORY = @fCode AND M_CENTRE = @gateCode AND DATEPART(hour, ISNULL(M_TARE_DT, M_DATE)) = @sncc
          UNION ALL 
          SELECT SUM(CAST(TT_GROSSWEIGHT-TT_TAREWEIGHT-TT_JOONAWEIGHT as decimal(18,2))) as FinWt 
          FROM RECEIPT  
          WHERE CAST(TT_DATE as Date) = @date AND TT_FACTORY = @fCode AND TT_CENTER != @gateCode AND TT_TAREWEIGHT > 0 AND DATEPART(hour, ISNULL(TT_TARE_DT, TT_DATE)) = @sncc
        ) Temp`;
      
      const crushResult = await executeQuery(crushQuery, { date, fCode, sncc, gateCode }, season);
      const finWt = Number(crushResult[0]?.FinWt || 0);
      
      // Get Lab Hour Data
      let labQuery = '';
      if (fCode !== '50') {
        labQuery = `
          SELECT Time, CAST(ISNULL(Col2, 0) as numeric(18,0)) as Juice, ADD_WATER, 
          ISNULL(L_31,0)+ISNULL(L_30,0)+ISNULL(L_29,0)+ISNULL(M_31,0)+ISNULL(M_30,0)+ISNULL(M_29,0)+ISNULL(S_31,0)+ISNULL(S_30,0)+ISNULL(S_29,0) as SugarBags
          FROM LAB_HOUR 
          WHERE FACTORY = @fCode AND CAST(H_DATE as Date) = @date AND TIME = @sn`;
      } else {
        labQuery = `
          SELECT Time, SUM(CAST(ISNULL(Col2, 0) as numeric(18,0))) as Juice, SUM(ADD_WATER) as ADD_WATER,
          SUM(ISNULL(L_31,0)+ISNULL(L_30,0)+ISNULL(L_29,0)+ISNULL(M_31,0)+ISNULL(M_30,0)+ISNULL(M_29,0)+ISNULL(S_31,0)+ISNULL(S_30,0)+ISNULL(S_29,0)) as SugarBags
          FROM LAB_HOUR 
          WHERE FACTORY = @fCode AND CAST(H_DATE as Date) = @date AND TIME = @sn 
          GROUP BY TIME`;
      }
      
      const labResult = await executeQuery(labQuery, { fCode, date, sn }, season);
      const lab = labResult[0] || { Juice: 0, ADD_WATER: 0, SugarBags: 0 };

      // Accumulate totals for calculating running percentages
      tccrush += finWt;
      tjtank += Number(lab.Juice);
      twhtank += Number(lab.ADD_WATER);
      tsbag += Number(lab.SugarBags);

      // Calculate Percentages (Multiplied by 10 and 100 as per legacy logic)
      let juicePct = 0;
      let waterPct = 0;
      let bagrecPct = 0;
      let dmf = 0;

      if (tjtank > 0 && tccrush > 0) juicePct = Number(((tjtank * 10) / tccrush * 100).toFixed(2));
      if (twhtank > 0 && tccrush > 0) waterPct = Number(((twhtank * 10) / tccrush * 100).toFixed(2));
      if (tsbag > 0 && tccrush > 0) bagrecPct = Number(((tsbag / tccrush) * 100).toFixed(2));
      if (juicePct > 0 && waterPct > 0) dmf = Number((juicePct - (juicePct * 0.4 / 100) - waterPct).toFixed(2));

      mainRows.push({
        time: disHou,
        caneCrush: Number(finWt.toFixed(2)),
        juiceInTon: Number(Number(lab.Juice).toFixed(2)),
        juicePct: juicePct,
        waterInTon: Number(Number(lab.ADD_WATER).toFixed(2)),
        waterPct: waterPct,
        dmf: dmf,
        sugarBags: Number(Number(lab.SugarBags).toFixed(2)),
        baggingRecoveryPct: bagrecPct
      });
    }

    // 4. Analysis Data (Juice)
    const juiceTimesQuery = `
      SELECT DISTINCT h.SN, h.Hours as TIME1 
      FROM LAB_DAILY lab 
      JOIN MI_Hours h ON h.SN = lab.TIME1 
      WHERE lab.FACTORY = @fCode AND CAST(lab.DDATE as Date) = @date 
      ORDER BY h.SN ASC`;
    const juiceTimes = await executeQuery(juiceTimesQuery, { fCode, date }, season);
    
    const analysisRows = [];
    let sums = { pj_bx: 0, cpj_bx: 0, pj_pol: 0, cpj_pol: 0, pj_py: 0, cpj_py: 0, mj_bx: 0, cmj_bx: 0, mj_pol: 0, cmj_pol: 0, mj_py: 0, cmj_py: 0, lmj_bx: 0, clmj_bx: 0 };

    for (const t of juiceTimes) {
      const millsQuery = `SELECT MILL_NO FROM LAB_DAILY WHERE FACTORY = @fCode AND CAST(DDATE as Date) = @date AND TIME1 = @sn`;
      const mills = await executeQuery(millsQuery, { fCode, date, sn: t.SN }, season);
      
      let juiceData = [];
      if (mills.length === 1) {
        juiceData = await executeQuery(`
          SELECT PJ_BX, PJ_POL, PJ_PY, MJ_BX, MJ_POL, MJ_PY, LMJ_BX 
          FROM LAB_DAILY lab 
          JOIN MI_Hours h ON h.SN = lab.TIME1 
          WHERE lab.FACTORY = @fCode AND CAST(lab.DDATE as Date) = @date AND h.SN = @sn`, { fCode, date, sn: t.SN }, season);
      } else {
        juiceData = await executeQuery(`
          SELECT SUM(PJ_BX) as PJ_BX, SUM(PJ_POL) as PJ_POL, SUM(PJ_PY) as PJ_PY, 
                 SUM(MJ_BX) as MJ_BX, SUM(MJ_POL) as MJ_POL, SUM(MJ_PY) as MJ_PY, SUM(LMJ_BX) as LMJ_BX 
          FROM (
            SELECT
              CASE WHEN MILL_NO=1 THEN PJ_BX*0.6 WHEN MILL_NO=2 THEN PJ_BX*0.4 ELSE 0 END as PJ_BX,
              CASE WHEN MILL_NO=1 THEN PJ_POL*0.6 WHEN MILL_NO=2 THEN PJ_POL*0.4 ELSE 0 END as PJ_POL,
              CASE WHEN MILL_NO=1 THEN PJ_PY*0.6 WHEN MILL_NO=2 THEN PJ_PY*0.4 ELSE 0 END as PJ_PY,
              CASE WHEN MILL_NO=1 THEN MJ_BX*0.6 WHEN MILL_NO=2 THEN MJ_BX*0.4 ELSE 0 END as MJ_BX,
              CASE WHEN MILL_NO=1 THEN MJ_POL*0.6 WHEN MILL_NO=2 THEN MJ_POL*0.4 ELSE 0 END as MJ_POL,
              CASE WHEN MILL_NO=1 THEN MJ_PY*0.6 WHEN MILL_NO=2 THEN MJ_PY*0.4 ELSE 0 END as MJ_PY,
              CASE WHEN MILL_NO=1 THEN LMJ_BX*0.6 WHEN MILL_NO=2 THEN LMJ_BX*0.4 ELSE 0 END as LMJ_BX 
            FROM LAB_DAILY 
            WHERE FACTORY = @fCode AND CAST(DDATE as Date) = @date AND TIME1 = @sn
          ) as Temp`, { fCode, date, sn: t.SN }, season);
      }
      
      if (juiceData.length > 0) {
        const d = juiceData[0];
        const row = {
          time: t.TIME1,
          primaryBrix: Number(Number(d.PJ_BX).toFixed(2)),
          primaryPol: Number(Number(d.PJ_POL).toFixed(2)),
          primaryPurity: Number(Number(d.PJ_PY).toFixed(2)),
          mixBrix: Number(Number(d.MJ_BX).toFixed(2)),
          mixPol: Number(Number(d.MJ_POL).toFixed(2)),
          mixPurity: Number(Number(d.MJ_PY).toFixed(2)),
          brixMl: Number(Number(d.LMJ_BX).toFixed(2))
        };
        analysisRows.push(row);

        // Accumulate for AVG row
        if (row.primaryBrix > 0) { sums.pj_bx += row.primaryBrix; sums.cpj_bx++; }
        if (row.primaryPol > 0) { sums.pj_pol += row.primaryPol; sums.cpj_pol++; }
        if (row.primaryPurity > 0) { sums.pj_py += row.primaryPurity; sums.cpj_py++; }
        if (row.mixBrix > 0) { sums.mj_bx += row.mixBrix; sums.cmj_bx++; }
        if (row.mixPol > 0) { sums.mj_pol += row.mixPol; sums.cmj_pol++; }
        if (row.mixPurity > 0) { sums.mj_py += row.mixPurity; sums.cmj_py++; }
        if (row.brixMl > 0) { sums.lmj_bx += row.brixMl; sums.clmj_bx++; }
      }
    }

    // Add AVG row to analysisRows
    if (analysisRows.length > 0) {
      analysisRows.push({
        time: 'AVG.',
        primaryBrix: sums.cpj_bx > 0 ? Number((sums.pj_bx / sums.cpj_bx).toFixed(2)) : 0,
        primaryPol: sums.cpj_pol > 0 ? Number((sums.pj_pol / sums.cpj_pol).toFixed(2)) : 0,
        primaryPurity: sums.cpj_py > 0 ? Number((sums.pj_py / sums.cpj_py).toFixed(2)) : 0,
        mixBrix: sums.cmj_bx > 0 ? Number((sums.mj_bx / sums.cmj_bx).toFixed(2)) : 0,
        mixPol: sums.cmj_pol > 0 ? Number((sums.mj_pol / sums.cmj_pol).toFixed(2)) : 0,
        mixPurity: sums.cmj_py > 0 ? Number((sums.mj_py / sums.cmj_py).toFixed(2)) : 0,
        brixMl: sums.clmj_bx > 0 ? Number((sums.lmj_bx / sums.clmj_bx).toFixed(2)) : 0
      });
    }

    // 5. Bagasse Data
    const bagasseRowsRaw = [];
    for (const t of juiceTimes) {
      const millsQuery = `SELECT MILL_NO FROM LAB_DAILY WHERE FACTORY = @fCode AND CAST(DDATE as Date) = @date AND TIME1 = @sn`;
      const mills = await executeQuery(millsQuery, { fCode, date, sn: t.SN }, season);
      let bData = [];
      if (mills.length === 1) {
        bData = await executeQuery(`
          SELECT B_POL, B_MOIS FROM LAB_DAILY 
          WHERE FACTORY = @fCode AND CAST(DDATE as Date) = @date AND TIME1 = @sn`, { fCode, date, sn: t.SN }, season);
      } else {
        bData = await executeQuery(`
          SELECT SUM(B_POL) as B_POL, SUM(B_MOIS) as B_MOIS 
          FROM (
            SELECT 
              CASE WHEN MILL_NO='1' THEN B_POL*0.6 WHEN MILL_NO='2' THEN B_POL*0.4 ELSE 0 END as B_POL,
              CASE WHEN MILL_NO='1' THEN B_MOIS*0.6 WHEN MILL_NO='2' THEN B_MOIS*0.4 ELSE 0 END as B_MOIS 
            FROM LAB_DAILY 
            WHERE PJ_BX > 0 AND FACTORY = @fCode AND CAST(DDATE as Date) = @date AND TIME1 = @sn
          ) as Bags`, { fCode, date, sn: t.SN }, season);
      }
      
      if (bData.length > 0 && Number(bData[0].B_POL) > 0) {
        bagasseRowsRaw.push({
          time: t.TIME1,
          pol: Number(Number(bData[0].B_POL).toFixed(2)),
          mois: Number(Number(bData[0].B_MOIS).toFixed(2))
        });
      }
    }

    // 6. Final Molasses
    const molassesResult = await executeQuery(`
        SELECT h.Hours as Time, FM_BX, FM_POL, FM_PY, 
        ISNULL((SELECT SUM(SS_BX) FROM LAB_DAILY WHERE FACTORY = lab.FACTORY AND TIME1 = lab.TIME AND DDATE = lab.DDATE), 0) as SS_BX 
        FROM LAB_ABC_HEAVY lab 
        JOIN MI_Hours h ON h.SN = lab.TIME 
        WHERE lab.FACTORY = @fCode AND CAST(lab.DDATE as Date) = @date 
        ORDER BY h.SN ASC`, { fCode, date }, season);

    const molassesRows = molassesResult.filter(r => Number(r.FM_BX) > 0).map(r => ({
      time: r.Time,
      brix: Number(Number(r.FM_BX).toFixed(2)),
      pol: Number(Number(r.FM_POL).toFixed(2)),
      purity: Number(Number(r.FM_PY).toFixed(2)),
      quadBrix: Number(Number(r.SS_BX).toFixed(2))
    }));

    return [mainRows, analysisRows, bagasseRowsRaw, molassesRows];
  } catch (error) {
    console.error('Error in getAnalysisData:', error);
    throw new Error(`Failed to retrieve analysis data: ${error.message}`);
  }
};

module.exports = {
  runProcedure,
  getCentreCode,
  getDiseaseList,
  getSummaryReportUnitWise,
  getLatestCrushingDate,
  getTruckDispatchWeighedData,
  getCrushingReportData,
  getAnalysisData
};
