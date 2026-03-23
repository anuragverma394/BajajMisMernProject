const { executeProcedure, executeQuery } = require('../../core/db/query-executor');
const { config } = require('../../../../../shared/lib/config');

function logProcError(scope, details) {
  console.error(`[ReportNewRepository] ${scope} error:`, details);
}

async function executeProcedureWithFallback(procName, params, season) {
  try {
    return await executeProcedure(procName, params, season);
  } catch (error) {
    const message = String(error?.message || '');
    if (!message.toLowerCase().includes('could not find stored procedure')) {
      throw error;
    }
    // Try schema-qualified name
    const dboName = procName.startsWith('dbo.') ? procName : `dbo.${procName}`;
    try {
      return await executeProcedure(dboName, params, season);
    } catch (dboError) {
      if (!String(dboError?.message || '').toLowerCase().includes('could not find stored procedure')) {
        throw dboError;
      }
      // Safe fallback: return empty result for missing proc
      return { rows: [], recordsets: [], rowsAffected: [] };
    }
  }
}

/**
 * Get Hourly Cane Arrival Weight
 */
async function getHourlyCaneArrivalWeight(season) {
  try {
    const procName = 'sp_GetHourlyCaneArrivalWeight';
    const params = { Season: season };
    const result = await executeProcedureWithFallback(procName, params, season);
    return result?.rows || result?.recordsets?.[0] || [];
  } catch (error) {
    logProcError('getHourlyCaneArrivalWeight', {
      message: error.message,
      procedure: 'sp_GetHourlyCaneArrivalWeight',
      params: { Season: season },
      season,
      database: config?.DB_NAME || process.env.DB_NAME
    });
    throw error;
  }
}

function toSqlDate(raw) {
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

function addDays(isoDate, days) {
  const [y, m, d] = isoDate.split('-').map((v) => parseInt(v, 10));
  const dt = new Date(y, m - 1, d);
  dt.setDate(dt.getDate() + days);
  const yyyy = dt.getFullYear();
  const mm = String(dt.getMonth() + 1).padStart(2, '0');
  const dd = String(dt.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

/**
 * Get Indent Purchase Report New
 */
async function getIndentPurchaseReportNew(params = {}, season) {
  try {
    let factory = String(params.F_code || params.F_Code || params.factory || '').trim();
    if (factory.toLowerCase() === 'all') factory = '0';
    const rawDate = String(params.Fdate || params.Date || params.date || '').trim();
    const zonefrom = String(params.Zone || params.zone || '0').trim();
    const zoneto = String(params.ZoneTo || params.zoneTo || '9999').trim();

    const date = toSqlDate(rawDate);
    if (!factory || !date) {
      return [];
    }

    const day1 = addDays(date, -1);
    const day2 = addDays(date, -2);
    const nextdate = addDays(date, 1);

    const baseParams = {
      factory,
      date,
      day1,
      day2,
      nextdate,
      zonefrom,
      zoneto
    };

    const getAllZoneSql = zonefrom && zoneto
      ? `select bL_code blk_code,bL_name blk_name,sum(onedaysbalnace)onedaysbalnace,sum(twodaysdaysbalnace)twodaysdaysbalnace,
sum(TodayIndent)TodayIndent,sum(totalindenttoday)totalindenttoday,sum(purchase)purchase,
round(((case when sum(purchase) > 0 then(sum(purchase) / sum(totalindenttoday)) * 100 else 0 end)),0)mature,
sum(backonedaysbalnace)backonedaysbalnace,sum(backtwodaysdaysbalnace)backtwodaysdaysbalnace,sum(backTodayIndent)backTodayIndent,sum(backbalanceindent)backbalanceindent
from(select bL_code, bL_name, c_code, c_name,onedaysbalnace, twodaysdaysbalnace, TodayIndent,
onedaysbalnace+twodaysdaysbalnace + TodayIndent as totalindenttoday,purchase,
round(((case when(onedaysbalnace + twodaysdaysbalnace + TodayIndent) > 0 then(purchase / (onedaysbalnace + twodaysdaysbalnace + TodayIndent)) * 100 else 0 end )),0)Mature,
backonedaysbalnace,backtwodaysdaysbalnace,backTodayIndent,(backonedaysbalnace + backtwodaysdaysbalnace + backTodayIndent) as backbalanceindent
from(select bl_code, bl_name, c_code, c_name,
(round(isnull(sum(case when  cast(is_ds_dt as date) = @day2  and is_status = 0 then md_qty else 0 end),0),0)
 + round((select isnull(sum(m_gross - m_tare - m_joona), 0) from mill_pur join mode on md_code = m_mode and md_factory = M_FACTORY
where cast(m_ind_dt as date) = @day2 and m_centre = c_code and M_FACTORY = c_factory and cast(m_date as date) = @date),0))onedaysbalnace ,
(round(isnull(sum(case when  cast(is_ds_dt as date) = @day1  and is_status = 0 then md_qty else 0 end),0),0)
 + round((select isnull(sum(m_gross - m_tare - m_joona), 0) from mill_pur join mode on md_code = m_mode and md_factory = M_FACTORY
where cast(m_ind_dt as date) = @day1  and m_centre = c_code and M_FACTORY = c_factory and cast(m_date as date) = @date),0))twodaysdaysbalnace ,
(round(isnull(sum(case when  cast(is_ds_dt as date) = @date  and is_status = 0   then md_qty else 0 end),0),0)
 + round((select isnull(sum(m_gross - m_tare - m_joona), 0) from mill_pur join mode on md_code = m_mode and md_factory = M_FACTORY
where cast(m_ind_dt as date) = @date and m_centre = c_code and M_FACTORY = c_factory and cast(m_date as date) = @date),0))TodayIndent,
round(isnull((select sum(m_gross - m_tare - m_joona)  from Mill_Pur where m_centre = c_code and M_FACTORY = c_factory and cast(m_date as date) = @date), 0),0) as Purchase,
round(isnull(sum(case when  cast(is_ds_dt as date) = @day1   and is_status = 0 then md_qty else 0 end),0),0)backonedaysbalnace ,
round(isnull(sum(case when  cast(is_ds_dt as date) = @date  and is_status = 0 then md_qty else 0 end),0),0)backtwodaysdaysbalnace ,
round(isnull(sum(case when  cast(is_ds_dt as date) = @nextdate and is_status = 0  then md_qty else 0 end),0),0)backTodayIndent,
round(isnull((select sum(m_gross - m_tare - m_joona) from Mill_Pur where m_centre = c_code  and M_FACTORY = c_factory and cast(m_date as date) = @nextdate), 0),0) as backPurchase
from issued join centre on c_code = is_cnt_cd and c_factory = IS_FACTORY join block on bl_code = c_block and bl_factcode = c_factory
join mode on md_code = Issued.Is_Mode and md_factory = ISSUED.IS_FACTORY
where c_code!= 1 and bl_code between @zonefrom and @zoneto and c_factory = @factory
group by bl_code,bl_name,c_code,c_name,c_factory) AS X)AS V group by  bL_code,bL_name order by bL_name`
      : `select bL_code blk_code,bL_name blk_name,sum(onedaysbalnace)onedaysbalnace,sum(twodaysdaysbalnace)twodaysdaysbalnace,
sum(TodayIndent)TodayIndent,sum(totalindenttoday)totalindenttoday,sum(purchase)purchase,
round(((case when sum(purchase) > 0 then(sum(purchase) / sum(totalindenttoday)) * 100 else 0 end)),0)mature,
sum(backonedaysbalnace)backonedaysbalnace,sum(backtwodaysdaysbalnace)backtwodaysdaysbalnace,sum(backTodayIndent)backTodayIndent,sum(backbalanceindent)backbalanceindent
from(select bL_code, bL_name, c_code, c_name,onedaysbalnace, twodaysdaysbalnace, TodayIndent,
onedaysbalnace+twodaysdaysbalnace + TodayIndent as totalindenttoday,purchase,
round(((case when(onedaysbalnace + twodaysdaysbalnace + TodayIndent) > 0 then(purchase / (onedaysbalnace + twodaysdaysbalnace + TodayIndent)) * 100 else 0 end )),0)Mature,
backonedaysbalnace,backtwodaysdaysbalnace,backTodayIndent,(backonedaysbalnace + backtwodaysdaysbalnace + backTodayIndent) as backbalanceindent
from(select bl_code, bl_name, c_code, c_name,
(round(isnull(sum(case when  cast(is_ds_dt as date) = @day2  and is_status = 0 then md_qty else 0 end),0),0)
 + round((select isnull(sum(m_gross - m_tare - m_joona), 0) from mill_pur join mode on md_code = m_mode and md_factory = M_FACTORY
where cast(m_ind_dt as date) = @day2  and m_centre = c_code and M_FACTORY = c_factory and cast(m_date as date) = @date),0))onedaysbalnace ,
(round(isnull(sum(case when  cast(is_ds_dt as date) = @day1  and is_status = 0 then md_qty else 0 end),0),0)
 + round((select isnull(sum(m_gross - m_tare - m_joona), 0) from mill_pur join mode on md_code = m_mode and md_factory = M_FACTORY
where cast(m_ind_dt as date) = @day1  and m_centre = c_code and M_FACTORY = c_factory and cast(m_date as date) = @date),0))twodaysdaysbalnace ,
(round(isnull(sum(case when  cast(is_ds_dt as date) = @date  and is_status = 0   then md_qty else 0 end),0),0)
 + round((select isnull(sum(m_gross - m_tare - m_joona), 0) from mill_pur join mode on md_code = m_mode and md_factory = M_FACTORY
where cast(m_ind_dt as date) = @date and m_centre = c_code and M_FACTORY = c_factory and cast(m_date as date) = @date),0))TodayIndent,
round(isnull((select sum(m_gross - m_tare - m_joona)  from Mill_Pur where m_centre = c_code and M_FACTORY = c_factory and cast(m_date as date) = @date), 0),0) as Purchase,
round(isnull(sum(case when  cast(is_ds_dt as date) = @day1   and is_status = 0 then md_qty else 0 end),0),0)backonedaysbalnace ,
round(isnull(sum(case when  cast(is_ds_dt as date) = @date  and is_status = 0 then md_qty else 0 end),0),0)backtwodaysdaysbalnace ,
round(isnull(sum(case when  cast(is_ds_dt as date) = @nextdate and is_status = 0  then md_qty else 0 end),0),0)backTodayIndent,
round(isnull((select sum(m_gross - m_tare - m_joona) from Mill_Pur where m_centre = c_code  and M_FACTORY = c_factory and cast(m_date as date) = @nextdate), 0),0) as backPurchase
from issued join centre on c_code = is_cnt_cd and c_factory = IS_FACTORY join block on bl_code = c_block and bl_factcode = c_factory
join mode on md_code = Issued.Is_Mode and md_factory = ISSUED.IS_FACTORY
where c_code!= 1 and c_factory = @factory
group by bl_code,bl_name,c_code,c_name,c_factory) AS X)AS V group by  bL_code,bL_name order by bL_name`;

    const getAllZone1Sql = zonefrom && zoneto
      ? `select bL_code blk_code,bL_name blk_name,sum(onedaysbalnace)onedaysbalnace,sum(twodaysdaysbalnace)twodaysdaysbalnace,
sum(TodayIndent)TodayIndent,sum(totalindenttoday)totalindenttoday,sum(purchase)purchase,
round(((case when sum(purchase)>0 then (sum(purchase)/sum(totalindenttoday))*100 else 0 end)),0)mature,
sum(backonedaysbalnace)backonedaysbalnace,sum(backtwodaysdaysbalnace)backtwodaysdaysbalnace,sum(backTodayIndent)backTodayIndent,
sum(backbalanceindent)backbalanceindent from
(select  bl_code,bl_name, c_code, c_name,onedaysbalnace,twodaysdaysbalnace,TodayIndent,
onedaysbalnace+twodaysdaysbalnace+TodayIndent as totalindenttoday,purchase,
round(((case when (onedaysbalnace+twodaysdaysbalnace+TodayIndent)>0 then (purchase/ (onedaysbalnace+twodaysdaysbalnace+TodayIndent))*100 else 0 end )),0) Mature,
backonedaysbalnace,backtwodaysdaysbalnace,backTodayIndent,(backonedaysbalnace+backtwodaysdaysbalnace+backTodayIndent) as backbalanceindent   from
( 
select bl_code,bl_name, c_code, c_name,
(round(isnull(sum(case when  cast(is_ds_dt as date)=@day2  and is_status = 0 then md_qty else 0 end),0),0)
 + round((select isnull(sum(m_gross-m_tare-m_joona),0) from mill_pur join mode on md_code=m_mode and md_factory=M_FACTORY
where cast(m_ind_dt as date)=@day2 and m_centre=c_code and M_FACTORY=c_factory and cast(m_date as date) = @date),0))onedaysbalnace ,
(round(isnull(sum(case when  cast(is_ds_dt as date)=@day1  and is_status = 0 then md_qty else 0 end),0),0)
 + round((select isnull(sum(m_gross-m_tare-m_joona),0) from mill_pur join mode on md_code=m_mode and md_factory=M_FACTORY
where cast(m_ind_dt as date)= @day1 and m_centre=c_code and M_FACTORY=c_factory and cast(m_date as date) = @date),0))twodaysdaysbalnace ,
(round(isnull(sum(case when  cast(is_ds_dt as date) = @date  and is_status = 0   then md_qty else 0 end),0),0)
 + round((select isnull(sum(m_gross-m_tare-m_joona),0) from mill_pur join mode on md_code=m_mode and md_factory=M_FACTORY
where cast(m_ind_dt as date)= @date and m_centre=c_code and M_FACTORY=c_factory and cast(m_date as date) = @date),0))TodayIndent,
round(isnull((select sum(m_gross - m_tare - m_joona) from Mill_Pur where m_centre = c_code and M_FACTORY=c_factory and cast(m_date as date) = @date),0),0) as Purchase,
round(isnull(sum(case when  cast(is_ds_dt as date)= @day1   and is_status = 0 then md_qty else 0 end),0),0)backonedaysbalnace ,
round(isnull(sum(case when  cast(is_ds_dt as date)= @date  and is_status = 0 then md_qty else 0 end),0),0)backtwodaysdaysbalnace ,
round(isnull(sum(case when  cast(is_ds_dt as date) = @nextdate and is_status = 0  then md_qty else 0 end),0),0)backTodayIndent,
round(isnull((select sum(m_gross - m_tare - m_joona) from Mill_Pur where m_centre = c_code and M_FACTORY=c_factory  and cast(m_date as date) = @nextdate),0),0) as backPurchase
from issued  join centre on c_code = is_cnt_cd  and c_factory = IS_FACTORY left join block on bL_code = c_block and bl_factcode=c_factory
join mode on md_code = Issued.Is_Mode and md_factory=ISSUED.IS_FACTORY
where c_code=100 and bL_code between @zonefrom and @zoneto group by c_factory,bl_code,bl_name,c_code,c_name  )as x) as u group by  bL_code,bL_name  order by bL_name`
      : `select bL_code blk_code,bL_name blk_name,sum(onedaysbalnace)onedaysbalnace,sum(twodaysdaysbalnace)twodaysdaysbalnace,
sum(TodayIndent)TodayIndent,sum(totalindenttoday)totalindenttoday,sum(purchase)purchase,
round(((case when sum(purchase)>0 then (sum(purchase)/sum(totalindenttoday))*100 else 0 end)),0)mature,
sum(backonedaysbalnace)backonedaysbalnace,sum(backtwodaysdaysbalnace)backtwodaysdaysbalnace,sum(backTodayIndent)backTodayIndent,
sum(backbalanceindent)backbalanceindent from
(select  bl_code,bl_name, c_code, c_name,onedaysbalnace,twodaysdaysbalnace,TodayIndent,
onedaysbalnace+twodaysdaysbalnace+TodayIndent as totalindenttoday,purchase,
round(((case when (onedaysbalnace+twodaysdaysbalnace+TodayIndent)>0 then (purchase/ (onedaysbalnace+twodaysdaysbalnace+TodayIndent))*100 else 0 end )),0) Mature,
backonedaysbalnace,backtwodaysdaysbalnace,backTodayIndent,(backonedaysbalnace+backtwodaysdaysbalnace+backTodayIndent) as backbalanceindent   from
( 
select bl_code,bl_name, c_code, c_name,
(round(isnull(sum(case when  cast(is_ds_dt as date)=@day2  and is_status = 0 then md_qty else 0 end),0),0)
 + round((select isnull(sum(m_gross-m_tare-m_joona),0) from mill_pur join mode on md_code=m_mode and md_factory=M_FACTORY
where cast(m_ind_dt as date)=@day2 and m_centre=c_code and M_FACTORY=c_factory and cast(m_date as date) = @date),0))onedaysbalnace ,
(round(isnull(sum(case when  cast(is_ds_dt as date)=@day1  and is_status = 0 then md_qty else 0 end),0),0)
 + round((select isnull(sum(m_gross-m_tare-m_joona),0) from mill_pur join mode on md_code=m_mode and md_factory=M_FACTORY
where cast(m_ind_dt as date)= @day1 and m_centre=c_code and M_FACTORY=c_factory and cast(m_date as date) = @date),0))twodaysdaysbalnace ,
(round(isnull(sum(case when  cast(is_ds_dt as date) = @date  and is_status = 0   then md_qty else 0 end),0),0)
 + round((select isnull(sum(m_gross-m_tare-m_joona),0) from mill_pur join mode on md_code=m_mode and md_factory=M_FACTORY
where cast(m_ind_dt as date)= @date and m_centre=c_code and M_FACTORY=c_factory and cast(m_date as date) = @date),0))TodayIndent,
round(isnull((select sum(m_gross - m_tare - m_joona) from Mill_Pur where m_centre = c_code and M_FACTORY=c_factory and cast(m_date as date) = @date),0),0) as Purchase,
round(isnull(sum(case when  cast(is_ds_dt as date)= @day1   and is_status = 0 then md_qty else 0 end),0),0)backonedaysbalnace ,
round(isnull(sum(case when  cast(is_ds_dt as date)= @date  and is_status = 0 then md_qty else 0 end),0),0)backtwodaysdaysbalnace ,
round(isnull(sum(case when  cast(is_ds_dt as date) = @nextdate and is_status = 0  then md_qty else 0 end),0),0)backTodayIndent,
round(isnull((select sum(m_gross - m_tare - m_joona) from Mill_Pur where m_centre = c_code and M_FACTORY=c_factory  and cast(m_date as date) = @nextdate),0),0) as backPurchase
from issued  join centre on c_code = is_cnt_cd  and c_factory = IS_FACTORY left join block on bL_code = c_block and bl_factcode=c_factory
join mode on md_code = Issued.Is_Mode and md_factory=ISSUED.IS_FACTORY
where c_code=100  group by c_factory,bl_code,bl_name,c_code,c_name  )as x) as u group by  bL_code,bL_name  order by bL_name`;

    const zoneRows = await executeQuery(getAllZoneSql, baseParams, season);
    const zoneRows1 = await executeQuery(getAllZone1Sql, baseParams, season);

    return {
      gateRows: zoneRows1 || [],
      zoneRows: zoneRows || []
    };
  } catch (error) {
    console.error('[ReportNewRepository] getIndentPurchaseReportNew error:', error.message);
    throw error;
  }
}

/**
 * Mutate Indent Purchase Report
 */
async function mutateIndentPurchaseReport(model, command) {
  try {
    const procName = command === 'Delete' ? 'sp_DeleteIndentPurchaseReport' : 'sp_UpsertIndentPurchaseReport';
    const result = await executeProcedure(procName, { ...model, Command: command });
    return result || { success: true };
  } catch (error) {
    console.error('[ReportNewRepository] mutateIndentPurchaseReport error:', error.message);
    throw error;
  }
}

/**
 * Get Center Indent Purchase Report
 */
async function getCenterIndentPurchaseReport(centerCode, season) {
  try {
    const result = await executeProcedure('sp_GetCenterIndentPurchaseReport', { CenterCode: centerCode, Season: season });
    return result || [];
  } catch (error) {
    console.error('[ReportNewRepository] getCenterIndentPurchaseReport error:', error.message);
    throw error;
  }
}

/**
 * Get Centre Purchase Truck Report New
 */
async function getCentrePurchaseTruckReportNew(params = {}, season) {
  try {
    const factory = String(params.F_code || params.F_Code || params.factory || '').trim();
    const fromRaw = String(params.FromDate || params.fromDate || '').trim();
    const toRaw = String(params.ToDate || params.toDate || '').trim();
    const zonefrom = String(params.Zone || params.zone || '0').trim();
    const zoneto = String(params.ZoneTo || params.zoneTo || '9999').trim();

    if (!factory || factory.toLowerCase() === 'all') {
      return [];
    }

    const FDate = toSqlDate(fromRaw);
    const TDate = toSqlDate(toRaw);
    if (!FDate || !TDate) {
      return [];
    }

    const sqlText = `
      select CDO_NAME,CDO_CODE,bl_code blk_code,
        CONCAT(bl_name,'(', bl_code, ')',  '  /  '  , CDO_NAME, '(', CDO_CODE, ')') AS blk_name,
        sum(openingbalance) openingbalance,
        sum(isnull(qty,0)) Cane,
        sum(isnull(purchy,0)) purchy,
        sum(isnull(TotalCane,0)) TotalCane,
        sum(isnull(openingreceipt,0)) openingreceipt,
        sum(VehicleDispatch) VehicleDispatch,
        sum(VehicleReceive) VehicleReceive,
        sum(Standingyard) Standingyard,
        sum(standingYardWeight) standingYardWeight,
        sum(NosTransit) NosTransit,
        sum(TransitWeight) TransitWeight,
        sum(WeightedNos) WeightedNos,
        sum(WeightedQty) WeightedQty,
        sum(BalanceTruck) BalanceTruck,
        sum(expqty) expqty
      from (
        select CDO_NAME,CDO_CODE,bl_code,bl_name,c_code,c_name,C_AVGWEIGHTCHALLAN,
          isnull((select sum(m_gross-m_tare-m_joona) from Purchase
                  where m_centre=c_code and m_factory=c_factory and cast(m_date as date) < @Date),0) as openingbalance,
          isnull((select sum(m_gross-m_tare-m_joona) from mill_pur
                  where m_centre=c_code and m_factory=c_factory and cast(m_date as date) between @Date and @Date1),0) qty,
          isnull((select count(*) from mill_pur
                  where m_centre=c_code and m_factory=c_factory and cast(m_date as date) between @Date and @Date1),0) purchy,
          (isnull((select sum(m_gross-m_tare-m_joona) from Purchase
                   where m_centre=c_code and m_factory=c_factory and cast(m_date as date) < @Date),0)
           + isnull((select sum(m_gross - m_tare - m_joona) from mill_pur
                     where m_centre=c_code and m_factory=c_factory and cast(m_date as date) between @Date and @Date1),0)) TotalCane,
          isnull((select sum(tt_grossweight-tt_tareweight-tt_joonaWeight) from Receipt
                  where tt_center= c_code and tt_factory=c_factory and tt_tareWeight> 0 and cast(tt_date as date) < @Date),0) openingreceipt,
          (select COUNT(*) from challan_final
           where c_code= Ch_Centre and c_factory=ch_Factory and ch_cancel = 0 and cast(ch_dep_date as date) between @Date and @Date1) VehicleDispatch,
          (select COUNT(*) from challan_final
           where c_code= Ch_Centre and c_factory=ch_Factory and ch_status=5 and ch_cancel = 0 and cast(ch_dep_date as date) between @Date and @Date1) VehicleReceive,
          ((select COUNT(*) from T_Token where tt_cnt=c_code  and  c_factory=TT_FACTORY)
            + (select count(*) from Receipt where tt_center= c_code and tt_factory=c_factory and tt_tareWeight=0)) Standingyard,
          ((select COUNT(*) from T_Token where tt_cnt=c_code  and  c_factory=TT_FACTORY)
            + (select count(*) from Receipt where tt_center= c_code and tt_factory=c_factory and tt_tareWeight=0)) * C_AVGWEIGHTCHALLAN standingYardWeight,
          (select COUNT(*) from challan_final
           where c_code = Ch_Centre and c_factory = ch_Factory and cast(ch_dep_date as date) between @Date and @Date1
             and (ch_status = 0) and ch_cancel = 0
             and not exists(Select 1 from T_TOKEN where tt_chln = ch_challan and TT_FACTORY = ch_Factory)) NosTransit,
          (select COUNT(*) from challan_final
           where c_code = Ch_Centre and c_factory = ch_Factory and cast(ch_dep_date as date) between @Date and @Date1
             and (ch_status = 0) and ch_cancel = 0
             and ch_challan not in (Select TT_CHLN from T_TOKEN where TT_FACTORY = ch_Factory)) * C_AVGWEIGHTCHALLAN TransitWeight,
          (Select count(*) from Receipt
           where cast(tt_date as date) between @Date and @Date1 and tt_center =c_code  AND tt_factory=c_factory and isnull(tt_tareWeight,0)>0) WeightedNos,
          (Select isnull(Sum(tt_grossWeight-tt_tareWeight-tt_joonaWeight),0) from Receipt
           where cast(tt_date as date) between @Date and @Date1 and tt_center =c_code and tt_factory=c_factory AND isnull(tt_tareWeight,0)>0) WeightedQty,
          0 as BalanceTruck,0 as expqty
        from centre
        join block on bl_code=c_block and bl_factcode=c_factory
        join cdo_mst on bl_factcode = CDO_Factcode and bl_inchargecode = CDO_CODE
        where bl_code between @zonefrom and @zoneto and bl_factcode= @F_code
        group by c_factory,bl_code,bl_name,c_code,c_name,C_AVGWEIGHTCHALLAN,CDO_NAME,CDO_CODE
      ) as x
      group by bl_code, bl_name ,CDO_NAME,CDO_CODE`;

    const rows = await executeQuery(sqlText, { Date: FDate, Date1: TDate, zonefrom, zoneto, F_code: factory }, season);
    return rows || [];
  } catch (error) {
    console.error('[ReportNewRepository] getCentrePurchaseTruckReportNew error:', error.message);
    throw error;
  }
}

/**
 * Mutate Centre Purchase Truck Report
 */
async function mutateCentrePurchaseTruckReport(model, command) {
  try {
    const procName = command === 'Delete' ? 'sp_DeleteCentrePurchaseTruckReport' : 'sp_UpsertCentrePurchaseTruckReport';
    const result = await executeProcedure(procName, { ...model, Command: command });
    return result || { success: true };
  } catch (error) {
    console.error('[ReportNewRepository] mutateCentrePurchaseTruckReport error:', error.message);
    throw error;
  }
}

/**
 * Get Zone Centre Wise Truck Details
 */
async function getZoneCentreWiseTruckDetails(params = {}, season) {
  try {
    const gatecode = String(params.ID || params.id || params.zone || params.Zone || '').trim();
    const factory = String(params.Factory || params.factory || params.F_code || params.F_Code || '').trim();
    const fromRaw = String(params.DATE || params.Date || params.fromDate || params.FromDate || '').trim();
    const toRaw = String(params.DATETO || params.DateTo || params.ToDate || params.toDate || '').trim();

    if (!gatecode || !factory) return [];

    const Date = toSqlDate(fromRaw);
    const Date1 = toSqlDate(toRaw || fromRaw);
    if (!Date || !Date1) return [];

    const sqlText = `
      select  c_code,CONCAT(c_code, ' - ', c_name ) AS c_name, C_AVGWEIGHTCHALLAN cnt_avg_wt,
      isnull((select sum(m_gross - m_tare - m_joona)
        from purchase where m_centre = c_code and m_factory=c_factory and cast(m_date as date) < @Date),0) as openingbalance,
      isnull((select sum(m_gross - m_tare - m_joona) from mill_pur where m_centre = c_code and m_factory=c_factory and cast(m_date as date) between @Date and @Date1),0)qty,
      isnull((select Count(*) from mill_pur where m_centre = c_code and m_factory = c_factory  and cast(m_date as date) between @Date and @Date1),0)purchy,
      (isnull((select sum(m_gross - m_tare - m_joona) from purchase where m_centre = c_code and m_factory = c_factory  and cast(m_date as date)  < @Date), 0) +
       isnull((select sum(m_gross - m_tare - m_joona) from mill_pur where m_centre = c_code and m_factory = c_factory and cast(m_date as date) between @Date and @Date1),0))TotalCane ,
      isnull((select sum(tt_grossweight-tt_tareweight-tt_joonaWeight) from Receipt where tt_center= c_code and tt_factory=c_factory and tt_tareWeight> 0 and cast(tt_date as date) < @Date),0) openingreceipt,
      (select COUNT(*) from challan_final where c_code = Ch_Centre and c_factory = ch_Factory and cast(ch_dep_date as date) between @Date and @Date1 )VehicleDispatch,
      (select COUNT(*) from challan_final where c_code = Ch_Centre and c_factory = ch_Factory and ch_status = 5 and ch_cancel = 0 and cast(ch_dep_date as date) between @Date and @Date1)VehicleReceive,
      ((select COUNT(*) from T_Token where tt_cnt=c_code  and  c_factory=TT_FACTORY  )+(select count(*) from Receipt where tt_center = c_code and tt_factory = c_factory and tt_tareWeight = 0))  Standingyard,
      ((select COUNT(*) from T_Token where tt_cnt=c_code  and  c_factory=TT_FACTORY  )+(select count(*) from Receipt where tt_center = c_code and tt_factory = c_factory and tt_tareWeight = 0))*C_AVGWEIGHTCHALLAN standingYardWeight,
      (select COUNT(*) from challan_final where c_code = Ch_Centre and c_factory = ch_Factory and cast(ch_dep_date as date) between @Date and @Date1 and(ch_status = 0)  and  ch_cancel=0 and ch_challan not  in
        (Select TT_CHLN from  T_TOKEN where TT_FACTORY = ch_Factory ) )NosTransit,
      (select COUNT(*) from challan_final where c_code = Ch_Centre and c_factory = ch_Factory and cast(ch_dep_date as date) between @Date and @Date1 and(ch_status = 0)  and  ch_cancel=0 and ch_challan not  in(Select TT_CHLN from  T_TOKEN where TT_FACTORY = ch_Factory  ) )*C_AVGWEIGHTCHALLAN TransitWeight,
      (Select count(*) from Receipt where cast(tt_date as date) between @Date and @Date1  and tt_center = c_code  AND tt_factory = c_factory  AND isnull(tt_tareWeight, 0) > 0)WeightedNos,
      (Select isnull(Sum(tt_grossWeight - tt_tareWeight - tt_joonaWeight), 0) from Receipt where cast(tt_date as date) between @Date and @Date1  and tt_center = c_code and tt_factory = c_factory  AND isnull(tt_tareWeight, 0) > 0)WeightedQty,
      0 as BalanceTruck,0 as expqty
      from centre join block on bl_code = c_block and bl_factcode=c_factory
      where bl_code = @gatecode and bl_factcode = @Factory
      group by c_factory, c_code,c_name,C_AVGWEIGHTCHALLAN`;

    const rows = await executeQuery(sqlText, { Date, Date1, gatecode, Factory: factory }, season);
    return rows || [];
  } catch (error) {
    console.error('[ReportNewRepository] getZoneCentreWiseTruckDetails error:', error.message);
    throw error;
  }
}

/**
 * Get Center Balance Report
 */
async function getCenterBalanceReport(params = {}, season) {
  try {
    const fCodeRaw = String(
      params.F_code ?? params.F_Code ?? params.fcode ?? params.FACT ?? params.fact ?? ''
    ).trim();

    const cCodeRaw = String(
      params.c_code ?? params.C_code ?? params.C_Code ?? params.center ?? params.centre ?? ''
    ).trim();

    // Map "All" or "0" to empty string to match C# logic
    const fCode = (!fCodeRaw || fCodeRaw.toLowerCase() === 'all' || fCodeRaw === '0') ? '' : fCodeRaw;
    const cCode = (!cCodeRaw || cCodeRaw.toLowerCase() === 'all' || cCodeRaw === '0') ? '' : cCodeRaw;

    const options = { timeoutMs: 300000 };

    if (cCode && fCode) {
      // Specific center + factory
      const result = await executeProcedure('getCentBal', { fact: fCode, cent: cCode }, season, options);
      return result?.rows || [];
    } else {
      // All centers for a specific factory or all factories
      const result = await executeProcedure('getCentBalAll', { fact: fCode }, season, options);
      return result?.rows || [];
    }
  } catch (error) {
    console.error('[ReportNewRepository] getCenterBalanceReport error:', error.message);
    throw error;
  }
}

/**
 * Mutate Center Balance Report
 */
async function mutateCenterBalanceReport(model, command) {
  try {
    const procName = command === 'Delete' ? 'sp_DeleteCenterBalanceReport' : 'sp_UpsertCenterBalanceReport';
    const result = await executeProcedure(procName, { ...model, Command: command });
    return result || { success: true };
  } catch (error) {
    console.error('[ReportNewRepository] mutateCenterBalanceReport error:', error.message);
    throw error;
  }
}

/**
 * Get Centers for Factory
 */
async function getCentersForFactory(factoryCode, season) {
  try {
    const factory = String(factoryCode || '').trim();
    if (!factory) {
      return [];
    }
    const sqlText = `select distinct convert(nvarchar(12),c_code)c_code,c_name from Centre where c_factory=@fact`;
    const rows = await executeQuery(sqlText, { fact: factory }, season);
    return rows || [];
  } catch (error) {
    console.error('[ReportNewRepository] getCentersForFactory error:', error.message);
    throw error;
  }
}

/**
 * Get Cane Purchase Report
 */
async function getCanePurchaseReport(params, season) {
  try {
    const factory = String(params?.F_code ?? params?.F_Code ?? params?.factory ?? '').trim();
    const fromRaw = String(params?.FromDate ?? params?.fromDate ?? '').trim();
    const toRaw = String(params?.ToDate ?? params?.toDate ?? '').trim();

    if (!factory || factory === '0' || factory.toLowerCase() === 'all') {
      return { rows: [], extraRows: [] };
    }

    const FDate = toSqlDate(fromRaw);
    const TDate = toSqlDate(toRaw);
    if (!FDate || !TDate) {
      return { rows: [], extraRows: [] };
    }

    const queryParams = { Factory: factory, FDate, TDate };

    const mainSql = `select ROW_NUMBER() OVER (ORDER BY c_code) AS SrNo,c_code,c_name,
sum(case when CAST(m_date AS DATE) < @FDate then m_gross - m_tare - m_joona else 0 end )OpeningBalance,
sum(case when CAST(m_date AS DATE) BETWEEN @FDate AND @TDate then m_gross - m_tare - m_joona else 0 end )Period,
(sum(case when CAST(m_date AS DATE) < @FDate then m_gross - m_tare - m_joona else 0 end )+
sum(case when CAST(m_date AS DATE)  BETWEEN @FDate AND @TDate then m_gross - m_tare - m_joona else 0 end ))GrandTotal
from purchase join centre on c_code=m_centre and c_factory=m_factory
where M_FACTORY=@Factory
group by c_code,c_name
order by c_Code;`;

    const extraSql = `select c_code,c_name,
sum(case when CAST(m_date AS DATE) < @FDate then m_gross - m_tare - m_joona else 0 end )OpeningBalance,
sum(case when CAST(m_date AS DATE) between @FDate and @TDate then m_gross - m_tare - m_joona else 0 end )Period,
(sum(case when CAST(m_date AS DATE) < @FDate then m_gross - m_tare - m_joona else 0 end )+
sum(case when CAST(m_date AS DATE)  between @FDate and @TDate then m_gross - m_tare - m_joona else 0 end ))GrandTotal
from purchase join centre on c_code=m_centre and c_factory=m_factory
where M_FACTORY=@Factory and C_flag=1
group by c_code,c_name
union all
select ''c_code,'Out Centre'c_name,
sum(case when CAST(m_date AS DATE) < @FDate then m_gross - m_tare - m_joona else 0 end )OpeningBalance,
sum(case when CAST(m_date AS DATE)  between  @FDate and @TDate then m_gross - m_tare - m_joona else 0 end )Period,
(sum(case when CAST(m_date AS DATE) < @FDate then m_gross - m_tare - m_joona else 0 end )+
sum(case when CAST(m_date AS DATE)  between  @FDate and @TDate then m_gross - m_tare - m_joona else 0 end ))GrandTotal
from purchase join centre on c_code=m_centre and c_factory=m_factory
where M_FACTORY=@Factory and C_flag=0;`;

    const rows = await executeQuery(mainSql, queryParams, season);
    const extraRows = await executeQuery(extraSql, queryParams, season);

    return { rows: rows || [], extraRows: extraRows || [] };
  } catch (error) {
    console.error('[ReportNewRepository] getCanePurchaseReport error:', error.message);
    throw error;
  }
}

/**
 * Mutate Cane Purchase Report
 */
async function mutateCanePurchaseReport(model, command) {
  try {
    const procName = command === 'Delete' ? 'sp_DeleteCanePurchaseReport' : 'sp_UpsertCanePurchaseReport';
    const result = await executeProcedure(procName, { ...model, Command: command });
    return result || { success: true };
  } catch (error) {
    console.error('[ReportNewRepository] mutateCanePurchaseReport error:', error.message);
    throw error;
  }
}

/**
 * Get Sample Of Transporter
 */
function buildInClause(prefix, values, params) {
  const names = [];
  values.forEach((val, idx) => {
    const key = `${prefix}${idx}`;
    params[key] = val;
    names.push(`@${key}`);
  });
  return names.join(',');
}

async function getSampleOfTransporter(params = {}, season) {
  try {
    const fCodes = Array.isArray(params.fcodes) ? params.fcodes : [];
    const trCode = String(params.TR_CODE || '').trim();
    const fromDate = String(params.FromDate || '').trim();
    const toDate = String(params.ToDate || '').trim();

    if (!trCode || trCode === '3') {
      return [];
    }
    if (!fromDate || !toDate) {
      return [];
    }

    const baseParams = { fromDate, toDate };
    const inClause = fCodes.length ? buildInClause('f', fCodes, baseParams) : '';
    const factoryFilter = fCodes.length ? `AND p_factory IN (${inClause})` : '';

    let query = '';
    if (trCode === '1') {
      query = `
        SELECT
          P_Factory tt_factory,
          F_name,
          c_code tt_center,
          LEFT(tr_name,20) tr_name,
          LEFT(c_name,20) c_name,
          P_Challan_NO tt_chalanno,
          p_finwt - p_DiffWt AS tt_netWeight,
          p_finwt - p_DiffWt AS CaneWeight,
          P_Trans_Code tt_trans,
          P_FinWt ActualWt,
          P_DUE_AMT m_amount,
          P_DED_AMT Loan,
          P_HsdDed hsd,
          P_TDS tds,
          (P_DED_AMT - (P_RetDed + P_TDS)) otherded,
          (P_DED_AMT - (P_RetDed + P_TDS)) AS other,
          p_ActualAmt AS tt_netAmount,
          P_AdvDed adv,
          P_RetDed RetDed,
          P_PrPurPAYAMT PayAMT,
          P_DED_AMT Loan,
          P_Centre,
          P_TruckNo tt_truckno,
          CONVERT(VARCHAR(10), P_RecieptDate, 103) tt_date,
          P_ChallanCateg tt_canecateg,
          p_DiffWt AS diffwt,
          p_DiffAmt diffamt,
          P_BillNo billno,
          P_Rate Rate,
          p_NilltripFlg tt_nilltrip,
          TR_VENDOR_SAP,
          TR_PAN_NO,
          tr_accountno,
          tr_bankcode,
          tr_father,
          tr_phone,
          CONVERT(VARCHAR(10), p_date_fr, 103) p_date_fr,
          CONVERT(VARCHAR(10), p_date_to, 103) p_date_to
        FROM transpayment
        JOIN Transporter ON TR_CODE = P_Trans_Code AND P_Factory = TR_FACTORY
        JOIN Centre ON c_code = P_Centre AND c_factory = P_Factory
        JOIN Factory ON f_code = P_Factory
        WHERE 1=1 AND P_PayFlg = 1
          ${factoryFilter}
          AND CAST(P_RecieptDate AS date) BETWEEN @fromDate AND @toDate
        ORDER BY P_Factory, TR_CODE`;
    } else if (trCode === '2') {
      query = `
        SELECT
          P_Factory tt_factory,
          F_name,
          c_code tt_center,
          LEFT(co_name,20) tr_name,
          LEFT(c_name,20) c_name,
          P_Challan_NO tt_chalanno,
          p_finwt - p_DiffWt AS tt_netWeight,
          p_finwt - p_DiffWt AS CaneWeight,
          P_Trans_Code tt_trans,
          P_FinWt ActualWt,
          P_DUE_AMT m_amount,
          P_DED_AMT Loan,
          P_HsdDed hsd,
          P_TDS tds,
          (P_DED_AMT - (P_RetDed + P_TDS)) otherded,
          (P_DED_AMT - (P_RetDed + P_TDS)) AS other,
          p_ActualAmt AS tt_netAmount,
          P_AdvDed adv,
          P_RetDed RetDed,
          P_PrPurPAYAMT PayAMT,
          P_DED_AMT Loan,
          P_Centre,
          P_TruckNo tt_truckno,
          CONVERT(VARCHAR(10), P_RecieptDate, 103) tt_date,
          P_ChallanCateg tt_canecateg,
          p_DiffWt AS diffwt,
          p_DiffAmt diffamt,
          P_BillNo billno,
          P_Rate Rate,
          p_NilltripFlg tt_nilltrip,
          LD_VENDOR_SAP TR_VENDOR_SAP,
          LD_PAN_NO TR_PAN_NO,
          co_accountno tr_accountno,
          co_bankcode tr_bankcode,
          co_father tr_father,
          co_phone tr_phone,
          CONVERT(VARCHAR(10), p_date_fr, 103) p_date_fr,
          CONVERT(VARCHAR(10), p_date_to, 103) p_date_to
        FROM transpayment
        JOIN Contract ON co_code = P_Trans_Code AND P_Factory = co_factory
        JOIN Centre ON c_code = P_Centre AND c_factory = P_Factory
        JOIN Factory ON f_code = P_Factory
        WHERE 1=1 AND P_PayFlg = 2
          ${factoryFilter}
          AND CAST(P_RecieptDate AS date) BETWEEN @fromDate AND @toDate
        ORDER BY P_Factory, co_code`;
    }

    if (!query) return [];
    const result = await executeQuery(query, baseParams, season);
    return result || [];
  } catch (error) {
    console.error('[ReportNewRepository] getSampleOfTransporter error:', error.message);
    throw error;
  }
}

/**
 * Mutate Sample Of Transporter
 */
async function mutateSampleOfTransporter(model, command) {
  try {
    const procName = command === 'Delete' ? 'sp_DeleteSampleOfTransporter' : 'sp_UpsertSampleOfTransporter';
    const result = await executeProcedure(procName, { ...model, Command: command });
    return result || { success: true };
  } catch (error) {
    console.error('[ReportNewRepository] mutateSampleOfTransporter error:', error.message);
    throw error;
  }
}

/**
 * Get Zone By Factory
 */
async function getZoneByFactory(zone, userid, season) {
  try {
    const result = await executeProcedure('sp_GetZoneByFactory', { Zone: zone, Userid: userid }, season);
    return result?.rows || result?.recordsets?.[0] || result || [];
  } catch (error) {
    const msg = String(error?.message || '').toLowerCase();
    if (!msg.includes('could not find stored procedure')) {
      console.error('[ReportNewRepository] getZoneByFactory error:', error.message);
      return [];
    }
    const z = String(zone || '').trim();
    const u = String(userid || '').trim();
    const params = { zone: z, userid: u };
    let sql = `
      SELECT f_Code, f_Name + ' (' + F_Short + ')' AS F_Name, f_Name AS FName
      FROM MI_Factory
      WHERE 1=1`;
    if (u) {
      sql += ` AND f_code IN (SELECT FactID FROM MI_UserFact WHERE userid = @userid)`;
    }
    if (z && z !== '0') {
      sql += ` AND F_Zone = @zone`;
    }
    sql += ` ORDER BY SN ASC`;
    const rows = await executeQuery(sql, params, season);
    return rows || [];
  }
}

/**
 * Get Transporter By Factory
 */
async function getTransporterByFactory(factoryCode) {
  try {
    const result = await executeProcedure('sp_GetTransporterByFactory', { FactoryCode: factoryCode });
    return result || [];
  } catch (error) {
    console.error('[ReportNewRepository] getTransporterByFactory error:', error.message);
    throw error;
  }
}

/**
 * Get API Status Report
 */
async function getApiStatusReport(params = {}, season) {
  try {
    const rawFactory = String(params.F_code || params.F_Code || params.factory || '').trim();
    const type = String(params.Type || params.type || '0').trim();
    const apiType = String(params.ApiType || params.apiType || '0').trim();
    const fromDate = toSqlDate(params.FromDate || params.fromDate || '');
    const toDate = toSqlDate(params.ToDate || params.toDate || '');

    let sql = `
      select
        IT_DESC,
        oth_api_flag,
        OTH_API_REM,
        format(OTH_API_LHTM,'dd/MM/yyyy') OTH_API_LHTM,
        OTH_NO,
        OTH_ITEM,
        oth_tpt_nm,
        OTH_TRUCK,
        OTH_GROSS,
        OTH_TARE,
        format(OTH_GROSS_DATE,'dd/MM/yyyy') OTH_GROSS_DATE,
        OTH_GROSS_TIME,
        format(OTH_TARE_DATE,'dd/MM/yyyy') OTH_TARE_DATE,
        format(OTH_TAREDATETIME,'HH:mm:ss') OTH_TAREDATETIME,
        CASE
          WHEN oth_api_flag > 0 AND LEN(isnull(OTH_API_REM,'')) = 0 THEN 'Pending'
          WHEN OTH_API_REM LIKE '%Submitted successfully%' THEN 'Success'
          WHEN LEN(isnull(OTH_API_REM,'')) > 0 AND OTH_API_REM NOT LIKE '%Submitted successfully%' THEN 'Failed'
          ELSE 'Unknown'
        END AS Status
      from other_cane
      join OTHER_ITEM on OTH_ITEM = IT_CODE and OTH_FACTORY = IT_FACTORY
      where 1=1
    `;

    const sqlParams = {};

    const factoryList = rawFactory
      ? rawFactory.split(',').map((v) => v.trim()).filter(Boolean)
      : [];

    if (factoryList.length && !factoryList.includes('0')) {
      const placeholders = factoryList.map((_, i) => `@f${i}`).join(',');
      sql += ` and OTH_FACTORY in (${placeholders})`;
      factoryList.forEach((code, i) => {
        sqlParams[`f${i}`] = code;
      });
    }

    if (fromDate && toDate) {
      sql += ` and cast(OTH_REP_DATE as date) between @fromDate and @toDate`;
      sqlParams.fromDate = fromDate;
      sqlParams.toDate = toDate;
    }

    if (type === '1') {
      sql += ` and oth_api_flag in (1,2) and LEN(OTH_API_REM) = 0`;
    } else if (type === '2') {
      sql += ` and OTH_API_REM LIKE '%Submitted successfully%'`;
    } else if (type === '3') {
      sql += ` and LEN(isnull(OTH_API_REM,'')) > 0 and OTH_API_REM NOT LIKE '%Submitted successfully%'`;
    } else {
      sql += ` and (oth_api_flag in (1,2) or LEN(OTH_API_REM) > 0)`;
    }

    if (apiType === '1') {
      sql += ` and oth_api_flag = 1`;
    } else if (apiType === '2') {
      sql += ` and oth_api_flag = 2`;
    }

    sql += ` order by OTH_NO`;

    const rows = await executeQuery(sql, sqlParams, season);
    return rows || [];
  } catch (error) {
    console.error('[ReportNewRepository] getApiStatusReport error:', error.message);
    throw error;
  }
}

/**
 * Mutate API Status Report
 */
async function mutateApiStatusReport(model, command) {
  try {
    const procName = command === 'Delete' ? 'sp_DeleteApiStatusReport' : 'sp_UpsertApiStatusReport';
    const result = await executeProcedure(procName, { ...model, Command: command });
    return result || { success: true };
  } catch (error) {
    console.error('[ReportNewRepository] mutateApiStatusReport error:', error.message);
    throw error;
  }
}

/**
 * Resend API Status Report
 */
async function resendApiStatusReport(params = {}, season) {
  try {
    const id = String(params.ID ?? params.id ?? params.OTH_NO ?? '').trim();
    const factoryCode = String(params.FactoryCode ?? params.factoryCode ?? params.fcode ?? params.F_code ?? '').trim();
    if (!id || !factoryCode) {
      return { success: false, message: 'ID and FactoryCode are required' };
    }
    const rows = await executeQuery(
      `update OTHER_CANE set OTH_API_REM='' where oth_no=@id and OTH_FACTORY=@factoryCode;
       select @@ROWCOUNT as count;`,
      { id, factoryCode },
      season
    );
    const updated = Number(rows?.[0]?.count || 0);
    return { success: updated > 0 };
  } catch (error) {
    console.error('[ReportNewRepository] resendApiStatusReport error:', error.message);
    throw error;
  }
}

module.exports = {
  getHourlyCaneArrivalWeight,
  getIndentPurchaseReportNew,
  mutateIndentPurchaseReport,
  getCenterIndentPurchaseReport,
  getCentrePurchaseTruckReportNew,
  mutateCentrePurchaseTruckReport,
  getZoneCentreWiseTruckDetails,
  getCenterBalanceReport,
  mutateCenterBalanceReport,
  getCentersForFactory,
  getCanePurchaseReport,
  mutateCanePurchaseReport,
  getSampleOfTransporter,
  mutateSampleOfTransporter,
  getZoneByFactory,
  getTransporterByFactory,
  getApiStatusReport,
  mutateApiStatusReport,
  resendApiStatusReport
};
