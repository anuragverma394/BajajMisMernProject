const repository = require('../main');

const getDistilleryReportEntry = repository.distilleryReportEntry;
const createDistilleryReportEntry = repository.distilleryReportEntry_2;
const getDailyRainfall = repository.DailyRainfall;
const createDailyRainfall = repository.DailyRainfall_2;
const getMonthlyEntryReport = repository.MonthlyEntryReport;
const createMonthlyEntryReport = repository.MonthlyEntryReport_2;

module.exports = {
  getDistilleryReportEntry,
  createDistilleryReportEntry,
  getDailyRainfall,
  createDailyRainfall,
  getMonthlyEntryReport,
  createMonthlyEntryReport,
  distilleryReportEntryView: repository.distilleryReportEntryView,
  distilleryReportEntry: getDistilleryReportEntry,
  distilleryReportEntry_2: createDistilleryReportEntry,
  distilleryReportEntryID: repository.distilleryReportEntryID,
  DistilleryReportEntryDelete: repository.DistilleryReportEntryDelete,
  DailyRainfallview: repository.DailyRainfallview,
  DailyRainfallData: repository.DailyRainfallData,
  DailyRainfall: getDailyRainfall,
  DailyRainfall_2: createDailyRainfall,
  DailyRainfallId: repository.DailyRainfallId,
  DailyRainfallDelete: repository.DailyRainfallDelete,
  MonthlyEntryReportView: repository.MonthlyEntryReportView,
  MonthlyEntryReport: getMonthlyEntryReport,
  MonthlyEntryReport_2: createMonthlyEntryReport,
  TargetEntry: repository.TargetEntry
};
