import PDFDocument from 'pdfkit';
import { uploadBufferToR2 } from './cloudflare.js';
import { prisma } from '../config/db.js';
import crypto from 'crypto';

/**
 * Generate a unique certificate number
 */
const generateCertificateNumber = () => {
    const timestamp = Date.now().toString(36).toUpperCase();
    const random = crypto.randomBytes(4).toString('hex').toUpperCase();
    return `CERT-${timestamp}-${random}`;
};

/**
 * Format date for certificate display
 */
const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
    });
};

/**
 * Generate certificate PDF
 */
const generateCertificatePDF = async (data) => {
    return new Promise((resolve, reject) => {
        try {
            const doc = new PDFDocument({
                layout: 'landscape',
                size: 'A4',
                margin: 0,
            });

            const chunks = [];
            doc.on('data', (chunk) => chunks.push(chunk));
            doc.on('end', () => resolve(Buffer.concat(chunks)));
            doc.on('error', reject);

            const pageWidth = doc.page.width;
            const pageHeight = doc.page.height;

            // Background gradient effect with colors
            doc.rect(0, 0, pageWidth, pageHeight)
                .fill('#FAFAFA');

            // Decorative border
            const borderMargin = 30;
            doc.rect(borderMargin, borderMargin, pageWidth - borderMargin * 2, pageHeight - borderMargin * 2)
                .lineWidth(3)
                .stroke('#6366F1');

            // Inner decorative border
            doc.rect(borderMargin + 10, borderMargin + 10, pageWidth - (borderMargin + 10) * 2, pageHeight - (borderMargin + 10) * 2)
                .lineWidth(1)
                .stroke('#A5B4FC');

            // Corner decorations
            const cornerSize = 40;
            const corners = [
                [borderMargin + 20, borderMargin + 20],
                [pageWidth - borderMargin - 20 - cornerSize, borderMargin + 20],
                [borderMargin + 20, pageHeight - borderMargin - 20 - cornerSize],
                [pageWidth - borderMargin - 20 - cornerSize, pageHeight - borderMargin - 20 - cornerSize],
            ];

            corners.forEach(([x, y]) => {
                doc.rect(x, y, cornerSize, cornerSize)
                    .lineWidth(2)
                    .stroke('#6366F1');
            });

            // Logo/Brand area at top
            doc.fontSize(14)
                .font('Helvetica-Bold')
                .fillColor('#6366F1')
                .text('Shrestha Academy', 0, 60, { align: 'center', width: pageWidth });

            // Certificate title
            doc.fontSize(42)
                .font('Helvetica-Bold')
                .fillColor('#1F2937')
                .text('CERTIFICATE', 0, 100, { align: 'center', width: pageWidth });

            doc.fontSize(20)
                .font('Helvetica')
                .fillColor('#6B7280')
                .text('OF COMPLETION', 0, 150, { align: 'center', width: pageWidth });

            // Decorative line
            const lineY = 185;
            doc.moveTo(pageWidth / 2 - 100, lineY)
                .lineTo(pageWidth / 2 + 100, lineY)
                .lineWidth(2)
                .stroke('#6366F1');

            // "This is to certify that" text
            doc.fontSize(14)
                .font('Helvetica')
                .fillColor('#6B7280')
                .text('This is to certify that', 0, 210, { align: 'center', width: pageWidth });

            // Recipient name
            doc.fontSize(32)
                .font('Helvetica-Bold')
                .fillColor('#1F2937')
                .text(data.userName, 0, 240, { align: 'center', width: pageWidth });

            // Underline for name
            const nameWidth = doc.widthOfString(data.userName);
            doc.moveTo((pageWidth - nameWidth) / 2 - 20, 280)
                .lineTo((pageWidth + nameWidth) / 2 + 20, 280)
                .lineWidth(1)
                .stroke('#D1D5DB');

            // "has successfully completed" text
            doc.fontSize(14)
                .font('Helvetica')
                .fillColor('#6B7280')
                .text('has successfully completed the', 0, 300, { align: 'center', width: pageWidth });

            // Course/Webinar type
            const typeLabel = data.type === 'COURSE' ? 'Course' : 'Webinar';
            doc.fontSize(14)
                .font('Helvetica-Bold')
                .fillColor('#6366F1')
                .text(typeLabel.toUpperCase(), 0, 320, { align: 'center', width: pageWidth });

            // Course/Webinar title
            doc.fontSize(24)
                .font('Helvetica-Bold')
                .fillColor('#1F2937')
                .text(`"${data.title}"`, 0, 345, { align: 'center', width: pageWidth });

            // Issue date and certificate number
            doc.fontSize(11)
                .font('Helvetica')
                .fillColor('#6B7280')
                .text(`Issued on: ${formatDate(data.issuedAt)}`, 0, 400, { align: 'center', width: pageWidth });

            doc.fontSize(10)
                .font('Helvetica')
                .fillColor('#9CA3AF')
                .text(`Certificate No: ${data.certificateNo}`, 0, 420, { align: 'center', width: pageWidth });

            // Signature area
            const signatureY = 460;

            // Left signature (Instructor/Platform)
            doc.moveTo(150, signatureY)
                .lineTo(300, signatureY)
                .lineWidth(1)
                .stroke('#D1D5DB');

            doc.fontSize(12)
                .font('Helvetica-Bold')
                .fillColor('#1F2937')
                .text('Shrestha Academy', 150, signatureY + 10, { width: 150, align: 'center' });

            doc.fontSize(10)
                .font('Helvetica')
                .fillColor('#6B7280')
                .text('Platform', 150, signatureY + 28, { width: 150, align: 'center' });

            // Right signature (Verification)
            doc.moveTo(pageWidth - 300, signatureY)
                .lineTo(pageWidth - 150, signatureY)
                .lineWidth(1)
                .stroke('#D1D5DB');

            doc.fontSize(12)
                .font('Helvetica-Bold')
                .fillColor('#1F2937')
                .text('Verified', pageWidth - 300, signatureY + 10, { width: 150, align: 'center' });

            doc.fontSize(10)
                .font('Helvetica')
                .fillColor('#6B7280')
                .text('Digital Certificate', pageWidth - 300, signatureY + 28, { width: 150, align: 'center' });

            // Footer
            doc.fontSize(9)
                .font('Helvetica')
                .fillColor('#9CA3AF')
                .text('This certificate verifies the successful completion of the above-mentioned program.', 0, pageHeight - 60, { align: 'center', width: pageWidth });

            doc.fontSize(8)
                .text('Verify at: ' + process.env.CLIENT_URL + '/verify-certificate?certificateNo=' + data.certificateNo, 0, pageHeight - 45, { align: 'center', width: pageWidth });

            doc.end();
        } catch (error) {
            reject(error);
        }
    });
};

/**
 * Generate and save certificate for course completion
 * Uses the template from database with logo, signature, stamp
 */
export const generateCourseCertificate = async (userId, courseId) => {
    try {
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
            console.log(`Certificate already exists for user ${userId} and course ${courseId}`);
            return existingCert;
        }

        // Get user, course, and template details
        const [user, course, template] = await Promise.all([
            prisma.user.findUnique({ where: { id: userId } }),
            prisma.course.findUnique({ where: { id: courseId } }),
            prisma.certificateTemplate.findUnique({ where: { type: 'COURSE' } }),
        ]);

        if (!user || !course) {
            throw new Error('User or course not found');
        }

        const userName = user.name || user.email.split('@')[0];
        const itemTitle = course.title;

        // Use template-based generation if available, otherwise fallback to basic
        const certificate = await generateCertificateWithTemplate({
            userId,
            type: 'COURSE',
            referenceId: courseId,
            userName,
            itemTitle,
            template, // Can be null, function handles fallback
        });

        console.log(`Certificate generated for course ${courseId} for user ${userId}: ${certificate.certificateNo}`);
        return certificate;
    } catch (error) {
        console.error('Error generating course certificate:', error);
        throw error;
    }
};

/**
 * Generate and save certificate for webinar completion
 * Uses the template from database with logo, signature, stamp
 */
export const generateWebinarCertificate = async (userId, webinarId) => {
    try {
        // Check if certificate already exists
        const existingCert = await prisma.certificate.findUnique({
            where: {
                userId_type_referenceId: {
                    userId,
                    type: 'WEBINAR',
                    referenceId: webinarId,
                },
            },
        });

        if (existingCert) {
            console.log(`Certificate already exists for user ${userId} and webinar ${webinarId}`);
            return existingCert;
        }

        // Get user, webinar, and template details
        const [user, webinar, template] = await Promise.all([
            prisma.user.findUnique({ where: { id: userId } }),
            prisma.webinar.findUnique({ where: { id: webinarId } }),
            prisma.certificateTemplate.findUnique({ where: { type: 'WEBINAR' } }),
        ]);

        if (!user || !webinar) {
            throw new Error('User or webinar not found');
        }

        const userName = user.name || user.email.split('@')[0];
        const itemTitle = webinar.title;

        // Use template-based generation if available, otherwise fallback to basic
        const certificate = await generateCertificateWithTemplate({
            userId,
            type: 'WEBINAR',
            referenceId: webinarId,
            userName,
            itemTitle,
            template, // Can be null, function handles fallback
        });

        console.log(`Certificate generated for webinar ${webinarId} for user ${userId}: ${certificate.certificateNo}`);
        return certificate;
    } catch (error) {
        console.error('Error generating webinar certificate:', error);
        throw error;
    }
};

/**
 * Check if user has completed course (all published chapters >= 90%)
 */
export const checkAndCompleteCourse = async (userId, courseId) => {
    try {
        // Check if already completed
        const existingCompletion = await prisma.courseCompletion.findUnique({
            where: {
                courseId_userId: { courseId, userId },
            },
        });

        if (existingCompletion) {
            return { completed: true, isNew: false };
        }

        // Get enrollment
        const enrollment = await prisma.courseEnrollment.findUnique({
            where: {
                courseId_userId: { courseId, userId },
            },
        });

        if (!enrollment) {
            return { completed: false, isNew: false };
        }

        // Get all published chapters for this course
        const publishedChapters = await prisma.courseChapter.findMany({
            where: {
                session: {
                    courseId,
                },
                isPublished: true,
            },
            orderBy: {
                order: 'asc',
            },
        });

        if (publishedChapters.length === 0) {
            console.log(`No published chapters found for course ${courseId}`);
            return { completed: false, isNew: false };
        }

        // Fetch fresh progress data for all chapters
        const chapterProgresses = await prisma.chapterProgress.findMany({
            where: {
                enrollmentId: enrollment.id,
                chapterId: {
                    in: publishedChapters.map(ch => ch.id),
                },
            },
        });

        // Check if all chapters are >= 90% completed or marked as completed
        const completedChapters = chapterProgresses.filter(p =>
            p.progress >= 90 || p.completed === true
        );

        console.log(`Course ${courseId} - Published: ${publishedChapters.length}, Completed: ${completedChapters.length}, Total Progress Records: ${chapterProgresses.length}`);

        // Course is complete if all published chapters are completed
        const allCompleted = completedChapters.length >= publishedChapters.length;

        if (allCompleted) {
            // Create course completion
            await prisma.courseCompletion.create({
                data: {
                    courseId,
                    userId,
                },
            });

            // Generate certificate (this also sends certificate email)
            await generateCourseCertificate(userId, courseId);

            // Send review request email (separate from certificate email)
            try {
                const [user, course] = await Promise.all([
                    prisma.user.findUnique({ where: { id: userId }, select: { email: true, name: true } }),
                    prisma.course.findUnique({ where: { id: courseId }, select: { title: true, slug: true } }),
                ]);

                // Check if user already has a review for this course
                const existingReview = await prisma.courseReview.findUnique({
                    where: { userId_courseId: { userId, courseId } },
                });

                if (user?.email && course && !existingReview) {
                    const sendEmail = (await import('./sendEmail.js')).default;
                    const reviewUrl = `${process.env.CLIENT_URL || 'http://localhost:3000'}/courses/${course.slug}`;

                    // Send review request email (delayed - 5 seconds after)
                    setTimeout(async () => {
                        try {
                            await sendEmail({
                                email: user.email,
                                subject: `📝 Share Your Experience - Review "${course.title}"`,
                                html: `
                                    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                                        <div style="text-align: center; padding: 30px 0;">
                                            <h1 style="color: #10B981; margin: 0;">⭐ We'd Love Your Feedback!</h1>
                                        </div>
                                        <div style="background: #f0fdf4; border-radius: 12px; padding: 30px; margin: 20px 0; border-left: 4px solid #10B981;">
                                            <p style="font-size: 16px; color: #333;">Dear <strong>${user.name || 'Student'}</strong>,</p>
                                            <p style="font-size: 16px; color: #333;">
                                                Congratulations again on completing <strong>"${course.title}"</strong>! 🎉
                                            </p>
                                            <p style="font-size: 16px; color: #333;">
                                                We would really appreciate if you could take a moment to share your experience. 
                                                Your review helps other students make informed decisions and helps us improve!
                                            </p>
                                            <div style="text-align: center; margin: 30px 0;">
                                                <a href="${reviewUrl}" style="display: inline-block; background: linear-gradient(135deg, #10B981, #059669); color: white; padding: 14px 32px; border-radius: 8px; text-decoration: none; font-weight: bold; font-size: 16px;">
                                                ⭐ Write a Review
                                                </a>
                                            </div>
                                            <p style="font-size: 14px; color: #666; text-align: center;">
                                                It only takes a minute and means a lot to us!
                                            </p>
                                        </div>
                                        <div style="text-align: center; padding-top: 20px; border-top: 1px solid #eee; color: #999; font-size: 12px;">
                                            <p>© ${new Date().getFullYear()} Shrestha Academy. All rights reserved.</p>
                                        </div>
                                    </div>
                                `,
                            });
                            console.log(`Review request email sent to ${user.email} for course ${course.title}`);
                        } catch (err) {
                            console.error('Failed to send review request email:', err);
                        }
                    }, 5000); // 5 second delay between certificate and review emails
                }
            } catch (emailError) {
                console.error('Error preparing review request email:', emailError);
            }

            return { completed: true, isNew: true };
        }

        return { completed: false, isNew: false };
    } catch (error) {
        console.error('Error checking course completion:', error);
        return { completed: false, isNew: false, error };
    }
};

/**
 * Complete webinar for all enrolled users (called when webinar ends)
 */
export const completeWebinarForEnrolledUsers = async (webinarId) => {
    try {
        // Get webinar
        const webinar = await prisma.webinar.findUnique({
            where: { id: webinarId },
        });

        if (!webinar) {
            throw new Error('Webinar not found');
        }

        // Check if webinar has ended
        const now = new Date();
        const webinarEnd = new Date(webinar.startDate);
        if (webinar.duration) {
            webinarEnd.setMinutes(webinarEnd.getMinutes() + webinar.duration);
        } else {
            webinarEnd.setHours(webinarEnd.getHours() + 1); // Default 1 hour
        }

        if (now < webinarEnd) {
            return { processed: 0, message: 'Webinar has not ended yet' };
        }

        // Get all enrolled users who haven't completed
        const enrolledUsers = await prisma.webinarOrderItem.findMany({
            where: { webinarId },
            select: { userId: true },
        });

        let processedCount = 0;

        for (const { userId } of enrolledUsers) {
            // Check if already completed
            const existingCompletion = await prisma.webinarCompletion.findUnique({
                where: {
                    webinarId_userId: { webinarId, userId },
                },
            });

            if (!existingCompletion) {
                // Create completion
                await prisma.webinarCompletion.create({
                    data: { webinarId, userId },
                });

                // Generate certificate
                await generateWebinarCertificate(userId, webinarId);
                processedCount++;
            }
        }

        return { processed: processedCount };
    } catch (error) {
        console.error('Error completing webinar for users:', error);
        throw error;
    }
};

/**
 * Get type label for display
 */
const getTypeLabel = (type) => {
    const labels = {
        COURSE: 'Course',
        WEBINAR: 'Webinar',
        MENTORSHIP: 'Mentorship Program',
        GUIDANCE: '1:1 Guidance Session',
        OFFLINE_BATCH: 'Offline Training',
        BUNDLE: 'Course Bundle',
    };
    return labels[type] || type;
};

/**
 * Generate certificate with template (supports all types)
 * Used for manual generation and auto-generation with templates
 */
export const generateCertificateWithTemplate = async ({ userId, type, referenceId, userName, itemTitle, template }) => {
    try {
        // Generate unique certificate number
        const certificateNo = generateCertificateNumber();
        const issuedAt = new Date();

        // Use template settings or defaults
        const primaryColor = template?.primaryColor || '#6366F1';
        const secondaryColor = template?.secondaryColor || '#A5B4FC';
        const issuerName = template?.issuerName || 'Shrestha Academy';
        const issuerTitle = template?.issuerTitle || 'Platform Director';
        const footerText = template?.footerText || 'This certificate verifies the successful completion of the above-mentioned program.';

        // Fetch template images if available
        let signatureBuffer = null;
        let logoBuffer = null;
        let stampBuffer = null;

        const fetchImage = async (url) => {
            if (!url) return null;
            try {
                // Get public URL
                const { getPublicUrl } = await import('./cloudflare.js');
                const publicUrl = getPublicUrl(url);
                if (!publicUrl) return null;

                const response = await fetch(publicUrl);
                if (!response.ok) return null;
                const arrayBuffer = await response.arrayBuffer();
                return Buffer.from(arrayBuffer);
            } catch (error) {
                console.log('Failed to fetch image:', url, error.message);
                return null;
            }
        };

        // Fetch images in parallel
        if (template) {
            const [sig, logo, stamp] = await Promise.all([
                fetchImage(template.signatureUrl),
                fetchImage(template.logoUrl),
                fetchImage(template.stampUrl),
            ]);
            signatureBuffer = sig;
            logoBuffer = logo;
            stampBuffer = stamp;
        }

        // Generate PDF
        const pdfBuffer = await new Promise((resolve, reject) => {
            try {
                const doc = new PDFDocument({
                    layout: 'landscape',
                    size: 'A4',
                    margin: 0,
                });

                const chunks = [];
                doc.on('data', (chunk) => chunks.push(chunk));
                doc.on('end', () => resolve(Buffer.concat(chunks)));
                doc.on('error', reject);

                const pageWidth = doc.page.width;
                const pageHeight = doc.page.height;

                // Background
                doc.rect(0, 0, pageWidth, pageHeight).fill('#FAFAFA');

                // Decorative borders using template colors
                const borderMargin = 30;
                doc.rect(borderMargin, borderMargin, pageWidth - borderMargin * 2, pageHeight - borderMargin * 2)
                    .lineWidth(3)
                    .stroke(primaryColor);

                doc.rect(borderMargin + 10, borderMargin + 10, pageWidth - (borderMargin + 10) * 2, pageHeight - (borderMargin + 10) * 2)
                    .lineWidth(1)
                    .stroke(secondaryColor);

                // Corner decorations
                const cornerSize = 40;
                const corners = [
                    [borderMargin + 20, borderMargin + 20],
                    [pageWidth - borderMargin - 20 - cornerSize, borderMargin + 20],
                    [borderMargin + 20, pageHeight - borderMargin - 20 - cornerSize],
                    [pageWidth - borderMargin - 20 - cornerSize, pageHeight - borderMargin - 20 - cornerSize],
                ];
                corners.forEach(([x, y]) => {
                    doc.rect(x, y, cornerSize, cornerSize).lineWidth(2).stroke(primaryColor);
                });

                // Logo at top center (if available)
                if (logoBuffer) {
                    try {
                        doc.image(logoBuffer, pageWidth / 2 - 40, 50, { width: 80, height: 80 });
                    } catch (e) {
                        console.log('Failed to add logo to PDF');
                    }
                }

                // Brand name
                const brandY = logoBuffer ? 140 : 60;
                doc.fontSize(14).font('Helvetica-Bold').fillColor(primaryColor)
                    .text(issuerName, 0, brandY, { align: 'center', width: pageWidth });

                // Certificate title
                doc.fontSize(42).font('Helvetica-Bold').fillColor('#1F2937')
                    .text('CERTIFICATE', 0, brandY + 30, { align: 'center', width: pageWidth });

                doc.fontSize(20).font('Helvetica').fillColor('#6B7280')
                    .text('OF COMPLETION', 0, brandY + 80, { align: 'center', width: pageWidth });

                // Decorative line
                const lineY = brandY + 115;
                doc.moveTo(pageWidth / 2 - 100, lineY).lineTo(pageWidth / 2 + 100, lineY)
                    .lineWidth(2).stroke(primaryColor);

                // Certify text
                doc.fontSize(14).font('Helvetica').fillColor('#6B7280')
                    .text('This is to certify that', 0, brandY + 130, { align: 'center', width: pageWidth });

                // Recipient name
                doc.fontSize(32).font('Helvetica-Bold').fillColor('#1F2937')
                    .text(userName, 0, brandY + 155, { align: 'center', width: pageWidth });

                // Name underline
                const nameWidth = doc.widthOfString(userName);
                doc.moveTo((pageWidth - nameWidth) / 2 - 20, brandY + 195)
                    .lineTo((pageWidth + nameWidth) / 2 + 20, brandY + 195)
                    .lineWidth(1).stroke('#D1D5DB');

                // Completion text
                doc.fontSize(14).font('Helvetica').fillColor('#6B7280')
                    .text('has successfully completed the', 0, brandY + 210, { align: 'center', width: pageWidth });

                // Type label
                doc.fontSize(14).font('Helvetica-Bold').fillColor(primaryColor)
                    .text(getTypeLabel(type).toUpperCase(), 0, brandY + 230, { align: 'center', width: pageWidth });

                // Item title
                doc.fontSize(22).font('Helvetica-Bold').fillColor('#1F2937')
                    .text(`"${itemTitle}"`, 0, brandY + 255, { align: 'center', width: pageWidth });

                // Issue date and certificate number
                doc.fontSize(11).font('Helvetica').fillColor('#6B7280')
                    .text(`Issued on: ${formatDate(issuedAt)}`, 0, brandY + 295, { align: 'center', width: pageWidth });

                doc.fontSize(10).font('Helvetica').fillColor('#9CA3AF')
                    .text(`Certificate No: ${certificateNo}`, 0, brandY + 315, { align: 'center', width: pageWidth });

                // Signature area
                const signatureY = pageHeight - 120;

                // Left side - Signature
                if (signatureBuffer) {
                    try {
                        doc.image(signatureBuffer, 150, signatureY - 50, { width: 100, height: 40 });
                    } catch (e) {
                        console.log('Failed to add signature to PDF');
                    }
                }
                doc.moveTo(130, signatureY).lineTo(320, signatureY).lineWidth(1).stroke('#D1D5DB');
                doc.fontSize(12).font('Helvetica-Bold').fillColor('#1F2937')
                    .text(issuerName, 130, signatureY + 8, { width: 190, align: 'center' });
                doc.fontSize(10).font('Helvetica').fillColor('#6B7280')
                    .text(issuerTitle, 130, signatureY + 24, { width: 190, align: 'center' });

                // Right side - Stamp
                if (stampBuffer) {
                    try {
                        doc.image(stampBuffer, pageWidth - 220, signatureY - 60, { width: 80, height: 80 });
                    } catch (e) {
                        console.log('Failed to add stamp to PDF');
                    }
                }
                doc.moveTo(pageWidth - 300, signatureY).lineTo(pageWidth - 110, signatureY).lineWidth(1).stroke('#D1D5DB');
                doc.fontSize(12).font('Helvetica-Bold').fillColor('#1F2937')
                    .text('Verified', pageWidth - 300, signatureY + 8, { width: 190, align: 'center' });
                doc.fontSize(10).font('Helvetica').fillColor('#6B7280')
                    .text('Digital Certificate', pageWidth - 300, signatureY + 24, { width: 190, align: 'center' });

                // Footer
                doc.fontSize(9).font('Helvetica').fillColor('#9CA3AF')
                    .text(footerText, 40, pageHeight - 60, { align: 'center', width: pageWidth - 80 });

                // Verification URL - split into two lines for better readability
                const verifyUrl = `${process.env.CLIENT_URL || 'http://localhost:3000'}/verify-certificate?certificateNo=${certificateNo}`;
                doc.fontSize(8).font('Helvetica').fillColor('#6366F1')
                    .text(`Verify at: ${verifyUrl}`, 40, pageHeight - 40, { align: 'center', width: pageWidth - 80, link: verifyUrl });

                doc.end();
            } catch (error) {
                reject(error);
            }
        });

        // Upload to R2 using the buffer upload function
        const { uploadBufferToR2 } = await import('./cloudflare.js');
        const fileName = `certificates/${type.toLowerCase()}-${referenceId}-user-${userId}-${Date.now()}.pdf`;
        const uploadedKey = await uploadBufferToR2(pdfBuffer, fileName, 'application/pdf');

        // Create certificate record
        const certificate = await prisma.certificate.create({
            data: {
                userId,
                type,
                referenceId,
                certificateNo,
                certificateUrl: uploadedKey,
                issuedAt,
                status: 'GENERATED',
            },
        });

        console.log(`Certificate generated: ${certificateNo} for ${type} ${referenceId} for user ${userId}`);

        // Send email notification to user
        try {
            const user = await prisma.user.findUnique({ where: { id: userId }, select: { email: true, name: true } });
            if (user?.email) {
                const sendEmail = (await import('./sendEmail.js')).default;
                const { getPublicUrl } = await import('./cloudflare.js');
                const certificateUrl = getPublicUrl(uploadedKey);

                const typeLabels = {
                    COURSE: 'Course',
                    WEBINAR: 'Webinar',
                    MENTORSHIP: 'Mentorship Program',
                    GUIDANCE: '1:1 Guidance Session',
                    OFFLINE_BATCH: 'Offline Training',
                    BUNDLE: 'Course Bundle',
                };
                const typeLabel = typeLabels[type] || type;

                await sendEmail({
                    email: user.email,
                    subject: `🎉 Congratulations! Your ${typeLabel} Certificate is Ready`,
                    html: `
                        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                            <div style="text-align: center; padding: 30px 0;">
                                <h1 style="color: #6366F1; margin: 0;">🎓 Certificate Awarded!</h1>
                            </div>
                            <div style="background: #f8f9fa; border-radius: 12px; padding: 30px; margin: 20px 0;">
                                <p style="font-size: 16px; color: #333;">Dear <strong>${user.name || 'Student'}</strong>,</p>
                                <p style="font-size: 16px; color: #333;">
                                    Congratulations on completing <strong>"${itemTitle}"</strong>! 
                                    Your certificate has been generated and is ready for download.
                                </p>
                                <div style="text-align: center; margin: 30px 0;">
                                    <p style="font-size: 14px; color: #666; margin-bottom: 10px;">Certificate Number:</p>
                                    <p style="font-size: 20px; font-weight: bold; color: #6366F1; font-family: monospace;">${certificateNo}</p>
                                </div>
                                <div style="text-align: center;">
                                    <a href="${certificateUrl}" style="display: inline-block; background: linear-gradient(135deg, #6366F1, #8B5CF6); color: white; padding: 14px 32px; border-radius: 8px; text-decoration: none; font-weight: bold; font-size: 16px;">
                                    📥 Download Certificate
                                    </a>
                                </div>
                            </div>
                            <div style="text-align: center; padding: 20px 0; color: #666; font-size: 14px;">
                                <p>You can view all your certificates at:</p>
                                <p><a href="${process.env.CLIENT_URL || 'http://localhost:3000'}/profile/certificates" style="color: #6366F1;">${process.env.CLIENT_URL || 'http://localhost:3000'}/profile/certificates</a></p>
                            </div>
                            <div style="text-align: center; padding-top: 20px; border-top: 1px solid #eee; color: #999; font-size: 12px;">
                                <p>© ${new Date().getFullYear()} Shrestha Academy. All rights reserved.</p>
                            </div>
                        </div>
                    `,
                });
                console.log(`Certificate email sent to ${user.email}`);
            }
        } catch (emailError) {
            console.error('Failed to send certificate email:', emailError);
            // Don't fail the certificate generation if email fails
        }

        return certificate;
    } catch (error) {
        console.error('Error generating certificate with template:', error);
        throw error;
    }
};
