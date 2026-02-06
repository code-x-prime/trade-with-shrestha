import { prisma } from "../config/db.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiResponsive } from "../utils/ApiResponsive.js";
import sendEmail from "../utils/sendEmail.js";

// ─── Public: get upcoming active slots ───
export const getUpcomingSlots = asyncHandler(async (req, res) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const slots = await prisma.mockInterviewSlot.findMany({
    where: { isActive: true, slotDate: { gte: today } },
    orderBy: [{ slotDate: "asc" }, { sortOrder: "asc" }],
    include: {
      _count: { select: { bookings: true } },
    },
  });
  const list = slots.map((s) => ({
    id: s.id,
    slotDate: s.slotDate,
    startTime: s.startTime,
    endTime: s.endTime,
    meetingLink: s.meetingLink,
    price: s.price,
    currency: s.currency,
    maxBookings: s.maxBookings,
    bookedCount: s._count.bookings,
    isAvailable: s.maxBookings == null || s._count.bookings < s.maxBookings,
  }));
  return res.status(200).json(new ApiResponsive(200, list, "Slots fetched"));
});

// ─── Public: book a slot (guest or logged-in) ───
export const bookSlot = asyncHandler(async (req, res) => {
  const { slotId, name, email, phone, message } = req.body;
  const userId = req.user?.id || null;
  if (!slotId || !name || !email || !phone) {
    return res.status(400).json({
      success: false,
      message: "Slot, name, email and phone are required",
    });
  }
  const slot = await prisma.mockInterviewSlot.findFirst({
    where: { id: slotId, isActive: true },
    include: { _count: { select: { bookings: true } } },
  });
  if (!slot) {
    return res.status(404).json({ success: false, message: "Slot not found or inactive" });
  }
  if (slot.maxBookings != null && slot._count.bookings >= slot.maxBookings) {
    return res.status(400).json({ success: false, message: "This slot is full" });
  }
  const booking = await prisma.mockInterviewBooking.create({
    data: {
      slotId,
      name: String(name).trim(),
      email: String(email).trim(),
      phone: String(phone).trim(),
      message: message ? String(message).trim() : null,
      userId,
      status: "PENDING",
    },
    include: { slot: true },
  });
  return res.status(201).json(new ApiResponsive(201, booking, "Booking submitted"));
});

// ─── Public: check if user already booked (by email or userId) ───
export const getMyBookings = asyncHandler(async (req, res) => {
  const email = req.query.email;
  const userId = req.user?.id;
  const where = {};
  if (userId) where.userId = userId;
  else if (email) where.email = String(email).trim();
  else {
    return res.status(200).json(new ApiResponsive(200, [], "No identifier"));
  }
  const list = await prisma.mockInterviewBooking.findMany({
    where,
    include: { slot: true },
    orderBy: { createdAt: "desc" },
  });
  return res.status(200).json(new ApiResponsive(200, list, "Bookings fetched"));
});

// ─── Admin: list slots ───
export const adminGetSlots = asyncHandler(async (req, res) => {
  const slots = await prisma.mockInterviewSlot.findMany({
    orderBy: [{ slotDate: "asc" }, { sortOrder: "asc" }],
    include: { _count: { select: { bookings: true } } },
  });
  return res.status(200).json(new ApiResponsive(200, slots, "Slots fetched"));
});

// ─── Admin: create slot ───
export const adminCreateSlot = asyncHandler(async (req, res) => {
  const { slotDate, startTime, endTime, meetingLink, price, currency, isActive, maxBookings, sortOrder } = req.body;
  const slot = await prisma.mockInterviewSlot.create({
    data: {
      slotDate: new Date(slotDate),
      startTime: startTime || "10:00 AM",
      endTime: endTime || null,
      meetingLink: meetingLink || null,
      price: Number(price) || 0,
      currency: currency || "INR",
      isActive: isActive !== false,
      maxBookings: maxBookings != null ? Number(maxBookings) : null,
      sortOrder: Number(sortOrder) || 0,
    },
  });
  return res.status(201).json(new ApiResponsive(201, slot, "Slot created"));
});

// ─── Admin: update slot ───
export const adminUpdateSlot = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { slotDate, startTime, endTime, meetingLink, price, currency, isActive, maxBookings, sortOrder } = req.body;
  const data = {};
  if (slotDate != null) data.slotDate = new Date(slotDate);
  if (startTime != null) data.startTime = startTime;
  if (endTime !== undefined) data.endTime = endTime || null;
  if (meetingLink !== undefined) data.meetingLink = meetingLink || null;
  if (price != null) data.price = Number(price);
  if (currency != null) data.currency = currency;
  if (isActive !== undefined) data.isActive = Boolean(isActive);
  if (maxBookings !== undefined) data.maxBookings = maxBookings == null || maxBookings === "" ? null : Number(maxBookings);
  if (sortOrder != null) data.sortOrder = Number(sortOrder);
  const slot = await prisma.mockInterviewSlot.update({ where: { id }, data });
  return res.status(200).json(new ApiResponsive(200, slot, "Slot updated"));
});

// ─── Admin: delete slot ───
export const adminDeleteSlot = asyncHandler(async (req, res) => {
  await prisma.mockInterviewSlot.delete({ where: { id: req.params.id } });
  return res.status(200).json(new ApiResponsive(200, null, "Slot deleted"));
});

// ─── Admin: list bookings ───
export const adminGetBookings = asyncHandler(async (req, res) => {
  const { slotId, status } = req.query;
  const where = {};
  if (slotId) where.slotId = slotId;
  if (status) where.status = status;
  const list = await prisma.mockInterviewBooking.findMany({
    where,
    include: { slot: true },
    orderBy: { createdAt: "desc" },
  });
  return res.status(200).json(new ApiResponsive(200, list, "Bookings fetched"));
});

// ─── Admin: update booking status ───
export const adminUpdateBookingStatus = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;
  const allowed = ["PENDING", "CONFIRMED", "CANCELLED", "COMPLETED"];
  if (!allowed.includes(status)) {
    return res.status(400).json({ success: false, message: "Invalid status" });
  }
  const booking = await prisma.mockInterviewBooking.update({
    where: { id },
    data: { status },
    include: { slot: true },
  });

  // Send email to user about status update
  try {
    const statusLabel = { CONFIRMED: "Confirmed", CANCELLED: "Cancelled", COMPLETED: "Completed", PENDING: "Pending" }[status] || status;
    const slotDate = booking.slot?.slotDate
      ? new Date(booking.slot.slotDate).toLocaleDateString("en-IN", { weekday: "short", day: "2-digit", month: "short", year: "numeric" })
      : "";
    const slotTime = booking.slot?.startTime || "";
    const subject = `Mock Interview – ${statusLabel}`;
    const html = `
      <p>Hi ${booking.name},</p>
      <p>Your mock interview booking status has been updated. Your progress has been recorded.</p>
      <p><strong>Status:</strong> ${statusLabel}</p>
      ${slotDate ? `<p><strong>Slot:</strong> ${slotDate} at ${slotTime}</p>` : ""}
      <p>Thank you,<br/>Shrestha Academy</p>
    `;
    await sendEmail({
      email: booking.email,
      subject,
      html,
    });
  } catch (err) {
    console.error("Mock interview status email failed:", err?.message || err);
    // Don't fail the API – status is already updated
  }

  return res.status(200).json(new ApiResponsive(200, booking, "Status updated"));
});
