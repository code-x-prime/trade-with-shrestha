import { prisma } from "../config/db.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiResponsive } from "../utils/ApiResponsive.js";
import sendEmail from "../utils/sendEmail.js";

/**
 * Public: Submit hire-from-us form
 */
export const submitHireRequest = asyncHandler(async (req, res) => {
  const { companyName, contactName, email, phone, hiringRequirements } = req.body;
  if (!companyName?.trim() || !contactName?.trim() || !email?.trim() || !phone?.trim()) {
    return res.status(400).json(
      new ApiResponsive(400, null, "Company name, your name, email and contact number are required")
    );
  }

  const request = await prisma.hireFromUsRequest.create({
    data: {
      companyName: String(companyName).trim(),
      contactName: String(contactName).trim(),
      email: String(email).trim(),
      phone: String(phone).trim(),
      hiringRequirements: hiringRequirements ? String(hiringRequirements).trim() : null,
      source: "hire-from-us",
    },
  });

  // Notify admin by email
  try {
    const adminEmail = process.env.ADMIN_EMAIL || process.env.FROM_EMAIL;
    if (adminEmail) {
      await sendEmail({
        email: adminEmail,
        subject: `[Hire From Us] New request from ${String(contactName).trim()} – ${String(companyName).trim()}`,
        html: `
          <p><strong>New Hire From Us request</strong></p>
          <p><strong>Source:</strong> Hire From Us page</p>
          <p><strong>Company:</strong> ${String(companyName).trim()}</p>
          <p><strong>Contact name:</strong> ${String(contactName).trim()}</p>
          <p><strong>Email:</strong> ${String(email).trim()}</p>
          <p><strong>Phone:</strong> ${phone ? String(phone).trim() : '–'}</p>
          <p><strong>Hiring requirements:</strong></p>
          <p>${hiringRequirements ? String(hiringRequirements).trim().replace(/\n/g, '<br/>') : '–'}</p>
          <p><em>Submitted at ${new Date().toLocaleString('en-IN')}</em></p>
        `,
      });
    }
  } catch (err) {
    console.error("Hire-from-us admin email failed:", err?.message || err);
  }

  return res.status(201).json(
    new ApiResponsive(201, request, "Request submitted. We'll get in touch soon.")
  );
});

/**
 * Admin: List all hire-from-us requests
 */
export const adminGetHireRequests = asyncHandler(async (req, res) => {
  const { search } = req.query;
  const where = {};
  if (search?.trim()) {
    where.OR = [
      { companyName: { contains: search.trim(), mode: "insensitive" } },
      { contactName: { contains: search.trim(), mode: "insensitive" } },
      { email: { contains: search.trim(), mode: "insensitive" } },
    ];
  }
  const list = await prisma.hireFromUsRequest.findMany({
    where,
    orderBy: { createdAt: "desc" },
  });
  return res.status(200).json(new ApiResponsive(200, list, "Hire requests fetched"));
});
