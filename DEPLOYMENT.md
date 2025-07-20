# Deployment Guide: GitHub Pages + Vercel

This guide will help you deploy your Portfolio Sync app so it's always accessible and automatically updated.

## 🎯 Architecture Overview
- **Frontend**: GitHub Pages (free, automatic deployment)
- **Backend**: Vercel Serverless Functions (free tier)
- **Data**: Google Sheets (your existing setup)

## 📋 Step-by-Step Deployment

### Step 1: Deploy Backend to Vercel

1. **Create Vercel Account**
   - Go to [vercel.com](https://vercel.com)
   - Sign up with your GitHub account

2. **Import Your Repository**
   - Click "New Project"
   - Import your `portfolio-sync` repository
   - Vercel will automatically detect the `vercel.json` configuration

3. **Set Environment Variables**
   - In Vercel dashboard, go to Settings → Environment Variables
   - Add these variables:
     ```
     SHEET_ID = "your_sheet_id""
     ```

4. **Upload Google Credentials**
   
   **Option A: Base64 Method (Recommended for Vercel)**
   - On Windows (PowerShell):
     ```powershell
     $jsonContent = Get-Content "credentials\google_crendtials.json" -Raw
     $bytes = [System.Text.Encoding]::UTF8.GetBytes($jsonContent)
     $base64 = [System.Convert]::ToBase64String($bytes)
     $base64 | Set-Clipboard
     ```
   - In Vercel, add environment variable:
     ```
     GOOGLE_CREDENTIALS_BASE64 = [paste the base64 string]
     ```
   
   **Option B: Direct JSON Method**
   - Copy contents of `credentials/google_crendtials.json`
   - In Vercel, add environment variable:
     ```
     GOOGLE_CREDENTIALS = [paste your JSON here as one line]
     ```

5. **Deploy**
   - Click "Deploy"
   - Wait for deployment to complete
   - Copy your API URL (e.g., `https://portfolio-sync-api.vercel.app`)

### Step 2: Update Frontend Configuration

1. **Update API URL**
   - Edit `src/frontend/static/js/api.js`
   - Replace line 4 with your Vercel URL:
     ```javascript
     : 'https://your-actual-vercel-url.vercel.app/api',
     ```

2. **Commit Changes**
   ```bash
   git add .
   git commit -m "Update API URL for production"
   git push origin main
   ```

### Step 3: Setup GitHub Repository Secrets

1. **Add Repository Secrets**
   - Go to your GitHub repository
   - Click Settings → Secrets and variables → Actions
   - Click "New repository secret"
   - Add:
     ```
     Name: GOOGLE_CREDENTIALS_BASE64
     Value: [same base64 string from Step 1]
     ```

### Step 4: Enable GitHub Pages

1. **Go to Repository Settings**
   - Navigate to your GitHub repository
   - Click Settings → Pages (in left sidebar)

2. **Configure GitHub Actions**
   - Set Source to "GitHub Actions"
   - The workflow file is already created in `.github/workflows/deploy.yml`

3. **Automatic Deployment**
   - GitHub Actions will automatically deploy when you push to main
   - Your site will be available at: `https://yourusername.github.io/portfolio-sync`

## ✅ Verification

### Test Your Deployment

1. **Check Backend**
   - Visit: `https://your-vercel-url.vercel.app/api/portfolio/summary`
   - Should return JSON with your portfolio data

2. **Check Frontend**
   - Visit: `https://yourusername.github.io/portfolio-sync`
   - Should display your portfolio with real data

## 🔄 How Auto-Updates Work

### Automatic Updates:
- **Market Data**: Updates every 5 minutes automatically
- **Google Sheets**: Reflects changes immediately when you update your sheet
- **Code Changes**: Auto-deployed when you push to GitHub

### Manual Updates:
- **Portfolio Holdings**: Update your Google Sheet
- **Code Changes**: Push to GitHub (triggers auto-deployment)

## 🎉 You're Done!

Your portfolio tracker is now:
- ✅ **Always accessible** via GitHub Pages URL
- ✅ **Automatically updated** with real market data
- ✅ **Serverless backend** that scales automatically
- ✅ **Free hosting** on both platforms

## 💡 Resume Enhancement

You can now add to your resume:
```
"Deployed production portfolio tracker to GitHub Pages with serverless backend, 
serving real-time market data to 24/7 accessible web application"
```

## 🚨 Troubleshooting

**Backend not working?**
- Check Vercel deployment logs
- Verify environment variables are set
- Ensure Google credentials are valid

**Frontend not updating?**
- Check GitHub Actions logs
- Verify API URL is correct
- Check browser console for errors

**Charts not showing?**
- Verify Chart.js is loading
- Check browser console for JavaScript errors
- Ensure API is returning position data

## 🔐 Security Notes

- Google credentials are stored securely in Vercel environment variables
- CORS is configured to allow your GitHub Pages domain
- No sensitive data is exposed in the frontend code

Your portfolio tracker is now enterprise-grade and production-ready! 🚀
