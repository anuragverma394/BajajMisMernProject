# Report Service - Controllers Exports Reference

This document provides a complete listing of all controller exports organized by function signature patterns.

---

## Quick Navigation
- [report.controller.js](#reportcontrollerjs) - 40 exports
- [report-new.controller.js](#report-newcontrollerjs) - 19 exports
- [new-report.controller.js](#new-reportcontrollerjs) - 15 exports
- [account-reports.controller.js](#account-reportscontrollerjs) - 24 exports

---

## report.controller.js

**Base Handler**: `async (req, res, next) => {...}`
**CONTROLLER**: `'Report'`
**Dependencies**: reportService, reportRepository, reportControllerRepository

### Implemented Custom Logic (9)

#### GET/Query Handlers:
```javascript
✓ CrushingReport(req, res, next)
  - Params: F_code, Date (required)
  - Response: { success, message, data }
  - Status: 200

✓ Analysisdata(req, res, next)
  - Params: F_code (required), Date (required)
  - Response: { data }
  - Status: 200

✓ CentrePurchase(req, res, next)
  - Params: F_Code (required), Date (required)
  - Response: { success, message, data }
  - Status: 200

✓ EffectedCaneAreaReport(req, res, next)
  - Params: CaneArea, stateDropdown
  - Response: { success, data[] }
  - Status: 200

✓ CentreCode(req, res, next)
  - Params: Auto-resolved by service
  - Response: { success, message, data }
  - Status: 200

✓ Getdisease(req, res, next)
  - Params: Auto-resolved by service
  - Response: { success, message, data }
  - Status: 200

✓ SummaryReportUnitWise(req, res, next)
  - Params: Auto-resolved by service
  - Response: { success, message, data }
  - Status: 200
```

#### Aliased Methods:
```javascript
✓ CentreCode_2 = CentreCode (Same as CentreCode)
✓ SummaryReportUnitWise_2 = SummaryReportUnitWise (Same as SummaryReportUnitWise)
```

#### Repository-Based:
```javascript
✓ TruckDispatchWeighed
  - Source: reportControllerRepository.TruckDispatchWeighed
  - Behavior: Custom logic from repository
```

### Procedure Handlers (31)

**Pattern**: `createProcedureHandler(CONTROLLER, 'procedureName', 'signature')`

#### GET (No Params):
```javascript
✓ Imagesblub
✓ GetYesterdaytransitDetail
✓ GetTodaytransitDetail
✓ IndentFailSummary
✓ IndentFaillDetails
✓ TargetActualMISReport
✓ TargetActualMISPeriodReport
✓ DriageSummary
✓ DriageClerkSummary
✓ BudgetVSActual
✓ IndentFailSummaryNew
✓ HourlyCaneArrival
✓ SurveyPLot
✓ SurveyPLotDetails
```

#### GET (With Params):
```javascript
✓ LOADMODEWISEDATA(params: DATE, FACTCODE)
✓ LOADFACTORYDATA(params: FACTCODE, Date)
✓ Value(params: a)
✓ IndentFailSummaryData(params: F_code, Date)
✓ IndentFaillDetailsData(params: Date, FACT)
✓ txtdate_TextChanged(params: Date)
✓ next(params: Date)
✓ prev(params: Date)
✓ DriageDetail(params: FACT, DATE, CENTER)
✓ DriageClerkDetail(params: FACT, DATE, CLERK)
✓ DriageCentreDetail(params: FACT, DATE, CLERK, CENTER)
✓ DriageCentreClerkDetail()
✓ DriageClerkCentreDetail()
✓ IndentFailSummaryNewData(params: F_code, Date)
✓ LoansummaryRpt()
✓ LoansummaryRpt_2 = LoansummaryRpt
✓ SurveyPLot_2 = SurveyPLot
✓ DiseaseDetailsOnMap(params: usercode, Factorycode, Disease, FromDate, ToDate, PlotType)
✓ DiseaseDetailsOnMapTodate(params: usercode, Factorycode, Disease, ToDate, PlotType)
✓ SuveryCheckPlotsOnMapCurrent(params: usercode, Factorycode, FromDate, ToDate, PlotType)
✓ Checking_logPlots(params: F_code, UserCode, PlotType, Flag, fromdate, todate)
✓ Checking_logPlots_2 = Checking_logPlots
✓ CheckingDetailsOnMap(params: usercode, Factorycode, PlotType, FromDate, ToDate)
✓ DiseaseDetails(params: F_code, UserCode, PlotType, Flag, todate)
```

---

## report-new.controller.js

**Base Handler**: `createNotImplementedHandler(CONTROLLER, 'methodName', 'signature')`
**CONTROLLER**: `'ReportNew'`
**Status**: ⏳ ALL STUBS - Ready for implementation

### GET (19 stubs)

```javascript
⏳ HourlyCaneArrivalWieght()
  - Signature: (empty)
  - Expected: Fetch hourly cane arrival weight data
  
⏳ CenterIndentPurchaseReport()
  - Signature: (empty)
  - Expected: Fetch centre indent purchase reports

⏳ CentrePurchaseTruckReportNew()
  - Signature: (empty)
  - Expected: Fetch centre purchase truck reports

⏳ ZoneCentreWiseTruckdetails()
  - Signature: (empty)
  - Expected: Fetch zone-centre-wise truck details

⏳ CenterBlanceReport()
  - Signature: (empty)
  - Expected: Fetch centre-balance report

⏳ CanePurchaseReport()
  - Signature: (empty)
  - Expected: Fetch cane purchase report

⏳ SampleOfTransporter()
  - Signature: (empty)
  - Expected: Fetch transporter sample data

⏳ GetZoneByFactory(params: Zone, userid)
  - Signature: string Zone, string userid
  - Expected: Get zones for a factory and user

⏳ GetTransporterByFactory(params: Fcode)
  - Signature: string Fcode
  - Expected: Get transporters for a factory

⏳ ApiStatusReport()
  - Signature: (empty)
  - Expected: Fetch API status reports

⏳ ApiStatusReportResend(params: id, fcode)
  - Signature: string id, string fcode
  - Expected: Resend/retry API status report
```

### POST/PUT/MUTATE (6 stubs with _2 suffix)

```javascript
⏳ IndentPurchaseReportNew()
⏳ IndentPurchaseReportNew_2(params: IndentPurchase model, string Command)
  - Purpose: Create/Update indent purchase

⏳ CentrePurchaseTruckReportNew_2(params: IndentPurchase model, string Command)
  - Purpose: Create/Update centre purchase truck

⏳ CenterBlanceReport_2(params: centerblance model, string Command)
  - Purpose: Create/Update centre balance

⏳ CanePurchaseReport_2(params: CanePurchaseReportModels model, string Command)
  - Purpose: Create/Update cane purchase

⏳ SampleOfTransporter_2(params: SampleOfTransporterModel model, string Command)
  - Purpose: Create/Update sample transporter

⏳ ApiStatusReport_2(params: ApiStatusreportModel Model)
  - Purpose: Create/Update API status
```

### Helper/Utility (1)

```javascript
⏳ centerBind(params: Fact)
  - Signature: string Fact
  - Expected: Bind/Load centre data for factory
```

---

## new-report.controller.js

**Base Handler**: `createNotImplementedHandler(CONTROLLER, 'methodName', 'signature')`
**CONTROLLER**: `'NewReport'`
**Status**: ⏳ ALL STUBS - Ready for implementation

### GET (11 stubs)

```javascript
⏳ TargetVsActualMisPeriodcallyNewSap()
  - Signature: (empty)
  - Expected: Target vs Actual MIS data (period-based SAP)

⏳ TargetActualMISData(params: F_Name, Date, Todate)
  - Signature: string F_Name, string Date, string Todate
  - Expected: Target/Actual MIS data for date range

⏳ TargetActualMisSapNew()
  - Signature: (empty)
  - Expected: Target/Actual MIS SAP data (latest)

⏳ TargetActualMISDataMis(params: F_Name, CP_Date)
  - Signature: string F_Name, string CP_Date
  - Expected: Target/Actual MIS data by date

⏳ CONSECUTIVEGROSSWEIGHT()
  - Signature: (empty)
  - Expected: Consecutive gross weight data

⏳ LoadReasonWiseReport(params: fcode)
  - Signature: string fcode
  - Expected: Load reason-wise report

⏳ LoadAuditReport(params: fcode)
  - Signature: string fcode
  - Expected: Load audit report

⏳ ExceptionReportMaster()
  - Signature: (empty)
  - Expected: Master list of exception reports

⏳ AuditReportMaster()
  - Signature: (empty)
  - Expected: Master list of audit reports
```

### POST/PUT/MUTATE (8 stubs)

```javascript
⏳ ExceptionReportMaster_2(params: ExceptionModel model, string Command)
  - Purpose: Create/Update exception master

⏳ ExceptionReport(params: ExceptionModel model, string[] selectedIds, string userid, string downloadToken)
  - Purpose: Generate/Export exception report

⏳ ExportAllAbnormalWeighments(params: string factoryCode, factoryName, dateFrom, dateTo)
  - Purpose: Export abnormal weighments

⏳ ExportExcel(params: List<int> selectedIds, string factoryCode, factoryName, dateFrom, dateTo, downloadToken)
  - Purpose: Export data to Excel

⏳ AuditReport(params: List<int> selectedIds, string factoryCode, factoryName, dateFrom, dateTo, downloadToken)
  - Purpose: Generate/Export audit report

⏳ AuditReportMaster_2(params: AuditReportModel model, string Command)
  - Purpose: Create/Update audit master
```

---

## account-reports.controller.js

**Base Handler**: Mix of custom async and `createNotImplementedHandler`
**CONTROLLER**: `'AccountReports'`
**Status**: ⚠️ PARTIAL - 3 implemented, 21 stubs
**Dependencies**: account-reports.service

### Implemented (3)

#### Transfer Management:
```javascript
✓ TransferandRecievedUnit(req, res, next)
  - Method: GET
  - Service: service.getTransferData(req)
  - Response: { data }
  - Extractors:
    - Rid: req.query.Rid || req.query.id
    - factoryCode: req.query.factoryCode || req.query.t_Factory

✓ TransferandRecievedUnit_2(req, res, next)
  - Method: POST/PUT/PATCH
  - Service: service.mutateTransferData(req)
  - Response: { data }
  - Extractors:
    - command: req.body.Command || req.body.command || req.body.id

✓ DELETEData(req, res, next)
  - Method: DELETE
  - Service: service.deleteTransferById(req)
  - Response: { data }
  - Extractors:
    - id: req.query.id || req.body.id
```

### NotImplemented Stubs (21)

#### Financial Reports - Query (9):

```javascript
⏳ Index()
  - Signature: (empty)
  - Expected: Dashboard/Index financials

⏳ VarietyWiseCanePurchase()
  - Signature: (empty)
  - Expected: Cane purchase by variety

⏳ Capasityutilisation()
  - Signature: (empty)
  - Expected: Capacity utilization report

⏳ CaneQtyandSugarCapacity()
  - Signature: (empty)
  - Expected: Cane quantity vs sugar capacity

⏳ CapasityutilisationFromdate(params: fcode, fromdate, toDate)
  - Signature: string fcode, string fromdate, string toDate
  - Expected: Capacity from specific date

⏳ SugarReport()
  - Signature: (empty)
  - Expected: Sugar production report

⏳ CogenReport()
  - Signature: (empty)
  - Expected: Cogeneration report

⏳ DISTILLERYReport()
  - Signature: (empty)
  - Expected: Distillery report

⏳ DistilleryReportA()
  - Signature: (empty)
  - Expected: Distillery alternate report
```

#### Financial Reports - Mutate (9 _2 methods):

```javascript
⏳ VarietyWiseCanePurchase_2(params: VarietyWise model, string Command)

⏳ Capasityutilisation_2(params: CapacityUtilization model, string fcode, string toDate)

⏳ CaneQtyandSugarCapacity_2(params: canepurchasemovement model, string Command)

⏳ CapasityutilisationFromdate_2(params: CapacityUtilization model, string fcode, string fromdate, string toDate)

⏳ SugarReport_2(params: SugarReportViewModel model, string Command)

⏳ CogenReport_2(params: CogenReportViewModel model, string Command)

⏳ DISTILLERYReport_2(params: DistilleryReportViewModel model, string Command)

⏳ DistilleryReportA_2(params: DistilleryReportAModels model, string Command)

⏳ VarietyWiseCanePurchaseAmt_2(params: VarietyWise model, string Command)
```

#### Miscellaneous:

```javascript
⏳ VarietyWiseCanePurchaseAmt()
  - Expected: Variety-wise cane purchase amount
```

---

## Export Patterns

### Pattern 1: Procedure Handler
```javascript
exports.ProcedureName = createProcedureHandler(CONTROLLER, 'ProcedureName', 'signature');
// Generated Response:
// {
//   success: true,
//   message: "Report.ProcedureName executed",
//   data: result?.rows || [],
//   recordsets: result?.recordsets || []
// }
```

### Pattern 2: Custom Handler
```javascript
exports.HandlerName = async (req, res, next) => {
  try {
    // Extract params from req.query/req.body
    // Call service/repository
    return res.status(200).json({ success: true, data });
  } catch (error) {
    return next(error);
  }
};
```

### Pattern 3: Aliased Handler
```javascript
exports.MethodName_2 = exports.MethodName;
// Points to the same function
```

### Pattern 4: Not Implemented
```javascript
exports.MethodName = createNotImplementedHandler(CONTROLLER, 'MethodName', 'signature');
// Returns:
// { error: "Method 'Report.MethodName' is not implemented" }
```

### Pattern 5: Repository Delegation
```javascript
exports.MethodName = repositoryModule.MethodName;
// Directly uses repository handler
```

---

## Response Standards

### Success Response
```javascript
{
  success: true,
  message: "Description",
  data: { /* report data */ }
  // OR
  recordsets: [ /* multiple result sets */ ]
}
```

### Error Response
```javascript
{
  success: false,
  message: "Error description",
  error: "Error details"
}
```

### Procedure Response
```javascript
{
  success: true,
  message: "Report.MethodName executed",
  data: [ /* rows */ ],
  recordsets: [ /* multiple recordsets */ ]
}
```

---

## Query Parameter Conventions

### Season
```
Source Priority: req.user?.season > req.query?.season > req.body?.season > env.DEFAULT_SEASON
Default: '2526'
```

### Factory Code
```
Keys Checked: F_code, factoryCode, F_Code, t_Factory
First match wins
```

### Dates
```
Formats Supported: 
- DD/MM/YYYY (preferred)
- YYYY-MM-DD
- DD-MM-YYYY
Normalized to: DD/MM/YYYY
SQL Format: YYYY-MM-DD
```

---

## Summary Statistics

| Metric | Count |
|--------|-------|
| Total Exports | 104 |
| Fully Implemented | 43 |
| NotImplemented | 61 |
| Procedure Handlers | 31 |
| Repository Delegated | 1 |
| Aliased (_2) | 15 |
| Custom Logic | 9 |
| Controllers | 4 |

---

## Implementation Checklist

### report.controller.js
- [x] All 40 exports working
- [x] Utility functions operational
- [x] Error handling in place
- [x] Service layer integrated

### report-new.controller.js
- [ ] Implement 19 handlers
- [ ] Add service layer
- [ ] Add error logging

### new-report.controller.js
- [ ] Implement 15 handlers
- [ ] Add service layer
- [ ] Add error logging

### account-reports.controller.js
- [x] 3 core handlers working
- [ ] Implement 21 remaining handlers
- [ ] Add consistent error logging

---

## Usage Examples

### Calling a Procedure Handler
```javascript
GET /report/CrushingReport?F_code=F001&Date=01/01/2026
Response: { success: true, message: "Report.CrushingReport executed", data: [...] }
```

### Calling a Custom Handler
```javascript
GET /report/Analysisdata?F_code=F001&Date=01/01/2026
Response: { success: true, message: "Analysis data retrieved", data: [...] }
```

### POST Request
```javascript
POST /account-reports/TransferandRecievedUnit_2
Body: { Command: 'Insert', ...transferData }
Response: { data: {...} }
```

---

**Last Updated**: March 14, 2026
**Status**: Analysis Complete | Implementation Pending
