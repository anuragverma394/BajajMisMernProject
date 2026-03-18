const { executeProcedure, executeQuery } = require('../../core/db/query-executor');

function normalizeDmyToYmd(value) {
  const raw = String(value || '').trim();
  if (!raw) return '';
  if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) return raw;
  const m = raw.match(/^(\d{2})[\/\-](\d{2})[\/\-](\d{4})$/);
  if (m) return `${m[3]}-${m[2]}-${m[1]}`;
  const parsed = new Date(raw);
  if (Number.isNaN(parsed.getTime())) return '';
  const yyyy = parsed.getFullYear();
  const mm = String(parsed.getMonth() + 1).padStart(2, '0');
  const dd = String(parsed.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

async function getTargetDataByFactID(factoryCode, season) {
  let query = "select F_Code,F_Short,F_Zone, isnull(CPID,0)CPID,isnull(CP_Syrup,0)CP_Syrup, isnull(CP_BHY,0)CP_BHY, isnull(CP_FM,0)CP_FM, isnull(CP_Total,0)CP_Total, " +
    "isnull(CP_PolPTarget, 0)CP_PolPTarget, isnull(CP_RecPTarget, 0)CP_RecPTarget, isnull(CP_BHPTarget, 0)CP_BHPTarget, " +
    "isnull(CP_CHPTarget, 0)CP_CHPTarget, isnull(CP_LossMolBHYPTarget, 0)CP_LossMolBHYPTarget, isnull(CP_LossMolCHYPTarget, 0)CP_LossMolCHYPTarget, " +
    "isnull(CP_LossMolBHYCHYPTarget, 0)CP_LossMolBHYCHYPTarget, isnull(CP_SteamPTarget, 0)CP_SteamPTarget, isnull(CCP_BagassPTarget, 0)CCP_BagassPTarget, " +
    "isnull(CP_Alcohol_Syrup,0)CP_Alcohol_Syrup,isnull(CP_Alcohol_BH,0)CP_Alcohol_BH,isnull(CP_Alcohol_CH,0)CP_Alcohol_CH,isnull(CP_PPTarget,0)CP_PPTarget,isnull(CP_PETarget,0)CP_PETarget " +
    "from  MI_Factory f left join  MI_CanePlan cp on f.F_Code = cp.CP_Unit where 1=1 ";
  if (factoryCode) {
    query += "and F_Code='" + String(factoryCode).trim() + "' ";
  }
  query += " ORDER BY SN ASC ";
  return executeQuery(query, season);
}

async function getActualData(factoryCode, dateYmd, season) {
  const query = "with cte as (select Cn_Unit, Cn_MolassesCategory2223 as Cn_Rec_ThisProdtype,ROUND(sum(Cn_CaneCrushondate2223)/100000,3)  TCrush from MI_CaneCrushSAPEntry " +
    "where  cast(Cn_Date as Date) between '2021-11-01' and '" + dateYmd + "' and Cn_Unit='" + String(factoryCode).trim() + "' group by Cn_Unit,Cn_MolassesCategory2223 )" +
    "select Cn_Unit,Cn_Rec_ThisProdtype,LEFT(TCrush,CHARINDEX('.',TCrush)+3)TCrush from cte";
  return executeQuery(query, season);
}

async function getActualDataRange(factoryCode, fromYmd, toYmd, season) {
  const query = "with cte as (select Cn_Unit, Cn_MolassesCategory2223 as Cn_Rec_ThisProdtype,ROUND(sum(Cn_CaneCrushondate2223)/100000,3)  TCrush from MI_CaneCrushSAPEntry " +
    "where  cast(Cn_Date as Date) between '" + fromYmd + "' and '" + toYmd + "' and Cn_Unit='" + String(factoryCode).trim() + "' group by Cn_Unit,Cn_MolassesCategory2223 )" +
    "select Cn_Unit,Cn_Rec_ThisProdtype,LEFT(TCrush,CHARINDEX('.',TCrush)+3)TCrush from cte";
  return executeQuery(query, season);
}

async function getSapData(factoryCode, dateYmd, season) {
  let query = "select Cn_Unit, Cn_unitname, Cn_Date, Cn_cropday, isnull(Cn_CaneCrushOndate2223,0)Cn_CaneCrushOndate2223, isnull(Cn_CaneCrushTodate2223,0)Cn_CaneCrushTodate2223, isnull(Cn_CaneCrushOndate2122,0)Cn_CaneCrushOndate2122, isnull(Cn_CaneCrushTodate2122,0)Cn_CaneCrushTodate2122, cast(isnull(Cn_Recovery_Perc_Ondate2223,0) as numeric(18,2))Cn_Recovery_Perc_Ondate2223, cast(isnull(Cn_Recovery_Perc_Todate2223,0) as numeric(18,2))Cn_Recovery_Perc_Todate2223, cast(isnull(Cn_Recovery_Perc_Ondate2122,0)  as numeric(18,2))Cn_Recovery_Perc_Ondate2122, cast(isnull(Cn_Recovery_Perc_Todate2122,0) as numeric(18,2))Cn_Recovery_Perc_Todate2122, cast(isnull(Cn_Loss_Perc_Ondate2223,0) as numeric(18,2))Cn_Loss_Perc_Ondate2223, cast(isnull(Cn_Loss_Perc_Todate2223,0) as numeric(18,2))Cn_Loss_Perc_Todate2223, cast(isnull(Cn_Loss_Perc_Ondate2122,0)  as numeric(18,2))Cn_Loss_Perc_Ondate2122,cast(isnull(Cn_Loss_Perc_Todate2122,0) as numeric(18,2))Cn_Loss_Perc_Todate2122, cast(isnull(Cn_POL_Perc_CaneOndate2223,0) as numeric(18,2))Cn_POL_Perc_CaneOndate2223, cast(isnull(Cn_POL_Perc_CaneTodate2223,0) as numeric(18,2))Cn_POL_Perc_CaneTodate2223, cast(isnull(Cn_POL_Perc_CaneOndate2122,0) as numeric(18,2))Cn_POL_Perc_CaneOndate2122, cast(isnull(Cn_POL_Perc_CaneTodate2122,0) as numeric(18,2))Cn_POL_Perc_CaneTodate2122, Cn_MolassesCategory2223, cast(isnull(Cn_MolPurityOndate2223,0) as numeric(18,2))Cn_MolPurityOndate2223, cast(isnull(Cn_MolPurityTodate2223,0) as numeric(18,2))Cn_MolPurityTodate2223, Cn_MolassesCategory2122, cast(Cn_MolPurityOndate2122 as numeric(18,2))Cn_MolPurityOndate2122, cast(Cn_MolPurityTodate2122 as numeric(18,2))Cn_MolPurityTodate2122, Cn_MolassesCategoryType2223, cast(isnull(Cn_MolPurityQtlsOndate2223,0)/100000 as numeric(18,5))Cn_MolPurityQtlsOndate2223, cast(isnull(Cn_MolPurityQtlsTodate2223,0)/100000 as numeric(18,5))Cn_MolPurityQtlsTodate2223, Cn_MolassesCategoryType2122, cast(isnull(Cn_MolPurityQtlsOndate2122,0)/100000 as numeric(18,5))Cn_MolPurityQtlsOndate2122, cast(Cn_MolPurityQtlsTodate2122/100000 as numeric(18,5))Cn_MolPurityQtlsTodate2122, cast(isnull(Cn_SugarBagsQtlsOndate2223,0) as numeric(18,0)) as Cn_SugBagQtl_OnDate, cast(isnull(Cn_SugarBagsQtlsTodate2223,0) as numeric(18,0)) as Cn_SugBagQtl_ToDate, cast(Cn_Steam_Perc_Ondate2223 as numeric(18,2))Cn_Steam_Perc_Ondate2223, cast(Cn_Steam_Perc_Todate2223 as numeric(18,2))Cn_Steam_Perc_Todate2223, Cn_CaneBalanceGate, Cn_CaneBalanceCentre, Cn_StoppageHrsOndate2223, Cn_StoppageHrsTodate2223, Cn_Alcohal_MolassesType, cast(Cn_BagasseSavingPercCaneOnDate as numeric(18,2))Cn_BagasseSavingPercCaneOnDate, cast(Cn_BagasseSavingPercCaneToDate as numeric(18,2))Cn_BagasseSavingPercCaneToDate, cast(Cn_BaggaseProdOnDate/100000 as numeric(18,5))Cn_BaggaseProdOnDate, cast(Cn_BaggaseProdToDate/100000 as numeric(18,5))Cn_BaggaseProdToDate, cast(Cn_LossInBHyMolPercCaneOnDate as numeric(18,2))Cn_LossInBHyMolPercCaneOnDate, cast(Cn_LossInBHyMolPercCaneToDate as numeric(18,2))Cn_LossInBHyMolPercCaneToDate, cast(Cn_LossInCHyMolPercCaneOnDate as numeric(18,2))Cn_LossInCHyMolPercCaneOnDate, cast(Cn_LossInCHyMolPercCaneToDate as numeric(18,2))Cn_LossInCHyMolPercCaneToDate,cast(isnull(Cn_LossInBHyMolPercCaneOnDate,0)+isnull(Cn_LossInCHyMolPercCaneOnDate,0) as numeric(18,2))LossOndate,cast(isnull(Cn_LossInBHyMolPercCaneToDate,0)+isnull(Cn_LossInCHyMolPercCaneToDate,0) as numeric(18,2))LossTodate, cast(isnull(Cn_ProductionOndate2223,0)/100000 as numeric(18,5))Cn_ProductionOndate2223, cast(isnull(Cn_ProductionTodate2223,0)/100000 as numeric(18,5))Cn_ProductionTodate2223, cast(isnull(Cn_PowerProduced_Kwh_Ondate2223,0) as numeric(18,0))Cn_PowerProduced_Kwh_Ondate2223, cast(isnull(Cn_PowerProduced_Kwh_Todate2223,0) as numeric(18,0))Cn_PowerProduced_Kwh_Todate2223, cast(isnull(Cn_PowerExport_Kwh_Ondate2223,0) as numeric(18,0))Cn_PowerExport_Kwh_Ondate2223, cast(isnull(Cn_PowerExport_Kwh_Todate2223,0) as numeric(18,0))Cn_PowerExport_Kwh_Todate2223 from MI_CaneCrushSAPEntry where 1=1";
  if (dateYmd) {
    query += " and cast(cn_date as date) = '" + dateYmd + "'";
  }
  if (factoryCode) {
    query += " and Cn_Unit = '" + String(factoryCode).trim() + "'";
  }
  return executeQuery(query, season);
}

async function getPolPercTodate(factoryCode, dateYmd, season) {
  const query = "select (case when cast(cn_date as date)='" + dateYmd + "'  then  cast(isnull(Cn_POL_Perc_CaneOndate2223,0) as numeric(18,2)) else 0 end)PolPercOnDate," +
    "               cast(isnull(Cn_POL_Perc_CaneTodate2223, 0) as numeric(18, 2))PolPercToDate," +
    "                   (case when cast(cn_date as date)='" + dateYmd + "'  then  cast(isnull(Cn_Recovery_Perc_Ondate2223,0) as numeric(18,2)) else 0 end)RecPercOnDate," +
    "               cast(isnull(Cn_Recovery_Perc_Todate2223, 0) as numeric(18, 2))RecPercToDate," +
    "                   (case when cast(cn_date as date) = '" + dateYmd + "'  then  cast(isnull(Cn_SugarBagsQtlsOndate2223, 0) as numeric(18, 0)) else 0 end)ProductionOnDate," +
    "               cast(isnull(Cn_SugarBagsQtlsTodate2223, 0) as numeric(18, 0))ProductionToDate," +
    "                   (case when cast(cn_date as date)='" + dateYmd + "'  then  cast(isnull(Cn_Steam_Perc_Ondate2223,0) as numeric(18,2)) else 0 end)SteamPercOnDate," +
    "               cast(isnull(Cn_Steam_Perc_Todate2223, 0) as numeric(18, 2))SteamPercToDate," +
    "(case when cast(cn_date as date) = '" + dateYmd + "'  then  cast(isnull(Cn_BagasseSavingPercCaneOnDate, 0) as numeric(18, 2)) else 0 end)BagassePercOnDate," +
    "cast(isnull(Cn_BagasseSavingPercCaneToDate, 0) as numeric(18, 2))BagassePercToDate," +
    "(case when cast(cn_date as date) = '" + dateYmd + "'  then  cast(isnull(Cn_BaggaseProdOnDate, 0) / 100000 as numeric(18, 5)) else 0 end)BagasseQtyOnDate," +
    "cast(isnull(Cn_BaggaseProdToDate, 0) / 100000 as numeric(18, 5))BagasseQtyToDate," +
    "(case when cast(cn_date as date)='" + dateYmd + "'  then  cast(isnull(Cn_PowerProduced_Kwh_Ondate2223,0) as numeric(18,0)) else 0 end)PowerProducedKwhOnDate," +
    "cast(isnull(Cn_PowerProduced_Kwh_Todate2223, 0) as numeric(18, 0))PowerProducedKwhToDate," +
    "(case when cast(cn_date as date) = '" + dateYmd + "'  then  cast(isnull(Cn_PowerExport_Kwh_Ondate2223, 0) as numeric(18, 0)) else 0 end)PowerExportKwhOnDate," +
    "cast(isnull(Cn_PowerExport_Kwh_Todate2223, 0) as numeric(18, 0))PowerExportKwhToDate from   MI_CaneCrushSAPEntry where  Cn_Unit = '" + String(factoryCode).trim() + "' and cast(cn_date as date)= (select max(cast(cn_date as date)) from MI_CaneCrushSAPEntry where Cn_Unit = '" + String(factoryCode).trim() + "' and cast(cn_date as date)<= '" + dateYmd + "')";
  return executeQuery(query, season);
}

async function getPolPercTodateRange(factoryCode, fromYmd, toYmd, season) {
  const query = "select (case when cast(cn_date as date)='" + toYmd + "'  then  cast(isnull(Cn_POL_Perc_CaneOndate2223,0) as numeric(18,2)) else 0 end)PolPercOnDate," +
    "               cast(isnull(Cn_POL_Perc_CaneTodate2223, 0) as numeric(18, 2))PolPercToDate," +
    "                   (case when cast(cn_date as date)='" + toYmd + "'  then  cast(isnull(Cn_Recovery_Perc_Ondate2223,0) as numeric(18,2)) else 0 end)RecPercOnDate," +
    "               cast(isnull(Cn_Recovery_Perc_Todate2223, 0) as numeric(18, 2))RecPercToDate," +
    "                   (case when cast(cn_date as date) = '" + toYmd + "'  then  cast(isnull(Cn_SugarBagsQtlsOndate2223, 0) as numeric(18, 0)) else 0 end)ProductionOnDate," +
    "               cast(isnull(Cn_SugarBagsQtlsTodate2223, 0) as numeric(18, 0))ProductionToDate," +
    "                   (case when cast(cn_date as date)='" + toYmd + "'  then  cast(isnull(Cn_Steam_Perc_Ondate2223,0) as numeric(18,2)) else 0 end)SteamPercOnDate," +
    "               cast(isnull(Cn_Steam_Perc_Todate2223, 0) as numeric(18, 2))SteamPercToDate," +
    "(case when cast(cn_date as date) = '" + toYmd + "'  then  cast(isnull(Cn_BagasseSavingPercCaneOnDate, 0) as numeric(18, 2)) else 0 end)BagassePercOnDate," +
    "cast(isnull(Cn_BagasseSavingPercCaneToDate, 0) as numeric(18, 2))BagassePercToDate," +
    "(case when cast(cn_date as date) = '" + toYmd + "'  then  cast(isnull(Cn_BaggaseProdOnDate, 0) / 100000 as numeric(18, 5)) else 0 end)BagasseQtyOnDate," +
    "cast(isnull(Cn_BaggaseProdToDate, 0) / 100000 as numeric(18, 5))BagasseQtyToDate," +
    "(case when cast(cn_date as date)='" + toYmd + "'  then  cast(isnull(Cn_PowerProduced_Kwh_Ondate2223,0) as numeric(18,0)) else 0 end)PowerProducedKwhOnDate," +
    "cast(isnull(Cn_PowerProduced_Kwh_Todate2223, 0) as numeric(18, 0))PowerProducedKwhToDate," +
    "(case when cast(cn_date as date) = '" + toYmd + "'  then  cast(isnull(Cn_PowerExport_Kwh_Ondate2223, 0) as numeric(18, 0)) else 0 end)PowerExportKwhOnDate," +
    "cast(isnull(Cn_PowerExport_Kwh_Todate2223, 0) as numeric(18, 0))PowerExportKwhToDate from   MI_CaneCrushSAPEntry where  Cn_Unit = '" + String(factoryCode).trim() + "' and cast(cn_date as date)= (select max(cast(cn_date as date)) from MI_CaneCrushSAPEntry where Cn_Unit = '" + String(factoryCode).trim() + "' and cast(cn_date as date) between '" + fromYmd + "' and '" + toYmd + "')";
  return executeQuery(query, season);
}

async function calculateProductionRange(factoryCode, fromYmd, toYmd, season) {
  const query = "select " +
    "(case when cast(cn_date as date)='" + toYmd + "'  then  cast(isnull(Cn_SugarBagsQtlsOndate2223, 0) as numeric(18, 0)) else 0 end)ProductionOnDate," +
    "cast(isnull(Cn_SugarBagsQtlsTodate2223, 0) as numeric(18, 0))ProductionToDate," +
    "(case when cast(cn_date as date) = '" + toYmd + "'  then  cast(isnull(Cn_BaggaseProdOnDate, 0) / 100000 as numeric(18, 5)) else 0 end)BagasseQtyOnDate," +
    "cast(isnull(Cn_BaggaseProdToDate, 0) / 100000 as numeric(18, 5))BagasseQtyToDate," +
    "(case when cast(cn_date as date)='" + toYmd + "'  then  cast(isnull(Cn_PowerProduced_Kwh_Ondate2223,0) as numeric(18,0)) else 0 end)PowerProducedKwhOnDate," +
    "cast(isnull(Cn_PowerProduced_Kwh_Todate2223, 0) as numeric(18, 0))PowerProducedKwhToDate," +
    "(case when cast(cn_date as date) = '" + toYmd + "'  then  cast(isnull(Cn_PowerExport_Kwh_Ondate2223, 0) as numeric(18, 0)) else 0 end)PowerExportKwhOnDate," +
    "cast(isnull(Cn_PowerExport_Kwh_Todate2223, 0) as numeric(18, 0))PowerExportKwhToDate " +
    "from MI_CaneCrushSAPEntry where Cn_Unit = '" + String(factoryCode).trim() + "' and cast(cn_date as date)= (select max(cast(cn_date as date)) from MI_CaneCrushSAPEntry where Cn_Unit = '" + String(factoryCode).trim() + "' and cast(cn_date as date) between '" + fromYmd + "' and '" + toYmd + "')";
  return executeQuery(query, season);
}

async function getLossMolPercOndateTodateData(factoryCode, dateYmd, season) {
  const query = "with cte as ( select " +
    "(case when cast(cn_date as date)='" + dateYmd + "'  then  cast(isnull(Cn_LossInBHyMolPercCaneOnDate,0) as numeric(18,2)) else 0 end)OnDateBHLossPerc," +
    " cast(isnull(Cn_LossInBHyMolPercCaneToDate, 0) as numeric(18, 2))ToDateBHLossPerc," +
    " (case when cast(cn_date as date)= '" + dateYmd + "'  then  cast(isnull(Cn_LossInCHyMolPercCaneOnDate,0) as numeric(18,2)) else 0 end)OnDateCHLossPerc," +
    " cast(isnull(Cn_LossInCHyMolPercCaneToDate, 0) as numeric(18, 2))ToDateCHLossPerc" +
    " from MI_CaneCrushSAPEntry where  Cn_Unit = '" + String(factoryCode).trim() + "' and cast(cn_date as date)= (select max(cast(cn_date as date)) from MI_CaneCrushSAPEntry " +
    " where Cn_Unit = '" + String(factoryCode).trim() + "' and cast(cn_date as date)<= '" + dateYmd + "'))" +
    " select OnDateBHLossPerc,ToDateBHLossPerc,OnDateCHLossPerc,ToDateCHLossPerc,(OnDateBHLossPerc+OnDateCHLossPerc)TotalOnDateBCH,(ToDateBHLossPerc+ToDateCHLossPerc)TotalToDateBCH from cte";
  return executeQuery(query, season);
}

async function getLossMolPercOndateTodateDataRange(factoryCode, fromYmd, toYmd, season) {
  const query = "with cte as ( select " +
    "(case when cast(cn_date as date)='" + toYmd + "'  then  cast(isnull(Cn_LossInBHyMolPercCaneOnDate,0) as numeric(18,2)) else 0 end)OnDateBHLossPerc," +
    " cast(isnull(Cn_LossInBHyMolPercCaneToDate, 0) as numeric(18, 2))ToDateBHLossPerc," +
    " (case when cast(cn_date as date)= '" + toYmd + "'  then  cast(isnull(Cn_LossInCHyMolPercCaneOnDate,0) as numeric(18,2)) else 0 end)OnDateCHLossPerc," +
    " cast(isnull(Cn_LossInCHyMolPercCaneToDate, 0) as numeric(18, 2))ToDateCHLossPerc" +
    " from MI_CaneCrushSAPEntry where  Cn_Unit = '" + String(factoryCode).trim() + "' and cast(cn_date as date)= (select max(cast(cn_date as date)) from MI_CaneCrushSAPEntry " +
    " where Cn_Unit = '" + String(factoryCode).trim() + "' and cast(cn_date as date) between '" + fromYmd + "' and '" + toYmd + "'))" +
    " select OnDateBHLossPerc,ToDateBHLossPerc,OnDateCHLossPerc,ToDateCHLossPerc,(OnDateBHLossPerc+OnDateCHLossPerc)TotalOnDateBCH,(ToDateBHLossPerc+ToDateCHLossPerc)TotalToDateBCH from cte";
  return executeQuery(query, season);
}

async function getBHCHPercOndateTodate(factoryCode, dateYmd, season) {
  const query = "select '1' as type,(case when Cn_MolassesCategory2223='1' and cast(cn_date as date)='" + dateYmd + "' then cast(isnull(Cn_MolPurityOndate2223, 0) as numeric(18, 2)) else 0 end)OnDatePerc," +
    "cast(isnull(Cn_MolPurityTodate2223, 0) as numeric(18, 2))ToDatePerc from  MI_CaneCrushSAPEntry where Cn_Unit = '" + String(factoryCode).trim() + "' and Cn_MolassesCategory2223='1' and cast(cn_date as date)= (select max(cast(cn_date as date)) from MI_CaneCrushSAPEntry where Cn_Unit = '" + String(factoryCode).trim() + "' and Cn_MolassesCategory2223='1'  and cast(cn_date as date)<= '" + dateYmd + "')" +
    "union " +
    "select '2' as type,(case when Cn_MolassesCategory2223='2' and cast(cn_date as date)= '" + dateYmd + "' then cast(isnull(Cn_MolPurityOndate2223, 0) as numeric(18, 2)) else 0 end)OnDatePerc," +
    "cast(isnull(Cn_MolPurityTodate2223, 0) as numeric(18, 2))ToDatePerc from  MI_CaneCrushSAPEntry where Cn_Unit = '" + String(factoryCode).trim() + "' and Cn_MolassesCategory2223='2' and cast(cn_date as date)= (select max(cast(cn_date as date)) from MI_CaneCrushSAPEntry where Cn_Unit = '" + String(factoryCode).trim() + "' and Cn_MolassesCategory2223='2'  and cast(cn_date as date)<= '" + dateYmd + "')";
  return executeQuery(query, season);
}

async function getBHCHPercOndateTodateRange(factoryCode, fromYmd, toYmd, season) {
  const query = "select '1' as type,(case when Cn_MolassesCategory2223='1' and cast(cn_date as date)='" + toYmd + "' then cast(isnull(Cn_MolPurityOndate2223, 0) as numeric(18, 2)) else 0 end)OnDatePerc," +
    "cast(isnull(Cn_MolPurityTodate2223, 0) as numeric(18, 2))ToDatePerc from  MI_CaneCrushSAPEntry where Cn_Unit = '" + String(factoryCode).trim() + "' and Cn_MolassesCategory2223='1' and cast(cn_date as date)= (select max(cast(cn_date as date)) from MI_CaneCrushSAPEntry where Cn_Unit = '" + String(factoryCode).trim() + "' and Cn_MolassesCategory2223='1'  and cast(cn_date as date) between '" + fromYmd + "' and '" + toYmd + "')" +
    "union " +
    "select '2' as type,(case when Cn_MolassesCategory2223='2' and cast(cn_date as date)= '" + toYmd + "' then cast(isnull(Cn_MolPurityOndate2223, 0) as numeric(18, 2)) else 0 end)OnDatePerc," +
    "cast(isnull(Cn_MolPurityTodate2223, 0) as numeric(18, 2))ToDatePerc from  MI_CaneCrushSAPEntry where Cn_Unit = '" + String(factoryCode).trim() + "' and Cn_MolassesCategory2223='2' and cast(cn_date as date)= (select max(cast(cn_date as date)) from MI_CaneCrushSAPEntry where Cn_Unit = '" + String(factoryCode).trim() + "' and Cn_MolassesCategory2223='2'  and cast(cn_date as date) between '" + fromYmd + "' and '" + toYmd + "')";
  return executeQuery(query, season);
}

async function getBHCHQtlsOndateTodate(factoryCode, dateYmd, season) {
  const query = "select " +
    "sum(case when Cn_MolassesCategory2223='1' and cast(cn_date as date)='" + dateYmd + "'  then  cast(isnull(Cn_MolPurityQtlsOndate2223,0)/100000 as numeric(18,5)) else 0 end)OnDateBHQty," +
    " sum(case when Cn_MolassesCategory2223='1' and cast(cn_date as date) between '2021-11-01' and '" + dateYmd + "' then  cast(isnull(Cn_MolPurityQtlsOndate2223, 0)/100000 as numeric(18, 5)) else 0 end)ToDateBHQty," +
    " sum(case when Cn_MolassesCategory2223='2' and cast(cn_date as date)= '" + dateYmd + "'  then  cast(isnull(Cn_MolPurityQtlsOndate2223,0)/100000 as numeric(18,5)) else 0 end)OnDateCHQty," +
    " sum(case when Cn_MolassesCategory2223='2' and cast(cn_date as date) between '2021-11-01' and '" + dateYmd + "' then  cast(isnull(Cn_MolPurityQtlsOndate2223, 0)/100000 as numeric(18, 5)) else 0 end)ToDateCHQty " +
    " from   MI_CaneCrushSAPEntry where  Cn_Unit = '" + String(factoryCode).trim() + "'";
  return executeQuery(query, season);
}

async function getBHCHQtlsOndateTodateRange(factoryCode, fromYmd, toYmd, season) {
  const query = "select " +
    "sum(case when Cn_MolassesCategory2223='1' and cast(cn_date as date)='" + toYmd + "'  then  cast(isnull(Cn_MolPurityQtlsOndate2223,0)/100000 as numeric(18,5)) else 0 end)OnDateBHQty," +
    " sum(case when Cn_MolassesCategory2223='1' and cast(cn_date as date) between '" + fromYmd + "' and '" + toYmd + "' then  cast(isnull(Cn_MolPurityQtlsOndate2223, 0)/100000 as numeric(18, 5)) else 0 end)ToDateBHQty," +
    " sum(case when Cn_MolassesCategory2223='2' and cast(cn_date as date)= '" + toYmd + "'  then  cast(isnull(Cn_MolPurityQtlsOndate2223,0)/100000 as numeric(18,5)) else 0 end)OnDateCHQty," +
    " sum(case when Cn_MolassesCategory2223='2' and cast(cn_date as date) between '" + fromYmd + "' and '" + toYmd + "' then  cast(isnull(Cn_MolPurityQtlsOndate2223, 0)/100000 as numeric(18, 5)) else 0 end)ToDateCHQty " +
    " from   MI_CaneCrushSAPEntry where  Cn_Unit = '" + String(factoryCode).trim() + "'";
  return executeQuery(query, season);
}

async function getAlcohoOndateTodateData(factoryCode, dateYmd, season) {
  const query = "with cte as ( " +
    "select cn_unit " +
    ",sum(case when Cn_MolassesCategory2223='3' and cast(cn_date as date)='" + dateYmd + "' then Cn_ProductionOndate2223 else 0 end )ondatesycrup " +
    ",sum(case when Cn_MolassesCategory2223='1' and cast(cn_date as date)= '" + dateYmd + "' then Cn_ProductionOndate2223 else 0 end )ondatebh " +
    ",sum(case when Cn_MolassesCategory2223='2' and cast(cn_date as date)= '" + dateYmd + "' then Cn_ProductionOndate2223 else 0 end )ondatech " +
    ",sum(case when Cn_MolassesCategory2223='3' and cast(cn_date as date)between '2021-11-01' and '" + dateYmd + "' then Cn_ProductionOndate2223 else 0 end )Tdatesycrup " +
    ",sum(case when Cn_MolassesCategory2223='1' and cast(cn_date as date)between '2021-11-01' and '" + dateYmd + "' then Cn_ProductionOndate2223 else 0 end )Tdatebh " +
    ",sum(case when Cn_MolassesCategory2223='2' and cast(cn_date as date)between '2021-11-01' and '" + dateYmd + "' then Cn_ProductionOndate2223 else 0 end )Tdatech " +
    "from  MI_CaneCrushSAPEntry where 1=1 and  Cn_Unit = '" + String(factoryCode).trim() + "' group by cn_unit )" +
    "select cn_unit,cast(ondatesycrup/100000 as numeric(18,5))OnDateSycrup,cast(ondatebh/100000 as numeric(18,5))OnDateBH,cast(ondatech/100000 as numeric(18,5))OnDateCH,cast((ondatesycrup+ondatebh+ondatech)/100000 as numeric(18,5))OnDateTotal,cast(Tdatesycrup/100000 as numeric(18,5))ToDateSycrup,cast(Tdatebh/100000 as numeric(18,5))ToDateBH,cast(Tdatech/100000 as numeric(18,5))ToDateCH,cast((Tdatesycrup+Tdatebh+Tdatech)/100000 as numeric(18,5))ToDateTotal from cte ";
  return executeQuery(query, season);
}

async function getAlcohoOndateTodateDataRange(factoryCode, fromYmd, toYmd, season) {
  const query = "with cte as (" +
    "select cn_unit " +
    ",sum(case when Cn_MolassesCategory2223='3' and cast(cn_date as date)='" + toYmd + "' then Cn_ProductionOndate2223 else 0 end )ondatesycrup " +
    ",sum(case when Cn_MolassesCategory2223='1' and cast(cn_date as date)= '" + toYmd + "' then Cn_ProductionOndate2223 else 0 end )ondatebh " +
    ",sum(case when Cn_MolassesCategory2223='2' and cast(cn_date as date)= '" + toYmd + "' then Cn_ProductionOndate2223 else 0 end )ondatech " +
    ",sum(case when Cn_MolassesCategory2223='3' and cast(cn_date as date)between '" + fromYmd + "' and '" + toYmd + "' then Cn_ProductionOndate2223 else 0 end )Tdatesycrup " +
    ",sum(case when Cn_MolassesCategory2223='1' and cast(cn_date as date)between '" + fromYmd + "' and '" + toYmd + "' then Cn_ProductionOndate2223 else 0 end )Tdatebh " +
    ",sum(case when Cn_MolassesCategory2223='2' and cast(cn_date as date)between '" + fromYmd + "' and '" + toYmd + "' then Cn_ProductionOndate2223 else 0 end )Tdatech " +
    "from  MI_CaneCrushSAPEntry where 1=1 and  Cn_Unit = '" + String(factoryCode).trim() + "' group by cn_unit )" +
    "select cn_unit,cast(ondatesycrup/100000 as numeric(18,5))OnDateSycrup,cast(ondatebh/100000 as numeric(18,5))OnDateBH,cast(ondatech/100000 as numeric(18,5))OnDateCH,cast((ondatesycrup+ondatebh+ondatech)/100000 as numeric(18,5))OnDateTotal,cast(Tdatesycrup/100000 as numeric(18,5))ToDateSycrup,cast(Tdatebh/100000 as numeric(18,5))ToDateBH,cast(Tdatech/100000 as numeric(18,5))ToDateCH,cast((Tdatesycrup+Tdatebh+Tdatech)/100000 as numeric(18,5))ToDateTotal from cte ";
  return executeQuery(query, season);
}

async function getOndateTodateCruch(factoryCode, dateYmd, season) {
  const query = "select " +
    "(case when cast(cn_date as date)='" + dateYmd + "'  then  cast(isnull(Cn_CaneCrushOndate2223,0) as numeric(18,2)) else 0 end)OndateCrush,  cast(isnull(Cn_CaneCrushTodate2223, 0) as numeric(18, 2))TodateCrush from MI_CaneCrushSAPEntry where  Cn_Unit = '" + String(factoryCode).trim() + "' " +
    " and cast(cn_date as date)= (select max(cast(cn_date as date)) from MI_CaneCrushSAPEntry where Cn_Unit = '" + String(factoryCode).trim() + "' and cast(cn_date as date)<= '" + dateYmd + "')";
  return executeQuery(query, season);
}

async function getOndateTodateCruchRange(factoryCode, fromYmd, toYmd, season) {
  const query = "select " +
    "sum(case when cast(cn_date as date)='" + toYmd + "'  then  cast(isnull(Cn_CaneCrushOndate2223,0) as numeric(18,2)) else 0 end)OndateCrush," +
    "sum(case when cast(cn_date as date) between '" + fromYmd + "' and '" + toYmd + "'  then  cast(isnull(Cn_CaneCrushOndate2223,0) as numeric(18,2)) else 0 end)TodateCrush from MI_CaneCrushSAPEntry where  Cn_Unit = '" + String(factoryCode).trim() + "' ";
  return executeQuery(query, season);
}

async function getBhChCaneCrush(factoryCode, dateYmd, season) {
  const query = "select '1' as type,(case when Cn_MolassesCategory2223='1' and cast(cn_date as date)='" + dateYmd + "' then cast(isnull(Cn_CaneCrushOndate2223, 0) as numeric(18, 2)) else 0 end)OnDate," +
    "cast(isnull(Cn_CaneCrushTodate2223, 0) as numeric(18, 2))ToDate from  MI_CaneCrushSAPEntry where Cn_Unit = '" + String(factoryCode).trim() + "' and Cn_MolassesCategory2223='1' and cast(cn_date as date)= (select max(cast(cn_date as date)) from MI_CaneCrushSAPEntry where Cn_Unit = '" + String(factoryCode).trim() + "' and Cn_MolassesCategory2223='1'  and cast(cn_date as date)<= '" + dateYmd + "')" +
    "union select '2' as type,(case when Cn_MolassesCategory2223='2' and cast(cn_date as date)= '" + dateYmd + "' then cast(isnull(Cn_CaneCrushOndate2223, 0) as numeric(18, 2)) else 0 end)OnDate, " +
    "cast(isnull(Cn_CaneCrushTodate2223, 0) as numeric(18, 2))ToDate from  MI_CaneCrushSAPEntry where Cn_Unit = '" + String(factoryCode).trim() + "' and Cn_MolassesCategory2223='2' and cast(cn_date as date)= (select max(cast(cn_date as date)) from MI_CaneCrushSAPEntry where Cn_Unit = '" + String(factoryCode).trim() + "' and Cn_MolassesCategory2223='2'  and cast(cn_date as date)<= '" + dateYmd + "')";
  return executeQuery(query, season);
}

async function getBhChCaneCrushRange(factoryCode, fromYmd, toYmd, season) {
  const query = "select '1' as type," +
    "isnull(sum(case when Cn_MolassesCategory2223='1' and cast(cn_date as date)='" + toYmd + "' then cast(isnull(Cn_CaneCrushOndate2223, 0) as numeric(18, 2)) else 0 end),0)OnDate," +
    "isnull(sum(case when Cn_MolassesCategory2223='1' and cast(cn_date as date) between '" + fromYmd + "' and '" + toYmd + "' then cast(isnull(Cn_CaneCrushOndate2223, 0) as numeric(18, 2)) else 0 end),0)ToDate from  MI_CaneCrushSAPEntry where Cn_Unit = '" + String(factoryCode).trim() + "' and Cn_MolassesCategory2223='1' " +
    "union select '2' as type, isnull(sum(case when Cn_MolassesCategory2223='2' and cast(cn_date as date)= '" + toYmd + "' then cast(isnull(Cn_CaneCrushOndate2223, 0) as numeric(18, 2)) else 0 end),0)OnDate, " +
    "isnull(sum(case when Cn_MolassesCategory2223='2' and cast(cn_date as date) between '" + fromYmd + "' and '" + toYmd + "' then cast(isnull(Cn_CaneCrushOndate2223, 0) as numeric(18, 2)) else 0 end),0)ToDate from  MI_CaneCrushSAPEntry where Cn_Unit = '" + String(factoryCode).trim() + "' and Cn_MolassesCategory2223='2' ";
  return executeQuery(query, season);
}

/**
 * Get Target vs Actual MIS Periodically
 */
async function getTargetVsActualMisPeriodically(season) {
  try {
    const result = await executeProcedure('sp_GetTargetVsActualMisPeriodically', { Season: season });
    return result || [];
  } catch (error) {
    console.error('[NewReportRepository] getTargetVsActualMisPeriodically error:', error.message);
    throw error;
  }
}

/**
 * Get Target Actual MIS Data
 */
async function getTargetActualMISData(factoryName, dateFrom, dateTo, season) {
  try {
    const result = await executeProcedure('sp_GetTargetActualMISData', {
      FactoryName: factoryName,
      DateFrom: dateFrom,
      DateTo: dateTo,
      Season: season
    });
    return result || [];
  } catch (error) {
    console.error('[NewReportRepository] getTargetActualMISData error:', error.message);
    throw error;
  }
}

/**
 * Get Target Actual MIS SAP New
 */
async function getTargetActualMisSapNew(factoryCode, date, userCode, season) {
  try {
    const fcode = String(factoryCode || '').trim();
    const ymd = normalizeDmyToYmd(date);
    let query = "select Cn_Unit, Cn_unitname, Cn_Date, Cn_cropday, isnull(Cn_CaneCrushOndate2223,0)Cn_CaneCrushOndate2223, isnull(Cn_CaneCrushTodate2223,0)Cn_CaneCrushTodate2223, isnull(Cn_CaneCrushOndate2122,0)Cn_CaneCrushOndate2122, isnull(Cn_CaneCrushTodate2122,0)Cn_CaneCrushTodate2122, cast(isnull(Cn_Recovery_Perc_Ondate2223,0) as numeric(18,2))Cn_Recovery_Perc_Ondate2223, cast(isnull(Cn_Recovery_Perc_Todate2223,0) as numeric(18,2))Cn_Recovery_Perc_Todate2223, cast(isnull(Cn_Recovery_Perc_Ondate2122,0)  as numeric(18,2))Cn_Recovery_Perc_Ondate2122, cast(isnull(Cn_Recovery_Perc_Todate2122,0) as numeric(18,2))Cn_Recovery_Perc_Todate2122, cast(isnull(Cn_Loss_Perc_Ondate2223,0) as numeric(18,2))Cn_Loss_Perc_Ondate2223, cast(isnull(Cn_Loss_Perc_Todate2223,0) as numeric(18,2))Cn_Loss_Perc_Todate2223, cast(isnull(Cn_Loss_Perc_Ondate2122,0)  as numeric(18,2))Cn_Loss_Perc_Ondate2122,cast(isnull(Cn_Loss_Perc_Todate2122,0) as numeric(18,2))Cn_Loss_Perc_Todate2122, cast(isnull(Cn_POL_Perc_CaneOndate2223,0) as numeric(18,2))Cn_POL_Perc_CaneOndate2223, cast(isnull(Cn_POL_Perc_CaneTodate2223,0) as numeric(18,2))Cn_POL_Perc_CaneTodate2223, cast(isnull(Cn_POL_Perc_CaneOndate2122,0) as numeric(18,2))Cn_POL_Perc_CaneOndate2122, cast(isnull(Cn_POL_Perc_CaneTodate2122,0) as numeric(18,2))Cn_POL_Perc_CaneTodate2122, Cn_MolassesCategory2223, cast(isnull(Cn_MolPurityOndate2223,0) as numeric(18,2))Cn_MolPurityOndate2223, cast(isnull(Cn_MolPurityTodate2223,0) as numeric(18,2))Cn_MolPurityTodate2223, Cn_MolassesCategory2122, cast(Cn_MolPurityOndate2122 as numeric(18,2))Cn_MolPurityOndate2122, cast(Cn_MolPurityTodate2122 as numeric(18,2))Cn_MolPurityTodate2122, Cn_MolassesCategoryType2223, cast(isnull(Cn_MolPurityQtlsOndate2223,0)/100000 as numeric(18,5))Cn_MolPurityQtlsOndate2223, cast(isnull(Cn_MolPurityQtlsTodate2223,0)/100000 as numeric(18,5))Cn_MolPurityQtlsTodate2223, Cn_MolassesCategoryType2122, cast(isnull(Cn_MolPurityQtlsOndate2122,0)/100000 as numeric(18,5))Cn_MolPurityQtlsOndate2122, cast(Cn_MolPurityQtlsTodate2122/100000 as numeric(18,5))Cn_MolPurityQtlsTodate2122, cast(isnull(Cn_SugarBagsQtlsOndate2223,0) as numeric(18,0)) as Cn_SugBagQtl_OnDate, cast(isnull(Cn_SugarBagsQtlsTodate2223,0) as numeric(18,0)) as Cn_SugBagQtl_ToDate, cast(Cn_Steam_Perc_Ondate2223 as numeric(18,2))Cn_Steam_Perc_Ondate2223, cast(Cn_Steam_Perc_Todate2223 as numeric(18,2))Cn_Steam_Perc_Todate2223, Cn_CaneBalanceGate, Cn_CaneBalanceCentre, Cn_StoppageHrsOndate2223, Cn_StoppageHrsTodate2223, Cn_Alcohal_MolassesType, cast(Cn_BagasseSavingPercCaneOnDate as numeric(18,2))Cn_BagasseSavingPercCaneOnDate, cast(Cn_BagasseSavingPercCaneToDate as numeric(18,2))Cn_BagasseSavingPercCaneToDate, cast(Cn_BaggaseProdOnDate/100000 as numeric(18,5))Cn_BaggaseProdOnDate, cast(Cn_BaggaseProdToDate/100000 as numeric(18,5))Cn_BaggaseProdToDate, cast(Cn_LossInBHyMolPercCaneOnDate as numeric(18,2))Cn_LossInBHyMolPercCaneOnDate, cast(Cn_LossInBHyMolPercCaneToDate as numeric(18,2))Cn_LossInBHyMolPercCaneToDate, cast(Cn_LossInCHyMolPercCaneOnDate as numeric(18,2))Cn_LossInCHyMolPercCaneOnDate, cast(Cn_LossInCHyMolPercCaneToDate as numeric(18,2))Cn_LossInCHyMolPercCaneToDate,cast(isnull(Cn_LossInBHyMolPercCaneOnDate,0)+isnull(Cn_LossInCHyMolPercCaneOnDate,0) as numeric(18,2))LossOndate,cast(isnull(Cn_LossInBHyMolPercCaneToDate,0)+isnull(Cn_LossInCHyMolPercCaneToDate,0) as numeric(18,2))LossTodate, cast(isnull(Cn_ProductionOndate2223,0)/100000 as numeric(18,5))Cn_ProductionOndate2223, cast(isnull(Cn_ProductionTodate2223,0)/100000 as numeric(18,5))Cn_ProductionTodate2223, cast(isnull(Cn_PowerProduced_Kwh_Ondate2223,0) as numeric(18,0))Cn_PowerProduced_Kwh_Ondate2223, cast(isnull(Cn_PowerProduced_Kwh_Todate2223,0) as numeric(18,0))Cn_PowerProduced_Kwh_Todate2223, cast(isnull(Cn_PowerExport_Kwh_Ondate2223,0) as numeric(18,0))Cn_PowerExport_Kwh_Ondate2223, cast(isnull(Cn_PowerExport_Kwh_Todate2223,0) as numeric(18,0))Cn_PowerExport_Kwh_Todate2223 from MI_CaneCrushSAPEntry where 1=1";
    if (ymd) {
      query += " and cast(cn_date as date) = '" + ymd + "'";
    }
    if (fcode) {
      query += " and Cn_Unit = '" + fcode + "'";
    }
    const result = await executeQuery(query, season);
    return result || [];
  } catch (error) {
    console.error('[NewReportRepository] getTargetActualMisSapNew error:', error.message);
    throw error;
  }
}

/**
 * Get Target Actual MIS Data MIS
 */
async function getTargetActualMISDataMis(factoryName, cpDate, season) {
  try {
    const result = await executeProcedure('sp_GetTargetActualMISDataMis', {
      FactoryName: factoryName,
      CPDate: cpDate,
      Season: season
    });
    return result || [];
  } catch (error) {
    console.error('[NewReportRepository] getTargetActualMISDataMis error:', error.message);
    throw error;
  }
}

/**
 * Get Exception Report Master
 */
async function getExceptionReportMaster(season) {
  try {
    const result = await executeProcedure('sp_GetExceptionReportMaster', { Season: season });
    return result || [];
  } catch (error) {
    console.error('[NewReportRepository] getExceptionReportMaster error:', error.message);
    throw error;
  }
}

/**
 * Mutate Exception Report Master
 */
async function mutateExceptionReportMaster(model, command) {
  try {
    const procName = command === 'Delete' ? 'sp_DeleteExceptionReportMaster' : 'sp_UpsertExceptionReportMaster';
    const result = await executeProcedure(procName, { ...model, Command: command });
    return result || { success: true };
  } catch (error) {
    console.error('[NewReportRepository] mutateExceptionReportMaster error:', error.message);
    throw error;
  }
}

/**
 * Get Consecutive Gross Weight
 */
async function getConsecutiveGrossWeight(season) {
  try {
    const result = await executeProcedure('sp_GetConsecutiveGrossWeight', { Season: season });
    return result || [];
  } catch (error) {
    console.error('[NewReportRepository] getConsecutiveGrossWeight error:', error.message);
    throw error;
  }
}

/**
 * Get Exception Report
 */
async function getExceptionReport(model, selectedIds, userid) {
  try {
    const result = await executeProcedure('sp_GetExceptionReport', {
      ...model,
      SelectedIds: JSON.stringify(selectedIds),
      UserId: userid
    });
    return result || [];
  } catch (error) {
    console.error('[NewReportRepository] getExceptionReport error:', error.message);
    throw error;
  }
}

/**
 * Get Abnormal Weighments
 */
async function getAbnormalWeighments(factoryCode, dateFrom, dateTo) {
  try {
    const result = await executeProcedure('sp_GetAbnormalWeighments', {
      FactoryCode: factoryCode,
      DateFrom: dateFrom,
      DateTo: dateTo
    });
    return result || [];
  } catch (error) {
    console.error('[NewReportRepository] getAbnormalWeighments error:', error.message);
    throw error;
  }
}

/**
 * Get Report Data For Export
 */
async function getReportDataForExport(selectedIds, factoryCode, dateFrom, dateTo) {
  try {
    const result = await executeProcedure('sp_GetReportDataForExport', {
      SelectedIds: JSON.stringify(selectedIds),
      FactoryCode: factoryCode,
      DateFrom: dateFrom,
      DateTo: dateTo
    });
    return result || [];
  } catch (error) {
    console.error('[NewReportRepository] getReportDataForExport error:', error.message);
    throw error;
  }
}

/**
 * Get Audit Report Data
 */
async function getAuditReportData(selectedIds, factoryCode, dateFrom, dateTo) {
  try {
    const result = await executeProcedure('sp_GetAuditReportData', {
      SelectedIds: JSON.stringify(selectedIds),
      FactoryCode: factoryCode,
      DateFrom: dateFrom,
      DateTo: dateTo
    });
    return result || [];
  } catch (error) {
    console.error('[NewReportRepository] getAuditReportData error:', error.message);
    throw error;
  }
}

/**
 * Get Reason Wise Report
 */
async function getReasonWiseReport(factoryCode) {
  try {
    const result = await executeProcedure('sp_GetReasonWiseReport', { FactoryCode: factoryCode });
    return result || [];
  } catch (error) {
    console.error('[NewReportRepository] getReasonWiseReport error:', error.message);
    throw error;
  }
}

/**
 * Get Load Audit Report
 */
async function getLoadAuditReport(factoryCode) {
  try {
    const result = await executeProcedure('sp_GetLoadAuditReport', { FactoryCode: factoryCode });
    return result || [];
  } catch (error) {
    console.error('[NewReportRepository] getLoadAuditReport error:', error.message);
    throw error;
  }
}

/**
 * Get Audit Report Master
 */
async function getAuditReportMaster(season) {
  try {
    const result = await executeProcedure('sp_GetAuditReportMaster', { Season: season });
    return result || [];
  } catch (error) {
    console.error('[NewReportRepository] getAuditReportMaster error:', error.message);
    throw error;
  }
}

/**
 * Mutate Audit Report Master
 */
async function mutateAuditReportMaster(model, command) {
  try {
    const procName = command === 'Delete' ? 'sp_DeleteAuditReportMaster' : 'sp_UpsertAuditReportMaster';
    const result = await executeProcedure(procName, { ...model, Command: command });
    return result || { success: true };
  } catch (error) {
    console.error('[NewReportRepository] mutateAuditReportMaster error:', error.message);
    throw error;
  }
}

module.exports = {
  getTargetDataByFactID,
  getActualData,
  getActualDataRange,
  getSapData,
  getPolPercTodate,
  getPolPercTodateRange,
  calculateProductionRange,
  getLossMolPercOndateTodateData,
  getLossMolPercOndateTodateDataRange,
  getBHCHPercOndateTodate,
  getBHCHPercOndateTodateRange,
  getBHCHQtlsOndateTodate,
  getBHCHQtlsOndateTodateRange,
  getAlcohoOndateTodateData,
  getAlcohoOndateTodateDataRange,
  getOndateTodateCruch,
  getOndateTodateCruchRange,
  getBhChCaneCrush,
  getBhChCaneCrushRange,
  getTargetVsActualMisPeriodically,
  getTargetActualMISData,
  getTargetActualMisSapNew,
  getTargetActualMISDataMis,
  getExceptionReportMaster,
  mutateExceptionReportMaster,
  getConsecutiveGrossWeight,
  getExceptionReport,
  getAbnormalWeighments,
  getReportDataForExport,
  getAuditReportData,
  getReasonWiseReport,
  getLoadAuditReport,
  getAuditReportMaster,
  mutateAuditReportMaster
};
