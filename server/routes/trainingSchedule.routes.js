import express from "express";
import {
  getUpcomingSchedules,
  getAllSchedules,
  createSchedule,
  updateSchedule,
  deleteSchedule,
} from "../controllers/trainingSchedule.controller.js";
import { verifyJWTToken, isAdmin } from "../middlewares/auth.middleware.js";

const router = express.Router();

router.get("/", getUpcomingSchedules);
router.get("/all", verifyJWTToken, isAdmin, getAllSchedules);
router.post("/", verifyJWTToken, isAdmin, createSchedule);
router.put("/:id", verifyJWTToken, isAdmin, updateSchedule);
router.delete("/:id", verifyJWTToken, isAdmin, deleteSchedule);

export default router;
