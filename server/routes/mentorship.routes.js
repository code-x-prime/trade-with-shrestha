import express from "express";
import {
    getMentorship,
    getMentorshipById,
    getMentorshipBySlug,
    createMentorship,
    updateMentorship,
    deleteMentorship,
    togglePublishStatus,
    createSession,
    getSessions,
    updateSession,
    deleteSession,
    checkEnrollment,
} from "../controllers/mentorship.controller.js";
import { verifyJWTToken, isAdmin, optionalJWTToken } from "../middlewares/auth.middleware.js";
import { upload } from "../middlewares/upload.middleware.js";

const router = express.Router();

// Public routes
router.get("/", optionalJWTToken, getMentorship);
router.get("/slug/:slug", optionalJWTToken, getMentorshipBySlug);
router.get("/:id", optionalJWTToken, getMentorshipById);
router.get("/:mentorshipId/sessions", optionalJWTToken, getSessions); // Public - anyone can view sessions

// Admin routes
router.post("/", verifyJWTToken, isAdmin, upload.fields([
    { name: "coverImage", maxCount: 1 },
    { name: "instructorImage", maxCount: 1 },
]), createMentorship);
router.patch("/:id", verifyJWTToken, isAdmin, upload.fields([
    { name: "coverImage", maxCount: 1 },
    { name: "instructorImage", maxCount: 1 },
]), updateMentorship);
router.delete("/:id", verifyJWTToken, isAdmin, deleteMentorship);
router.patch("/:id/publish", verifyJWTToken, isAdmin, togglePublishStatus);

// Session management (Admin only - create, update, delete)
router.post("/:mentorshipId/sessions", verifyJWTToken, isAdmin, createSession);
router.patch("/sessions/:sessionId", verifyJWTToken, isAdmin, updateSession);
router.delete("/sessions/:sessionId", verifyJWTToken, isAdmin, deleteSession);

// User routes
router.get("/:id/enrollment", verifyJWTToken, checkEnrollment);

export default router;

