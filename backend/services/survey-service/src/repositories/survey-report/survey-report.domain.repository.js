const { executeProcedure, executeQuery, executeScalar } = require('../../core/db/query-executor');

async function getFactoryWiseCaneAreaReport({ procedure, params, season }) {
  return executeProcedure(procedure, params, season);
}

async function executeSurveyReportProcedure({ action, params, season }) {
  return executeProcedure(action, params, season);
}

async function hasDbObject({ name, season }) {
  const rows = await executeQuery(
    `SELECT type
     FROM sys.objects
     WHERE name = @name`,
    { name },
    season
  );
  return rows?.[0]?.type || '';
}

async function executeIfExists({ action, params, season }) {
  const type = await hasDbObject({ name: action, season });
  if (!type) return { rows: [], recordsets: [] };
  return executeProcedure(action, params, season);
}

async function getPlotWiseDetails({ params, season }) {
  return executeProcedure('Sp_PlotWiseDetails', params, season);
}

async function getCategoryWiseSummary({ params, season }) {
  return executeProcedure('Sp_CategoryWiseSummary', params, season);
}

async function getCaneVierityVillageGrower({ params, season }) {
  return executeProcedure('Sp_VrGrCnTyChange', params, season);
}

async function getFinalVillageFirstSurveyReport({ params, season }) {
  return executeIfExists({ action: params?.procedure, params: params?.queryParams || {}, season });
}

async function getFinalVillageFirstSurveySummeryReport({ params, season }) {
  return executeIfExists({ action: params?.procedure, params: params?.queryParams || {}, season });
}

async function getFinalVillageList({ fCode, season }) {
  return executeQuery(
    `SELECT Factory AS fact, VillCode AS gh_plvill, IsSurveyComp
     FROM SupervisorVillageMapping
     WHERE Factory = @fact
       AND IsSurveyComp = 1`,
    { fact: fCode },
    season
  );
}

async function getWeeklySubmissionOfAutumnPlantingIndent({ params, season }) {
  return executeQuery(
    `SELECT TOP 10
       pl.gh_category,
       MIF.F_Zone,
       CONVERT(nvarchar, pl.gh_pl_dt, 105) AS gh_pl_dt,
       v.V_Zone,
       z.Z_NAME,
       z.Z_HName,
       v.v_block,
       b.bl_name,
       v.v_circle,
       v.v_circle_Name,
       pl.gh_grow AS Growercode,
       gr.g_name,
       gr.g_father,
       gh_intercropcd AS ReportPiriad,
       gh_showingmethod AS methedplantation,
       sh.sm_Name,
       gh_seedsourcecd AS seedself,
       CASE WHEN vr.vr_Cane_Type = '1' THEN 'Early' WHEN vr.vr_Cane_Type = '2' THEN 'Genrerel' ELSE 'Reject' END AS vr_Cane_Type,
       pl.gh_vrcd AS varietycode,
       vr.vr_name,
       CONVERT(nvarchar, pl.gh_pl_dt, 105) AS plantingDt,
       cr.Cr_Name,
       CONVERT(nvarchar, pl.gh_ent_date, 105) AS gh_ent_date,
       pl.gh_area
     FROM PlantingTran pl
     JOIN Factory ON pl.gh_factory = f_code
     JOIN village v ON pl.gh_vill = v.v_code AND pl.gh_factory = v.v_factory
     JOIN ZONE z ON v.V_Zone = z.Z_CODE AND pl.gh_factory = z.z_factory
     JOIN block b ON b.bl_Zonecode = z.Z_CODE AND pl.gh_factory = v.v_factory
     JOIN Variety vr ON vr.vr_code = pl.gh_vrcd AND pl.gh_factory = vr.vr_factory
     JOIN CROP cr ON cr.Cr_Code = pl.gh_cropcd AND pl.gh_factory = cr.factory
     JOIN Grower gr ON gr.g_code = pl.gh_grow AND pl.gh_factory = gr.g_factory
     JOIN MI_Factory MIF ON mif.F_Code = pl.gh_factory
     JOIN ShowingMethod sh ON sh.sm_Code = pl.gh_showingmethod AND pl.gh_factory = sh.factory
     WHERE (@F_code = '' OR MIF.F_Zone = @F_code)
       AND (@unit = 0 OR pl.gh_factory = @unit)
       AND z.Z_CODE BETWEEN @Zonefrom AND @Zoneto
       AND v.v_block BETWEEN @blockfrom AND @blockto
       AND (@PlantinType = '' OR CAST(pl.gh_category AS varchar(20)) = @PlantinType)
       AND (@Datefrom = '' OR CAST(pl.gh_pl_dt AS date) >= @Datefrom)
       AND (@DateTo = '' OR CAST(pl.gh_pl_dt AS date) <= @DateTo)`,
    params,
    season
  );
}

async function getWeeklySubmissionOfIndents({ params, season }) {
  return executeQuery(
    `SELECT TOP 10
       v.v_name,
       IN_TYPE,
       IN_INDARE,
       CONVERT(nvarchar, pl.IN_INDDATE, 105) AS indentDate,
       CONVERT(nvarchar, pl.IN_PDATE, 105) AS PlantDT,
       IN_SEEDTYPE AS indenttype,
       v.V_Zone,
       z.Z_NAME,
       z.Z_HName,
       v.v_block,
       b.bl_name,
       v.v_circle,
       v.v_circle_Name,
       pl.IN_GROW AS Growercode,
       gr.g_name,
       gr.g_father,
       in_intercrop AS ReportPiriad,
       in_smethod AS methedplantation,
       IN_SEEDTYPE AS seedself,
       CASE WHEN vr.vr_Cane_Type = '1' THEN 'Early' WHEN vr.vr_Cane_Type = '2' THEN 'Genrerel' ELSE 'Reject' END AS vr_Cane_Type,
       pl.IN_PLVILL AS varietycode,
       vr.vr_name,
       CONVERT(nvarchar, pl.IN_PDATE, 105) AS plantingDt,
       cr.Cr_Name,
       CONVERT(nvarchar, pl.IN_INDDATE, 105) AS gh_ent_date
     FROM Indenting pl
     JOIN Factory ON pl.IN_FACTORY = f_code
     JOIN village v ON pl.IN_PLVILL = v.v_code AND pl.IN_FACTORY = v.v_factory
     JOIN ZONE z ON v.V_Zone = z.Z_CODE AND pl.IN_FACTORY = z.z_factory
     JOIN block b ON b.bl_Zonecode = z.Z_CODE AND pl.IN_FACTORY = v.v_factory
     JOIN Variety vr ON vr.vr_code = pl.IN_VARIETY AND pl.IN_FACTORY = vr.vr_factory
     JOIN CROP cr ON cr.Cr_Code = pl.IN_CROP AND pl.IN_FACTORY = cr.factory
     JOIN Grower gr ON gr.g_code = pl.IN_GROW AND pl.IN_FACTORY = gr.g_factory
     WHERE (@unit = 0 OR pl.IN_FACTORY = @unit)
       AND z.Z_CODE BETWEEN @Zonefrom AND @Zoneto
       AND v.v_block BETWEEN @blockfrom AND @blockto
       AND (@Datefrom = '' OR CAST(pl.IN_PDATE AS date) >= @Datefrom)
       AND (@DateTo = '' OR CAST(pl.IN_PDATE AS date) <= @DateTo)`,
    params,
    season
  );
}

async function getSurveyUserMobile({ userId, season }) {
  return executeQuery(
    `SELECT Mobile
     FROM MI_User
     WHERE Type = 1 AND Userid = @userId`,
    { userId },
    season
  );
}

async function getSurveyCdoByMobile({ fCode, mobile, season }) {
  return executeQuery(
    `SELECT *
     FROM cdo_mst
     WHERE CDO_Factcode = @fCode AND CDO_MOBILENO = @mobile`,
    { fCode, mobile },
    season
  );
}

async function getSurveyBlocksByCdo({ fCode, cdoCode, cdoGroup, season }) {
  const baseQuery = `
    SELECT
      ISNULL((
        SELECT TOP 1 cdo.CDO_NAME
        FROM ZONE z
        JOIN cdo_mst cdo
          ON z.Z_ZoneOfficerCode = cdo.CDO_CODE
         AND z.z_factory = cdo.CDO_Factcode
        WHERE z.z_factory = b.bl_factcode
          AND z.Z_CODE = b.bl_Zonecode
      ), '') AS ZoneIncharge,
      ISNULL((
        SELECT TOP 1 CDO_NAME
        FROM cdo_mst
        WHERE CDO_Factcode = b.bl_factcode
          AND CDO_CODE = b.bl_inchargecode
      ), '') AS BlackIncharge,
      b.bl_Zonecode,
      b.*
    FROM block b
    JOIN ZONE z
      ON z.Z_CODE = b.bl_Zonecode
     AND z.z_factory = b.bl_factcode
    WHERE 1 = 1
      AND (@fCode = '' OR b.bl_factcode = @fCode)
      AND (@cdoGroup <> 'ZI' OR z.Z_ZoneOfficerCode = @cdoCode)
      AND (@cdoGroup <> 'BI' OR b.bl_inchargecode = @cdoCode)
    ORDER BY ZoneIncharge ASC`;

  return executeQuery(baseQuery, { fCode, cdoCode, cdoGroup }, season);
}

async function getSurveyBlocks({ fCode, season }) {
  return executeQuery(
    `SELECT
       ISNULL((
         SELECT TOP 1 cdo.CDO_NAME
         FROM ZONE z
         JOIN cdo_mst cdo
           ON z.Z_ZoneOfficerCode = cdo.CDO_CODE
          AND z.z_factory = cdo.CDO_Factcode
         WHERE z.z_factory = b.bl_factcode
           AND z.Z_CODE = b.bl_Zonecode
       ), '') AS ZoneIncharge,
       ISNULL((
         SELECT TOP 1 CDO_NAME
         FROM cdo_mst
         WHERE CDO_Factcode = b.bl_factcode
           AND CDO_CODE = b.bl_inchargecode
       ), '') AS BlackIncharge,
       b.bl_Zonecode,
       b.*
     FROM block b
     WHERE 1 = 1
       AND (@fCode = '' OR b.bl_factcode = @fCode)
     ORDER BY ZoneIncharge ASC`,
    { fCode },
    season
  );
}

async function getSurveySupervisors({ fCode, blockCode, season }) {
  return executeQuery(
    `SELECT DISTINCT vm.SUPVCODE, SUPVNAME
     FROM SupervisorVillageMapping vm
     JOIN Village v
       ON v.v_factory = vm.Factory
      AND v.v_code = vm.VillCode
     JOIN CIRCLE c
       ON c.factory = v.v_factory
      AND c.CR_CODE = v.v_circle
     JOIN SUPERVISOR s
       ON s.Factory = vm.Factory
      AND s.SUPVCODE = vm.Supvcode
     WHERE vm.Factory = @fCode
       AND c.cr_bl_code = @blockCode
     ORDER BY SUPVNAME ASC`,
    { fCode, blockCode },
    season
  );
}

async function getSurveyDataOnDate({ fCode, supCode, date, blockCode, season }) {
  return executeQuery(
    `SELECT
       CONVERT(varchar, MIN(gh_ent_date), 108) AS StartTime,
       CONVERT(varchar, MAX(gh_ent_date), 108) AS EndTime,
       ISNULL(COUNT(DISTINCT CAST(gh_plvill AS varchar) + CAST(gh_no AS varchar)), 0) AS NoofPlotOnDate,
       ISNULL(SUM(gh_area), 0) AS OnDateArea,
       ISNULL(SUM(gh_area), 0) AS AvgOnDate
     FROM gashti
     JOIN Village
       ON gh_factory = v_factory
      AND gh_plvill = v_code
     JOIN CIRCLE c
       ON c.factory = v_factory
      AND c.CR_CODE = v_circle
     JOIN block b
       ON b.bl_factcode = c.factory
      AND b.bl_code = c.cr_bl_code
     WHERE gh_factory = @fCode
       AND gh_vill IN (SELECT v_code FROM village WHERE ISNULL(V_SurveyRepFlag, 0) = 0 AND v_factory = @fCode)
       AND CAST(gh_ent_date AS date) = @date
       AND gh_sup_cd = @supCode
       AND b.bl_code = @blockCode`,
    { fCode, supCode, date, blockCode },
    season
  );
}

async function getSurveyDataToDate({ fCode, supCode, date, blockCode, season }) {
  return executeQuery(
    `SELECT
       ISNULL(COUNT(DISTINCT CAST(gh_plvill AS varchar) + CAST(gh_no AS varchar)), 0) AS NoofPlotToDate,
       ISNULL(SUM(gh_area), 0) AS ToDateArea,
       ISNULL(SUM(gh_area) / COUNT(DISTINCT CAST(gh_ent_date AS date)), 0) AS AvgToDate
     FROM gashti
     JOIN Village
       ON gh_factory = v_factory
      AND gh_plvill = v_code
     JOIN CIRCLE c
       ON c.factory = v_factory
      AND c.CR_CODE = v_circle
     JOIN block b
       ON b.bl_factcode = c.factory
      AND b.bl_code = c.cr_bl_code
     WHERE gh_factory = @fCode
       AND gh_vill IN (SELECT v_code FROM village WHERE ISNULL(V_SurveyRepFlag, 0) = 0 AND v_factory = @fCode)
       AND CAST(gh_ent_date AS date) <= @date
       AND gh_sup_cd = @supCode
       AND b.bl_code = @blockCode`,
    { fCode, supCode, date, blockCode },
    season
  );
}

async function getSurveyNonMemberOnDate({ fCode, supCode, date, blockCode, season }) {
  return executeScalar(
    `SELECT ISNULL(SUM(gh_area), 0)
     FROM gashti
     JOIN Village
       ON gh_factory = v_factory
      AND gh_plvill = v_code
     JOIN CIRCLE c
       ON c.factory = v_factory
      AND c.CR_CODE = v_circle
     JOIN block b
       ON b.bl_factcode = c.factory
      AND b.bl_code = c.cr_bl_code
     WHERE gh_factory = @fCode
       AND CAST(gh_ent_date AS date) = @date
       AND gh_sup_cd = @supCode
       AND b.bl_code = @blockCode
       AND gh_grow IN (SELECT f_nonmemcd FROM Factory WHERE f_code = @fCode)`,
    { fCode, supCode, date, blockCode },
    season
  );
}

async function getSurveyNonMemberToDate({ fCode, supCode, date, blockCode, season }) {
  return executeScalar(
    `SELECT ISNULL(SUM(gh_area), 0)
     FROM gashti
     JOIN Village
       ON gh_factory = v_factory
      AND gh_plvill = v_code
     JOIN CIRCLE c
       ON c.factory = v_factory
      AND c.CR_CODE = v_circle
     JOIN block b
       ON b.bl_factcode = c.factory
      AND b.bl_code = c.cr_bl_code
     WHERE gh_factory = @fCode
       AND CAST(gh_ent_date AS date) <= @date
       AND gh_sup_cd = @supCode
       AND b.bl_code = @blockCode
       AND gh_grow IN (SELECT f_nonmemcd FROM Factory WHERE f_code = @fCode)`,
    { fCode, supCode, date, blockCode },
    season
  );
}

async function getSurveyDataPrevOnDate({ fCode, supCode, date, blockCode, season }) {
  return executeQuery(
    `SELECT
       ISNULL(COUNT(DISTINCT CAST(gh_plvill AS varchar) + CAST(gh_no AS varchar)), 0) AS NoofPlotOnDate,
       ISNULL(SUM(gh_area), 0) AS OnDateArea,
       ISNULL(SUM(gh_area), 0) AS AvgOnDate
     FROM gashti
     JOIN Village
       ON gh_factory = v_factory
      AND gh_plvill = v_code
     JOIN CIRCLE c
       ON c.factory = v_factory
      AND c.CR_CODE = v_circle
     JOIN block b
       ON b.bl_factcode = c.factory
      AND b.bl_code = c.cr_bl_code
     WHERE gh_factory = @fCode
       AND gh_vill IN (SELECT v_code FROM village WHERE ISNULL(V_SurveyRepFlag, 0) = 0 AND v_factory = @fCode)
       AND CAST(gh_ent_date AS date) = DATEADD(day, -1, @date)
       AND gh_sup_cd = @supCode
       AND b.bl_code = @blockCode`,
    { fCode, supCode, date, blockCode },
    season
  );
}

async function getSurveyDataHourlyOnDate({ fCode, supCode, date, blockCode, season }) {
  return executeQuery(
    `SELECT ISNULL([6], 0) Hr6, ISNULL([7], 0) Hr7, ISNULL([8], 0) Hr8, ISNULL([9], 0) Hr9,
            ISNULL([10], 0) Hr10, ISNULL([11], 0) Hr11, ISNULL([12], 0) Hr12, ISNULL([13], 0) Hr13,
            ISNULL([14], 0) Hr14, ISNULL([15], 0) Hr15, ISNULL([16], 0) Hr16, ISNULL([17], 0) Hr17,
            ISNULL([18], 0) Hr18, ISNULL([19], 0) Hr19, ISNULL([20], 0) Hr20
     FROM (
       SELECT DATEPART(hour, gh_ent_date) hr,
              ISNULL(COUNT(DISTINCT CAST(gh_plvill AS varchar) + CAST(gh_no AS varchar)), 0) AS TSurvey
       FROM gashti
       JOIN Village
         ON gh_factory = v_factory
        AND gh_plvill = v_code
       JOIN CIRCLE c
         ON c.factory = v_factory
        AND c.CR_CODE = v_circle
       JOIN block b
         ON b.bl_factcode = c.factory
        AND b.bl_code = c.cr_bl_code
       WHERE gh_factory = @fCode
         AND gh_vill IN (SELECT v_code FROM village WHERE ISNULL(V_SurveyRepFlag, 0) = 0 AND v_factory = @fCode)
         AND CAST(gh_ent_date AS date) = @date
         AND gh_sup_cd = @supCode
         AND b.bl_code = @blockCode
       GROUP BY DATEPART(hour, gh_ent_date)
     ) AS SourceTable
     PIVOT (SUM(TSurvey) FOR hr IN ([6],[7],[8],[9],[10],[11],[12],[13],[14],[15],[16],[17],[18],[19],[20])) AS PivotTable`,
    { fCode, supCode, date, blockCode },
    season
  );
}

async function getSurveyDataHourlyOnDateNOPArea({ fCode, supCode, date, blockCode, season }) {
  return executeQuery(
    `SELECT
       ISNULL(COUNT(DISTINCT CAST(gh_plvill AS varchar) + CAST(gh_no AS varchar)), 0) AS NoofPlotOnDate,
       ISNULL(SUM(gh_area), 0) AS OnDateArea,
       ISNULL(SUM(gh_area), 0) AS AvgOnDate
     FROM gashti
     JOIN Village
       ON gh_factory = v_factory
      AND gh_plvill = v_code
     JOIN CIRCLE c
       ON c.factory = v_factory
      AND c.CR_CODE = v_circle
     JOIN block b
       ON b.bl_factcode = c.factory
      AND b.bl_code = c.cr_bl_code
     WHERE gh_factory = @fCode
       AND gh_vill IN (SELECT v_code FROM village WHERE ISNULL(V_SurveyRepFlag, 0) = 0 AND v_factory = @fCode)
       AND CAST(gh_ent_date AS date) = @date
       AND gh_sup_cd = @supCode
       AND b.bl_code = @blockCode`,
    { fCode, supCode, date, blockCode },
    season
  );
}

async function getSurveyDataHourlyToDate({ fCode, supCode, date, blockCode, season }) {
  return executeQuery(
    `SELECT
       ISNULL(COUNT(DISTINCT CAST(gh_plvill AS varchar) + CAST(gh_no AS varchar)), 0) AS NoofPlotToDate,
       ISNULL(SUM(gh_area), 0) AS ToDateArea,
       ISNULL(SUM(gh_area) / COUNT(DISTINCT CAST(gh_ent_date AS date)), 0) AS AvgToDate
     FROM gashti
     JOIN Village
       ON gh_factory = v_factory
      AND gh_plvill = v_code
     JOIN CIRCLE c
       ON c.factory = v_factory
      AND c.CR_CODE = v_circle
     JOIN block b
       ON b.bl_factcode = c.factory
      AND b.bl_code = c.cr_bl_code
     WHERE gh_factory = @fCode
       AND gh_vill IN (SELECT v_code FROM village WHERE ISNULL(V_SurveyRepFlag, 0) = 0 AND v_factory = @fCode)
       AND CAST(gh_ent_date AS date) <= @date
       AND gh_sup_cd = @supCode
       AND b.bl_code = @blockCode`,
    { fCode, supCode, date, blockCode },
    season
  );
}

async function getSurveyTotalWorking({ fCode, supCode, date, blockCode, season }) {
  return executeQuery(
    `SELECT
       COUNT(DISTINCT CAST(gh_ent_date AS DATE)) AS TotalWorkingDays,
       ISNULL(CAST(
         (ISNULL(SUM(CASE WHEN CAST(gh_ent_date AS DATE) = @date AND gh_grow = f_nonmemcd THEN gh_area ELSE 0 END), 0)
          / NULLIF(ISNULL(SUM(CASE WHEN CAST(gh_ent_date AS DATE) = @date THEN gh_area ELSE 0 END), 0), 0)) * 100
       AS DECIMAL(18,3)), 0) AS ondatemem,
       ISNULL(CAST(
         (ISNULL(SUM(CASE WHEN CAST(gh_ent_date AS DATE) <= @date AND gh_grow = f_nonmemcd THEN gh_area ELSE 0 END), 0)
          / NULLIF(ISNULL(SUM(CASE WHEN CAST(gh_ent_date AS DATE) <= @date THEN gh_area ELSE 0 END), 0), 0)) * 100
       AS DECIMAL(18,3)), 0) AS Todatemem
     FROM gashti
     JOIN Village
       ON gh_factory = v_factory
      AND gh_plvill = v_code
     JOIN CIRCLE c
       ON c.factory = v_factory
      AND c.CR_CODE = v_circle
     JOIN block b
       ON b.bl_factcode = c.factory
      AND b.bl_code = c.cr_bl_code
     JOIN factory
       ON f_Code = gh_factory
     WHERE gh_factory = @fCode
       AND CAST(gh_ent_date AS DATE) <= @date
       AND gh_sup_cd = @supCode
       AND b.bl_code = @blockCode
       AND gh_vill IN (SELECT v_code FROM village WHERE ISNULL(V_SurveyRepFlag, 0) = 0 AND v_factory = @fCode)`,
    { fCode, supCode, date, blockCode },
    season
  );
}

async function getSurveyFactory({ fCode, season }) {
  return executeQuery(
    `SELECT *
     FROM MI_Factory
     WHERE 1 = 1
       AND (@fCode = '' OR F_Code = @fCode)
     ORDER BY SN ASC`,
    { fCode },
    season
  );
}

async function getSurveyUnitWiseSurveyStatus({ fCode, caneType, season }) {
  const isGashti = String(caneType || '1') === '2';
  const procedure = isGashti ? 'get_unitwisesurveystatusgashtiAmity' : 'get_unitwisesurveystatus';
  return executeQuery(
    `EXEC ${procedure} @fCode`,
    { fCode },
    season
  );
}

const sanitizeDbName = (value) => {
  const raw = String(value || '').trim();
  if (!raw) return '';
  const cleaned = raw.replace(/[^A-Za-z0-9_]/g, '');
  return cleaned;
};

async function databaseExists({ dbName, season }) {
  const safeName = sanitizeDbName(dbName);
  if (!safeName) return false;
  const result = await executeScalar(
    'SELECT DB_ID(@dbName)',
    { dbName: safeName },
    season
  );
  return result !== null && result !== undefined;
}

async function getUnitwiseSurveyAreaSummaryPre({ fCode, connectionSeason, season }) {
  const dbName = sanitizeDbName(connectionSeason);
  const dbPrefix = dbName ? `[${dbName}]..` : '';
  return executeQuery(
    `SELECT At_category AS gh_pl_rt, ISNULL(SUM(gh_area), 0) AS gh_area
     FROM ${dbPrefix}gashti g
     JOIN Village v
       ON v.v_code = g.gh_plvill
      AND v.v_factory = g.gh_factory
     JOIN ${dbPrefix}activity_type at
       ON at.at_code = g.gh_category
      AND at.at_factory = g.gh_factory
     WHERE g.gh_factory = @fCode
       AND g.gh_vill IN (
         SELECT v_code FROM village WHERE ISNULL(V_SurveyRepFlag, 0) = 0 AND v_factory = @fCode
       )
     GROUP BY At_category`,
    { fCode },
    season
  );
}

async function getUnitwiseSurveyAreaSummaryCur({ fCode, season }) {
  return executeQuery(
    `SELECT at_PlantCycle AS gh_pl_rt, ISNULL(SUM(gh_area), 0) AS gh_area
     FROM gashti g
     JOIN Village v
       ON v.v_code = g.gh_plvill
      AND v.v_factory = g.gh_factory
     JOIN activity_type at
       ON at.at_code = g.gh_category
      AND at.at_factory = g.gh_factory
     WHERE EXISTS (
       SELECT 1 FROM SupervisorVillageMapping WHERE Factory = g.gh_factory AND VillCode = g.gh_plvill
     )
       AND g.gh_factory = @fCode
       AND g.gh_vill IN (
         SELECT v_code FROM village WHERE ISNULL(V_SurveyRepFlag, 0) = 0 AND v_factory = @fCode
       )
     GROUP BY at_PlantCycle`,
    { fCode },
    season
  );
}

async function getUnitwiseSurveyAreaSummaryPreGashtiAmity({ fCode, connectionSeason, season }) {
  const dbName = sanitizeDbName(connectionSeason);
  const dbPrefix = dbName ? `[${dbName}]..` : '';
  return executeQuery(
    `SELECT At_category AS gh_pl_rt, ISNULL(SUM(gh_area), 0) AS gh_area
     FROM ${dbPrefix}gashtiAmity g
     JOIN Village v
       ON v.v_code = g.gh_plvill
      AND v.v_factory = g.gh_factory
     JOIN ${dbPrefix}activity_type at
       ON at.at_code = g.gh_category
      AND at.at_factory = g.gh_factory
     WHERE g.gh_factory = @fCode
       AND g.gh_vill IN (
         SELECT v_code FROM village WHERE ISNULL(V_SurveyRepFlag, 0) = 0 AND v_factory = @fCode
       )
     GROUP BY At_category`,
    { fCode },
    season
  );
}

async function getUnitwiseSurveyAreaSummaryCurGashtiAmity({ fCode, season }) {
  return executeQuery(
    `SELECT at_PlantCycle AS gh_pl_rt, ISNULL(SUM(gh_area), 0) AS gh_area
     FROM gashtiAmity g
     JOIN Village v
       ON v.v_code = g.gh_plvill
      AND v.v_factory = g.gh_factory
     JOIN activity_type at
       ON at.at_code = g.gh_category
      AND at.at_factory = g.gh_factory
     WHERE g.gh_factory = @fCode
       AND g.gh_vill IN (
         SELECT v_code FROM village WHERE ISNULL(V_SurveyRepFlag, 0) = 0 AND v_factory = @fCode
       )
     GROUP BY at_PlantCycle`,
    { fCode },
    season
  );
}

module.exports = {
  getFactoryWiseCaneAreaReport,
  executeSurveyReportProcedure,
  getPlotWiseDetails,
  getCategoryWiseSummary,
  getCaneVierityVillageGrower,
  getWeeklySubmissionOfAutumnPlantingIndent,
  getWeeklySubmissionOfIndents,
  getSurveyUserMobile,
  getSurveyCdoByMobile,
  getSurveyBlocksByCdo,
  getSurveyBlocks,
  getSurveySupervisors,
  getSurveyDataOnDate,
  getSurveyDataToDate,
  getSurveyNonMemberOnDate,
  getSurveyNonMemberToDate,
  getSurveyDataPrevOnDate,
  getSurveyDataHourlyOnDate,
  getSurveyDataHourlyOnDateNOPArea,
  getSurveyDataHourlyToDate,
  getSurveyTotalWorking,
  getSurveyFactory,
  getSurveyUnitWiseSurveyStatus,
  getFinalVillageFirstSurveyReport,
  getFinalVillageFirstSurveySummeryReport,
  getFinalVillageList,
  databaseExists,
  getUnitwiseSurveyAreaSummaryPre,
  getUnitwiseSurveyAreaSummaryCur,
  getUnitwiseSurveyAreaSummaryPreGashtiAmity,
  getUnitwiseSurveyAreaSummaryCurGashtiAmity
};
