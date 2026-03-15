# npm Workspace Error - Quick Fix

**Error**: `Unsupported URL Type "workspace": workspace:*`

**Root Cause**: npm version < 8.5.0 doesn't support workspaces

---

## ⚡ IMMEDIATE FIX (3 steps)

### Step 1: Update npm to latest
```bash
npm install -g npm@latest
```

**Verify update:**
```bash
npm -v
```
Should show **v8.5.0 or higher** (preferably v10.x or later)

### Step 2: Clean and reinstall
```bash
# Navigate to backend directory
cd backend

# Remove old cache and dependencies
rmdir /s /q node_modules
del package-lock.json

# Install with updated npm
npm install
```

### Step 3: Start services
```bash
npm start
```

---

## Alternative: Use the Setup Script

Simply run:
```bash
setup.bat
```

This will:
1. ✅ Check npm version
2. ✅ Update npm if needed
3. ✅ Clean old dependencies
4. ✅ Install with workspace support
5. ✅ Verify setup

---

## Detailed Troubleshooting

### Check Current npm Version
```bash
npm -v
```

**Current**: Likely showing 6.x, 7.x, or early 8.x  
**Required**: 8.5.0+  
**Recommended**: 10.x or later

### Force npm Update
```bash
# Windows
npm install -g npm@latest
# Or specific version
npm install -g npm@10.2.0

# Verify
npm -v
```

### Complete Clean Install

**Option A: Simple**
```bash
cd backend
npm install
```

**Option B: Full Clean**
```bash
cd backend
rmdir /s /q node_modules
del package-lock.json
npm cache clean --force
npm install
```

**Option C: Nuclear (safest)**
```bash
cd backend

# Remove everything
rmdir /s /q node_modules
del package-lock.json

# Reinstall Node & npm from nodejs.org
# Then run:
npm install
```

---

## What npm Workspaces Does

Your `package.json` has:
```json
{
  "workspaces": [
    "shared",
    "services/*"
  ]
}
```

When npm supports workspaces (v8.5.0+), it:
1. ✅ Reads the workspaces declaration
2. ✅ Installs all dependencies in root
3. ✅ Creates symlinks for local packages
4. ✅ Links `@bajaj/shared` to all services
5. ✅ Services can require `@bajaj/shared`

Without workspace support, npm can't resolve the `workspace:*` specifier and throws the error.

---

## Verify Setup After Fix

### Check if @bajaj/shared is linked
```bash
cd backend
dir node_modules\@bajaj\shared
```

Should list files from `shared/` directory

### Test a service can find the module
```bash
cd services\user-service
node -e "require('@bajaj/shared')"
# No error = success
```

### Test health checks
```bash
npm start
# Wait for services to start
# Test in another terminal:
curl http://localhost:5002/api/health
```

---

## Symptoms It's Fixed

After running the fix, you should see:
```bash
npm install
# Downloads packages...
added XXX packages

npm start
# All services start successfully:
# [backend] starting microservices...
# user-service listening on port 5002
# auth-service listening on port 5003
# dashboard-service listening on port 5004
# report-service listening on port 5010
# ... (all other services)
```

---

## If Issues Persist

### Issue: "npm command not found"
**Solution**: Update npm manually  
https://nodejs.org → Download and install latest

### Issue: "Permission denied" 
**Solution**: Use sudo (on Mac/Linux)  
```bash
sudo npm install -g npm@latest
```

### Issue: Still getting workspace error
**Solution**: Check npm version is actually updated
```bash
npm -v
which npm  # Linux/Mac - should be in global location
where npm  # Windows
```

### Issue: Services still won't start
**Solution**: Check logs
```bash
npm start 2>&1 | tee install.log
# Review install.log for errors
```

---

## Prevention for Future

- ✅ Keep npm updated: `npm install -g npm@latest`
- ✅ Always run `npm install` from backend root
- ✅ Commit `package-lock.json` to git
- ✅ Never delete node_modules/@bajaj/shared manually
- ✅ Test workspace setup: `npm ls -a @bajaj/shared`

---

**Last Updated**: March 2026

