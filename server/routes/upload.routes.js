import express from "express";
import {
  uploadToR2Controller,
  deleteFromR2Controller,
  getSignedUrl,
} from "../controllers/upload.controller.js";
import { verifyJWTToken, isAdmin } from "../middlewares/auth.middleware.js";
import { uploadSingle } from "../middlewares/upload.middleware.js";

const router = express.Router();

// Authenticated routes
router.post("/", verifyJWTToken, uploadSingle("file"), uploadToR2Controller);
router.delete("/", verifyJWTToken, isAdmin, deleteFromR2Controller);
router.get("/signed-url", verifyJWTToken, getSignedUrl);

export default router;
