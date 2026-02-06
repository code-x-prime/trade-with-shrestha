import express from "express";
import {
  getActiveExpertPractices,
  getAllExpertPractices,
  createExpertPractice,
  updateExpertPractice,
  deleteExpertPractice,
  createExpertPracticeBooking,
  getAllExpertPracticeBookings,
  updateExpertPracticeBookingStatus,
} from "../controllers/expertPractice.controller.js";
import { verifyJWTToken, isAdmin } from "../middlewares/auth.middleware.js";

const router = express.Router();

router.get("/", getActiveExpertPractices);
router.get("/all", verifyJWTToken, isAdmin, getAllExpertPractices);
router.post("/", verifyJWTToken, isAdmin, createExpertPractice);
router.put("/:id", verifyJWTToken, isAdmin, updateExpertPractice);
router.delete("/:id", verifyJWTToken, isAdmin, deleteExpertPractice);

// Bookings: public submit, admin list + update status
router.post("/bookings", createExpertPracticeBooking);
router.get("/bookings", verifyJWTToken, isAdmin, getAllExpertPracticeBookings);
router.patch("/bookings/:id/status", verifyJWTToken, isAdmin, updateExpertPracticeBookingStatus);

export default router;
