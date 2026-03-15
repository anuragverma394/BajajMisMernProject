# Backend Installation - Step-by-Step Fix

**Status**: Services failing to find `@bajaj/shared`  
**Root Cause**: Workspace dependencies not properly linked  
**Solution Level**: Multiple options from simple to advanced

---

## 🚀 Option 1: Automated Setup (Recommended)

### Step 1: Run the complete installation script
```bash
install.bat
```

This will:
1. ✅ Check npm version (update if needed)
2. ✅ Clean old dependencies
3. ✅ Install everything fresh
4. ✅ Link @bajaj/shared
5. ✅ Verify setup
6. ✅ Test module resolution

**Wait for completion** (takes 2-5 minutes on first run)

### Step 2: Start services
```bash
npm start
```

---

## 🔗 Option 2: Manual Linking (If Option 1 Fails)

### Step 1: Run manual linker
```bash
link.bat
```

This will:
1. ✅ Link @bajaj/shared globally
2. ✅ Link all services to shared
3. ✅ Verify resolution

### Step 2: Start services
```bash
npm start
```

---

## 🛠️ Option 3: Manual Setup (Advanced)

Run these commands in sequence:

### Step 1: Navigate to backend
```bash
cd backend
```

### Step 2: Clean everything
```bash
rmdir /s /q node_modules
del package-lock.json
```

### Step 3: Update npm
```bash
npm install -g npm@latest
```

### Step 4: Reinstall
```bash
npm install
```

### Step 5: Verify
```bash
node -e "require('@bajaj/shared'); console.log('OK')"
```

### Step 6: Start
```bash
npm start
```

---

## 📋 Troubleshooting

### Issue: "npm ERR! code EUNSUPPORTEDPROTOCOL"

**Problem**: npm version too old (< 8.5.0)

**Solution**:
```bash
npm install -g npm@latest
npm cache clean --force
npm install
```

### Issue: "Cannot find module @bajaj/shared" (still)

**Problem**: Workspace linking failed

**Solution A**: Try manual linking
```bash
link.bat
```

**Solution B**: Hard reset
```bash
# Close all terminals and Python processes first!
rmdir /s /q node_modules
del package-lock.json
npm cache clean --force
npm install
```

**Solution C**: Verify npm version
```bash
npm -v
# Must be 8.5.0 or higher
```

### Issue: "Access Denied" when removing node_modules

**Problem**: Files locked by running processes

**Solution**:
1. Close all terminals
2. Close all IDE windows
3. Close any Node processes
4. Try again:
   ```bash
   rmdir /s /q node_modules
   npm install
   ```

### Issue: Scripts still fail after installation

**Problem**: Services starting before links are complete

**Solution**:
1. Wait 30 seconds after `npm install` completes
2. Then run `npm start`

---

## ✅ How to Verify Setup

### Check 1: npm version
```bash
npm -v
```
Should show: **8.5.0 or higher**

### Check 2: @bajaj/shared exists
```bash
dir node_modules\@bajaj\shared
```
Should list files from shared/ directory

### Check 3: Module can be required
```bash
node -e "require('@bajaj/shared'); console.log('OK')"
```
Should print: **OK**

### Check 4: Services can start
```bash
npm start
```
Should start all services without "Cannot find module" errors

---

## 📊 Quick Diagnostic

Run this to see current state:

```bash
@echo off
echo npm version:
npm -v
echo.
echo Checking @bajaj/shared:
if exist "node_modules\@bajaj\shared" (
    echo [OK] @bajaj/shared directory exists
) else (
    echo [ERROR] @bajaj/shared directory missing
)
echo.
echo Trying to require @bajaj/shared:
node -e "try { require('@bajaj/shared'); console.log('[OK] Module resolves'); } catch(e) { console.log('[ERROR] ' + e.message); }"
```

Save as `diagnose.bat` and run it to see the current state.

---

## 🆘 If Nothing Works

### Nuclear Option (Complete Reset)

1. **Close everything:**
   - Close all terminals
   - Close IDE/VS Code
   - Close any Node processes

2. **Delete cache:**
   ```bash
   rmdir /s /q %AppData%\npm
   rmdir /s /q %AppData%\npm-cache
   ```

3. **Reinstall Node.js:**
   - Download from: https://nodejs.org (LTS version)
   - Uninstall current Node.js
   - Install fresh

4. **Reinstall backend:**
   ```bash
   cd backend
   rmdir /s /q node_modules
   del package-lock.json
   npm install
   npm start
   ```

---

## 📞 Getting Specific Help

When asking for help, provide:

1. Output of `npm -v`
2. Output of `npm install` (full log)
3. Exact error message
4. Which script/step failed
5. Operating system and terminal used

Example:
```
npm version: 9.6.4
Error: Cannot find module '@bajaj/shared'
After running: npm install
OS: Windows 11
Terminal: cmd
```

---

## 🎯 Expected Output (Success)

After npm install completes, you should see:
```
added XXX packages in XXX seconds
```

After npm start, you should see:
```
[backend] starting microservices...
[api-gateway] listening on port 5000
user-service listening on port 5002
auth-service listening on port 5003
dashboard-service listening on port 5004
report-service listening on port 5010
tracking-service listening on port 5007
survey-service listening on port 5006
lab-service listening on port 5005
distillery-service listening on port 5008
whatsapp-service listening on port 5009
```

No errors about missing modules!

---

## 📚 Related Guides

- `NPM_WORKSPACE_FIX.md` - Detailed npm workspace explanation
- `SETUP_INSTALLATION_GUIDE.md` - General setup guide
- `TROUBLESHOOTING_GUIDE.md` - Common issues

---

## Summary

| Try First | Then | Finally |
|-----------|------|---------|
| `install.bat` | `link.bat` | Manual reset |
| Automated | Manual linking | Hard reset |
| Takes ~5min | Takes ~2min | Takes ~10min |

**Most users succeed with Option 1.** Go with Option 2 only if Option 1 fails.

---

**Last Updated**: March 2026

