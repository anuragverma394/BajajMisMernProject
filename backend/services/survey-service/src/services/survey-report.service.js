const surveyReportRepository = require('../repositories/survey-report');

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

async function executeSurveyReportProcedure({ action, params, season }) {
  return surveyReportRepository.executeSurveyReportProcedure({ action, params, season });
}

const toNumber = (value) => {
  const num = Number(String(value ?? '').replace(/,/g, ''));
  return Number.isFinite(num) ? num : 0;
};

const round = (value, digits = 2) => {
  const num = toNumber(value);
  const factor = 10 ** digits;
  return Math.round(num * factor) / factor;
};

async function getDailyTeamWiseSurveyProgressReport({ fCode, date, userId, season }) {
  const factoryCode = String(fCode || '').trim();
  const surveyDate = String(date || '').trim();
  if (!factoryCode || !surveyDate) return [];

  const mobiles = userId ? await surveyReportRepository.getSurveyUserMobile({ userId, season }) : [];
  let blocks = [];

  if (mobiles.length > 0) {
    const mobile = String(mobiles[0]?.Mobile || '').trim();
    const cdoRows = mobile
      ? await surveyReportRepository.getSurveyCdoByMobile({ fCode: factoryCode, mobile, season })
      : [];

    if (cdoRows.length > 0) {
      const cdoCode = String(cdoRows[0]?.CDO_CODE || '').trim();
      const cdoGroup = String(cdoRows[0]?.CDO_GRP_CODE || '').trim();
      if (cdoCode) {
        blocks = await surveyReportRepository.getSurveyBlocksByCdo({
          fCode: factoryCode,
          cdoCode,
          cdoGroup,
          season
        });
      }
    }
  }

  if (blocks.length === 0) {
    blocks = await surveyReportRepository.getSurveyBlocks({ fCode: factoryCode, season });
  }

  const rows = [];

  let totalNoPlotOnDate = 0;
  let totalNoPlotToDate = 0;
  let totalAreaOnDate = 0;
  let totalAreaToDate = 0;
  let totalAvgOnDate = 0;
  let totalAvgToDate = 0;
  let totalAvgOnDateCount = 0;
  let totalAvgToDateCount = 0;
  let totalNonMemberOnDateArea = 0;
  let totalNonMemberToDateArea = 0;

  for (let i = 0; i < blocks.length; i += 1) {
    const block = blocks[i];
    const blockCode = String(block?.bl_code || block?.BL_CODE || block?.bl_Code || '').trim();
    const blockFactory = String(block?.bl_factcode || block?.BL_FACTCODE || block?.bl_factCode || factoryCode).trim();
    if (!blockCode || !blockFactory) continue;

    const supervisors = await surveyReportRepository.getSurveySupervisors({
      fCode: blockFactory,
      blockCode,
      season
    });

    if (!supervisors || supervisors.length === 0) continue;

    let blockNoPlotOnDate = 0;
    let blockNoPlotToDate = 0;
    let blockAreaOnDate = 0;
    let blockAreaToDate = 0;
    let blockAvgOnDate = 0;
    let blockAvgToDate = 0;
    let blockAvgOnDateCount = 0;
    let blockAvgToDateCount = 0;
    let blockNonMemberOnDateArea = 0;
    let blockNonMemberToDateArea = 0;

    for (let s = 0; s < supervisors.length; s += 1) {
      const supervisor = supervisors[s];
      const supCode = String(supervisor?.SUPVCODE || '').trim();
      const supName = String(supervisor?.SUPVNAME || '').trim();

      const onDateRows = await surveyReportRepository.getSurveyDataOnDate({
        fCode: blockFactory,
        supCode,
        date: surveyDate,
        blockCode,
        season
      });

      const onDate = onDateRows?.[0] || {};
      const startTime = onDate?.StartTime || '0';
      const endTime = onDate?.EndTime || '0';
      const noPlotOnDate = toNumber(onDate?.NoofPlotOnDate);
      const areaOnDate = toNumber(onDate?.OnDateArea);
      const avgOnDate = toNumber(onDate?.AvgOnDate);

      if (noPlotOnDate) {
        blockNoPlotOnDate += noPlotOnDate;
        totalNoPlotOnDate += noPlotOnDate;
      }
      if (areaOnDate) {
        blockAreaOnDate += areaOnDate;
        totalAreaOnDate += areaOnDate;
      }
      if (avgOnDate > 0) {
        blockAvgOnDate += avgOnDate;
        blockAvgOnDateCount += 1;
        totalAvgOnDate += avgOnDate;
        totalAvgOnDateCount += 1;
      }

      let perOnDate = 0;
      if (areaOnDate > 0) {
        const nonMemberOnDateArea = toNumber(
          await surveyReportRepository.getSurveyNonMemberOnDate({
            fCode: blockFactory,
            supCode,
            date: surveyDate,
            blockCode,
            season
          })
        );
        if (nonMemberOnDateArea > 0) {
          blockNonMemberOnDateArea += nonMemberOnDateArea;
          totalNonMemberOnDateArea += nonMemberOnDateArea;
          perOnDate = round((nonMemberOnDateArea * 100) / areaOnDate, 2);
        }
      }

      const toDateRows = await surveyReportRepository.getSurveyDataToDate({
        fCode: blockFactory,
        supCode,
        date: surveyDate,
        blockCode,
        season
      });

      const toDate = toDateRows?.[0] || {};
      const noPlotToDate = toNumber(toDate?.NoofPlotToDate);
      const areaToDate = toNumber(toDate?.ToDateArea);
      const avgToDate = toNumber(toDate?.AvgToDate);

      if (noPlotToDate) {
        blockNoPlotToDate += noPlotToDate;
        totalNoPlotToDate += noPlotToDate;
      }
      if (areaToDate) {
        blockAreaToDate += areaToDate;
        totalAreaToDate += areaToDate;
      }
      if (avgToDate > 0) {
        blockAvgToDate += avgToDate;
        blockAvgToDateCount += 1;
        totalAvgToDate += avgToDate;
        totalAvgToDateCount += 1;
      }

      let perToDate = 0;
      if (areaToDate > 0) {
        const nonMemberToDateArea = toNumber(
          await surveyReportRepository.getSurveyNonMemberToDate({
            fCode: blockFactory,
            supCode,
            date: surveyDate,
            blockCode,
            season
          })
        );
        if (nonMemberToDateArea > 0) {
          blockNonMemberToDateArea += nonMemberToDateArea;
          totalNonMemberToDateArea += nonMemberToDateArea;
          perToDate = round((nonMemberToDateArea * 100) / areaToDate, 2);
        }
      }

      rows.push({
        SN: s === 0 ? String(i + 1) : '',
        Manager: s === 0 ? String(block?.ZoneIncharge || '') : '',
        Blockincharge: s === 0 ? String(block?.BlackIncharge || '') : '',
        Zone: s === 0 ? String(block?.bl_Name || block?.Bl_Name || '') : '',
        Surveyor: `(${supCode}) ${supName}`.trim(),
        StartSurvey: startTime,
        EndSurvey: endTime,
        NoPlotOnDate: noPlotOnDate,
        NoPlotToDate: noPlotToDate,
        AreaOnDate: areaOnDate,
        AreaToDate: areaToDate,
        AvgOnDate: round(avgOnDate, 3),
        AvgToDate: round(avgToDate, 3),
        PerOnDate: perOnDate,
        PerToDate: perToDate
      });
    }

    rows.push({
      SN: '',
      Manager: '',
      Blockincharge: '',
      Zone: '',
      Surveyor: 'Total',
      StartSurvey: '',
      EndSurvey: '',
      NoPlotOnDate: blockNoPlotOnDate,
      NoPlotToDate: blockNoPlotToDate,
      AreaOnDate: blockAreaOnDate,
      AreaToDate: blockAreaToDate,
      AvgOnDate: blockAvgOnDateCount > 0 ? round(blockAvgOnDate / blockAvgOnDateCount, 3) : 0,
      AvgToDate: blockAvgToDateCount > 0 ? round(blockAvgToDate / blockAvgToDateCount, 3) : 0,
      PerOnDate: blockAreaOnDate > 0 ? round((blockNonMemberOnDateArea / blockAreaOnDate) * 100, 2) : 0,
      PerToDate: blockAreaToDate > 0 ? round((blockNonMemberToDateArea / blockAreaToDate) * 100, 2) : 0
    });
  }

  if (rows.length > 0) {
    rows.push({
      SN: '',
      Manager: '',
      Blockincharge: '',
      Zone: '',
      Surveyor: 'Grand Total',
      StartSurvey: '',
      EndSurvey: '',
      NoPlotOnDate: totalNoPlotOnDate,
      NoPlotToDate: totalNoPlotToDate,
      AreaOnDate: totalAreaOnDate,
      AreaToDate: totalAreaToDate,
      AvgOnDate: totalAvgOnDateCount > 0 ? round(totalAvgOnDate / totalAvgOnDateCount, 3) : 0,
      AvgToDate: totalAvgToDateCount > 0 ? round(totalAvgToDate / totalAvgToDateCount, 3) : 0,
      PerOnDate: totalAreaOnDate > 0 ? round((totalNonMemberOnDateArea / totalAreaOnDate) * 100, 2) : 0,
      PerToDate: totalAreaToDate > 0 ? round((totalNonMemberToDateArea / totalAreaToDate) * 100, 2) : 0
    });
  }

  return rows;
}

const toInt = (value) => {
  const num = parseInt(String(value ?? '').replace(/,/g, ''), 10);
  return Number.isFinite(num) ? num : 0;
};

const toDecimal = (value) => {
  const num = Number(String(value ?? '').replace(/,/g, ''));
  return Number.isFinite(num) ? num : 0;
};

async function getDailyTeamWiseHourlySurveyProgressReport({ fCode, date, userId, season }) {
  const factoryCode = String(fCode || '').trim();
  const surveyDate = String(date || '').trim();
  if (!factoryCode || !surveyDate) return [];

  const mobiles = userId ? await surveyReportRepository.getSurveyUserMobile({ userId, season }) : [];
  let blocks = [];

  if (mobiles.length > 0) {
    const mobile = String(mobiles[0]?.Mobile || '').trim();
    const cdoRows = mobile
      ? await surveyReportRepository.getSurveyCdoByMobile({ fCode: factoryCode, mobile, season })
      : [];

    if (cdoRows.length > 0) {
      const cdoCode = String(cdoRows[0]?.CDO_CODE || '').trim();
      const cdoGroup = String(cdoRows[0]?.CDO_GRP_CODE || '').trim();
      if (cdoCode) {
        blocks = await surveyReportRepository.getSurveyBlocksByCdo({
          fCode: factoryCode,
          cdoCode,
          cdoGroup,
          season
        });
      }
    }
  }

  if (blocks.length === 0) {
    blocks = await surveyReportRepository.getSurveyBlocks({ fCode: factoryCode, season });
  }

  const rows = [];

  let tnopltondatep = 0;
  let tsareaondatep = 0;
  let tnopltondate = 0;
  let tnoplttodate = 0;
  let tsareaondate = 0;
  let tsareatodate = 0;
  let GWorkDays = 0;
  let GNonMemOnDatePer = 0;
  let GNonMemToDatePre = 0;

  let th6 = 0; let th7 = 0; let th8 = 0; let th9 = 0; let th10 = 0; let th11 = 0; let th12 = 0; let th13 = 0; let th14 = 0;
  let th15 = 0; let th16 = 0; let th17 = 0; let th18 = 0; let th19 = 0; let th20 = 0;

  for (let a = 0; a < blocks.length; a += 1) {
    const block = blocks[a];
    const blockCode = String(block?.bl_code || block?.BL_CODE || block?.bl_Code || '').trim();
    const blockFactory = String(block?.bl_factcode || block?.BL_FACTCODE || block?.bl_factCode || factoryCode).trim();
    if (!blockCode || !blockFactory) continue;

    const supervisors = await surveyReportRepository.getSurveySupervisors({
      fCode: blockFactory,
      blockCode,
      season
    });

    if (!supervisors || supervisors.length === 0) continue;

    let nopltondatep = 0;
    let sareaondatep = 0;
    let nopltondate = 0;
    let sareaondate = 0;
    let noplttodate = 0;
    let sareatodate = 0;
    let TotalAllDays = 0;
    let NoPlotToDate = 0;
    let AreaToDate = 0;
    let NonMemOnDatePer = 0;
    let NonMemToDatePre = 0;

    let h6 = 0; let h7 = 0; let h8 = 0; let h9 = 0; let h10 = 0; let h11 = 0; let h12 = 0; let h13 = 0; let h14 = 0;
    let h15 = 0; let h16 = 0; let h17 = 0; let h18 = 0; let h19 = 0; let h20 = 0;

    for (let s = 0; s < supervisors.length; s += 1) {
      const sup = supervisors[s];
      const supCode = String(sup?.SUPVCODE || '').trim();
      const supName = String(sup?.SUPVNAME || '').trim();

      const row = {
        SN: s === 0 ? String(a + 1) : '',
        Manager: s === 0 ? String(block?.ZoneIncharge || '') : '',
        Blockincharge: s === 0 ? String(block?.BlackIncharge || '') : '',
        Zone: s === 0 ? String(block?.bl_Name || block?.Bl_Name || '') : '',
        Surveyor: supName
      };

      const prevRows = await surveyReportRepository.getSurveyDataPrevOnDate({
        fCode: blockFactory,
        supCode,
        date: surveyDate,
        blockCode,
        season
      });
      const prev = prevRows?.[0] || {};
      row.PDNPlot = prev?.NoofPlotOnDate ?? 0;
      row.PDNArea = prev?.OnDateArea ?? 0;
      nopltondatep += toInt(prev?.NoofPlotOnDate);
      sareaondatep += toDecimal(prev?.OnDateArea);
      tnopltondatep += toInt(prev?.NoofPlotOnDate);
      tsareaondatep += toDecimal(prev?.OnDateArea);

      const hourlyRows = await surveyReportRepository.getSurveyDataHourlyOnDate({
        fCode: blockFactory,
        supCode,
        date: surveyDate,
        blockCode,
        season
      });
      const hourly = hourlyRows?.[0] || {};
      row.Hr6 = hourly?.Hr6 ?? 0;
      row.Hr7 = hourly?.Hr7 ?? 0;
      row.Hr8 = hourly?.Hr8 ?? 0;
      row.Hr9 = hourly?.Hr9 ?? 0;
      row.Hr10 = hourly?.Hr10 ?? 0;
      row.Hr11 = hourly?.Hr11 ?? 0;
      row.Hr12 = hourly?.Hr12 ?? 0;
      row.Hr13 = hourly?.Hr13 ?? 0;
      row.Hr14 = hourly?.Hr14 ?? 0;
      row.Hr15 = hourly?.Hr15 ?? 0;
      row.Hr16 = hourly?.Hr16 ?? 0;
      row.Hr17 = hourly?.Hr17 ?? 0;
      row.Hr18 = hourly?.Hr18 ?? 0;
      row.Hr19 = hourly?.Hr19 ?? 0;
      row.Hr20 = hourly?.Hr20 ?? 0;

      h6 += toInt(hourly?.Hr6); h7 += toInt(hourly?.Hr7); h8 += toInt(hourly?.Hr8); h9 += toInt(hourly?.Hr9);
      h10 += toInt(hourly?.Hr10); h11 += toInt(hourly?.Hr11); h12 += toInt(hourly?.Hr12); h13 += toInt(hourly?.Hr13);
      h14 += toInt(hourly?.Hr14); h15 += toInt(hourly?.Hr15); h16 += toInt(hourly?.Hr16); h17 += toInt(hourly?.Hr17);
      h18 += toInt(hourly?.Hr18); h19 += toInt(hourly?.Hr19); h20 += toInt(hourly?.Hr20);

      th6 += toInt(hourly?.Hr6); th7 += toInt(hourly?.Hr7); th8 += toInt(hourly?.Hr8); th9 += toInt(hourly?.Hr9);
      th10 += toInt(hourly?.Hr10); th11 += toInt(hourly?.Hr11); th12 += toInt(hourly?.Hr12); th13 += toInt(hourly?.Hr13);
      th14 += toInt(hourly?.Hr14); th15 += toInt(hourly?.Hr15); th16 += toInt(hourly?.Hr16); th17 += toInt(hourly?.Hr17);
      th18 += toInt(hourly?.Hr18); th19 += toInt(hourly?.Hr19); th20 += toInt(hourly?.Hr20);

      const onDateRows = await surveyReportRepository.getSurveyDataHourlyOnDateNOPArea({
        fCode: blockFactory,
        supCode,
        date: surveyDate,
        blockCode,
        season
      });
      const onDate = onDateRows?.[0] || {};
      row.NoPlotOnDate = onDate?.NoofPlotOnDate ?? 0;
      row.AreaOnDate = onDate?.OnDateArea ?? 0;
      nopltondate += toInt(onDate?.NoofPlotOnDate);
      sareaondate += toDecimal(onDate?.OnDateArea);
      tnopltondate += toInt(onDate?.NoofPlotOnDate);
      tsareaondate += toDecimal(onDate?.OnDateArea);

      if (s === 0) {
        const toDateRows = await surveyReportRepository.getSurveyDataToDate({
          fCode: blockFactory,
          supCode,
          date: surveyDate,
          blockCode,
          season
        });
        const toDate = toDateRows?.[0] || {};
        row.NoPlotToDate = toDate?.NoofPlotToDate ?? 0;
        row.AreaToDate = toDate?.ToDateArea ?? 0;
        noplttodate += toInt(toDate?.NoofPlotToDate);
        sareatodate += toDecimal(toDate?.ToDateArea);
        tnoplttodate += toInt(toDate?.NoofPlotToDate);
        tsareatodate += toDecimal(toDate?.ToDateArea);
      } else {
        const toDateRows = await surveyReportRepository.getSurveyDataHourlyToDate({
          fCode: blockFactory,
          supCode,
          date: surveyDate,
          blockCode,
          season
        });
        const toDate = toDateRows?.[0] || {};
        row.NoPlotToDate = toDate?.NoofPlotToDate ?? 0;
        row.AreaToDate = toDate?.ToDateArea ?? 0;

        NoPlotToDate = toDecimal(row.NoPlotToDate);
        AreaToDate = toDecimal(row.AreaToDate);

        noplttodate += toInt(toDate?.NoofPlotToDate);
        sareatodate += toDecimal(toDate?.ToDateArea);
        tnoplttodate += toInt(toDate?.NoofPlotToDate);
        tsareatodate += toDecimal(toDate?.ToDateArea);
      }

      const workingRows = await surveyReportRepository.getSurveyTotalWorking({
        fCode: blockFactory,
        supCode,
        date: surveyDate,
        blockCode,
        season
      });
      const working = workingRows?.[0] || {};
      row.TotalWorkingDays = working?.TotalWorkingDays ?? 0;
      const workingDays = toDecimal(working?.TotalWorkingDays);
      TotalAllDays += workingDays;
      if (workingDays !== 0) {
        row.NonMemOnDatePer = toDecimal(working?.ondatemem);
        row.NonMemToDatePre = toDecimal(working?.Todatemem);
        NonMemOnDatePer += toDecimal(row.NonMemOnDatePer);
        NonMemToDatePre += toDecimal(row.NonMemToDatePre);
        const totalPlot = workingDays ? (NoPlotToDate / workingDays) : 0;
        const totalArea = workingDays ? (AreaToDate / workingDays) : 0;
        row.AreaTotalAvg = toDecimal(totalPlot.toFixed(3));
        row.PlotTotalAvg = toDecimal(totalArea.toFixed(3));
      } else {
        row.AreaTotalAvg = 0;
        row.PlotTotalAvg = 0;
        row.TotalWorkingDays = 0;
        row.NonMemOnDatePer = 0;
      }

      rows.push(row);
    }

    const toatlplot = TotalAllDays ? (noplttodate / TotalAllDays) : 0;
    const toatlArea = TotalAllDays ? (sareatodate / TotalAllDays) : 0;

    rows.push({
      SN: '',
      Manager: '',
      Blockincharge: '',
      Zone: '',
      Surveyor: 'Total',
      PDNPlot: nopltondatep,
      PDNArea: sareaondatep,
      Hr6: h6, Hr7: h7, Hr8: h8, Hr9: h9, Hr10: h10, Hr11: h11, Hr12: h12, Hr13: h13, Hr14: h14,
      Hr15: h15, Hr16: h16, Hr17: h17, Hr18: h18, Hr19: h19, Hr20: h20,
      NoPlotOnDate: nopltondate,
      AreaOnDate: sareaondate,
      NoPlotToDate: noplttodate,
      AreaToDate: sareatodate,
      AreaTotalAvg: toDecimal(toatlplot.toFixed(3)),
      PlotTotalAvg: toDecimal(toatlArea.toFixed(3)),
      NonMemOnDatePer,
      NonMemToDatePre,
      TotalWorkingDays: TotalAllDays
    });

    GWorkDays += TotalAllDays;
    GNonMemOnDatePer += NonMemOnDatePer;
    GNonMemToDatePre += NonMemToDatePre;
  }

  if (rows.length > 0) {
    const Gtoatlplot = GWorkDays ? (tnoplttodate / GWorkDays) : 0;
    const GtoatlArea = GWorkDays ? (tsareatodate / GWorkDays) : 0;

    rows.push({
      SN: '',
      Manager: '',
      Blockincharge: '',
      Zone: '',
      Surveyor: 'Grand Total',
      PDNPlot: tnopltondatep,
      PDNArea: tsareaondatep,
      Hr6: th6, Hr7: th7, Hr8: th8, Hr9: th9, Hr10: th10, Hr11: th11, Hr12: th12, Hr13: th13, Hr14: th14,
      Hr15: th15, Hr16: th16, Hr17: th17, Hr18: th18, Hr19: th19, Hr20: th20,
      NoPlotOnDate: tnopltondate,
      AreaOnDate: tsareaondate,
      NoPlotToDate: tnoplttodate,
      AreaToDate: tsareatodate,
      AreaTotalAvg: toDecimal(Gtoatlplot.toFixed(3)),
      PlotTotalAvg: toDecimal(GtoatlArea.toFixed(3)),
      NonMemOnDatePer: GNonMemOnDatePer,
      NonMemToDatePre: GNonMemToDatePre,
      TotalWorkingDays: GWorkDays
    });
  }

  return rows;
}

const toNumberSafe = (value) => {
  const num = Number(String(value ?? '').replace(/,/g, ''));
  return Number.isFinite(num) ? num : 0;
};

const sumFields = (rows) => {
  const totals = {
    TVillage: 0,
    VillageCNo: 0,
    VillageCArea: 0,
    VillageRFANo: 0,
    VillageRFAArea: 0,
    VillageUPNo: 0,
    VillageUPArea: 0,
    TotalSNo: 0,
    TotalSArea: 0,
    BalVillage: 0
  };
  rows.forEach((row) => {
    totals.TVillage += toNumberSafe(row.TVillage);
    totals.VillageCNo += toNumberSafe(row.VillageCNo);
    totals.VillageCArea += toNumberSafe(row.VillageCArea);
    totals.VillageRFANo += toNumberSafe(row.VillageRFANo);
    totals.VillageRFAArea += toNumberSafe(row.VillageRFAArea);
    totals.VillageUPNo += toNumberSafe(row.VillageUPNo);
    totals.VillageUPArea += toNumberSafe(row.VillageUPArea);
    totals.TotalSNo += toNumberSafe(row.TotalSNo);
    totals.TotalSArea += toNumberSafe(row.TotalSArea);
    totals.BalVillage += toNumberSafe(row.BalVillage);
  });
  return totals;
};

const resolveConnectionSeason = (season, connectionSeason) => {
  const direct = String(connectionSeason || '').trim();
  if (direct) return direct;
  const input = String(season || '2526');
  if (input.length !== 4) return '';
  const part1 = Number(input.slice(0, 2)) - 1;
  const part2 = Number(input.slice(2, 4)) - 1;
  if (Number.isNaN(part1) || Number.isNaN(part2)) return '';
  return `BajajCane${part1.toString().padStart(2, '0')}${part2.toString().padStart(2, '0')}`;
};

const mapFinalVillageRow = (row = {}) => {
  const RATOON_LY = toNumberSafe(row?.RATOON_LY);
  const AUTUMN_LY = toNumberSafe(row?.AUTUMN_LY);
  const PLANT_LY = toNumberSafe(row?.PLANT_LY);
  const Total_LY = toNumberSafe(row?.Total_LY) || RATOON_LY + AUTUMN_LY + PLANT_LY;

  const RATOON = toNumberSafe(row?.RATOON);
  const RATOONII = toNumberSafe(row?.RATOONII);
  const AUTUMN = toNumberSafe(row?.AUTUMN);
  const PLANT = toNumberSafe(row?.PLANT);
  const Total = toNumberSafe(row?.Total) || RATOON + RATOONII + AUTUMN + PLANT;

  const RatoonDiff = toNumberSafe(row?.RatoonDiff) || RATOON - RATOON_LY;
  const AUTUMNDIFF = toNumberSafe(row?.AUTUMNDIFF) || AUTUMN - AUTUMN_LY;
  const PLANTDIFF = toNumberSafe(row?.PLANTDIFF) || PLANT - PLANT_LY;
  const TotalDiff = toNumberSafe(row?.TotalDiff) || Total - Total_LY;
  const DiffPer = toNumberSafe(row?.DiffPer) || (Total_LY === 0 ? TotalDiff * 100 : (TotalDiff / Total_LY) * 100);
  const Ratoonagainstlastyearplant = toNumberSafe(row?.Ratoonagainstlastyearplant)
    || ((PLANT_LY + AUTUMN_LY) === 0 ? RATOON * 100 : (RATOON / (PLANT_LY + AUTUMN_LY)) * 100);

  return {
    gh_plvill: row?.gh_plvill ?? row?.VillCode ?? row?.VillageCode ?? row?.Village ?? 0,
    v_name: row?.v_name ?? row?.V_Name ?? row?.VillageName ?? '',
    RATOON_LY,
    AUTUMN_LY,
    PLANT_LY,
    Total_LY,
    RATOON,
    RATOONII,
    AUTUMN,
    PLANT,
    Total,
    RatoonDiff,
    AUTUMNDIFF,
    PLANTDIFF,
    TotalDiff,
    DiffPer,
    Ratoonagainstlastyearplant
  };
};

const sumFinalVillageTotals = (rows = []) => rows.reduce((acc, row) => {
  acc.RATOON_LY += toNumberSafe(row.RATOON_LY);
  acc.AUTUMN_LY += toNumberSafe(row.AUTUMN_LY);
  acc.PLANT_LY += toNumberSafe(row.PLANT_LY);
  acc.Total_LY += toNumberSafe(row.Total_LY);
  acc.RATOON += toNumberSafe(row.RATOON);
  acc.RATOONII += toNumberSafe(row.RATOONII);
  acc.AUTUMN += toNumberSafe(row.AUTUMN);
  acc.PLANT += toNumberSafe(row.PLANT);
  acc.Total += toNumberSafe(row.Total);
  acc.RatoonDiff += toNumberSafe(row.RatoonDiff);
  acc.AUTUMNDIFF += toNumberSafe(row.AUTUMNDIFF);
  acc.PLANTDIFF += toNumberSafe(row.PLANTDIFF);
  acc.TotalDiff += toNumberSafe(row.TotalDiff);
  return acc;
}, {
  RATOON_LY: 0,
  AUTUMN_LY: 0,
  PLANT_LY: 0,
  Total_LY: 0,
  RATOON: 0,
  RATOONII: 0,
  AUTUMN: 0,
  PLANT: 0,
  Total: 0,
  RatoonDiff: 0,
  AUTUMNDIFF: 0,
  PLANTDIFF: 0,
  TotalDiff: 0
});

async function getFinalVillageFirstSurveyReport({ fCode, caneType, onlyCompleted, season, connectionSeason }) {
  const caneAreaType = String(caneType || '').toLowerCase().includes('caneup') ? '2' : '1';
  const procedure = caneAreaType === '2' ? 'Mis_FinalVillageGashtiAmity' : 'Mis_FinalVillage';
  const listCode = String(fCode || '0').trim();
  const connection = resolveConnectionSeason(season, connectionSeason);

  const result = await surveyReportRepository.getFinalVillageFirstSurveyReport({
    params: {
      procedure,
      queryParams: { fact: listCode, ConnectionSeason: connection }
    },
    season
  });

  const rows = (result?.rows || []).map(mapFinalVillageRow);

  let filteredRows = rows;
  if (onlyCompleted) {
    const list1 = await surveyReportRepository.getFinalVillageList({ fCode: listCode, season });
    const villages = new Set((list1 || []).map((r) => String(r?.gh_plvill)));
    filteredRows = rows.filter((r) => villages.has(String(r?.gh_plvill)));
  }

  const totals = sumFinalVillageTotals(filteredRows);
  const diffPer = totals.Total_LY === 0 ? totals.TotalDiff * 100 : (totals.TotalDiff / totals.Total_LY) * 100;
  const ratoonAgainst = (totals.PLANT_LY + totals.AUTUMN_LY) === 0
    ? totals.RATOON * 100
    : (totals.RATOON / (totals.PLANT_LY + totals.AUTUMN_LY)) * 100;

  return {
    data: filteredRows,
    totals: {
      ...totals,
      DiffPer: diffPer,
      Ratoonagainstlastyearplant: ratoonAgainst
    }
  };
}

async function getFinalVillageFirstSurveySummeryReport({ caneType, userId, season, connectionSeason }) {
  const caneAreaType = String(caneType || '').toLowerCase().includes('caneup') ? '2' : '1';
  const procedure = caneAreaType === '2' ? 'mis_final_rpt_sumgashtiAmity' : 'mis_final_rpt_sum';
  const connection = resolveConnectionSeason(season, connectionSeason);

  const result = await surveyReportRepository.getFinalVillageFirstSurveySummeryReport({
    params: {
      procedure,
      queryParams: { factuser: userId || '1', ConnectionSeason: connection }
    },
    season
  });

  const rows = (result?.rows || []).map(mapFinalVillageRow).map((row) => ({
    ...row,
    Factory: row?.Factory ?? row?.FactoryCode ?? row?.fact ?? 0,
    FactName: row?.FactName ?? row?.FactoryName ?? row?.F_Name ?? ''
  }));

  const totals = sumFinalVillageTotals(rows);
  const diffPer = totals.Total_LY === 0 ? totals.TotalDiff * 100 : (totals.TotalDiff / totals.Total_LY) * 100;
  const ratoonAgainst = (totals.PLANT_LY + totals.AUTUMN_LY) === 0
    ? totals.RATOON * 100
    : (totals.RATOON / (totals.PLANT_LY + totals.AUTUMN_LY)) * 100;

  return {
    data: rows,
    totals: {
      ...totals,
      DiffPer: diffPer,
      Ratoonagainstlastyearplant: ratoonAgainst
    }
  };
}

async function getSurveyUnitWiseSurveyStatusReport({ fCode, caneType, season }) {
  const factoryCode = String(fCode || '').trim();
  const listCode = factoryCode === '0' ? '' : factoryCode;
  const caneAreaType = String(caneType || '1').trim() || '1';

  const factories = await surveyReportRepository.getSurveyFactory({ fCode: listCode, season });
  if (!factories || factories.length === 0) return [];

  const rows = [];

  for (let a = 0; a < factories.length; a += 1) {
    const factory = factories[a];
    const factoryId = String(factory?.F_Code || factory?.f_code || '').trim();
    const factoryShort = String(factory?.F_Short || factory?.F_Name || '').trim();

    const dataRows = factoryId
      ? await surveyReportRepository.getSurveyUnitWiseSurveyStatus({
        fCode: factoryId,
        caneType: caneAreaType,
        season
      })
      : [];

    const data = dataRows?.[0] || {};

    rows.push({
      SN: String(a + 1),
      Factory: factoryShort,
      SurStartDate: data?.StartDate || '',
      TVillage: toNumberSafe(data?.TotalVillage),
      VillageCNo: toNumberSafe(data?.CompVillage),
      VillageCArea: toNumberSafe(data?.CompArea),
      VillageRFANo: toNumberSafe(data?.RFAVillage),
      VillageRFAArea: toNumberSafe(data?.RFAArea),
      VillageUPNo: toNumberSafe(data?.UPVillage),
      VillageUPArea: toNumberSafe(data?.UPArea),
      TotalSNo: toNumberSafe(data?.SurVillage),
      TotalSArea: toNumberSafe(data?.SurArea),
      BalVillage: toNumberSafe(data?.BalVillage)
    });

    if (listCode === '' && a === 4) {
      const totals = sumFields(rows);
      rows.push({
        SN: '',
        Factory: 'West Zone',
        SurStartDate: '',
        ...totals
      });
    }

    if (listCode === '' && a === 9) {
      const westIndex = rows.findIndex((row) => row.Factory === 'West Zone');
      const slice = westIndex >= 0 ? rows.slice(westIndex + 1) : rows;
      const totals = sumFields(slice);
      rows.push({
        SN: '',
        Factory: 'Central Zone',
        SurStartDate: '',
        ...totals
      });
    }

    if (listCode === '' && a === 13) {
      const centralIndex = rows.findIndex((row) => row.Factory === 'Central Zone');
      const slice = centralIndex >= 0 ? rows.slice(centralIndex + 1) : rows;
      const totals = sumFields(slice);
      rows.push({
        SN: '',
        Factory: 'Eeast Zone',
        SurStartDate: '',
        ...totals
      });
    }
  }

  if (listCode === '') {
    const zoneRows = rows.filter((row) =>
      ['West Zone', 'Central Zone', 'Eeast Zone'].includes(String(row.Factory || '').trim())
    );
    if (zoneRows.length > 0) {
      const totals = sumFields(zoneRows);
      rows.push({
        SN: '',
        Factory: 'Total',
        SurStartDate: '',
        ...totals
      });
    }
  }

  return rows;
}

const sumAreaSummaryRows = (rows) => {
  const totals = {
    PreRatoon: 0,
    PreAutumn: 0,
    PrePlant: 0,
    PreTotal: 0,
    CRatoon: 0,
    CRatoon2: 0,
    CAutumn: 0,
    CPlant: 0,
    CTotal: 0
  };
  rows.forEach((row) => {
    totals.PreRatoon += toNumberSafe(row.PreRatoon);
    totals.PreAutumn += toNumberSafe(row.PreAutumn);
    totals.PrePlant += toNumberSafe(row.PrePlant);
    totals.PreTotal += toNumberSafe(row.PreTotal);
    totals.CRatoon += toNumberSafe(row.CRatoon);
    totals.CRatoon2 += toNumberSafe(row.CRatoon2);
    totals.CAutumn += toNumberSafe(row.CAutumn);
    totals.CPlant += toNumberSafe(row.CPlant);
    totals.CTotal += toNumberSafe(row.CTotal);
  });
  return totals;
};

async function getSurveyUnitWiseSurveyAreaSummaryReport({ fCode, date, caneType, season, connectionSeason }) {
  const factoryCode = String(fCode || '').trim();
  const listCode = factoryCode === '0' ? '' : factoryCode;
  const caneAreaType = String(caneType || '1').trim() || '1';
  const prevSeasonDb = resolveConnectionSeason(season, connectionSeason);
  const hasPrevDb = await surveyReportRepository.databaseExists({ dbName: prevSeasonDb, season });
  const prevDbName = hasPrevDb ? prevSeasonDb : '';

  const factories = await surveyReportRepository.getSurveyFactory({ fCode: listCode, season });
  if (!factories || factories.length === 0) return [];
  

  const rows = [];

  for (let a = 0; a < factories.length; a += 1) {
    const factory = factories[a];
    const factoryId = String(factory?.F_Code || factory?.f_code || '').trim();
    const factoryShort = String(factory?.F_Short || factory?.F_Name || '').trim();

    const preRows = factoryId
      ? await (caneAreaType === '2'
        ? surveyReportRepository.getUnitwiseSurveyAreaSummaryPreGashtiAmity({
          fCode: factoryId,
          connectionSeason: prevDbName,
          season
        })
        : surveyReportRepository.getUnitwiseSurveyAreaSummaryPre({
          fCode: factoryId,
          connectionSeason: prevDbName,
          season
        }))
      : [];

    let preRatoon = 0;
    let preAutumn = 0;
    let prePlant = 0;

    if (preRows && preRows.length > 0) {
      preRows.forEach((row) => {
        const plantCycle = Number(row?.gh_pl_rt);
        if (plantCycle === 1) preRatoon += toNumberSafe(row?.gh_area);
        if (plantCycle === 2) preAutumn += toNumberSafe(row?.gh_area);
        if (plantCycle === 3) prePlant += toNumberSafe(row?.gh_area);
      });
    }

    const preTotal = preRatoon + preAutumn + prePlant;

    const curRows = factoryId
      ? await (caneAreaType === '2'
        ? surveyReportRepository.getUnitwiseSurveyAreaSummaryCurGashtiAmity({
          fCode: factoryId,
          season
        })
        : surveyReportRepository.getUnitwiseSurveyAreaSummaryCur({
          fCode: factoryId,
          season
        }))
      : [];

    let cRatoon = 0;
    let cRatoon2 = 0;
    let cAutumn = 0;
    let cPlant = 0;

    if (curRows && curRows.length > 0) {
      curRows.forEach((row) => {
        const cycle = String(row?.gh_pl_rt || '').toUpperCase();
        if (cycle === 'RATOON') cRatoon += toNumberSafe(row?.gh_area);
        if (cycle === 'RATOONII') cRatoon2 += toNumberSafe(row?.gh_area);
        if (cycle === 'AUTUMN') cAutumn += toNumberSafe(row?.gh_area);
        if (cycle === 'PLANT') cPlant += toNumberSafe(row?.gh_area);
      });
    }

    const cTotal = cRatoon + cRatoon2 + cAutumn + cPlant;
    const varianceH = preTotal > 0 && cTotal > 0 ? cTotal - preTotal : 0;
    const varianceP = preTotal > 0 && cTotal > 0 ? round((varianceH / preTotal) * 100, 3) : 0;

    rows.push({
      SN: String(a + 1),
      Factory: factoryShort,
      PreRatoon: preRatoon,
      PreAutumn: preAutumn,
      PrePlant: prePlant,
      PreTotal: preTotal,
      CRatoon: cRatoon,
      CRatoon2: cRatoon2,
      CAutumn: cAutumn,
      CPlant: cPlant,
      CTotal: cTotal,
      VarianceH: varianceH,
      VarianceP: varianceP
    });

    if (listCode === '' && a === 4) {
      const totals = sumAreaSummaryRows(rows);
      const varianceZone = totals.PreTotal > 0 && totals.CTotal > 0 ? totals.CTotal - totals.PreTotal : 0;
      rows.push({
        SN: '',
        Factory: 'West Zone',
        ...totals,
        VarianceH: varianceZone,
        VarianceP: totals.PreTotal > 0 && totals.CTotal > 0 ? round((varianceZone / totals.PreTotal) * 100, 3) : 0
      });
    }

    if (listCode === '' && a === 9) {
      const westIndex = rows.findIndex((row) => row.Factory === 'West Zone');
      const slice = westIndex >= 0 ? rows.slice(westIndex + 1) : rows;
      const totals = sumAreaSummaryRows(slice);
      const varianceZone = totals.PreTotal > 0 && totals.CTotal > 0 ? totals.CTotal - totals.PreTotal : 0;
      rows.push({
        SN: '',
        Factory: 'Central Zone',
        ...totals,
        VarianceH: varianceZone,
        VarianceP: totals.PreTotal > 0 && totals.CTotal > 0 ? round((varianceZone / totals.PreTotal) * 100, 3) : 0
      });
    }

    if (listCode === '' && a === 13) {
      const centralIndex = rows.findIndex((row) => row.Factory === 'Central Zone');
      const slice = centralIndex >= 0 ? rows.slice(centralIndex + 1) : rows;
      const totals = sumAreaSummaryRows(slice);
      const varianceZone = totals.PreTotal > 0 && totals.CTotal > 0 ? totals.CTotal - totals.PreTotal : 0;
      rows.push({
        SN: '',
        Factory: 'Eeast Zone',
        ...totals,
        VarianceH: varianceZone,
        VarianceP: totals.PreTotal > 0 && totals.CTotal > 0 ? round((varianceZone / totals.PreTotal) * 100, 3) : 0
      });
    }
  }

  if (listCode === '') {
    const zoneRows = rows.filter((row) =>
      ['West Zone', 'Central Zone', 'Eeast Zone'].includes(String(row.Factory || '').trim())
    );
    if (zoneRows.length > 0) {
      const totals = sumAreaSummaryRows(zoneRows);
      const varianceTotal = totals.PreTotal > 0 && totals.CTotal > 0 ? totals.CTotal - totals.PreTotal : 0;
      rows.push({
        SN: '',
        Factory: 'Total',
        ...totals,
        VarianceH: varianceTotal,
        VarianceP: totals.PreTotal > 0 && totals.CTotal > 0 ? round((varianceTotal / totals.PreTotal) * 100, 3) : 0
      });
    }
  }

  return rows;
}

module.exports = {
  getFactoryWiseCaneAreaReport,
  executeSurveyReportProcedure,
  getPlotWiseDetails,
  getCategoryWiseSummary,
  getCaneVierityVillageGrower,
  getWeeklySubmissionOfAutumnPlantingIndent,
  getWeeklySubmissionOfIndents,
  getFinalVillageFirstSurveyReport,
  getFinalVillageFirstSurveySummeryReport,
  getDailyTeamWiseSurveyProgressReport,
  getDailyTeamWiseHourlySurveyProgressReport,
  getSurveyUnitWiseSurveyStatusReport,
  getSurveyUnitWiseSurveyAreaSummaryReport
};
