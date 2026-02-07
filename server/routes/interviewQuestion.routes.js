import express from 'express';
import {
    getInterviewQuestions,
    getInterviewQuestionBySlug,
    getAdminInterviewQuestions,
    getInterviewQuestionById,
    createInterviewQuestion,
    createBulkInterviewQuestions,
    updateInterviewQuestion,
    deleteInterviewQuestion,
    togglePublishStatus,
} from '../controllers/interviewQuestion.controller.js';
import { verifyJWTToken, isAdmin } from '../middlewares/auth.middleware.js';

const router = express.Router();

// Public routes
router.get('/', getInterviewQuestions);
router.get('/slug/:slug', getInterviewQuestionBySlug);

// Admin routes
router.get('/admin/all', verifyJWTToken, isAdmin, getAdminInterviewQuestions);
router.get('/admin/:id', verifyJWTToken, isAdmin, getInterviewQuestionById);
router.post('/', verifyJWTToken, isAdmin, createInterviewQuestion);
router.post('/bulk', verifyJWTToken, isAdmin, createBulkInterviewQuestions);
router.patch('/:id', verifyJWTToken, isAdmin, updateInterviewQuestion);
router.delete('/:id', verifyJWTToken, isAdmin, deleteInterviewQuestion);
router.patch('/:id/toggle-publish', verifyJWTToken, isAdmin, togglePublishStatus);

export default router;
