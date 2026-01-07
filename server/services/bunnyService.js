import axios from 'axios';

/**
 * Bunny.net Stream Video Service
 * 
 * Integrates with Bunny.net Video Library API for video management.
 * 
 * Required Environment Variables:
 * - BUNNY_LIBRARY_ID: Your Bunny.net video library ID
 * - BUNNY_API_KEY: Your Bunny.net library API key
 * - BUNNY_CDN_HOSTNAME: Your Bunny.net CDN hostname (e.g., vz-xxxxx-xxx.b-cdn.net)
 */

const BUNNY_LIBRARY_ID = process.env.BUNNY_LIBRARY_ID;
const BUNNY_API_KEY = process.env.BUNNY_API_KEY;
const BUNNY_CDN_HOSTNAME = process.env.BUNNY_CDN_HOSTNAME;

// Base URL for Bunny.net Video API
const BUNNY_API_BASE_URL = `https://video.bunnycdn.com/library/${BUNNY_LIBRARY_ID}`;

// Axios instance with default headers
const bunnyApi = axios.create({
    baseURL: BUNNY_API_BASE_URL,
    headers: {
        'AccessKey': BUNNY_API_KEY,
        'Content-Type': 'application/json',
    },
});

/**
 * Video Status Codes from Bunny.net
 * 0 - Created (Entry created, no file)
 * 1 - Uploaded (File received)
 * 2 - Processing (Being processed)
 * 3 - Transcoding (Creating qualities)
 * 4 - Finished (Ready to play)
 * 5 - Error (Failed)
 * 6 - Upload Failed
 */
export const VIDEO_STATUS = {
    CREATED: 0,
    UPLOADED: 1,
    PROCESSING: 2,
    TRANSCODING: 3,
    FINISHED: 4,
    ERROR: 5,
    UPLOAD_FAILED: 6,
};

/**
 * Create a video entry in Bunny.net library
 * @param {string} title - Video title
 * @returns {Promise<Object>} Video data including guid
 */
export const createVideo = async (title) => {
    try {
        const response = await bunnyApi.post('/videos', { title });
        return response.data;
    } catch (error) {
        console.error('Bunny createVideo error:', error.response?.data || error.message);
        throw new Error(error.response?.data?.Message || 'Failed to create video in Bunny.net');
    }
};

/**
 * Upload video file to Bunny.net
 * @param {string} videoId - The video guid from createVideo
 * @param {Buffer} videoBuffer - Video file buffer
 * @returns {Promise<Object>} Upload result
 */
export const uploadVideo = async (videoId, videoBuffer) => {
    try {
        const response = await axios.put(
            `${BUNNY_API_BASE_URL}/videos/${videoId}`,
            videoBuffer,
            {
                headers: {
                    'AccessKey': BUNNY_API_KEY,
                    'Content-Type': 'application/octet-stream',
                },
                maxContentLength: Infinity,
                maxBodyLength: Infinity,
            }
        );
        return response.data;
    } catch (error) {
        console.error('Bunny uploadVideo error:', error.response?.data || error.message);
        throw new Error(error.response?.data?.Message || 'Failed to upload video to Bunny.net');
    }
};

/**
 * Fetch video from external URL (Bunny will download and process it)
 * @param {string} url - External video URL
 * @param {string} title - Video title
 * @returns {Promise<Object>} Video data
 */
export const fetchVideoFromUrl = async (url, title) => {
    try {
        const response = await bunnyApi.post('/videos/fetch', {
            url,
            title,
        });
        return response.data;
    } catch (error) {
        console.error('Bunny fetchVideoFromUrl error:', error.response?.data || error.message);
        throw new Error(error.response?.data?.Message || 'Failed to fetch video from URL');
    }
};

/**
 * Get video details and status
 * @param {string} videoId - The video guid
 * @returns {Promise<Object>} Video details including status
 */
export const getVideo = async (videoId) => {
    try {
        const response = await bunnyApi.get(`/videos/${videoId}`);
        return response.data;
    } catch (error) {
        console.error('Bunny getVideo error:', error.response?.data || error.message);
        throw new Error(error.response?.data?.Message || 'Failed to get video details');
    }
};

/**
 * List all videos in the library with pagination
 * @param {number} page - Page number (1-indexed)
 * @param {number} itemsPerPage - Items per page (max 100)
 * @param {string} search - Optional search query
 * @param {string} orderBy - Optional order by field
 * @returns {Promise<Object>} Paginated video list
 */
export const listVideos = async (page = 1, itemsPerPage = 20, search = '', orderBy = 'date') => {
    try {
        const response = await bunnyApi.get('/videos', {
            params: {
                page,
                itemsPerPage,
                search,
                orderBy,
            },
        });
        return response.data;
    } catch (error) {
        console.error('Bunny listVideos error:', error.response?.data || error.message);
        throw new Error(error.response?.data?.Message || 'Failed to list videos');
    }
};

/**
 * Delete a video from Bunny.net
 * @param {string} videoId - The video guid
 * @returns {Promise<void>}
 */
export const deleteVideo = async (videoId) => {
    try {
        await bunnyApi.delete(`/videos/${videoId}`);
    } catch (error) {
        console.error('Bunny deleteVideo error:', error.response?.data || error.message);
        throw new Error(error.response?.data?.Message || 'Failed to delete video');
    }
};

/**
 * Generate iframe embed URL for a video
 * @param {string} videoId - The video guid
 * @param {Object} options - Embed options
 * @returns {string} Embed URL
 */
export const getEmbedUrl = (videoId, options = {}) => {
    const { autoplay = false, preload = true, loop = false } = options;
    const params = new URLSearchParams({
        autoplay: autoplay.toString(),
        preload: preload.toString(),
        loop: loop.toString(),
    });
    return `https://iframe.mediadelivery.net/embed/${BUNNY_LIBRARY_ID}/${videoId}?${params.toString()}`;
};

/**
 * Generate HLS playlist URL for a video
 * @param {string} videoId - The video guid
 * @returns {string} HLS playlist URL
 */
export const getHlsUrl = (videoId) => {
    return `https://${BUNNY_CDN_HOSTNAME}/${videoId}/playlist.m3u8`;
};

/**
 * Generate thumbnail URL for a video
 * @param {string} videoId - The video guid
 * @param {string} size - Thumbnail size (thumbnail, preview)
 * @returns {string} Thumbnail URL
 */
export const getThumbnailUrl = (videoId, size = 'thumbnail') => {
    if (size === 'preview') {
        return `https://${BUNNY_CDN_HOSTNAME}/${videoId}/preview.webp`;
    }
    return `https://${BUNNY_CDN_HOSTNAME}/${videoId}/thumbnail.jpg`;
};

/**
 * Get video play data (captions, chapters, etc.)
 * @param {string} videoId - The video guid
 * @returns {Promise<Object>} Play data
 */
export const getVideoPlayData = async (videoId) => {
    try {
        const response = await bunnyApi.get(`/videos/${videoId}/play`);
        return response.data;
    } catch (error) {
        console.error('Bunny getVideoPlayData error:', error.response?.data || error.message);
        throw new Error(error.response?.data?.Message || 'Failed to get video play data');
    }
};

/**
 * Update video metadata
 * @param {string} videoId - The video guid
 * @param {Object} data - Update data (title, etc.)
 * @returns {Promise<Object>} Updated video data
 */
export const updateVideo = async (videoId, data) => {
    try {
        const response = await bunnyApi.post(`/videos/${videoId}`, data);
        return response.data;
    } catch (error) {
        console.error('Bunny updateVideo error:', error.response?.data || error.message);
        throw new Error(error.response?.data?.Message || 'Failed to update video');
    }
};

/**
 * Check if video is ready to play
 * @param {number} status - Video status code
 * @returns {boolean} True if ready
 */
export const isVideoReady = (status) => {
    return status === VIDEO_STATUS.FINISHED;
};

/**
 * Get human-readable status text
 * @param {number} status - Video status code
 * @returns {string} Status text
 */
export const getStatusText = (status) => {
    const statusTexts = {
        [VIDEO_STATUS.CREATED]: 'Created',
        [VIDEO_STATUS.UPLOADED]: 'Uploaded',
        [VIDEO_STATUS.PROCESSING]: 'Processing',
        [VIDEO_STATUS.TRANSCODING]: 'Transcoding',
        [VIDEO_STATUS.FINISHED]: 'Ready',
        [VIDEO_STATUS.ERROR]: 'Error',
        [VIDEO_STATUS.UPLOAD_FAILED]: 'Upload Failed',
    };
    return statusTexts[status] || 'Unknown';
};

/**
 * Check if Bunny service is properly configured
 * @returns {boolean} True if configured
 */
export const isConfigured = () => {
    return !!(BUNNY_LIBRARY_ID && BUNNY_API_KEY && BUNNY_CDN_HOSTNAME);
};

export default {
    VIDEO_STATUS,
    createVideo,
    uploadVideo,
    fetchVideoFromUrl,
    getVideo,
    listVideos,
    deleteVideo,
    getEmbedUrl,
    getHlsUrl,
    getThumbnailUrl,
    getVideoPlayData,
    updateVideo,
    isVideoReady,
    getStatusText,
    isConfigured,
};
