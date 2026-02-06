import { prisma } from "../config/db.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiResponsive } from "../utils/ApiResponsive.js";

function slugify(text) {
  return String(text)
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

// Public – list active
export const getActiveExpertPractices = asyncHandler(async (req, res) => {
  const list = await prisma.expertPractice.findMany({
    where: { isActive: true },
    orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }],
  });
  return res.status(200).json(new ApiResponsive(200, list, "List fetched"));
});

// Admin – list all
export const getAllExpertPractices = asyncHandler(async (req, res) => {
  const list = await prisma.expertPractice.findMany({
    orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }],
  });
  return res.status(200).json(new ApiResponsive(200, list, "List fetched"));
});

// Admin – create
export const createExpertPractice = asyncHandler(async (req, res) => {
  const { title, description, price, isFree, isActive, sortOrder } = req.body;
  const slug = slugify(title || "practice") + "-" + Date.now();
  const item = await prisma.expertPractice.create({
    data: {
      title: title || "Practice with expert feedback",
      slug,
      description: description || null,
      price: Number(price) ?? 0,
      isFree: isFree === true,
      isActive: isActive !== false,
      sortOrder: Number(sortOrder) ?? 0,
    },
  });
  return res.status(201).json(new ApiResponsive(201, item, "Created"));
});

// Admin – update
export const updateExpertPractice = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { title, slug: slugInput, description, price, isFree, isActive, sortOrder } = req.body;
  const data = {};
  if (title !== undefined) data.title = title;
  if (slugInput !== undefined) data.slug = slugify(slugInput) || data.slug;
  if (description !== undefined) data.description = description;
  if (price !== undefined) data.price = Number(price);
  if (isFree !== undefined) data.isFree = Boolean(isFree);
  if (isActive !== undefined) data.isActive = Boolean(isActive);
  if (sortOrder !== undefined) data.sortOrder = Number(sortOrder);
  const item = await prisma.expertPractice.update({ where: { id }, data });
  return res.status(200).json(new ApiResponsive(200, item, "Updated"));
});

// Admin – delete
export const deleteExpertPractice = asyncHandler(async (req, res) => {
  const { id } = req.params;
  await prisma.expertPractice.delete({ where: { id } });
  return res.status(200).json(new ApiResponsive(200, null, "Deleted"));
});

// Public – create booking (form submit from practice-with-expert page)
export const createExpertPracticeBooking = asyncHandler(async (req, res) => {
  const { expertPracticeId, name, email, phone, message } = req.body;
  if (!expertPracticeId || !name || !email) {
    return res.status(400).json(new ApiResponsive(400, null, "expertPracticeId, name and email are required"));
  }
  const practice = await prisma.expertPractice.findFirst({ where: { id: expertPracticeId, isActive: true } });
  if (!practice) {
    return res.status(400).json(new ApiResponsive(400, null, "Invalid or inactive practice option"));
  }
  const booking = await prisma.expertPracticeBooking.create({
    data: {
      expertPracticeId,
      name: String(name).trim(),
      email: String(email).trim(),
      phone: phone ? String(phone).trim() : null,
      message: message ? String(message).trim() : null,
    },
    include: { expertPractice: { select: { title: true } } },
  });
  return res.status(201).json(new ApiResponsive(201, booking, "Booking submitted"));
});

// Admin – list all bookings
export const getAllExpertPracticeBookings = asyncHandler(async (req, res) => {
  const list = await prisma.expertPracticeBooking.findMany({
    orderBy: { createdAt: "desc" },
    include: { expertPractice: { select: { id: true, title: true, price: true, isFree: true } } },
  });
  return res.status(200).json(new ApiResponsive(200, list, "Bookings fetched"));
});

// Admin – update booking status
export const updateExpertPracticeBookingStatus = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;
  const allowed = ["PENDING", "CONTACTED", "CONVERTED", "CANCELLED"];
  if (!status || !allowed.includes(status)) {
    return res.status(400).json(new ApiResponsive(400, null, "Valid status required"));
  }
  const booking = await prisma.expertPracticeBooking.update({
    where: { id },
    data: { status },
  });
  return res.status(200).json(new ApiResponsive(200, booking, "Status updated"));
});
