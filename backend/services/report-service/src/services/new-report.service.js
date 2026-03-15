const repository = require('../repositories/new-report.repository');

/**
 * GET: Target vs Actual MIS Periodically
 */
async function getTargetVsActualMisPeriodically(season) {
  try {
    const data = await repository.getTargetVsActualMisPeriodically(season);
    return data || [];
  } catch (error) {
    throw new Error(`Failed to fetch target/actual MIS periodic: ${error.message}`);
  }
}

/**
 * GET: Target Actual MIS Data with date range
 */
async function getTargetActualMISData(factoryName, dateFrom, dateTo, season) {
  try {
    if (!factoryName) {
      throw new Error('Factory name is required');
    }
    const data = await repository.getTargetActualMISData(factoryName, dateFrom, dateTo, season);
    return data || [];
  } catch (error) {
    throw new Error(`Failed to fetch target/actual MIS data: ${error.message}`);
  }
}

/**
 * GET: Target Actual MIS SAP New
 */
async function getTargetActualMisSapNew(season) {
  try {
    const data = await repository.getTargetActualMisSapNew(season);
    return data || [];
  } catch (error) {
    throw new Error(`Failed to fetch target/actual MIS SAP: ${error.message}`);
  }
}

/**
 * GET: Target Actual MIS Data MIS
 */
async function getTargetActualMISDataMis(factoryName, cpDate, season) {
  try {
    if (!factoryName) {
      throw new Error('Factory name is required');
    }
    const data = await repository.getTargetActualMISDataMis(factoryName, cpDate, season);
    return data || [];
  } catch (error) {
    throw new Error(`Failed to fetch target/actual MIS data (MIS): ${error.message}`);
  }
}

/**
 * GET: Exception Report Master
 */
async function getExceptionReportMaster(season) {
  try {
    const data = await repository.getExceptionReportMaster(season);
    return data || [];
  } catch (error) {
    throw new Error(`Failed to fetch exception report master: ${error.message}`);
  }
}

/**
 * POST: Exception Report Master (Create/Update)
 */
async function mutateExceptionReportMaster(model, command) {
  try {
    if (!model) {
      return { error: true, status: 400, message: 'Model is required' };
    }
    
    const result = await repository.mutateExceptionReportMaster(model, command);
    return { error: false, status: 201, data: result };
  } catch (error) {
    return { error: true, status: 500, message: error.message };
  }
}

/**
 * GET: Consecutive Gross Weight
 */
async function getConsecutiveGrossWeight(season) {
  try {
    const data = await repository.getConsecutiveGrossWeight(season);
    return data || [];
  } catch (error) {
    throw new Error(`Failed to fetch consecutive gross weight: ${error.message}`);
  }
}

/**
 * POST: Exception Report (with optional export)
 */
async function getExceptionReport(model, selectedIds, userid, downloadToken) {
  try {
    const result = await repository.getExceptionReport(model, selectedIds, userid);
    
    if (downloadToken) {
      return {
        error: false,
        status: 200,
        data: result,
        downloadUrl: `/api/reports/download/${downloadToken}`
      };
    }
    
    return { error: false, status: 200, data: result };
  } catch (error) {
    return { error: true, status: 500, message: error.message };
  }
}

/**
 * GET: Export All Abnormal Weighments
 */
async function exportAllAbnormalWeighments(factoryCode, factoryName, dateFrom, dateTo) {
  try {
    if (!factoryCode || !dateFrom || !dateTo) {
      return { error: true, status: 400, message: 'Factory code, dateFrom, and dateTo are required' };
    }
    
    const data = await repository.getAbnormalWeighments(factoryCode, dateFrom, dateTo);
    
    return {
      error: false,
      status: 200,
      data: data,
      downloadUrl: `/api/reports/download/abnormal-weighments-${factoryCode}-${Date.now()}.xlsx`,
      fileName: `AbnormalWeighments_${factoryName || factoryCode}_${dateFrom}_${dateTo}.xlsx`
    };
  } catch (error) {
    return { error: true, status: 500, message: error.message };
  }
}

/**
 * POST: Export to Excel
 */
async function exportToExcel(selectedIds, factoryCode, factoryName, dateFrom, dateTo, downloadToken) {
  try {
    if (!factoryCode || !dateFrom || !dateTo) {
      return { error: true, status: 400, message: 'Factory code, dateFrom, and dateTo are required' };
    }
    
    const data = await repository.getReportDataForExport(selectedIds, factoryCode, dateFrom, dateTo);
    
    return {
      error: false,
      status: 200,
      data: data,
      downloadUrl: `/api/reports/download/export-${factoryCode}-${Date.now()}.xlsx`,
      fileName: `ExportReport_${factoryName || factoryCode}_${dateFrom}_${dateTo}.xlsx`
    };
  } catch (error) {
    return { error: true, status: 500, message: error.message };
  }
}

/**
 * POST: Get Audit Report (with optional export)
 */
async function getAuditReport(selectedIds, factoryCode, factoryName, dateFrom, dateTo, downloadToken) {
  try {
    if (!factoryCode || !dateFrom || !dateTo) {
      return { error: true, status: 400, message: 'Factory code, dateFrom, and dateTo are required' };
    }
    
    const data = await repository.getAuditReportData(selectedIds, factoryCode, dateFrom, dateTo);
    
    return {
      error: false,
      status: 200,
      data: data,
      downloadUrl: `/api/reports/download/audit-${factoryCode}-${Date.now()}.xlsx`
    };
  } catch (error) {
    return { error: true, status: 500, message: error.message };
  }
}

/**
 * GET: Load Reason Wise Report
 */
async function getReasonWiseReport(factoryCode) {
  try {
    if (!factoryCode) {
      throw new Error('Factory code is required');
    }
    const data = await repository.getReasonWiseReport(factoryCode);
    return data || [];
  } catch (error) {
    throw new Error(`Failed to fetch reason-wise report: ${error.message}`);
  }
}

/**
 * GET: Load Audit Report
 */
async function getLoadAuditReport(factoryCode) {
  try {
    if (!factoryCode) {
      throw new Error('Factory code is required');
    }
    const data = await repository.getLoadAuditReport(factoryCode);
    return data || [];
  } catch (error) {
    throw new Error(`Failed to fetch load audit report: ${error.message}`);
  }
}

/**
 * GET: Audit Report Master
 */
async function getAuditReportMaster(season) {
  try {
    const data = await repository.getAuditReportMaster(season);
    return data || [];
  } catch (error) {
    throw new Error(`Failed to fetch audit report master: ${error.message}`);
  }
}

/**
 * POST: Audit Report Master (Create/Update)
 */
async function mutateAuditReportMaster(model, command) {
  try {
    if (!model) {
      return { error: true, status: 400, message: 'Model is required' };
    }
    
    const result = await repository.mutateAuditReportMaster(model, command);
    return { error: false, status: 201, data: result };
  } catch (error) {
    return { error: true, status: 500, message: error.message };
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
  exportAllAbnormalWeighments,
  exportToExcel,
  getAuditReport,
  getReasonWiseReport,
  getLoadAuditReport,
  getAuditReportMaster,
  mutateAuditReportMaster
};
