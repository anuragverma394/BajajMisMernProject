const { executeQuery } = require('../core/db/query-executor');

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

const IND_FAIL_NEW_SQL = `
  WITH CT AS (
    SELECT IS_FACTORY, IS_DS_DT,
      ISNULL(SUM(MD_QTY),0) ERINDQTY,
      ISNULL(SUM(CASE WHEN IS_STATUS in (1, 5) THEN MD_QTY ELSE 0 END), 0) EINDWT,
      ISNULL(SUM(MD_QTY), 0) OTINDQTY,
      ISNULL(SUM(CASE WHEN IS_STATUS in (1, 5) THEN MD_QTY ELSE 0 END), 0) OTINDWT
    FROM ISSUED
    LEFT JOIN MODE ON IS_MODE = MD_CODE AND MD_FACTORY = IS_FACTORY
    WHERE IS_FACTORY = @fact
      AND CONVERT(NVARCHAR, IS_DS_DT,112) BETWEEN @dtStart AND @dtEnd
    GROUP BY IS_FACTORY, IS_DS_DT
  ),
  CTE AS (
    SELECT M_FACTORY, M_IND_DT,
      ISNULL(SUM((M_GROSS - M_TARE - M_JOONA)), 0) OTACTWT,
      ISNULL(SUM(M_GROSS - M_TARE - M_JOONA), 0) EACTWT
    FROM PURCHASE
    LEFT JOIN MODE ON M_MODE = MD_CODE AND MD_FACTORY = M_FACTORY
    WHERE M_FACTORY = @fact
      AND CONVERT(NVARCHAR, M_IND_DT,112) BETWEEN @dtStart AND @dtEnd
    GROUP BY M_FACTORY, M_IND_DT
  )
  SELECT IS_FACTORY,
    CONVERT(NVARCHAR, IS_DS_DT, 103) IS_IS_DT,
    ISNULL(ERINDQTY, 0) ERINDQTY,
    ISNULL(EINDWT, 0) EINDWT,
    ISNULL(EACTWT, 0) EACTWT,
    '0' AS EPURCHYPERC,
    '0' AS EWTPERC,
    (ISNULL(ERINDQTY, 0) - ISNULL(EINDWT, 0)) AS RunningBal,
    '0' AS MBPrvDate,
    '0' AS TdWtIndent,
    '0' AS TdAvgPrec,
    '0' AS MBCurDate,
    '0' AS Expectedwttoday
  FROM CT
  LEFT JOIN CTE ON CT.IS_DS_DT = CTE.M_IND_DT AND CT.IS_FACTORY = CTE.M_FACTORY
  ORDER BY CT.IS_DS_DT`;

const IND_FAIL_TODAY_TOTAL_SQL = `
  select sum(m_gross-m_tare-m_joona) Qty
  from Purchase
  join mode on m_mode = md_code and M_FACTORY = md_factory
  where cast(M_DATE as date) = @mdate and M_FACTORY = @fact`;

const IND_FAIL_PBAL_SQL = `
  with cte as (
    select m_ind_dt, sum(md_qty) pdqty
    from Purchase
    join mode on m_mode = md_code and M_FACTORY = md_factory
    where M_FACTORY = @fact and cast(M_DATE as date) < @ppdate
    group by m_ind_dt
  ),
  ct1 as (
    select m_ind_dt, sum(md_qty) cuqty
    from Purchase
    join mode on m_mode = md_code and M_FACTORY = md_factory
    where M_FACTORY = @fact and cast(M_DATE as date) < @cdate
    group by m_ind_dt
  )
  select ct1.M_IND_DT, isnull(pdqty,0) pdqty, isnull(cuqty,0) cuqty
  from cte right join ct1 on cte.M_IND_DT = ct1.M_IND_DT
  where CONVERT(NVARCHAR, ct1.M_IND_DT,112) = @isdate
  order by ct1.M_IND_DT`;

const IND_FAIL_TODAY_WEIGHT_SQL = `
  select m_ind_dt, sum(m_gross-m_tare-m_joona) Qty
  from Purchase
  join mode on m_mode = md_code and M_FACTORY = md_factory
  where cast(M_DATE as date) = @mdate
    and cast(m_ind_dt as date) = @idate
    and M_FACTORY = @fact
  group by m_ind_dt`;

const IND_FAIL_DETAIL_SQL = `
  WITH CT AS(
    SELECT IS_FACTORY, IS_CNT_CD, C_NAME,
      ISNULL(SUM(CASE WHEN IS_CATEG in(10,11,12,13) THEN MD_QTY ELSE 0 END),0) ERINDQTY,
      ISNULL(SUM(CASE WHEN IS_CATEG in (10, 11, 12, 13) and IS_STATUS in (1, 5) THEN MD_QTY ELSE 0 END), 0) EINDWT,
      ISNULL(SUM(CASE WHEN IS_CATEG not in (10, 11, 12, 13) THEN MD_QTY ELSE 0 END), 0) OTINDQTY,
      ISNULL(SUM(CASE WHEN IS_CATEG not in (10, 11, 12, 13) and IS_STATUS in (1, 5) THEN MD_QTY ELSE 0 END), 0) OTINDWT
    FROM ISSUED
    LEFT JOIN MODE ON IS_MODE = MD_CODE AND MD_FACTORY = IS_FACTORY
    JOIN CENTRE ON IS_CNT_CD = C_CODE AND C_FACTORY = IS_FACTORY
    WHERE IS_FACTORY = @fact AND CONVERT(NVARCHAR, IS_DS_DT,112) = @dt
    GROUP BY IS_FACTORY, IS_CNT_CD, C_NAME
  ),
  CTE AS(
    SELECT M_FACTORY, IS_CNT_CD, C_NAME,
      ISNULL(SUM(CASE WHEN M_CATEG not in(10,11,12,13) THEN (M_GROSS - M_TARE - M_JOONA) ELSE 0 END),0) OTACTWT,
      ISNULL(SUM(CASE WHEN M_CATEG in(10,11,12,13) THEN (M_GROSS - M_TARE - M_JOONA) ELSE 0 END),0) EACTWT
    FROM PURCHASE p
    LEFT JOIN MODE ON M_MODE = MD_CODE AND MD_FACTORY = M_FACTORY
    JOIN ISSUED i on i.IS_FACTORY = p.m_factory and i.IS_SPRNO = p.M_IND_NO
    JOIN CENTRE ON i.IS_CNT_CD = C_CODE AND i.IS_FACTORY = C_FACTORY
    WHERE M_FACTORY = @fact AND CONVERT(NVARCHAR, M_IND_DT,112) = @dt
    GROUP BY M_FACTORY, IS_CNT_CD, C_NAME
  )
  SELECT CT.IS_FACTORY, CT.IS_CNT_CD, CT.C_NAME,
    ISNULL(ERINDQTY,0) ERINDQTY,
    ISNULL(EINDWT,0) EINDWT,
    ISNULL(EACTWT,0) EACTWT,
    '0' AS EPURCHYPERC,'0' AS EWTPERC,
    ISNULL(OTINDQTY, 0) OTINDQTY,
    ISNULL(OTINDWT, 0) OTINDWT,
    ISNULL(OTACTWT, 0) OTACTWT,
    '0' AS OTPURCHYPERC,'0' AS OTWTPERC,
    ISNULL((ERINDQTY + OTINDQTY), 0) TOTINDQTY,
    ISNULL((EINDWT + OTINDWT), 0) TOTINDWT,
    ISNULL((EACTWT + OTACTWT), 0) TOTACTWT,
    '0' AS TOTPURCHYPERC,'0' AS TOTWTPERC,
    ISNULL(((ERINDQTY + OTINDQTY) - (EINDWT + OTINDWT)), 0) BALTOTINDQTY,
    '0' AS PIPBALIND,'0' AS TOTBALIND
  FROM CT
  LEFT JOIN CTE on CT.IS_CNT_CD = CTE.IS_CNT_CD AND CT.IS_FACTORY = CTE.M_FACTORY
  ORDER BY CT.IS_FACTORY, CT.IS_CNT_CD`;

const IND_FAIL_DETAIL_2DAY_SQL = `
  WITH CT AS(
    SELECT IS_FACTORY, IS_DS_DT, IS_CNT_CD,
      ISNULL(SUM(CASE WHEN IS_CATEG in(10,11,12,13) THEN MD_QTY ELSE 0 END),0) TDERINDQTY,
      ISNULL(SUM(CASE WHEN IS_CATEG in (10, 11, 12, 13) and IS_STATUS in (1, 5) THEN MD_QTY ELSE 0 END), 0) TDEINDWT,
      ISNULL(SUM(CASE WHEN IS_CATEG not in (10, 11, 12, 13) THEN MD_QTY ELSE 0 END), 0) TDOTINDQTY,
      ISNULL(SUM(CASE WHEN IS_CATEG not in (10, 11, 12, 13) and IS_STATUS in (1, 5) THEN MD_QTY ELSE 0 END), 0) TDOTINDWT
    FROM ISSUED
    LEFT JOIN MODE ON IS_MODE = MD_CODE AND MD_FACTORY = IS_FACTORY
    JOIN CENTRE ON IS_CNT_CD = C_CODE AND C_FACTORY = IS_FACTORY
    WHERE IS_FACTORY = @fact
      AND CONVERT(NVARCHAR, IS_DS_DT,112) BETWEEN dateadd(d,-2,@dt) AND dateadd(d,-1,@dt)
      AND IS_CNT_CD = @center
    GROUP BY IS_FACTORY, IS_DS_DT, IS_CNT_CD
  ),
  CTE AS(
    SELECT M_FACTORY, M_IND_DT, M_CENTRE
    FROM PURCHASE
    LEFT JOIN MODE ON M_MODE = MD_CODE AND MD_FACTORY = M_FACTORY
    JOIN CENTRE ON M_CENTRE = C_CODE AND M_FACTORY = C_FACTORY
    WHERE M_FACTORY = @fact
      AND CONVERT(NVARCHAR, M_IND_DT,112) BETWEEN dateadd(d,-2,@dt) AND dateadd(d,-1,@dt)
      AND M_CENTRE = @center
    GROUP BY M_FACTORY, M_IND_DT, M_CENTRE
  )
  SELECT CT.IS_FACTORY, CONVERT(NVARCHAR, CT.IS_DS_DT,103) IS_DS_DT, CT.IS_CNT_CD,
    (TDERINDQTY + TDOTINDQTY) TDQTY,
    (TDEINDWT + TDOTINDWT) TDWT,
    ((TDERINDQTY + TDOTINDQTY) - (TDEINDWT + TDOTINDWT)) BAL
  FROM CT
  LEFT JOIN CTE on CT.IS_DS_DT = CTE.M_IND_DT AND CT.IS_CNT_CD = CTE.M_CENTRE AND CT.IS_FACTORY = CTE.M_FACTORY
  ORDER BY CT.IS_DS_DT`;

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

async function fetchIndentFailSummaryNewRows(fact, dtStart, dtEnd, season) {
  return executeQuery(IND_FAIL_NEW_SQL, { fact, dtStart, dtEnd }, season);
}

async function fetchIndentFailTodayTotalWeight(fact, mdate, season) {
  return executeQuery(IND_FAIL_TODAY_TOTAL_SQL, { fact, mdate }, season);
}

async function fetchIndentFailPBal(fact, ppdate, cdate, isdate, season) {
  return executeQuery(IND_FAIL_PBAL_SQL, { fact, ppdate, cdate, isdate }, season);
}

async function fetchIndentFailTodayWeight(fact, mdate, idate, season) {
  return executeQuery(IND_FAIL_TODAY_WEIGHT_SQL, { fact, mdate, idate }, season);
}

async function fetchIndentFailDetailRows(fact, dt, season) {
  return executeQuery(IND_FAIL_DETAIL_SQL, { fact, dt }, season);
}

async function fetchIndentFailDetail2DayBack(fact, dt, center, season) {
  return executeQuery(IND_FAIL_DETAIL_2DAY_SQL, { fact, dt, center }, season);
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
  fetchDriageClerkClosingBalance,
  fetchIndentFailSummaryNewRows,
  fetchIndentFailTodayTotalWeight,
  fetchIndentFailPBal,
  fetchIndentFailTodayWeight,
  fetchIndentFailDetailRows,
  fetchIndentFailDetail2DayBack
};
