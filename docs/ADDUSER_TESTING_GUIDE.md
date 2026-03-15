# AddUser Page - Complete Testing Guide

## ✅ Fixes Verified In This Session

1. **Database NULL Fix** - FactID now uses NULL instead of empty string
2. **Transaction Request Pattern** - All services now use `new sql.Request()` instead of unsafe `.request()`
3. **Code Cleanup** - Removed dead commented code from AddUser.jsx

---

## 🧪 Testing Steps

### Step 1: Open the AddUser Page

**URL:** `http://localhost:5173/UserManagement/AddUser`

**Expected:** Form loads successfully with:
- ✅ User Type dropdown populated
- ✅ Input fields visible and enabled
- ✅ Units list shows available factories
- ✅ Seasons list shows available seasons

---

### Step 2: Fill Out the Form (New User)

Fill in the following fields:

| Field | Value | Notes |
|-------|-------|-------|
| **User Type** | Select any available type | Required - dropdown must have values |
| **User ID** | `testuser001` | Required - alphanumeric, will be disabled on edit |
| **SAP Code** | `SAP12345` | Optional |
| **Password** | `TestPassword123!` | Required for new user (min 8 chars recommended) |
| **Full Name** | `John Doe` | Required - visible in list |
| **Mobile** | `9876543210` | Optional - Indian format |
| **Email ID** | `john.doe@example.com` | Optional - validated by browser |
| **DOB** | `1990-01-15` | Optional - date format |
| **Gender** | `Male` | Radio button - Default is Male |
| **Type** | `Other` | Dropdown - Other/Cane/Plant |
| **Status** | `Active` | Dropdown - Active/Deactive |
| **Time Start** | `0600` | Work start time (HHmm format) |
| **Time End** | `1800` | Work end time (HHmm format) |
| **GPS Location** | ☑️ Check | Optional checkbox |
| **Units** | Select 1-2 factories | Checkboxes - scroll if needed |
| **Seasons** | Select 1-2 seasons | Checkboxes - scroll if needed |

---

### Step 3: Submit the Form

**Action:** Click the **"Save"** button

**Monitor These:**

#### Browser Console (F12)
```javascript
// ✅ GOOD - No errors
// API Request should show:
POST http://localhost:5000/api/user-management/users
Status: 200 OK

// ✅ Response should be:
{
  "success": true,
  "message": "User registered successfully!",
  "data": null
}
```

#### Network Tab (F12 > Network)
- **Request URL:** `http://localhost:5000/api/user-management/users`
- **Method:** `POST`
- **Status:** `200` ✅ (NOT 500)
- **Headers:** Should include `Authorization: Bearer {token}`
- **Request Body:** Should show JSON payload with all form fields

#### Expected Behavior
- ✅ Loading spinner appears ("Saving...")
- ✅ Button disabled during submit
- ✅ Green toast notification: "User registered successfully!"
- ✅ Redirects to `/UserManagement/AddUserViewRight` (User list)
- ✅ No "this._acquiredConnection.on is not a function" error

---

### Step 4: Verify User Created

**URL:** Should redirect to `http://localhost:5173/UserManagement/AddUserViewRight`

**Expected:**
- ✅ User list shows newly created user
- ✅ User details match what was submitted
- ✅ User status is "Active"
- ✅ Assigned units and seasons are visible

---

### Step 5: Edit Existing User

**URL:** Click edit button on the newly created user

**Expected:**
- ✅ Form loads with pre-filled data
- ✅ User ID field is **DISABLED** (cannot edit username)
- ✅ Password field is empty (not exposed)
- ✅ Other fields show current values
- ✅ Selected units/seasons are checked

**Modify and Save:**
1. Change **Full Name** to `John Doe Updated`
2. Leave password blank (keeps current)
3. Change **Status** to `Deactive`
4. Uncheck some units
5. Click **Save**

**Expected:**
- ✅ Green toast: "User updated successfully!"
- ✅ Redirects to user list
- ✅ Updated values appear in list
- ✅ No error "this._acquiredConnection.on is not a function"

---

## 🔍 Error Scenarios to Test

### Scenario 1: Missing Required Fields

**Action:** Leave User ID empty, click Save

**Expected:**
- ❌ Form does NOT submit
- ✅ Toast error: "User ID and Full Name are required"
- ✅ Focus on User ID field
- ✅ NO API call made

---

### Scenario 2: Missing User Type

**Action:** Don't select User Type, click Save

**Expected:**
- ❌ Form does NOT submit
- ✅ Toast error: "User Type is required"
- ✅ NO API call made

---

### Scenario 3: Missing Password for New User

**Action:** Fill all fields except Password, click Save

**Expected:**
- ❌ Form does NOT submit
- ✅ Toast error: "Password is required for new user"
- ✅ NO API call made

---

### Scenario 4: Duplicate User ID

**Action:** Try to create user with User ID that already exists

**Expected:**
- ✅ Form submits (validation passes)
- ❌ API returns 409 error
- ✅ Toast error shows server message
- ✅ User stays on form (can retry)

---

### Scenario 5: Invalid Email Format

**Action:** Enter invalid email like `notanemail`

**Expected:**
- ❌ Browser input validation prevents submit (browser native)
- ✅ Red outline on email field
- ✅ Message: "Please enter a valid email"

---

## 📊 Payload Verification

### What Gets Sent (Check Network Tab)

**Request Body Should Look Like:**
```json
{
  "ID": null,                    // For new user
  "Userid": "testuser001",       // Renamed from userid
  "UTID": 1,                     // User Type ID (number)
  "Name": "John Doe",
  "Password": "TestPassword123!",// Hashed by backend
  "SAPCode": "SAP12345",
  "Mobile": "9876543210",
  "EmailID": "john.doe@example.com",
  "DOB": "1990-01-15",
  "Gender": "1",                 // 1=Male, 0=Female
  "Type": "Other",               // Other/Cane/Plant
  "Status": "1",                 // 1=Active, 0=Deactive
  "TimeFrom": "0600",
  "TimeTo": "1800",
  "GPS_Notification": 1,         // 1 if checked, 0 if not
  "units": ["FACT01", "FACT02"], // Selected factory codes
  "seasons": ["2526", "2627"]    // Selected season codes
}
```

---

## 🐛 Common Issues & Solutions

### Issue #1: "500 Internal Server Error"

**Symptom:**
```
POST /api/user-management/users
Status: 500
Response: Internal server error
```

**Possible Causes:**
- ❌ Database password hashing failed
- ❌ Invalid factory/season IDs
- ❌ Database constraint violation

**Solution:**
1. Check backend logs: `docker logs user-service` (or your backend log viewer)
2. Look for error messages
3. Verify database schema has all required columns
4. Ensure FactID is NULL (not empty string) ✅ **FIXED**

---

### Issue #2: "this._acquiredConnection.on is not a function"

**Symptom:**
```
TypeError: this._acquiredConnection.on is not a function
node_modules/mssql/lib/tedious/transaction.js:...
```

**Status:** ✅ **SHOULD BE FIXED** - We replaced `transaction.request()` with `new sql.Request(transaction)`

**If Still Occurs:**
1. Verify all 7 files were updated correctly
2. Check git status: `git diff`
3. Restart backend services
4. Clear npm cache: `npm cache clean --force`
5. Reinstall dependencies: `npm install`

---

### Issue #3: "User ID already exists"

**Symptom:**
```json
{
  "success": false,
  "message": "User testuser001 already exists",
  "error": "CONFLICT"
}
```

**Solution:**
- Use a unique User ID
- Increment number: `testuser002`, `testuser003`, etc.
- Include timestamp: `testuser_20260313_001`

---

### Issue #4: "Cannot find user types"

**Symptom:**
```
User Type dropdown is empty
Form loads but no types available
```

**Cause:**
- MI_UserType table has no records
- getMasterData endpoint failing
- API gateway not forwarding request

**Solution:**
1. Check MI_UserType table has records
2. Test endpoint: `GET http://localhost:5000/api/user-management/user-types`
3. Check API gateway is running
4. Verify auth token is valid

---

### Issue #5: "Form not disabling User ID on edit"

**Symptom:**
```
Edit mode enabled, but User ID field is editable
```

**Expected:** User ID should always be disabled (`disabled={isEditMode}`)

**Solution:**
1. Check AddUser.jsx line 461
2. Verify: `disabled={isEditMode}` is present
3. Reload page if it was just updated

---

## 📝 Testing Checklist

### Before Testing
- [ ] Backend services are running (all microservices)
- [ ] API Gateway is running at port 5000
- [ ] Frontend runs at port 5173
- [ ] Database (MSSQL) is accessible
- [ ] User is authenticated (token in localStorage)

### Form Validation
- [ ] Required fields show validation errors when empty
- [ ] Email field validates format
- [ ] User ID is disabled in edit mode
- [ ] Password is hidden and not exposed on edit

### New User Creation
- [ ] Form submits without errors
- [ ] API returns 200 status
- [ ] Toast shows success message
- [ ] Redirects to user list
- [ ] New user appears in list with correct data
- [ ] **NO transaction error** ("this._acquiredConnection.on")

### User Editing
- [ ] Pre-filled data loads correctly
- [ ] Can modify non-ID fields
- [ ] Can change units/seasons
- [ ] Password left blank keeps existing
- [ ] Form submits and updates
- [ ] **NO transaction error**

### Error Handling
- [ ] Duplicate user ID shows error
- [ ] Missing required fields show errors
- [ ] Invalid email shows browser validation
- [ ] Network errors show friendly message

### Database
- [ ] New users appear in MI_User table
- [ ] Factories stored in MI_UserFact (if assigned)
- [ ] Seasons stored in user-season mapping table
- [ ] FactID is NULL (not empty string) ✅
- [ ] Password is hashed (bcrypt), not plain text

---

## 🎯 Success Criteria

### ✅ All Tests Pass When:

1. **Form Loads** - No JavaScript errors in console
2. **Validation Works** - Required fields are enforced
3. **Creation Success** - User created without 500 error
4. **No Transaction Error** - "this._acquiredConnection" error gone
5. **Data Persists** - User appears in database and list
6. **Edit Works** - Can modify existing users
7. **Redirect Works** - After save, goes to user list
8. **Units/Seasons** - Assignments persist correctly
9. **Password Hashed** - Passwords are bcrypt'd, not plain text
10. **NULL FactID** - Database has NULL, not empty string ✅

---

## 📋 Report Template

If issues occur, provide:

```markdown
**Issue:** [Brief description]

**Steps to Reproduce:**
1. [Step 1]
2. [Step 2]
3. [Step 3]

**Expected Behavior:**
[What should happen]

**Actual Behavior:**
[What actually happens]

**Browser Console Error:**
[Error message from F12 console]

**Network Tab (F12):**
- URL: [request URL]
- Method: [GET/POST]
- Status: [HTTP status]
- Response: [API response]

**Backend Logs:**
[Backend service logs if error occurs]

**Screenshots:** [If applicable]
```

---

## ✨ POST-FIX VERIFICATION

### Changes Applied:
- ✅ FactID now uses NULL instead of empty string
- ✅ Transaction request pattern fixed across 7 database files
- ✅ Dead code removed from AddUser.jsx
- ✅ Comprehensive documentation added

### Expected Improvements:
- ✅ No more "this._acquiredConnection.on is not a function" errors
- ✅ User creation in transactions works smoothly
- ✅ Database operations are version-safe
- ✅ Better code maintainability

---

## 🚀 Next Steps After Testing

1. **If all tests pass:**
   - ✅ Deploy to staging
   - ✅ Run integration tests
   - ✅ Deploy to production

2. **If issues found:**
   - 🔍 Debug using guide above
   - 📝 Share error details
   - 🔧 Apply additional fixes if needed

