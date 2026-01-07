# Google Meet Integration Guide

## Current Status
❌ **Auto-generated links are PLACEHOLDERS and will NOT work!**

The current system generates fake Google Meet links like `https://meet.google.com/oxo-7xce-rpc`. These are just random codes and don't create actual meetings.

## What You Need for Real Google Meet Links

### Option 1: Manual Entry (Recommended for Now)
**Steps:**
1. Go to https://meet.google.com
2. Click "New meeting" → "Create a meeting for later"
3. Copy the meeting link (format: `https://meet.google.com/xxx-yyyy-zzz`)
4. Paste it in the admin form when creating/editing webinars

**Pros:**
- ✅ Simple, no API setup needed
- ✅ Works immediately
- ✅ Full control over meetings

**Cons:**
- ❌ Manual process
- ❌ Need to create meetings manually

### Option 2: Google Calendar API Integration (Advanced)

#### Requirements:
1. **Google Cloud Project**
   - Create project at https://console.cloud.google.com
   - Enable Google Calendar API
   - Enable Google Meet API (if available)

2. **OAuth 2.0 Credentials**
   - Create OAuth 2.0 Client ID
   - Download credentials JSON
   - Add to `.env`:
     ```
     GOOGLE_CLIENT_ID=your-client-id
     GOOGLE_CLIENT_SECRET=your-client-secret
     GOOGLE_REDIRECT_URI=http://localhost:4000/api/auth/google/callback
     ```

3. **Service Account (Alternative)**
   - Create Service Account
   - Download JSON key
   - Enable Domain-wide Delegation (if needed)
   - Add to `.env`:
     ```
     GOOGLE_SERVICE_ACCOUNT_KEY=path/to/service-account.json
     ```

4. **Install Packages**
   ```bash
   npm install googleapis
   ```

#### Implementation Steps:

1. **Create Google Calendar Event with Meet Link**
   ```javascript
   const { google } = require('googleapis');
   
   async function createGoogleMeetEvent(webinar) {
     const calendar = google.calendar({ version: 'v3', auth: oauth2Client });
     
     const event = {
       summary: webinar.title,
       description: webinar.description,
       start: {
         dateTime: webinar.scheduledAt,
         timeZone: 'Asia/Kolkata',
       },
       end: {
         dateTime: new Date(new Date(webinar.scheduledAt).getTime() + webinar.duration * 60000),
         timeZone: 'Asia/Kolkata',
       },
       conferenceData: {
         createRequest: {
           requestId: webinar.id,
           conferenceSolutionKey: { type: 'hangoutsMeet' },
         },
       },
     };
     
     const response = await calendar.events.insert({
       calendarId: 'primary',
       conferenceDataVersion: 1,
       resource: event,
     });
     
     return response.data.hangoutLink; // Real Google Meet link
   }
   ```

2. **Update Webinar Controller**
   - Replace `autoGenerateMeetLink()` with `createGoogleMeetEvent()`
   - Store the real meet link from Google Calendar

#### Pros:
- ✅ Automatic meeting creation
- ✅ Real Google Meet links
- ✅ Integrated with Google Calendar

#### Cons:
- ❌ Complex setup
- ❌ Requires Google Cloud account
- ❌ OAuth flow needed
- ❌ API rate limits

### Option 3: Google Meet API (If Available)

Google doesn't have a direct "Meet API" yet, but you can:
- Use Google Calendar API to create events with Meet links
- Use Google Workspace APIs (requires Workspace account)

## Recommendation

**For now, use Option 1 (Manual Entry):**
- Simple and works immediately
- No API setup required
- Full control

**For future, implement Option 2:**
- Better user experience
- Automatic meeting creation
- Integrated with calendar

## Current Implementation

The system currently:
1. ✅ Allows manual entry of real Google Meet links
2. ✅ Shows clear instructions in admin forms
3. ⚠️ Auto-generates placeholder links (won't work)
4. ✅ Warns admins about placeholder links

## Next Steps

1. **Immediate:** Use manual entry for all webinars
2. **Short-term:** Consider Google Calendar API integration
3. **Long-term:** Full Google Workspace integration








