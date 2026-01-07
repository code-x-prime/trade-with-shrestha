import { Router } from 'express';
import { verifyJWTToken, isAdmin } from '../middlewares/auth.middleware.js';
import {
    getActiveFlashSale,
    getAllFlashSales,
    createFlashSale,
    updateFlashSale,
    deleteFlashSale,
    toggleFlashSale,
    getItemsByType,
} from '../controllers/flashSale.controller.js';

const router = Router();

// Public route
router.get('/active', getActiveFlashSale);

// Admin routes
router.get('/', verifyJWTToken, isAdmin, getAllFlashSales);
router.get('/items/:type', verifyJWTToken, isAdmin, getItemsByType);
router.post('/', verifyJWTToken, isAdmin, createFlashSale);
router.patch('/:id', verifyJWTToken, isAdmin, updateFlashSale);
router.patch('/:id/toggle', verifyJWTToken, isAdmin, toggleFlashSale);
router.delete('/:id', verifyJWTToken, isAdmin, deleteFlashSale);

export default router;

