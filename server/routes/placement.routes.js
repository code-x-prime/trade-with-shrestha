import express from "express";
import {
  getActivePlacements,
  getAllPlacements,
  createPlacement,
  updatePlacement,
  deletePlacement,
} from "../controllers/placement.controller.js";
import { verifyJWTToken, isAdmin } from "../middlewares/auth.middleware.js";

const router = express.Router();

router.get("/", getActivePlacements);
router.get("/all", verifyJWTToken, isAdmin, getAllPlacements);
router.post("/", verifyJWTToken, isAdmin, createPlacement);
router.put("/:id", verifyJWTToken, isAdmin, updatePlacement);
router.delete("/:id", verifyJWTToken, isAdmin, deletePlacement);

export default router;
