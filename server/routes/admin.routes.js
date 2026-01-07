import express from "express";
import {
    getUsers,
    updateUserVerification,
    updateUserActiveStatus,
} from "../controllers/admin.controller.js";
import { verifyJWTToken, isAdmin } from "../middlewares/auth.middleware.js";

const router = express.Router();

// All routes require admin authentication
router.use(verifyJWTToken);
router.use(isAdmin);

// Get all users
router.get("/users", getUsers);

// Update user verification status
router.patch("/users/:userId/verify", updateUserVerification);

// Update user active status
router.patch("/users/:userId/active", updateUserActiveStatus);

export default router;

