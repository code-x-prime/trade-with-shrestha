import { prisma } from "../config/db.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiResponsive } from "../utils/ApiResponsive.js";
import sendEmail from "../utils/sendEmail.js";

const ALLOWED_STATUS = ["NEW", "CONTACTED", "CONVERTED", "CLOSED"];

const escapeHtml = (value = "") =>
  String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");

const buildEmailLayout = ({ title, intro, rows, ctaText, ctaHref, footerNote }) => {
  const rowHtml = rows
    .map(
      (row) => `
        <tr>
          <td style="padding:10px 12px;background:#f9fafb;border:1px solid #e5e7eb;font-weight:600;color:#111827;width:180px;">${row.label}</td>
          <td style="padding:10px 12px;background:#ffffff;border:1px solid #e5e7eb;color:#374151;">${row.value}</td>
        </tr>
      `
    )
    .join("");

  const ctaBlock =
    ctaText && ctaHref
      ? `
        <div style="margin-top:20px;">
          <a href="${ctaHref}" style="display:inline-block;padding:10px 16px;background:#B45309;color:#ffffff;text-decoration:none;border-radius:8px;font-weight:600;">
            ${ctaText}
          </a>
        </div>
      `
      : "";

  return `
    <div style="margin:0;padding:24px;background:#f3f4f6;font-family:Arial,sans-serif;">
      <div style="max-width:700px;margin:0 auto;background:#ffffff;border:1px solid #e5e7eb;border-radius:12px;overflow:hidden;">
        <div style="padding:18px 20px;background:#111827;color:#ffffff;">
          <h2 style="margin:0;font-size:20px;line-height:1.3;">${title}</h2>
        </div>
        <div style="padding:20px;">
          <p style="margin:0 0 14px;color:#374151;line-height:1.6;">${intro}</p>
          <table style="width:100%;border-collapse:collapse;border-spacing:0;">
            <tbody>${rowHtml}</tbody>
          </table>
          ${ctaBlock}
          <p style="margin:18px 0 0;color:#6b7280;font-size:12px;line-height:1.5;">${footerNote}</p>
        </div>
      </div>
    </div>
  `;
};

export const createCodeXPrimeLead = asyncHandler(async (req, res) => {
  const { name, email, phone, courseInterest, message, source } = req.body || {};

  if (!name?.trim() || !email?.trim() || !phone?.trim()) {
    return res
      .status(400)
      .json(new ApiResponsive(400, null, "Name, email and phone are required"));
  }

  const lead = await prisma.codeXPrimeLead.create({
    data: {
      name: String(name).trim(),
      email: String(email).trim().toLowerCase(),
      phone: String(phone).trim(),
      courseInterest: courseInterest ? String(courseInterest).trim() : null,
      message: message ? String(message).trim() : null,
      source: source ? String(source).trim() : "codexprime-collab",
    },
  });

  const displayDate = new Date(lead.createdAt).toLocaleString("en-IN");
  const safe = {
    name: escapeHtml(lead.name),
    email: escapeHtml(lead.email),
    phone: escapeHtml(lead.phone),
    courseInterest: escapeHtml(lead.courseInterest || "—"),
    message: escapeHtml(lead.message || "—").replace(/\n/g, "<br/>"),
    createdAt: escapeHtml(displayDate),
  };

  try {
    const adminEmail = process.env.ADMIN_EMAIL || process.env.FROM_EMAIL;
    if (adminEmail) {
      const adminPanelUrl = `${process.env.CLIENT_URL || process.env.FRONTEND_URL || "http://localhost:3000"}/admin/codexprime`;
      await sendEmail({
        email: adminEmail,
        subject: `🔔 New CodeXPrime Lead — ${lead.name}`,
        html: buildEmailLayout({
          title: "NEW CODEXPRIME COLLAB LEAD",
          intro: "A new enquiry has been submitted from the CodeXPrime collaboration page.",
          rows: [
            { label: "Name", value: safe.name },
            { label: "Email", value: safe.email },
            { label: "Phone", value: safe.phone },
            { label: "Interest", value: safe.courseInterest },
            { label: "Message", value: safe.message },
            { label: "Date", value: safe.createdAt },
          ],
          ctaText: "View in Admin",
          ctaHref: adminPanelUrl,
          footerNote: "This is an automated notification from Shrestha Academy.",
        }),
      });
    }
  } catch (err) {
    console.error("CodeXPrime admin email failed:", err?.message || err);
  }

  try {
    await sendEmail({
      email: "codexprime00@gmail.com",
      subject: `New Lead — ${lead.name} | Shrestha Academy × CodeXPrime`,
      html: buildEmailLayout({
        title: "New Lead from Shrestha Academy × CodeXPrime",
        intro: "Hi CodeXPrime Team,<br/>A new lead has arrived from the collaboration page. Please review and follow up within 24 hours.",
        rows: [
          { label: "Name", value: safe.name },
          { label: "Email", value: safe.email },
          { label: "Phone", value: safe.phone },
          { label: "Interest", value: safe.courseInterest },
          { label: "Message", value: safe.message },
          { label: "Date", value: safe.createdAt },
        ],
        ctaText: "Open Collaboration Page",
        ctaHref: `${process.env.CLIENT_URL || process.env.FRONTEND_URL || "http://localhost:3000"}/codexprime#lead-form`,
        footerNote: "— Shrestha Academy Team",
      }),
    });
  } catch (err) {
    console.error("CodeXPrime team email failed:", err?.message || err);
  }

  return res
    .status(201)
    .json(new ApiResponsive(201, { lead }, "Lead submitted successfully"));
});

export const getCodeXPrimeLeadsAdmin = asyncHandler(async (req, res) => {
  const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
  const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 10, 1), 100);
  const skip = (page - 1) * limit;

  const month = parseInt(req.query.month, 10);
  const year = parseInt(req.query.year, 10);
  const status = req.query.status?.trim();
  const search = req.query.search?.trim();

  const where = {};

  if (!Number.isNaN(month) && month >= 1 && month <= 12 && !Number.isNaN(year)) {
    const start = new Date(year, month - 1, 1, 0, 0, 0, 0);
    const end = new Date(year, month, 1, 0, 0, 0, 0);
    where.createdAt = { gte: start, lt: end };
  } else if (!Number.isNaN(year) && year >= 2000) {
    const start = new Date(year, 0, 1, 0, 0, 0, 0);
    const end = new Date(year + 1, 0, 1, 0, 0, 0, 0);
    where.createdAt = { gte: start, lt: end };
  }

  if (status && status !== "ALL" && ALLOWED_STATUS.includes(status)) {
    where.status = status;
  }

  if (search) {
    where.OR = [
      { name: { contains: search, mode: "insensitive" } },
      { email: { contains: search, mode: "insensitive" } },
      { phone: { contains: search, mode: "insensitive" } },
    ];
  }

  const [total, leads] = await Promise.all([
    prisma.codeXPrimeLead.count({ where }),
    prisma.codeXPrimeLead.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
    }),
  ]);

  return res.status(200).json(
    new ApiResponsive(200, {
      leads,
      total,
      page,
      totalPages: Math.max(1, Math.ceil(total / limit)),
      limit,
    }, "CodeXPrime leads fetched")
  );
});

export const getCodeXPrimeLeadStats = asyncHandler(async (_req, res) => {
  const [total, newCount, contacted, converted, closed] = await Promise.all([
    prisma.codeXPrimeLead.count(),
    prisma.codeXPrimeLead.count({ where: { status: "NEW" } }),
    prisma.codeXPrimeLead.count({ where: { status: "CONTACTED" } }),
    prisma.codeXPrimeLead.count({ where: { status: "CONVERTED" } }),
    prisma.codeXPrimeLead.count({ where: { status: "CLOSED" } }),
  ]);

  return res.status(200).json(
    new ApiResponsive(200, {
      total,
      new: newCount,
      contacted,
      converted,
      closed,
    }, "CodeXPrime lead stats fetched")
  );
});

export const updateCodeXPrimeLeadStatus = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { status } = req.body || {};

  if (!status || !ALLOWED_STATUS.includes(status)) {
    return res
      .status(400)
      .json(new ApiResponsive(400, null, "Invalid status"));
  }

  const updated = await prisma.codeXPrimeLead.update({
    where: { id },
    data: { status },
  });

  return res
    .status(200)
    .json(new ApiResponsive(200, { lead: updated }, "Status updated"));
});
