import express from "express";
import {
  getActiveBanners,
  getAllBanners,
  createBanner,
  updateBanner,
  deleteBanner,
} from "../controllers/banner.controller.js";
import { verifyJWTToken, isAdmin } from "../middlewares/auth.middleware.js";

const router = express.Router();

// Public: active banners for homepage
router.get("/active", getActiveBanners);

// Admin
router.get("/", verifyJWTToken, isAdmin, getAllBanners);
router.post("/", verifyJWTToken, isAdmin, createBanner);
router.put("/:id", verifyJWTToken, isAdmin, updateBanner);
router.delete("/:id", verifyJWTToken, isAdmin, deleteBanner);

export default router;
