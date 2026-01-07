import express from "express";
import {
  getProfile,
  updateProfile,
  uploadAvatar,
  changePassword,
  deleteAccount,
  getPurchaseStatus,
} from "../controllers/user.controller.js";
import { verifyJWTToken } from "../middlewares/auth.middleware.js";
import { upload } from "../middlewares/upload.middleware.js";

const router = express.Router();

// All routes require authentication
router.use(verifyJWTToken);

// Get user profile
router.get("/profile", getProfile);

// Update user profile
router.put("/profile", updateProfile);

// Upload avatar
router.post("/avatar", upload.single("avatar"), uploadAvatar);

// Change password
router.put("/password", changePassword);

// Delete account
router.delete("/account", deleteAccount);

// Get purchase status for multiple items
router.post("/purchase-status", getPurchaseStatus);

export default router;





