const { executeProcedure, executeQuery } = require('../core/db/query-executor');

/**
 * Get Hourly Cane Arrival Weight
 */
async function getHourlyCaneArrivalWeight(season) {
  try {
    const result = await executeProcedure('sp_GetHourlyCaneArrivalWeight', { Season: season });
    return result || [];
  } catch (error) {
    console.error('[ReportNewRepository] getHourlyCaneArrivalWeight error:', error.message);
    throw error;
  }
}

/**
 * Get Indent Purchase Report New
 */
async function getIndentPurchaseReportNew(season) {
  try {
    const result = await executeProcedure('sp_GetIndentPurchaseReportNew', { Season: season });
    return result || [];
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
async function getCentrePurchaseTruckReportNew(season) {
  try {
    const result = await executeProcedure('sp_GetCentrePurchaseTruckReportNew', { Season: season });
    return result || [];
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
async function getZoneCentreWiseTruckDetails(zone, centre, season) {
  try {
    const result = await executeProcedure('sp_GetZoneCentreWiseTruckDetails', { Zone: zone, Centre: centre, Season: season });
    return result || [];
  } catch (error) {
    console.error('[ReportNewRepository] getZoneCentreWiseTruckDetails error:', error.message);
    throw error;
  }
}

/**
 * Get Center Balance Report
 */
async function getCenterBalanceReport(season) {
  try {
    const result = await executeProcedure('sp_GetCenterBalanceReport', { Season: season });
    return result || [];
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
async function getCentersForFactory(factoryCode) {
  try {
    const result = await executeProcedure('sp_GetCentersForFactory', { FactoryCode: factoryCode });
    return result || [];
  } catch (error) {
    console.error('[ReportNewRepository] getCentersForFactory error:', error.message);
    throw error;
  }
}

/**
 * Get Cane Purchase Report
 */
async function getCanePurchaseReport(season) {
  try {
    const result = await executeProcedure('sp_GetCanePurchaseReport', { Season: season });
    return result || [];
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
async function getSampleOfTransporter(season) {
  try {
    const result = await executeProcedure('sp_GetSampleOfTransporter', { Season: season });
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
async function getZoneByFactory(zone, userid) {
  try {
    const result = await executeProcedure('sp_GetZoneByFactory', { Zone: zone, Userid: userid });
    return result || [];
  } catch (error) {
    console.error('[ReportNewRepository] getZoneByFactory error:', error.message);
    throw error;
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
async function getApiStatusReport(season) {
  try {
    const result = await executeProcedure('sp_GetApiStatusReport', { Season: season });
    return result || [];
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
async function resendApiStatusReport(id, factoryCode) {
  try {
    const result = await executeProcedure('sp_ResendApiStatusReport', { ID: id, FactoryCode: factoryCode });
    return result || { success: true };
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
