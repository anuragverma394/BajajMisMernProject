const repository = require('../main');

const getSugarWhatsAppReport = repository.SugarWhatsAppReport;
const createSugarWhatsAppReport = repository.SugarWhatsAppReport_2;

module.exports = {
  getSugarWhatsAppReport,
  createSugarWhatsAppReport,
  SugarWhatsAppReportView: repository.SugarWhatsAppReportView,
  SugarWhatsAppReport: getSugarWhatsAppReport,
  SugarWhatsAppReport_2: createSugarWhatsAppReport,
  SugarWhatsAppReportID: repository.SugarWhatsAppReportID,
  SugarWhatsAppReportDelete: repository.SugarWhatsAppReportDelete,
  SugarWhatsAppReportNew: repository.SugarWhatsAppReportNew,
  SugarWhatsAppReportNewData: repository.SugarWhatsAppReportNewData,
  SugarWhatsAppReportsData: repository.SugarWhatsAppReportsData,
  SWRD: repository.SWRD
};
