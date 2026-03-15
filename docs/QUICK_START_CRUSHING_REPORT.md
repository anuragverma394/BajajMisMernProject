# ⚡ Quick Start - CrushingReport Testing

## 🚀 Get Running in 2 Minutes

### Terminal 1: Start Report Backend
```bash
cd BajajMisMernProject/backend/services/report-service
npm start
```
✅ Wait for: `listening on port 5001`

### Terminal 2: Start Frontend
```bash
cd BajajMisMernProject/frontend
npm run dev
```
✅ Wait for: `Local: http://localhost:5173`

### Browser: Navigate & Test
```
http://localhost:5173/Report/CrushingReport
```

**Steps:**
1. Select **Factory** from dropdown
2. Select **Date** (use date with data in database)
3. Click **Refresh** button
4. **Verify**: Table shows vehicle counts and weights

---

## 📊 What Should You See?

### ✅ If Working:
```
| Vehicle Type | OY Nos | OY Wt | AtD Nos | AtD Wt | ODC Nos | ODC Wt | ODC Avg |
|---|---|---|---|---|---|---|---|
| Cart | 0 | 0.00 | 0 | 0.00 | 15 | 4500.75 | 300.05 |
| Small Trolly | 0 | 0.00 | 0 | 0.00 | 20 | 6200.50 | 310.03 |
| Large Trolly | 0 | 0.00 | 0 | 0.00 | 18 | 5400.25 | 300.01 |
| Pvt Truck | 0 | 0.00 | 0 | 0.00 | 7 | 2149.00 | 307.00 |
| Gate Total | 0 | 0.00 | 0 | 0.00 | 60 | 18250.50 | 304.17 |
```

### ❌ If Not Working:
- All zeros → No PURCHASE data for that date/factory
- Empty → Database query failed
- Red error → Check console

---

## 🔧 Troubleshooting

### No Data Showing?

**1. Check Database:**
```sql
SELECT TOP 5 DISTINCT CAST(M_DATE AS date) FROM PURCHASE ORDER BY M_DATE DESC;
SELECT TOP 5 DISTINCT CAST(M_FACTORY AS varchar(20)) FROM PURCHASE;
```
Use these dates/factories in the UI.

**2. Check API:**
```bash
curl "http://localhost:5001/api/report/loadfactorydata?FACTCODE=590&Date=13/03/2026"
```
Should return 200 with `lblCartODCNos`, `lblTrolly40ODCWt` fields.

**3. Check Console (F12):**
- Network tab → Request to `/api/report/loadfactorydata`
- Status should be 200
- Response should have `lbl` prefixed fields

---

## 📋 Implementation Summary

| Component | Status | Details |
|-----------|--------|---------|
| Database Query | ✅ Complete | Queries PURCHASE by vehicle mode |
| API Response | ✅ Complete | Flattened `lbl` prefixed keys |
| Frontend Table | ✅ Complete | Displays data from API response |
| Error Handling | ✅ Complete | 200 OK even if no data |

---

## 🎯 Success Criteria

✅ Table displays vehicle counts and weights
✅ Gate Total shows correct sum
✅ API returns 200 status
✅ No red errors in console
✅ No 500 errors in Network tab

---

## 📚 Full Documentation

See these files for detailed information:
- `CRUSHING_REPORT_FINAL_SUMMARY.md` - Complete technical summary
- `CRUSHING_REPORT_COMPLETE_DIAGNOSTIC.md` - Full diagnostic guide
- `CRUSHING_REPORT_RESPONSE_FORMAT_FIX.md` - Response format details

---

**Status:** ✅ Ready for Testing
