import express from 'express';
import {
    getCart,
    addToCart,
    removeFromCart,
    clearCart,
    syncCart,
} from '../controllers/cart.controller.js';
import { verifyJWTToken } from '../middlewares/auth.middleware.js';

const router = express.Router();

// All cart routes require authentication
router.use(verifyJWTToken);

router.get('/', getCart);
router.post('/add', addToCart);
router.post('/remove', removeFromCart);
router.delete('/clear', clearCart);
router.post('/sync', syncCart);

export default router;

