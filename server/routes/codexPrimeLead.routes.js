import express from "express";
import {
  createCodeXPrimeLead,
  getCodeXPrimeLeadsAdmin,
  getCodeXPrimeLeadStats,
  updateCodeXPrimeLeadStatus,
} from "../controllers/codexPrimeLead.controller.js";
import { verifyJWTToken, isAdmin } from "../middlewares/auth.middleware.js";

const router = express.Router();

// Public submit
router.post("/leads", createCodeXPrimeLead);

// Admin
router.get("/leads/admin", verifyJWTToken, isAdmin, getCodeXPrimeLeadsAdmin);
router.get("/leads/admin/stats", verifyJWTToken, isAdmin, getCodeXPrimeLeadStats);
router.patch("/leads/:id/status", verifyJWTToken, isAdmin, updateCodeXPrimeLeadStatus);

export default router;
