# Environment Variables Setup Guide

## Important Notes

1. **File Name Must Be `.env.local`** (not `.env` or `.env.development`)
2. **Must Restart Dev Server** after adding/changing environment variables
3. **Location**: Create `.env.local` file in the `client` folder (same level as `package.json`)

## Steps to Setup

### 1. Create `.env.local` file

In the `client` folder, create a file named `.env.local` (not `.env`)

### 2. Add Your Environment Variables

Copy this template and fill in your values:

```env
# =============================================
# API CONFIGURATION
# =============================================
NEXT_PUBLIC_API_URL=http://localhost:4000/api
NEXT_PUBLIC_API_TIMEOUT=30000

# =============================================
# RAZORPAY PAYMENT GATEWAY (PUBLIC KEY)
# =============================================
NEXT_PUBLIC_RAZORPAY_KEY_ID=rzp_test_JrRiSY1nXRJNcx

# =============================================
# GOOGLE OAUTH (PUBLIC CLIENT ID)
# =============================================
# Get this from: https://console.cloud.google.com/apis/credentials
# Application type: Web application
# Authorized JavaScript origins: http://localhost:3000
NEXT_PUBLIC_GOOGLE_CLIENT_ID=your-actual-google-client-id-here

# =============================================
# CLOUDFLARE R2 PUBLIC URL
# =============================================
NEXT_PUBLIC_CDN_URL=https://7aa78f39585a05d49b581467ce1450c8.r2.cloudflarestorage.com/trade-with-shrestha
NEXT_PUBLIC_R2_PUBLIC_URL=https://pub-67f953912205445f932ab892164f22e5.r2.dev

# =============================================
# APP CONFIGURATION
# =============================================
NEXT_PUBLIC_APP_NAME=Shrestha Academy
NEXT_PUBLIC_APP_URL=http://localhost:3000

# =============================================
# ENVIRONMENT
# =============================================
NODE_ENV=development
```

### 3. Get Google Client ID

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing one
3. Go to **APIs & Services** → **Credentials**
4. Click **Create Credentials** → **OAuth client ID**
5. Select **Web application**
6. Add **Authorized JavaScript origins**: `http://localhost:3000`
7. Add **Authorized redirect URIs**: `http://localhost:3000/auth`
8. Copy the **Client ID** and paste it in `.env.local` as `NEXT_PUBLIC_GOOGLE_CLIENT_ID`

### 4. Restart Dev Server

**IMPORTANT**: After creating/updating `.env.local`, you MUST restart the dev server:

```bash
# Stop the current server (Ctrl+C)
# Then restart:
npm run dev
```

### 5. Verify

After restarting, check the browser console. You should see:
- No errors about Google Client ID
- Google Sign-In button should appear (if Client ID is set)

## Troubleshooting

### Issue: Still showing "Google Client ID not configured"

**Solutions:**
1. ✅ Check file name is exactly `.env.local` (not `.env` or `.env.development`)
2. ✅ Check file is in `client` folder (same level as `package.json`)
3. ✅ Check variable name is exactly `NEXT_PUBLIC_GOOGLE_CLIENT_ID` (case-sensitive)
4. ✅ Check there are no spaces around `=` sign: `NEXT_PUBLIC_GOOGLE_CLIENT_ID=value`
5. ✅ **RESTART the dev server** after making changes
6. ✅ Check value is not `your-google-client-id` (use actual Client ID)
7. ✅ Check there are no quotes around the value (unless needed)

### Issue: Google button not showing

**This is OK!** If Google Client ID is not configured, the Google Sign-In button will be hidden automatically. This is intentional - the app will work fine without Google OAuth.

### Quick Test

To verify your env variables are loading:

1. Add this temporarily in your component:
```jsx
console.log('Google Client ID:', process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID);
```

2. Check browser console after restarting server
3. You should see your Client ID (or undefined if not set)

## File Structure

```
client/
├── .env.local          ← Create this file here
├── package.json
├── src/
└── ...
```

## Notes

- `.env.local` is gitignored (won't be committed to git)
- All `NEXT_PUBLIC_*` variables are exposed to the browser
- Never commit `.env.local` with real credentials
- Use `.env.local.example` for sharing template

