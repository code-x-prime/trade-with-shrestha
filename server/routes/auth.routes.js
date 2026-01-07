import express from "express";
import {
  emailSignup,
  verifyOTP,
  login,
  googleAuth,
  forgotPassword,
  resetPassword,
  logout,
  refreshToken,
} from "../controllers/auth.controller.js";
import { verifyJWTToken } from "../middlewares/auth.middleware.js";
import otpRateLimiter from "../middlewares/rateLimiter.js";

const router = express.Router();

router.post("/signup", otpRateLimiter, emailSignup);
router.post("/verify-otp", verifyOTP);
router.post("/login", login);
router.post("/google", googleAuth);
router.post("/forgot-password", otpRateLimiter, forgotPassword);
router.post("/reset-password", resetPassword);
router.post("/logout", verifyJWTToken, logout);
router.post("/refresh-token", refreshToken);

export default router;





