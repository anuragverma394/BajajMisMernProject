# POST /api/user-management/users - Diagnostic Guide

## Current Flow

```
Frontend (AddUser.jsx)
    ↓ POST /user-management/users
API Gateway (port 5000)
    ↓ forwards to USER_SERVICE_URL/api/user-management/users
User Service (port 5002)
    ↓ POST /users route + validateUpsertUser + UpsertUser controller
Backend Response
    ↓ res.apiSuccess() or res.apiError()
Frontend catches error/success
```

---

## ✅ Routing is CORRECT

### API Gateway Routes (Port 5000)
```javascript
// Line 63 in api-gateway/src/routes/index.js
router.use('/user-management', authenticate, forwardToService(process.env.USER_SERVICE_URL, '/api/user-management', 'user-management'));
```

**What happens:**
- Client POST: `/api/user-management/users`
- Forwards to: `{USER_SERVICE_URL}/api/user-management/users`
- User Service port: 5002 (by default)

---

### User Service Routes (Port 5002)
```javascript
// Line 17 in user-service/src/routes/user-management.routes.js
router.post('/users', validate(validateUpsertUser), userController.UpsertUser);
```

**Middleware order:**
1. ✅ requireAuth - Check authentication
2. ✅ validate(validateUpsertUser) - Validate payload
3. ✅ userController.UpsertUser - Create/Update user

---

## 🔍 How to Diagnose the Error

### Step 1: Open Browser Developer Tools (F12)

### Step 2: Check Network Tab

**Before submitting the form:**
- Clear old requests (click trash icon)
- Switch to Network tab
- Make sure "Fetch/XHR" filter is ON

### Step 3: Fill Form and Submit

Fill a test user and click Save. You should see a POST request:

```
POST http://localhost:5000/api/user-management/users
```

### Step 4: Inspect the Request

Click on the request and check:

**Headers Tab:**
```
POST /api/user-management/users HTTP/1.1
Host: localhost:5000
Authorization: Bearer {your-token}
Content-Type: application/json
```

**Request Payload Tab (should show JSON):**
```json
{
  "Userid": "testuser001",
  "UTID": 1,
  "Name": "John Doe",
  "Password": "TestPassword123!",
  "Mobile": "9876543210",
  "EmailID": "john@example.com",
  "Gender": "1",
  "Type": "Other",
  "Status": "1",
  "TimeFrom": "0600",
  "TimeTo": "1800",
  "GPS_Notification": 1,
  "units": ["FACT01"],
  "seasons": ["2526"]
}
```

### Step 5: Check Response

**Status Code:**
- ✅ 200 = Success
- ❌ 400 = Validation error
- ❌ 409 = Duplicate user
- ❌ 500 = Server error
- ❌ 401 = Authentication failed
- ❌ 404 = Route not found

**Response Body (should be JSON):**

**If Status 200 (Success):**
```json
{
  "success": true,
  "message": "User saved successfully",
  "data": null
}
```

**If Status 400/500 (Error):**
```json
{
  "success": false,
  "message": "error description here",
  "data": null,
  "error": "ERROR_CODE"
}
```

### Step 6: Check Console Tab

Look for any JavaScript errors:
- Red errors (with ❌ icon)
- Warning messages
- Stack traces

---

## Common Error Scenarios & Fixes

### ❌ Error #1: 400 Bad Request - Validation Failed

**Message:** `userid/Userid is required and must be alphanumeric`

**Causes:**
- ❌ userid field is empty
- ❌ userid contains special characters
- ❌ userid is too long (max 50 chars)

**Fix:**
- ✅ User ID must be: alphanumeric only (A-Z, a-z, 0-9)
- ✅ Examples: `user001`, `john_smith`, `USER123`
- ❌ Invalid: `user@001`, `user-001`, `user 001`

---

### ❌ Error #2: 400 Bad Request - UTID Invalid

**Message:** `UTID is required and must be a positive integer`

**Causes:**
- ❌ User Type not selected (value is empty)
- ❌ User Type dropdown loaded but no data

**Fix:**
- ✅ Make sure User Type dropdown has values
- ✅ Select one from the dropdown
- Test URL: `GET http://localhost:5000/api/user-management/user-types`
  - Should return array of user types

---

### ❌ Error #3: 400 Bad Request - Name Required

**Message:** `Name is required`

**Causes:**
- ❌ Full Name is empty
- ❌ Only whitespace in name

**Fix:**
- ✅ Enter a valid name (at least 1 character, max 120)

---

### ❌ Error #4: 400 Bad Request - Password Required

**Message:** `Password is required for new user`

**Causes:**
- ❌ Password field is empty on NEW user
- ❌ Password is only whitespace

**Fix:**
- ✅ Password must be at least 1 character (recommend 8+)
- ✅ Only required for NEW users (not for edit)

---

### ❌ Error #5: 409 Conflict - Duplicate User

**Message:** `User testuser001 already exists`

**Causes:**
- ❌ User ID already exists in database
- ❌ Trying to create with duplicate username

**Fix:**
- ✅ Use a unique User ID
- ✅ Examples: `testuser002`, `testuser_001`, `user00123`

---

### ❌ Error #6: 500 Internal Server Error

**Message:** `Internal server error`

**Causes (with transaction fix applied):**
- ❌ Database constraint error
- ❌ Invalid factory IDs in `units` array
- ❌ Invalid season IDs in `seasons` array
- ❌ Transaction timeout
- ❌ Database connection lost

**Fix:**
1. Check backend logs: `docker logs user-service` or wherever logs are
2. Look for detailed error message
3. Verify database is running
4. Verify MI_User table exists with proper columns
5. Verify FactID column allows NULL (should be after our fix ✅)

---

### ❌ Error #7: 404 Not Found

**Message:** `Route not found: POST /api/user-management/users`

**Causes:**
- ❌ User Service not running
- ❌ Wrong USER_SERVICE_URL env var
- ❌ API Gateway not forwarding

**Fix:**
1. Check if user-service is running: `ps aux | grep user-service`
2. Check if accessible: `curl http://localhost:5002/api/health`
3. Check USER_SERVICE_URL env variable
4. Restart API Gateway: `npm restart api-gateway`

---

### ❌ Error #8: 401 Unauthorized

**Message:** `Invalid token or unauthorized`

**Causes:**
- ❌ No token in localStorage
- ❌ Token expired
- ❌ Invalid token format

**Fix:**
1. Check localStorage in DevTools (F12 > Application > Storage)
2. Look for `token` key
3. If missing, log in again
4. Try fresh login or longer-lived token

---

## Quick Verification Script

Copy and paste in browser console (F12) while on the AddUser page:

```javascript
// Check if you're authenticated
const token = localStorage.getItem('token');
console.log('🔐 Token exists:', !!token);
console.log('🔐 Token value:', token ? token.substring(0, 50) + '...' : 'NONE');

// Check API base URL
const apiClient = window.apiClient; // May not be accessible
console.log('🌐 API Base URL:', 'http://localhost:5000/api');

// Prepare test payload
const testPayload = {
  Userid: 'testuser_' + Date.now(),
  UTID: 1,
  Name: 'Test User',
  Password: 'Test@1234',
  Mobile: '9876543210',
  EmailID: 'test@example.com',
  Gender: '1',
  Type: 'Other',
  Status: '1',
  TimeFrom: '0600',
  TimeTo: '1800',
  GPS_Notification: 0,
  units: [],
  seasons: []
};

console.log('📦 Payload ready:', testPayload);

// Test API call (only if you want to test directly)
// await fetch('http://localhost:5000/api/user-management/users', {
//   method: 'POST',
//   headers: {
//     'Content-Type': 'application/json',
//     'Authorization': `Bearer ${token}`
//   },
//   body: JSON.stringify(testPayload)
// }).then(r => r.json()).then(d => console.log('Response:', d));
```

---

## API Service Code Check

### Current (in api.service.js):
```javascript
createUser: async (userData) => {
    const response = await apiClient.post('/user-management/users', userData);
    return response.data;
}
```

### Issues to Check:

1. **Is getUnits working?**
   - Check if dropdown populates
   - If empty, units array will always be empty

2. **Is getUserTypes working?**
   - Check if User Type dropdown populates
   - If empty, validation will fail (UTID required)

3. **Is getSeasons working?**
   - Check if seasons list populates
   - If empty, seasons array will be empty (OK if optional)

---

## Testing the Complete Flow

### Test #1: Test getUnits (verify factories load)
```
GET http://localhost:5000/api/main/units
Expected: 200, JSON array with f_Code and F_Name
```

### Test #2: Test getUserTypes (verify types load)
```
GET http://localhost:5000/api/user-management/user-types
Expected: 200, JSON array with UTID and UT_UserType
```

### Test #3: Test getSeasons (verify seasons load)
```
GET http://localhost:5000/api/main/seasons
Expected: 200, JSON array with season data
```

### Test #4: Test createUser (the actual POST)
```
POST http://localhost:5000/api/user-management/users
Headers: Authorization: Bearer {token}, Content-Type: application/json
Body: { valid user payload }
Expected: 200 with success response
```

---

## Next Steps

1. **Identify the exact error message** (provide the Response body from Network tab)
2. **Share which test fails** (Tests #1-4 above)
3. **Check backend logs** for detailed error
4. **Verify all micro services are running:**
   - API Gateway (5000)
   - User Service (5002)
   - Auth Service (5001)
   - Dashboard Service (5003)

---

## Response Format Reference

### Success Response (Status 200)
```json
{
  "success": true,
  "message": "User saved successfully",
  "data": null
}
```

### Validation Error (Status 400)
```json
{
  "success": false,
  "message": "userid/Userid is required and must be alphanumeric",
  "data": null
}
```

### Server Error (Status 500)
```json
{
  "success": false,
  "message": "Internal server error",
  "data": null,
  "error": "ValueError"
}
```

### Conflict Error (Status 409)
```json
{
  "success": false,
  "message": "User testuser001 already exists",
  "error": "CONFLICT"
}
```

---

## Debugging Checklist

- [ ] Filled all required fields (userid, name, UTID, password)
- [ ] User Type dropdown has values
- [ ] No validation error toast on form
- [ ] Network request shows POST to `/api/user-management/users`
- [ ] Request includes Authorization header with Bearer token
- [ ] Request body is valid JSON with all required fields
- [ ] Response status is 200 (or identified error code)
- [ ] Response body is valid JSON
- [ ] Browser console shows no JavaScript errors
- [ ] User Service logs show request received
- [ ] Database shows new user created (check MI_User table)

