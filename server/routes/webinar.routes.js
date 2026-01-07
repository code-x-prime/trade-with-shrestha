import express from "express";
import {
    getWebinars,
    getWebinarById,
    getWebinarBySlug,
    createWebinar,
    updateWebinar,
    deleteWebinar,
    togglePublish,
    checkEnrollment,
} from "../controllers/webinar.controller.js";
import { verifyJWTToken } from "../middlewares/auth.middleware.js";
import { isAdmin } from "../middlewares/auth.middleware.js";
import { optionalJWTToken } from "../middlewares/auth.middleware.js";
import { upload } from "../middlewares/upload.middleware.js";

const router = express.Router();

// Public routes
router.get("/", optionalJWTToken, getWebinars);
router.get("/slug/:slug", optionalJWTToken, getWebinarBySlug);
router.get("/:id", optionalJWTToken, getWebinarById); // Allow guest access for cart viewing

// Protected routes
router.get("/:id/enrollment", verifyJWTToken, checkEnrollment);

// Admin routes
router.post(
    "/",
    verifyJWTToken,
    isAdmin,
    upload.fields([
        { name: "image", maxCount: 1 },
        { name: "instructorImage", maxCount: 1 },
    ]),
    createWebinar
);

router.patch(
    "/:id",
    verifyJWTToken,
    isAdmin,
    upload.fields([
        { name: "image", maxCount: 1 },
        { name: "instructorImage", maxCount: 1 },
    ]),
    updateWebinar
);

router.delete("/:id", verifyJWTToken, isAdmin, deleteWebinar);
router.patch("/:id/publish", verifyJWTToken, isAdmin, togglePublish);

export default router;

