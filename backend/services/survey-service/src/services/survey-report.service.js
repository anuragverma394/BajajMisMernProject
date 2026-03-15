const surveyReportRepository = require('../repositories/survey-report.repository');

async function safeProcedure(handler) {
  try {
    const result = await handler();
    return result?.rows || [];
  } catch (error) {
    const message = String(error?.message || '').toLowerCase();
    if (message.includes('could not find stored procedure')) {
      return [];
    }
    throw error;
  }
}

async function getFactoryWiseCaneAreaReport({ procedure, params, season }) {
  const rows = await safeProcedure(() =>
    surveyReportRepository.getFactoryWiseCaneAreaReport({ procedure, params, season })
  );

  return rows.map((row) => ({
    F_code: Number(row.F_code || row.f_code || 0),
    V_Code: Number(row.V_Code || row.v_code || 0),
    V_Name: String(row.V_Name || row.v_name || ''),
    CaneArea: Number(row.CaneArea || row.caneArea || 0),
    EffectedArea: Number(row.EffectedCaneArea || row.EffectedArea || row.effectedArea || 0),
    EffectedCaneArea: Number(row.EffectedCaneArea || row.EffectedArea || row.effectedArea || 0),
    Percent: Number(row.Percent || row.percent || 0)
  }));
}

async function getPlotWiseDetails({ params, season }) {
  return safeProcedure(() =>
    surveyReportRepository.getPlotWiseDetails({ params, season })
  );
}

async function getCategoryWiseSummary({ params, season }) {
  return safeProcedure(() =>
    surveyReportRepository.getCategoryWiseSummary({ params, season })
  );
}

async function getCaneVierityVillageGrower({ params, season }) {
  return safeProcedure(() =>
    surveyReportRepository.getCaneVierityVillageGrower({ params, season })
  );
}

async function getWeeklySubmissionOfAutumnPlantingIndent({ params, season }) {
  return surveyReportRepository.getWeeklySubmissionOfAutumnPlantingIndent({ params, season });
}

async function getWeeklySubmissionOfIndents({ params, season }) {
  return surveyReportRepository.getWeeklySubmissionOfIndents({ params, season });
}

module.exports = {
  getFactoryWiseCaneAreaReport,
  getPlotWiseDetails,
  getCategoryWiseSummary,
  getCaneVierityVillageGrower,
  getWeeklySubmissionOfAutumnPlantingIndent,
  getWeeklySubmissionOfIndents
};
