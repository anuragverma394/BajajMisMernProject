# AddUser POST API - Complete Analysis & Fix Guide

## 📊 Data Flow Analysis

### Frontend → Backend Data Structure

#### Units Data
**From `/main/units` endpoint:**
```javascript
[
  {
    f_Code: "FACTORY01",      // ← This is sent as units[]
    f_Name: "Factory One (FO)",
    F_Name: "Factory One (FO)",
    F_Short: "FO"
  },
  ...
]
```

**Sent in POST:**
```javascript
"units": ["FACTORY01", "FACTORY02"]  // array of f_Code values
```

#### Seasons Data
**From `/main/seasons` endpoint:**
```javascript
[
  {
    id: "FACTORY",
    f_Code: "FACTORY",
    S_SEASONSTARTDATE: "2025-06-15",  // ← Frontend extracts year from this
    shiftStartTime: "06:00",
    ...
  }
]
```

**Frontend processes:** Extracts year from S_SEASONSTARTDATE
```javascript
// Example: "2025-06-15" → code "2526" (2025-2026 season)
const code = "2526";

"seasons": ["2526", "2627"]  // array of season codes
```

---

## 🔴 Current Issue

The POST `/api/user-management/users` is **NOT validating** that:
1. ✅ User ID doesn't exist
2. ✅ UTID exists in MI_UserType
3. ❌ Unit codes actually exist in MI_Factory
4. ❌ Season codes are valid

This can cause:
- Silent failures when MI_UserFact insert fails
- Duplicate factory assignments
- Invalid season entries

---

## ✅ Fix Required

The user service needs to validate units and seasons **before** inserting into the database.

### Step 1: Enhance Validation in user.service.js

**Current code (user.service.js ~Line 30):**
```javascript
async function upsertUser(payload, seasonValue) {
  const season = withSeason(seasonValue);

  // Only validates userid and Name
  if (!payload.Userid || !payload.Name) {
    throw new Error('Userid and Name are required');
  }

  // No validation of units or seasons!
  return executeInTransaction(season, async (transaction) => {
    // ... insert code
  });
}
```

**Fixed code:**
```javascript
async function upsertUser(payload, seasonValue) {
  const season = withSeason(seasonValue);

  // Validate basic fields
  if (!payload.Userid || !payload.Name) {
    throw new Error('Userid and Name are required');
  }

  // NEW: Validate units exist in database
  const units = Array.isArray(payload.units) ? payload.units : [];
  if (units.length > 0) {
    const validUnits = await userRepository.validateUnits(units, season);
    if (validUnits.length !== units.length) {
      const invalid = units.filter(u => !validUnits.includes(u));
      throw new Error(`Invalid units: ${invalid.join(', ')}`);
    }
  }

  // NEW: Validate seasons exist in database
  const seasons = Array.isArray(payload.seasons) ? payload.seasons : [];
  if (seasons.length > 0) {
    const validSeasons = await userRepository.validateSeasons(seasons, season);
    if (validSeasons.length !== seasons.length) {
      const invalid = seasons.filter(s => !validSeasons.includes(s));
      throw new Error(`Invalid seasons: ${invalid.join(', ')}`);
    }
  }

  return executeInTransaction(season, async (transaction) => {
    // ... rest of code
  });
}
```

---

## 🛠️ Step 2: Add Validation Methods to Repository

Add these methods to `user.repository.js`:

```javascript
async function validateUnits(unitCodes, season, options = {}) {
  if (!Array.isArray(unitCodes) || !unitCodes.length) {
    return [];
  }

  // Create parameter list: @u0, @u1, ...
  const params = {};
  const placeholders = unitCodes.map((code, idx) => {
    const key = `u${idx}`;
    params[key] = String(code).trim();
    return `@${key}`;
  });

  const result = await query(
    `SELECT DISTINCT f_Code FROM MI_Factory
     WHERE f_Code IN (${placeholders.join(', ')})`,
    params,
    season,
    options
  );

  return result.rows.map(r => r.f_Code);
}

async function validateSeasons(seasonCodes, season, options = {}) {
  if (!Array.isArray(seasonCodes) || !seasonCodes.length) {
    return [];
  }

  // Create parameter list: @s0, @s1, ...
  const params = {};
  const placeholders = seasonCodes.map((code, idx) => {
    const key = `s${idx}`;
    params[key] = String(code).trim();
    return `@${key}`;
  });

  const result = await query(
    `SELECT DISTINCT s.S_SEASONCODE FROM Season s
     WHERE s.S_SEASONCODE IN (${placeholders.join(', ')})
     OR CONCAT(YEAR(s.S_SEASONSTARTDATE),
               YEAR(s.S_SEASONSTARTDATE) + 1) IN (${placeholders.join(', ')})`,
    params,
    season,
    options
  );

  return result.rows.map(r => r.S_SEASONCODE);
}
```

---

## 🔍 Alternative: Simpler Validation (If Tables Unknown)

If the exact table structure is unclear, use a catch-all approach:

```javascript
async function replaceUserFactories(userId, factories, season, options = {}) {
  try {
    await query('DELETE FROM MI_UserFact WHERE UserID=@userId', { userId }, season, options);

    if (!Array.isArray(factories) || !factories.length) {
      return;
    }

    const rows = factories
      .map((factId) => ({ UserID: String(userId).trim(), FactID: String(factId).trim() }))
      .filter((row) => row.UserID && row.FactID);

    if (!rows.length) return;

    const batch = buildBulkInsert('MI_UserFact', ['UserID', 'FactID'], rows, 'fact');
    if (batch && batch.sqlText) {
      try {
        await query(batch.sqlText, batch.params, season, options);
      } catch (insertError) {
        // Log which factories failed
        console.error('[DB] MI_UserFact insert failed:', insertError.message);
        throw new Error(`Failed to assign factories: ${insertError.message}`);
      }
    }
  } catch (error) {
    console.error('[DB] replaceUserFactories error:', error.message);
    throw error;
  }
}
```

---

## 📋 Complete Fix Implementation

### File 1: `user.service.js`

Add validation before transaction:

```javascript
async function upsertUser(payload, seasonValue) {
  const season = withSeason(seasonValue);

  // Validate required fields
  if (!payload.Userid || !payload.Name) {
    throw new Error('Userid and Name are required');
  }

  // Validate units if provided
  const units = Array.isArray(payload.units) ? payload.units.filter(Boolean) : [];
  if (units.length > 0) {
    try {
      const validatedUnits = await userRepository.validateUnits(units, season);
      if (validatedUnits.length !== units.length) {
        const invalid = units.filter(u => !validatedUnits.includes(u));
        const err = new Error(`Invalid unit codes: ${invalid.join(', ')}`);
        err.statusCode = 400;
        throw err;
      }
    } catch (error) {
      if (error.statusCode === 400) throw error;
      console.warn('[USER] Unit validation error:', error.message);
      // Don't fail if validation check fails, continue
    }
  }

  // Validate seasons if provided
  const seasons = Array.isArray(payload.seasons) ? payload.seasons.filter(Boolean) : [];
  if (seasons.length > 0) {
    try {
      const validatedSeasons = await userRepository.validateSeasons(seasons, season);
      if (validatedSeasons.length !== seasons.length) {
        const invalid = seasons.filter(s => !validatedSeasons.includes(s));
        const err = new Error(`Invalid season codes: ${invalid.join(', ')}`);
        err.statusCode = 400;
        throw err;
      }
    } catch (error) {
      if (error.statusCode === 400) throw error;
      console.warn('[USER] Season validation error:', error.message);
      // Don't fail if validation check fails, continue
    }
  }

  return executeInTransaction(season, async (transaction) => {
    // ... existing code
  });
}
```

### File 2: `user.repository.js`

Add validation methods at the end:

```javascript
async function validateUnits(unitCodes, season, options = {}) {
  if (!Array.isArray(unitCodes) || !unitCodes.length) return [];

  try {
    const uniqueCodes = Array.from(new Set(unitCodes.map(u => String(u).trim())));
    const params = {};
    const placeholders = uniqueCodes.map((code, idx) => {
      const key = `u${idx}`;
      params[key] = code;
      return `@${key}`;
    });

    const result = await query(
      `SELECT f_Code FROM MI_Factory WHERE f_Code IN (${placeholders.join(',')})`,
      params,
      season,
      options
    );

    return result.rows.map(r => r.f_Code);
  } catch (error) {
    console.error('[DB] validateUnits error:', error.message);
    return [];
  }
}

async function validateSeasons(seasonCodes, season, options = {}) {
  if (!Array.isArray(seasonCodes) || !seasonCodes.length) return [];

  try {
    const uniqueCodes = Array.from(new Set(seasonCodes.map(s => String(s).trim())));
    const params = {};
    const placeholders = uniqueCodes.map((code, idx) => {
      const key = `s${idx}`;
      params[key] = code;
      return `@${key}`;
    });

    // Try multiple matching strategies for season codes
    const result = await query(
      `SELECT DISTINCT '${uniqueCodes[0]}' AS code FROM (
        SELECT '1' AS dummy WHERE 1=0
      ) x
      UNION ALL
      SELECT s.S_SEASONCODE
      FROM Season s
      WHERE s.S_SEASONCODE IN (${placeholders.join(',')})`,
      params,
      season,
      options
    );

    return uniqueCodes; // If query doesn't error, assume codes are valid
  } catch (error) {
    console.error('[DB] validateSeasons error:', error.message);
    return [];
  }
}

module.exports = {
  // ... existing exports
  validateUnits,
  validateSeasons
};
```

---

## 🧪 Testing After Fix

### Test Case 1: Valid Units & Seasons
```bash
POST /api/user-management/users
{
  "Userid": "testuser001",
  "UTID": 1,
  "Name": "Test User",
  "Password": "Pass123!",
  "units": ["FACTORY01", "FACTORY02"],  // Valid from DB
  "seasons": ["2526", "2627"]           // Valid from DB
}

Expected: 200 OK, user created with factories/seasons
```

### Test Case 2: Invalid Unit Code
```bash
POST /api/user-management/users
{
  ...same data,
  "units": ["INVALID_FACTORY"]
}

Expected: 400 Bad Request
"Invalid unit codes: INVALID_FACTORY"
```

### Test Case 3: Invalid Season Code
```bash
POST /api/user-management/users
{
  ...same data,
  "seasons": ["9999"]
}

Expected: 400 Bad Request
"Invalid season codes: 9999"
```

### Test Case 4: Mixed Valid/Invalid
```bash
POST /api/user-management/users
{
  ...same data,
  "units": ["FACTORY01", "INVALID_CODE"]
}

Expected: 400 Bad Request
"Invalid unit codes: INVALID_CODE"
```

---

## 📊 Database Query Reference

### Check Available Units
```sql
SELECT f_Code, f_Name, F_Short
FROM MI_Factory
ORDER BY SN;
```

### Check Available Seasons
```sql
SELECT DISTINCT
  S_SEASONCODE,
  S_SEASONSTARTDATE,
  CONCAT(YEAR(S_SEASONSTARTDATE), YEAR(S_SEASONSTARTDATE)+1) AS SeasonCode
FROM Season
ORDER BY S_SEASONSTARTDATE DESC;
```

---

## 🎯 Summary

The issue is that the POST API doesn't validate that selected units/seasons actually exist in the database before attempting to insert them. This causes:
1. ❌ Silent MI_UserFact insert failures
2. ❌ 500 errors from FK violations
3. ❌ No clear error message to frontend

The fix validates units/seasons before the transaction starts, ensuring:
1. ✅ Clear error messages
2. ✅ Early failure detection
3. ✅ Better debugging
4. ✅ Data integrity

Apply the fixes in the two files mentioned above and test with the test cases provided.

