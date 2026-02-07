import express from 'express';
import {
    getAllTrainings,
    getTrainingBySlug,
    createInquiry,
    getAdminTrainings,
    getAdminTrainingById,
    createTraining,
    updateTraining,
    deleteTraining,
    toggleActive,
    getInquiries,
    updateInquiryStatus
} from '../controllers/corporateTraining.controller.js';
import { verifyJWTToken, isAdmin } from '../middlewares/auth.middleware.js';

const router = express.Router();

// Public routes
router.get('/', getAllTrainings);
router.get('/:slug', getTrainingBySlug);
router.post('/inquiry', createInquiry);

// Admin routes (Trainings)
router.get('/admin/all', verifyJWTToken, isAdmin, getAdminTrainings);
router.get('/admin/:id', verifyJWTToken, isAdmin, getAdminTrainingById);
router.post('/', verifyJWTToken, isAdmin, createTraining);
router.patch('/:id', verifyJWTToken, isAdmin, updateTraining);
router.delete('/:id', verifyJWTToken, isAdmin, deleteTraining);
router.patch('/:id/toggle-active', verifyJWTToken, isAdmin, toggleActive);

// Admin routes (Inquiries)
router.get('/admin/inquiries/all', verifyJWTToken, isAdmin, getInquiries);
router.patch('/admin/inquiries/:id/status', verifyJWTToken, isAdmin, updateInquiryStatus);

export default router;
