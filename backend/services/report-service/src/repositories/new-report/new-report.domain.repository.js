const { executeProcedure, executeQuery } = require('../../core/db/query-executor');

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
async function getTargetActualMisSapNew(season) {
  try {
    const result = await executeProcedure('sp_GetTargetActualMisSapNew', { Season: season });
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
