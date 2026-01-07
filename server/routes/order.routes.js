import express from "express";
import {
    createOrder,
    createWebinarOrder,
    createGuidanceOrder,
    createMentorshipOrder,
    createCourseOrder,
    createOfflineBatchOrder,
    createBundleOrder,
    checkGuidanceBooking,
    verifyPayment,
    getUserOrders,
    getAllOrders,
    createReview,
    initPayment,
    completePayment,
} from "../controllers/order.controller.js";
import { verifyJWTToken, isAdmin } from "../middlewares/auth.middleware.js";

const router = express.Router();

// All routes require authentication
router.use(verifyJWTToken);

// Initialize payment (creates only Razorpay order, no DB order)
router.post("/init-payment", initPayment);

// Complete payment (creates DB order after payment success)
router.post("/complete-payment", completePayment);

// Create order
router.post("/", createOrder);

// Create webinar order
router.post("/webinar", createWebinarOrder);

// Create guidance order
router.post("/guidance", createGuidanceOrder);

// Create mentorship order
router.post("/mentorship", createMentorshipOrder);

// Create course order
router.post("/course", createCourseOrder);

// Create offline batch order
router.post("/offline-batch", createOfflineBatchOrder);

// Create bundle order
router.post("/bundle", createBundleOrder);

// Check guidance booking
router.get("/guidance/:slotId/booking", checkGuidanceBooking);

// Verify payment
router.post("/verify", verifyPayment);

// Get user orders
router.get("/", getUserOrders);

// Get all orders (Admin only)
router.get("/all", verifyJWTToken, isAdmin, getAllOrders);

// Create review
router.post("/review", createReview);

export default router;

