import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiResponsive } from "../utils/ApiResponsive.js";
import { ApiError } from "../utils/ApiError.js";
import { prisma } from "../config/db.js";
import { uploadToR2, deleteFromR2, getPublicUrl } from "../utils/cloudflare.js";
import { createSlug } from "../helper/Slug.js";
import { getItemPricing } from "../utils/flashSaleHelper.js";

/**
 * Get all webinars
 */
export const getWebinars = asyncHandler(async (req, res) => {
    const {
        page = 1,
        limit = 10,
        search,
        type,
        isPublished,
    } = req.query;

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const where = {};

    if (search) {
        where.OR = [
            { title: { contains: search, mode: "insensitive" } },
            { instructorName: { contains: search, mode: "insensitive" } },
        ];
    }

    if (type) {
        where.type = type;
    }

    if (isPublished !== undefined) {
        where.isPublished = isPublished === "true";
    }

    const [webinars, total] = await Promise.all([
        prisma.webinar.findMany({
            where,
            skip,
            take: parseInt(limit),
            orderBy: { createdAt: "desc" },
            include: {
                _count: {
                    select: {
                        orders: true, // webinarOrderItems
                    },
                },
            },
        }),
        prisma.webinar.count({ where }),
    ]);

    // Add flash sale pricing for each webinar
    const webinarsWithUrls = await Promise.all(webinars.map(async (webinar) => {
        const pricing = await getItemPricing('WEBINAR', webinar.id, webinar.price, webinar.salePrice);

        return {
            ...webinar,
            imageUrl: webinar.image ? getPublicUrl(webinar.image) : null,
            instructorImageUrl: webinar.instructorImage
                ? getPublicUrl(webinar.instructorImage)
                : null,
            pricing,
        };
    }));

    return res.status(200).json(
        new ApiResponsive(
            200,
            {
                webinars: webinarsWithUrls,
                pagination: {
                    page: parseInt(page),
                    limit: parseInt(limit),
                    total,
                    totalPages: Math.ceil(total / parseInt(limit)),
                },
            },
            "Webinars fetched successfully"
        )
    );
});

/**
 * Get webinar by ID
 */
export const getWebinarById = asyncHandler(async (req, res) => {
    const { id } = req.params;

    const webinar = await prisma.webinar.findUnique({
        where: { id },
    });

    if (!webinar) {
        throw new ApiError(404, "Webinar not found");
    }

    // Get flash sale pricing
    const pricing = await getItemPricing('WEBINAR', webinar.id, webinar.price, webinar.salePrice);

    const webinarWithUrls = {
        ...webinar,
        imageUrl: webinar.image ? getPublicUrl(webinar.image) : null,
        instructorImageUrl: webinar.instructorImage
            ? getPublicUrl(webinar.instructorImage)
            : null,
        pricing,
    };

    return res.status(200).json(
        new ApiResponsive(200, { webinar: webinarWithUrls }, "Webinar fetched successfully")
    );
});

/**
 * Get webinar by slug
 */
export const getWebinarBySlug = asyncHandler(async (req, res) => {
    const { slug } = req.params;

    const webinar = await prisma.webinar.findUnique({
        where: { slug },
    });

    if (!webinar) {
        throw new ApiError(404, "Webinar not found");
    }

    // Get flash sale pricing
    const pricing = await getItemPricing('WEBINAR', webinar.id, webinar.price, webinar.salePrice);

    const webinarWithUrls = {
        ...webinar,
        imageUrl: webinar.image ? getPublicUrl(webinar.image) : null,
        instructorImageUrl: webinar.instructorImage
            ? getPublicUrl(webinar.instructorImage)
            : null,
        // NEVER expose Google Meet link in public API
        googleMeetLink: undefined,
        // Flash sale pricing info
        pricing,
    };

    return res.status(200).json(
        new ApiResponsive(200, { webinar: webinarWithUrls }, "Webinar fetched successfully")
    );
});

/**
 * Create webinar
 */
export const createWebinar = asyncHandler(async (req, res) => {
    const {
        title,
        type,
        description,
        instructorName,
        instructorDescription,
        instructorYearsExperience,
        price,
        salePrice,
        isFree,
        seatType,
        maxSeats,
        startDate,
        duration,
        numberOfSessions,
        language,
        accessDuration,
        liveDoubtSolving,
        accessToRecordings,
        recordingsAccessDuration,
        thumbnailVideoUrl,
        whatYouWillLearn,
        faqs,
        googleMeetLink,
        isPublished,
    } = req.body;

    if (!title || !type || !description || !instructorName || !startDate || !duration) {
        throw new ApiError(400, "Required fields are missing");
    }

    if (!googleMeetLink) {
        throw new ApiError(400, "Google Meet link is required");
    }

    // Generate slug
    let baseSlug = createSlug(title);
    let slug = baseSlug;
    let counter = 1;
    while (await prisma.webinar.findUnique({ where: { slug } })) {
        slug = `${baseSlug}-${counter}`;
        counter++;
    }

    // Parse JSON fields
    let parsedWhatYouWillLearn = [];
    let parsedFaqs = [];

    try {
        parsedWhatYouWillLearn =
            typeof whatYouWillLearn === "string"
                ? JSON.parse(whatYouWillLearn)
                : whatYouWillLearn || [];
        parsedFaqs = typeof faqs === "string" ? JSON.parse(faqs) : faqs || [];
    } catch (error) {
        throw new ApiError(400, "Invalid JSON format for whatYouWillLearn or faqs");
    }

    // Handle image uploads to R2 - either file upload or URL from MediaPicker
    let image = null;
    let instructorImage = null;
    const uploadedFiles = [];

    try {
        if (req.files?.image?.[0]) {
            // File upload
            image = await uploadToR2(req.files.image[0], "webinars");
            uploadedFiles.push(image);
        } else if (req.body.imageUrl) {
            // URL from MediaPicker - extract R2 path from public URL
            try {
                const url = new URL(req.body.imageUrl);
                image = url.pathname.startsWith('/') ? url.pathname.slice(1) : url.pathname;
            } catch (error) {
                image = req.body.imageUrl.startsWith('/') ? req.body.imageUrl.slice(1) : req.body.imageUrl;
            }
        }
        if (req.files?.instructorImage?.[0]) {
            // File upload
            instructorImage = await uploadToR2(req.files.instructorImage[0], "webinars");
            uploadedFiles.push(instructorImage);
        } else if (req.body.instructorImageUrl) {
            // URL from MediaPicker - extract R2 path from public URL
            try {
                const url = new URL(req.body.instructorImageUrl);
                instructorImage = url.pathname.startsWith('/') ? url.pathname.slice(1) : url.pathname;
            } catch (error) {
                instructorImage = req.body.instructorImageUrl.startsWith('/') ? req.body.instructorImageUrl.slice(1) : req.body.instructorImageUrl;
            }
        }
    } catch (uploadError) {
        // If upload fails, delete any files that were uploaded
        for (const file of uploadedFiles) {
            try {
                await deleteFromR2(file);
            } catch (deleteError) {
                console.error(`Failed to delete file ${file}:`, deleteError);
            }
        }
        throw new ApiError(500, "Failed to upload images to R2");
    }

    // Calculate endTime from startDate + duration
    const startDateTime = new Date(startDate);
    const durationMinutes = parseInt(duration) || 60;
    const endDateTime = new Date(startDateTime.getTime() + durationMinutes * 60 * 1000);

    // Extract startTime in HH:mm format for compatibility
    const hours = String(startDateTime.getHours()).padStart(2, '0');
    const minutes = String(startDateTime.getMinutes()).padStart(2, '0');
    const startTimeStr = `${hours}:${minutes}`;

    // Extract endTime in HH:mm format
    const endHours = String(endDateTime.getHours()).padStart(2, '0');
    const endMinutes = String(endDateTime.getMinutes()).padStart(2, '0');
    const endTimeStr = `${endHours}:${endMinutes}`;

    const webinar = await prisma.webinar.create({
        data: {
            title,
            slug,
            type,
            description,
            image,
            googleMeetLink,
            startDate: startDateTime,
            startTime: startTimeStr,
            endTime: endTimeStr,
            duration: durationMinutes,
            instructorName,
            instructorDescription: instructorDescription || null,
            instructorImage,
            instructorYearsExperience: instructorYearsExperience
                ? parseInt(instructorYearsExperience)
                : null,
            price: parseFloat(price) || 0,
            salePrice: salePrice ? parseFloat(salePrice) : null,
            isFree: isFree === "true" || isFree === true,
            seatType: seatType || "UNLIMITED",
            maxSeats: seatType === "LIMITED" && maxSeats ? parseInt(maxSeats) : null,
            numberOfSessions: numberOfSessions ? parseInt(numberOfSessions) : null,
            language: language || null,
            accessDuration: accessDuration || null,
            liveDoubtSolving: liveDoubtSolving === "true" || liveDoubtSolving === true,
            accessToRecordings:
                accessToRecordings === "true" || accessToRecordings === true,
            recordingsAccessDuration: recordingsAccessDuration || null,
            thumbnailVideoUrl: thumbnailVideoUrl || null,
            whatYouWillLearn: parsedWhatYouWillLearn,
            faqs: parsedFaqs,
            isPublished: isPublished === "true" || isPublished === true,
        },
    });

    const webinarWithUrls = {
        ...webinar,
        imageUrl: webinar.image ? getPublicUrl(webinar.image) : null,
        instructorImageUrl: webinar.instructorImage
            ? getPublicUrl(webinar.instructorImage)
            : null,
    };

    return res.status(201).json(
        new ApiResponsive(201, { webinar: webinarWithUrls }, "Webinar created successfully")
    );
});

/**
 * Update webinar
 */
export const updateWebinar = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const {
        title,
        type,
        description,
        instructorName,
        instructorDescription,
        instructorYearsExperience,
        price,
        salePrice,
        isFree,
        seatType,
        maxSeats,
        startDate,
        duration,
        numberOfSessions,
        language,
        accessDuration,
        liveDoubtSolving,
        accessToRecordings,
        recordingsAccessDuration,
        thumbnailVideoUrl,
        whatYouWillLearn,
        faqs,
        googleMeetLink,
        isPublished,
        removeImage,
        removeInstructorImage,
    } = req.body;

    const existingWebinar = await prisma.webinar.findUnique({ where: { id } });

    if (!existingWebinar) {
        throw new ApiError(404, "Webinar not found");
    }

    // Generate slug if title changed
    let slug = existingWebinar.slug;
    if (title && title !== existingWebinar.title) {
        let baseSlug = createSlug(title);
        slug = baseSlug;
        let counter = 1;
        while (
            await prisma.webinar.findFirst({
                where: { slug, id: { not: id } },
            })
        ) {
            slug = `${baseSlug}-${counter}`;
            counter++;
        }
    }

    // Parse JSON fields
    let parsedWhatYouWillLearn = existingWebinar.whatYouWillLearn;
    let parsedFaqs = existingWebinar.faqs;

    if (whatYouWillLearn !== undefined) {
        try {
            parsedWhatYouWillLearn =
                typeof whatYouWillLearn === "string"
                    ? JSON.parse(whatYouWillLearn)
                    : whatYouWillLearn;
        } catch (error) {
            throw new ApiError(400, "Invalid JSON format for whatYouWillLearn");
        }
    }

    if (faqs !== undefined) {
        try {
            parsedFaqs = typeof faqs === "string" ? JSON.parse(faqs) : faqs;
        } catch (error) {
            throw new ApiError(400, "Invalid JSON format for faqs");
        }
    }

    // Handle image uploads to R2 - either file upload or URL from MediaPicker
    let image = existingWebinar.image;
    let instructorImage = existingWebinar.instructorImage;

    if (req.files?.image?.[0]) {
        // File upload - DON'T delete old image, keep it in media library
        image = await uploadToR2(req.files.image[0], "webinars");
    } else if (req.body.imageUrl && !removeImage) {
        // URL from MediaPicker - extract R2 path from public URL
        // DON'T delete old image, keep it in media library
        try {
            const url = new URL(req.body.imageUrl);
            image = url.pathname.startsWith('/') ? url.pathname.slice(1) : url.pathname;
        } catch (error) {
            image = req.body.imageUrl.startsWith('/') ? req.body.imageUrl.slice(1) : req.body.imageUrl;
        }
    } else if (removeImage === 'true' || removeImage === true) {
        // Only delete image if explicitly requested to remove
        if (existingWebinar.image) {
            await deleteFromR2(existingWebinar.image);
        }
        image = null;
    }

    if (req.files?.instructorImage?.[0]) {
        // File upload - DON'T delete old image, keep it in media library
        instructorImage = await uploadToR2(req.files.instructorImage[0], "webinars");
    } else if (req.body.instructorImageUrl && !removeInstructorImage) {
        // URL from MediaPicker - extract R2 path from public URL
        // DON'T delete old image, keep it in media library
        try {
            const url = new URL(req.body.instructorImageUrl);
            instructorImage = url.pathname.startsWith('/') ? url.pathname.slice(1) : url.pathname;
        } catch (error) {
            instructorImage = req.body.instructorImageUrl.startsWith('/') ? req.body.instructorImageUrl.slice(1) : req.body.instructorImageUrl;
        }
    } else if (removeInstructorImage === 'true' || removeInstructorImage === true) {
        // Remove instructor image without uploading new one
        if (existingWebinar.instructorImage) {
            await deleteFromR2(existingWebinar.instructorImage);
        }
        instructorImage = null;
    }

    const updateData = {
        ...(title && { title }),
        ...(slug && { slug }),
        ...(type && { type }),
        ...(description && { description }),
        // Handle image - include if changed (uploaded new or removed)
        ...(image !== existingWebinar.image && { image }),
        ...(googleMeetLink !== undefined && { googleMeetLink }),
        ...(startDate && {
            startDate: new Date(startDate),
            // Calculate startTime from startDate
            startTime: (() => {
                const dt = new Date(startDate);
                const hours = String(dt.getHours()).padStart(2, '0');
                const minutes = String(dt.getMinutes()).padStart(2, '0');
                return `${hours}:${minutes}`;
            })(),
        }),
        ...(duration !== undefined && {
            duration: parseInt(duration) || null,
            // Calculate endTime from startDate + duration
            endTime: (() => {
                if (!startDate || !duration) {
                    // If updating duration but no startDate, calculate from existing startDate
                    const existingStartDate = existingWebinar.startDate;
                    const startDateTime = startDate ? new Date(startDate) : existingStartDate;
                    const durationMinutes = parseInt(duration) || existingWebinar.duration || 60;
                    const endDateTime = new Date(startDateTime.getTime() + durationMinutes * 60 * 1000);
                    const endHours = String(endDateTime.getHours()).padStart(2, '0');
                    const endMinutes = String(endDateTime.getMinutes()).padStart(2, '0');
                    return `${endHours}:${endMinutes}`;
                }
                const startDateTime = new Date(startDate);
                const durationMinutes = parseInt(duration) || 60;
                const endDateTime = new Date(startDateTime.getTime() + durationMinutes * 60 * 1000);
                const endHours = String(endDateTime.getHours()).padStart(2, '0');
                const endMinutes = String(endDateTime.getMinutes()).padStart(2, '0');
                return `${endHours}:${endMinutes}`;
            })(),
        }),
        ...(instructorName && { instructorName }),
        ...(instructorDescription !== undefined && {
            instructorDescription: instructorDescription || null,
        }),
        // Handle instructorImage - include if changed (uploaded new or removed)
        ...(instructorImage !== existingWebinar.instructorImage && { instructorImage }),
        ...(instructorYearsExperience !== undefined && {
            instructorYearsExperience: instructorYearsExperience
                ? parseInt(instructorYearsExperience)
                : null,
        }),
        ...(price !== undefined && { price: parseFloat(price) || 0 }),
        ...(salePrice !== undefined && {
            salePrice: salePrice ? parseFloat(salePrice) : null,
        }),
        ...(isFree !== undefined && {
            isFree: isFree === "true" || isFree === true,
        }),
        ...(seatType && { seatType }),
        ...(maxSeats !== undefined && {
            maxSeats: seatType === "LIMITED" && maxSeats ? parseInt(maxSeats) : null,
        }),
        ...(numberOfSessions !== undefined && {
            numberOfSessions: numberOfSessions ? parseInt(numberOfSessions) : null,
        }),
        ...(language !== undefined && { language: language || null }),
        ...(accessDuration !== undefined && { accessDuration: accessDuration || null }),
        ...(liveDoubtSolving !== undefined && {
            liveDoubtSolving: liveDoubtSolving === "true" || liveDoubtSolving === true,
        }),
        ...(accessToRecordings !== undefined && {
            accessToRecordings:
                accessToRecordings === "true" || accessToRecordings === true,
        }),
        ...(recordingsAccessDuration !== undefined && {
            recordingsAccessDuration: recordingsAccessDuration || null,
        }),
        ...(thumbnailVideoUrl !== undefined && {
            thumbnailVideoUrl: thumbnailVideoUrl || null,
        }),
        ...(parsedWhatYouWillLearn && { whatYouWillLearn: parsedWhatYouWillLearn }),
        ...(parsedFaqs && { faqs: parsedFaqs }),
        ...(isPublished !== undefined && {
            isPublished: isPublished === "true" || isPublished === true,
        }),
    };

    const webinar = await prisma.webinar.update({
        where: { id },
        data: updateData,
    });

    const webinarWithUrls = {
        ...webinar,
        imageUrl: webinar.image ? getPublicUrl(webinar.image) : null,
        instructorImageUrl: webinar.instructorImage
            ? getPublicUrl(webinar.instructorImage)
            : null,
    };

    return res.status(200).json(
        new ApiResponsive(200, { webinar: webinarWithUrls }, "Webinar updated successfully")
    );
});

/**
 * Delete webinar
 */
export const deleteWebinar = asyncHandler(async (req, res) => {
    const { id } = req.params;

    const webinar = await prisma.webinar.findUnique({ where: { id } });

    if (!webinar) {
        throw new ApiError(404, "Webinar not found");
    }

    // Delete images from R2
    if (webinar.image) {
        try {
            await deleteFromR2(webinar.image);
        } catch (error) {
            console.error(`Failed to delete webinar image: ${webinar.image}`, error);
        }
    }
    if (webinar.instructorImage) {
        try {
            await deleteFromR2(webinar.instructorImage);
        } catch (error) {
            console.error(`Failed to delete instructor image: ${webinar.instructorImage}`, error);
        }
    }

    await prisma.webinar.delete({ where: { id } });

    return res.status(200).json(
        new ApiResponsive(200, null, "Webinar deleted successfully")
    );
});

/**
 * Toggle publish status
 */
export const togglePublish = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { isPublished } = req.body;

    const webinar = await prisma.webinar.findUnique({ where: { id } });

    if (!webinar) {
        throw new ApiError(404, "Webinar not found");
    }

    const updated = await prisma.webinar.update({
        where: { id },
        data: { isPublished: isPublished === true || isPublished === "true" },
    });

    return res.status(200).json(
        new ApiResponsive(
            200,
            { webinar: updated },
            `Webinar ${isPublished ? "published" : "unpublished"} successfully`
        )
    );
});

/**
 * Check if user is enrolled and get Google Meet link (only if within 10 minutes)
 * SECURITY: Google Meet link is NEVER exposed before 10 minutes before start
 */
export const checkEnrollment = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const userId = req.user.id;

    // Check enrollment - verify payment is completed
    const enrollment = await prisma.webinarOrderItem.findFirst({
        where: {
            webinarId: id,
            userId,
            paymentId: { not: null }, // Must have payment ID (paid)
        },
        include: {
            webinar: {
                select: {
                    id: true,
                    googleMeetLink: true,
                    startDate: true,
                    startTime: true,
                },
            },
        },
    });

    if (!enrollment) {
        return res.status(200).json(
            new ApiResponsive(200, {
                enrolled: false,
                canAccessLink: false,
                googleMeetLink: null,
            }, "User not enrolled")
        );
    }

    // Calculate session start time (combine startDate with startTime if available)
    const now = new Date();
    const sessionStart = new Date(enrollment.webinar.startDate);

    // Combine startDate with startTime if available (startTime is in HH:mm format)
    if (enrollment.webinar.startTime) {
        const [hours, minutes] = enrollment.webinar.startTime.split(':').map(Number);
        sessionStart.setHours(hours, minutes, 0, 0);
    }

    // Get duration from webinar (default to 60 minutes if not set)
    const webinar = await prisma.webinar.findUnique({
        where: { id: enrollment.webinar.id },
        select: { duration: true },
    });
    const durationMinutes = webinar?.duration || 60;
    const sessionEnd = new Date(sessionStart.getTime() + durationMinutes * 60 * 1000);

    // Check if current time is within 10 minutes before start OR session is currently live
    const tenMinutesBefore = new Date(sessionStart.getTime() - 10 * 60 * 1000);
    const isLive = now >= sessionStart && now <= sessionEnd;
    const canAccessLink = now >= tenMinutesBefore || isLive;

    // SECURITY: Only return Google Meet link if user is enrolled AND within 10 minutes
    return res.status(200).json(
        new ApiResponsive(200, {
            enrolled: true,
            canAccessLink,
            googleMeetLink: canAccessLink && enrollment.webinar.googleMeetLink
                ? enrollment.webinar.googleMeetLink
                : null,
            startDate: enrollment.webinar.startDate,
            startTime: enrollment.webinar.startTime,
        })
    );
});

