import { ApiError } from '../utils/ApiError.js';
import { ApiResponsive } from '../utils/ApiResponsive.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import * as bunnyService from '../services/bunnyService.js';
import * as r2Service from '../services/r2Service.js';

/**
 * Media Controller
 * Handles video upload and management with Bunny.net
 */

/**
 * Upload video file to Bunny.net
 * POST /api/media/upload
 */
export const uploadMedia = asyncHandler(async (req, res) => {
    // Check if Bunny service is configured
    if (!bunnyService.isConfigured()) {
        throw new ApiError(500, 'Bunny.net service is not configured. Please check environment variables.');
    }

    const { title } = req.body;
    const file = req.file;

    if (!file) {
        throw new ApiError(400, 'No video file provided');
    }

    if (!title) {
        throw new ApiError(400, 'Video title is required');
    }

    // Validate file type
    const allowedMimeTypes = ['video/mp4', 'video/webm', 'video/quicktime', 'video/x-msvideo', 'video/x-matroska'];
    if (!allowedMimeTypes.includes(file.mimetype)) {
        throw new ApiError(400, 'Invalid file type. Allowed: MP4, WebM, MOV, AVI, MKV');
    }

    // Create video entry in Bunny
    const video = await bunnyService.createVideo(title);

    // Upload the file
    await bunnyService.uploadVideo(video.guid, file.buffer);

    // Get updated video info
    const videoInfo = await bunnyService.getVideo(video.guid);

    return res.status(201).json(
        new ApiResponsive(201, {
            video: {
                id: videoInfo.guid,
                title: videoInfo.title,
                status: videoInfo.status,
                statusText: bunnyService.getStatusText(videoInfo.status),
                length: videoInfo.length || 0,
                thumbnailUrl: bunnyService.getThumbnailUrl(videoInfo.guid),
                embedUrl: bunnyService.getEmbedUrl(videoInfo.guid),
                createdAt: videoInfo.dateUploaded,
            },
        }, 'Video uploaded successfully. Processing may take a few minutes.')
    );
});

/**
 * Fetch video from external URL
 * POST /api/media/fetch-url
 */
export const fetchFromUrl = asyncHandler(async (req, res) => {
    if (!bunnyService.isConfigured()) {
        throw new ApiError(500, 'Bunny.net service is not configured');
    }

    const { url, title } = req.body;

    if (!url) {
        throw new ApiError(400, 'Video URL is required');
    }

    if (!title) {
        throw new ApiError(400, 'Video title is required');
    }

    const video = await bunnyService.fetchVideoFromUrl(url, title);

    return res.status(201).json(
        new ApiResponsive(201, {
            video: {
                id: video.guid,
                title: video.title,
                status: video.status,
                statusText: bunnyService.getStatusText(video.status),
                thumbnailUrl: bunnyService.getThumbnailUrl(video.guid),
                embedUrl: bunnyService.getEmbedUrl(video.guid),
            },
        }, 'Video fetch initiated. Processing may take a few minutes.')
    );
});

/**
 * List all videos with pagination
 * GET /api/media
 */
export const listMedia = asyncHandler(async (req, res) => {
    if (!bunnyService.isConfigured()) {
        throw new ApiError(500, 'Bunny.net service is not configured');
    }

    const { page = 1, limit = 20, search = '', orderBy = 'date' } = req.query;
    const pageNum = parseInt(page);
    const limitNum = Math.min(parseInt(limit), 100); // Max 100 per page

    const result = await bunnyService.listVideos(pageNum, limitNum, search, orderBy);

    // Transform videos to include URLs
    const videos = result.items.map(video => ({
        id: video.guid,
        title: video.title,
        status: video.status,
        statusText: bunnyService.getStatusText(video.status),
        isReady: bunnyService.isVideoReady(video.status),
        length: video.length || 0,
        views: video.views || 0,
        thumbnailUrl: bunnyService.getThumbnailUrl(video.guid),
        previewUrl: bunnyService.getThumbnailUrl(video.guid, 'preview'),
        embedUrl: bunnyService.getEmbedUrl(video.guid),
        hlsUrl: bunnyService.getHlsUrl(video.guid),
        createdAt: video.dateUploaded,
        size: video.storageSize || 0,
    }));

    return res.status(200).json(
        new ApiResponsive(200, {
            videos,
            pagination: {
                page: pageNum,
                limit: limitNum,
                total: result.totalItems,
                totalPages: Math.ceil(result.totalItems / limitNum),
            },
        }, 'Videos fetched successfully')
    );
});

/**
 * Get single video details
 * GET /api/media/:videoId
 */
export const getMedia = asyncHandler(async (req, res) => {
    if (!bunnyService.isConfigured()) {
        throw new ApiError(500, 'Bunny.net service is not configured');
    }

    const { videoId } = req.params;

    if (!videoId) {
        throw new ApiError(400, 'Video ID is required');
    }

    const video = await bunnyService.getVideo(videoId);

    return res.status(200).json(
        new ApiResponsive(200, {
            video: {
                id: video.guid,
                title: video.title,
                status: video.status,
                statusText: bunnyService.getStatusText(video.status),
                isReady: bunnyService.isVideoReady(video.status),
                length: video.length || 0,
                views: video.views || 0,
                thumbnailUrl: bunnyService.getThumbnailUrl(video.guid),
                previewUrl: bunnyService.getThumbnailUrl(video.guid, 'preview'),
                embedUrl: bunnyService.getEmbedUrl(video.guid),
                hlsUrl: bunnyService.getHlsUrl(video.guid),
                createdAt: video.dateUploaded,
                size: video.storageSize || 0,
                width: video.width,
                height: video.height,
                availableResolutions: video.availableResolutions,
            },
        }, 'Video details fetched successfully')
    );
});

/**
 * Delete a video
 * DELETE /api/media/:videoId
 */
export const deleteMedia = asyncHandler(async (req, res) => {
    if (!bunnyService.isConfigured()) {
        throw new ApiError(500, 'Bunny.net service is not configured');
    }

    const { videoId } = req.params;

    if (!videoId) {
        throw new ApiError(400, 'Video ID is required');
    }

    await bunnyService.deleteVideo(videoId);

    return res.status(200).json(
        new ApiResponsive(200, null, 'Video deleted successfully')
    );
});

/**
 * Check video encoding status
 * GET /api/media/:videoId/status
 */
export const getMediaStatus = asyncHandler(async (req, res) => {
    if (!bunnyService.isConfigured()) {
        throw new ApiError(500, 'Bunny.net service is not configured');
    }

    const { videoId } = req.params;

    if (!videoId) {
        throw new ApiError(400, 'Video ID is required');
    }

    const video = await bunnyService.getVideo(videoId);

    return res.status(200).json(
        new ApiResponsive(200, {
            id: video.guid,
            status: video.status,
            statusText: bunnyService.getStatusText(video.status),
            isReady: bunnyService.isVideoReady(video.status),
            encodeProgress: video.encodeProgress || 0,
            length: video.length || 0,
        }, 'Video status fetched successfully')
    );
});

/**
 * Update video metadata
 * PATCH /api/media/:videoId
 */
export const updateMedia = asyncHandler(async (req, res) => {
    if (!bunnyService.isConfigured()) {
        throw new ApiError(500, 'Bunny.net service is not configured');
    }

    const { videoId } = req.params;
    const { title } = req.body;

    if (!videoId) {
        throw new ApiError(400, 'Video ID is required');
    }

    const updateData = {};
    if (title) updateData.title = title;

    const video = await bunnyService.updateVideo(videoId, updateData);

    return res.status(200).json(
        new ApiResponsive(200, {
            video: {
                id: video.guid,
                title: video.title,
                status: video.status,
                statusText: bunnyService.getStatusText(video.status),
            },
        }, 'Video updated successfully')
    );
});

/**
 * Check if Bunny service is configured
 * GET /api/media/config/status
 */
export const getConfigStatus = asyncHandler(async (req, res) => {
    const isBunnyConfigured = bunnyService.isConfigured();
    const isR2Configured = r2Service.isR2Configured();

    return res.status(200).json(
        new ApiResponsive(200, {
            isConfigured: isBunnyConfigured,
            isBunnyConfigured,
            isR2Configured,
            bunnyLibraryId: isBunnyConfigured ? process.env.BUNNY_LIBRARY_ID : null,
        }, 'Configuration status fetched')
    );
});

// ==========================================
// R2 Storage Endpoints
// ==========================================

/**
 * List files from R2
 * GET /api/media/r2/files
 */
export const listR2Files = asyncHandler(async (req, res) => {
    if (!r2Service.isR2Configured()) {
        throw new ApiError(500, 'R2 storage is not configured');
    }

    const { page = 1, limit = 50, folder = '', type = '' } = req.query;

    // Parse file types if provided (comma separate)
    const fileTypes = type ? type.split(',') : [];

    const result = await r2Service.listFiles({
        prefix: folder,
        page: parseInt(page),
        limit: parseInt(limit),
        fileTypes
    });

    return res.status(200).json(
        new ApiResponsive(200, result, 'Files fetched successfully')
    );
});

/**
 * Get R2 folders
 * GET /api/media/r2/folders
 */
export const getR2Folders = asyncHandler(async (req, res) => {
    if (!r2Service.isR2Configured()) {
        throw new ApiError(500, 'R2 storage is not configured');
    }

    const folders = await r2Service.getFolders();

    return res.status(200).json(
        new ApiResponsive(200, { folders }, 'Folders fetched successfully')
    );
});

/**
 * Upload file to R2
 * POST /api/media/r2/upload
 */
export const uploadR2File = asyncHandler(async (req, res) => {
    if (!r2Service.isR2Configured()) {
        throw new ApiError(500, 'R2 storage is not configured');
    }

    if (!req.file) {
        throw new ApiError(400, 'No file provided');
    }

    const { folder = '' } = req.body;

    // Dynamic import to avoid circular dependency issues or just to be safe
    const { uploadToR2 } = await import('../utils/cloudflare.js');

    // Determine info
    const folderPath = folder || 'general';
    const filename = await uploadToR2(req.file, folderPath);

    // Get full info
    const fileInfo = await r2Service.getFileInfo(filename);

    return res.status(201).json(
        new ApiResponsive(201, { file: fileInfo }, 'File uploaded successfully')
    );
});

/**
 * Delete file from R2
 * DELETE /api/media/r2/files
 */
export const deleteR2File = asyncHandler(async (req, res) => {
    if (!r2Service.isR2Configured()) {
        throw new ApiError(500, 'R2 storage is not configured');
    }

    const { key } = req.body;

    if (!key) {
        throw new ApiError(400, 'File key is required');
    }

    await r2Service.deleteFile(key);

    return res.status(200).json(
        new ApiResponsive(200, null, 'File deleted successfully')
    );
});
