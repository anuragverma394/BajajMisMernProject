const { executeQuery } = require('../../core/db/query-executor');

async function getFactories(fCode, season) {
  try {
    return await executeQuery(
      `SELECT f_Code, F_Short AS F_Name
       FROM MI_Factory
       WHERE (@fact IS NULL OR @fact = '0' OR @fact = 'All' OR f_Code = @fact)
       ORDER BY UC`,
      { fact: fCode || null },
      season
    );
  } catch (error) {
    return executeQuery(
      `SELECT f_code AS f_Code, f_Name AS F_Name
       FROM Factory
       WHERE (@fact IS NULL OR @fact = '0' OR @fact = 'All' OR f_code = @fact)
       ORDER BY f_code`,
      { fact: fCode || null },
      season
    );
  }
}

async function getVarietyWiseCanePurchaseAmtRows(fCode, fromDate, toDate, season) {
  const sql = `
    SELECT 
      p.M_FACTORY,
      (CASE WHEN p.M_CENTRE = 100 THEN 1 ELSE 0 END) as isGate,
      (CASE 
          WHEN p.M_CATEG LIKE '1%' THEN '1'
          WHEN p.M_CATEG LIKE '2%' THEN '2'
          WHEN p.M_CATEG LIKE '3%' THEN '3'
          ELSE '0'
      END) AS category,
      d.dt_state, c.c_state, ISNULL(c.C_centalloted, 0) as C_centalloted, ISNULL(v.v_alloted, 0) as v_alloted,
      SUM(p.M_AMOUNT) AS totalAmt
    FROM Purchase p
    INNER JOIN Centre c ON c.c_code = p.M_CENTRE AND c.c_factory = p.M_FACTORY
    LEFT JOIN Village v ON v.v_code = p.M_VILL AND v.v_factory = p.M_FACTORY
    LEFT JOIN District d ON d.DT_code = v.V_DisitictCode
    WHERE p.M_DATE >= @fDate AND p.M_DATE < DATEADD(DAY, 1, @tDate)
      AND (@fact IS NULL OR @fact = '0' OR p.M_FACTORY = @fact)
    GROUP BY p.M_FACTORY, p.M_CENTRE, 
      CASE 
          WHEN p.M_CATEG LIKE '1%' THEN '1'
          WHEN p.M_CATEG LIKE '2%' THEN '2'
          WHEN p.M_CATEG LIKE '3%' THEN '3'
          ELSE '0'
      END, 
      d.dt_state, c.c_state, c.C_centalloted, v.v_alloted`;

  return executeQuery(
    sql,
    { fact: fCode || null, fDate: fromDate, tDate: toDate },
    season
  );
}

async function getDistilleryReportMonthlyTotals(fact, fromDate, toDate, season) {
  const sql = `
    SELECT
      ISNULL(SUM(AS_DISTBO_BAG_TRANSIT), 0) AS AS_DISTBO_BAG_TRANSIT,
      ISNULL(SUM(AS_DISTBO_BAG_CLSTOCK), 0) AS AS_DISTBO_BAG_CLSTOCK,
      ISNULL(SUM(AS_DISTBO_BAG_CONSU), 0) AS AS_DISTBO_BAG_CONSU,
      ISNULL(SUM(AS_DISTBO_BAG_EX_SH), 0) AS AS_DISTBO_BAG_EX_SH,
      ISNULL(SUM(AS_SD_BAG_TR_OWN_DIST), 0) AS AS_SD_BAG_TR_OWN_DIST,
      ISNULL(SUM(AS_DISTBO_BAG_RECD_OTH_PL), 0) AS AS_DISTBO_BAG_RECD_OTH_PL,
      ISNULL(SUM(AS_DISTBO_BAG_RECD_COGEN), 0) AS AS_DISTBO_BAG_RECD_COGEN,
      ISNULL(SUM(AS_DISTBO_BAG_PHY_STOCK), 0) AS AS_DISTBO_BAG_PHY_STOCK,
      ISNULL(SUM(AS_DISTBO_BAG_PUR_OOTSIDE), 0) AS AS_DISTBO_BAG_PUR_OOTSIDE,
      ISNULL(SUM(AS_COG_BAG_OUTS_TR_DIST), 0) AS AS_COG_BAG_OUTS_TR_DIST,
      ISNULL(SUM(AS_DISTBO_LS_BIOG_CONSU), 0) AS AS_DISTBO_LS_BIOG_CONSU,
      ISNULL(SUM(AS_DISTBO_LS_SLOP_CONSU), 0) AS AS_DISTBO_LS_SLOP_CONSU,
      ISNULL(SUM(AS_DISTBO_LS_GENET_BAG), 0) AS AS_DISTBO_LS_GENET_BAG,
      ISNULL(SUM(AS_DISTBO_LS_GENET_BOIG), 0) AS AS_DISTBO_LS_GENET_BOIG,
      ISNULL(SUM(AS_DISTBO_LS_GENET_SLOP), 0) AS AS_DISTBO_LS_GENET_SLOP,
      ISNULL(SUM(AS_DISTBO_LS_GIV_SUG), 0) AS AS_DISTBO_LS_GIV_SUG,
      ISNULL(SUM(AS_COG_LS_GIV_DIST), 0) AS AS_COG_LS_GIV_DIST,
      ISNULL(SUM(AS_DISTBO_LS_GIV_DIST), 0) AS AS_DISTBO_LS_GIV_DIST,
      ISNULL(SUM(AS_DISTBO_LS_CONSU_DIST), 0) AS AS_DISTBO_LS_CONSU_DIST,
      ISNULL(SUM(AS_DISTBO_LS_CONSU_DISTBOI), 0) AS AS_DISTBO_LS_CONSU_DISTBOI,
      ISNULL(SUM(AS_DISTBO_LS_GIV_BACKP_TURB), 0) AS AS_DISTBO_LS_GIV_BACKP_TURB,
      ISNULL(SUM(AS_DISTBO_LS_GIV_CONDE_TURB), 0) AS AS_DISTBO_LS_GIV_CONDE_TURB,
      ISNULL(SUM(AS_DISTBO_LS_LOSSES), 0) AS AS_DISTBO_LS_LOSSES,
      ISNULL(SUM(AS_DISTBO_EXS_GIV_SUG), 0) AS AS_DISTBO_EXS_GIV_SUG,
      ISNULL(SUM(AS_DISTBO_EXS_GIV_DIST), 0) AS AS_DISTBO_EXS_GIV_DIST,
      ISNULL(SUM(AS_DISTBO_EXS_LOSSES), 0) AS AS_DISTBO_EXS_LOSSES,
      ISNULL(SUM(AS_DISTBO_TUR_PROD_POWER), 0) AS AS_DISTBO_TUR_PROD_POWER,
      ISNULL(SUM(AS_DISTBO_TUR_EXP_UPPCL), 0) AS AS_DISTBO_TUR_EXP_UPPCL,
      ISNULL(SUM(AS_DISTBO_TUR_EXP_LMONTH), 0) AS AS_DISTBO_TUR_EXP_LMONTH,
      ISNULL(SUM(AS_DISTBO_TUR_BNK_MONTH), 0) AS AS_DISTBO_TUR_BNK_MONTH,
      ISNULL(SUM(AS_DISTBO_TUR_TR_POWER_SUG), 0) AS AS_DISTBO_TUR_TR_POWER_SUG,
      ISNULL(SUM(AS_DISTBO_TUR_TR_DIST_PROCESS), 0) AS AS_DISTBO_TUR_TR_DIST_PROCESS,
      ISNULL(SUM(AS_DISTBO_TUR_DIST_BOI), 0) AS AS_DISTBO_TUR_DIST_BOI,
      ISNULL(SUM(AS_DISTBO_TUR_TR_CONGEN), 0) AS AS_DISTBO_TUR_TR_CONGEN,
      ISNULL(SUM(AS_DISTBO_TUR_ECOT), 0) AS AS_DISTBO_TUR_ECOT,
      ISNULL(SUM(AS_DISTBO_TUR_LOSSES), 0) AS AS_DISTBO_TUR_LOSSES
    FROM Sugar_Report
    WHERE S_Date BETWEEN @fromDate AND @toDate
      AND (@fact IS NULL OR @fact = '0' OR S_Factory = @fact)`;

  return executeQuery(sql, { fact: fact || null, fromDate, toDate }, season);
}

module.exports = {
  getFactories,
  getVarietyWiseCanePurchaseAmtRows,
  getCapacityUtilisationRow,
  getCapacityUtilisationPeriodicalRow,
  getDistilleryReportMonthlyTotals,
  async getVarietyWiseCanePurchaseRows(fCode, fromDate, toDate, season) {
    const sql = `
      SELECT 
        p.M_FACTORY,
        (CASE WHEN p.M_CENTRE = 100 THEN 1 ELSE 0 END) as isGate,
        (CASE 
            WHEN p.M_CATEG LIKE '1%' THEN '1'
            WHEN p.M_CATEG LIKE '2%' THEN '2'
            WHEN p.M_CATEG LIKE '3%' THEN '3'
            ELSE '0'
        END) AS category,
        d.dt_state, c.c_state, ISNULL(c.C_centalloted, 0) as C_centalloted, ISNULL(v.v_alloted, 0) as v_alloted,
        SUM(p.M_GROSS - p.M_TARE - p.M_JOONA) AS qty
      FROM Purchase p
      INNER JOIN Centre c ON c.c_code = p.M_CENTRE AND c.c_factory = p.M_FACTORY
      LEFT JOIN Village v ON v.v_code = p.M_VILL AND v.v_factory = p.M_FACTORY
      LEFT JOIN District d ON d.DT_code = v.V_DisitictCode
      WHERE p.M_DATE >= @fDate AND p.M_DATE < DATEADD(DAY, 1, @tDate)
        AND (@fact IS NULL OR @fact = '0' OR p.M_FACTORY = @fact)
      GROUP BY p.M_FACTORY, p.M_CENTRE,
        CASE 
            WHEN p.M_CATEG LIKE '1%' THEN '1'
            WHEN p.M_CATEG LIKE '2%' THEN '2'
            WHEN p.M_CATEG LIKE '3%' THEN '3'
            ELSE '0'
        END,
        d.dt_state, c.c_state, c.C_centalloted, v.v_alloted`;

    return executeQuery(
      sql,
      { fact: fCode || null, fDate: fromDate, tDate: toDate },
      season
    );
  }
};

async function getCapacityUtilisationRow(fact, toDate, season) {
  const sql = `
    SELECT
      (CropDay * OnCapacity * 10) AS TotalCapacityAvailableforPlant,
      ISNULL(ToDtCrush, 0) AS TotalCaneCrushed,
      CropDay AS TotalPlantRunDays,
      OnCapacity AS CrushingCapacityPerday,
      OperationalCapacity,
      CnDate,
      ISNULL(CAST((ToDtCrush / NULLIF(OnCapacity * CropDay, 0)) * 10 AS numeric(18,2)), 0) AS ToDateCapUt
    FROM (
      SELECT
        ISNULL(DATEDIFF(DAY, MIN(Cn_Date), MAX(Cn_Date)) + 1, 0) AS CropDay,
        ISNULL((SELECT MAX(Cp_PlantCapacity) FROM MI_CanePlan WHERE CP_Unit = @fact), 0) AS OnCapacity,
        ISNULL((SELECT MAX(plantCapacity) FROM MI_CanePlan WHERE CP_Unit = @fact), 0) AS OperationalCapacity,
        ISNULL((SELECT TOP 1 Cn_CaneCrushOndate2223 FROM MI_CaneCrushSAPEntry
                WHERE Cn_Unit = @fact AND CAST(Cn_Date AS date) = @toDate), 0) AS OnDtCrush,
        SUM(Cn_CaneCrushOndate2223) AS ToDtCrush,
        CONVERT(VARCHAR(10), MIN(CAST(Cn_Date AS DATE)), 103) AS CnDate
      FROM MI_CaneCrushSAPEntry
      WHERE Cn_Unit = @fact
        AND Cn_CaneCrushOndate2223 > 0
        AND CAST(Cn_Date AS date) <= @toDate
    ) AS CapData`;

  return executeQuery(sql, { fact, toDate }, season);
}

async function getCapacityUtilisationPeriodicalRow(fact, fromDate, toDate, season) {
  const sql = `
    SELECT
      (CropDay * OnCapacity * 10) AS TotalCapacityAvailableforPlant,
      ISNULL(ToDtCrush, 0) AS TotalCaneCrushed,
      CropDay AS TotalPlantRunDays,
      OnCapacity AS CrushingCapacityPerday,
      OperationalCapacity,
      CONVERT(VARCHAR(10), @fromDate, 103) AS CnDate,
      ISNULL(CAST((ToDtCrush / NULLIF(OnCapacity * CropDay, 0)) * 10 AS numeric(18,2)), 0) AS ToDateCapUt
    FROM (
      SELECT
        ISNULL(DATEDIFF(DAY, @fromDate, @toDate) + 1, 0) AS CropDay,
        ISNULL((SELECT MAX(Cp_PlantCapacity) FROM MI_CanePlan WHERE CP_Unit = @fact), 0) AS OnCapacity,
        ISNULL((SELECT MAX(plantCapacity) FROM MI_CanePlan WHERE CP_Unit = @fact), 0) AS OperationalCapacity,
        SUM(Cn_CaneCrushOndate2223) AS ToDtCrush
      FROM MI_CaneCrushSAPEntry
      WHERE Cn_Unit = @fact
        AND Cn_CaneCrushOndate2223 > 0
        AND CAST(Cn_Date AS date) BETWEEN @fromDate AND @toDate
    ) AS CapData`;

  return executeQuery(sql, { fact, fromDate, toDate }, season);
}
