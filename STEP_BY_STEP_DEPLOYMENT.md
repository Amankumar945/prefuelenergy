# 🚀 STEP-BY-STEP DEPLOYMENT GUIDE
## Prefuel Energy - MilesWeb Hosting

---

## ✅ **PRE-DEPLOYMENT VERIFICATION COMPLETE**

All files have been checked and verified:
- ✅ **PORT Configuration:** Server uses `process.env.PORT` (MilesWeb will set automatically)
- ✅ **Client API Detection:** Automatically finds `api.sorsuvidhacloudsystems.com`
- ✅ **CORS Setup:** Simple and working, allows all origins
- ✅ **No Hardcoded Ports:** Only uses `:5000` for localhost development
- ✅ **Package.json:** All dependencies correct, proper start script
- ✅ **Build Files:** Fresh production build with all fixes

---

## 📦 **FILES YOU HAVE (2 ZIP FILES)**

1. **`ui.zip`** (7 files total)
   - index.html
   - assets/ (CSS + JS)
   - logo.png
   - manifest.webmanifest
   - sw.js
   - vite.svg

2. **`server.zip`** (Contains)
   - index.js (main server file - 1530 lines)
   - package.json
   - package-lock.json
   - storage/index.js
   - data.json
   - backups/
   - ENV_INSTRUCTIONS.txt
   - README.env-example.txt
   - **Note:** NO node_modules (MilesWeb installs them)

---

# 🎯 **DEPLOYMENT PROCESS** (4 MAIN PARTS)

---

## **PART 1: DEPLOY WEBSITE UI** (10 minutes)

### **Step 1.1: Login to MilesWeb cPanel**
1. Open your browser
2. Go to MilesWeb cPanel login page
3. Enter your username and password
4. Click **Login**

### **Step 1.2: Open File Manager**
1. Look for **"File Manager"** icon on cPanel home
2. Click on it
3. A new tab will open with your files

### **Step 1.3: Navigate to Main Domain Folder**
1. Look for **"public_html"** folder in the left sidebar
2. Click on **"public_html"**
3. You'll see all files/folders for your main website

### **Step 1.4: Delete Old Website Files**
1. Click the checkbox at the top to **select all** files
2. Click the **"Delete"** button (trash icon) in the top toolbar
3. Confirm when asked: Click **"Confirm"** or **"Yes"**
4. Wait for files to be deleted
5. The folder should now be empty

### **Step 1.5: Upload ui.zip**
1. Click **"Upload"** button in the top toolbar
2. A new page opens
3. Click **"Select File"** button
4. Navigate to your project folder on your computer
5. Select **"ui.zip"** file
6. Click **"Open"**
7. Upload will start automatically
8. Wait until you see **"100%"** or **"Complete"**
9. Click **"Go Back to /public_html"** link

### **Step 1.6: Extract ui.zip**
1. You should see **"ui.zip"** file in the list
2. **Right-click** on **"ui.zip"**
3. Select **"Extract"** from the menu
4. A popup appears
5. Make sure extraction path is: `/public_html`
6. Click **"Extract File(s)"**
7. Wait for extraction to complete
8. Click **"Close"** when done

### **Step 1.7: Clean Up**
1. You should now see these files:
   - index.html
   - assets/ (folder)
   - logo.png
   - manifest.webmanifest
   - sw.js
   - vite.svg
   - ui.zip (still there)
2. **Right-click** on **"ui.zip"**
3. Select **"Delete"**
4. Click **"Confirm"**

### ✅ **Part 1 Complete! Test:**
1. Open new browser tab
2. Go to: `https://sorsuvidhacloudsystems.com`
3. You should see the **login page**
4. **Don't try to login yet** - API is not setup

---

## **PART 2: SETUP API SUBDOMAIN** (10 minutes)

### **Step 2.1: Check if API Subdomain Exists**
1. Go back to cPanel home
2. Find **"Domains"** or **"Subdomains"** section
3. Click on it
4. Look for **"api.sorsuvidhacloudsystems.com"**

**If you DON'T see it:**
- Continue to Step 2.2

**If you DO see it:**
- Skip to Step 2.3

### **Step 2.2: Create API Subdomain** (if needed)
1. Click **"Create A New Domain"** or **"Create Subdomain"**
2. Fill in the form:
   - **Subdomain:** `api`
   - **Domain:** `sorsuvidhacloudsystems.com` (select from dropdown)
   - **Document Root:** Will auto-fill as `api.sorsuvidhacloudsystems.com`
3. Click **"Create"** or **"Add"**
4. Wait for success message
5. Click **"Go Back"**

### **Step 2.3: Navigate to API Folder**
1. Go back to **File Manager**
2. Click on **"Home"** icon or root folder icon
3. Look for folder named **"api.sorsuvidhacloudsystems.com"**
4. Click on it to open

### **Step 2.4: Create "app" Folder**
1. Inside `api.sorsuvidhacloudsystems.com` folder
2. Click **"+ Folder"** button (top toolbar)
3. Name: **`app`**
4. Click **"Create New Folder"**
5. Click on the **"app"** folder to open it

### **Step 2.5: Clean "app" Folder** (if it has files)
1. If you see any files inside `app` folder:
   - Select all (checkbox at top)
   - Click **"Delete"**
   - Click **"Confirm"**
2. Make sure `app` folder is empty

### **Step 2.6: Upload server.zip**
1. Make sure you're inside: `api.sorsuvidhacloudsystems.com/app/`
2. Click **"Upload"** button
3. Click **"Select File"**
4. Find and select **"server.zip"** from your computer
5. Click **"Open"**
6. Wait for upload to reach 100%
7. Click **"Go Back"** link

### **Step 2.7: Extract server.zip**
1. You should see **"server.zip"** in the file list
2. **Right-click** on **"server.zip"**
3. Select **"Extract"**
4. Make sure path is: `/api.sorsuvidhacloudsystems.com/app`
5. Click **"Extract File(s)"**
6. Wait for completion
7. Click **"Close"**

### **Step 2.8: Verify Extraction**
1. You should now see these files/folders:
   - index.js
   - package.json
   - package-lock.json
   - storage/ (folder)
   - data.json
   - backups/ (folder)
   - ENV_INSTRUCTIONS.txt
   - README.env-example.txt
   - server.zip (still there)
2. **Delete server.zip:**
   - Right-click → Delete → Confirm

### **Step 2.9: Create .env File**
1. Click **"+ File"** button (top toolbar)
2. New file name: **`.env`** (with the dot at the start)
3. Click **"Create New File"**
4. **Right-click** on **".env"** file
5. Select **"Edit"**
6. Copy and paste this EXACT content:

```
NODE_ENV=production
JWT_SECRET=prefuel_energy_strong_secret_2025_change_this
CORS_ORIGIN=https://sorsuvidhacloudsystems.com
```

7. Click **"Save Changes"** button (top right corner)
8. Click **"Close"** button

### ✅ **Part 2 Complete!**
Your file structure should look like:
```
api.sorsuvidhacloudsystems.com/
  └── app/
      ├── index.js
      ├── package.json
      ├── storage/
      ├── data.json
      ├── backups/
      ├── .env ✓
      └── other files
```

---

## **PART 3: CREATE NODE.JS APPLICATION** (5 minutes)

### **Step 3.1: Open Node.js App Manager**
1. Go back to **cPanel Home**
2. Scroll down to find **"Software"** or **"Development"** section
3. Look for **"Setup Node.js App"** or **"Node.js"** icon
4. Click on it

### **Step 3.2: Delete Old App** (if exists)
1. Look at the list of applications
2. If you see an app for **"api.sorsuvidhacloudsystems.com"**:
   - Click **"Delete"** button (trash icon)
   - Click **"Yes"** to confirm
3. If list is empty, continue to next step

### **Step 3.3: Create New Node.js Application**
1. Click **"Create Application"** button (usually blue, top-right)
2. Fill in the form **CAREFULLY**:

   **① Node.js version:**
   - Select: **18.x** or **20.x** or **latest available**
   
   **② Application mode:**
   - Select: **Production**
   
   **③ Application root:**
   - Type EXACTLY: **`api.sorsuvidhacloudsystems.com/app`**
   - ⚠️ **CRITICAL:** This path must be exact!
   - ⚠️ **Must have /app at the end**
   
   **④ Application URL:**
   - Type: **`api.sorsuvidhacloudsystems.com`**
   
   **⑤ Application startup file:**
   - Type: **`index.js`**
   
   **⑥ Passenger log file:** (optional)
   - Leave empty or type: **`logs/node.log`**

3. **Double-check all fields** before proceeding!
4. Click **"Create"** button

### **Step 3.4: Wait for Creation**
1. You'll see a loading indicator
2. Wait 10-30 seconds
3. Page will refresh showing app details

### **Step 3.5: Install Dependencies**
1. Scroll down on the app details page
2. Look for **"Run NPM Install"** button
3. Click **"Run NPM Install"**
4. A popup or loading indicator appears
5. **WAIT!** This takes **1-3 minutes**
6. You'll see output showing packages being installed
7. Wait for **"Dependencies installed successfully"** message

### **Step 3.6: Start the Application**
1. Look for **"Start App"** or **"Restart"** button
2. Click it
3. Wait 5-10 seconds
4. Status should change to:
   - **"Running"** with green indicator, OR
   - **"Started"** status

### **Step 3.7: Verify Application Started**
1. Look at the application status
2. Should show: **Status: Running** (green)
3. If it shows **"Stopped"** (red):
   - Click **"Start App"** again
   - Wait 10 seconds
   - Check status again

### ✅ **Part 3 Complete!**
Your Node.js application is now running!

---

## **PART 4: TESTING & VERIFICATION** (5 minutes)

### **Test 1: Check API Server is Live**
1. Open a new browser tab
2. Go to: **`https://api.sorsuvidhacloudsystems.com`**
3. You should see:
   ```json
   {"ok":true,"name":"Prefuel Energy API"}
   ```
4. ✅ **If you see this → API is working!**
5. ❌ **If you see error → Go to troubleshooting**

### **Test 2: Check API Health Endpoint**
1. Go to: **`https://api.sorsuvidhacloudsystems.com/healthz`**
2. You should see:
   ```json
   {"ok":true,"status":"healthy"}
   ```
3. ✅ **If you see this → API is healthy!**

### **Test 3: Try Login**
1. Go to: **`https://sorsuvidhacloudsystems.com`**
2. You should see the login page
3. Try logging in with:
   
   **Admin Login:**
   - Email: `admin@prefuel`
   - Password: `Admin@12345`
   
   **OR Staff Login:**
   - Email: `staff@prefuel`
   - Password: `Staff@12345`
   
   **OR HR Login:**
   - Email: `hr@prefuel`
   - Password: `Hr@2025!`

4. Click **Login** button
5. ✅ **If you see dashboard → SUCCESS!**
6. ❌ **If error → Go to troubleshooting**

### **Test 4: Check Browser Console**
1. Press **F12** to open Developer Tools
2. Go to **"Console"** tab
3. Look for errors (red text)
4. ✅ **No errors → All good!**
5. ⚠️ **If errors → Note the error message and go to troubleshooting**

### **Test 5: Try Creating a Lead**
1. Click on **"Leads"** menu
2. Fill in the form:
   - Name: Test Lead
   - Phone: 9876543210
   - Email: test@example.com
3. Click **"Create Lead"**
4. ✅ **If lead appears in list → Everything working!**

---

## 🐛 **TROUBLESHOOTING GUIDE**

### **Problem A: API Shows 404 Error**

**Symptoms:**
- `https://api.sorsuvidhacloudsystems.com` shows 404
- or shows cPanel default page

**Solution:**
1. Go to cPanel → Setup Node.js App
2. Click on your application
3. Check **"Application root"** field
4. Must be: `api.sorsuvidhacloudsystems.com/app`
5. If wrong:
   - Click **"Edit"** or **"Stop App"**
   - Fix the path
   - Click **"Save"**
   - Click **"Run NPM Install"** again
   - Click **"Start App"**

---

### **Problem B: Login Not Working**

**Symptoms:**
- Can see login page
- But login button does nothing or shows error

**Solution 1 - Check Browser Console:**
1. Press **F12**
2. Go to **"Network"** tab
3. Try to login
4. Look for request to `/api/auth/login`
5. Check if it's going to correct URL:
   - Should be: `https://api.sorsuvidhacloudsystems.com/api/auth/login`
   - If going to `localhost:5000` → Clear browser cache (Ctrl+Shift+Delete)

**Solution 2 - Restart Node.js App:**
1. Go to cPanel → Setup Node.js App
2. Click on your application
3. Click **"Stop App"**
4. Wait 10 seconds
5. Click **"Start App"**
6. Wait 10 seconds
7. Try login again

**Solution 3 - Check .env File:**
1. Go to File Manager
2. Navigate to: `api.sorsuvidhacloudsystems.com/app/`
3. Right-click on **".env"**
4. Select **"Edit"**
5. Verify content is EXACTLY:
```
NODE_ENV=production
JWT_SECRET=prefuel_energy_strong_secret_2025_change_this
CORS_ORIGIN=https://sorsuvidhacloudsystems.com
```
6. Save if you made changes
7. Go to Node.js App → Restart

---

### **Problem C: App Shows "Stopped" Status**

**Symptoms:**
- Node.js app status is red/stopped
- Won't start

**Solution 1 - Check Logs:**
1. In Node.js App interface
2. Look for **"Logs"** or **"View Logs"** button
3. Click it
4. Read the error message
5. Common errors:
   - **"Cannot find module"** → Run NPM Install again
   - **"Port already in use"** → Stop and start app
   - **"ENOENT"** → Check Application root path

**Solution 2 - Reinstall Dependencies:**
1. Click **"Stop App"**
2. Click **"Run NPM Install"** again
3. Wait for completion
4. Click **"Start App"**

**Solution 3 - Verify Files:**
1. Go to File Manager
2. Check: `api.sorsuvidhacloudsystems.com/app/`
3. Must have these files:
   - index.js ✓
   - package.json ✓
   - .env ✓
   - storage/ folder ✓
4. If missing, re-upload and extract server.zip

---

### **Problem D: CORS Error in Browser Console**

**Symptoms:**
- Error message contains: "CORS", "Access-Control-Allow-Origin", or "blocked by CORS policy"

**Solution 1 - Check CORS_ORIGIN in .env:**
1. File Manager → `api.sorsuvidhacloudsystems.com/app/.env`
2. Edit the file
3. Make sure line says: `CORS_ORIGIN=https://sorsuvidhacloudsystems.com`
4. **Important:**
   - Must be `https://` (not `http://`)
   - NO trailing slash `/` at end
   - Exact domain name
5. Save
6. Restart Node.js app

**Solution 2 - Clear Browser Cache:**
1. Press **Ctrl+Shift+Delete**
2. Select **"Cached images and files"**
3. Click **"Clear data"**
4. Close and reopen browser
5. Try again

---

### **Problem E: Database/Data Not Saving**

**Symptoms:**
- Can login but changes don't persist
- Data disappears after refresh

**Solution:**
1. Go to File Manager
2. Navigate to: `api.sorsuvidhacloudsystems.com/app/`
3. Check if **"data.json"** file exists
4. If missing:
   - Click **"+ File"**
   - Name: `data.json`
   - Create it
   - Edit it and put: `{}`
   - Save
5. Check file permissions:
   - Right-click on `data.json`
   - Select **"Permissions"** or **"Change Permissions"**
   - Set to: **644** or **666** (read/write)
   - Click **"Change Permissions"**
6. Restart Node.js app

---

## 📞 **STILL HAVING ISSUES?**

### **Collect Information:**
1. **Browser Console Errors:**
   - Press F12 → Console tab
   - Copy any red error messages

2. **Node.js Logs:**
   - cPanel → Setup Node.js App
   - Click your app → View Logs
   - Copy error messages

3. **What You See:**
   - Can you see login page? (Yes/No)
   - Can you access API? (Yes/No)
   - What error message appears?

### **Common Checks:**
- [ ] Main website loads at `https://sorsuvidhacloudsystems.com` ✓
- [ ] API responds at `https://api.sorsuvidhacloudsystems.com` ✓
- [ ] Node.js app status shows "Running" ✓
- [ ] .env file exists and has correct content ✓
- [ ] Application root is `api.sorsuvidhacloudsystems.com/app` ✓
- [ ] NPM install completed successfully ✓

---

## ✅ **SUCCESS CHECKLIST**

After deployment, you should have:

**✓ Main Website:**
- Login page loads at `https://sorsuvidhacloudsystems.com`
- No console errors (F12 → Console)
- Can login with demo credentials
- Dashboard loads after login

**✓ API Server:**
- API responds at `https://api.sorsuvidhacloudsystems.com`
- Health check works: `/healthz`
- Node.js app shows "Running" status
- Can make API calls from website

**✓ Full Features Working:**
- Can create/edit leads
- Can create quotes
- Can view projects
- Can manage inventory
- Real-time updates work
- All menu items accessible

---

## 🎉 **DEPLOYMENT COMPLETE!**

**Your Prefuel Energy ERP is now LIVE!**

**Access your app:**
- Website: https://sorsuvidhacloudsystems.com
- API: https://api.sorsuvidhacloudsystems.com

**Demo Logins:**
```
Admin:  admin@prefuel / Admin@12345
Staff:  staff@prefuel / Staff@12345
HR:     hr@prefuel    / Hr@2025!
```

**What's Working:**
- ✅ User authentication & authorization
- ✅ Dashboard with real-time stats
- ✅ Lead management (create, edit, delete)
- ✅ Quote creation & conversion to projects
- ✅ Project tracking with milestones
- ✅ Inventory management
- ✅ Purchase orders & procurement
- ✅ Invoice generation with GST
- ✅ Service tickets
- ✅ HR features (attendance, leave)
- ✅ Announcements
- ✅ Reports & analytics
- ✅ Real-time updates via SSE
- ✅ Offline mode with sync

---

**Document Version:** 2.0 - Comprehensive Edition  
**Created:** October 28, 2025  
**Verified:** All configurations checked for MilesWeb  
**Status:** Production Ready ✅

---

**Happy Deploying! 🚀**

