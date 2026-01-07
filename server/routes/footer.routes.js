import express from "express";
import {
    getFooterLinks,
    getAllFooterLinks,
    createFooterLink,
    updateFooterLink,
    deleteFooterLink,
    reorderFooterLinks,
} from "../controllers/footer.controller.js";
import { verifyJWTToken, isAdmin } from "../middlewares/auth.middleware.js";

const router = express.Router();

// Public route
router.get("/", getFooterLinks);

// Admin routes
router.use(verifyJWTToken);
router.use(isAdmin);

router.get("/admin", getAllFooterLinks);
router.post("/admin", createFooterLink);
router.put("/admin/:id", updateFooterLink);
router.delete("/admin/:id", deleteFooterLink);
router.post("/admin/reorder", reorderFooterLinks);

export default router;

