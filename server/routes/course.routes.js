import express from "express";
import {
    getCourses,
    getCourseBySlug,
    getCourseById,
    createCourse,
    updateCourse,
    deleteCourse,
    togglePublishStatus,
    updateCourseBadges,
    createSession,
    getSessions,
    updateSession,
    deleteSession,
    createChapter,
    updateChapter,
    deleteChapter,
    uploadSessionResource,
    deleteSessionResource,
    checkEnrollment,
    getCourseProgress,
    updateChapterProgress,
    getChapterBySlug,
    getCoursesByCategory,
    getFeaturedCourses,
    getCoursesByBadge,
    getFreeCourses,
    getCourseReviews,
    createCourseReview,
    getUserCourseReview,
    getAdminCourseEnrollments,
    getAdminEnrollmentDetails,
    getAdminCourseStats,
    adminManualEnroll,
} from "../controllers/course.controller.js";
import { verifyJWTToken, isAdmin, optionalJWTToken } from "../middlewares/auth.middleware.js";
import { upload } from "../middlewares/upload.middleware.js";

const router = express.Router();

// Public routes (specific routes first to avoid conflicts)
router.get("/", optionalJWTToken, getCourses);
router.get("/category", optionalJWTToken, getCoursesByCategory);
router.get("/featured", optionalJWTToken, getFeaturedCourses);
router.get("/badge/:badge", optionalJWTToken, getCoursesByBadge);
router.get("/free", optionalJWTToken, getFreeCourses);
router.get("/slug/:slug", optionalJWTToken, getCourseBySlug);
router.get("/:courseId/progress", verifyJWTToken, getCourseProgress);
router.post("/:chapterId/progress", verifyJWTToken, updateChapterProgress);
router.get("/:courseSlug/chapters/:chapterSlug", optionalJWTToken, getChapterBySlug);
router.get("/:courseId/enrollment", optionalJWTToken, checkEnrollment);
router.get("/:courseId/reviews", getCourseReviews);
router.get("/:courseId/reviews/my", verifyJWTToken, getUserCourseReview);
router.post("/:courseId/reviews", verifyJWTToken, createCourseReview);
// Get course by ID (must be last to avoid route conflicts with above routes)
router.get("/:id", optionalJWTToken, getCourseById);

// Admin routes
router.post("/", verifyJWTToken, isAdmin, upload.fields([
    { name: "coverImage", maxCount: 1 },
]), createCourse);
router.patch("/:id", verifyJWTToken, isAdmin, upload.fields([
    { name: "coverImage", maxCount: 1 },
]), updateCourse);
router.delete("/:id", verifyJWTToken, isAdmin, deleteCourse);
router.patch("/:id/publish", verifyJWTToken, isAdmin, togglePublishStatus);
router.patch("/:id/badges", verifyJWTToken, isAdmin, updateCourseBadges);

// Session management
router.post("/:courseId/sessions", verifyJWTToken, isAdmin, createSession);
router.get("/:courseId/sessions", optionalJWTToken, getSessions);
router.patch("/sessions/:sessionId", verifyJWTToken, isAdmin, updateSession);
router.delete("/sessions/:sessionId", verifyJWTToken, isAdmin, deleteSession);

// Chapter management
router.post("/sessions/:sessionId/chapters", verifyJWTToken, isAdmin, createChapter);
router.patch("/chapters/:chapterId", verifyJWTToken, isAdmin, updateChapter);
router.delete("/chapters/:chapterId", verifyJWTToken, isAdmin, deleteChapter);

// Session resources
router.post("/sessions/:sessionId/resources", verifyJWTToken, isAdmin, upload.fields([
    { name: "resource", maxCount: 1 },
]), uploadSessionResource);
router.delete("/resources/:resourceId", verifyJWTToken, isAdmin, deleteSessionResource);

// Admin enrollment tracking routes
router.get("/admin/enrollments", verifyJWTToken, isAdmin, getAdminCourseEnrollments);
router.get("/admin/enrollments/:enrollmentId", verifyJWTToken, isAdmin, getAdminEnrollmentDetails);
router.get("/admin/course-stats", verifyJWTToken, isAdmin, getAdminCourseStats);
router.post("/admin/manual-enroll", verifyJWTToken, isAdmin, adminManualEnroll);

export default router;

