import { prisma } from "../config/db.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponsive } from "../utils/ApiResponsive.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { sendEmail } from "../utils/email.js";
import { getContactAdminTemplate, getContactUserTemplate } from "../email/templates/emailTemplates.js";
/**
 * Contact form submission
 */
export const contactController = asyncHandler(async (req, res) => {
    const { name, email, subject, message, phone } = req.body;

    if (!name || !email || !subject || !message || !phone) {
        throw new ApiError(400, "Name, email, phone, subject, and message are required");
    }

    // Save to database
    let contact;
    try {
        contact = await prisma.contact.create({
            data: {
                name,
                email,
                phone,
                subject,
                message
            }
        });
    } catch (error) {
        console.error("Error saving contact to DB:", error);
        // Continue to send email even if DB save fails, or throw? 
        // Better to throw so user knows something went wrong, but for now we log and proceed
    }

    // Send email to admin
    try {
        await sendEmail({
            email: process.env.ADMIN_EMAIL || process.env.FROM_EMAIL,
            subject: `New Contact Inquiry: ${subject}`,
            html: getContactAdminTemplate({
                name,
                email,
                phone,
                subject,
                message,
                id: contact?.id
            }),
        });

        // Send confirmation email to user
        await sendEmail({
            email,
            subject: "We've Received Your Message - Shrestha Academy",
            html: getContactUserTemplate({
                name,
                subject
            }),
        });
    } catch (error) {
        console.error("Error sending contact email:", error);
    }

    res.status(200).json(
        new ApiResponsive(200, contact, "Message sent successfully. We'll get back to you soon!")
    );
});

/**
 * Get all contacts (Admin)
 */
export const getAllContacts = asyncHandler(async (req, res) => {
    const { page = 1, limit = 10, search, status } = req.query;
    const skip = (page - 1) * limit;

    const where = {};
    if (search) {
        where.OR = [
            { name: { contains: search, mode: 'insensitive' } },
            { email: { contains: search, mode: 'insensitive' } },
            { subject: { contains: search, mode: 'insensitive' } },
        ];
    }
    if (status === 'unread') {
        where.isRead = false;
    } else if (status === 'read') {
        where.isRead = true;
    }

    const [contacts, total] = await Promise.all([
        prisma.contact.findMany({
            where,
            skip: parseInt(skip),
            take: parseInt(limit),
            orderBy: { createdAt: 'desc' }
        }),
        prisma.contact.count({ where })
    ]);

    res.status(200).json(
        new ApiResponsive(200, {
            contacts,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total,
                pages: Math.ceil(total / limit)
            }
        }, "Contacts retrieved successfully")
    );
});

/**
 * Mark contact as read (Admin)
 */
export const markContactAsRead = asyncHandler(async (req, res) => {
    const { id } = req.params;

    const contact = await prisma.contact.update({
        where: { id },
        data: { isRead: true }
    });

    res.status(200).json(
        new ApiResponsive(200, contact, "Contact marked as read")
    );
});

/**
 * Delete contact (Admin)
 */
export const deleteContact = asyncHandler(async (req, res) => {
    const { id } = req.params;

    await prisma.contact.delete({
        where: { id }
    });

    res.status(200).json(
        new ApiResponsive(200, null, "Contact deleted successfully")
    );
});

