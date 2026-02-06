import { prisma } from "../config/db.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { sendEmail } from "../utils/email.js";
import { getDemoRequestAdminTemplate, getDemoRequestUserTemplate } from "../email/templates/emailTemplates.js";

export const submitDemoRequest = asyncHandler(async (req, res) => {
  const { name, email, phone, courseId, message } = req.body;
  const userId = req.user?.id || null;
  if (!name || !email || !phone) {
    return res.status(400).json({ success: false, message: "Name, email and phone are required" });
  }
  const record = await prisma.demoRequest.create({
    data: {
      name: String(name).trim(),
      email: String(email).trim(),
      phone: String(phone).trim(),
      courseId: courseId || null,
      message: message ? String(message).trim() : null,
      userId,
      status: "PENDING",
    },
  });

  const adminEmail = process.env.ADMIN_EMAIL || process.env.FROM_EMAIL;
  const payload = {
    id: record.id,
    name: record.name,
    email: record.email,
    phone: record.phone,
    courseId: record.courseId,
    message: record.message,
    status: record.status,
    createdAt: record.createdAt,
  };

  if (adminEmail) {
    try {
      await sendEmail({
        email: adminEmail,
        subject: `New Demo Request: ${record.name}`,
        html: getDemoRequestAdminTemplate(payload),
      });
    } catch (err) {
      console.error("Demo request: failed to send admin email", err?.message || err);
    }
  }

  try {
    await sendEmail({
      email: record.email,
      subject: "We Received Your Demo Request – Shrestha Academy",
      html: getDemoRequestUserTemplate({ name: record.name }),
    });
  } catch (err) {
    console.error("Demo request: failed to send user confirmation email", err?.message || err);
  }

  return res.status(201).json({ success: true, data: record, message: "Demo request submitted" });
});

export const getAllDemoRequests = asyncHandler(async (req, res) => {
  const { status } = req.query;
  const where = {};
  if (status) where.status = status;
  const list = await prisma.demoRequest.findMany({
    where,
    orderBy: { createdAt: "desc" },
  });
  return res.status(200).json({ success: true, data: list });
});

export const updateDemoRequestStatus = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;
  const allowed = ["PENDING", "CONTACTED", "CONVERTED", "CANCELLED"];
  if (!status || !allowed.includes(status)) {
    return res.status(400).json({ success: false, message: "Invalid status" });
  }
  const updated = await prisma.demoRequest.update({
    where: { id },
    data: { status },
  });
  return res.status(200).json({ success: true, data: updated });
});
