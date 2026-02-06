import { prisma } from "../config/db.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiResponsive } from "../utils/ApiResponsive.js";
import sendEmail from "../utils/sendEmail.js";

function generateOtp() {
  return String(Math.floor(100000 + Math.random() * 900000));
}

// Public: register for placement training (sends email OTP)
export const registerPlacementTraining = asyncHandler(async (req, res) => {
  const { name, email, countryCode, whatsappNumber, course, notes } = req.body;
  if (!name?.trim() || !email?.trim() || !whatsappNumber?.trim() || !course?.trim()) {
    return res
      .status(400)
      .json(new ApiResponsive(400, null, "Name, email, WhatsApp number and course are required"));
  }

  const otpCode = generateOtp();
  const otpExpiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

  const record = await prisma.placementTrainingRegistration.create({
    data: {
      name: String(name).trim(),
      email: String(email).trim().toLowerCase(),
      countryCode: (countryCode ? String(countryCode).trim() : "+91") || "+91",
      whatsappNumber: String(whatsappNumber).trim(),
      course: String(course).trim(),
      notes: notes ? String(notes).trim() : null,
      otpCode,
      otpExpiresAt,
      isVerified: false,
      source: "placement-training",
    },
  });

  // Email OTP to user
  try {
    await sendEmail({
      email: record.email,
      subject: "Verify your registration – Placement Training (OTP)",
      html: `
        <p>Hi ${record.name},</p>
        <p>Your OTP for Placement Training registration is:</p>
        <p style="font-size:22px; font-weight:700; letter-spacing:2px;">${otpCode}</p>
        <p>This OTP is valid for <strong>10 minutes</strong>.</p>
        <p>Thanks,<br/>Shrestha Academy</p>
      `,
    });
  } catch (err) {
    console.error("Placement training OTP email failed:", err?.message || err);
  }

  // Notify admin
  try {
    const adminEmail = process.env.ADMIN_EMAIL || process.env.FROM_EMAIL;
    if (adminEmail) {
      await sendEmail({
        email: adminEmail,
        subject: `[Placement Training] New registration – ${record.name}`,
        html: `
          <p><strong>New Placement Training registration</strong></p>
          <p><strong>Name:</strong> ${record.name}</p>
          <p><strong>Email:</strong> ${record.email}</p>
          <p><strong>WhatsApp:</strong> ${record.countryCode} ${record.whatsappNumber}</p>
          <p><strong>Course:</strong> ${record.course}</p>
          <p><strong>Source:</strong> ${record.source}</p>
          <p><em>${new Date().toLocaleString("en-IN")}</em></p>
        `,
      });
    }
  } catch (err) {
    console.error("Placement training admin email failed:", err?.message || err);
  }

  return res
    .status(201)
    .json(new ApiResponsive(201, { id: record.id, email: record.email }, "OTP sent to email"));
});

// Public: verify email OTP
export const verifyPlacementTrainingOtp = asyncHandler(async (req, res) => {
  const { id, otp } = req.body;
  if (!id || !otp) {
    return res.status(400).json(new ApiResponsive(400, null, "id and otp are required"));
  }
  const record = await prisma.placementTrainingRegistration.findUnique({ where: { id } });
  if (!record) {
    return res.status(404).json(new ApiResponsive(404, null, "Registration not found"));
  }
  if (record.isVerified) {
    return res.status(200).json(new ApiResponsive(200, record, "Already verified"));
  }
  if (!record.otpCode || !record.otpExpiresAt || record.otpExpiresAt < new Date()) {
    return res.status(400).json(new ApiResponsive(400, null, "OTP expired. Please register again."));
  }
  if (String(otp).trim() !== record.otpCode) {
    return res.status(400).json(new ApiResponsive(400, null, "Invalid OTP"));
  }
  const updated = await prisma.placementTrainingRegistration.update({
    where: { id },
    data: { isVerified: true, otpCode: null, otpExpiresAt: null },
  });
  return res.status(200).json(new ApiResponsive(200, updated, "OTP verified"));
});

// Admin: list registrations
export const adminGetPlacementTrainingRegistrations = asyncHandler(async (req, res) => {
  const { search, verified, course } = req.query;
  const where = {};
  if (search?.trim()) {
    where.OR = [
      { name: { contains: search.trim(), mode: "insensitive" } },
      { email: { contains: search.trim(), mode: "insensitive" } },
      { whatsappNumber: { contains: search.trim(), mode: "insensitive" } },
    ];
  }
  if (verified === "true") where.isVerified = true;
  if (verified === "false") where.isVerified = false;
  if (course?.trim()) where.course = course.trim();

  const list = await prisma.placementTrainingRegistration.findMany({
    where,
    orderBy: { createdAt: "desc" },
  });
  return res.status(200).json(new ApiResponsive(200, list, "Registrations fetched"));
});

