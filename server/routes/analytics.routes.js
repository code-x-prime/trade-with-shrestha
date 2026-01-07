import express from "express";
import { getAnalytics } from "../controllers/analytics.controller.js";
import { verifyJWTToken, isAdmin } from "../middlewares/auth.middleware.js";

const router = express.Router();

// All routes require admin access
router.use(verifyJWTToken, isAdmin);

router.get("/", getAnalytics);

export default router;

