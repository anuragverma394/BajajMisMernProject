const dashboardRepository = require('../repositories/dashboard.repository');
const { validateHomeFactRequest, normalizeFactoryCodeList, isTimeoutError } = require('../utils/request.util');
const { buildDateLabels, toDDMMYYYY } = require('../utils/date.util');

async function getHomeFact({ req }) {
  let mode = 'marketing';
  const season = req.user?.season;
  const requestType = String(req.body?.Type || req.query?.Type || req.body?.type || req.query?.type || 'marketing').toLowerCase();
  mode = requestType === 'survey' ? 'survey' : 'marketing';
  let effectiveMode = mode;

  if (mode === 'survey') {
    const surveySource = await dashboardRepository.resolveSurveyAggregateSource(season);
    if (!surveySource) {
      effectiveMode = 'marketing';
    }
  }

  const validation = validateHomeFactRequest(req.body, req.query);
  if (!validation.ok) {
    return { status: 400, payload: { success: false, message: validation.message } };
  }

  const { F_Code, range } = validation;
  let effectiveRange = { ...range };
  const userId = String(req.user?.userId || '').trim();
  const codes = normalizeFactoryCodeList(F_Code);
  const applyUserFactoryFilter = !codes && await dashboardRepository.hasUserFactoryAccess(season, userId);
  if (F_Code && !codes) {
    return { status: 400, payload: { success: false, message: 'F_Code must be a comma-separated numeric list (example: "50,51")' } };
  }

  const factoryParams = {};
  const factoryColumn = effectiveMode === 'survey' ? 's.gh_factory' : 'p.M_FACTORY';
  if (factoryColumn !== 's.gh_factory' && factoryColumn !== 'p.M_FACTORY') {
    throw new Error('Invalid factory column');
  }
  const factoryFilter = codes
    ? dashboardRepository.buildParametrizedInClause(factoryColumn, codes, factoryParams, 'hf')
    : (applyUserFactoryFilter ? `AND ${factoryColumn} IN (SELECT FactID FROM MI_UserFact WITH (NOLOCK) WHERE UserID = @userId)` : '');

  if (effectiveRange.from === effectiveRange.to && effectiveMode !== 'survey') {
    let hourlyData = await dashboardRepository.fetchHomeFactHourly({
      season,
      codes,
      userId,
      dateIso: effectiveRange.from,
      applyUserFactoryFilter
    });
    if (!hourlyData?.MyList?.length && applyUserFactoryFilter && !codes) {
      hourlyData = await dashboardRepository.fetchHomeFactHourly({
        season,
        codes,
        userId,
        dateIso: effectiveRange.from,
        applyUserFactoryFilter: false
      });
    }
    return { status: 200, payload: hourlyData };
  }

  let rows = await dashboardRepository.fetchHomeFactRowsAdaptive({
    season,
    factoryFilter,
    fromDate: effectiveRange.from,
    toDate: effectiveRange.to,
    userId,
    extraParams: factoryParams,
    mode: effectiveMode
  });
  if (!rows.length && applyUserFactoryFilter && !codes) {
    rows = await dashboardRepository.fetchHomeFactRowsAdaptive({
      season,
      factoryFilter: '',
      fromDate: effectiveRange.from,
      toDate: effectiveRange.to,
      userId,
      extraParams: {},
      mode: effectiveMode
    });
  }

  if (!rows.length && !codes) {
    const latestRange = await dashboardRepository.resolveLatestDashboardRange(season, 15);
    if (latestRange && (latestRange.from !== effectiveRange.from || latestRange.to !== effectiveRange.to)) {
      rows = await dashboardRepository.fetchHomeFactRowsAdaptive({
        season,
        factoryFilter: '',
        fromDate: latestRange.from,
        toDate: latestRange.to,
        userId,
        extraParams: {},
        mode: effectiveMode
      });
      if (rows.length) {
        effectiveRange = latestRange;
      }
    }
  }

  const dateList = buildDateLabels(effectiveRange.from, effectiveRange.to);
  if (!rows.length) {
    return { status: 200, payload: { MyList: [], DateList: dateList } };
  }

  const byFactory = new Map();
  rows.forEach((row) => {
    const code = String(row.F_Code || '').trim();
    const name = String(row.F_Name || '').trim();
    const key = `${name} (${code})`;
    const dateKey = toDDMMYYYY(row.M_DATE);
    if (!byFactory.has(key)) byFactory.set(key, new Map());
    byFactory.get(key).set(dateKey, Number(row.M_FinalWt) || 0);
  });

  const myList = Array.from(byFactory.entries()).map(([name, values]) => ({
    name,
    data: dateList.map((d) => values.get(d) || 0)
  }));

  return { status: 200, payload: { MyList: myList, DateList: dateList } };
}

module.exports = {
  getHomeFact,
  isTimeoutError
};
