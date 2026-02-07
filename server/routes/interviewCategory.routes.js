import express from 'express';
import {
    getCategories,
    getAllCategoriesAdmin,
    getCategoryById,
    createCategory,
    updateCategory,
    deleteCategory,
    toggleActiveStatus,
} from '../controllers/interviewCategory.controller.js';
import { verifyJWTToken, isAdmin } from '../middlewares/auth.middleware.js';

const router = express.Router();

// Public routes
router.get('/', getCategories);

// Admin routes
router.get('/admin/all', verifyJWTToken, isAdmin, getAllCategoriesAdmin);
router.get('/admin/:id', verifyJWTToken, isAdmin, getCategoryById);
router.post('/', verifyJWTToken, isAdmin, createCategory);
router.patch('/:id', verifyJWTToken, isAdmin, updateCategory);
router.delete('/:id', verifyJWTToken, isAdmin, deleteCategory);
router.patch('/:id/toggle-active', verifyJWTToken, isAdmin, toggleActiveStatus);

export default router;
