import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiResponsive } from "../utils/ApiResponsive.js";
import { ApiError } from "../utils/ApiError.js";
import { prisma } from "../config/db.js";
import { uploadToR2, deleteFromR2, getPublicUrl } from "../utils/cloudflare.js";
import { createSlug } from "../helper/Slug.js";

/**
 * Get all indicators (Admin sees all, Users see only published)
 */
export const getIndicators = asyncHandler(async (req, res) => {
    const { page = 1, limit = 50, search = "", isPublished } = req.query;
    const isAdmin = req.user?.role === "ADMIN";

    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    const where = {};

    if (search) {
        where.OR = [
            { name: { contains: search, mode: "insensitive" } },
            { description: { contains: search, mode: "insensitive" } },
        ];
    }

    // Users can only see published indicators
    if (!isAdmin) {
        where.isPublished = true;
    } else if (isPublished !== undefined) {
        where.isPublished = isPublished === "true";
    }

    const [indicators, total, totalActiveSubscriptions] = await Promise.all([
        prisma.indicator.findMany({
            where,
            include: {
                _count: {
                    select: {
                        reviews: true,
                    },
                },
            },
            orderBy: { createdAt: "desc" },
            skip,
            take: limitNum,
        }),
        prisma.indicator.count({ where }),
        // Get total active subscriptions (global subscriptions give access to all indicators)
        prisma.subscription.count({
            where: {
                status: "ACTIVE",
                OR: [
                    { endDate: null }, // Lifetime
                    { endDate: { gte: new Date() } }, // Not expired
                ],
            },
        }),
    ]);

    const indicatorsWithUrls = indicators.map((indicator) => ({
        ...indicator,
        imageUrl: indicator.image ? getPublicUrl(indicator.image) : null,
        purchaseCount: totalActiveSubscriptions, // Show total active subscriptions (global access)
        reviewCount: indicator._count.reviews,
    }));

    return res.status(200).json(
        new ApiResponsive(
            200,
            {
                indicators: indicatorsWithUrls,
                pagination: {
                    page: pageNum,
                    limit: limitNum,
                    total,
                    totalPages: Math.ceil(total / limitNum),
                },
            },
            "Indicators fetched successfully"
        )
    );
});

/**
 * Get indicator by ID
 */
export const getIndicatorById = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const isAdmin = req.user?.role === "ADMIN";

    const where = { id };
    if (!isAdmin) {
        where.isPublished = true;
    }

    const indicator = await prisma.indicator.findFirst({
        where,
        include: {
            reviews: {
                include: {
                    user: {
                        select: {
                            id: true,
                            name: true,
                            avatar: true,
                        },
                    },
                },
                orderBy: { createdAt: "desc" },
                take: 10,
            },
            _count: {
                select: {
                    reviews: true,
                },
            },
        },
    });

    if (!indicator) {
        throw new ApiError(404, "Indicator not found");
    }

    // Get total active subscriptions (global subscriptions give access to all indicators)
    const totalActiveSubscriptions = await prisma.subscription.count({
        where: {
            status: "ACTIVE",
            OR: [
                { endDate: null }, // Lifetime
                { endDate: { gte: new Date() } }, // Not expired
            ],
        },
    });

    const indicatorWithUrls = {
        ...indicator,
        imageUrl: indicator.image ? getPublicUrl(indicator.image) : null,
        reviews: indicator.reviews.map((review) => ({
            ...review,
            user: {
                ...review.user,
                avatarUrl: review.user.avatar ? getPublicUrl(review.user.avatar) : null,
            },
        })),
        purchaseCount: totalActiveSubscriptions, // Show total active subscriptions (global access)
        reviewCount: indicator._count.reviews,
    };

    return res.status(200).json(
        new ApiResponsive(200, { indicator: indicatorWithUrls }, "Indicator fetched successfully")
    );
});

/**
 * Get indicator by slug
 */
export const getIndicatorBySlug = asyncHandler(async (req, res) => {
    const { slug } = req.params;
    const isAdmin = req.user?.role === "ADMIN";

    const where = { slug };
    if (!isAdmin) {
        where.isPublished = true;
    }

    const [indicator, totalActiveSubscriptions] = await Promise.all([
        prisma.indicator.findFirst({
            where,
            include: {
                reviews: {
                    include: {
                        user: {
                            select: {
                                id: true,
                                name: true,
                                avatar: true,
                            },
                        },
                    },
                    orderBy: { createdAt: "desc" },
                    take: 10,
                },
                _count: {
                    select: {
                        reviews: true,
                    },
                },
            },
        }),
        // Get total active subscriptions (global subscriptions give access to all indicators)
        prisma.subscription.count({
            where: {
                status: "ACTIVE",
                OR: [
                    { endDate: null }, // Lifetime
                    { endDate: { gte: new Date() } }, // Not expired
                ],
            },
        }),
    ]);

    if (!indicator) {
        throw new ApiError(404, "Indicator not found");
    }

    const indicatorWithUrls = {
        ...indicator,
        imageUrl: indicator.image ? getPublicUrl(indicator.image) : null,
        reviews: indicator.reviews.map((review) => ({
            ...review,
            user: {
                ...review.user,
                avatarUrl: review.user.avatar ? getPublicUrl(review.user.avatar) : null,
            },
        })),
        purchaseCount: totalActiveSubscriptions, // Show total active subscriptions (global access)
        reviewCount: indicator._count.reviews,
    };

    return res.status(200).json(
        new ApiResponsive(200, { indicator: indicatorWithUrls }, "Indicator fetched successfully")
    );
});

/**
 * Create indicator (Admin only)
 */
export const createIndicator = asyncHandler(async (req, res) => {
    const { name, description, videoUrl, imageUrl } = req.body;

    if (!name || !description) {
        throw new ApiError(400, "Name and description are required");
    }

    const uploadedFiles = [];
    let image = null;

    try {
        // Generate slug from name
        let baseSlug = createSlug(name);
        let slug = baseSlug;
        let slugCounter = 1;

        // Ensure unique slug
        while (await prisma.indicator.findUnique({ where: { slug } })) {
            slug = `${baseSlug}-${slugCounter}`;
            slugCounter++;
        }

        // Handle image upload - either file upload or URL from MediaPicker
        if (req.files && req.files.image && req.files.image[0]) {
            // File upload
            image = await uploadToR2(req.files.image[0], "indicators");
            uploadedFiles.push(image);
        } else if (imageUrl) {
            // URL from MediaPicker - extract R2 path from public URL
            try {
                const url = new URL(imageUrl);
                // Extract path after domain (e.g., "e-learning/indicators/file.jpg")
                image = url.pathname.startsWith('/') ? url.pathname.slice(1) : url.pathname;
            } catch (error) {
                // If imageUrl is already a path (not a full URL), use it directly
                image = imageUrl.startsWith('/') ? imageUrl.slice(1) : imageUrl;
            }
        }

        // Create indicator
        const indicator = await prisma.indicator.create({
            data: {
                name,
                slug,
                description,
                image,
                videoUrl: videoUrl || null,
                isPublished: false,
            },
        });

        const indicatorWithUrls = {
            ...indicator,
            imageUrl: indicator.image ? getPublicUrl(indicator.image) : null,
        };

        return res.status(201).json(
            new ApiResponsive(201, { indicator: indicatorWithUrls }, "Indicator created successfully")
        );
    } catch (error) {
        // If creation fails, delete uploaded files
        for (const file of uploadedFiles) {
            try {
                await deleteFromR2(file);
            } catch (deleteError) {
                console.error(`Failed to delete file ${file}:`, deleteError);
            }
        }
        throw error;
    }
});

/**
 * Update indicator (Admin only)
 */
export const updateIndicator = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { name, description, videoUrl, removeImage } = req.body;

    const indicator = await prisma.indicator.findUnique({ where: { id } });
    if (!indicator) {
        throw new ApiError(404, "Indicator not found");
    }

    const uploadedFiles = [];
    let image = indicator.image;
    let slug = indicator.slug;

    try {
        // Update slug if name changed
        if (name && name !== indicator.name) {
            let baseSlug = createSlug(name);
            let newSlug = baseSlug;
            let slugCounter = 1;

            while (await prisma.indicator.findFirst({ where: { slug: newSlug, id: { not: id } } })) {
                newSlug = `${baseSlug}-${slugCounter}`;
                slugCounter++;
            }
            slug = newSlug;
        }

        // Handle image upload - either file upload or URL from MediaPicker
        if (req.files && req.files.image && req.files.image[0]) {
            // File upload - DON'T delete old image, keep it in media library
            image = await uploadToR2(req.files.image[0], "indicators");
            uploadedFiles.push(image);
        } else if (req.body.imageUrl && !removeImage) {
            // URL from MediaPicker - extract R2 path from public URL
            // DON'T delete old image, keep it in media library
            try {
                const url = new URL(req.body.imageUrl);
                // Extract path after domain (e.g., "e-learning/indicators/file.jpg")
                image = url.pathname.startsWith('/') ? url.pathname.slice(1) : url.pathname;
            } catch (error) {
                // If imageUrl is already a path (not a full URL), use it directly
                image = req.body.imageUrl.startsWith('/') ? req.body.imageUrl.slice(1) : req.body.imageUrl;
            }
        }

        // Handle image removal
        if (removeImage === "true" && image) {
            await deleteFromR2(image);
            image = null;
        }

        const updateData = {};
        if (name) updateData.name = name;
        if (slug !== indicator.slug) updateData.slug = slug;
        if (description !== undefined) updateData.description = description;
        if (videoUrl !== undefined) updateData.videoUrl = videoUrl || null;
        if (image !== indicator.image) updateData.image = image;

        const updatedIndicator = await prisma.indicator.update({
            where: { id },
            data: updateData,
        });

        const indicatorWithUrls = {
            ...updatedIndicator,
            imageUrl: updatedIndicator.image ? getPublicUrl(updatedIndicator.image) : null,
        };

        return res.status(200).json(
            new ApiResponsive(200, { indicator: indicatorWithUrls }, "Indicator updated successfully")
        );
    } catch (error) {
        // If update fails, delete newly uploaded files
        for (const file of uploadedFiles) {
            try {
                await deleteFromR2(file);
            } catch (deleteError) {
                console.error(`Failed to delete file ${file}:`, deleteError);
            }
        }
        throw error;
    }
});

/**
 * Publish/Unpublish indicator (Admin only)
 */
export const togglePublishIndicator = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { isPublished } = req.body;

    if (typeof isPublished !== "boolean") {
        throw new ApiError(400, "isPublished must be a boolean");
    }

    const indicator = await prisma.indicator.update({
        where: { id },
        data: { isPublished },
    });

    const indicatorWithUrls = {
        ...indicator,
        imageUrl: indicator.image ? getPublicUrl(indicator.image) : null,
    };

    return res.status(200).json(
        new ApiResponsive(200, { indicator: indicatorWithUrls }, "Indicator publish status updated successfully")
    );
});

/**
 * Delete indicator (Admin only)
 */
export const deleteIndicator = asyncHandler(async (req, res) => {
    const { id } = req.params;

    const indicator = await prisma.indicator.findUnique({ where: { id } });
    if (!indicator) {
        throw new ApiError(404, "Indicator not found");
    }

    // Delete image from R2
    if (indicator.image) {
        try {
            await deleteFromR2(indicator.image);
        } catch (error) {
            console.error("Error deleting image:", error);
        }
    }

    await prisma.indicator.delete({ where: { id } });

    return res.status(200).json(
        new ApiResponsive(200, {}, "Indicator deleted successfully")
    );
});

