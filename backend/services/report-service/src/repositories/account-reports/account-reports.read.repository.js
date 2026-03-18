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

module.exports = {
  getFactories,
  getVarietyWiseCanePurchaseAmtRows,
  async getVarietyWiseCanePurchaseRows(fCode, fromDate, toDate, season) {
    const sql = `
      SELECT 
        p.M_FACTORY,
        CASE 
          WHEN p.M_CATEG LIKE '1%' THEN '1'
          WHEN p.M_CATEG LIKE '2%' THEN '2'
          WHEN p.M_CATEG LIKE '3%' THEN '3'
        END AS category,
        SUM(M_GROSS - M_TARE - M_JOONA) AS qty
      FROM Purchase p
      INNER JOIN Centre c ON c.c_code = p.M_CENTRE AND c.c_factory = p.M_FACTORY
      LEFT JOIN Village v ON v.v_code = p.M_VILL AND v.v_factory = p.M_FACTORY
      LEFT JOIN District d ON d.DT_code = v.V_DisitictCode
      WHERE d.dt_state = 0 AND p.M_CENTRE = 100
        AND p.M_DATE >= @fDate AND p.M_DATE < DATEADD(DAY, 1, @tDate)
        AND (@fact IS NULL OR @fact = '0' OR p.M_FACTORY = @fact)
      GROUP BY p.M_FACTORY,
        CASE 
          WHEN p.M_CATEG LIKE '1%' THEN '1'
          WHEN p.M_CATEG LIKE '2%' THEN '2'
          WHEN p.M_CATEG LIKE '3%' THEN '3'
        END`;

    return executeQuery(
      sql,
      { fact: fCode || null, fDate: fromDate, tDate: toDate },
      season
    );
  }
};
