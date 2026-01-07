# Video Migration Guide

This guide explains how to migrate existing YouTube-based courses to use Bunny.net videos.

## Overview

The LMS now supports two video sources:
1. **YouTube URLs** (legacy) - Original method, still fully supported
2. **Bunny.net Videos** (new) - Self-hosted streaming with better control

## Migration Strategy

### Option 1: Gradual Migration (Recommended)

Keep existing courses on YouTube and use Bunny.net for new content only.

**Pros:**
- No disruption to existing courses
- Can migrate courses one at a time
- Easy rollback if issues occur

**Implementation:**
1. Upload new videos to Bunny.net via Media Library
2. When editing chapters, switch from "YouTube URL" to "Bunny.net Video"
3. Select the uploaded video from the library

### Option 2: Full Migration

Migrate all existing courses to Bunny.net.

**Process for each chapter:**

1. Download the video from YouTube (use a tool like youtube-dl or yt-dlp)
2. Upload to Bunny.net Media Library
3. Wait for processing to complete (status: Ready)
4. Edit the chapter and switch to Bunny.net video
5. Verify playback works correctly

## Step-by-Step Migration

### 1. Identify Chapters to Migrate

Run this query to find all chapters with YouTube URLs:

```sql
SELECT c.id, c.title, c.videoUrl, s.title as sessionTitle, co.title as courseTitle
FROM CourseChapter c
JOIN CourseSession s ON c.sessionId = s.id
JOIN Course co ON s.courseId = co.id
WHERE c.videoUrl LIKE '%youtube%' OR c.videoUrl LIKE '%youtu.be%';
```

### 2. Download Videos

Use yt-dlp to download videos:

```bash
# Install yt-dlp
pip install yt-dlp

# Download a single video
yt-dlp -f "best[height<=1080]" -o "%(title)s.%(ext)s" "https://youtube.com/watch?v=..."

# Download with specific format
yt-dlp -f "bestvideo[height<=1080]+bestaudio" --merge-output-format mp4 "URL"
```

### 3. Upload to Bunny.net

**Via Admin Panel:**
1. Go to Admin → Media Library
2. Click Upload Video
3. Select the downloaded file
4. Wait for processing

**Via API (bulk upload):**

```javascript
const axios = require('axios');
const fs = require('fs');

const BUNNY_API_KEY = 'your-api-key';
const LIBRARY_ID = 'your-library-id';

async function uploadVideo(filePath, title) {
  // Create video entry
  const createResponse = await axios.post(
    `https://video.bunnycdn.com/library/${LIBRARY_ID}/videos`,
    { title },
    { headers: { AccessKey: BUNNY_API_KEY } }
  );

  const videoId = createResponse.data.guid;

  // Upload file
  const fileBuffer = fs.readFileSync(filePath);
  await axios.put(
    `https://video.bunnycdn.com/library/${LIBRARY_ID}/videos/${videoId}`,
    fileBuffer,
    {
      headers: {
        'AccessKey': BUNNY_API_KEY,
        'Content-Type': 'application/octet-stream',
      },
    }
  );

  return videoId;
}
```

### 4. Update Chapter Records

After uploading and video is ready, update the chapter:

**Via Admin Panel:**
1. Go to course → Manage Sessions
2. Edit the chapter
3. Switch Video Source to "Bunny.net Video"
4. Select the uploaded video
5. Save

**Via Database (bulk):**

```sql
-- Update a single chapter
UPDATE CourseChapter
SET bunnyVideoId = 'new-video-id',
    videoDuration = 600,  -- duration in seconds
    videoStatus = 4       -- 4 = Ready
WHERE id = 'chapter-id';

-- The videoUrl field is kept for backward compatibility
```

### 5. Verify Migration

After migrating, verify:
- [ ] Video plays correctly in the learn page
- [ ] Progress tracking works (manual mark complete)
- [ ] Completion badges show correctly
- [ ] Course progress updates properly

## Rollback Plan

If issues occur with a migrated chapter:

1. Edit the chapter
2. Switch Video Source back to "YouTube URL"
3. Enter the original YouTube URL
4. Save

The `videoUrl` field is preserved during migration, so rollback is always possible.

## Data Model Changes

The `CourseChapter` model now has these video-related fields:

```prisma
model CourseChapter {
  // ...
  videoUrl      String?  // YouTube URL (deprecated but kept)
  bunnyVideoId  String?  // Bunny.net video ID
  videoDuration Int?     // Duration in seconds
  videoStatus   Int      @default(0) // Bunny status code
  // ...
}
```

## Checking Migration Progress

Track migration progress with this query:

```sql
SELECT 
  COUNT(*) as total_chapters,
  SUM(CASE WHEN bunnyVideoId IS NOT NULL THEN 1 ELSE 0 END) as migrated,
  SUM(CASE WHEN bunnyVideoId IS NULL AND videoUrl IS NOT NULL THEN 1 ELSE 0 END) as pending
FROM CourseChapter;
```

## Cleanup (After Full Migration)

Once all videos are migrated and verified:

1. **Optional**: Remove `videoUrl` field from schema (requires migration)
2. **Optional**: Delete YouTube references from code

**⚠️ Warning**: Only do this after confirming all chapters work correctly with Bunny.net videos.

## FAQ

### Can I keep both YouTube and Bunny.net videos?

Yes! The system supports both. Each chapter can use either source. The `VideoPlayer` component automatically detects which to use:
- If `bunnyVideoId` is set, it uses Bunny.net iframe
- Otherwise, it uses `videoUrl` (YouTube/Vimeo/direct)

### Does progress tracking work the same?

Bunny.net videos use a "Mark Complete" button since we can't track progress inside the iframe. YouTube videos auto-complete at 90% watched.

### What happens to user progress during migration?

User progress is unaffected. Progress is tracked per chapter ID, not per video source.

### Can I re-upload a video without losing progress?

Yes. Just update the `bunnyVideoId` to point to the new video. User progress is preserved.
