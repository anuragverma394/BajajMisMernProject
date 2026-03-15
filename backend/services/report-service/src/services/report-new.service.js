const repository = require('../repositories/report-new.repository');

/**
 * GET: Hourly Cane Arrival Weight
 */
async function getHourlyCaneArrivalWeight(season) {
  try {
    const data = await repository.getHourlyCaneArrivalWeight(season);
    return data || [];
  } catch (error) {
    throw new Error(`Failed to fetch hourly cane arrival weight: ${error.message}`);
  }
}

/**
 * GET: Indent Purchase Report New
 */
async function getIndentPurchaseReportNew(season) {
  try {
    const data = await repository.getIndentPurchaseReportNew(season);
    return data || [];
  } catch (error) {
    throw new Error(`Failed to fetch indent purchase report: ${error.message}`);
  }
}

/**
 * POST: Indent Purchase Report (Create/Update)
 */
async function mutateIndentPurchaseReport(model, command) {
  try {
    if (!model) {
      return { error: true, status: 400, message: 'Model is required' };
    }
    
    const result = await repository.mutateIndentPurchaseReport(model, command);
    return { error: false, status: 201, data: result };
  } catch (error) {
    return { error: true, status: 500, message: error.message };
  }
}

/**
 * GET: Center Indent Purchase Report
 */
async function getCenterIndentPurchaseReport(centerCode, season) {
  try {
    const data = await repository.getCenterIndentPurchaseReport(centerCode, season);
    return data || [];
  } catch (error) {
    throw new Error(`Failed to fetch center indent purchase report: ${error.message}`);
  }
}

/**
 * GET: Centre Purchase Truck Report New
 */
async function getCentrePurchaseTruckReportNew(season) {
  try {
    const data = await repository.getCentrePurchaseTruckReportNew(season);
    return data || [];
  } catch (error) {
    throw new Error(`Failed to fetch centre purchase truck report: ${error.message}`);
  }
}

/**
 * POST: Centre Purchase Truck Report (Create/Update)
 */
async function mutateCentrePurchaseTruckReport(model, command) {
  try {
    if (!model) {
      return { error: true, status: 400, message: 'Model is required' };
    }
    
    const result = await repository.mutateCentrePurchaseTruckReport(model, command);
    return { error: false, status: 201, data: result };
  } catch (error) {
    return { error: true, status: 500, message: error.message };
  }
}

/**
 * GET: Zone Centre Wise Truck Details
 */
async function getZoneCentreWiseTruckDetails(zone, centre, season) {
  try {
    const data = await repository.getZoneCentreWiseTruckDetails(zone, centre, season);
    return data || [];
  } catch (error) {
    throw new Error(`Failed to fetch zone-centre truck details: ${error.message}`);
  }
}

/**
 * GET: Center Balance Report
 */
async function getCenterBalanceReport(season) {
  try {
    const data = await repository.getCenterBalanceReport(season);
    return data || [];
  } catch (error) {
    throw new Error(`Failed to fetch center balance report: ${error.message}`);
  }
}

/**
 * POST: Center Balance Report (Create/Update)
 */
async function mutateCenterBalanceReport(model, command) {
  try {
    if (!model) {
      return { error: true, status: 400, message: 'Model is required' };
    }
    
    const result = await repository.mutateCenterBalanceReport(model, command);
    return { error: false, status: 201, data: result };
  } catch (error) {
    return { error: true, status: 500, message: error.message };
  }
}

/**
 * GET: Get Centers for Factory
 */
async function getCentersForFactory(factoryCode) {
  try {
    if (!factoryCode) {
      throw new Error('Factory code is required');
    }
    const data = await repository.getCentersForFactory(factoryCode);
    return data || [];
  } catch (error) {
    throw new Error(`Failed to fetch centers: ${error.message}`);
  }
}

/**
 * GET: Cane Purchase Report
 */
async function getCanePurchaseReport(season) {
  try {
    const data = await repository.getCanePurchaseReport(season);
    return data || [];
  } catch (error) {
    throw new Error(`Failed to fetch cane purchase report: ${error.message}`);
  }
}

/**
 * POST: Cane Purchase Report (Create/Update)
 */
async function mutateCanePurchaseReport(model, command) {
  try {
    if (!model) {
      return { error: true, status: 400, message: 'Model is required' };
    }
    
    const result = await repository.mutateCanePurchaseReport(model, command);
    return { error: false, status: 201, data: result };
  } catch (error) {
    return { error: true, status: 500, message: error.message };
  }
}

/**
 * GET: Sample Of Transporter
 */
async function getSampleOfTransporter(season) {
  try {
    const data = await repository.getSampleOfTransporter(season);
    return data || [];
  } catch (error) {
    throw new Error(`Failed to fetch transporter samples: ${error.message}`);
  }
}

/**
 * POST: Sample Of Transporter (Create/Update)
 */
async function mutateSampleOfTransporter(model, command) {
  try {
    if (!model) {
      return { error: true, status: 400, message: 'Model is required' };
    }
    
    const result = await repository.mutateSampleOfTransporter(model, command);
    return { error: false, status: 201, data: result };
  } catch (error) {
    return { error: true, status: 500, message: error.message };
  }
}

/**
 * GET: Get Zone By Factory/Userid
 */
async function getZoneByFactory(zone, userid) {
  try {
    if (!zone || !userid) {
      throw new Error('Zone and userid are required');
    }
    const data = await repository.getZoneByFactory(zone, userid);
    return data || [];
  } catch (error) {
    throw new Error(`Failed to fetch zones: ${error.message}`);
  }
}

/**
 * GET: Get Transporter By Factory
 */
async function getTransporterByFactory(factoryCode) {
  try {
    if (!factoryCode) {
      throw new Error('Factory code is required');
    }
    const data = await repository.getTransporterByFactory(factoryCode);
    return data || [];
  } catch (error) {
    throw new Error(`Failed to fetch transporters: ${error.message}`);
  }
}

/**
 * GET: API Status Report
 */
async function getApiStatusReport(season) {
  try {
    const data = await repository.getApiStatusReport(season);
    return data || [];
  } catch (error) {
    throw new Error(`Failed to fetch API status report: ${error.message}`);
  }
}

/**
 * POST: API Status Report (Create/Update)
 */
async function mutateApiStatusReport(model, command) {
  try {
    if (!model) {
      return { error: true, status: 400, message: 'Model is required' };
    }
    
    const result = await repository.mutateApiStatusReport(model, command);
    return { error: false, status: 201, data: result };
  } catch (error) {
    return { error: true, status: 500, message: error.message };
  }
}

/**
 * POST: Resend API Status Report
 */
async function resendApiStatusReport(id, factoryCode) {
  try {
    if (!id || !factoryCode) {
      return { error: true, status: 400, message: 'ID and factory code are required' };
    }
    
    const result = await repository.resendApiStatusReport(id, factoryCode);
    return { error: false, status: 200, data: result };
  } catch (error) {
    return { error: true, status: 500, message: error.message };
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
