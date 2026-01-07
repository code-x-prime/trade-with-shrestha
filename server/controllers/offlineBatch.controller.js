import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiResponsive } from "../utils/ApiResponsive.js";
import { ApiError } from "../utils/ApiError.js";
import { prisma } from "../config/db.js";
import { getPublicUrl, uploadToR2, deleteFromR2 } from "../utils/cloudflare.js";
import { createSlug } from "../helper/Slug.js";

/**
 * Get all offline batches (Public - only OPEN status)
 */
export const getOfflineBatches = asyncHandler(async (req, res) => {
    const { city, status, page = 1, limit = 20 } = req.query;
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    const where = {
        status: status || "OPEN",
    };

    if (city) {
        where.city = { contains: city, mode: "insensitive" };
    }

    const [batches, total] = await Promise.all([
        prisma.offlineBatch.findMany({
            where,
            orderBy: { startDate: "asc" },
            skip,
            take: limitNum,
            include: {
                _count: {
                    select: { enrollments: true },
                },
            },
        }),
        prisma.offlineBatch.count({ where }),
    ]);

    const batchesWithUrls = batches.map((batch) => ({
        ...batch,
        thumbnailUrl: batch.thumbnail ? getPublicUrl(batch.thumbnail) : null,
        seatsLeft: batch.isUnlimitedSeats
            ? null
            : batch.seatLimit
                ? batch.seatLimit - batch.seatsFilled
                : null,
    }));

    return res.status(200).json(
        new ApiResponsive(
            200,
            {
                batches: batchesWithUrls,
                pagination: {
                    total,
                    page: pageNum,
                    limit: limitNum,
                    totalPages: Math.ceil(total / limitNum),
                },
            },
            "Offline batches fetched successfully"
        )
    );
});

/**
 * Get offline batch by slug (Public)
 */
export const getOfflineBatchBySlug = asyncHandler(async (req, res) => {
    const { slug } = req.params;
    const userId = req.user?.id; // Optional - user might not be authenticated

    const batch = await prisma.offlineBatch.findUnique({
        where: { slug },
        include: {
            _count: {
                select: { enrollments: true },
            },
        },
    });

    if (!batch) {
        throw new ApiError(404, "Offline batch not found");
    }

    // Check if user is enrolled (if authenticated)
    // Check both enrollment and paid orders - verify order status is COMPLETED
    let isEnrolled = false;
    if (userId) {
        // Check enrollment - verify linked order is COMPLETED
        const enrollment = await prisma.offlineBatchEnrollment.findUnique({
            where: {
                batchId_userId: {
                    batchId: batch.id,
                    userId: userId,
                },
            },
        });

        if (enrollment && enrollment.paymentStatus === 'PAID') {
            isEnrolled = true;
        }

        // Check paid orders - verify order status is COMPLETED
        const paidOrder = await prisma.offlineBatchOrder.findFirst({
            where: {
                batchId: batch.id,
                userId: userId,
                paymentStatus: 'PAID',
            },
            include: {
                order: {
                    select: {
                        status: true,
                        paymentStatus: true,
                    },
                },
            },
        });

        if (paidOrder && paidOrder.order?.status === 'COMPLETED' && paidOrder.order?.paymentStatus === 'PAID') {
            isEnrolled = true;
        }
    }

    const batchWithUrls = {
        ...batch,
        thumbnailUrl: batch.thumbnail ? getPublicUrl(batch.thumbnail) : null,
        seatsLeft: batch.isUnlimitedSeats
            ? null
            : batch.seatLimit
                ? batch.seatLimit - batch.seatsFilled
                : null,
        isEnrolled,
    };

    return res.status(200).json(
        new ApiResponsive(200, { batch: batchWithUrls }, "Offline batch fetched successfully")
    );
});

/**
 * Get offline batch by ID (Public)
 */
export const getOfflineBatchByIdPublic = asyncHandler(async (req, res) => {
    const { id } = req.params;

    const batch = await prisma.offlineBatch.findUnique({
        where: { id },
        include: {
            _count: {
                select: { enrollments: true },
            },
        },
    });

    if (!batch) {
        throw new ApiError(404, "Offline batch not found");
    }

    const batchWithUrls = {
        ...batch,
        thumbnailUrl: batch.thumbnail ? getPublicUrl(batch.thumbnail) : null,
        seatsLeft: batch.isUnlimitedSeats
            ? null
            : batch.seatLimit
                ? batch.seatLimit - batch.seatsFilled
                : null,
    };

    return res.status(200).json(
        new ApiResponsive(200, { batch: batchWithUrls }, "Offline batch fetched successfully")
    );
});

/**
 * Get all offline batches (Admin)
 */
export const getAllOfflineBatches = asyncHandler(async (req, res) => {
    const { status, city, page = 1, limit = 50 } = req.query;
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    const where = {};
    if (status) where.status = status;
    if (city) where.city = { contains: city, mode: "insensitive" };

    const [batches, total] = await Promise.all([
        prisma.offlineBatch.findMany({
            where,
            orderBy: { createdAt: "desc" },
            skip,
            take: limitNum,
            include: {
                _count: {
                    select: { enrollments: true },
                },
            },
        }),
        prisma.offlineBatch.count({ where }),
    ]);

    const batchesWithUrls = batches.map((batch) => ({
        ...batch,
        thumbnailUrl: batch.thumbnail ? getPublicUrl(batch.thumbnail) : null,
    }));

    return res.status(200).json(
        new ApiResponsive(
            200,
            {
                batches: batchesWithUrls,
                pagination: {
                    total,
                    page: pageNum,
                    limit: limitNum,
                    totalPages: Math.ceil(total / limitNum),
                },
            },
            "Offline batches fetched successfully"
        )
    );
});

/**
 * Get offline batch by ID (Admin)
 */
export const getOfflineBatchById = asyncHandler(async (req, res) => {
    const { id } = req.params;

    const batch = await prisma.offlineBatch.findUnique({
        where: { id },
        include: {
            enrollments: {
                include: {
                    user: {
                        select: {
                            id: true,
                            name: true,
                            email: true,
                            phone: true,
                        },
                    },
                },
                orderBy: { enrolledAt: "desc" },
            },
            _count: {
                select: { enrollments: true },
            },
        },
    });

    if (!batch) {
        throw new ApiError(404, "Offline batch not found");
    }

    const batchWithUrls = {
        ...batch,
        thumbnailUrl: batch.thumbnail ? getPublicUrl(batch.thumbnail) : null,
    };

    return res.status(200).json(
        new ApiResponsive(200, { batch: batchWithUrls }, "Offline batch fetched successfully")
    );
});

/**
 * Create offline batch (Admin)
 */
export const createOfflineBatch = asyncHandler(async (req, res) => {
    const {
        title,
        shortDescription,
        description,
        centerName,
        address,
        city,
        state,
        googleMap,
        startDate,
        endDate,
        startTime,
        endTime,
        days,
        instructorName,
        instructorBio,
        pricingType,
        price,
        salePrice,
        isFree,
        isUnlimitedSeats,
        seatLimit,
        includesNotes,
        includesRecordings,
        includesTests,
        includesDoubtSupport,
        status,
    } = req.body;

    if (!title || !description || !centerName || !address || !city || !state) {
        throw new ApiError(400, "Required fields are missing");
    }

    // Generate slug
    let baseSlug = createSlug(title);
    let slug = baseSlug;
    let slugCounter = 1;

    while (await prisma.offlineBatch.findFirst({ where: { slug } })) {
        slug = `${baseSlug}-${slugCounter}`;
        slugCounter++;
    }

    // Handle thumbnail upload - either file upload or URL from MediaPicker
    let thumbnail = null;
    if (req.files && req.files.thumbnail && req.files.thumbnail[0]) {
        // File upload
        thumbnail = await uploadToR2(req.files.thumbnail[0], "offline-batches");
    } else if (req.body.thumbnailUrl) {
        // URL from MediaPicker - extract R2 path from public URL
        try {
            const url = new URL(req.body.thumbnailUrl);
            thumbnail = url.pathname.startsWith('/') ? url.pathname.slice(1) : url.pathname;
        } catch (error) {
            thumbnail = req.body.thumbnailUrl.startsWith('/') ? req.body.thumbnailUrl.slice(1) : req.body.thumbnailUrl;
        }
    }

    // Convert string booleans to actual booleans
    const isFreeBool = isFree === true || isFree === "true" || pricingType === "FREE";
    const isUnlimitedSeatsBool = isUnlimitedSeats === true || isUnlimitedSeats === "true";
    const includesNotesBool = includesNotes === true || includesNotes === "true" || includesNotes === undefined;
    const includesRecordingsBool = includesRecordings === true || includesRecordings === "true";
    const includesTestsBool = includesTests === true || includesTests === "true" || includesTests === undefined;
    const includesDoubtSupportBool = includesDoubtSupport === true || includesDoubtSupport === "true" || includesDoubtSupport === undefined;

    // Auto-update status based on seats
    let finalStatus = status || "DRAFT";
    if (!isUnlimitedSeatsBool && seatLimit && seatLimit > 0) {
        // Will be checked on enrollment
    }

    const batch = await prisma.offlineBatch.create({
        data: {
            title,
            slug,
            thumbnail,
            shortDescription: shortDescription || null,
            description,
            centerName,
            address,
            city,
            state,
            googleMap: googleMap || null,
            startDate: new Date(startDate),
            endDate: new Date(endDate),
            startTime,
            endTime,
            days: Array.isArray(days) ? days : [],
            instructorName,
            instructorBio: instructorBio || null,
            pricingType: pricingType || "PAID",
            price: pricingType === "PAID" && !isFreeBool ? parseFloat(price || 0) : null,
            salePrice: pricingType === "PAID" && salePrice ? parseFloat(salePrice) : null,
            isFree: isFreeBool,
            isUnlimitedSeats: isUnlimitedSeatsBool,
            seatLimit: isUnlimitedSeatsBool ? null : seatLimit ? parseInt(seatLimit) : null,
            seatsFilled: 0,
            includesNotes: includesNotesBool,
            includesRecordings: includesRecordingsBool,
            includesTests: includesTestsBool,
            includesDoubtSupport: includesDoubtSupportBool,
            status: finalStatus,
        },
    });

    const batchWithUrls = {
        ...batch,
        thumbnailUrl: batch.thumbnail ? getPublicUrl(batch.thumbnail) : null,
    };

    return res.status(201).json(
        new ApiResponsive(201, { batch: batchWithUrls }, "Offline batch created successfully")
    );
});

/**
 * Update offline batch (Admin)
 */
export const updateOfflineBatch = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const {
        title,
        shortDescription,
        description,
        centerName,
        address,
        city,
        state,
        googleMap,
        startDate,
        endDate,
        startTime,
        endTime,
        days,
        instructorName,
        instructorBio,
        pricingType,
        price,
        salePrice,
        isFree,
        isUnlimitedSeats,
        seatLimit,
        includesNotes,
        includesRecordings,
        includesTests,
        includesDoubtSupport,
        status,
        removeThumbnail,
    } = req.body;

    const batch = await prisma.offlineBatch.findUnique({ where: { id } });
    if (!batch) {
        throw new ApiError(404, "Offline batch not found");
    }

    let slug = batch.slug;
    if (title && title !== batch.title) {
        let baseSlug = createSlug(title);
        let newSlug = baseSlug;
        let slugCounter = 1;

        while (await prisma.offlineBatch.findFirst({ where: { slug: newSlug, id: { not: id } } })) {
            newSlug = `${baseSlug}-${slugCounter}`;
            slugCounter++;
        }
        slug = newSlug;
    }

    let thumbnail = batch.thumbnail;

    // Handle thumbnail removal
    if (removeThumbnail === true && thumbnail) {
        await deleteFromR2(thumbnail);
        thumbnail = null;
    }

    // Handle new thumbnail upload - either file upload or URL from MediaPicker
    if (req.files && req.files.thumbnail && req.files.thumbnail[0]) {
        // File upload - DON'T delete old thumbnail, keep it in media library
        thumbnail = await uploadToR2(req.files.thumbnail[0], "offline-batches");
    } else if (req.body.thumbnailUrl && !removeThumbnail) {
        // URL from MediaPicker - extract R2 path from public URL
        // DON'T delete old thumbnail, keep it in media library
        try {
            const url = new URL(req.body.thumbnailUrl);
            thumbnail = url.pathname.startsWith('/') ? url.pathname.slice(1) : url.pathname;
        } catch (error) {
            thumbnail = req.body.thumbnailUrl.startsWith('/') ? req.body.thumbnailUrl.slice(1) : req.body.thumbnailUrl;
        }
    }

    // Convert string booleans to actual booleans
    const isFreeBool = isFree !== undefined ? (isFree === true || isFree === "true") : batch.isFree;
    const isUnlimitedSeatsBool = isUnlimitedSeats !== undefined ? (isUnlimitedSeats === true || isUnlimitedSeats === "true") : batch.isUnlimitedSeats;
    const includesNotesBool = includesNotes !== undefined ? (includesNotes === true || includesNotes === "true") : batch.includesNotes;
    const includesRecordingsBool = includesRecordings !== undefined ? (includesRecordings === true || includesRecordings === "true") : batch.includesRecordings;
    const includesTestsBool = includesTests !== undefined ? (includesTests === true || includesTests === "true") : batch.includesTests;
    const includesDoubtSupportBool = includesDoubtSupport !== undefined ? (includesDoubtSupport === true || includesDoubtSupport === "true") : batch.includesDoubtSupport;

    // Auto-update status based on seats
    let finalStatus = status || batch.status;
    if (!isUnlimitedSeatsBool && seatLimit) {
        if (batch.seatsFilled >= seatLimit) {
            finalStatus = "FULL";
        }
    }

    const updatedBatch = await prisma.offlineBatch.update({
        where: { id },
        data: {
            ...(title && { title }),
            ...(slug && { slug }),
            ...(thumbnail !== undefined && { thumbnail }),
            ...(shortDescription !== undefined && { shortDescription }),
            ...(description && { description }),
            ...(centerName && { centerName }),
            ...(address && { address }),
            ...(city && { city }),
            ...(state && { state }),
            ...(googleMap !== undefined && { googleMap }),
            ...(startDate && { startDate: new Date(startDate) }),
            ...(endDate && { endDate: new Date(endDate) }),
            ...(startTime && { startTime }),
            ...(endTime && { endTime }),
            ...(days !== undefined && { days: Array.isArray(days) ? days : [] }),
            ...(instructorName && { instructorName }),
            ...(instructorBio !== undefined && { instructorBio }),
            ...(pricingType && { pricingType }),
            ...(price !== undefined && {
                price: pricingType === "PAID" && !isFreeBool ? parseFloat(price || 0) : null,
            }),
            ...(salePrice !== undefined && {
                salePrice: pricingType === "PAID" && salePrice ? parseFloat(salePrice) : null,
            }),
            ...(isFree !== undefined && { isFree: isFreeBool }),
            ...(isUnlimitedSeats !== undefined && { isUnlimitedSeats: isUnlimitedSeatsBool }),
            ...(seatLimit !== undefined && {
                seatLimit: isUnlimitedSeatsBool ? null : seatLimit ? parseInt(seatLimit) : null,
            }),
            ...(includesNotes !== undefined && { includesNotes: includesNotesBool }),
            ...(includesRecordings !== undefined && { includesRecordings: includesRecordingsBool }),
            ...(includesTests !== undefined && { includesTests: includesTestsBool }),
            ...(includesDoubtSupport !== undefined && { includesDoubtSupport: includesDoubtSupportBool }),
            ...(finalStatus && { status: finalStatus }),
        },
    });

    const batchWithUrls = {
        ...updatedBatch,
        thumbnailUrl: updatedBatch.thumbnail ? getPublicUrl(updatedBatch.thumbnail) : null,
    };

    return res.status(200).json(
        new ApiResponsive(200, { batch: batchWithUrls }, "Offline batch updated successfully")
    );
});

/**
 * Delete offline batch (Admin)
 */
export const deleteOfflineBatch = asyncHandler(async (req, res) => {
    const { id } = req.params;

    const batch = await prisma.offlineBatch.findUnique({ where: { id } });
    if (!batch) {
        throw new ApiError(404, "Offline batch not found");
    }

    // Delete thumbnail from R2
    if (batch.thumbnail) {
        await deleteFromR2(batch.thumbnail);
    }

    await prisma.offlineBatch.delete({ where: { id } });

    return res.status(200).json(
        new ApiResponsive(200, null, "Offline batch deleted successfully")
    );
});

/**
 * Enroll in offline batch (User)
 */
export const enrollInOfflineBatch = asyncHandler(async (req, res) => {
    const { id } = req.user;
    const { batchId } = req.body;

    if (!batchId) {
        throw new ApiError(400, "Batch ID is required");
    }

    const batch = await prisma.offlineBatch.findUnique({ where: { id: batchId } });
    if (!batch) {
        throw new ApiError(404, "Offline batch not found");
    }

    // Check if already enrolled
    const existingEnrollment = await prisma.offlineBatchEnrollment.findUnique({
        where: {
            batchId_userId: {
                batchId,
                userId: id,
            },
        },
    });

    if (existingEnrollment) {
        throw new ApiError(400, "You are already enrolled in this batch");
    }

    // Check seat availability
    if (!batch.isUnlimitedSeats && batch.seatLimit) {
        if (batch.seatsFilled >= batch.seatLimit) {
            throw new ApiError(400, "Batch is full");
        }
    }

    // Create enrollment
    const enrollment = await prisma.offlineBatchEnrollment.create({
        data: {
            batchId,
            userId: id,
            paymentStatus: batch.isFree ? "PAID" : "UNPAID",
            amountPaid: batch.isFree ? 0 : 0,
        },
    });

    // Update seats filled
    const updatedBatch = await prisma.offlineBatch.update({
        where: { id: batchId },
        data: {
            seatsFilled: { increment: 1 },
            status:
                !batch.isUnlimitedSeats &&
                    batch.seatLimit &&
                    batch.seatsFilled + 1 >= batch.seatLimit
                    ? "FULL"
                    : batch.status === "DRAFT"
                        ? "OPEN"
                        : batch.status,
        },
    });

    return res.status(201).json(
        new ApiResponsive(
            201,
            { enrollment, batch: updatedBatch },
            "Successfully enrolled in offline batch"
        )
    );
});

