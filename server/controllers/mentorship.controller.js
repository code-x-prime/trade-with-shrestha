import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiResponsive } from "../utils/ApiResponsive.js";
import { ApiError } from "../utils/ApiError.js";
import { prisma } from "../config/db.js";
import { uploadToR2, deleteFromR2, getPublicUrl } from "../utils/cloudflare.js";
import { createSlug } from "../helper/Slug.js";
import { getItemPricing } from "../utils/flashSaleHelper.js";

/**
 * Get all mentorship programs
 */
export const getMentorship = asyncHandler(async (req, res) => {
    const {
        page = 1,
        limit = 10,
        search,
        status,
    } = req.query;

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const where = {};

    if (search) {
        where.OR = [
            { title: { contains: search, mode: "insensitive" } },
            { instructorName: { contains: search, mode: "insensitive" } },
        ];
    }

    if (status) {
        where.status = status.toUpperCase();
    }

    const [mentorship, total] = await Promise.all([
        prisma.liveMentorshipProgram.findMany({
            where,
            skip,
            take: parseInt(limit),
            include: {
                sessions: {
                    orderBy: { order: "asc" },
                },
                _count: {
                    select: {
                        enrollments: true,
                    },
                },
            },
            orderBy: { createdAt: "desc" },
        }),
        prisma.liveMentorshipProgram.count({ where }),
    ]);

    // Check if user is admin - if yes, show Google Meet link
    const isAdmin = req.user && req.user.role === "ADMIN";

    // Add flash sale pricing for each mentorship
    const mentorshipWithUrls = await Promise.all(mentorship.map(async (m) => {
        const pricing = await getItemPricing('MENTORSHIP', m.id, m.price, m.salePrice);

        return {
            ...m,
            coverImageUrl: m.coverImage ? getPublicUrl(m.coverImage) : null,
            instructorImageUrl: m.instructorImage ? getPublicUrl(m.instructorImage) : null,
            googleMeetLink: isAdmin ? m.googleMeetLink : undefined,
            pricing,
        };
    }));

    return res.status(200).json(
        new ApiResponsive(200, {
            mentorship: mentorshipWithUrls,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total,
                totalPages: Math.ceil(total / parseInt(limit)),
            },
        }, "Mentorship programs fetched successfully")
    );
});

/**
 * Get mentorship by ID
 */
export const getMentorshipById = asyncHandler(async (req, res) => {
    const { id } = req.params;

    const mentorship = await prisma.liveMentorshipProgram.findUnique({
        where: { id },
        include: {
            sessions: {
                orderBy: { order: "asc" },
            },
            _count: {
                select: {
                    enrollments: true,
                },
            },
        },
    });

    if (!mentorship) {
        throw new ApiError(404, "Mentorship program not found");
    }

    // Check if user is admin - if yes, show Google Meet link
    const isAdmin = req.user && req.user.role === "ADMIN";

    const mentorshipWithUrls = {
        ...mentorship,
        coverImageUrl: mentorship.coverImage ? getPublicUrl(mentorship.coverImage) : null,
        instructorImageUrl: mentorship.instructorImage ? getPublicUrl(mentorship.instructorImage) : null,
        // Only expose Google Meet link to admin
        googleMeetLink: isAdmin ? mentorship.googleMeetLink : undefined,
    };

    return res.status(200).json(
        new ApiResponsive(200, { mentorship: mentorshipWithUrls }, "Mentorship program fetched successfully")
    );
});

/**
 * Get mentorship by slug
 */
export const getMentorshipBySlug = asyncHandler(async (req, res) => {
    const { slug } = req.params;

    const mentorship = await prisma.liveMentorshipProgram.findUnique({
        where: { slug },
        include: {
            sessions: {
                orderBy: { order: "asc" },
            },
            _count: {
                select: {
                    enrollments: true,
                },
            },
        },
    });

    if (!mentorship) {
        throw new ApiError(404, "Mentorship program not found");
    }

    // Get flash sale pricing
    const pricing = await getItemPricing('MENTORSHIP', mentorship.id, mentorship.price, mentorship.salePrice);

    const mentorshipWithUrls = {
        ...mentorship,
        coverImageUrl: mentorship.coverImage ? getPublicUrl(mentorship.coverImage) : null,
        instructorImageUrl: mentorship.instructorImage ? getPublicUrl(mentorship.instructorImage) : null,
        // NEVER expose Google Meet link in public API
        googleMeetLink: undefined,
        // Flash sale pricing info
        pricing,
    };

    return res.status(200).json(
        new ApiResponsive(200, { mentorship: mentorshipWithUrls }, "Mentorship program fetched successfully")
    );
});

/**
 * Create mentorship program
 */
export const createMentorship = asyncHandler(async (req, res) => {
    const {
        title,
        description,
        pricingType,
        price,
        salePrice,
        isFree,
        status,
        totalSessions,
        startDate,
        endDate,
        googleMeetLink,
        whoIsThisFor,
        whatYouWillLearn,
        keyConceptsRequired,
        faqs,
        programOverview,
        instructorName,
        instructorBio,
        instructorYearsExperience,
    } = req.body;

    if (!title || !description || !instructorName || !googleMeetLink || !totalSessions || !startDate || !endDate) {
        throw new ApiError(400, "Missing required fields");
    }

    // Generate unique slug
    const baseSlug = createSlug(title);
    let slug = baseSlug;
    let counter = 1;
    while (await prisma.liveMentorshipProgram.findUnique({ where: { slug } })) {
        slug = `${baseSlug}-${counter}`;
        counter++;
    }

    // Handle image uploads - either file upload or URL from MediaPicker
    let coverImagePath = null;
    let instructorImagePath = null;

    if (req.files?.coverImage?.[0]) {
        // File upload
        coverImagePath = await uploadToR2(req.files.coverImage[0], "mentorship");
    } else if (req.body.coverImageUrl) {
        // URL from MediaPicker - extract R2 path from public URL
        try {
            const url = new URL(req.body.coverImageUrl);
            coverImagePath = url.pathname.startsWith('/') ? url.pathname.slice(1) : url.pathname;
        } catch (error) {
            coverImagePath = req.body.coverImageUrl.startsWith('/') ? req.body.coverImageUrl.slice(1) : req.body.coverImageUrl;
        }
    }

    if (req.files?.instructorImage?.[0]) {
        // File upload
        instructorImagePath = await uploadToR2(req.files.instructorImage[0], "mentorship");
    } else if (req.body.instructorImageUrl) {
        // URL from MediaPicker - extract R2 path from public URL
        try {
            const url = new URL(req.body.instructorImageUrl);
            instructorImagePath = url.pathname.startsWith('/') ? url.pathname.slice(1) : url.pathname;
        } catch (error) {
            instructorImagePath = req.body.instructorImageUrl.startsWith('/') ? req.body.instructorImageUrl.slice(1) : req.body.instructorImageUrl;
        }
    }

    // Parse JSON fields
    const parsedWhoIsThisFor = typeof whoIsThisFor === "string" ? JSON.parse(whoIsThisFor) : whoIsThisFor || [];
    const parsedWhatYouWillLearn = typeof whatYouWillLearn === "string" ? JSON.parse(whatYouWillLearn) : whatYouWillLearn || [];
    const parsedKeyConceptsRequired = typeof keyConceptsRequired === "string" ? JSON.parse(keyConceptsRequired) : keyConceptsRequired || [];
    const parsedFaqs = typeof faqs === "string" ? JSON.parse(faqs) : faqs || [];
    const parsedProgramOverview = typeof programOverview === "string" ? JSON.parse(programOverview) : programOverview || [];

    const mentorship = await prisma.liveMentorshipProgram.create({
        data: {
            title,
            slug,
            description,
            coverImage: coverImagePath,
            pricingType: pricingType || "PAID",
            price: parseFloat(price) || 0,
            salePrice: salePrice ? parseFloat(salePrice) : null,
            isFree: isFree === true || isFree === "true",
            status: status || "DRAFT",
            totalSessions: parseInt(totalSessions),
            startDate: new Date(startDate),
            endDate: new Date(endDate),
            googleMeetLink,
            whoIsThisFor: parsedWhoIsThisFor,
            whatYouWillLearn: parsedWhatYouWillLearn,
            keyConceptsRequired: parsedKeyConceptsRequired,
            faqs: parsedFaqs,
            programOverview: parsedProgramOverview,
            instructorName,
            instructorBio: instructorBio || null,
            instructorImage: instructorImagePath,
        },
    });

    return res.status(201).json(
        new ApiResponsive(201, { mentorship }, "Mentorship program created successfully")
    );
});

/**
 * Update mentorship program
 */
export const updateMentorship = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const {
        title,
        description,
        pricingType,
        price,
        salePrice,
        isFree,
        status,
        totalSessions,
        startDate,
        endDate,
        googleMeetLink,
        whoIsThisFor,
        whatYouWillLearn,
        keyConceptsRequired,
        faqs,
        programOverview,
        instructorName,
        instructorBio,
        instructorYearsExperience,
        removeCoverImage,
        removeInstructorImage,
    } = req.body;

    const existingMentorship = await prisma.liveMentorshipProgram.findUnique({
        where: { id },
    });

    if (!existingMentorship) {
        throw new ApiError(404, "Mentorship program not found");
    }

    // Generate slug if title changed
    let slug = existingMentorship.slug;
    if (title && title !== existingMentorship.title) {
        const baseSlug = createSlug(title);
        slug = baseSlug;
        let counter = 1;
        while (await prisma.liveMentorshipProgram.findUnique({ where: { slug } })) {
            slug = `${baseSlug}-${counter}`;
            counter++;
        }
    }

    // Handle image uploads and deletions
    let coverImagePath = existingMentorship.coverImage;
    let instructorImagePath = existingMentorship.instructorImage;

    if (removeCoverImage === "true" && existingMentorship.coverImage) {
        await deleteFromR2(existingMentorship.coverImage);
        coverImagePath = null;
    }

    if (removeInstructorImage === "true" && existingMentorship.instructorImage) {
        await deleteFromR2(existingMentorship.instructorImage);
        instructorImagePath = null;
    }

    if (req.files?.coverImage?.[0]) {
        // File upload - DON'T delete old image, keep it in media library
        coverImagePath = await uploadToR2(req.files.coverImage[0], "mentorship");
    } else if (req.body.coverImageUrl && !removeCoverImage) {
        // URL from MediaPicker - extract R2 path from public URL
        // DON'T delete old image, keep it in media library
        try {
            const url = new URL(req.body.coverImageUrl);
            coverImagePath = url.pathname.startsWith('/') ? url.pathname.slice(1) : url.pathname;
        } catch (error) {
            coverImagePath = req.body.coverImageUrl.startsWith('/') ? req.body.coverImageUrl.slice(1) : req.body.coverImageUrl;
        }
    }

    if (req.files?.instructorImage?.[0]) {
        // File upload - DON'T delete old image, keep it in media library
        instructorImagePath = await uploadToR2(req.files.instructorImage[0], "mentorship");
    } else if (req.body.instructorImageUrl && !removeInstructorImage) {
        // URL from MediaPicker - extract R2 path from public URL
        // DON'T delete old image, keep it in media library
        try {
            const url = new URL(req.body.instructorImageUrl);
            instructorImagePath = url.pathname.startsWith('/') ? url.pathname.slice(1) : url.pathname;
        } catch (error) {
            instructorImagePath = req.body.instructorImageUrl.startsWith('/') ? req.body.instructorImageUrl.slice(1) : req.body.instructorImageUrl;
        }
    }

    // Parse JSON fields
    const parsedWhoIsThisFor = whoIsThisFor !== undefined
        ? (typeof whoIsThisFor === "string" ? JSON.parse(whoIsThisFor) : whoIsThisFor)
        : existingMentorship.whoIsThisFor;
    const parsedWhatYouWillLearn = whatYouWillLearn !== undefined
        ? (typeof whatYouWillLearn === "string" ? JSON.parse(whatYouWillLearn) : whatYouWillLearn)
        : existingMentorship.whatYouWillLearn;
    const parsedKeyConceptsRequired = keyConceptsRequired !== undefined
        ? (typeof keyConceptsRequired === "string" ? JSON.parse(keyConceptsRequired) : keyConceptsRequired)
        : existingMentorship.keyConceptsRequired;
    const parsedFaqs = faqs !== undefined
        ? (typeof faqs === "string" ? JSON.parse(faqs) : faqs)
        : existingMentorship.faqs;
    const parsedProgramOverview = programOverview !== undefined
        ? (typeof programOverview === "string" ? JSON.parse(programOverview) : programOverview)
        : existingMentorship.programOverview;

    const mentorship = await prisma.liveMentorshipProgram.update({
        where: { id },
        data: {
            ...(title && { title }),
            ...(slug !== existingMentorship.slug && { slug }),
            ...(description !== undefined && { description }),
            ...(coverImagePath !== existingMentorship.coverImage && { coverImage: coverImagePath }),
            ...(pricingType !== undefined && { pricingType }),
            ...(price !== undefined && { price: parseFloat(price) }),
            ...(salePrice !== undefined && { salePrice: salePrice ? parseFloat(salePrice) : null }),
            ...(isFree !== undefined && { isFree: isFree === true || isFree === "true" }),
            ...(status !== undefined && { status }),
            ...(totalSessions !== undefined && { totalSessions: parseInt(totalSessions) }),
            ...(startDate !== undefined && { startDate: new Date(startDate) }),
            ...(endDate !== undefined && { endDate: new Date(endDate) }),
            ...(googleMeetLink !== undefined && { googleMeetLink }),
            ...(whoIsThisFor !== undefined && { whoIsThisFor: parsedWhoIsThisFor }),
            ...(whatYouWillLearn !== undefined && { whatYouWillLearn: parsedWhatYouWillLearn }),
            ...(keyConceptsRequired !== undefined && { keyConceptsRequired: parsedKeyConceptsRequired }),
            ...(faqs !== undefined && { faqs: parsedFaqs }),
            ...(programOverview !== undefined && { programOverview: parsedProgramOverview }),
            ...(instructorName !== undefined && { instructorName }),
            ...(instructorBio !== undefined && { instructorBio }),
            ...(instructorImagePath !== existingMentorship.instructorImage && { instructorImage: instructorImagePath }),
        },
    });

    return res.status(200).json(
        new ApiResponsive(200, { mentorship }, "Mentorship program updated successfully")
    );
});

/**
 * Delete mentorship program
 */
export const deleteMentorship = asyncHandler(async (req, res) => {
    const { id } = req.params;

    const mentorship = await prisma.liveMentorshipProgram.findUnique({
        where: { id },
    });

    if (!mentorship) {
        throw new ApiError(404, "Mentorship program not found");
    }

    // Delete images from R2
    if (mentorship.coverImage) {
        try {
            await deleteFromR2(mentorship.coverImage);
        } catch (error) {
            console.error(`Failed to delete cover image: ${mentorship.coverImage}`, error);
        }
    }
    if (mentorship.instructorImage) {
        try {
            await deleteFromR2(mentorship.instructorImage);
        } catch (error) {
            console.error(`Failed to delete instructor image: ${mentorship.instructorImage}`, error);
        }
    }

    await prisma.liveMentorshipProgram.delete({
        where: { id },
    });

    return res.status(200).json(
        new ApiResponsive(200, {}, "Mentorship program deleted successfully")
    );
});

/**
 * Toggle publish status
 */
export const togglePublishStatus = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { status } = req.body;

    const mentorship = await prisma.liveMentorshipProgram.findUnique({
        where: { id },
    });

    if (!mentorship) {
        throw new ApiError(404, "Mentorship program not found");
    }

    const updatedMentorship = await prisma.liveMentorshipProgram.update({
        where: { id },
        data: {
            status: status || (mentorship.status === "PUBLISHED" ? "UNPUBLISHED" : "PUBLISHED"),
        },
    });

    return res.status(200).json(
        new ApiResponsive(200, { mentorship: updatedMentorship }, "Status updated successfully")
    );
});

/**
 * Create session
 */
export const createSession = asyncHandler(async (req, res) => {
    const { mentorshipId } = req.params;
    const { title, sessionDate, startTime, endTime, order } = req.body;

    if (!title || !sessionDate || !startTime || !endTime || order === undefined) {
        throw new ApiError(400, "Missing required fields");
    }

    const mentorship = await prisma.liveMentorshipProgram.findUnique({
        where: { id: mentorshipId },
    });

    if (!mentorship) {
        throw new ApiError(404, "Mentorship program not found");
    }

    const session = await prisma.mentorshipSession.create({
        data: {
            mentorshipId,
            title,
            sessionDate: new Date(sessionDate),
            startTime,
            endTime,
            order: parseInt(order),
        },
    });

    return res.status(201).json(
        new ApiResponsive(201, { session }, "Session created successfully")
    );
});

/**
 * Get sessions for a mentorship
 */
export const getSessions = asyncHandler(async (req, res) => {
    const { mentorshipId } = req.params;

    const sessions = await prisma.mentorshipSession.findMany({
        where: { mentorshipId },
        orderBy: { order: "asc" },
    });

    return res.status(200).json(
        new ApiResponsive(200, { sessions }, "Sessions fetched successfully")
    );
});

/**
 * Update session
 */
export const updateSession = asyncHandler(async (req, res) => {
    const { sessionId } = req.params;
    const { title, sessionDate, startTime, endTime, order } = req.body;

    const session = await prisma.mentorshipSession.findUnique({
        where: { id: sessionId },
    });

    if (!session) {
        throw new ApiError(404, "Session not found");
    }

    const updatedSession = await prisma.mentorshipSession.update({
        where: { id: sessionId },
        data: {
            ...(title !== undefined && { title }),
            ...(sessionDate !== undefined && { sessionDate: new Date(sessionDate) }),
            ...(startTime !== undefined && { startTime }),
            ...(endTime !== undefined && { endTime }),
            ...(order !== undefined && { order: parseInt(order) }),
        },
    });

    return res.status(200).json(
        new ApiResponsive(200, { session: updatedSession }, "Session updated successfully")
    );
});

/**
 * Delete session
 */
export const deleteSession = asyncHandler(async (req, res) => {
    const { sessionId } = req.params;

    const session = await prisma.mentorshipSession.findUnique({
        where: { id: sessionId },
    });

    if (!session) {
        throw new ApiError(404, "Session not found");
    }

    await prisma.mentorshipSession.delete({
        where: { id: sessionId },
    });

    return res.status(200).json(
        new ApiResponsive(200, {}, "Session deleted successfully")
    );
});

/**
 * Check enrollment and access to Google Meet link
 */
export const checkEnrollment = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const userId = req.user.id;

    const mentorship = await prisma.liveMentorshipProgram.findUnique({
        where: { id },
        include: {
            sessions: {
                orderBy: { order: "asc" },
            },
        },
    });

    if (!mentorship) {
        throw new ApiError(404, "Mentorship program not found");
    }

    // Check if user is enrolled - verify payment is PAID
    const enrollment = await prisma.mentorshipEnrollment.findUnique({
        where: {
            mentorshipId_userId: {
                mentorshipId: id,
                userId,
            },
        },
    });

    // Verify there's a paid order
    let isEnrolled = false;
    if (enrollment) {
        const mentorshipOrder = await prisma.mentorshipOrder.findFirst({
            where: {
                mentorshipId: id,
                userId,
                paymentStatus: 'PAID',
            },
        });
        isEnrolled = !!mentorshipOrder;
    }

    if (!isEnrolled) {
        return res.status(200).json(
            new ApiResponsive(200, {
                isEnrolled: false,
                canAccessLink: false,
                googleMeetLink: null,
            }, "Enrollment status checked")
        );
    }

    // Check if any session is starting within 10 minutes or is currently live
    const now = new Date();
    let canAccessLink = false;
    let activeSession = null;

    for (const session of mentorship.sessions) {
        const sessionDate = new Date(session.sessionDate);
        const [hours, minutes] = session.startTime.split(":").map(Number);
        sessionDate.setHours(hours, minutes, 0, 0);

        const [endHours, endMinutes] = session.endTime.split(":").map(Number);
        const sessionEnd = new Date(sessionDate);
        sessionEnd.setHours(endHours, endMinutes, 0, 0);

        const tenMinutesBefore = new Date(sessionDate.getTime() - 10 * 60000);

        // Check if session is within 10 minutes before start or currently live
        if ((now >= tenMinutesBefore && now <= sessionEnd)) {
            canAccessLink = true;
            activeSession = session;
            break;
        }
    }

    return res.status(200).json(
        new ApiResponsive(200, {
            isEnrolled: true,
            canAccessLink,
            googleMeetLink: canAccessLink ? mentorship.googleMeetLink : null,
            activeSession,
        }, "Enrollment status checked")
    );
});

