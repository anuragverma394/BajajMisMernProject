const { executeProcedure, executeQuery } = require('../core/db/query-executor');

async function getFactoryWiseCaneAreaReport({ procedure, params, season }) {
  return executeProcedure(procedure, params, season);
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

module.exports = {
  getFactoryWiseCaneAreaReport,
  getPlotWiseDetails,
  getCategoryWiseSummary,
  getCaneVierityVillageGrower,
  getWeeklySubmissionOfAutumnPlantingIndent,
  getWeeklySubmissionOfIndents
};
