# Prefuel Energy API - Deployment Package

##  Contents

- **server/** - Node.js backend API
- **client/dist/** - React UI build files

##  Deployment Instructions (MilesWeb cPanel)

### Step 1: Upload This Folder
1. Upload the entire contents of this folder to your Node.js app root directory
2. Example: /home/eogjftth/api/ (replace with your actual path)

### Step 2: Environment Setup
- The .env file is already created in server/.env
- Verify it contains:
  `
  JWT_SECRET=prefuel_energy_production_secret_change_me_in_production_2025
  CORS_ORIGIN=https://sorsuvidhacloudsystems.com
  NODE_ENV=production
  `

### Step 3: Install Dependencies
1. In MilesWeb cPanel, go to Node.js Apps
2. Find your app for api.sorsuvidhacloudsystems.com
3. Click Run NPM Install
4. Wait for installation to complete

### Step 4: Start the App
1. Click Restart App
2. Wait for status to show Running

### Step 5: Test
- Visit: https://api.sorsuvidhacloudsystems.com/healthz
- Should return: {" ok\:true,\name\:\Prefuel Energy API\}

## Important Files

- server/index.js - Main server file
- server/package.json - Dependencies
- server/.env - Environment variables
- server/data.json - Persistent data storage
- client/dist/ - Frontend build files

## Troubleshooting

- If app won't start: Check Node.js version (use latest available)
- If npm install fails: Try running it again
- Port issues: MilesWeb automatically assigns port, no action needed
