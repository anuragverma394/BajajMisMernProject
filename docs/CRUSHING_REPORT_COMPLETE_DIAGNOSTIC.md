# Complete CrushingReport Diagnostic Checklist

## 🔍 Step-by-Step Verification

### STEP 1: Database - Check if PURCHASE Data Exists

**Run this SQL query on your database:**

```sql
-- First, check what factories exist
SELECT DISTINCT CAST(M_FACTORY AS varchar(20)) as Factory
FROM PURCHASE
WHERE CAST(M_DATE AS date) >= DATEADD(DAY, -7, GETDATE())
ORDER BY M_FACTORY;

-- Check specific factory for today or recent dates
SELECT TOP 10
  CAST(M_DATE AS date) as Date,
  COUNT(*) as RecordCount
FROM PURCHASE
WHERE CAST(M_FACTORY AS varchar(20)) = '55'  -- Use your factory code
GROUP BY CAST(M_DATE AS date)
ORDER BY CAST(M_DATE AS date) DESC;

-- If you found data above, run this for the exact date/factory
SELECT TOP 5
  m.md_groupcode,
  m.md_name,
  COUNT(p.M_IND_NO) as VehicleCount,
  SUM(p.M_GROSS - p.M_TARE - ISNULL(p.M_JOONA, 0)) as TotalWeight,
  AVG(p.M_GROSS - p.M_TARE - ISNULL(p.M_JOONA, 0)) as AvgWeight
FROM PURCHASE p
JOIN Mode m ON p.M_MODE = m.MD_CODE AND p.M_FACTORY = m.MD_FACTORY
WHERE CAST(p.M_DATE AS date) = '2026-03-13'  -- Use your date
  AND CAST(p.M_FACTORY AS varchar(20)) = '55'  -- Use your factory
GROUP BY m.md_groupcode, m.md_name
ORDER BY m.md_groupcode;
```

**Expected Output:**
```
md_groupcode | md_name           | VehicleCount | TotalWeight | AvgWeight
1            | [Mode Name]       | 15           | 4500.75     | 300.05
2            | [Mode Name]       | 20           | 6200.50     | 310.03
3            | [Mode Name]       | 18           | 5400.25     | 300.01
4            | [Mode Name]       | 7            | 2149.00     | 307.00
```

❌ **If you get NO rows:** There's NO purchase data for that date/factory. Try:
- Different factory code
- Different date (recent date with known data)
- Or manually INSERT test data

---

### STEP 2: Backend Service - Check API Response

**Test the API endpoint directly:**

```bash
# Using curl
curl -X GET "http://localhost:5001/api/report/loadfactorydata?FACTCODE=55&Date=13/03/2026"

# With headers (if authentication needed)
curl -X GET "http://localhost:5001/api/report/loadfactorydata?FACTCODE=55&Date=13/03/2026" \
  -H "x-user-season: 2526" \
  -H "x-user-id: admin"
```

**Expected Response:**
```json
{
  "success": true,
  "message": "Factory crushing report",
  "data": {
    "lblCartODCNos": 15,
    "lblCartODCWt": 4500.75,
    "lblCartODCAvg": 300.05,
    "lblTrolly40ODCNos": 20,
    "lblTrolly40ODCWt": 6200.5,
    "lblTrolly40ODCAvg": 310.03,
    "lblTrolly60ODCNos": 18,
    "lblTrolly60ODCWt": 5400.25,
    "lblTrolly60ODCAvg": 300.01,
    "lblTruckODCNos": 7,
    "lblTruckODCWt": 2149,
    "lblTruckODCAvg": 307,
    "lblGateODCNos": 60,
    "lblGateODCWt": 18250.5,
    "lblGateODCAvg": 304.18,
    ...other fields...
  }
}
```

**❌ Troubleshooting:**
- **500 Error**: Check backend logs for SQL errors
- **Empty data (all zeros)**: No PURCHASE data for that date/factory (check Step 1)
- **Wrong structure (nested objects)**: Backend not using latest code
- **401 Unauthorized**: Add authentication headers

---

### STEP 3: Frontend - Check Developer Tools

**Open Browser DevTools (F12):**

1. **Network Tab:**
   - Select factory and date in UI
   - Look for request: `/api/report/loadfactorydata`
   - Check Status: Should be `200 OK`
   - Check Response: Should have `lblCartODCNos` fields (not nested `Cart.ODC_Nos`)

2. **Console Tab:**
   - Look for any red errors
   - Check that table renders without errors

---

### STEP 4: Venue - Re-verify Component

**Check that CrushingReport.jsx is using correct field names:**

```javascript
// Line 264 - correctly accesses flattened field
<td>{val(`lbl${row.key}ODCNos`)}</td>

// val() function (line 161-165)
const val = (key, fallback = '0') => {
  const v = report?.[key];  // report should have flat lblXXXODCNos keys
  if (v === null || v === undefined || v === '') return fallback;
  return String(v);
};
```

---

## 🚀 Complete Test Flow

### From Scratch:

```bash
# 1. Stop services
# (Ctrl+C in terminals)

# 2. Check git status
cd "a:\vibrant technology\Bajaj Project06022026\Bajaj Project"
git status

# 3. Verify latest commits applied
git log --oneline -5
# Should show:
# 8339490 fix(report-service): return flattened lbl-prefixed response...
# aa954a5 fix(report-service): implement Imagesblub endpoint...
# 7602eac fix(report-service): correct PURCHASE-Mode join condition
# 430ec8d fix(report-service): correct Mode table column name...

# 4. Start report service
cd BajajMisMernProject/backend/services/report-service
npm start
# Wait for: "listening on port 5001"

# 5. Start frontend (new terminal)
cd BajajMisMernProject/frontend
npm run dev
# Wait for: "Local: http://localhost:5173"

# 6. Test in browser
# Navigate to: http://localhost:5173/Report/CrushingReport
```

### In Frontend UI:

1. **Select Factory:** Choose from dropdown (e.g., "590", "55" if you have data)
2. **Check Date:** Use a date you verified has data in database
3. **Click Refresh:** Triggers API call
4. **Verify Table:**
   - ✅ Numbers appear (not all 0)
   - ✅ Gate Total at bottom
   - ✅ No red errors in console

---

## 📋 Checklist

- [ ] Database has PURCHASE records for test factory/date
- [ ] Mode table has md_groupcode 1-4 entries
- [ ] PURCHASE.M_MODE links correctly to Mode.MD_CODE
- [ ] Backend service started successfully
- [ ] Frontend service started successfully
- [ ] API response has flat `lblXXX` keys (not nested objects)
- [ ] API status is 200 OK
- [ ] Table displays numbers (not all zeros)
- [ ] No console errors

---

## 🔧 If Still No Data

### Option 1: Test with Different Date/Factory

Find a date that definitely has data:
```sql
SELECT TOP 3 DISTINCT CAST(M_DATE AS date) FROM PURCHASE ORDER BY M_DATE DESC;
SELECT TOP 3 DISTINCT CAST(M_FACTORY AS varchar(20)) FROM PURCHASE;
```

Use these in the UI.

### Option 2: Manual Test Data Creation

```sql
-- Create a test record
INSERT INTO PURCHASE (M_DATE, M_FACTORY, M_MODE, M_GROSS, M_TARE, M_JOONA)
VALUES (CAST(GETDATE() AS date), '55', 'CART', 500, 50, 10);

-- Verify it was inserted
SELECT TOP 1 * FROM PURCHASE ORDER BY M_IND_NO DESC;
```

Then test the API with today's date and factory '55'.

---

## 💡 Quick Fix Summary

| Issue | Fix |
|-------|-----|
| No database data | Use SQL to find existing data or insert test data |
| API returns 500 | Check backend logs, may need database connection fix |
| API returns wrong structure | Verify latest code applied: `git pull && npm start` |
| Table shows all zeros | Verify database query returns rows (use SQL query above) |
| Frontend empty | Check Network tab response format has `lblXXX` keys |

---

**Status: Ready for Production Testing** ✅

Run through the checklist above and report back with:
1. Database query results
2. API response structure
3. What you see in the table
