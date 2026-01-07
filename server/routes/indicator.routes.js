import express from "express";
import {
    getIndicators,
    getIndicatorById,
    getIndicatorBySlug,
    createIndicator,
    updateIndicator,
    togglePublishIndicator,
    deleteIndicator,
} from "../controllers/indicator.controller.js";
import { verifyJWTToken, isAdmin, optionalJWTToken } from "../middlewares/auth.middleware.js";
import { uploadFields } from "../middlewares/upload.middleware.js";

const router = express.Router();

// Public routes (users can see published indicators without auth)
router.get("/", optionalJWTToken, getIndicators);
router.get("/slug/:slug", optionalJWTToken, getIndicatorBySlug);
router.get("/:id", optionalJWTToken, getIndicatorById);

// Admin only routes
router.post(
    "/",
    verifyJWTToken,
    isAdmin,
    uploadFields([{ name: "image", maxCount: 1 }]),
    createIndicator
);

router.patch(
    "/:id",
    verifyJWTToken,
    isAdmin,
    uploadFields([{ name: "image", maxCount: 1 }]),
    updateIndicator
);

router.patch("/:id/publish", verifyJWTToken, isAdmin, togglePublishIndicator);
router.delete("/:id", verifyJWTToken, isAdmin, deleteIndicator);

export default router;

