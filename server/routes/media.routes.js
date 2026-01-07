import express from 'express';
import multer from 'multer';
import {
    uploadMedia,
    fetchFromUrl,
    listMedia,
    getMedia,
    deleteMedia,
    getMediaStatus,
    updateMedia,
    getConfigStatus,
    // R2 endpoints
    listR2Files,
    getR2Folders,
    uploadR2File,
    deleteR2File,
} from '../controllers/media.controller.js';
import { verifyJWTToken, isAdmin } from '../middlewares/auth.middleware.js';

const router = express.Router();

// Configure multer for memory storage (video files)
const storage = multer.memoryStorage();
const videoUpload = multer({
    storage,
    limits: {
        fileSize: 2048 * 1024 * 1024, // 2GB max file size
    },
    fileFilter: (req, file, cb) => {
        const allowedMimeTypes = [
            'video/mp4', 'video/webm', 'video/quicktime', 'video/x-msvideo', 'video/x-matroska', 'video/mpeg', 'video/ogg',
        ];
        if (allowedMimeTypes.includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new Error('Invalid file type. Only video files are allowed.'), false);
        }
    },
});

// Configure general file upload for R2 (images, pdfs, etc)
const fileUpload = multer({
    storage,
    limits: {
        fileSize: 100 * 1024 * 1024, // 100MB max file size for general files
    },
});

// All routes require admin authentication
router.use(verifyJWTToken, isAdmin);

// Check configuration status (Bunny & R2)
router.get('/config/status', getConfigStatus);

// ==========================================
// Bunny.net Video Routes
// ==========================================

// Upload video file
router.post('/upload', videoUpload.single('video'), uploadMedia);

// Fetch video from external URL
router.post('/fetch-url', fetchFromUrl);

// List all videos with pagination
router.get('/', listMedia);

// Get single video details
router.get('/:videoId', getMedia);

// Update video metadata
router.patch('/:videoId', updateMedia);

// Delete a video
router.delete('/:videoId', deleteMedia);

// Check video encoding status
router.get('/:videoId/status', getMediaStatus);

// ==========================================
// R2 Storage Routes
// ==========================================

// List files from R2
router.get('/r2/files', listR2Files);

// Get folders from R2
router.get('/r2/folders', getR2Folders);

// Upload file to R2
router.post('/r2/upload', fileUpload.single('file'), uploadR2File);

// Delete file from R2
router.delete('/r2/files', deleteR2File);

export default router;