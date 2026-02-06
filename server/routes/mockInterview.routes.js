import express from "express";
import {
  getUpcomingSlots,
  bookSlot,
  getMyBookings,
  adminGetSlots,
  adminCreateSlot,
  adminUpdateSlot,
  adminDeleteSlot,
  adminGetBookings,
  adminUpdateBookingStatus,
} from "../controllers/mockInterview.controller.js";
import { verifyJWTToken, isAdmin, optionalJWTToken } from "../middlewares/auth.middleware.js";

const router = express.Router();

// Public
router.get("/slots", getUpcomingSlots);
router.post("/book", optionalJWTToken, bookSlot);
router.get("/my-bookings", optionalJWTToken, getMyBookings);

// Admin
router.get("/admin/slots", verifyJWTToken, isAdmin, adminGetSlots);
router.post("/admin/slots", verifyJWTToken, isAdmin, adminCreateSlot);
router.put("/admin/slots/:id", verifyJWTToken, isAdmin, adminUpdateSlot);
router.delete("/admin/slots/:id", verifyJWTToken, isAdmin, adminDeleteSlot);
router.get("/admin/bookings", verifyJWTToken, isAdmin, adminGetBookings);
router.patch("/admin/bookings/:id/status", verifyJWTToken, isAdmin, adminUpdateBookingStatus);

export default router;
