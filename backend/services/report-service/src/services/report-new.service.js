const repository = require('../repositories/report-new');

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
async function getIndentPurchaseReportNew(params, season) {
  try {
    const data = await repository.getIndentPurchaseReportNew(params, season);
    const gateRows = Array.isArray(data?.gateRows) ? data.gateRows : [];
    const zoneRows = Array.isArray(data?.zoneRows) ? data.zoneRows : [];
    const rows = [...gateRows, ...zoneRows];

    const withExp = rows.map((row) => {
      const mature = Number(row.mature || 0);
      const backbalanceindent = Number(row.backbalanceindent || 0);
      const expur = mature > 0 ? Math.round((backbalanceindent * mature) / 100) : 0;
      return { ...row, expur };
    });

    const computeTotals = (list) => {
      const sum = list.reduce((acc, row) => {
        acc.onedaysbalnace += Number(row.onedaysbalnace || 0);
        acc.twodaysdaysbalnace += Number(row.twodaysdaysbalnace || 0);
        acc.TodayIndent += Number(row.TodayIndent || 0);
        acc.totalindenttoday += Number(row.totalindenttoday || 0);
        acc.purchase += Number(row.purchase || 0);
        acc.backonedaysbalnace += Number(row.backonedaysbalnace || 0);
        acc.backtwodaysdaysbalnace += Number(row.backtwodaysdaysbalnace || 0);
        acc.backTodayIndent += Number(row.backTodayIndent || 0);
        acc.backbalanceindent += Number(row.backbalanceindent || 0);
        return acc;
      }, {
        onedaysbalnace: 0,
        twodaysdaysbalnace: 0,
        TodayIndent: 0,
        totalindenttoday: 0,
        purchase: 0,
        backonedaysbalnace: 0,
        backtwodaysdaysbalnace: 0,
        backTodayIndent: 0,
        backbalanceindent: 0
      });

      const maturity = sum.totalindenttoday > 0
        ? Math.round((sum.purchase / sum.totalindenttoday) * 100)
        : 0;
      const expur = maturity > 0
        ? Math.round((sum.backbalanceindent * maturity) / 100)
        : 0;

      return { ...sum, mature: maturity, expur };
    };

    const zoneTotals = computeTotals(zoneRows);
    const grandTotals = computeTotals([...gateRows, ...zoneRows]);

    return { rows: withExp, totals: zoneTotals, grandTotals };
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
async function getCentrePurchaseTruckReportNew(params, season) {
  try {
    const rows = await repository.getCentrePurchaseTruckReportNew(params, season);
    const data = Array.isArray(rows) ? rows : [];
    const totals = data.reduce((acc, row) => {
      acc.openingbalance += Number(row.openingbalance || row.OpeningBalance || 0);
      acc.Cane += Number(row.Cane || row.cane || 0);
      acc.purchy += Number(row.purchy || row.Purchy || 0);
      acc.TotalCane += Number(row.TotalCane || row.totalcane || 0);
      acc.openingreceipt += Number(row.openingreceipt || row.OpeningReceipt || 0);
      acc.VehicleDispatch += Number(row.VehicleDispatch || row.vehicledispatch || 0);
      acc.VehicleReceive += Number(row.VehicleReceive || row.vehiclereceive || 0);
      acc.Standingyard += Number(row.Standingyard || row.standingyard || 0);
      acc.standingYardWeight += Number(row.standingYardWeight || row.standingyardweight || 0);
      acc.NosTransit += Number(row.NosTransit || row.nostransit || 0);
      acc.TransitWeight += Number(row.TransitWeight || row.transitweight || 0);
      acc.WeightedNos += Number(row.WeightedNos || row.weightednos || 0);
      acc.WeightedQty += Number(row.WeightedQty || row.weightedqty || 0);
      return acc;
    }, {
      openingbalance: 0,
      Cane: 0,
      purchy: 0,
      TotalCane: 0,
      openingreceipt: 0,
      VehicleDispatch: 0,
      VehicleReceive: 0,
      Standingyard: 0,
      standingYardWeight: 0,
      NosTransit: 0,
      TransitWeight: 0,
      WeightedNos: 0,
      WeightedQty: 0
    });

    return { rows: data, totals };
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
async function getZoneCentreWiseTruckDetails(params, season) {
  try {
    const data = await repository.getZoneCentreWiseTruckDetails(params, season);
    return data || [];
  } catch (error) {
    throw new Error(`Failed to fetch zone-centre truck details: ${error.message}`);
  }
}

/**
 * GET: Center Balance Report
 */
async function getCenterBalanceReport(params, season) {
  try {
    const data = await repository.getCenterBalanceReport(params, season);
    const rows = Array.isArray(data?.rows) ? data.rows : Array.isArray(data) ? data : [];
    return rows.map((row) => ({
      Center: row.Center ?? row.Centre ?? row.centre ?? row.C_Name ?? row.c_name ?? row.CenterName ?? row.CNTR ?? '',
      Clerk: row.WClerk ?? row.Clerk ?? row.wclerk ?? row.ClerkName ?? row.WCLERKNAME ?? '',
      PostingDate: row.PostingDate ?? row.Posting_Date ?? row.PostingDt ?? row.PDate ?? row.PDATE ?? row.postingdate ?? '',
      Desc: row.Desc ?? row.Description ?? row.Narration ?? row.desc ?? '',
      Purchase: Number(row.Purchase ?? row.PURCHASE ?? row.Pur ?? row.purchase ?? 0) || 0,
      Manual: Number(row.Manual ?? row.MANUAL ?? row.Man ?? row.manual ?? 0) || 0,
      Receipt: Number(row.Receipt ?? row.Reciept ?? row.RECEIPT ?? row.receipt ?? 0) || 0,
      Transit: Number(row.Transit ?? row.TRANSIT ?? row.transit ?? 0) || 0,
      CenterRunningBal: Number(
        row.CentreRunningBal ?? row.CenterRunningBal ?? row.CenterRunningBalance ?? row.CRunningBalance ?? row.centrerunningbal ?? 0
      ) || 0,
      Balance: Number(row.Balance ?? row.BALANCE ?? row.balance ?? 0) || 0
    }));
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
async function getCentersForFactory(factoryCode, season) {
  try {
    const factory =
      typeof factoryCode === 'object'
        ? String(
            factoryCode.Fact ??
            factoryCode.fact ??
            factoryCode.Factory ??
            factoryCode.factory ??
            factoryCode.F_code ??
            factoryCode.F_Code ??
            ''
          ).trim()
        : String(factoryCode || '').trim();

    if (!factory) {
      return [];
    }
    const data = await repository.getCentersForFactory(factory, season);
    return data || [];
  } catch (error) {
    throw new Error(`Failed to fetch centers: ${error.message}`);
  }
}

/**
 * GET: Cane Purchase Report
 */
function normalizeDmy(value) {
  const raw = String(value || '').trim();
  if (!raw) return '';
  const iso = raw.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (iso) return `${iso[3]}/${iso[2]}/${iso[1]}`;
  const dmy = raw.match(/^(\d{2})[-\/](\d{2})[-\/](\d{4})$/);
  if (dmy) return `${dmy[1]}/${dmy[2]}/${dmy[3]}`;
  return raw;
}

async function getCanePurchaseReport(params, season) {
  try {
    const rawFactory = String(params?.F_code ?? params?.F_Code ?? params?.factoryCode ?? params?.unitCode ?? '').trim();
    const factoryCode = (!rawFactory || rawFactory.toLowerCase() === 'all' || rawFactory === '0')
      ? 0
      : Number(rawFactory);
    const payload = {
      F_code: Number.isFinite(factoryCode) ? factoryCode : 0,
      FromDate: normalizeDmy(params?.FromDate ?? params?.fromDate ?? ''),
      ToDate: normalizeDmy(params?.ToDate ?? params?.toDate ?? '')
    };

    const result = await repository.getCanePurchaseReport(payload, season);
    const rows = Array.isArray(result?.rows) ? result.rows : Array.isArray(result) ? result : [];
    const extraRows = Array.isArray(result?.extraRows) ? result.extraRows : [];

    const totals = rows.reduce((acc, row) => {
      acc.OpeningBalance += Number(row.OpeningBalance || 0);
      acc.Period += Number(row.Period || 0);
      acc.GrandTotal += Number(row.GrandTotal || 0);
      return acc;
    }, { OpeningBalance: 0, Period: 0, GrandTotal: 0 });

    return { rows, totals, extraRows };
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
