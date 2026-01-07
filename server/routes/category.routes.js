import express from 'express';
import {
    getCategories,
    getCategoryById,
    createCategory,
    updateCategory,
    deleteCategory,
} from '../controllers/category.controller.js';
import { verifyJWTToken, isAdmin, optionalJWTToken } from '../middlewares/auth.middleware.js';

const router = express.Router();

// Public routes
router.get('/', optionalJWTToken, getCategories);

// Admin routes
router.use(verifyJWTToken);
router.use(isAdmin);

router.get('/:id', getCategoryById);
router.post('/', createCategory);
router.patch('/:id', updateCategory);
router.delete('/:id', deleteCategory);

export default router;

