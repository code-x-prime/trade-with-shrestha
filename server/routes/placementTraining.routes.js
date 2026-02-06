import express from "express";
import {
  registerPlacementTraining,
  verifyPlacementTrainingOtp,
  adminGetPlacementTrainingRegistrations,
} from "../controllers/placementTraining.controller.js";
import { verifyJWTToken, isAdmin } from "../middlewares/auth.middleware.js";

const router = express.Router();

// Public
router.post("/register", registerPlacementTraining);
router.post("/verify-otp", verifyPlacementTrainingOtp);

// Admin
router.get("/admin/registrations", verifyJWTToken, isAdmin, adminGetPlacementTrainingRegistrations);

export default router;

