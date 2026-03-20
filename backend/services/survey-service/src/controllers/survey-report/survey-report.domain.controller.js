const { catchAsync } = require('@bajaj/shared');
const surveyReportService = require('../../services/survey-report.service');

const CONTROLLER = 'SurveyReport';

function normalizeDateInput(raw) {
  const value = String(raw || '').trim();
  if (!value) return '';

  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    const [yyyy, mm, dd] = value.split('-');
    return `${dd}/${mm}/${yyyy}`;
  }

  if (/^\d{2}\/\d{2}\/\d{4}$/.test(value)) {
    return value;
  }

  if (/^\d{2}-\d{2}-\d{4}$/.test(value)) {
    return value.replace(/-/g, '/');
  }

  const dt = new Date(value);
  if (Number.isNaN(dt.getTime())) return '';
  const dd = String(dt.getDate()).padStart(2, '0');
  const mm = String(dt.getMonth() + 1).padStart(2, '0');
  const yyyy = dt.getFullYear();
  return `${dd}/${mm}/${yyyy}`;
}

function toSqlDate(raw) {
  const value = normalizeDateInput(raw);
  if (!value) return '';
  const [dd, mm, yyyy] = value.split('/');
  return `${yyyy}-${mm}-${dd}`;
}

function getSeason(req) {
  return req.user?.season || req.query?.season || req.body?.season || process.env.DEFAULT_SEASON || '2526';
}

function getValue(req, ...keys) {
  for (const key of keys) {
    const value = req.query?.[key] ?? req.body?.[key];
    if (value !== undefined && value !== null && String(value).trim() !== '') {
      return String(value).trim();
    }
  }
  return '';
}

function getParams(req) {
  return { ...(req.query || {}), ...(req.body || {}) };
}

function sendProcedureResult(res, action, result) {
  return res.status(200).json({
    success: true,
    message: `${CONTROLLER}.${action} executed`,
    data: result?.rows || [],
    recordsets: result?.recordsets || []
  });
}

function makeProcedureHandler(action) {
  return catchAsync(async (req, res) => {
    const season = getSeason(req);
    const params = getParams(req);
    const result = await surveyReportService.executeSurveyReportProcedure({ action, params, season });
    return sendProcedureResult(res, action, result);
  });
}

exports.getDailyTeamWiseSurveyProgressReport = catchAsync(async (req, res) => {
  const season = getSeason(req);
  const fCode = getValue(req, 'F_code', 'F_Code', 'factoryCode');
  const date = normalizeDateInput(getValue(req, 'Date', 'date'));
  const userId = String(req.user?.userId || req.headers['x-user-id'] || getValue(req, 'Userid', 'userId') || '').trim();
  const data = await surveyReportService.getDailyTeamWiseSurveyProgressReport({
    fCode: fCode === '0' ? '' : fCode,
    date: toSqlDate(date),
    userId,
    season
  });

  return res.status(200).json({
    success: true,
    message: 'Daily team wise survey progress report',
    data
  });
});
exports.getDailyTeamWiseHourlySurveyProgressReport = catchAsync(async (req, res) => {
  const season = getSeason(req);
  const fCode = getValue(req, 'F_code', 'F_Code', 'factoryCode');
  const date = normalizeDateInput(getValue(req, 'Date', 'date'));
  const userId = String(req.user?.userId || req.headers['x-user-id'] || getValue(req, 'Userid', 'userId') || '').trim();
  const data = await surveyReportService.getDailyTeamWiseHourlySurveyProgressReport({
    fCode: fCode === '0' ? '' : fCode,
    date: toSqlDate(date),
    userId,
    season
  });

  return res.status(200).json({
    success: true,
    message: 'Daily team wise hourly survey progress report',
    data
  });
});
exports.getFinalVillageFirstSurveyReport = makeProcedureHandler('FinalVillageFirstSurveyReport');
exports.getFinalVillageFirstSurveySummeryReport = makeProcedureHandler('FinalVillageFirstSurveySummeryReport');
exports.getSurveyUnitWiseSurveyStatus = catchAsync(async (req, res) => {
  const season = getSeason(req);
  const fCode = getValue(req, 'F_code', 'F_Code', 'factoryCode') || '0';
  const caneType = getValue(req, 'CaneType', 'caneType') || '1';
  const data = await surveyReportService.getSurveyUnitWiseSurveyStatusReport({
    fCode,
    caneType,
    season
  });

  return res.status(200).json({
    success: true,
    message: 'Survey unit wise survey status',
    data
  });
});
exports.getSurveyUnitWiseSurveyAreaSummary = catchAsync(async (req, res) => {
  const season = getSeason(req);
  const fCode = getValue(req, 'F_code', 'F_Code', 'factoryCode') || '0';
  const caneType = getValue(req, 'CaneType', 'caneType') || '1';
  const date = normalizeDateInput(getValue(req, 'Date', 'date'));
  const connectionSeason = String(req.user?.connectionSeason || req.headers['x-user-connection-season'] || '').trim();

  const data = await surveyReportService.getSurveyUnitWiseSurveyAreaSummaryReport({
    fCode,
    caneType,
    date: toSqlDate(date),
    season,
    connectionSeason
  });

  return res.status(200).json({
    success: true,
    message: 'Survey unit wise survey area summary',
    data
  });
});
exports.getSurveyActualVarietywise = makeProcedureHandler('SurveyActualVarietywise');

exports.DailyTeamWiseSurveyProgressReport = exports.getDailyTeamWiseSurveyProgressReport;
exports.DailyTeamWiseHourlySurveyProgressReport = exports.getDailyTeamWiseHourlySurveyProgressReport;
exports.FinalVillageFirstSurveyReport = exports.getFinalVillageFirstSurveyReport;
exports.FinalVillageFirstSurveySummeryReport = exports.getFinalVillageFirstSurveySummeryReport;
exports.SurveyUnitWiseSurveyStatus = exports.getSurveyUnitWiseSurveyStatus;
exports.SurveyUnitWiseSurveyAreaSummary = exports.getSurveyUnitWiseSurveyAreaSummary;
exports.SurveyActualVarietywise = exports.getSurveyActualVarietywise;

exports.FactoryWiseCaneAreaReport = async (req, res, next) => {
  try {
    const season = getSeason(req);
    const caneArea = getValue(req, 'CaneArea') || '1';
    const fCode = getValue(req, 'F_code', 'factoryCode', 'F_Code');
    const stateDropdown = getValue(req, 'stateDropdown');
    const procedure = caneArea === '2' ? 'mis_rptGASHTIAmity1' : 'mis_rpt1';
    const data = await surveyReportService.getFactoryWiseCaneAreaReport({
      procedure,
      params: { fact: fCode, state: stateDropdown },
      season
    });

    return res.status(200).json({
      success: true,
      message: 'Factory wise cane area report',
      data
    });
  } catch (error) {
    return next(error);
  }
};

exports.PlotWiseDetails = async (req, res, next) => {
  try {
    const season = getSeason(req);
    const F_Name = getValue(req, 'F_Name', 'F_code', 'factoryCode');
    const date = normalizeDateInput(getValue(req, 'date', 'Date'));
    const catg = getValue(req, 'catg', 'category') || '0';
    const data = await surveyReportService.getPlotWiseDetails({
      params: { fact: F_Name, date: toSqlDate(date), category: catg },
      season
    });

    return res.status(200).json({ success: true, message: 'Plot wise details', data });
  } catch (error) {
    return next(error);
  }
};

exports.categoryWiseSummary = async (req, res, next) => {
  try {
    const season = getSeason(req);
    const F_Name = getValue(req, 'F_Name', 'F_code', 'unitCode', 'factoryCode');
    const date = normalizeDateInput(getValue(req, 'date', 'Date'));
    const catg = getValue(req, 'catg', 'category') || '0';
    const data = await surveyReportService.getCategoryWiseSummary({
      params: { fact: F_Name, date: toSqlDate(date), category: catg },
      season
    });
    return res.status(200).json({ success: true, message: 'Category wise summary', data });
  } catch (error) {
    return next(error);
  }
};

exports.CategoryWiseSummaryData = exports.categoryWiseSummary;

exports.CaneVierityVillageGrower = async (req, res, next) => {
  try {
    const season = getSeason(req);
    const F_code = getValue(req, 'F_code', 'factoryCode');
    const Fdate = normalizeDateInput(getValue(req, 'Fdate', 'FromDate', 'fromDate'));
    const Tdate = normalizeDateInput(getValue(req, 'Tdate', 'ToDate', 'toDate'));
    const Categry = getValue(req, 'Categry', 'category') || 'varietychange';
    const data = await surveyReportService.getCaneVierityVillageGrower({
      params: {
        gh_factory: F_code,
        SDate: toSqlDate(Fdate),
        Edate: toSqlDate(Tdate || Fdate),
        ChangeType: Categry
      },
      season
    });

    return res.status(200).json({ success: true, message: 'Cane variety village grower report', data });
  } catch (error) {
    return next(error);
  }
};

exports.WeeklySubmissionofAutumnPlantingIndent = async (req, res, next) => {
  try {
    const season = getSeason(req);
    const F_code = getValue(req, 'F_code', 'F_Zone');
    const unit = Number(getValue(req, 'unit', 'unitcode') || 0);
    const Zonefrom = Number(getValue(req, 'Zonefrom', 'zonefrom') || 0);
    const Zoneto = Number(getValue(req, 'Zoneto', 'zoneto') || Zonefrom);
    const blockfrom = Number(getValue(req, 'blockfrom') || 0);
    const blockto = Number(getValue(req, 'blockto', 'block') || blockfrom);
    const Datefrom = toSqlDate(getValue(req, 'Datefrom', 'fromDate'));
    const DateTo = toSqlDate(getValue(req, 'DateTo', 'toDate') || getValue(req, 'Datefrom', 'fromDate'));
    const PlantinType = getValue(req, 'PlantinType', 'IndentType') || '1';

    const data = await surveyReportService.getWeeklySubmissionOfAutumnPlantingIndent({
      params: { F_code, unit, Zonefrom, Zoneto, blockfrom, blockto, Datefrom, DateTo, PlantinType },
      season
    });

    return res.status(200).json({ success: true, message: 'Weekly submission of autumn planting indent', data });
  } catch (error) {
    return next(error);
  }
};

exports.WeeklySubmissionofIndents = async (req, res, next) => {
  try {
    const season = getSeason(req);
    const unit = Number(getValue(req, 'unit', 'unitcode') || 0);
    const Zonefrom = Number(getValue(req, 'Zonefrom', 'zonefrom') || 0);
    const Zoneto = Number(getValue(req, 'Zoneto', 'zoneto') || Zonefrom);
    const blockfrom = Number(getValue(req, 'blockfrom') || 0);
    const blockto = Number(getValue(req, 'blockto', 'block') || blockfrom);
    const Datefrom = toSqlDate(getValue(req, 'Datefrom', 'fromDate'));
    const DateTo = toSqlDate(getValue(req, 'DateTo', 'toDate') || getValue(req, 'Datefrom', 'fromDate'));

    const data = await surveyReportService.getWeeklySubmissionOfIndents({
      params: { unit, Zonefrom, Zoneto, blockfrom, blockto, Datefrom, DateTo },
      season
    });

    return res.status(200).json({ success: true, message: 'Weekly submission of indents', data });
  } catch (error) {
    return next(error);
  }
};
