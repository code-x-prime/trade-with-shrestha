import express from "express";
import {
    getEbooks,
    getEbookById,
    getEbookBySlug,
    getEbooksByCategory,
    createEbook,
    updateEbook,
    updateEbookCategories,
    togglePublishEbook,
    deleteEbook,
} from "../controllers/ebook.controller.js";
import { verifyJWTToken, isAdmin, optionalJWTToken } from "../middlewares/auth.middleware.js";
import { uploadFields } from "../middlewares/upload.middleware.js";

const router = express.Router();

// Public routes (users can see published e-books without auth)
// optionalJWTToken will set req.user if token exists (for admin to see all)
router.get("/", optionalJWTToken, getEbooks);
router.get("/category", optionalJWTToken, getEbooksByCategory);
router.get("/slug/:slug", optionalJWTToken, getEbookBySlug);
router.get("/:id", optionalJWTToken, getEbookById);

// Admin only routes
router.post(
    "/",
    verifyJWTToken,
    isAdmin,
    uploadFields([
        { name: "image1", maxCount: 1 },
        { name: "image2", maxCount: 1 },
        { name: "image3", maxCount: 1 },
        { name: "pdf", maxCount: 1 },
    ]),
    createEbook
);

router.patch(
    "/:id",
    verifyJWTToken,
    isAdmin,
    uploadFields([
        { name: "image1", maxCount: 1 },
        { name: "image2", maxCount: 1 },
        { name: "image3", maxCount: 1 },
        { name: "pdf", maxCount: 1 },
    ]),
    updateEbook
);

router.patch("/:id/categories", verifyJWTToken, isAdmin, updateEbookCategories);
router.patch("/:id/publish", verifyJWTToken, isAdmin, togglePublishEbook);
router.delete("/:id", verifyJWTToken, isAdmin, deleteEbook);

export default router;

