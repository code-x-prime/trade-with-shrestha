import { prisma } from '../config/db.js';
import { getPublicUrl } from '../utils/cloudflare.js';
import {
    generateCourseCertificate,
    generateWebinarCertificate,
    completeWebinarForEnrolledUsers
} from '../utils/certificateGenerator.js';
import { asyncHandler } from '../utils/asyncHandler.js';

// Get user's certificates
export const getMyCertificates = asyncHandler(async (req, res) => {
    const userId = req.user.id;
    const certificates = await prisma.certificate.findMany({
        where: { userId, status: 'GENERATED' },
        orderBy: { issuedAt: 'desc' },
    });

    const enrichedCertificates = await Promise.all(
        certificates.map(async (cert) => {
            let itemDetails = null;
            try {
                switch (cert.type) {
                    case 'COURSE':
                        const course = await prisma.course.findUnique({
                            where: { id: cert.referenceId },
                            select: { id: true, title: true, slug: true, coverImage: true },
                        });
                        itemDetails = course ? { ...course, coverImageUrl: course.coverImage ? getPublicUrl(course.coverImage) : null } : null;
                        break;
                    case 'WEBINAR':
                        const webinar = await prisma.webinar.findUnique({
                            where: { id: cert.referenceId },
                            select: { id: true, title: true, slug: true, image: true },
                        });
                        itemDetails = webinar ? { ...webinar, imageUrl: webinar.image ? getPublicUrl(webinar.image) : null } : null;
                        break;
                    case 'MENTORSHIP':
                        const mentorship = await prisma.mentorship.findUnique({
                            where: { id: cert.referenceId },
                            select: { id: true, title: true, slug: true, image: true },
                        });
                        itemDetails = mentorship ? { ...mentorship, imageUrl: mentorship.image ? getPublicUrl(mentorship.image) : null } : null;
                        break;
                    case 'GUIDANCE':
                        const guidance = await prisma.guidance.findUnique({
                            where: { id: cert.referenceId },
                            select: { id: true, title: true, slug: true, image: true },
                        });
                        itemDetails = guidance ? { ...guidance, imageUrl: guidance.image ? getPublicUrl(guidance.image) : null } : null;
                        break;
                    case 'OFFLINE_BATCH':
                        const offlineBatch = await prisma.offlineBatch.findUnique({
                            where: { id: cert.referenceId },
                            select: { id: true, title: true, coverImage: true },
                        });
                        itemDetails = offlineBatch ? { ...offlineBatch, coverImageUrl: offlineBatch.coverImage ? getPublicUrl(offlineBatch.coverImage) : null } : null;
                        break;
                    case 'BUNDLE':
                        const bundle = await prisma.bundle.findUnique({
                            where: { id: cert.referenceId },
                            select: { id: true, name: true, slug: true, image: true },
                        });
                        itemDetails = bundle ? { title: bundle.name, ...bundle, imageUrl: bundle.image ? getPublicUrl(bundle.image) : null } : null;
                        break;
                }
            } catch (error) {
                console.log(`Error fetching item details for ${cert.type} ${cert.referenceId}:`, error.message);
            }
            return {
                ...cert,
                certificateUrl: cert.certificateUrl ? getPublicUrl(cert.certificateUrl) : null,
                itemDetails
            };
        })
    );
    return res.status(200).json({ success: true, data: enrichedCertificates });
});

// Verify certificate by certificate number (public)
export const verifyCertificate = asyncHandler(async (req, res) => {
    const { certificateNo } = req.params;
    const certificate = await prisma.certificate.findUnique({
        where: { certificateNo },
        include: { user: { select: { id: true, name: true } } },
    });

    if (!certificate) {
        return res.status(404).json({ success: false, message: 'Certificate not found', valid: false });
    }
    if (certificate.status === 'REVOKED') {
        return res.status(200).json({ success: true, valid: false, message: 'Certificate revoked', data: { certificateNo, status: certificate.status } });
    }

    let itemDetails = null;
    if (certificate.type === 'COURSE') {
        itemDetails = await prisma.course.findUnique({ where: { id: certificate.referenceId }, select: { id: true, title: true, slug: true } });
    } else {
        itemDetails = await prisma.webinar.findUnique({ where: { id: certificate.referenceId }, select: { id: true, title: true, slug: true } });
    }

    return res.status(200).json({
        success: true, valid: true,
        data: {
            certificateNo,
            type: certificate.type,
            recipientName: certificate.user.name || 'Anonymous',
            issuedAt: certificate.issuedAt,
            status: certificate.status,
            itemDetails,
            certificateUrlPublic: certificate.certificateUrl ? getPublicUrl(certificate.certificateUrl) : null
        },
    });
});

// Download certificate
export const downloadCertificate = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const userId = req.user.id;
    const certificate = await prisma.certificate.findFirst({ where: { id, userId, status: 'GENERATED' } });

    if (!certificate || !certificate.certificateUrl) {
        return res.status(404).json({ success: false, message: 'Certificate not found' });
    }
    return res.status(200).json({ success: true, data: { downloadUrl: getPublicUrl(certificate.certificateUrl), certificateNo: certificate.certificateNo } });
});

// Admin: Get all certificates
export const getAdminCertificates = asyncHandler(async (req, res) => {
    const { type, status, page = 1, limit = 10, search } = req.query;
    const where = {};
    if (type) where.type = type;
    if (status) where.status = status;
    if (search) where.certificateNo = { contains: search, mode: 'insensitive' };

    const [certificates, total] = await Promise.all([
        prisma.certificate.findMany({
            where,
            include: { user: { select: { id: true, name: true, email: true } } },
            orderBy: { issuedAt: 'desc' },
            skip: (parseInt(page) - 1) * parseInt(limit),
            take: parseInt(limit),
        }),
        prisma.certificate.count({ where }),
    ]);

    const enriched = await Promise.all(certificates.map(async (cert) => {
        let itemDetails = cert.type === 'COURSE'
            ? await prisma.course.findUnique({ where: { id: cert.referenceId }, select: { id: true, title: true, slug: true } })
            : await prisma.webinar.findUnique({ where: { id: cert.referenceId }, select: { id: true, title: true, slug: true } });

        return {
            ...cert,
            certificateUrl: cert.certificateUrl,
            certificateUrlPublic: cert.certificateUrl ? getPublicUrl(cert.certificateUrl) : null,
            itemDetails,
        };
    }));

    return res.status(200).json({
        success: true,
        data: { certificates: enriched, pagination: { page: parseInt(page), limit: parseInt(limit), total, pages: Math.ceil(total / parseInt(limit)) } },
    });
});

// Admin: Get certificate stats
export const getCertificateStats = asyncHandler(async (req, res) => {
    const [total, courseCerts, webinarCerts, revoked] = await Promise.all([
        prisma.certificate.count(),
        prisma.certificate.count({ where: { type: 'COURSE' } }),
        prisma.certificate.count({ where: { type: 'WEBINAR' } }),
        prisma.certificate.count({ where: { status: 'REVOKED' } }),
    ]);
    return res.status(200).json({ success: true, data: { total, courseCerts, webinarCerts, revoked } });
});

// Admin: Revoke certificate
export const revokeCertificate = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const cert = await prisma.certificate.findUnique({ where: { id } });
    if (!cert) return res.status(404).json({ success: false, message: 'Not found' });
    const updated = await prisma.certificate.update({ where: { id }, data: { status: 'REVOKED' } });
    return res.status(200).json({ success: true, message: 'Revoked', data: updated });
});

// Admin: Restore (reactivate) revoked certificate
export const restoreCertificate = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const cert = await prisma.certificate.findUnique({ where: { id } });
    if (!cert) return res.status(404).json({ success: false, message: 'Not found' });
    if (cert.status !== 'REVOKED') return res.status(400).json({ success: false, message: 'Certificate is not revoked' });
    const updated = await prisma.certificate.update({ where: { id }, data: { status: 'GENERATED' } });
    return res.status(200).json({ success: true, message: 'Certificate restored', data: updated });
});

// Admin: Delete certificate permanently
export const deleteCertificate = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const cert = await prisma.certificate.findUnique({ where: { id } });
    if (!cert) return res.status(404).json({ success: false, message: 'Certificate not found' });

    // Delete the PDF from R2 if exists
    if (cert.certificateUrl) {
        try {
            const { deleteFromR2 } = await import('../utils/cloudflare.js');
            await deleteFromR2(cert.certificateUrl);
        } catch (error) {
            console.log('Failed to delete certificate PDF from R2:', error.message);
        }
    }

    await prisma.certificate.delete({ where: { id } });
    return res.status(200).json({ success: true, message: 'Certificate deleted permanently' });
});

// Admin: Regenerate certificate
export const regenerateCertificate = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const cert = await prisma.certificate.findUnique({ where: { id } });
    if (!cert) return res.status(404).json({ success: false, message: 'Not found' });
    await prisma.certificate.delete({ where: { id } });
    const newCert = cert.type === 'COURSE'
        ? await generateCourseCertificate(cert.userId, cert.referenceId)
        : await generateWebinarCertificate(cert.userId, cert.referenceId);
    return res.status(200).json({ success: true, message: 'Regenerated', data: newCert });
});

// Admin: Process webinar completions
export const processWebinarCompletions = asyncHandler(async (req, res) => {
    const { webinarId } = req.params;
    if (webinarId) {
        const result = await completeWebinarForEnrolledUsers(webinarId);
        return res.status(200).json({ success: true, data: result });
    }
    const now = new Date();
    const webinars = await prisma.webinar.findMany({ where: { startDate: { lt: now }, isPublished: true } });
    let processed = 0;
    for (const w of webinars) {
        const end = new Date(w.startDate);
        end.setMinutes(end.getMinutes() + (w.duration || 60));
        if (now > end) { const r = await completeWebinarForEnrolledUsers(w.id); processed += r.processed; }
    }
    return res.status(200).json({ success: true, data: { processed } });
});

// Admin: Get course certificates
export const getCourseCertificates = asyncHandler(async (req, res) => {
    const { courseId } = req.params;
    const [certs, course] = await Promise.all([
        prisma.certificate.findMany({ where: { type: 'COURSE', referenceId: courseId }, include: { user: { select: { id: true, name: true, email: true } } }, orderBy: { issuedAt: 'desc' } }),
        prisma.course.findUnique({ where: { id: courseId }, select: { id: true, title: true, slug: true } }),
    ]);
    return res.status(200).json({ success: true, data: { course, certificates: certs, totalCount: certs.length } });
});

// Admin: Get webinar certificates
export const getWebinarCertificates = asyncHandler(async (req, res) => {
    const { webinarId } = req.params;
    const [certs, webinar] = await Promise.all([
        prisma.certificate.findMany({ where: { type: 'WEBINAR', referenceId: webinarId }, include: { user: { select: { id: true, name: true, email: true } } }, orderBy: { issuedAt: 'desc' } }),
        prisma.webinar.findUnique({ where: { id: webinarId }, select: { id: true, title: true, slug: true } }),
    ]);
    return res.status(200).json({ success: true, data: { webinar, certificates: certs, totalCount: certs.length } });
});

// Admin: Manually generate certificate for a user's course completion
export const adminGenerateCertificateForUser = asyncHandler(async (req, res) => {
    const { userId, courseId } = req.body;

    if (!userId || !courseId) {
        return res.status(400).json({ success: false, message: 'userId and courseId are required' });
    }

    // Check if user and course exist
    const [user, course] = await Promise.all([
        prisma.user.findUnique({
            where: { id: userId },
            select: { id: true, name: true, email: true }
        }),
        prisma.course.findUnique({
            where: { id: courseId },
            select: { id: true, title: true }
        }),
    ]);

    if (!user) {
        return res.status(404).json({ success: false, message: 'User not found' });
    }
    if (!course) {
        return res.status(404).json({ success: false, message: 'Course not found' });
    }

    // Check if certificate already exists
    const existingCert = await prisma.certificate.findUnique({
        where: {
            userId_type_referenceId: {
                userId,
                type: 'COURSE',
                referenceId: courseId,
            },
        },
    });

    if (existingCert) {
        return res.status(400).json({
            success: false,
            message: 'Certificate already exists for this user and course',
            data: existingCert
        });
    }

    // Check if enrollment exists
    const enrollment = await prisma.courseEnrollment.findUnique({
        where: {
            courseId_userId: { courseId, userId },
        },
    });

    if (!enrollment) {
        return res.status(400).json({ success: false, message: 'User is not enrolled in this course' });
    }

    // Create course completion record if not exists
    const existingCompletion = await prisma.courseCompletion.findUnique({
        where: {
            courseId_userId: { courseId, userId },
        },
    });

    if (!existingCompletion) {
        await prisma.courseCompletion.create({
            data: { courseId, userId },
        });
    }

    // Generate certificate
    const certificate = await generateCourseCertificate(userId, courseId);

    // Send email notification to user
    try {
        const sendEmail = (await import('../utils/sendEmail.js')).default;
        const { getPublicUrl } = await import('../utils/cloudflare.js');
        const certificateUrl = getPublicUrl(certificate.certificateUrl);

        await sendEmail({
            email: user.email,
            subject: `🎉 Your Certificate for "${course.title}" is Ready!`,
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                    <h2 style="color: #6366f1;">Congratulations, ${user.name || 'Student'}! 🎉</h2>
                    <p>You have successfully completed the course <strong>"${course.title}"</strong>.</p>
                    <p>Your certificate has been generated and is ready for download.</p>
                    <div style="margin: 30px 0;">
                        <a href="${certificateUrl}" 
                           style="background-color: #6366f1; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
                            📜 Download Your Certificate
                        </a>
                    </div>
                    <p style="color: #666;">Certificate Number: <strong>${certificate.certificateNo}</strong></p>
                    <p style="color: #666; font-size: 12px;">This certificate can be verified at our website.</p>
                    <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
                    <p style="color: #999; font-size: 12px;">Best regards,<br>Shrestha Academy Team</p>
                </div>
            `,
        });
        console.log(`Certificate email sent to ${user.email}`);
    } catch (emailError) {
        console.error('Failed to send certificate email:', emailError);
        // Don't fail the request if email fails
    }

    return res.status(200).json({
        success: true,
        message: 'Certificate generated successfully and email sent to user',
        data: certificate,
    });
});

// =============================================
// CERTIFICATE TEMPLATE MANAGEMENT
// =============================================

// Get all templates
export const getTemplates = asyncHandler(async (req, res) => {
    const templates = await prisma.certificateTemplate.findMany({
        orderBy: { createdAt: 'desc' },
    });

    const enriched = templates.map(t => ({
        ...t,
        signatureUrl: t.signatureUrl ? getPublicUrl(t.signatureUrl) : null,
        stampUrl: t.stampUrl ? getPublicUrl(t.stampUrl) : null,
        logoUrl: t.logoUrl ? getPublicUrl(t.logoUrl) : null,
        backgroundUrl: t.backgroundUrl ? getPublicUrl(t.backgroundUrl) : null,
    }));

    return res.status(200).json({ success: true, data: enriched });
});

// Get template by type
export const getTemplateByType = asyncHandler(async (req, res) => {
    const { type } = req.params;
    const template = await prisma.certificateTemplate.findUnique({
        where: { type },
    });

    if (!template) {
        return res.status(404).json({ success: false, message: 'Template not found' });
    }

    return res.status(200).json({
        success: true,
        data: {
            ...template,
            signatureUrl: template.signatureUrl ? getPublicUrl(template.signatureUrl) : null,
            stampUrl: template.stampUrl ? getPublicUrl(template.stampUrl) : null,
            logoUrl: template.logoUrl ? getPublicUrl(template.logoUrl) : null,
            backgroundUrl: template.backgroundUrl ? getPublicUrl(template.backgroundUrl) : null,
        }
    });
});

// Create or update template
export const upsertTemplate = asyncHandler(async (req, res) => {
    const { type, name, description, issuerName, issuerTitle, footerText, primaryColor, secondaryColor, isActive } = req.body;

    if (!type || !name) {
        return res.status(400).json({ success: false, message: 'Type and name are required' });
    }

    const template = await prisma.certificateTemplate.upsert({
        where: { type },
        create: {
            type,
            name,
            description,
            issuerName: issuerName || 'Shrestha Academy',
            issuerTitle: issuerTitle || 'Platform Director',
            footerText,
            primaryColor: primaryColor || '#6366F1',
            secondaryColor: secondaryColor || '#A5B4FC',
            isActive: isActive !== false,
        },
        update: {
            name,
            description,
            issuerName,
            issuerTitle,
            footerText,
            primaryColor,
            secondaryColor,
            isActive,
        },
    });

    return res.status(200).json({ success: true, message: 'Template saved', data: template });
});

// Update template images (signature, stamp, logo, background)
export const updateTemplateImages = asyncHandler(async (req, res) => {
    const { type } = req.params;
    const { signatureUrl, stampUrl, logoUrl, backgroundUrl } = req.body;

    // Get existing template to check for old images to delete
    const existingTemplate = await prisma.certificateTemplate.findUnique({ where: { type } });

    const updateData = {};
    const imagesToDelete = [];

    // Check each image field and track old ones for deletion
    if (signatureUrl !== undefined) {
        if (existingTemplate?.signatureUrl && existingTemplate.signatureUrl !== signatureUrl) {
            imagesToDelete.push(existingTemplate.signatureUrl);
        }
        updateData.signatureUrl = signatureUrl;
    }
    if (stampUrl !== undefined) {
        if (existingTemplate?.stampUrl && existingTemplate.stampUrl !== stampUrl) {
            imagesToDelete.push(existingTemplate.stampUrl);
        }
        updateData.stampUrl = stampUrl;
    }
    if (logoUrl !== undefined) {
        if (existingTemplate?.logoUrl && existingTemplate.logoUrl !== logoUrl) {
            imagesToDelete.push(existingTemplate.logoUrl);
        }
        updateData.logoUrl = logoUrl;
    }
    if (backgroundUrl !== undefined) {
        if (existingTemplate?.backgroundUrl && existingTemplate.backgroundUrl !== backgroundUrl) {
            imagesToDelete.push(existingTemplate.backgroundUrl);
        }
        updateData.backgroundUrl = backgroundUrl;
    }

    // Delete old images from R2 in background (don't wait)
    if (imagesToDelete.length > 0) {
        const { deleteFromR2 } = await import('../utils/cloudflare.js');
        imagesToDelete.forEach(url => {
            deleteFromR2(url).catch(err => console.log('Failed to delete old image:', err.message));
        });
    }

    // Use upsert to create template if it doesn't exist
    const template = await prisma.certificateTemplate.upsert({
        where: { type },
        create: {
            type,
            name: `${type} Certificate`,
            ...updateData,
        },
        update: updateData,
    });

    return res.status(200).json({ success: true, message: 'Images updated', data: template });
});

// Delete template
export const deleteTemplate = asyncHandler(async (req, res) => {
    const { type } = req.params;
    await prisma.certificateTemplate.delete({ where: { type } });
    return res.status(200).json({ success: true, message: 'Template deleted' });
});

// =============================================
// MANUAL CERTIFICATE GENERATION
// =============================================

// Get eligible items for manual certificate generation
export const getEligibleItems = asyncHandler(async (req, res) => {
    const { type } = req.query;

    let items = [];
    switch (type) {
        case 'COURSE':
            items = await prisma.course.findMany({
                where: { isPublished: true },
                select: { id: true, title: true, slug: true },
                orderBy: { title: 'asc' },
            });
            break;
        case 'WEBINAR':
            items = await prisma.webinar.findMany({
                where: { isPublished: true },
                select: { id: true, title: true, slug: true },
                orderBy: { title: 'asc' },
            });
            break;
        case 'MENTORSHIP':
            items = await prisma.liveMentorshipProgram.findMany({
                where: { status: 'PUBLISHED' },
                select: { id: true, title: true, slug: true },
                orderBy: { title: 'asc' },
            });
            break;
        case 'GUIDANCE':
            items = await prisma.guidance.findMany({
                where: { status: 'ACTIVE' },
                select: { id: true, title: true, slug: true },
                orderBy: { title: 'asc' },
            });
            break;
        case 'OFFLINE_BATCH':
            items = await prisma.offlineBatch.findMany({
                where: { status: { in: ['OPEN', 'FULL', 'CLOSED'] } },
                select: { id: true, title: true, slug: true },
                orderBy: { title: 'asc' },
            });
            break;
        case 'BUNDLE':
            items = await prisma.bundle.findMany({
                where: { isPublished: true },
                select: { id: true, title: true, slug: true },
                orderBy: { title: 'asc' },
            });
            break;
    }

    return res.status(200).json({ success: true, data: items });
});

// Search users for manual generation
export const searchUsersForCertificate = asyncHandler(async (req, res) => {
    const { query } = req.query;

    if (!query || query.length < 2) {
        return res.status(200).json({ success: true, data: [] });
    }

    const users = await prisma.user.findMany({
        where: {
            OR: [
                { name: { contains: query, mode: 'insensitive' } },
                { email: { contains: query, mode: 'insensitive' } },
            ],
        },
        select: { id: true, name: true, email: true },
        take: 10,
    });

    return res.status(200).json({ success: true, data: users });
});

// Generate certificate manually
export const generateManualCertificate = asyncHandler(async (req, res) => {
    const { userId, type, referenceId, customName } = req.body;

    if (!userId || !type || !referenceId) {
        return res.status(400).json({ success: false, message: 'userId, type, and referenceId are required' });
    }

    // Check if certificate already exists
    const existing = await prisma.certificate.findUnique({
        where: {
            userId_type_referenceId: { userId, type, referenceId },
        },
    });

    if (existing) {
        return res.status(400).json({ success: false, message: 'Certificate already exists for this user and item' });
    }

    // Get user and item details
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
        return res.status(404).json({ success: false, message: 'User not found' });
    }

    let itemTitle = '';
    switch (type) {
        case 'COURSE':
            const course = await prisma.course.findUnique({ where: { id: referenceId } });
            itemTitle = course?.title || 'Course';
            break;
        case 'WEBINAR':
            const webinar = await prisma.webinar.findUnique({ where: { id: referenceId } });
            itemTitle = webinar?.title || 'Webinar';
            break;
        case 'MENTORSHIP':
            const mentorship = await prisma.liveMentorshipProgram.findUnique({ where: { id: referenceId } });
            itemTitle = mentorship?.title || 'Mentorship Program';
            break;
        case 'GUIDANCE':
            const guidance = await prisma.guidance.findUnique({ where: { id: referenceId } });
            itemTitle = guidance?.title || '1:1 Guidance';
            break;
        case 'OFFLINE_BATCH':
            const batch = await prisma.offlineBatch.findUnique({ where: { id: referenceId } });
            itemTitle = batch?.title || 'Offline Batch';
            break;
        case 'BUNDLE':
            const bundle = await prisma.bundle.findUnique({ where: { id: referenceId } });
            itemTitle = bundle?.title || 'Bundle';
            break;
    }

    // Get template for this type
    const template = await prisma.certificateTemplate.findUnique({ where: { type } });

    // Generate certificate using the generator utility
    const { generateCertificateWithTemplate } = await import('../utils/certificateGenerator.js');
    const certificate = await generateCertificateWithTemplate({
        userId,
        type,
        referenceId,
        userName: customName || user.name || user.email.split('@')[0],
        itemTitle,
        template,
    });

    // Send email notification to user
    try {
        const sendEmail = (await import('../utils/sendEmail.js')).default;
        const { getPublicUrl } = await import('../utils/cloudflare.js');
        const certificateUrl = getPublicUrl(certificate.certificateUrl);
        const typeLabels = {
            COURSE: 'Course',
            WEBINAR: 'Webinar',
            MENTORSHIP: 'Mentorship Program',
            GUIDANCE: '1:1 Guidance Session',
            OFFLINE_BATCH: 'Offline Training',
            BUNDLE: 'Course Bundle',
        };

        await sendEmail({
            email: user.email,
            subject: `🎉 Congratulations! Your ${typeLabels[type]} Certificate is Ready`,
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                    <div style="text-align: center; padding: 30px 0;">
                        <h1 style="color: #6366F1; margin: 0;">🎓 Certificate Awarded!</h1>
                    </div>
                    <div style="background: #f8f9fa; border-radius: 12px; padding: 30px; margin: 20px 0;">
                        <p style="font-size: 16px; color: #333;">Dear <strong>${customName || user.name || 'Student'}</strong>,</p>
                        <p style="font-size: 16px; color: #333;">
                            Congratulations on completing <strong>"${itemTitle}"</strong>! 
                            Your certificate has been generated and is ready for download.
                        </p>
                        <div style="text-align: center; margin: 30px 0;">
                            <p style="font-size: 14px; color: #666; margin-bottom: 10px;">Certificate Number:</p>
                            <p style="font-size: 20px; font-weight: bold; color: #6366F1; font-family: monospace;">${certificate.certificateNo}</p>
                        </div>
                        <div style="text-align: center;">
                            <a href="${certificateUrl}" style="display: inline-block; background: linear-gradient(135deg, #6366F1, #8B5CF6); color: white; padding: 14px 32px; border-radius: 8px; text-decoration: none; font-weight: bold; font-size: 16px;">
                            📥 Download Certificate
                            </a>
                        </div>
                    </div>
                    <div style="text-align: center; padding: 20px 0; color: #666; font-size: 14px;">
                        <p>You can also verify this certificate at:</p>
                        <p><a href="${process.env.CLIENT_URL}/verify-certificate?certificateNo=${certificate.certificateNo}" style="color: #6366F1;">${process.env.CLIENT_URL}/verify-certificate</a></p>
                    </div>
                    <div style="text-align: center; padding-top: 20px; border-top: 1px solid #eee; color: #999; font-size: 12px;">
                        <p>© ${new Date().getFullYear()} Shrestha Academy. All rights reserved.</p>
                    </div>
                </div>
            `,
        });
        console.log(`Certificate email sent to ${user.email}`);
    } catch (emailError) {
        console.error('Failed to send certificate email:', emailError);
        // Don't fail the request if email fails
    }

    // Add public URL to response
    const { getPublicUrl } = await import('../utils/cloudflare.js');
    const certificateUrlPublic = getPublicUrl(certificate.certificateUrl);

    return res.status(201).json({
        success: true,
        message: 'Certificate generated and email sent',
        data: { ...certificate, certificateUrlPublic }
    });
});

