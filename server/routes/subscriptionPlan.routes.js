import express from "express";
import {
    getGlobalPlans,
    getAllPlans,
    getPlanById,
    upsertPlan,
    updatePlan,
    deletePlan,
} from "../controllers/subscriptionPlan.controller.js";
import { verifyJWTToken, isAdmin } from "../middlewares/auth.middleware.js";

const router = express.Router();

// Public route - get active plans
router.get("/", getGlobalPlans);

// Admin routes
router.get("/all", verifyJWTToken, isAdmin, getAllPlans);
router.get("/:id", verifyJWTToken, isAdmin, getPlanById);
router.post("/", verifyJWTToken, isAdmin, upsertPlan);
router.patch("/:id", verifyJWTToken, isAdmin, updatePlan);
router.delete("/:id", verifyJWTToken, isAdmin, deletePlan);

export default router;

