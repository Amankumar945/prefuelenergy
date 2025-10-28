# 🚀 Complete MilesWeb Deployment Guide - Prefuel Energy

## 📦 **Files You Have**

You should have these 2 zip files in your project folder:
1. **`ui.zip`** - For main domain (sorsuvidhacloudsystems.com)
2. **`server.zip`** - For API subdomain (api.sorsuvidhacloudsystems.com)

---

## 🎯 **PART 1: Deploy Main Website (UI)**

### **Step 1: Access cPanel File Manager**
1. Log in to MilesWeb cPanel
2. Find and click **"File Manager"** icon
3. You'll see a list of folders

### **Step 2: Go to Main Domain Folder**
1. Click on **"public_html"** folder (this is your main domain)
2. You should see something like: `sorsuvidhacloudsystems.com/public_html`

### **Step 3: Clean Up Old Files**
1. Select ALL files and folders inside `public_html`
2. Click **"Delete"** button at the top
3. Confirm deletion (this removes old broken files)

### **Step 4: Upload UI Files**
1. Click **"Upload"** button at the top of File Manager
2. Click **"Select File"** button
3. Find and select **`ui.zip`** from your computer
4. Wait for upload to complete (you'll see 100%)
5. Click **"Go Back to..."** link

### **Step 5: Extract UI Files**
1. You should see `ui.zip` in the file list
2. Right-click on **`ui.zip`**
3. Select **"Extract"**
4. Confirm extraction
5. Wait for it to finish
6. Delete **`ui.zip`** file (right-click → Delete)

### ✅ **Main Website Done!**
- Your website UI is now live at `https://sorsuvidhacloudsystems.com`
- You should be able to see the login page
- **BUT login won't work yet** - we need to setup the API next

---

## 🔧 **PART 2: Deploy API Server**

### **Step 1: Create/Access API Subdomain**

#### **If API subdomain doesn't exist:**
1. In cPanel, find **"Domains"** or **"Subdomains"** icon
2. Click **"Create A New Domain"** or **"Create Subdomain"**
3. Enter subdomain name: **`api`**
4. Select main domain: **`sorsuvidhacloudsystems.com`**
5. Document root will be: **`api.sorsuvidhacloudsystems.com`** (auto-filled)
6. Click **"Create"** or **"Add Subdomain"**

#### **If API subdomain already exists:**
1. Skip to next step

### **Step 2: Go to API Subdomain Folder**
1. Go back to **File Manager**
2. Click on **"api.sorsuvidhacloudsystems.com"** folder
3. Inside this folder, create a folder called **"app"** (if it doesn't exist)
   - Click **"+ Folder"** button
   - Name it: **`app`**
   - Click **"Create New Folder"**
4. Go inside the **"app"** folder

### **Step 3: Clean Up Old Server Files**
1. Select ALL files and folders inside the `app` folder
2. Click **"Delete"** button
3. Confirm deletion

### **Step 4: Upload Server Files**
1. Click **"Upload"** button
2. Click **"Select File"**
3. Find and select **`server.zip`** from your computer
4. Wait for upload to complete
5. Go back to File Manager

### **Step 5: Extract Server Files**
1. You should see `server.zip` in the file list
2. Right-click on **`server.zip`**
3. Select **"Extract"**
4. Confirm extraction
5. Delete **`server.zip`** file

### **Step 6: Create Environment File (.env)**
1. Inside the `app` folder, you should now see files like:
   - `index.js`
   - `package.json`
   - `storage/` folder
   - `ENV_INSTRUCTIONS.txt`
2. Click **"+ File"** button (top menu)
3. Name the new file: **`.env`**
4. Click **"Create New File"**
5. Right-click on **`.env"** file
6. Select **"Edit"**
7. Copy and paste this content:
```env
NODE_ENV=production
JWT_SECRET=prefuel_energy_production_secret_change_me_2025_strong_key
CORS_ORIGIN=https://sorsuvidhacloudsystems.com
```
8. Click **"Save Changes"** button (top right)
9. Click **"Close"** button

---

## ⚙️ **PART 3: Setup Node.js Application**

### **Step 1: Access Node.js App Manager**
1. Go back to cPanel home
2. Find and click **"Setup Node.js App"** or **"Node.js"** icon
3. You'll see a list of Node.js applications (might be empty)

### **Step 2: Delete Old Node.js App (if exists)**
1. If you see an existing app for `api.sorsuvidhacloudsystems.com`, click **"Delete"** or trash icon
2. Confirm deletion

### **Step 3: Create New Node.js Application**
1. Click **"Create Application"** button (usually blue button on the right)
2. Fill in the form:

   **Node.js version:**
   - Select latest version (18.x or 20.x or higher)
   
   **Application mode:**
   - Select **"Production"**
   
   **Application root:**
   - Type: **`api.sorsuvidhacloudsystems.com/app`**
   - ⚠️ **IMPORTANT:** Make sure this path is correct!
   - It should point to where your `index.js` file is located
   
   **Application URL:**
   - Type: **`api.sorsuvidhacloudsystems.com`**
   
   **Application startup file:**
   - Type: **`index.js`**
   
   **Passenger log file:** (optional, can leave empty)
   
3. Click **"Create"** button

### **Step 4: Install Dependencies**
1. After creating the app, you'll see a page with app details
2. Look for **"Run NPM Install"** button
3. Click **"Run NPM Install"** button
4. Wait for installation to complete (might take 1-2 minutes)
5. You'll see a success message like "Dependencies installed"

### **Step 5: Start the Application**
1. Look for **"Start Application"** or **"Restart"** button
2. Click it
3. Wait for the app to start
4. You should see status change to **"Running"** or green indicator

---

## 🧪 **PART 4: Test Your Deployment**

### **Test 1: Check Main Website**
1. Open browser
2. Go to: `https://sorsuvidhacloudsystems.com`
3. You should see login page
4. Check browser console (F12) - should be no errors

### **Test 2: Check API Server**
1. Open browser
2. Go to: `https://api.sorsuvidhacloudsystems.com`
3. You should see: `{"ok":true,"name":"Prefuel Energy API"}`
4. **If you see this, API is working!** ✅

### **Test 3: Try Login**
1. Go back to: `https://sorsuvidhacloudsystems.com`
2. Try to login with:
   - **Admin:** `admin@prefuel` / `Admin@12345`
   - **Staff:** `staff@prefuel` / `Staff@12345`
   - **HR:** `hr@prefuel` / `Hr@2025!`
3. You should be able to login successfully!

---

## 🐛 **Troubleshooting**

### **Problem 1: Login page loads but can't login**

**Solution A - Check API is running:**
1. Open browser console (F12)
2. Go to Network tab
3. Try to login
4. Look for `/api/auth/login` request
5. Check if it's going to `api.sorsuvidhacloudsystems.com`
6. If you see errors, check API server status in cPanel

**Solution B - Restart Node.js App:**
1. Go to cPanel → Setup Node.js App
2. Find your application
3. Click **"Stop App"** button
4. Wait 5 seconds
5. Click **"Start App"** button
6. Try login again

**Solution C - Check Environment Variables:**
1. Go to cPanel → Setup Node.js App
2. Click on your application
3. Scroll down to **"Environment Variables"** section
4. Add these if not present:
   - Name: `NODE_ENV`, Value: `production`
   - Name: `JWT_SECRET`, Value: `prefuel_energy_production_secret_2025`
   - Name: `CORS_ORIGIN`, Value: `https://sorsuvidhacloudsystems.com`
5. Click **"Save"**
6. Click **"Restart"** button

### **Problem 2: API returns 404 error**

**Solution:**
1. Check **Application root** path in Node.js App settings
2. It should be: `api.sorsuvidhacloudsystems.com/app`
3. NOT: `api.sorsuvidhacloudsystems.com` (without /app)
4. Click **"Edit"** button
5. Fix the path
6. Click **"Save"**
7. Click **"Restart"**

### **Problem 3: "Cannot find module" error**

**Solution:**
1. Go to Node.js App settings
2. Click **"Run NPM Install"** button again
3. Wait for completion
4. Click **"Restart"**

### **Problem 4: CORS error in browser console**

**Solution A - Check CORS_ORIGIN:**
1. Make sure `.env` file has correct domain:
   ```
   CORS_ORIGIN=https://sorsuvidhacloudsystems.com
   ```
2. No trailing slash `/` at the end
3. Make sure it's `https://` not `http://`

**Solution B - Add manual CORS header:**
1. Go to cPanel → File Manager
2. Navigate to `api.sorsuvidhacloudsystems.com/app`
3. Create file: `.htaccess`
4. Add content:
   ```
   Header set Access-Control-Allow-Origin "https://sorsuvidhacloudsystems.com"
   Header set Access-Control-Allow-Methods "GET, POST, PUT, DELETE, OPTIONS"
   Header set Access-Control-Allow-Headers "Content-Type, Authorization"
   ```
5. Save file
6. Restart Node.js app

### **Problem 5: App shows "stopped" status**

**Solution:**
1. Check Node.js error logs:
   - In Node.js App settings, look for **"Log"** or **"View Logs"**
   - Check for errors
2. Common fixes:
   - Run NPM Install again
   - Check Application startup file is `index.js`
   - Check Application root path is correct
   - Restart the app

---

## 📝 **Quick Reference**

### **Paths Summary:**
- **Main website files:** `sorsuvidhacloudsystems.com/public_html/`
- **API server files:** `api.sorsuvidhacloudsystems.com/app/`
- **Node.js App root:** `api.sorsuvidhacloudsystems.com/app`
- **Startup file:** `index.js`

### **URLs:**
- **Main website:** https://sorsuvidhacloudsystems.com
- **API base:** https://api.sorsuvidhacloudsystems.com
- **API health:** https://api.sorsuvidhacloudsystems.com/healthz

### **Demo Credentials:**
```
Admin:  admin@prefuel / Admin@12345
Staff:  staff@prefuel / Staff@12345
HR:     hr@prefuel    / Hr@2025!
```

---

## ✅ **Final Checklist**

Before you start deployment:
- [ ] Backed up old files (if any)
- [ ] Have `ui.zip` and `server.zip` ready

After UI deployment (Part 1):
- [ ] Old files deleted from public_html
- [ ] ui.zip uploaded and extracted
- [ ] Login page loads at main domain

After API deployment (Part 2):
- [ ] API subdomain exists
- [ ] /app folder created
- [ ] server.zip uploaded and extracted
- [ ] .env file created with correct content

After Node.js setup (Part 3):
- [ ] Node.js app created successfully
- [ ] Application root points to /app folder
- [ ] NPM install completed
- [ ] Application is running (green/started status)

After testing (Part 4):
- [ ] Main website loads
- [ ] API health check returns `{"ok":true}`
- [ ] Login works with demo credentials
- [ ] No errors in browser console

---

## 🎉 **Success!**

If all tests pass, your Prefuel Energy ERP is now **LIVE** on the internet!

**What's working:**
- ✅ Login page
- ✅ Authentication
- ✅ All dashboard features
- ✅ Real-time updates
- ✅ Leads, Quotes, Projects management
- ✅ Inventory, Procurement
- ✅ Invoices, Service tickets
- ✅ HR features
- ✅ Reports & analytics

**Access your live app:**
- Website: https://sorsuvidhacloudsystems.com
- API: https://api.sorsuvidhacloudsystems.com

---

## 📞 **Need Help?**

If you still face issues after following all troubleshooting steps:

1. **Check browser console** (F12) for specific error messages
2. **Check Node.js logs** in cPanel for server errors
3. **Verify all paths** are exactly as mentioned in this guide
4. **Double-check .env file** content matches exactly

---

**Document Version:** 1.0 - Fresh Start Edition  
**Created:** October 28, 2025  
**For:** MilesWeb cPanel Hosting  

---

**Good luck with your deployment! 🚀**

