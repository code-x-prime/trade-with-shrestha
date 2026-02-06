import express from "express";
import {
  submitDemoRequest,
  getAllDemoRequests,
  updateDemoRequestStatus,
} from "../controllers/demoRequest.controller.js";
import { verifyJWTToken, isAdmin, optionalJWTToken } from "../middlewares/auth.middleware.js";

const router = express.Router();

router.post("/", optionalJWTToken, submitDemoRequest); // public; optional auth to attach userId if logged in
router.get("/", verifyJWTToken, isAdmin, getAllDemoRequests);
router.patch("/:id/status", verifyJWTToken, isAdmin, updateDemoRequestStatus);

export default router;
