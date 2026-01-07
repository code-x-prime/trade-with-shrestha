import express from 'express';
import { verifyJWTToken, optionalJWTToken, isAdmin } from '../middlewares/auth.middleware.js';
import { upload } from '../middlewares/upload.middleware.js';
import {
    getBundles,
    getBundleBySlug,
    getBundleByIdPublic,
    getBundleById,
    getAdminBundles,
    createBundle,
    updateBundle,
    deleteBundle,
    toggleBundlePublish,
    getCoursesForBundle,
} from '../controllers/bundle.controller.js';

const router = express.Router();

// Public routes with optional auth (to get enrollment status if logged in)
router.get('/', optionalJWTToken, getBundles);
router.get('/:slug', optionalJWTToken, getBundleBySlug);
router.get('/id/:id', optionalJWTToken, getBundleByIdPublic);

// Admin routes
router.get('/admin/all', verifyJWTToken, isAdmin, getAdminBundles);
router.get('/admin/courses', verifyJWTToken, isAdmin, getCoursesForBundle);
router.get('/admin/:id', verifyJWTToken, isAdmin, getBundleById);
router.post('/admin', verifyJWTToken, isAdmin, upload.single('thumbnail'), createBundle);
router.put('/admin/:id', verifyJWTToken, isAdmin, upload.single('thumbnail'), updateBundle);
router.patch('/admin/:id/toggle-publish', verifyJWTToken, isAdmin, toggleBundlePublish);
router.delete('/admin/:id', verifyJWTToken, isAdmin, deleteBundle);

export default router;
