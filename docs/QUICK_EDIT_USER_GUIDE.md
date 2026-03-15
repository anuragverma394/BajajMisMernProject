# Quick Reference - UserName Click to Edit Feature

## Summary
Click on a user's name in the UserViewRight grid → Automatically navigate to edit form with pre-filled data

## 3-Step Implementation

### Step 1: Frontend - AddUserViewRight.jsx
✅ **DONE** - Added click handler to UserName column
- Extracts userid from table row
- Navigates to: `/UserManagement/AddUser?userid={userid}`
- Added hover effect (cursor pointer + highlight)

### Step 2: Frontend - AddUser.jsx  
✅ **DONE** - Enhanced loading logic
- Accepts both `?id=` and `?userid=` parameters
- Uses dedicated `getUserByCode()` endpoint for single user fetch
- Falls back to `getUsers()` filter if needed

### Step 3: Backend - user.controller.js
✅ **DONE** - Added missing UpsertUser handler
- Posts to `/user-management/users`
- Creates new user or updates existing user
- Handles password hashing intelligently
- Returns appropriate error codes

---

## Screen Flow

```
┌─────────────────────────────┐
│   AddUserViewRight          │
│  ┌──────────────────────┐   │
│  │ Unit | Type | Name ↑ │   │  ← Click on UserName
│  ├──────────────────────┤   │
│  │  F01 | Admin| John↕ │──→┼────┐
│  │  F02 | Mgr | Sarah↕ │   │    │
│  │  F01 | Usr | Mike ↕ │   │    │
│  └──────────────────────┘   │    │
└─────────────────────────────┘    │
                                   │
                                   ▼
┌─────────────────────────────────────────┐
│      AddUser (Edit Mode)                │
│                                         │
│  User Type: ☑ Admin                   │
│  User ID: ◾ John (disabled)            │
│  Name: [John Doe____________]          │
│  Email: [john@company.com_____]        │
│  Status: ☑ Active                      │
│                                         │
│  Factories: ◾ F01 ◾ F02 (checked)    │
│  Seasons: ◾ 2324 (checked)           │
│                                         │
│  [Save] [Cancel]                       │
└─────────────────────────────────────────┘
```

---

## API Endpoints

| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET | `/user-management/users` | Get users list with filters |
| GET | `/user-management/user-details/:userid` | Get single user for edit |
| POST | `/user-management/users` | Create or update user |

---

## Testing Scenarios

### Scenario 1: View and Click (Basic Flow)
1. Open user management
2. Go to "User Right View" tab
3. Click Search to load users
4. **Hover over a UserName** → Should show hand cursor
5. **Click on UserName** → Should navigate to edit form
6. **Verify:** Form pre-fills with that user's data

### Scenario 2: Edit and Save
1. Click on a UserName (from Scenario 1)
2. Modify fields (name, email, status, etc.)
3. Modify factory/season selections
4. Click Save
5. **Verify:** Success toast appears
6. **Verify:** Redirected back to user list
7. **Verify:** Changes saved in database

### Scenario 3: New User vs Edit User
1. New User: Click "Add New" → Password field required
2. Edit User: Click on UserName → Password field optional
3. **Verify:** Password validation works correctly

### Scenario 4: Error Handling
1. Try to edit user with invalid ID in URL: `/AddUser?userid=INVALID`
   - **Expected:** Show "User not found" error
2. Try to create user with duplicate userid
   - **Expected:** Show "User already exists" error

---

## Code Locations

### Frontend Changes
- **File 1:** `frontend/src/pages/user-management/AddUserViewRight.jsx`
  - Line ~175: Click handler added to UserName `<td>`
  
- **File 2:** `frontend/src/pages/user-management/AddUser.jsx`
  - Line ~90: Query parameter handling
  - Line ~108: loadUserData function updated

### Backend Changes  
- **File:** `backend/services/user-service/src/controllers/user.controller.js`
  - Line ~120: UpsertUser method added

---

## URL Examples

| Action | URL |
|--------|-----|
| New User Form | `/UserManagement/AddUser` |
| Edit User (EMP001) | `/UserManagement/AddUser?userid=EMP001` |
| Edit User (legacy param) | `/UserManagement/AddUser?id=EMP001` |

---

## Key Features

✅ **Click to Edit** - Direct navigation from list to edit form
✅ **Pre-filled Data** - Form auto-fills user information
✅ **Password Handling** - Optional password on update (keep existing)
✅ **Factory Assignment** - Edit which factories user belongs to
✅ **Season Assignment** - Edit which seasons user can access
✅ **Error Messages** - Clear feedback for all error scenarios
✅ **Status Feedback** - Success toast after save
✅ **Backward Compat** - Supports both ?id= and ?userid= parameters

---

## Validation Rules

**Required Fields:**
- User ID (cannot change for existing users)
- Full Name
- User Type
- At least one Factory (Admin users exempt)

**Password Rules:**
- New User: Required
- Existing User: Optional (only update if provided)

**Email Validation:**
- Must be valid email format (if provided)

---

## Related Endpoints

- `/user-management/add-user-view` - Get user view metadata
- `/user-management/user-types` - Get available user types
- `/user-management/add-user-right` - Get user permissions
- `/user-management/roll-detail-data` - Get role details

---

## Browser Compatibility

✅ Chrome 90+
✅ Firefox 88+
✅ Safari 14+
✅ Edge 90+

---

## Known Limitations

1. Cannot change userid for existing users (only Admin can with special process)
2. Password must be changed through separate endpoint (if needed)
3. Bulk edit not supported (edit one user at a time)
4. No concurrent edit detection (last save wins)

---

## Support

For issues with this feature:
1. Check browser console for errors (F12)
2. Verify user has necessary permissions
3. Check API response in Network tab
4. Ensure user session is valid (not expired)
5. Review USER_EDIT_IMPLEMENTATION.md for detailed docs

