import express from "express";
import {
    getOfflineBatches,
    getOfflineBatchBySlug,
    getOfflineBatchByIdPublic,
    getAllOfflineBatches,
    getOfflineBatchById,
    createOfflineBatch,
    updateOfflineBatch,
    deleteOfflineBatch,
    enrollInOfflineBatch,
} from "../controllers/offlineBatch.controller.js";
import { verifyJWTToken, optionalJWTToken, isAdmin } from "../middlewares/auth.middleware.js";
import { upload } from "../middlewares/upload.middleware.js";

const router = express.Router();

// Public routes
router.get("/", getOfflineBatches);
// Optional auth - check if user is authenticated but don't require it
router.get("/:slug", optionalJWTToken, getOfflineBatchBySlug);
router.get("/id/:id", getOfflineBatchByIdPublic);

// User routes (enrollment)
router.post("/enroll", verifyJWTToken, enrollInOfflineBatch);

// Admin routes
router.use(verifyJWTToken);
router.use(isAdmin);

router.get("/admin/all", getAllOfflineBatches);
router.get("/admin/:id", getOfflineBatchById);
router.post("/admin", upload.fields([{ name: "thumbnail", maxCount: 1 }]), createOfflineBatch);
router.put(
    "/admin/:id",
    upload.fields([{ name: "thumbnail", maxCount: 1 }]),
    updateOfflineBatch
);
router.delete("/admin/:id", deleteOfflineBatch);

export default router;

