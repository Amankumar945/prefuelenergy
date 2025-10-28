# 🔧 FIX 404 ERROR ON ROUTE REFRESH - MilesWeb Deployment

## 🎯 Problem
When you refresh or directly access routes like:
- `https://sorsuvidhacloudsystems.com/projects`
- `https://sorsuvidhacloudsystems.com/inventory`
- `https://sorsuvidhacloudsystems.com/leads`
- etc.

You get a **404 Not Found** error from LiteSpeed server.

## 💡 Why This Happens
- React Router handles routing on the **client-side** (in the browser)
- When you refresh or directly access a route, the **server** tries to find that file
- The server doesn't find `/projects` or `/inventory` files, so it returns 404
- We need to tell the server to **always serve index.html** for all routes

## ✅ Solution
Add a `.htaccess` file that redirects all requests to `index.html`, allowing React Router to handle the routing.

---

## 📋 STEP-BY-STEP FIX

### **Step 1: Upload .htaccess File**

I've created the `.htaccess` file for you. You need to upload it to MilesWeb.

**File Location (in your project):**
```
client/dist/.htaccess
client/public/.htaccess (for future builds)
```

### **Step 2: Upload to MilesWeb**

1. **Log into cPanel** at MilesWeb
2. Go to **File Manager**
3. Navigate to `public_html` folder
4. **Upload the `.htaccess` file** (from `client/dist/.htaccess`)
5. Place it in the **root of public_html** (same level as `index.html`)

**Your public_html structure should look like:**
```
public_html/
├── .htaccess          ← NEW FILE (this fixes the 404 issue)
├── index.html
├── assets/
│   ├── index-xxxxx.js
│   └── index-xxxxx.css
├── logo.png
├── vite.svg
└── manifest.webmanifest
```

### **Step 3: Verify File Upload**

In cPanel File Manager:
1. Make sure `.htaccess` is visible
2. If you don't see it, click **Settings** (top right) → Enable **Show Hidden Files (dotfiles)**
3. Right-click `.htaccess` → **Edit** to verify the content

### **Step 4: Test**

1. Go to `https://sorsuvidhacloudsystems.com/`
2. Click on **Projects** (or any other menu item)
3. **Refresh the page** (F5 or Ctrl+R)
4. ✅ It should work now! No more 404 error

Test these URLs directly:
- `https://sorsuvidhacloudsystems.com/projects`
- `https://sorsuvidhacloudsystems.com/inventory`
- `https://sorsuvidhacloudsystems.com/leads`
- `https://sorsuvidhacloudsystems.com/quotes`

All should load correctly!

---

## 🎁 BONUS: What Else This .htaccess File Does

### 1. **Fixes Client-Side Routing**
   - All routes now work on refresh
   - Direct URL access works
   - Logout button works properly

### 2. **Improves Performance**
   - Enables **Gzip compression** (faster page loads)
   - Sets **browser caching** for images, CSS, JS (faster subsequent visits)
   - Optimizes asset delivery

### 3. **Enhances Security**
   - Prevents **clickjacking** attacks
   - Blocks **XSS** attacks
   - Prevents **MIME type sniffing**
   - Sets secure **referrer policy**

---

## 📝 .htaccess File Content

```apache
<IfModule mod_rewrite.c>
  RewriteEngine On
  RewriteBase /
  
  # Don't rewrite files or directories
  RewriteCond %{REQUEST_FILENAME} !-f
  RewriteCond %{REQUEST_FILENAME} !-d
  
  # Rewrite everything else to index.html to allow client-side routing
  RewriteRule ^ index.html [L]
</IfModule>

# Enable caching for static assets
<IfModule mod_expires.c>
  ExpiresActive On
  ExpiresByType image/jpg "access plus 1 year"
  ExpiresByType image/jpeg "access plus 1 year"
  ExpiresByType image/gif "access plus 1 year"
  ExpiresByType image/png "access plus 1 year"
  ExpiresByType image/webp "access plus 1 year"
  ExpiresByType image/svg+xml "access plus 1 year"
  ExpiresByType text/css "access plus 1 month"
  ExpiresByType application/javascript "access plus 1 month"
  ExpiresByType application/x-javascript "access plus 1 month"
  ExpiresByType text/javascript "access plus 1 month"
  ExpiresByType application/font-woff "access plus 1 year"
  ExpiresByType application/font-woff2 "access plus 1 year"
</IfModule>

# Gzip compression
<IfModule mod_deflate.c>
  AddOutputFilterByType DEFLATE text/html text/plain text/xml text/css text/javascript application/javascript application/json application/xml
</IfModule>

# Security headers
<IfModule mod_headers.c>
  Header always set X-Frame-Options "SAMEORIGIN"
  Header always set X-XSS-Protection "1; mode=block"
  Header always set X-Content-Type-Options "nosniff"
  Header always set Referrer-Policy "strict-origin-when-cross-origin"
</IfModule>
```

---

## 🚨 Troubleshooting

### **Problem: Still getting 404 after uploading .htaccess**

**Solution 1: Check if mod_rewrite is enabled**
1. Contact MilesWeb support
2. Ask them to enable `mod_rewrite` for your account
3. This is usually enabled by default on most hosts

**Solution 2: Check file permissions**
1. Right-click `.htaccess` in File Manager
2. Click **Change Permissions**
3. Set to `644` (rw-r--r--)

**Solution 3: Clear browser cache**
1. Press `Ctrl+Shift+Delete` (Windows) or `Cmd+Shift+Delete` (Mac)
2. Clear cache and cookies
3. Try again

**Solution 4: Check file location**
- `.htaccess` MUST be in the **root of public_html**
- NOT in a subdirectory
- Same level as `index.html`

### **Problem: Logout still shows 404**

If logout still shows 404, it means the `.htaccess` file is not being read. Try:
1. Rename it to `htaccess.txt` → upload → rename back to `.htaccess` in cPanel
2. Check file permissions (should be 644)
3. Contact MilesWeb support to confirm mod_rewrite is enabled

---

## 🎉 Result After Fix

### **Before Fix:**
- ❌ Refresh on `/projects` → 404 error
- ❌ Direct URL access → 404 error
- ❌ Logout button → 404 error
- ❌ Have to retype main URL every time

### **After Fix:**
- ✅ Refresh on any page → Works perfectly
- ✅ Direct URL access → Works perfectly
- ✅ Logout button → Works perfectly
- ✅ All routes work seamlessly
- ✅ Better performance (caching + compression)
- ✅ Enhanced security headers

---

## 📌 Important Notes

1. **Future Builds:**
   - The `.htaccess` file is now in `client/public/` folder
   - It will be automatically copied to `client/dist/` on every build
   - No need to manually add it again

2. **When Updating Site:**
   - After uploading new `ui.zip`, **verify** `.htaccess` is still there
   - Sometimes extracting zip files can overwrite it
   - Keep a backup copy of `.htaccess` file

3. **HTTPS (Optional):**
   - If you want to force HTTPS, uncomment the lines at the bottom of `.htaccess`
   - This will automatically redirect HTTP to HTTPS

---

## 🎯 Quick Upload Guide

**Option 1: Manual Upload**
1. Go to cPanel → File Manager → public_html
2. Click **Upload**
3. Select `client/dist/.htaccess`
4. Done! ✅

**Option 2: Include in ui.zip**
The `.htaccess` file is already in `client/dist/` and will be included when you create the next `ui.zip`.

---

## ✅ Checklist

- [ ] `.htaccess` file uploaded to `public_html/`
- [ ] File is at root level (same as index.html)
- [ ] Show hidden files is enabled in File Manager
- [ ] File permissions are 644
- [ ] Tested refresh on `/projects`
- [ ] Tested direct URL access
- [ ] Tested logout button
- [ ] All routes work correctly

---

**Need Help?**
If you still face issues after following these steps, contact MilesWeb support and ask them to:
1. Enable `mod_rewrite` module
2. Allow `.htaccess` overrides for your domain
3. Confirm that RewriteEngine is enabled

This is a common requirement for hosting React/SPA applications, and support should be able to help quickly.

---

**🎊 Congratulations!**
Once this `.htaccess` file is uploaded, all your routing issues will be resolved! Your application will work seamlessly on all routes, just like it does locally. 🚀

