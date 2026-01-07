import { Router } from 'express';
import { verifyJWTToken, isAdmin } from '../middlewares/auth.middleware.js';
import {
    getAllReviews,
    getReviewStats,
    updateReview,
    deleteReview,
    getReviewById,
} from '../controllers/review.controller.js';

const router = Router();

// All admin routes
router.get('/', verifyJWTToken, isAdmin, getAllReviews);
router.get('/stats', verifyJWTToken, isAdmin, getReviewStats);
router.get('/:id', verifyJWTToken, isAdmin, getReviewById);
router.patch('/:id', verifyJWTToken, isAdmin, updateReview);
router.delete('/:id', verifyJWTToken, isAdmin, deleteReview);

export default router;

