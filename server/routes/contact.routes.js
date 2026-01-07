import express from "express";
import { contactController, getAllContacts, markContactAsRead, deleteContact } from "../controllers/contact.controller.js";

import { verifyJWTToken, isAdmin } from "../middlewares/auth.middleware.js";

const router = express.Router();

// Public route
router.post("/", contactController);

// Admin routes
router.use(verifyJWTToken, isAdmin);
router.get("/", getAllContacts);
router.patch("/:id/read", markContactAsRead);
router.delete("/:id", deleteContact);

export default router;

