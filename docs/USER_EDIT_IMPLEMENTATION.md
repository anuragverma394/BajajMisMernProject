# UserName Click to Edit - Implementation Guide

## Overview
When clicking on a UserName in the `AddUserViewRight` view, the user is now navigated to the `AddUser` page in edit mode where they can update user details.

## Architecture

### Flow Diagram
```
AddUserViewRight.jsx (View Users)
    ↓ [Click UserName]
    ↓
AddUser.jsx (Edit Mode)
    ↓ [Load user data via API]
    ↓
Backend API: /user-management/user-details/:userid
    ↓
user.service.js → user.repository.js → Database
```

---

## Frontend Implementation

### 1. AddUserViewRight.jsx - Added Click Handler

**Location:** Table row rendering (tbody map function)

**Changes:**
- Added `handleEditUser` function inside the map callback
- Added `onClick` handler to UserName `<td>` element
- Added hover styles for better UX (cursor pointer, background change, font weight)
- Navigates to edit page with userid query parameter

**Code:**
```javascript
const handleEditUser = () => {
  const userid = item.Userid || item.UserId || ''; 
  if (userid) {
    navigate(`/UserManagement/AddUser?userid=${encodeURIComponent(userid)}`);
  }
};

<td 
  onClick={handleEditUser}
  className="text-[13px] text-[#4d68ff] p-[12px] border border-[#a9c7a3] cursor-pointer hover:bg-[#d4c4c6] hover:font-semibold transition-all duration-200"
>
  {item.Name || item.UserName || '-'}
</td>
```

### 2. AddUser.jsx - Enhanced User Loading

**Changes:**
- Updated to accept both `?id=` and `?userid=` query parameters (for flexibility)
- Improved loadUserData to use dedicated `getUserByCode` endpoint with fallback to `getUsers`
- Maintains backward compatibility with existing `?id=` parameter

**Code:**
```javascript
// Extract both possible parameters
const queryParams = new URLSearchParams(location.search);
const id = queryParams.get('id');
const userid = queryParams.get('userid');

if (id || userid) {
  setIsEditMode(true);
  loadUserData(userid || id, unitsData, seasonsData);
}

// Improved loadUserData function
const loadUserData = async (id, currentUnits, currentSeasons) => {
  try {
    let user;
    // Use dedicated endpoint for single user if available
    if (id) {
      try {
        user = await userManagementService.getUserByCode(id);
      } catch (error) {
        // Fallback to getUsers if single endpoint not available
        const res = await userManagementService.getUsers({ id });
        user = Array.isArray(res) ? res[0] : res;
      }
    }
    
    // Rest of load logic...
```

---

## Backend API Implementation

### 1. Route Configuration
**File:** `/backend/services/user-service/src/routes/user-management.routes.js`

```javascript
router.get('/user-details/:userId', userController.GetUserDetails);
router.post('/users', validate(validateUpsertUser), userController.UpsertUser);
```

### 2. Controller Implementation
**File:** `/backend/services/user-service/src/controllers/user.controller.js`

**GetUserDetails Endpoint:**
- Accepts userId from URL parameter
- Validates the userId
- Returns user details including assigned factories and seasons
- Returns 404 if user not found

**UpsertUser Endpoint (NEW):**
- Handles both CREATE and UPDATE operations
- Validates required fields (Userid, Name)
- Password handling:
  - New users: Password is required and hashed
  - Existing users: Password is optional (if not provided, existing password is retained)
- Returns appropriate status codes (409 for duplicate, 404 for not found)
- Assigns factories and seasons to the user

```javascript
exports.UpsertUser = async (req, res, next) => {
  try {
    const result = await userService.upsertUser(req.validatedUserBody || req.body, req.user?.season);
    const message = req.body.ID ? 'User updated successfully' : 'User created successfully';
    return res.apiSuccess(message, result);
  } catch (error) {
    if (error.statusCode === 409) {
      return res.apiError(error.message, 'DUPLICATE_USER', 409);
    }
    if (error.statusCode === 404) {
      return res.apiError(error.message, 'NOT_FOUND', 404);
    }
    return next(error);
  }
};

exports.GetUserDetails = async (req, res, next) => {
  try {
    const userId = asId(req.params.userId, 50);
    if (!userId) {
      return res.apiError('Invalid user id', 'VALIDATION_ERROR', 400);
    }
    const data = await userService.getUserNameAndFactories(userId, req.user?.season);
    if (!data) return res.apiError('User not found', 'NOT_FOUND', 404);
    return res.apiSuccess('User details fetched', data);
  } catch (error) {
    return next(error);
  }
};
```

### 3. Service Layer
**File:** `/backend/services/user-service/src/services/user.service.js`

**upsertUser Function:**
- Validates required fields
- Handles password hashing for new users
- Updates password only if provided for existing users
- Manages user factory assignments
- Manages user season assignments
- Uses transaction for data consistency

**getUserNameAndFactories Function:**
- Fetches user details by userid
- Returns assigned factories
- Returns assigned seasons
- Used for edit mode pre-loading

### 4. API Service (Frontend)
**File:** `/frontend/src/microservices/user-management.service.js`

```javascript
getUsers: async (params) => {
  const response = await apiClient.get('/user-management/users', { params });
  return unwrap(response.data);
},

getUserByCode: async (userId) => {
  const response = await apiClient.get(`/user-management/user-details/${userId}`);
  return unwrap(response.data);
},

createUser: async (userData) => {
  const response = await apiClient.post('/user-management/users', userData);
  return response.data;
}
```

---

## Data Flow

### Fetching User for Edit
```
Frontend: GET /user-management/user-details/:userid
↓
Backend Controller: GetUserDetails
↓
Service: getUserNameAndFactories(userid)
↓
Repository: getUser(userid)
↓
Database: SELECT from tm_user
↓
Return: { ID, Userid, Name, Status, UTID, ... assignedUnits, assignedSeasons }
↓
Frontend: Populate form with user data
```

### Saving Updated User
```
Frontend: POST /user-management/users
  Body: { ID, Userid, Name, Status, UTID, units[], seasons[] }
↓
Backend Controller: UpsertUser
↓
Service: upsertUser (validates, hashes password if provided)
↓
Repository: updateUser (or createUser if new)
↓
Database: UPDATE tm_user, UPDATE user_factory_assignment, UPDATE user_season_assignment
↓
Return: Success message
↓
Frontend: Show success toast, navigate back to view
```

---

## Query Parameters

| Parameter | Source | Usage | Example |
|-----------|--------|-------|---------|
| `userid` | AddUserViewRight UserName click | Query single user | `?userid=EMP001` |
| `id` | (Legacy) Direct user.component links | Query single user | `?id=EMP001` |

Both parameters are supported for flexibility and backward compatibility.

---

## User Experience

### Before (Original State)
1. User views list of users in AddUserViewRight
2. UserName is plain text (not clickable)
3. To edit, user must manually navigate to AddUser and search for the user

### After (Current Implementation)
1. User views list of users in AddUserViewRight
2. UserName is clickable (hover effect shows cursor pointer and background change)
3. Click on UserName → Automatically navigates to AddUser in edit mode
4. Form pre-fills with user data
5. User can modify fields and save changes
6. Success toast confirms update
7. Redirect back to list view

---

## Validation

### Frontend Validation (AddUser.jsx)
- User ID is required
- Full Name is required
- User Type is required
- Password is required for new users (optional for updates)
- At least one unit must be selected

### Backend Validation (user.validation.js - validateUpsertUser)
- Userid: Required, trimmed, max 50 chars
- Name: Required, trimmed, max 255 chars
- UTID: Required, valid number
- Password: Required for new users, optional for updates
- Status: Optional, defaults to '1' (active)
- All other fields: Optional with defaults

### Business Logic Validation
- New user: Check if userid already exists (409 Conflict)
- Update: Verify user exists with provided ID (404 Not Found)
- Season filtering: Only display users for user's assigned season

---

## Error Handling

| Scenario | Status | Response | Frontend Behavior |
|----------|--------|----------|-------------------|
| Invalid userid | 400 | VALIDATION_ERROR | Show validation error |
| User not found | 404 | NOT_FOUND | Show "User not found" |
| Duplicate userid | 409 | DUPLICATE_USER | Show "User already exists" |
| Server error | 500 | Internal error | Show generic error + log to console |
| Network timeout | N/A | N/A | Show "Connection failed" |

---

## Reference from .NET Project

The .NET implementation follows a similar pattern:

### .NET AddUser Controller (Edit Mode)
```csharp
public ActionResult AddUser()
{
    AddClass Model = new AddClass();
    var qry = "";
    if (Request.QueryString["sid"] != null)
    {
        Model.ID = Convert.ToInt32(Request.QueryString["sid"].ToString());
        Model = DB.UpdateUser(qry, Model).ToList().FirstOrDefault();
        // ...
    }
}
```

### .NET GetUserData
```csharp
public PartialViewResult AddUserPartialView(string id, string userid, ...)
{
    // Fetch user data and populate model
    DataTable dt = obju.GetUserData(f_code, utid, userid);
    if (dt != null && dt.Rows.Count > 0)
    {
        foreach (DataRow dr in dt.Rows)
        {
            AddUserList.Add(new AddUser { ... });
        }
    }
}
```

**Equivalent Node.js Implementation:** Exactly mirrors this pattern with async/await and service layer abstraction.

---

## Testing Checklist

- [ ] **View Mode:** Verify users display correctly in AddUserViewRight table
- [ ] **Click Interaction:** Verify hover effect shows on UserName cell
- [ ] **Navigation:** Click on UserName navigates to /UserManagement/AddUser?userid=XXX
- [ ] **Data Loading:** User data pre-fills correctly in edit form
- [ ] **Edit Existing:** Make changes to user and save successfully
- [ ] **Save Success:** Toast shows success message and redirects to view
- [ ] **Validation:** All required fields validate on submit
- [ ] **Password:** Password is optional for updates (doesn't require current password)
- [ ] **Factories:** Assigned factories are checked in edit mode
- [ ] **Seasons:** Assigned seasons are checked in edit mode
- [ ] **Error Handling:** 404 and 409 errors show appropriate messages
- [ ] **Permission:** Verify auth middleware validates user session

---

## API Endpoints

### Get All Users with Filters
- **Method:** GET
- **URL:** `/user-management/users`
- **Params:** `{ unit, userType, userId, id }`
- **Response:** User array or single user object (if id provided)

### Get Single User Details
- **Method:** GET
- **URL:** `/user-management/user-details/:userId`
- **Params:** userId (path parameter)
- **Response:** User details with assigned factories and seasons

### Create/Update User (NEW)
- **Method:** POST
- **URL:** `/user-management/users`
- **Body:** Full user object with factories and seasons arrays
- **Response:** Success message or error

---

## Database Tables Affected

- `tm_user` - Main user table (UPDATE/INSERT)
- `user_factory_assignment` - User's assigned factories (DELETE/INSERT)
- `user_season_assignment` - User's assigned seasons (DELETE/INSERT)

---

## Files Modified

1. ✅ `frontend/src/pages/user-management/AddUserViewRight.jsx`
   - Added click handler to UserName cell
   - Added hover styles

2. ✅ `frontend/src/pages/user-management/AddUser.jsx`
   - Support for userid query parameter
   - Improved user loading with dedicated endpoint + fallback

3. ✅ `backend/services/user-service/src/controllers/user.controller.js`
   - Added UpsertUser controller method

---

## Performance Considerations

- **Single User Load:** Uses dedicated endpoint `/user-details/:userId` for optimal performance
- **Fallback Support:** If dedicated endpoint fails, falls back to filtered list endpoint
- **Caching:** Consider implementing react-query/SWR for caching user list to avoid re-fetching
- **Lazy Loading:** Seasons and factories are loaded on demand when edit form opens

---

## Future Enhancements

1. Add soft delete functionality (instead of hard delete)
2. Add audit trail for user modifications
3. Add role-based access control for user editing
4. Add bulk edit capability
5. Add user activity log viewing
6. Add email verification for new users
7. Add password complexity requirements
8. Add two-factor authentication support

