import express from "express";
import {
    validateCoupon,
    getCoupons,
    getCouponById,
    createCoupon,
    updateCoupon,
    deleteCoupon,
    getCouponsReadyToShow,
} from "../controllers/coupon.controller.js";
import { verifyJWTToken, isAdmin, optionalJWTToken } from "../middlewares/auth.middleware.js";

const router = express.Router();

// Public routes
router.post("/validate", optionalJWTToken, validateCoupon);
router.get("/ready-to-show", optionalJWTToken, getCouponsReadyToShow);

// Admin routes - require admin authentication
router.use(verifyJWTToken);
router.use(isAdmin);

// Get all coupons
router.get("/", getCoupons);

// Get single coupon
router.get("/:id", getCouponById);

// Create coupon
router.post("/", createCoupon);

// Update coupon
router.patch("/:id", updateCoupon);

// Delete coupon
router.delete("/:id", deleteCoupon);

export default router;

