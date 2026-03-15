const { executeQuery, executeProcedure } = require('../core/db/query-executor');

async function runProcedure(name, params, season) {
  const result = await executeProcedure(name, params, season);
  return result.rows || [];
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

// Get crushing report data for factory on given date
async function getCrushingReportData(params, season) {
  const { factCode, date } = params;

  try {
    // Parse date from DD/MM/YYYY format to YYYY-MM-DD for database
    let dbDate = date;
    if (date && date.includes('/')) {
      const parts = date.split('/');
      if (parts.length === 3) {
        dbDate = `${parts[2]}-${parts[1]}-${parts[0]}`;
      }
    }

    console.log(`[getCrushingReportData] Factory: ${factCode}, Date: ${dbDate}`);

    // Diagnostic: Check what data exists in PURCHASE table
    const purchaseCheck = await executeQuery(
      `SELECT COUNT(*) as total, COUNT(DISTINCT M_MODE) as modes FROM PURCHASE WHERE CAST(M_DATE AS date) = @dbDate AND M_FACTORY = @factCode`,
      { factCode: String(factCode), dbDate },
      season
    );
    console.log(`[getCrushingReportData] PURCHASE check: ${JSON.stringify(purchaseCheck)}`);

    // Get GATECODE from SEASON table (matching .NET GETSEASONGATECODE)
    const gateResult = await executeQuery(
      `SELECT TOP 1 ISNULL(S_SGT_CD, '1') as S_SGT_CD FROM SEASON WHERE FACTORY = @factCode`,
      { factCode: String(factCode) },
      season
    );
    const gateCode = gateResult[0]?.S_SGT_CD || '1';
    console.log(`[getCrushingReportData] Gate Code: ${gateCode}`);

    // 1. Initial response template
    const response = {
      dtpDate: date,
      FACTCODE: factCode,
      lblcrop: '0'
    };

    // Initialize all vehicle modes to zero
    const keys = ['Cart', 'Trolly40', 'Trolly60', 'Truck'];
    keys.forEach(key => {
      // OY (Yard Count)
      response[`lbl${key}OYNos`] = '0'; 
      response[`lbl${key}OYWt`] = '0.00';
      // AtD (At Donga Count)
      response[`lbl${key}AtDNos`] = '0'; 
      response[`lbl${key}AtDWt`] = '0.00';
      // ODC (On-Date Crushing)
      response[`lbl${key}ODCNos`] = '0'; 
      response[`lbl${key}ODCWt`] = '0.00'; 
      response[`lbl${key}ODCAvg`] = '0.00';
      // TDC (To-Date Crushing)
      response[`lbl${key}TDCNos`] = '0'; 
      response[`lbl${key}TDCWt`] = '0.00'; 
      response[`lbl${key}TDCAvg`] = '0.00';
    });

    // Initialize gate/center totals
    ['OYNos', 'OYWt', 'AtDNos', 'AtDWt', 'ODCNos', 'ODCWt', 'ODCAvg', 'TDCNos', 'TDCWt', 'TDCAvg'].forEach(suffix => {
      response[`lblGate${suffix}`] = suffix.endsWith('Nos') ? '0' : '0.00';
      response[`lblCenter${suffix}`] = suffix.endsWith('Nos') ? '0' : '0.00';
      response[`lblGtCen${suffix}`] = suffix.endsWith('Nos') ? '0' : '0.00';
    });

    // Initialize hourly shift data (Shift A: 6-13, Shift B: 14-21, Shift C: 22-6)
    const hours = [6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23,0,1,2,3,4,5];
    const hourLabels = ['6amto7am','7amto8am','8amto9am','9amto10am','10amto11am','11amto12pm','12pmto1pm','1pmto2pm',
                        '2pmto3pm','3pmto4pm','4pmto5pm','5pmto6pm','6pmto7pm','7pmto8pm','8pmto9pm','9pmto10pm',
                        '10pmto11pm','11pmto12am','12amto1am','1amto2am','2amto3am','3amto4am','4amto5am','5amto6am'];
    
    hourLabels.forEach(label => {
      response[`lbl${label}Wt`] = '0.00';
    });

    // Shift totals
    response.lblAtotal = '0.00';
    response.lblBtotal = '0.00';
    response.lblCtotal = '0.00';

    // 2. Fetch ODC Data (On Date Crushing) - Start with Mode table to get all modes
    const modeCheck = await executeQuery(
      `SELECT md_groupcode, md_name, MD_CODE FROM Mode WHERE MD_FACTORY = @factCode AND md_groupcode IN (1,2,3,4)`,
      { factCode: String(factCode) },
      season
    );
    console.log(`[getCrushingReportData] Mode check: ${JSON.stringify(modeCheck)}`);
    
    // Build map of groupcode to mode codes for faster lookup
    const modeCodeMap = {};
    (modeCheck || []).forEach(m => {
      if (!modeCodeMap[m.md_groupcode]) modeCodeMap[m.md_groupcode] = [];
      modeCodeMap[m.md_groupcode].push(m.MD_CODE);
    });
    console.log(`[getCrushingReportData] Mode code map: ${JSON.stringify(modeCodeMap)}`);
    
    const odcResult = await executeQuery(
      `SELECT
        m.md_groupcode AS ModeGroup,
        m.md_name AS ModeName,
        ISNULL(COUNT(p.M_IND_NO), 0) AS VehicleCount,
        ISNULL(SUM(CAST(p.M_GROSS AS DECIMAL(18,2)) - CAST(p.M_TARE AS DECIMAL(18,2)) - ISNULL(CAST(p.M_JOONA AS DECIMAL(18,2)), 0)), 0) AS TotalWeight
      FROM Mode m
      LEFT OUTER JOIN PURCHASE p 
        ON m.MD_CODE = p.M_MODE 
        AND m.MD_FACTORY = p.M_FACTORY
        AND CAST(p.M_DATE AS date) = @dbDate
        AND CAST(p.M_FACTORY AS varchar(20)) = @factCode
      WHERE m.MD_FACTORY = @factCode
        AND m.md_groupcode IN (1, 2, 3, 4)
      GROUP BY m.md_groupcode, m.md_name`,
      { factCode: String(factCode), dbDate },
      season
    );
    
    console.log(`[getCrushingReportData] ODC Result: ${JSON.stringify(odcResult)}`);

    // 3. Helper to update mode data
    for (const row of (odcResult || [])) {
      if (row.ModeGroup === null || row.ModeGroup === undefined) continue;
      console.log(`[getCrushingReportData] Processing mode: ${row.ModeName} (Group: ${row.ModeGroup}), Count: ${row.VehicleCount}, Weight: ${row.TotalWeight}`);
      const typeKey = row.ModeGroup === 1 ? 'Cart' : row.ModeGroup === 2 ? 'Trolly40' : row.ModeGroup === 3 ? 'Trolly60' : 'Truck';
      
      const nos = row.VehicleCount || 0;
      const wt = row.TotalWeight || 0;
      const avg = nos > 0 ? (wt / nos) : 0;

      console.log(`[getCrushingReportData] Setting ${typeKey}: nos=${nos}, wt=${wt}, avg=${avg}`);
      
      response[`lbl${typeKey}ODCNos`] = String(nos);
      response[`lbl${typeKey}ODCWt`] = wt.toFixed(2);
      response[`lbl${typeKey}ODCAvg`] = avg.toFixed(2);

      // Yard Count (OYNos) - All purchases with no counter assignment for this mode group
      const modeCodesStr = (modeCodeMap[row.ModeGroup] || []).map(c => `'${c}'`).join(',') || "'NONE'";
      const oyRes = await executeQuery(
        `SELECT COUNT(*) as nos FROM PURCHASE 
         WHERE CAST(M_DATE AS date) = @dbDate 
           AND M_FACTORY = @factCode 
           AND M_MODE IN (${modeCodesStr})
           AND M_CounterNo IS NULL`,
        { dbDate, factCode: String(factCode) }, 
        season
      );
      const oyNos = oyRes?.[0]?.nos || 0;
      response[`lbl${typeKey}OYNos`] = String(oyNos);
      response[`lbl${typeKey}OYWt`] = (oyNos * avg).toFixed(2);

      // Donga Count (AtDNos) - Purchases at donga for this mode group
      const atdRes = await executeQuery(
        `SELECT COUNT(*) as nos FROM PURCHASE 
         WHERE CAST(M_DATE AS date) = @dbDate 
           AND M_FACTORY = @factCode 
           AND M_MODE IN (${modeCodesStr})
           AND M_CounterNo IS NOT NULL 
           AND M_TARE_TM IS NULL`,
        { dbDate, factCode: String(factCode) }, 
        season
      );
      const atdNos = atdRes?.[0]?.nos || 0;
      response[`lbl${typeKey}AtDNos`] = String(atdNos);
      response[`lbl${typeKey}AtDWt`] = (atdNos * avg).toFixed(2);

      // To-Date Count (TDCNos) - All crushings of this mode up to date
      const tdcRes = await executeQuery(
        `SELECT COUNT(M_IND_NO) as nos, SUM(CAST(M_GROSS AS DECIMAL(18,2)) - CAST(M_TARE AS DECIMAL(18,2)) - ISNULL(CAST(M_JOONA AS DECIMAL(18,2)), 0)) as wt
         FROM PURCHASE 
         WHERE M_MODE IN (${modeCodesStr})
           AND M_FACTORY = @factCode 
           AND CAST(M_DATE AS date) <= @dbDate`,
        { factCode: String(factCode), dbDate }, 
        season
      );
      const tdcNos = tdcRes?.[0]?.nos || 0;
      const tdcWt = tdcRes?.[0]?.wt || 0;
      response[`lbl${typeKey}TDCNos`] = String(tdcNos);
      response[`lbl${typeKey}TDCWt`] = tdcWt.toFixed(2);
      response[`lbl${typeKey}TDCAvg`] = tdcNos > 0 ? (tdcWt / tdcNos).toFixed(2) : '0.00';
    }

    // 4. Totals (Gate)
    let gateOYNos = 0, gateOYWt = 0, gateAtDNos = 0, gateAtDWt = 0;
    let gateODCNos = 0, gateODCWt = 0, gateTDCNos = 0, gateTDCWt = 0;
    
    keys.forEach(k => {
      gateOYNos += Number(response[`lbl${k}OYNos`]) || 0;
      gateOYWt += Number(response[`lbl${k}OYWt`]) || 0;
      gateAtDNos += Number(response[`lbl${k}AtDNos`]) || 0;
      gateAtDWt += Number(response[`lbl${k}AtDWt`]) || 0;
      gateODCNos += Number(response[`lbl${k}ODCNos`]) || 0;
      gateODCWt += Number(response[`lbl${k}ODCWt`]) || 0;
      gateTDCNos += Number(response[`lbl${k}TDCNos`]) || 0;
      gateTDCWt += Number(response[`lbl${k}TDCWt`]) || 0;
    });
    
    response.lblGateOYNos = String(gateOYNos);
    response.lblGateOYWt = gateOYWt.toFixed(2);
    response.lblGateAtDNos = String(gateAtDNos);
    response.lblGateAtDWt = gateAtDWt.toFixed(2);
    response.lblGateODCNos = String(gateODCNos);
    response.lblGateODCWt = gateODCWt.toFixed(2);
    response.lblGateTDCNos = String(gateTDCNos);
    response.lblGateTDCWt = gateTDCWt.toFixed(2);
    
    response.lblGateODCAvg = gateODCNos > 0 ? (gateODCWt / gateODCNos).toFixed(2) : '0.00';
    response.lblGateTDCAvg = gateTDCNos > 0 ? (gateTDCWt / gateTDCNos).toFixed(2) : '0.00';
    
    console.log(`[getCrushingReportData] Gate Totals - OY: ${gateOYNos}/${gateOYWt}, AtD: ${gateAtDNos}/${gateAtDWt}, ODC: ${gateODCNos}/${gateODCWt}, TDC: ${gateTDCNos}/${gateTDCWt}`);

    // 5. Center Data - Initialize OY and AtD as 0 (centers don't track these separately)
    response.lblCenterOYNos = '0';
    response.lblCenterOYWt = '0.00';
    response.lblCenterAtDNos = '0';
    response.lblCenterAtDWt = '0.00';
    
    const cenOdc = await executeQuery(
      `SELECT ISNULL(COUNT(*), 0) as nos, ISNULL(SUM(tt_netweight), 0) as wt 
       FROM RECEIPT 
       WHERE TT_FACTORY=@factCode 
         AND CAST(tt_Date AS date)=@dbDate
         AND tt_netweight > 0`,
      { factCode: String(factCode), dbDate },
      season
    );
    console.log(`[getCrushingReportData] Center ODC Result: ${JSON.stringify(cenOdc)}`);
    
    const cenTdc = await executeQuery(
      `SELECT ISNULL(COUNT(*), 0) as nos, ISNULL(SUM(tt_netweight), 0) as wt 
       FROM RECEIPT 
       WHERE TT_FACTORY=@factCode 
         AND CAST(tt_Date AS date)<=@dbDate
         AND tt_netweight > 0`,
      { factCode: String(factCode), dbDate },
      season
    );
    console.log(`[getCrushingReportData] Center TDC Result: ${JSON.stringify(cenTdc)}`);
    
    const cenOdcNos = (cenOdc?.[0]?.nos || 0);
    const cenOdcWt = Number(cenOdc?.[0]?.wt || 0);
    const cenTdcNos = (cenTdc?.[0]?.nos || 0);
    const cenTdcWt = Number(cenTdc?.[0]?.wt || 0);
    
    response.lblCenterODCNos = String(cenOdcNos);
    response.lblCenterODCWt = cenOdcWt.toFixed(2);
    response.lblCenterODCAvg = cenOdcNos > 0 ? (cenOdcWt / cenOdcNos).toFixed(2) : '0.00';
    response.lblCenterTDCNos = String(cenTdcNos);
    response.lblCenterTDCWt = cenTdcWt.toFixed(2);
    response.lblCenterTDCAvg = cenTdcNos > 0 ? (cenTdcWt / cenTdcNos).toFixed(2) : '0.00';
    
    console.log(`[getCrushingReportData] Center Totals - ODC: ${cenOdcNos}/${cenOdcWt}, TDC: ${cenTdcNos}/${cenTdcWt}`);

    // 6. GtCen Combined (Gate + Center totals)
    const gtCenOYNos = gateOYNos + 0;  // Centers don't have OY
    const gtCenOYWt = gateOYWt + 0;
    const gtCenAtDNos = gateAtDNos + 0;  // Centers don't have AtD
    const gtCenAtDWt = gateAtDWt + 0;
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
    
    console.log(`[getCrushingReportData] GtCen Combined - OY: ${gtCenOYNos}/${gtCenOYWt}, AtD: ${gtCenAtDNos}/${gtCenAtDWt}, ODC: ${gtCenODCNos}/${gtCenODCWt}, TDC: ${gtCenTDCNos}/${gtCenTDCWt}`);

    // 7. Hourly Reports (matching C# model properties) - Execute as SQL queries, not stored procedures
    response.Gatereport = [];
    response.Centerreport = [];

    try {
      const gateHourlyQuery = `
        SELECT 
          SUM(CAST(M_GROSS - M_TARE - M_JOONA AS DECIMAL(18,2))) as FinWt,
          DATEPART(hour, M_TARE_DT) as hou
        FROM PURCHASE 
        WHERE CAST(M_DATE AS date) = @dbDate 
          AND M_FACTORY = @factCode 
          AND M_CENTRE = @gateCode
        GROUP BY DATEPART(hour, M_TARE_DT)
        ORDER BY DATEPART(hour, M_TARE_DT)`;
      
      const gateHourly = await executeQuery(gateHourlyQuery, { dbDate, factCode: String(factCode), gateCode }, season);
      response.Gatereport = gateHourly || [];

      // Populate hourly shift data and calculate shift totals
      if (gateHourly && gateHourly.length > 0) {
        let shiftAtotal = 0, shiftBtotal = 0, shiftCtotal = 0;
        
        for (const row of gateHourly) {
          const hour = row.hou || 0;
          const weight = Number(row.FinWt || 0);
          
          // Map hour to shift label
          let shiftLabel = '';
          if (hour >= 6 && hour <= 13) {
            shiftLabel = `lbl${hour === 13 ? '1pmto2pm' : (hour - 6 === 0 ? '6amto7am' : ``)}`;
            if (hour === 6) shiftLabel = 'lbl6amto7am';
            else if (hour === 7) shiftLabel = 'lbl7amto8am';
            else if (hour === 8) shiftLabel = 'lbl8amto9am';
            else if (hour === 9) shiftLabel = 'lbl9amto10am';
            else if (hour === 10) shiftLabel = 'lbl10amto11am';
            else if (hour === 11) shiftLabel = 'lbl11amto12pm';
            else if (hour === 12) shiftLabel = 'lbl12pmto1pm';
            else if (hour === 13) shiftLabel = 'lbl1pmto2pm';
            shiftAtotal += weight;
          } else if (hour >= 14 && hour <= 21) {
            if (hour === 14) shiftLabel = 'lbl2pmto3pm';
            else if (hour === 15) shiftLabel = 'lbl3pmto4pm';
            else if (hour === 16) shiftLabel = 'lbl4pmto5pm';
            else if (hour === 17) shiftLabel = 'lbl5pmto6pm';
            else if (hour === 18) shiftLabel = 'lbl6pmto7pm';
            else if (hour === 19) shiftLabel = 'lbl7pmto8pm';
            else if (hour === 20) shiftLabel = 'lbl8pmto9pm';
            else if (hour === 21) shiftLabel = 'lbl9pmto10pm';
            shiftBtotal += weight;
          } else if (hour >= 22 || hour <= 5) {
            if (hour === 22) shiftLabel = 'lbl10pmto11pm';
            else if (hour === 23) shiftLabel = 'lbl11pmto12am';
            else if (hour === 0) shiftLabel = 'lbl12amto1am';
            else if (hour === 1) shiftLabel = 'lbl1amto2am';
            else if (hour === 2) shiftLabel = 'lbl2amto3am';
            else if (hour === 3) shiftLabel = 'lbl3amto4am';
            else if (hour === 4) shiftLabel = 'lbl4amto5am';
            else if (hour === 5) shiftLabel = 'lbl5amto6am';
            shiftCtotal += weight;
          }
          
          if (shiftLabel && response[shiftLabel] !== undefined) {
            response[shiftLabel] = weight.toFixed(2);
          }
        }
        
        response.lblAtotal = shiftAtotal.toFixed(2);
        response.lblBtotal = shiftBtotal.toFixed(2);
        response.lblCtotal = shiftCtotal.toFixed(2);
      }
    } catch (error) {
      console.warn(`[getCrushingReportData] Gate hourly query failed: ${error.message}`);
      response.Gatereport = [];
    }

    try {
      const centerHourlyQuery = `
        SELECT 
          SUM(CAST(tt_grossweight - tt_tareweight - tt_joonaweight AS DECIMAL(18,2))) as FinWt,
          DATEPART(hour, TT_TARE_DT) as hou
        FROM RECEIPT 
        WHERE CAST(TT_DATE AS date) = @dbDate 
          AND TT_FACTORY = @factCode 
          AND TT_CENTER != @gateCode
          AND tt_tareweight > 0
        GROUP BY DATEPART(hour, TT_TARE_DT)
        ORDER BY DATEPART(hour, TT_TARE_DT)`;
      
      const centerHourly = await executeQuery(centerHourlyQuery, { dbDate, factCode: String(factCode), gateCode }, season);
      response.Centerreport = centerHourly || [];
    } catch (error) {
      console.warn(`[getCrushingReportData] Center hourly query failed: ${error.message}`);
      response.Centerreport = [];
    }

    console.log(`[getCrushingReportData] Success. Returning complete data.`);
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
  getCrushingReportData,
  getAnalysisData
};
