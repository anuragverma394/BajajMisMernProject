# DotNET to Node.js Migration Reference

**Purpose**: Provide implementation patterns by comparing DotNET Controllers to Node.js Controllers  
**Generated**: March 14, 2026

---

## Overview

This guide helps implement remaining Node.js handlers by following the patterns from the existing DotNET project.

### Architecture Mapping

```
DotNET (MVC)                    → Node.js (REST API)
----------------------------------------
ReportController.cs             → report.controller.js
  - Methods (Actions)           → Exports (Handlers)
  - Models (ViewModels)         → Request Objects
  - DataAccess Layer           → Repository/Service
  - View (MVC)                 → API Response (JSON)

Query Execution:
ReportDataAccess.cs            → reportRepository.js
  - SqlCommand                 → SQL Query or Procedure
  - DataAdapter/DataSet        → Database Results
```

---

## DotNET Pattern Example: CrushingReport

### DotNET Implementation

```csharp
// BajajMic/Controllers/ReportController.cs
public class ReportController : Controller {
  
  // Initialize Data Access Layer
  ReportDataAccess OBJCR = new ReportDataAccess();
  
  // GET: Report/CrushingReport (View)
  public ActionResult CrushingReport() {
    CrushingReport model = new CrushingReport();
    Session.Remove("YDTRANS");
    Session.Remove("TDTRANSIT");
    ViewBag.btnexport = "Excel";
    ViewBag.btnprint = "Print";
    return View(model);
  }
  
  // POST: Get Crushing Report Data
  [HttpPost]
  public JsonResult Imagesblub(string F_code) {
    Imagesblub Model = new Imagesblub();
    try {
      Model = obj.GetStopageDataByFactory(F_code)
                 .ToList()
                 .FirstOrDefault();
      
      return Json(new { 
        success = true, 
        data = Model 
      });
    }
    catch (Exception ex) {
      return Json(new { success = false, message = ex.Message });
    }
  }
}

// BajajMic/DAL/ReportDataAccess.cs
public class ReportDataAccess {
  public List<Imagesblub> GetStopageDataByFactory(string factoryCode) {
    try {
      using (SqlConnection conn = new SqlConnection(connectionString)) {
        SqlCommand cmd = new SqlCommand("usp_GetStopageData", conn);
        cmd.CommandType = CommandType.StoredProcedure;
        cmd.Parameters.AddWithValue("@FactoryCode", factoryCode);
        
        SqlDataAdapter adapter = new SqlDataAdapter(cmd);
        DataTable dt = new DataTable();
        adapter.Fill(dt);
        
        // Convert DataTable to List<Model>
        return (from DataRow row in dt.Rows
                select new Imagesblub {
                  F_Code = row["F_Code"].ToString(),
                  ImageData = row["ImageData"].ToString()
                }).ToList();
      }
    }
    catch (Exception ex) {
      // Log and handle error
      throw;
    }
  }
}
```

### Node.js Equivalent Implementation

```javascript
// report-service/controllers/report.controller.js
const reportRepository = require('../repositories/report.repository');

exports.Imagesblub = async (req, res, next) => {
  try {
    const F_code = req.query?.F_code || req.body?.F_code;
    const season = getSeason(req);
    
    // Validate input
    if (!F_code) {
      return res.status(400).json({
        success: false,
        message: 'Missing required parameter: F_code'
      });
    }
    
    // Call repository
    const model = await reportRepository.getStopageDataByFactory(F_code, season);
    
    // Return response
    return res.status(200).json({
      success: true,
      message: 'Stopage data retrieved',
      data: model
    });
  } catch (error) {
    console.error('[Imagesblub] Error:', error.message);
    return next(error);
  }
};

// report-service/repositories/report.repository.js
const { executeProcedure, executeQuery } = require('../core/db/query-executor');

async function getStopageDataByFactory(factoryCode, season) {
  try {
    // Call stored procedure
    const result = await executeProcedure(
      'usp_GetStopageData',
      { 
        '@FactoryCode': factoryCode 
      },
      season
    );
    
    // Extract and format results
    const data = (result.rows || []).map(row => ({
      F_Code: row.F_Code || row.f_code,
      ImageData: row.ImageData || row.imageData
    }));
    
    return data;
  } catch (error) {
    console.error('getStopageDataByFactory error:', error);
    throw error;
  }
}

module.exports = {
  getStopageDataByFactory
};
```

---

## Key Pattern Differences

### 1. Variable Naming

| DotNET | Node.js | Why |
|--------|---------|-----|
| `public ActionResult MethodName()` | `exports.MethodName = async (req, res, next) => {}` | Express pattern |
| `ViewBag.property` | `res.locals.property` or response body | API pattern (no View) |
| `Session["key"]` | `req.session.key` or `req.user` object | Request context |
| `try-catch` | `try-catch` | Same |
| `return Json(data)` | `res.status(200).json(data)` | REST API pattern |

### 2. Data Access

| DotNET | Node.js |
|--------|---------|
| SqlCommand + SqlDataAdapter | executeProcedure() + executeQuery() |
| DataTable (rows/columns) | Array of Objects |
| DataRow["column"] access | Object property access |
| SqlConnection management | Connection pooling abstracted |
| List<T> collections | JavaScript arrays |

### 3. Error Handling

| DotNET | Node.js |
|--------|---------|
| try-catch-finally | try-catch in async/await |
| Exception.Message | error.message |
| Log4Net / EventLog | console.error() or logger |
| return error response | res.status(error).json(error) or next(error) |

---

## Implementation Template by Type

### Type 1: Simple Data Fetch (GET)

**DotNET Pattern**:
```csharp
[HttpGet]
public JsonResult GetData(string param1) {
  try {
    var result = dataAccess.FetchData(param1);
    return Json(new { success = true, data = result });
  }
  catch(Exception ex) {
    return Json(new { success = false, message = ex.Message });
  }
}
```

**Node.js Implementation**:
```javascript
exports.GetData = async (req, res, next) => {
  try {
    const param1 = req.query?.param1;
    
    if (!param1) {
      return res.status(400).json({ 
        success: false, 
        message: 'param1 is required' 
      });
    }
    
    const result = await reportRepository.fetchData(param1);
    
    return res.status(200).json({
      success: true,
      message: 'Data fetched successfully',
      data: result
    });
  } catch (error) {
    return next(error);
  }
};
```

### Type 2: Data Mutation (POST/PUT)

**DotNET Pattern**:
```csharp
[HttpPost]
public JsonResult SaveData(Model model) {
  try {
    var result = dataAccess.SaveData(model);
    if (result.Success) {
      return Json(new { success = true, message = "Saved", data = result.Data });
    }
    return Json(new { success = false, message = result.Message });
  }
  catch(Exception ex) {
    return Json(new { success = false, message = ex.Message });
  }
}
```

**Node.js Implementation**:
```javascript
exports.SaveData = async (req, res, next) => {
  try {
    const model = req.body;
    const Command = model?.Command || 'Insert';
    
    // Validate model
    if (!model || Object.keys(model).length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Request body is required'
      });
    }
    
    const result = await reportService.saveData(model, Command);
    
    if (result.error) {
      return res.status(result.status || 400).json({
        success: false,
        message: result.message
      });
    }
    
    return res.status(201).json({
      success: true,
      message: `${Command} operation completed`,
      data: result.data
    });
  } catch (error) {
    return next(error);
  }
};
```

### Type 3: Stored Procedure Call

**DotNET Pattern**:
```csharp
[HttpPost]
public JsonResult ExecuteReport(string factoryCode, string dateFrom, string dateTo) {
  using (SqlConnection conn = new SqlConnection(connectionString)) {
    SqlCommand cmd = new SqlCommand("usp_GenerateReport", conn);
    cmd.CommandType = CommandType.StoredProcedure;
    cmd.Parameters.AddWithValue("@FactoryCode", factoryCode);
    cmd.Parameters.AddWithValue("@DateFrom", dateFrom);
    cmd.Parameters.AddWithValue("@DateTo", dateTo);
    
    SqlDataAdapter adapter = new SqlDataAdapter(cmd);
    DataSet ds = new DataSet();
    adapter.Fill(ds);
    
    return Json(new { 
      success = true, 
      data = ds.Tables[0],
      recordsets = ds.Tables  
    });
  }
}
```

**Node.js Implementation**:
```javascript
exports.ExecuteReport = createProcedureHandler(
  CONTROLLER, 
  'usp_GenerateReport',
  'string factoryCode, string dateFrom, string dateTo'
);

// OR Custom Implementation:
exports.ExecuteReport = async (req, res, next) => {
  try {
    const { factoryCode, dateFrom, dateTo } = req.query;
    const season = getSeason(req);
    
    const result = await executeProcedure(
      'usp_GenerateReport',
      { 
        '@FactoryCode': factoryCode,
        '@DateFrom': dateFrom,
        '@DateTo': dateTo
      },
      season
    );
    
    return res.status(200).json({
      success: true,
      message: 'Report generated',
      data: result.rows || [],
      recordsets: result.recordsets || []
    });
  } catch (error) {
    return next(error);
  }
};
```

### Type 4: Complex Report with Multiple Steps

**DotNET Pattern**:
```csharp
[HttpPost]
public JsonResult ComplexReport(string factoryCode, DateTime dateFrom, DateTime dateTo) {
  try {
    // Step 1: Fetch base data
    var baseData = dataAccess.GetBaseData(factoryCode);
    
    // Step 2: Apply filters
    var filtered = baseData.Where(x => x.Date >= dateFrom && x.Date <= dateTo).ToList();
    
    // Step 3: Calculate aggregates
    var summary = new {
      TotalRecords = filtered.Count(),
      Sum = filtered.Sum(x => x.Amount),
      Avg = filtered.Average(x => x.Amount)
    };
    
    // Step 4: Return combined result
    return Json(new { 
      success = true, 
      data = filtered,
      summary = summary 
    });
  }
  catch(Exception ex) {
    return Json(new { success = false, message = ex.Message });
  }
}
```

**Node.js Implementation**:
```javascript
exports.ComplexReport = async (req, res, next) => {
  try {
    const { factoryCode, dateFrom, dateTo } = req.query;
    const season = getSeason(req);
    
    // Step 1: Fetch base data
    const baseData = await reportRepository.getBaseData(factoryCode, season);
    
    // Step 2: Apply filters
    const fromDate = new Date(dateFrom);
    const toDate = new Date(dateTo);
    const filtered = baseData.filter(x => {
      const itemDate = new Date(x.Date);
      return itemDate >= fromDate && itemDate <= toDate;
    });
    
    // Step 3: Calculate aggregates
    const summary = {
      TotalRecords: filtered.length,
      Sum: filtered.reduce((sum, x) => sum + (x.Amount || 0), 0),
      Avg: filtered.length > 0 
        ? filtered.reduce((sum, x) => sum + (x.Amount || 0), 0) / filtered.length 
        : 0
    };
    
    // Step 4: Return combined result
    return res.status(200).json({
      success: true,
      message: 'Complex report generated',
      data: filtered,
      summary
    });
  } catch (error) {
    console.error('[ComplexReport] Error:', error.message);
    return next(error);
  }
};
```

---

## DotNET Project Analysis

### Controllers in BajajMic/Controllers/ (15 files)

1. **ReportController.cs** ← Maps to report.controller.js
   - Methods: CrushingReport, Imagesblub, TargetActualMISReport, etc.
   - Status: ✅ Mostly implemented in Node.js

2. **ReportNewController.cs** ← Maps to report-new.controller.js
   - Methods: HourlyCaneArrivalWieght, IndentPurchaseReportNew, etc.
   - Status: ⏳ Stubs in Node.js

3. **NewReportController.cs** ← Maps to new-report.controller.js
   - Methods: TargetActualMISData, ExceptionReport, etc.
   - Status: ⏳ Stubs in Node.js

4. **AccountReportsController.cs** ← Maps to account-reports.controller.js
   - Methods: TransferandRecievedUnit, SugarReport, etc.
   - Status: ⚠️ Partial in Node.js (3/24)

5. **Other Controllers**: 
   - AccountController.cs, BajajMisServiceController.cs, DISTILLERYController.cs
   - UserManagementController.cs, TrackingController.cs, etc.
   - Status: Not yet migrated to Node.js

### Key DotNET Data Access Pattern

```csharp
// All DB access follows this pattern:
public List<T> GetData(string param) {
  using (SqlConnection conn = new SqlConnection(connString)) {
    SqlCommand cmd = new SqlCommand("StoredProcName", conn);
    cmd.CommandType = CommandType.StoredProcedure;
    cmd.Parameters.AddWithValue("@Param", param);
    
    SqlDataAdapter adapter = new SqlDataAdapter(cmd);
    DataTable dt = new DataTable();
    adapter.Fill(dt);
    
    // Convert to List<T>
    return (from DataRow row in dt.Rows
            select MapRowToModel(row)).ToList();
  }
}
```

### Node.js Equivalent

```javascript
// All DB access uses this pattern:
async function getData(param, season) {
  try {
    const result = await executeProcedure(
      'StoredProcName',
      { '@Param': param },
      season
    );
    
    // Map results
    return (result.rows || []).map(row => mapRowToModel(row));
  } catch (error) {
    throw error;
  }
}
```

---

## Recommended Implementation Priority

Based on DotNET controller complexity:

### Priority 1 (Easy - Start Here)
- [ ] GetZoneByFactory
- [ ] GetTransporterByFactory  
- [ ] centerBind
- [ ] Index
- [ ] LoadReasonWiseReport
- [ ] LoadAuditReport

### Priority 2 (Medium)
- [ ] HourlyCaneArrivalWieght
- [ ] CenterIndentPurchaseReport
- [ ] CanePurchaseReport
- [ ] ExceptionReportMaster
- [ ] AuditReportMaster

### Priority 3 (Hard - Complex Logic)
- [ ] IndentPurchaseReportNew (with _2)
- [ ] CentrePurchaseTruckReportNew (with _2)
- [ ] TargetActualMISData
- [ ] ExceptionReport
- [ ] AuditReport

### Priority 4 (Export Heavy)
- [ ] ExportAllAbnormalWeighments
- [ ] ExportExcel
- [ ] VarietyWiseCanePurchase (with _2)
- [ ] SugarReport (with _2)
- [ ] DISTILLERYReport (with _2)

---

## Gotchas & Common Issues

### Issue 1: Date Format Conversion
**DotNET**: Uses DateTime objects  
**Node.js**: Use normalizeDateInput() and toSqlDate() utilities

```javascript
const { normalizeDateInput, toSqlDate } = require('../controllers/report.controller');
const sqlDate = toSqlDate(req.query.Date);  // Converts to YYYY-MM-DD
```

### Issue 2: Null/Empty Handling
**DotNET**: `?? default` operator  
**Node.js**: Use `??` operator or fallback logic

```javascript
const value = req.query?.param ?? 'default';
```

### Issue 3: DataTable to Array
**DotNET**: DataTable rows converted to List  
**Node.js**: Use array.map() for data transformation

```javascript
// DotNET:
(from DataRow row in dt.Rows select ...)

// Node.js:
(result.rows || []).map(row => ({...}))
```

### Issue 4: Multiple Result Sets
**DotNET**: return `Json(new { data = ds.Tables[0], recordsets = ds.Tables })`  
**Node.js**: return all as array in response

```javascript
return res.json({
  success: true,
  data: result.rows,        // First table
  recordsets: result.recordsets || [result.rows]  // All tables
});
```

---

## Sample Implementation Script

```javascript
// Quick Implement: report-new.controller.js

const { createNotImplementedHandler } = require('../utils/notImplemented');
const service = require('../services/report-new.service');
const CONTROLLER = 'ReportNew';

// Already have these:
exports.HourlyCaneArrivalWieght = createNotImplementedHandler(...);
// ...

// IMPLEMENT: Add these handlers

exports.GetZoneByFactory = async (req, res, next) => {
  try {
    const zone = req.query?.Zone || req.body?.Zone;
    const userid = req.query?.userid || req.body?.userid;
    
    if (!zone || !userid) {
      return res.status(400).json({ 
        success: false, 
        message: 'Zone and userid are required' 
      });
    }
    
    const result = await service.getZoneByFactory(zone, userid);
    return res.status(200).json({
      success: true,
      message: 'Zones retrieved',
      data: result
    });
  } catch (error) {
    return next(error);
  }
};

exports.GetTransporterByFactory = async (req, res, next) => {
  try {
    const fcode = req.query?.Fcode || req.body?.Fcode;
    
    if (!fcode) {
      return res.status(400).json({ 
        success: false, 
        message: 'Factory Code is required' 
      });
    }
    
    const result = await service.getTransporterByFactory(fcode);
    return res.status(200).json({
      success: true,
      message: 'Transporters retrieved',
      data: result
    });
  } catch (error) {
    return next(error);
  }
};

// Continue for other simple handlers...
```

---

## Conclusion

The Node.js implementation should follow the same business logic as the DotNET implementation. Use the mapping in this document as a reference while implementing the remaining handlers. The key differences are:

1. **Async/Await** instead of synchronous calls
2. **Request object** instead of parameters
3. **Response methods** instead of return statements
4. **Service layer** instead of inline DataAccess

**Start with**:
1. Simple GET handlers (Priority 1)
2. POST handlers with _2 suffix
3. Complex reports with multiple steps
4. Export functionality last

---

**Implementation Status**: 🟡 IN PROGRESS  
**Last Updated**: March 14, 2026
