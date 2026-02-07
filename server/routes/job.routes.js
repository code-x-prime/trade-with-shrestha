import express from "express";
import {
    createJob,
    getJobs,
    getJobBySlug,
    updateJob,
    deleteJob,
    verifyJob,
    getAdminJobs
} from "../controllers/job.controller.js";
import { verifyJWTToken, isAdmin, optionalJWTToken } from "../middlewares/auth.middleware.js";
import { upload } from "../middlewares/upload.middleware.js";

const router = express.Router();

// Public routes
router.get("/", getJobs);
router.get("/slug/:slug", optionalJWTToken, getJobBySlug);

// Admin routes
router.get("/admin/all", verifyJWTToken, isAdmin, getAdminJobs);
router.patch("/:id/verify", verifyJWTToken, isAdmin, verifyJob);

// Protected routes (User/Admin)
router.post("/", verifyJWTToken, upload.fields([
    { name: "companyLogo", maxCount: 1 }
]), createJob);

router.patch("/:id", verifyJWTToken, upload.fields([
    { name: "companyLogo", maxCount: 1 }
]), updateJob);

router.delete("/:id", verifyJWTToken, deleteJob);

export default router;
