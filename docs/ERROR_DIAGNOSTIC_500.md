# POST /api/user-management/users - 500 Error Diagnostic

## Quick Fixes to Try First

### 1. **Check Backend Logs**
The error details are now logged. Look for:
```
[API ERROR] { message: "...", sqlCode: "...", sqlNumber: "..." }
```

**Set development mode:**
```bash
# In user-service directory
export NODE_ENV=development
npm start
```

This will show the actual error message in the API response.

---

## 10-Step Diagnostic Checklist

### Step 1: Verify Backend Service is Running
```bash
# Check if user-service is running
curl http://localhost:5002/api/health

# Expected response:
# { "success": true, "message": "user-service healthy", ... }
```

### Step 2: Verify Database Connection
```bash
# Check if backend can connect to database
# Look in logs for connection errors
# Should see something like: "Connected to MSSQL" or "Connection pool created"
```

### Step 3: Verify MI_User Table Exists
**Option A: Using SQL Server Management Studio**
```sql
SELECT * FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME = 'MI_User';
```

**Option B: Using user-service endpoint**
```bash
curl http://localhost:5000/api/user-management/user-types

# If this works, database is connected
```

### Step 4: Verify MI_User Table Columns
The MI_User table must have these columns:
```sql
SELECT COLUMN_NAME, DATA_TYPE, IS_NULLABLE
FROM INFORMATION_SCHEMA.COLUMNS
WHERE TABLE_NAME = 'MI_User'
ORDER BY ORDINAL_POSITION;
```

**Required Columns:**
- ✅ Userid (VARCHAR, NOT NULL, UNIQUE)
- ✅ Name (VARCHAR, NOT NULL)
- ✅ Password (VARCHAR, NOT NULL)
- ✅ Status (VARCHAR or INT)
- ✅ UTID (INT, NOT NULL, FK to MI_UserType)
- ✅ FactID (can be NULL or VARCHAR)
- ✅ SAPCode (VARCHAR, can be NULL)
- ✅ Mobile (VARCHAR, can be NULL)
- ✅ EmailID (VARCHAR, can be NULL)
- ✅ DOB (DATE or VARCHAR, can be NULL)
- ✅ Gender (VARCHAR, can be NULL)
- ✅ Type (VARCHAR, can be NULL)
- ✅ GPS_FLG (BIT or INT, can be NULL)
- ✅ TimeFrom (VARCHAR, can be NULL)
- ✅ TimeTo (VARCHAR, can be NULL)

### Step 5: Verify MI_UserType Table
```sql
SELECT * FROM MI_UserType;
```

The UTID you're sending (in AddUser form) must exist here.

### Step 6: Test SQL Manually
Try this in SQL Server Management Studio:

```sql
-- Test insert
INSERT INTO MI_User(
  Userid, Name, Password, Status, UTID, FactID,
  SAPCode, Mobile, EmailID, DOB, Gender, Type,
  GPS_FLG, TimeFrom, TimeTo
)
VALUES(
  'testuser_manual_123',  -- Userid (must be unique)
  'Test User',            -- Name
  'hashedpassword123',    -- Password
  '1',                    -- Status
  1,                      -- UTID (must exist in MI_UserType)
  NULL,                   -- FactID
  '',                     -- SAPCode
  '9876543210',           -- Mobile
  'test@example.com',     -- EmailID
  NULL,                   -- DOB
  '1',                    -- Gender
  'Other',                -- Type
  0,                      -- GPS_FLG
  '0600',                 -- TimeFrom
  '1800'                  -- TimeTo
);

-- If this works, the table structure is correct
SELECT @@IDENTITY;
```

### Step 7: Verify Userid is Unique
```sql
SELECT COUNT(*) FROM MI_User WHERE Userid = 'testuser001';
```

If Count > 0, the userid already exists.

### Step 8: Check API Request Payload
Add logging to see what's being sent:

```javascript
// In frontend, before submitting:
const testPayload = {
  Userid: 'testuser_' + Date.now(),
  UTID: 1,
  Name: 'Test User',
  Password: 'TestPassword123!',
  Mobile: '',
  EmailID: '',
  Gender: '1',
  Type: 'Other',
  Status: '1',
  TimeFrom: '0600',
  TimeTo: '1800',
  GPS_Notification: 0,
  units: [],
  seasons: []
};

console.log('Payload:', JSON.stringify(testPayload, null, 2));
```

### Step 9: Test API with cURL (Bypass Frontend)
```bash
# Get token first (login)
TOKEN="your-auth-token"

# Make the POST request
curl -X POST http://localhost:5000/api/user-management/users \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "Userid": "curltest_'$(date +%s%N)'",
    "UTID": 1,
    "Name": "CURL Test User",
    "Password": "Password123!",
    "Mobile": "",
    "EmailID": "",
    "Gender": "1",
    "Type": "Other",
    "Status": "1",
    "TimeFrom": "0600",
    "TimeTo": "1800",
    "GPS_Notification": 0,
    "units": [],
    "seasons": []
  }'
```

### Step 10: Check Console Logs
Look in the terminal where user-service is running:

```
[API ERROR] {
  message: "Actual error description here",
  sqlCode: "NNNN",
  sqlNumber: 123,
  ...
}
```

---

## Common Causes & Solutions

### ❌ Error: "Invalid object name 'MI_User'"

**Cause:** Table doesn't exist

**Fix:**
```sql
-- Create the table
CREATE TABLE MI_User (
  ID INT PRIMARY KEY IDENTITY(1,1),
  Userid VARCHAR(50) NOT NULL UNIQUE,
  Name VARCHAR(120) NOT NULL,
  Password VARCHAR(256) NOT NULL,
  Status VARCHAR(5) DEFAULT '1',
  UTID INT NOT NULL,
  FactID VARCHAR(20),
  SAPCode VARCHAR(60),
  Mobile VARCHAR(20),
  EmailID VARCHAR(120),
  DOB DATE,
  Gender VARCHAR(5),
  Type VARCHAR(20),
  GPS_FLG BIT DEFAULT 0,
  TimeFrom VARCHAR(10),
  TimeTo VARCHAR(10),
  FOREIGN KEY (UTID) REFERENCES MI_UserType(UTID)
);
```

### ❌ Error: "Violation of PRIMARY KEY or UNIQUE KEY"

**Cause:** Userid already exists

**Fix:**
```javascript
// Generate unique userid with timestamp
const Userid = 'user_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
```

### ❌ Error: M The foreign key constraint failed"

**Cause:** UTID doesn't exist in MI_UserType

**Fix:**
```sql
-- Check available user types
SELECT * FROM MI_UserType;

-- Use an existing UTID
```

### ❌ Error: "Conversion failed for column UTID"

**Cause:** Sending string instead of number

**Fix (in frontend validation):**
```javascript
const payload = {
  ...formData,
  UTID: Number(formData.UTID), // ← Convert to number
};
```

### ❌ Error: "The statement conflicted with a FOREIGN KEY constraint"

**Cause:** UTID or FactID references don't exist

**Fix:**
```sql
-- Verify MI_UserType has the UTID
SELECT * FROM MI_UserType WHERE UTID = 1;

-- If MI_UserFact is used, verify FactID exists
SELECT * FROM Factory WHERE f_Code = 'your_factory_code';
```

### ❌ Error: "Timeout expired"

**Cause:** Database is slow or unreachable

**Fix:**
1. Restart database service
2. Check network connection
3. Verify database server is running
4. Increase timeout and retry

### ❌ Error: "Input payload contains invalid parameter names"

**Cause:** Parameter name mismatch in query

**Current code uses:**
- @Userid (not @userid)
- @Name (not @name)
- @Password (not @password)
- @GPS_Notification (not @GPS_FLG)

Make sure payload keys match exactly!

---

## Development Mode Setup

Set NODE_ENV to development for detailed errors:

```bash
# .env file in user-service directory
NODE_ENV=development
DB_HOST=your-db-host
DB_USER=your-db-user
DB_PASSWORD=your-db-password
DB_NAME=your-db-name
BCRYPT_SALT_ROUNDS=12
```

---

## Complete Test Script

```bash
#!/bin/bash

# 1. Get auth token
echo "1. Getting authentication token..."
TOKEN=$(curl -s -X POST http://localhost:5000/api/account/login \
  -H "Content-Type: application/json" \
  -d '{"userid":"admin","password":"password"}' \
  | jq -r '.data.token')

echo "Token: $TOKEN"

# 2. Test health endpoint
echo -e "\n2. Testing health endpoint..."
curl -s http://localhost:5002/api/health | jq '.'

# 3. Test user types endpoint
echo -e "\n3. Fetching user types..."
curl -s -H "Authorization: Bearer $TOKEN" \
  http://localhost:5000/api/user-management/user-types | jq '.'

# 4. Create test user
echo -e "\n4. Creating test user..."
USERID="testuser_$(date +%s)"
curl -s -X POST http://localhost:5000/api/user-management/users \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "{
    \"Userid\": \"$USERID\",
    \"UTID\": 1,
    \"Name\": \"Test User $USERID\",
    \"Password\": \"TestPass123!\",
    \"Mobile\": \"9876543210\",
    \"EmailID\": \"test@example.com\",
    \"Gender\": \"1\",
    \"Type\": \"Other\",
    \"Status\": \"1\",
    \"TimeFrom\": \"0600\",
    \"TimeTo\": \"1800\",
    \"GPS_Notification\": 0,
    \"units\": [],
    \"seasons\": []
  }" | jq '.'

echo -e "\nTest complete!"
```

---

## Next Steps

1. **Run Step 1 of diagnostic** - Check if backend is healthy
2. **Enable development mode** - Set NODE_ENV=development
3. **Run cURL test** - Test API directly (Step 9)
4. **Check logs** - Look for actual error message
5. **Fix root cause** from common causes list above
6. **Retry AddUser form**

---

## Support Information

If still stuck:
1. Screenshot of error response (F12 Network tab)
2. Backend logs from user-service
3. Screenshot of SQL error (if visible)
4. Result of running SQL test (Step 6)

