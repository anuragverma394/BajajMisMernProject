const { executeQuery } = require('./core/db/query-executor');

const SUMMARY_SQL = `
  WITH CEN AS (
    SELECT C_FACTORY, C_CODE, C_NAME FROM CENTRE WHERE C_FACTORY = @fact
  ),
  PUR AS (
    SELECT MC_GCode as M_CENTRE,
      ISNULL(SUM(ISNULL(M_GROSS,0) - ISNULL(M_TARE,0) - ISNULL(M_JOONA,0)), 0) PQTY
    FROM PURCHASE
    JOIN MI_MargeCenter ON MC_CCODE = M_CENTRE AND MC_FACTORY = M_FACTORY
    WHERE CONVERT(NVARCHAR, M_DATE,112) <= @dt
      AND M_FACTORY = @fact
    GROUP BY MC_GCode
  ),
  REP AS (
    SELECT TT_CENTER,
      ISNULL(SUM(ISNULL(TT_GROSSWEIGHT,0) - ISNULL(TT_TAREWEIGHT,0) - ISNULL(TT_JOONAWEIGHT,0)), 0) RQTY
    FROM RECEIPT
    JOIN CENTRE ON C_CODE = TT_CENTER AND C_FACTORY = TT_FACTORY
    WHERE CONVERT(NVARCHAR, tt_DpDate,112) <= @dt
      AND TT_FACTORY = @fact
    GROUP BY TT_CENTER
  )
  SELECT C_FACTORY, C_CODE, C_NAME, ISNULL(PQTY,0) PQTY, ISNULL(RQTY,0) RQTY
  FROM CEN
  JOIN PUR ON C_CODE = M_CENTRE
  LEFT JOIN REP ON M_CENTRE = TT_CENTER
  WHERE C_CODE != 100
  ORDER BY C_CODE`;

const CLOSING_SQL = `
  SELECT MAX(CH_CHALLAN) AS CH_CHALLAN, ISNULL(CH_BALANCE,0) AS CH_BALANCE
  FROM CHALLAN_FINAL
  WHERE Ch_Cancel = 0
    AND CH_FACTORY = @fact
    AND CONVERT(NVARCHAR, CH_DEP_DATE,112) = @dt
    AND CH_CENTRE = @centre
  GROUP BY CH_BALANCE
  ORDER BY CH_CHALLAN DESC`;

const DR_DETAIL_BEFORE_SQL = `
  WITH PUR AS (
    SELECT MAX(CAST(M_DATE as Date)) MDATE,
      ISNULL(SUM(ISNULL(M_GROSS,0) - ISNULL(M_TARE,0) - ISNULL(M_JOONA,0)), 0) PQTY
    FROM PURCHASE
    JOIN MI_MargeCenter ON MC_CCODE = M_CENTRE AND MC_FACTORY = M_FACTORY
    WHERE CONVERT(NVARCHAR, M_DATE,112) < @edt
      AND M_FACTORY = @fact
      AND MC_GCode = @center
      AND M_CENTRE != 100
  ),
  REP AS (
    SELECT MAX(CAST(tt_DpDate as Date)) TDATE,
      ISNULL(SUM(ISNULL(TT_GROSSWEIGHT,0) - ISNULL(TT_TAREWEIGHT,0) - ISNULL(TT_JOONAWEIGHT,0)), 0) RQTY
    FROM RECEIPT
    JOIN CENTRE ON C_CODE = TT_CENTER AND C_FACTORY = TT_FACTORY
    WHERE CONVERT(NVARCHAR, tt_DpDate,112) < @edt
      AND TT_FACTORY = @fact
      AND TT_CENTER = @center
  )
  SELECT
    CASE WHEN MDATE is null THEN CONVERT(varchar, TDATE,103) ELSE CONVERT(varchar, MDATE,103) END AS DATE,
    CASE WHEN PQTY is null THEN 0 ELSE PQTY END PQTY,
    CASE WHEN RQTY is null THEN 0 ELSE RQTY END RQTY
  FROM PUR FULL OUTER JOIN REP ON PUR.MDATE = REP.TDATE
  WHERE MDATE is not null
  ORDER BY MDATE ASC`;

const DR_DETAIL_RANGE_SQL = `
  WITH PUR AS (
    SELECT CAST(M_DATE as Date) MDATE,
      ISNULL(SUM(ISNULL(M_GROSS,0) - ISNULL(M_TARE,0) - ISNULL(M_JOONA,0)), 0) PQTY
    FROM PURCHASE
    JOIN MI_MargeCenter ON MC_CCODE = M_CENTRE AND MC_FACTORY = M_FACTORY
    WHERE CONVERT(NVARCHAR, M_DATE,112) BETWEEN @edt AND @dt
      AND M_FACTORY = @fact
      AND MC_GCode = @center
      AND M_CENTRE != 100
    GROUP BY CAST(M_DATE as Date)
  ),
  REP AS (
    SELECT CAST(tt_DpDate as Date) TDATE,
      ISNULL(SUM(ISNULL(TT_GROSSWEIGHT,0) - ISNULL(TT_TAREWEIGHT,0) - ISNULL(TT_JOONAWEIGHT,0)), 0) RQTY
    FROM RECEIPT
    JOIN CENTRE ON C_CODE = TT_CENTER AND C_FACTORY = TT_FACTORY
    WHERE CONVERT(NVARCHAR, tt_DpDate,112) BETWEEN @edt AND @dt
      AND TT_FACTORY = @fact
      AND TT_CENTER = @center
    GROUP BY CAST(tt_DpDate as Date)
  )
  SELECT
    CASE WHEN MDATE is null THEN CONVERT(varchar, TDATE,103) ELSE CONVERT(varchar, MDATE,103) END AS DATE,
    CASE WHEN PQTY is null THEN 0 ELSE PQTY END PQTY,
    CASE WHEN RQTY is null THEN 0 ELSE RQTY END RQTY
  FROM PUR FULL OUTER JOIN REP ON PUR.MDATE = REP.TDATE
  ORDER BY MDATE ASC`;

const DR_OPENING_SQL = `
  SELECT TOP 1 MAX(CH_CHALLAN) AS CH_CHALLAN, ISNULL(CH_BALANCE,0) AS CH_BALANCE
  FROM CHALLAN_FINAL
  WHERE Ch_Cancel = 0
    AND CH_FACTORY = @fact
    AND CONVERT(NVARCHAR, CH_DEP_DATE,112) <= @dt
    AND CH_CENTRE = @center
  GROUP BY CH_BALANCE
  ORDER BY MAX(CH_CHALLAN) DESC`;

const DR_CLOSING_SQL = `
  SELECT MAX(CH_CHALLAN) AS CH_CHALLAN, ISNULL(CH_BALANCE,0) AS CH_BALANCE
  FROM CHALLAN_FINAL
  WHERE Ch_Cancel = 0
    AND CH_FACTORY = @fact
    AND CONVERT(NVARCHAR, CH_DEP_DATE,112) = @dt
    AND CH_CENTRE = @center
  GROUP BY CH_BALANCE
  ORDER BY CH_CHALLAN DESC`;

const DCS_SUMMARY_SQL = `
  WITH CEN AS (
    SELECT U_factory as Factory, u_code SUPVCODE, u_name as SUPVNAME
    FROM Users
    WHERE U_factory = @fact
  ),
  PUR AS (
    SELECT M_TARE_OPR, MIN(M_DATE) FDate, MAX(M_DATE) TDate,
      ISNULL(SUM(ISNULL(M_GROSS,0) - ISNULL(M_TARE,0) - ISNULL(M_JOONA,0)), 0) PQTY
    FROM PURCHASE
    WHERE CONVERT(NVARCHAR, M_DATE,112) <= @dt
      AND M_FACTORY = @fact
      AND M_CENTRE != 100
    GROUP BY M_TARE_OPR
  ),
  REP AS (
    SELECT tt_Clerk, MIN(tt_DpDate) tFDate, MAX(tt_DpDate) tTDate,
      ISNULL(SUM(ISNULL(TT_GROSSWEIGHT,0) - ISNULL(TT_TAREWEIGHT,0) - ISNULL(TT_JOONAWEIGHT,0)), 0) RQTY
    FROM RECEIPT
    WHERE CONVERT(NVARCHAR, tt_DpDate,112) <= @dt
      AND TT_FACTORY = @fact
    GROUP BY tt_Clerk
  )
  SELECT Factory as C_FACTORY, SUPVCODE as C_CODE, SUPVNAME as C_NAME,
    CONVERT(varchar, FDate,103) FDate,
    CONVERT(varchar, TDate,103) TDate,
    ISNULL(PQTY,0) PQTY, ISNULL(RQTY,0) RQTY
  FROM CEN
  JOIN PUR on SUPVCODE = M_TARE_OPR
  FULL OUTER JOIN REP on M_TARE_OPR = tt_Clerk
  WHERE SUPVCODE is not null
  ORDER BY SUPVCODE`;

const DCS_DETAIL_SQL = `
  WITH PUR AS (
    SELECT M_CENTRE, MIN(CAST(M_DATE as Date)) Mfrom, MAX(CAST(M_DATE as Date)) MTill,
      ISNULL(SUM(ISNULL(M_GROSS,0) - ISNULL(M_TARE,0) - ISNULL(M_JOONA,0)), 0) PQTY
    FROM PURCHASE
    WHERE CONVERT(NVARCHAR, M_DATE,112) <= @dt
      AND M_FACTORY = @fact
      AND M_TARE_OPR = @clerk
    GROUP BY M_CENTRE
  ),
  REP AS (
    SELECT tt_center, MIN(CAST(tt_DpDate as Date)) TFrom, MAX(CAST(tt_DpDate as Date)) TTill,
      ISNULL(SUM(ISNULL(TT_GROSSWEIGHT,0) - ISNULL(TT_TAREWEIGHT,0) - ISNULL(TT_JOONAWEIGHT,0)), 0) RQTY
    FROM RECEIPT
    WHERE CONVERT(NVARCHAR, tt_DpDate,112) <= @dt
      AND TT_FACTORY = @fact
      AND tt_Clerk = @clerk
    GROUP BY tt_center
  )
  SELECT c_factory as factory, c_code, C_Name,
    CONVERT(varchar, (case when Mfrom > TFrom then TFrom else Mfrom end),103) MFrom,
    CONVERT(varchar, (case when MTill > TTill then MTill else TTill end),103) Till,
    ISNULL(SUM(PQTY),0) PQTY, ISNULL(SUM(RQTY),0) RQTY
  FROM PUR
  FULL OUTER JOIN REP ON M_CENTRE = tt_center
  JOIN Centre on c_code = M_CENTRE and c_code = tt_center
  WHERE c_factory = @fact
  GROUP BY c_factory, c_code, C_Name, Mfrom, MTill, TFrom, TTill
  ORDER BY (case when Mfrom > TFrom then TFrom else Mfrom end),
           (case when MTill > TTill then MTill else TTill end)`;

const DCS_OPENING_SQL = `
  SELECT TOP 1 MAX(CH_CHALLAN) AS CH_CHALLAN, ISNULL(CH_BALANCE,0) AS CH_BALANCE
  FROM CHALLAN_FINAL
  WHERE Ch_Cancel = 0
    AND CH_FACTORY = @fact
    AND CONVERT(NVARCHAR, CH_DEP_DATE,112) <= @dt
    AND Ch_Centre = @centre
  GROUP BY CH_BALANCE
  ORDER BY MAX(CH_CHALLAN) DESC`;

const DCS_CLOSING_SQL = `
  SELECT TOP 1 MAX(CH_CHALLAN) AS CH_CHALLAN, ISNULL(CH_BALANCE,0) AS CH_BALANCE
  FROM CHALLAN_FINAL
  WHERE Ch_Cancel = 0
    AND CH_FACTORY = @fact
    AND CONVERT(NVARCHAR, CH_DEP_DATE,112) = @dt
    AND CH_CENTRE = @centre
  GROUP BY CH_BALANCE
  ORDER BY CH_CHALLAN DESC`;

async function fetchDriageSummaryRows(fact, dt, season) {
  return executeQuery(SUMMARY_SQL, { fact, dt }, season);
}

async function fetchClosingBalance(fact, dt, centre, season) {
  return executeQuery(CLOSING_SQL, { fact, dt, centre }, season);
}

async function fetchDriageDetailBeforeRows(fact, edt, center, season) {
  return executeQuery(DR_DETAIL_BEFORE_SQL, { fact, edt, center }, season);
}

async function fetchDriageDetailRangeRows(fact, edt, dt, center, season) {
  return executeQuery(DR_DETAIL_RANGE_SQL, { fact, edt, dt, center }, season);
}

async function fetchDriageDetailOpeningBalance(fact, dt, center, season) {
  return executeQuery(DR_OPENING_SQL, { fact, dt, center }, season);
}

async function fetchDriageDetailClosingBalance(fact, dt, center, season) {
  return executeQuery(DR_CLOSING_SQL, { fact, dt, center }, season);
}

async function fetchDriageClerkSummaryRows(fact, dt, season) {
  return executeQuery(DCS_SUMMARY_SQL, { fact, dt }, season);
}

async function fetchDriageClerkDetailRows(fact, dt, clerk, season) {
  return executeQuery(DCS_DETAIL_SQL, { fact, dt, clerk }, season);
}

async function fetchDriageClerkOpeningBalance(fact, dt, center, season) {
  return executeQuery(DCS_OPENING_SQL, { fact, dt, centre: center }, season);
}

async function fetchDriageClerkClosingBalance(fact, dt, center, season) {
  return executeQuery(DCS_CLOSING_SQL, { fact, dt, centre: center }, season);
}

module.exports = {
  fetchDriageSummaryRows,
  fetchClosingBalance,
  fetchDriageDetailBeforeRows,
  fetchDriageDetailRangeRows,
  fetchDriageDetailOpeningBalance,
  fetchDriageDetailClosingBalance,
  fetchDriageClerkSummaryRows,
  fetchDriageClerkDetailRows,
  fetchDriageClerkOpeningBalance,
  fetchDriageClerkClosingBalance
};
