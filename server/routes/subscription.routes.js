import express from "express";
import {
    createSubscription,
    verifySubscriptionPayment,
    getUserSubscriptions,
    getAllSubscriptions,
    updateTradingViewUsername,
    cancelSubscription,
    renewSubscription,
    checkActiveSubscription,
    updateSubscriptionStatus,
    changeSubscriptionPlan,
    stopSubscription,
    adminRenewSubscription,
} from "../controllers/subscription.controller.js";
import { verifyJWTToken, isAdmin } from "../middlewares/auth.middleware.js";

const router = express.Router();

// User routes
router.get("/check-active", verifyJWTToken, checkActiveSubscription);
router.post("/", verifyJWTToken, createSubscription);
router.post("/verify-payment", verifyJWTToken, verifySubscriptionPayment);
router.get("/", verifyJWTToken, getUserSubscriptions);
router.post("/:id/cancel", verifyJWTToken, cancelSubscription);
router.post("/:id/renew", verifyJWTToken, renewSubscription);

// Admin routes
router.get("/all", verifyJWTToken, isAdmin, getAllSubscriptions);
router.patch("/:id/tradingview", verifyJWTToken, isAdmin, updateTradingViewUsername);
router.patch("/:id/status", verifyJWTToken, isAdmin, updateSubscriptionStatus);
router.patch("/:id/plan", verifyJWTToken, isAdmin, changeSubscriptionPlan);
router.post("/:id/stop", verifyJWTToken, isAdmin, stopSubscription);
router.post("/:id/renew", verifyJWTToken, isAdmin, adminRenewSubscription);

export default router;

