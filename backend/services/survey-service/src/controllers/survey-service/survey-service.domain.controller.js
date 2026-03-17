const { catchAsync } = require('@bajaj/shared');
const surveyService = require('../../services/survey-service.service');

const CONTROLLER = 'SurveyService';

function getSeason(req) {
  return req.user?.season || req.query?.season || req.body?.season || process.env.DEFAULT_SEASON || '2526';
}

function getParams(req) {
  return { ...(req.query || {}), ...(req.body || {}) };
}

exports.getIndex = catchAsync(async (req, res) => {
  const season = getSeason(req);
  const params = getParams(req);
  const result = await surveyService.executeSurveyServiceProcedure({ action: 'index', params, season });
  return res.status(200).json({
    success: true,
    message: `${CONTROLLER}.index executed`,
    data: result?.rows || [],
    recordsets: result?.recordsets || []
  });
});

exports.index = exports.getIndex;
