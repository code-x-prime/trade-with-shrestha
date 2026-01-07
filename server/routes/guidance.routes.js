import express from "express";
import {
    getGuidance,
    getGuidanceById,
    getGuidanceBySlug,
    createGuidance,
    updateGuidance,
    deleteGuidance,
    toggleGuidanceStatus,
    createSlot,
    getSlots,
    getAvailableSlots,
    updateSlotStatus,
    deleteSlot,
    checkSlotAccess,
} from "../controllers/guidance.controller.js";
import { verifyJWTToken, isAdmin, optionalJWTToken } from "../middlewares/auth.middleware.js";
import { upload } from "../middlewares/upload.middleware.js";

const router = express.Router();

// Public routes
router.get("/", optionalJWTToken, getGuidance);
router.get("/slug/:slug", optionalJWTToken, getGuidanceBySlug);
router.get("/:id", optionalJWTToken, getGuidanceById);
router.get("/:guidanceId/slots/available", optionalJWTToken, getAvailableSlots);

// Admin routes
router.post("/", verifyJWTToken, isAdmin, upload.single("expertImage"), createGuidance);
router.patch("/:id", verifyJWTToken, isAdmin, upload.single("expertImage"), updateGuidance);
router.delete("/:id", verifyJWTToken, isAdmin, deleteGuidance);
router.patch("/:id/status", verifyJWTToken, isAdmin, toggleGuidanceStatus);

// Slot management (Admin)
router.post("/:guidanceId/slots", verifyJWTToken, isAdmin, createSlot);
router.get("/:guidanceId/slots", verifyJWTToken, isAdmin, getSlots);
router.patch("/slots/:slotId/status", verifyJWTToken, isAdmin, updateSlotStatus);
router.delete("/slots/:slotId", verifyJWTToken, isAdmin, deleteSlot);

// User routes
router.get("/slots/:slotId/access", verifyJWTToken, checkSlotAccess);

export default router;

