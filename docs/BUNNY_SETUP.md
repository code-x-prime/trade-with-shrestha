# Bunny.net Stream Video Integration

This guide explains how to set up and configure Bunny.net Stream video service for your LMS application.

## Prerequisites

1. A Bunny.net account (create one at [bunny.net](https://bunny.net))
2. A Stream Video Library created in your Bunny.net dashboard

## Step 1: Create a Video Library

1. Log in to your [Bunny.net Dashboard](https://dash.bunny.net/)
2. Navigate to **Stream** → **Video Libraries**
3. Click **Add Video Library**
4. Enter a name for your library (e.g., "LMS Videos")
5. Select your preferred region for video storage
6. Click **Add Video Library**

## Step 2: Get Your API Credentials

After creating the video library, you'll need three pieces of information:

### 1. Library ID

1. Go to your video library
2. Look at the URL - it will be something like: `https://dash.bunny.net/stream/xxxxxx`
3. The `xxxxxx` is your **Library ID**

### 2. API Key (Library API Key)

1. In your video library, go to **API**
2. Find the **API Key** field
3. Click the eye icon to reveal it or click **Copy**
4. This is your **BUNNY_API_KEY**

### 3. CDN Hostname

1. In your video library, go to **Linked Pull Zones**
2. Find the hostname (looks like `vz-xxxxxxxx-xxx.b-cdn.net`)
3. This is your **BUNNY_CDN_HOSTNAME**

## Step 3: Configure Environment Variables

### Server (.env)

Add the following to your server's `.env` file:

```env
# Bunny.net Stream Configuration
BUNNY_LIBRARY_ID=your-library-id
BUNNY_API_KEY=your-library-api-key
BUNNY_CDN_HOSTNAME=vz-xxxxxxxx-xxx.b-cdn.net
```

### Client (.env.local)

Add the following to your client's `.env.local` file:

```env
# Bunny.net (Public - safe to expose to client)
NEXT_PUBLIC_BUNNY_LIBRARY_ID=your-library-id
```

## Step 4: Run Database Migration

After updating the schema, run the Prisma migration:

```bash
cd server
npx prisma migrate dev --name add-bunny-video-fields
```

## Step 5: Restart Application

Restart both your server and client applications:

```bash
# Terminal 1 - Server
cd server
npm run dev

# Terminal 2 - Client
cd client
npm run dev
```

## Using the Media Library

### Uploading Videos

1. Go to Admin Panel → Media Library (`/admin/media`)
2. Click **Upload Video**
3. Choose one of two methods:
   - **File Upload**: Select a video file from your computer (max 500MB)
   - **From URL**: Paste a direct video URL (Bunny will download it)
4. Enter a title for the video
5. Click Upload

### Video Processing

After upload, Bunny.net will process and transcode your video. Status indicators:

| Status | Icon | Description |
|--------|------|-------------|
| Created | ⏳ | Entry created, waiting for file |
| Uploaded | 📤 | File received |
| Processing | 🔄 | Being processed |
| Transcoding | 🔄 | Creating quality variants |
| Ready | ✅ | Ready to play |
| Error | ❌ | Processing failed |

### Adding Videos to Chapters

1. Go to Admin → Courses → Edit Course → Manage Sessions
2. Click **Add Chapter** or edit an existing chapter
3. Select **Video Source**: "Bunny.net Video"
4. Click **Select Video from Library**
5. Choose a ready video from the modal
6. Save the chapter

## Troubleshooting

### Bunny.net Not Configured Error

If you see "Bunny.net is not configured":

1. Verify all three environment variables are set correctly
2. Restart the server after adding variables
3. Check for typos in the variable names

### Videos Not Playing

1. Ensure the video status is "Ready" (green checkmark)
2. Verify `NEXT_PUBLIC_BUNNY_LIBRARY_ID` is set in client `.env.local`
3. Check browser console for errors

### Upload Failures

1. Check file size (max 500MB per file)
2. Verify the API key has write permissions
3. Check Bunny.net dashboard for any account issues

## Video Status Codes Reference

| Code | Status |
|------|--------|
| 0 | Created |
| 1 | Uploaded |
| 2 | Processing |
| 3 | Transcoding |
| 4 | Finished (Ready) |
| 5 | Error |
| 6 | Upload Failed |

## Support

- [Bunny.net Documentation](https://docs.bunny.net/docs/stream)
- [Stream API Reference](https://docs.bunny.net/reference/video-library-api)
