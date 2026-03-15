# CrushingReport Frontend-Backend Fix - Response Structure Alignment

## Problem Found
Frontend expected response fields with `lbl` prefixes (like `lblCartODCNos`, `lblTrolly40ODCWt`), but backend was returning a nested object structure. Result: **Empty table on CrushingReport page**.

## Fix Applied
**Commit: `8339490`**

Changed response from:
```javascript
// ❌ WRONG - Nested structure frontend can't read
{
  Cart: { ODC_Nos: 15, ODC_Wt: 4500.75, ... },
  Trolley40: { ... },
  GateTotal: { ... }
}
```

To:
```javascript
// ✅ CORRECT - Flattened lbl-prefixed keys
{
  lblCartODCNos: 15,
  lblCartODCWt: 4500.75,
  lblCartODCAvg: 300.05,
  lblCartOYNos: 0,
  lblCartOYWt: '0.00',
  lblCartAtDNos: 0,
  lblCartAtDWt: '0.00',
  lblCartTDCNos: 0,
  lblCartTDCWt: '0.00',
  lblCartTDCAvg: '0.00',

  lblTrolly40ODCNos: 20,
  lblTrolly40ODCWt: 6200.50,
  lblTrolly40ODCAvg: 310.03,
  // ... all other fields

  lblGateODCNos: 60,        // Total across all vehicle types
  lblGateODCWt: 18250.5,
  lblGateODCAvg: 304.18,
  // ... all Gate/Center/Combined totals

  dtpDate: '05/13/2026',
  lblcrop: '0'
}
```

## Response Fields Now Included

### Vehicle Type Fields (For Car, Trolly40, Trolly60, Truck)
- `lblXXXOYNos` - Out Yard vehicle numbers
- `lblXXXOYWt` - Out Yard weight
- `lblXXXAtDNos` - At Donga vehicle numbers
- `lblXXXAtDWt` - At Donga weight
- `lblXXXODCNos` - On Date Crushed numbers (from database)
- `lblXXXODCWt` - On Date Crushed weight (from database)
- `lblXXXODCAvg` - On Date Crushed average weight
- `lblXXXTDCNos` - To Date Crushed numbers
- `lblXXXTDCWt` - To Date Crushed weight
- `lblXXXTDCAvg` - To Date Crushed average

### Totals
- `lblGateXXX` - Gate total (sum of all vehicle types)
- `lblCenterXXX` - Center operations total
- `lblGtCenXXX` - Gate + Center combined total

## Test Instructions

### 1. Restart Report Service

```bash
cd BajajMisMernProject/backend/services/report-service
npm start

# Or npm restart if already running
```

### 2. Open CrushingReport Page

Browser: `http://localhost:5173/Report/CrushingReport`

### 3. Select Factory and Date

1. **Factory:** Select a factory from dropdown
2. **Date:** Pick a date that has purchase records in database
3. **Press:** "Refresh" or just selecting factory triggers load

### 4. Verify Data Displays

**Expected Results:**
- ✅ Table shows vehicle counts in "On Date Crushed (ODC)" columns
- ✅ Table shows weights calculated from database
- ✅ Gate Total row shows sum of all vehicle types
- ✅ Center row shows center operations data
- ✅ Shift tables show hourly breakdown (currently empty - future enhancement)
- ✅ No red errors in console
- ✅ No 500 errors in Network tab

**Example Data Expected:**
```
| Vehicle Type | OY Nos | OY Wt | AtD Nos | AtD Wt | ODC Nos | ODC Wt | ODC Avg | TDC Nos | TDC Wt | TDC Avg |
|---|---|---|---|---|---|---|---|---|---|---|
| Cart | 0 | 0 | 0 | 0 | 15 | 4500.75 | 300.05 | 0 | 0 | 0 |
| Small Trolly | 0 | 0 | 0 | 0 | 20 | 6200.50 | 310.03 | 0 | 0 | 0 |
| Large Trolly | 0 | 0 | 0 | 0 | 18 | 5400.25 | 300.01 | 0 | 0 | 0 |
| Pvt Truck | 0 | 0 | 0 | 0 | 7 | 2149.00 | 307.00 | 0 | 0 | 0 |
| Gate Total | 0 | 0 | 0 | 0 | 60 | 18250.50 | 304.17 | 0 | 0 | 0 |
```

### 5. Check Browser Console (F12 → Network Tab)

**Request:**
```
GET /api/report/loadfactorydata?FACTCODE=590&Date=05/13/2026
```

**Response:**
```
Status: 200 OK
Response:
{
  "success": true,
  "message": "Factory crushing report",
  "data": {
    "lblCartODCNos": 15,
    "lblCartODCWt": 4500.75,
    "lblCartODCAvg": 300.05,
    ... [all lbl fields]
  }
}
```

**❌ NOT this (which would show empty table):**
```json
{
  "Cart": { "ODC_Nos": 15, ... },
  "Trolley40": { ... }
}
```

## Troubleshooting

### Table Still Shows Empty / All Zeros

1. **Check network response:**
   - F12 → Network tab
   - Select factory and check request/response
   - Verify `lblCartODCNos` has real number, not 0

2. **Check if database has data:**
   ```sql
   SELECT TOP 5 M_DATE, M_FACTORY, COUNT(*) as cnt
   FROM PURCHASE
   WHERE CAST(M_DATE AS DATE) = CAST(GETDATE() AS DATE)
   GROUP BY M_DATE, M_FACTORY

   -- Try a past date if no today's data
   ```

3. **Check response format:**
   - Response MUST have flat keys like `lblCartODCNos`
   - NOT nested like `Cart.ODC_Nos`

### Date Format Issues

Frontend sends: `DD/MM/YYYY` (e.g., `05/13/2026`)
Backend converts to: `YYYY-MM-DD` (e.g., `2026-05-13`)

If date conversion fails, check error in backend logs.

## Database Verification Query

```sql
-- Check if vehicle modes and purchases are linked correctly
SELECT TOP 10
  p.M_DATE,
  p.M_FACTORY,
  p.M_MODE,
  m.MD_CODE,
  m.md_groupcode,
  m.md_name,
  COUNT(*) as VehicleCount,
  SUM(p.M_GROSS - p.M_TARE - ISNULL(p.M_JOONA, 0)) as TotalWeight
FROM PURCHASE p
JOIN Mode m ON p.M_MODE = m.MD_CODE AND p.M_FACTORY = m.MD_FACTORY
WHERE CAST(p.M_DATE AS DATE) = '2026-05-13'
GROUP BY p.M_DATE, p.M_FACTORY, p.M_MODE, m.MD_CODE, m.md_groupcode, m.md_name
ORDER BY m.md_groupcode
```

---

## Status
✅ **FRONTEND-BACKEND ALIGNMENT COMPLETE**

Backend now returns data in exact format frontend expects. CrushingReport table should display actual vehicle data sorted by vehicle mode!
