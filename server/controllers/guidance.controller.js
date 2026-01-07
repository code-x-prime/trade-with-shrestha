import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiResponsive } from "../utils/ApiResponsive.js";
import { ApiError } from "../utils/ApiError.js";
import { prisma } from "../config/db.js";
import { uploadToR2, deleteFromR2, getPublicUrl } from "../utils/cloudflare.js";
import { createSlug } from "../helper/Slug.js";
import { getItemPricing } from "../utils/flashSaleHelper.js";

/**
 * Get all guidance
 */
export const getGuidance = asyncHandler(async (req, res) => {
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
            { expertName: { contains: search, mode: "insensitive" } },
        ];
    }

    if (status) {
        where.status = status.toUpperCase();
    }

    const [guidance, total] = await Promise.all([
        prisma.guidance.findMany({
            where,
            skip,
            take: parseInt(limit),
            orderBy: { createdAt: "desc" },
            include: {
                _count: {
                    select: {
                        slots: true,
                        orders: true,
                    },
                },
                slots: {
                    where: {
                        status: 'BOOKED',
                    },
                    select: {
                        id: true,
                        date: true,
                        startTime: true,
                        endTime: true,
                    },
                },
            },
        }),
        prisma.guidance.count({ where }),
    ]);

    // Check if user is admin - if yes, show Google Meet link
    const isAdmin = req.user && req.user.role === "ADMIN";

    // Add flash sale pricing for each guidance
    const guidanceWithUrls = await Promise.all(guidance.map(async (g) => {
        const pricing = await getItemPricing('GUIDANCE', g.id, g.price, null);

        return {
            ...g,
            expertImageUrl: g.expertImage ? getPublicUrl(g.expertImage) : null,
            googleMeetLink: isAdmin ? g.googleMeetLink : undefined,
            pricing,
        };
    }));

    return res.status(200).json(
        new ApiResponsive(200, {
            guidance: guidanceWithUrls,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total,
                totalPages: Math.ceil(total / parseInt(limit)),
            },
        }, "Guidance fetched successfully")
    );
});

/**
 * Get guidance by ID
 */
export const getGuidanceById = asyncHandler(async (req, res) => {
    const { id } = req.params;

    const guidance = await prisma.guidance.findUnique({
        where: { id },
        include: {
            slots: {
                where: {
                    status: "AVAILABLE",
                },
                orderBy: [
                    { date: "asc" },
                    { startTime: "asc" },
                ],
            },
        },
    });

    if (!guidance) {
        throw new ApiError(404, "Guidance not found");
    }

    // Check if user is admin - if yes, show Google Meet link
    const isAdmin = req.user && req.user.role === "ADMIN";

    const guidanceWithUrls = {
        ...guidance,
        expertImageUrl: guidance.expertImage ? getPublicUrl(guidance.expertImage) : null,
        // Only expose Google Meet link to admin
        googleMeetLink: isAdmin ? guidance.googleMeetLink : undefined,
    };

    return res.status(200).json(
        new ApiResponsive(200, { guidance: guidanceWithUrls }, "Guidance fetched successfully")
    );
});

/**
 * Get guidance by slug
 */
export const getGuidanceBySlug = asyncHandler(async (req, res) => {
    const { slug } = req.params;

    const guidance = await prisma.guidance.findUnique({
        where: { slug },
        include: {
            slots: {
                where: {
                    status: "AVAILABLE",
                    date: {
                        gte: new Date(new Date().setHours(0, 0, 0, 0)), // Only future dates
                    },
                },
                orderBy: [
                    { date: "asc" },
                    { startTime: "asc" },
                ],
            },
        },
    });

    if (!guidance) {
        throw new ApiError(404, "Guidance not found");
    }

    // Get flash sale pricing (Guidance doesn't have salePrice)
    const pricing = await getItemPricing('GUIDANCE', guidance.id, guidance.price, null);

    const guidanceWithUrls = {
        ...guidance,
        expertImageUrl: guidance.expertImage ? getPublicUrl(guidance.expertImage) : null,
        // NEVER expose Google Meet link in public API
        googleMeetLink: undefined,
        // Flash sale pricing info
        pricing,
    };

    return res.status(200).json(
        new ApiResponsive(200, { guidance: guidanceWithUrls }, "Guidance fetched successfully")
    );
});

/**
 * Create guidance
 */
export const createGuidance = asyncHandler(async (req, res) => {
    const {
        title,
        description,
        expertName,
        expertBio,
        expertise,
        language,
        price,
        durationMinutes,
        googleMeetLink,
        status = "ACTIVE",
    } = req.body;

    if (!title || !expertName || !price || !durationMinutes || !googleMeetLink) {
        throw new ApiError(400, "Required fields are missing");
    }

    // Generate slug
    let baseSlug = createSlug(title);
    let slug = baseSlug;
    let counter = 1;
    while (await prisma.guidance.findUnique({ where: { slug } })) {
        slug = `${baseSlug}-${counter}`;
        counter++;
    }

    // Parse JSON fields
    let parsedExpertise = [];
    if (expertise) {
        try {
            parsedExpertise = typeof expertise === "string" ? JSON.parse(expertise) : expertise;
        } catch (error) {
            throw new ApiError(400, "Invalid JSON format for expertise");
        }
    }

    // Handle image upload - either file upload or URL from MediaPicker
    let expertImage = null;
    const uploadedFiles = [];
    try {
        if (req.file) {
            // File upload
            expertImage = await uploadToR2(req.file, "guidance");
            uploadedFiles.push(expertImage);
        } else if (req.body.expertImageUrl) {
            // URL from MediaPicker - extract R2 path from public URL
            try {
                const url = new URL(req.body.expertImageUrl);
                expertImage = url.pathname.startsWith('/') ? url.pathname.slice(1) : url.pathname;
            } catch (error) {
                expertImage = req.body.expertImageUrl.startsWith('/') ? req.body.expertImageUrl.slice(1) : req.body.expertImageUrl;
            }
        }
    } catch (uploadError) {
        for (const file of uploadedFiles) {
            try {
                await deleteFromR2(file);
            } catch (deleteError) {
                console.error(`Failed to delete file ${file}:`, deleteError);
            }
        }
        throw new ApiError(500, "Failed to upload image to R2");
    }

    const guidance = await prisma.guidance.create({
        data: {
            title,
            slug,
            description: description || "",
            expertName,
            expertBio: expertBio || null,
            expertImage,
            expertise: parsedExpertise,
            language: language || null,
            price: parseFloat(price),
            durationMinutes: parseInt(durationMinutes),
            googleMeetLink,
            status: status.toUpperCase(),
        },
    });

    const guidanceWithUrls = {
        ...guidance,
        expertImageUrl: guidance.expertImage ? getPublicUrl(guidance.expertImage) : null,
    };

    return res.status(201).json(
        new ApiResponsive(201, { guidance: guidanceWithUrls }, "Guidance created successfully")
    );
});

/**
 * Update guidance
 */
export const updateGuidance = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const {
        title,
        description,
        expertName,
        expertBio,
        expertise,
        language,
        price,
        durationMinutes,
        googleMeetLink,
        status,
        removeExpertImage,
    } = req.body;

    const existingGuidance = await prisma.guidance.findUnique({ where: { id } });

    if (!existingGuidance) {
        throw new ApiError(404, "Guidance not found");
    }

    // Generate slug if title changed
    let slug = existingGuidance.slug;
    if (title && title !== existingGuidance.title) {
        let baseSlug = createSlug(title);
        slug = baseSlug;
        let counter = 1;
        while (
            await prisma.guidance.findFirst({
                where: { slug, id: { not: id } },
            })
        ) {
            slug = `${baseSlug}-${counter}`;
            counter++;
        }
    }

    // Parse JSON fields
    let parsedExpertise = existingGuidance.expertise;
    if (expertise !== undefined) {
        try {
            parsedExpertise = typeof expertise === "string" ? JSON.parse(expertise) : expertise;
        } catch (error) {
            throw new ApiError(400, "Invalid JSON format for expertise");
        }
    }

    // Handle image upload and removal
    let expertImage = existingGuidance.expertImage;
    const uploadedFiles = [];

    // Handle image removal
    if (removeExpertImage === "true" || removeExpertImage === true) {
        if (existingGuidance.expertImage) {
            try {
                await deleteFromR2(existingGuidance.expertImage);
            } catch (error) {
                console.error("Error deleting image:", error);
            }
        }
        expertImage = null;
    }

    // Handle new image upload - either file upload or URL from MediaPicker
    if (req.file) {
        // File upload - DON'T delete old image, keep it in media library
        try {
            expertImage = await uploadToR2(req.file, "guidance");
            uploadedFiles.push(expertImage);
        } catch (uploadError) {
            throw new ApiError(500, "Failed to upload image to R2");
        }
    } else if (req.body.expertImageUrl && !removeExpertImage) {
        // URL from MediaPicker - extract R2 path from public URL
        // DON'T delete old image, keep it in media library
        try {
            const url = new URL(req.body.expertImageUrl);
            expertImage = url.pathname.startsWith('/') ? url.pathname.slice(1) : url.pathname;
        } catch (error) {
            expertImage = req.body.expertImageUrl.startsWith('/') ? req.body.expertImageUrl.slice(1) : req.body.expertImageUrl;
        }
    }

    const updateData = {};
    if (title) updateData.title = title;
    if (slug !== existingGuidance.slug) updateData.slug = slug;
    if (description !== undefined) updateData.description = description;
    if (expertName) updateData.expertName = expertName;
    if (expertBio !== undefined) updateData.expertBio = expertBio || null;
    if (expertImage !== existingGuidance.expertImage) {
        updateData.expertImage = expertImage;
    }
    if (expertise !== undefined) updateData.expertise = parsedExpertise;
    if (language !== undefined) updateData.language = language || null;
    if (price !== undefined) updateData.price = parseFloat(price);
    if (durationMinutes !== undefined) updateData.durationMinutes = parseInt(durationMinutes);
    if (googleMeetLink !== undefined) updateData.googleMeetLink = googleMeetLink;
    if (status !== undefined) updateData.status = status.toUpperCase();

    const updatedGuidance = await prisma.guidance.update({
        where: { id },
        data: updateData,
    });

    const guidanceWithUrls = {
        ...updatedGuidance,
        expertImageUrl: updatedGuidance.expertImage ? getPublicUrl(updatedGuidance.expertImage) : null,
    };

    return res.status(200).json(
        new ApiResponsive(200, { guidance: guidanceWithUrls }, "Guidance updated successfully")
    );
});

/**
 * Delete guidance
 */
export const deleteGuidance = asyncHandler(async (req, res) => {
    const { id } = req.params;

    const guidance = await prisma.guidance.findUnique({ where: { id } });
    if (!guidance) {
        throw new ApiError(404, "Guidance not found");
    }

    // Delete image from R2
    if (guidance.expertImage) {
        try {
            await deleteFromR2(guidance.expertImage);
        } catch (error) {
            console.error("Error deleting image:", error);
        }
    }

    await prisma.guidance.delete({ where: { id } });

    return res.status(200).json(
        new ApiResponsive(200, {}, "Guidance deleted successfully")
    );
});

/**
 * Toggle guidance status (Active/Inactive)
 */
export const toggleGuidanceStatus = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { status } = req.body;

    const guidance = await prisma.guidance.findUnique({ where: { id } });
    if (!guidance) {
        throw new ApiError(404, "Guidance not found");
    }

    const updated = await prisma.guidance.update({
        where: { id },
        data: { status: status.toUpperCase() },
    });

    const guidanceWithUrls = {
        ...updated,
        expertImageUrl: updated.expertImage ? getPublicUrl(updated.expertImage) : null,
    };

    return res.status(200).json(
        new ApiResponsive(200, { guidance: guidanceWithUrls }, "Guidance status updated successfully")
    );
});

/**
 * Create slot for guidance
 */
export const createSlot = asyncHandler(async (req, res) => {
    const { guidanceId } = req.params;
    const { date, startTime, endTime } = req.body;

    if (!date || !startTime || !endTime) {
        throw new ApiError(400, "Date, startTime, and endTime are required");
    }

    const guidance = await prisma.guidance.findUnique({ where: { id: guidanceId } });
    if (!guidance) {
        throw new ApiError(404, "Guidance not found");
    }

    // Check if slot already exists
    const existingSlot = await prisma.guidanceSlot.findUnique({
        where: {
            guidanceId_date_startTime: {
                guidanceId,
                date: new Date(date),
                startTime,
            },
        },
    });

    if (existingSlot) {
        throw new ApiError(400, "Slot already exists for this date and time");
    }

    const slot = await prisma.guidanceSlot.create({
        data: {
            guidanceId,
            date: new Date(date),
            startTime,
            endTime,
            status: "AVAILABLE",
        },
    });

    return res.status(201).json(
        new ApiResponsive(201, { slot }, "Slot created successfully")
    );
});

/**
 * Get slots for guidance (Admin only - all slots)
 */
export const getSlots = asyncHandler(async (req, res) => {
    const { guidanceId } = req.params;
    const { date, status } = req.query;

    const where = { guidanceId };

    if (date) {
        const dateObj = new Date(date);
        const startOfDay = new Date(dateObj.setHours(0, 0, 0, 0));
        const endOfDay = new Date(dateObj.setHours(23, 59, 59, 999));
        where.date = {
            gte: startOfDay,
            lte: endOfDay,
        };
    }

    if (status) {
        where.status = status.toUpperCase();
    }

    const slots = await prisma.guidanceSlot.findMany({
        where,
        orderBy: [
            { date: "asc" },
            { startTime: "asc" },
        ],
    });

    return res.status(200).json(
        new ApiResponsive(200, { slots }, "Slots fetched successfully")
    );
});

/**
 * Get available slots for guidance (Public - only AVAILABLE slots)
 */
export const getAvailableSlots = asyncHandler(async (req, res) => {
    const { guidanceId } = req.params;
    const { date } = req.query;

    const where = {
        guidanceId,
        status: "AVAILABLE",
        date: {
            gte: new Date(new Date().setHours(0, 0, 0, 0)), // Only future dates
        },
    };

    if (date) {
        const dateObj = new Date(date);
        const startOfDay = new Date(dateObj.setHours(0, 0, 0, 0));
        const endOfDay = new Date(dateObj.setHours(23, 59, 59, 999));
        where.date = {
            ...where.date,
            gte: startOfDay,
            lte: endOfDay,
        };
    }

    const slots = await prisma.guidanceSlot.findMany({
        where,
        include: {
            order: {
                select: {
                    id: true,
                },
            },
        },
        orderBy: [
            { date: "asc" },
            { startTime: "asc" },
        ],
    });

    // Filter out slots that have orders (booked)
    const availableSlots = slots.filter(slot => !slot.order);

    return res.status(200).json(
        new ApiResponsive(200, { slots: availableSlots }, "Available slots fetched successfully")
    );
});

/**
 * Update slot status (Close/Open)
 */
export const updateSlotStatus = asyncHandler(async (req, res) => {
    const { slotId } = req.params;
    const { status } = req.body;

    if (!status || !["AVAILABLE", "BOOKED", "CLOSED"].includes(status.toUpperCase())) {
        throw new ApiError(400, "Invalid status. Must be AVAILABLE, BOOKED, or CLOSED");
    }

    const slot = await prisma.guidanceSlot.findUnique({
        where: { id: slotId },
        include: { order: true },
    });

    if (!slot) {
        throw new ApiError(404, "Slot not found");
    }

    // Prevent closing booked slots
    if (slot.status === "BOOKED" && status.toUpperCase() === "CLOSED") {
        throw new ApiError(400, "Cannot close a booked slot");
    }

    const updated = await prisma.guidanceSlot.update({
        where: { id: slotId },
        data: { status: status.toUpperCase() },
    });

    return res.status(200).json(
        new ApiResponsive(200, { slot: updated }, "Slot status updated successfully")
    );
});

/**
 * Delete slot
 */
export const deleteSlot = asyncHandler(async (req, res) => {
    const { slotId } = req.params;

    const slot = await prisma.guidanceSlot.findUnique({
        where: { id: slotId },
        include: { order: true },
    });

    if (!slot) {
        throw new ApiError(404, "Slot not found");
    }

    // Prevent deleting booked slots
    if (slot.status === "BOOKED" || slot.order) {
        throw new ApiError(400, "Cannot delete a booked slot");
    }

    await prisma.guidanceSlot.delete({ where: { id: slotId } });

    return res.status(200).json(
        new ApiResponsive(200, {}, "Slot deleted successfully")
    );
});

/**
 * Check if user can access Google Meet link for booked slot
 */
export const checkSlotAccess = asyncHandler(async (req, res) => {
    const { slotId } = req.params;
    const userId = req.user.id;

    const order = await prisma.guidanceOrder.findFirst({
        where: {
            slotId,
            userId,
            paymentStatus: "PAID",
        },
        include: {
            slot: {
                include: {
                    guidance: {
                        select: {
                            id: true,
                            googleMeetLink: true,
                        },
                    },
                },
            },
        },
    });

    if (!order) {
        return res.status(200).json(
            new ApiResponsive(200, {
                hasAccess: false,
                canAccessLink: false,
                googleMeetLink: null,
            }, "No booking found")
        );
    }

    // Check if current time is within 10 minutes before slot start
    const now = new Date();
    const slotDate = new Date(order.slot.date);
    const [hours, minutes] = order.slot.startTime.split(":").map(Number);
    slotDate.setHours(hours, minutes, 0, 0);

    const tenMinutesBefore = new Date(slotDate.getTime() - 10 * 60 * 1000);
    const canAccessLink = now >= tenMinutesBefore;

    return res.status(200).json(
        new ApiResponsive(200, {
            hasAccess: true,
            canAccessLink,
            googleMeetLink: canAccessLink && order.slot.guidance.googleMeetLink
                ? order.slot.guidance.googleMeetLink
                : null,
            slotDate: order.slot.date,
            startTime: order.slot.startTime,
        }, "Access checked successfully")
    );
});

