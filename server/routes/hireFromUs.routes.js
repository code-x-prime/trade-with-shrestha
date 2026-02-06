import express from "express";
import { submitHireRequest, adminGetHireRequests } from "../controllers/hireFromUs.controller.js";
import { verifyJWTToken, isAdmin } from "../middlewares/auth.middleware.js";

const router = express.Router();

router.post("/", submitHireRequest);
router.get("/admin", verifyJWTToken, isAdmin, adminGetHireRequests);

export default router;
