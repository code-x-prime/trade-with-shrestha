import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiResponsive } from "../utils/ApiResponsive.js";
import { ApiError } from "../utils/ApiError.js";
import { prisma } from "../config/db.js";
import { getPublicUrl } from "../utils/cloudflare.js";

/**
 * Validate coupon code (Public - for cart/checkout)
 */
export const validateCoupon = asyncHandler(async (req, res) => {
    const { code, totalAmount, applicableTo } = req.body;

    if (!code) {
        throw new ApiError(400, "Coupon code is required");
    }

    // Build where clause for applicableTo
    const applicableToCondition = applicableTo
        ? {
            OR: [
                { applicableTo: "ALL" },
                { applicableTo: applicableTo.toUpperCase() }, // EBOOK, SUBSCRIPTION, WEBINAR, GUIDANCE, COURSE, OFFLINE_BATCH, BUNDLE
            ],
        }
        : {}; // If not specified, allow all coupons

    const coupon = await prisma.coupon.findFirst({
        where: {
            code: code.toUpperCase(),
            isActive: true,
            validFrom: { lte: new Date() },
            validUntil: { gte: new Date() },
            ...applicableToCondition,
        },
    });

    if (!coupon) {
        throw new ApiError(400, "Invalid or expired coupon code");
    }

    // Check usage limit
    if (coupon.usageLimit && coupon.usedCount >= coupon.usageLimit) {
        throw new ApiError(400, "Coupon usage limit exceeded");
    }

    // Check minimum amount if provided
    if (coupon.minAmount && totalAmount && totalAmount < coupon.minAmount) {
        throw new ApiError(400, `Minimum order amount is ₹${coupon.minAmount} to use this coupon`);
    }

    // Calculate discount
    let discountAmount = 0;
    if (coupon.discountType === "PERCENTAGE") {
        discountAmount = totalAmount ? (totalAmount * coupon.discountValue) / 100 : 0;
        if (coupon.maxDiscount) {
            discountAmount = Math.min(discountAmount, coupon.maxDiscount);
        }
    } else {
        discountAmount = coupon.discountValue;
    }

    const finalAmount = Math.max(0, (totalAmount || 0) - discountAmount);

    return res.status(200).json(
        new ApiResponsive(
            200,
            {
                coupon: {
                    code: coupon.code,
                    discountType: coupon.discountType,
                    discountValue: coupon.discountValue,
                },
                discountAmount,
                finalAmount,
            },
            "Coupon validated successfully"
        )
    );
});

/**
 * Get all coupons (Admin only)
 */
export const getCoupons = asyncHandler(async (req, res) => {
    const { page = 1, limit = 50, search = "", isActive } = req.query;

    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    const where = {};

    if (search) {
        where.code = { contains: search, mode: "insensitive" };
    }

    if (isActive !== undefined) {
        where.isActive = isActive === "true";
    }

    const [coupons, total] = await Promise.all([
        prisma.coupon.findMany({
            where,
            orderBy: { createdAt: "desc" },
            skip,
            take: limitNum,
        }),
        prisma.coupon.count({ where }),
    ]);

    return res.status(200).json(
        new ApiResponsive(
            200,
            {
                coupons,
                pagination: {
                    page: pageNum,
                    limit: limitNum,
                    total,
                    totalPages: Math.ceil(total / limitNum),
                },
            },
            "Coupons fetched successfully"
        )
    );
});

/**
 * Get single coupon by ID (Admin only)
 */
export const getCouponById = asyncHandler(async (req, res) => {
    const { id } = req.params;

    const coupon = await prisma.coupon.findUnique({
        where: { id },
    });

    if (!coupon) {
        throw new ApiError(404, "Coupon not found");
    }

    return res.status(200).json(
        new ApiResponsive(200, { coupon }, "Coupon fetched successfully")
    );
});

/**
 * Create coupon (Admin only)
 */
export const createCoupon = asyncHandler(async (req, res) => {
    const {
        code,
        discountType,
        discountValue,
        minAmount,
        maxDiscount,
        validFrom,
        validUntil,
        usageLimit,
        applicableTo = "ALL",
        isActive = true,
        targetUserType = "ALL",
        targetUserId,
        targetContentType,
        imageUrl,
        videoUrl,
        readyToShow = false,
        title,
        description,
    } = req.body;

    // Validation
    if (!code || !discountType || !discountValue || !validFrom || !validUntil) {
        throw new ApiError(400, "Missing required fields");
    }

    if (discountType !== "PERCENTAGE" && discountType !== "FIXED") {
        throw new ApiError(400, "discountType must be PERCENTAGE or FIXED");
    }

    if (discountValue <= 0) {
        throw new ApiError(400, "discountValue must be greater than 0");
    }

    if (discountType === "PERCENTAGE" && discountValue > 100) {
        throw new ApiError(400, "Percentage discount cannot exceed 100%");
    }

    // Check if code already exists
    const existingCoupon = await prisma.coupon.findUnique({
        where: { code: code.toUpperCase() },
    });

    if (existingCoupon) {
        throw new ApiError(400, "Coupon code already exists");
    }

    // Handle imageUrl - extract R2 path if it's a full URL
    let imagePath = imageUrl;
    if (imageUrl) {
        try {
            const url = new URL(imageUrl);
            imagePath = url.pathname.startsWith('/') ? url.pathname.slice(1) : url.pathname;
        } catch (error) {
            // If imageUrl is already a path (not a full URL), use it directly
            imagePath = imageUrl.startsWith('/') ? imageUrl.slice(1) : imageUrl;
        }
    }

    const coupon = await prisma.coupon.create({
        data: {
            code: code.toUpperCase(),
            discountType,
            discountValue: parseFloat(discountValue),
            minAmount: minAmount ? parseFloat(minAmount) : null,
            maxDiscount: maxDiscount ? parseFloat(maxDiscount) : null,
            validFrom: new Date(validFrom),
            validUntil: new Date(validUntil),
            usageLimit: usageLimit ? parseInt(usageLimit) : null,
            applicableTo: applicableTo.toUpperCase(),
            isActive,
            targetUserType: targetUserType.toUpperCase(),
            targetUserId: targetUserId || null,
            targetContentType: targetContentType || null,
            imageUrl: imagePath || null,
            videoUrl: videoUrl || null,
            readyToShow: readyToShow === true || readyToShow === 'true',
            title: title || null,
            description: description || null,
        },
    });

    return res.status(201).json(
        new ApiResponsive(201, { coupon }, "Coupon created successfully")
    );
});

/**
 * Update coupon (Admin only)
 */
export const updateCoupon = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const {
        code,
        discountType,
        discountValue,
        minAmount,
        maxDiscount,
        validFrom,
        validUntil,
        usageLimit,
        isActive,
        applicableTo,
        targetUserType,
        targetUserId,
        targetContentType,
        imageUrl,
        videoUrl,
        readyToShow,
        title,
        description,
    } = req.body;

    const coupon = await prisma.coupon.findUnique({
        where: { id },
    });

    if (!coupon) {
        throw new ApiError(404, "Coupon not found");
    }

    // If code is being changed, check if new code exists
    if (code && code.toUpperCase() !== coupon.code) {
        const existingCoupon = await prisma.coupon.findUnique({
            where: { code: code.toUpperCase() },
        });

        if (existingCoupon) {
            throw new ApiError(400, "Coupon code already exists");
        }
    }

    const updateData = {};

    if (code) updateData.code = code.toUpperCase();
    if (discountType) updateData.discountType = discountType;
    if (discountValue !== undefined) updateData.discountValue = parseFloat(discountValue);
    if (minAmount !== undefined) updateData.minAmount = minAmount ? parseFloat(minAmount) : null;
    if (maxDiscount !== undefined) updateData.maxDiscount = maxDiscount ? parseFloat(maxDiscount) : null;
    if (validFrom) updateData.validFrom = new Date(validFrom);
    if (validUntil) updateData.validUntil = new Date(validUntil);
    if (usageLimit !== undefined) updateData.usageLimit = usageLimit ? parseInt(usageLimit) : null;
    if (applicableTo !== undefined) updateData.applicableTo = applicableTo.toUpperCase();
    if (isActive !== undefined) updateData.isActive = isActive;
    if (targetUserType !== undefined) updateData.targetUserType = targetUserType.toUpperCase();
    if (targetUserId !== undefined) updateData.targetUserId = targetUserId || null;
    if (targetContentType !== undefined) updateData.targetContentType = targetContentType || null;
    if (readyToShow !== undefined) updateData.readyToShow = readyToShow === true || readyToShow === 'true';
    if (title !== undefined) updateData.title = title || null;
    if (description !== undefined) updateData.description = description || null;
    if (videoUrl !== undefined) updateData.videoUrl = videoUrl || null;

    // Handle imageUrl - extract R2 path if it's a full URL
    if (imageUrl !== undefined) {
        if (imageUrl) {
            try {
                const url = new URL(imageUrl);
                updateData.imageUrl = url.pathname.startsWith('/') ? url.pathname.slice(1) : url.pathname;
            } catch (error) {
                updateData.imageUrl = imageUrl.startsWith('/') ? imageUrl.slice(1) : imageUrl;
            }
        } else {
            updateData.imageUrl = null;
        }
    }

    const updatedCoupon = await prisma.coupon.update({
        where: { id },
        data: updateData,
    });

    return res.status(200).json(
        new ApiResponsive(200, { coupon: updatedCoupon }, "Coupon updated successfully")
    );
});

/**
 * Delete coupon (Admin only)
 */
export const deleteCoupon = asyncHandler(async (req, res) => {
    const { id } = req.params;

    const coupon = await prisma.coupon.findUnique({
        where: { id },
    });

    if (!coupon) {
        throw new ApiError(404, "Coupon not found");
    }

    await prisma.coupon.delete({
        where: { id },
    });

    return res.status(200).json(
        new ApiResponsive(200, {}, "Coupon deleted successfully")
    );
});

/**
 * Get coupons ready to show in popup (Public)
 * Checks user eligibility (new user, specific user, etc.)
 */
export const getCouponsReadyToShow = asyncHandler(async (req, res) => {
    const userId = req.user?.id;
    const now = new Date();

    // Build where clause for ready to show coupons
    const where = {
        readyToShow: true,
        isActive: true,
        validFrom: { lte: now },
        validUntil: { gte: now },
    };

    // Check user eligibility
    if (userId) {
        // User is logged in - check if they're a new user (no orders)
        const userOrderCount = await prisma.order.count({
            where: {
                userId,
                status: 'COMPLETED',
            },
        });

        const isNewUser = userOrderCount === 0;

        // Filter by targetUserType
        where.OR = [
            { targetUserType: 'ALL' },
            ...(isNewUser ? [{ targetUserType: 'NEW_USER' }] : []),
            // For SPECIFIC_USER, check if userId is in comma-separated list
            {
                targetUserType: 'SPECIFIC_USER',
                OR: [
                    { targetUserId: userId },
                    { targetUserId: { contains: `,${userId},` } },
                    { targetUserId: { startsWith: `${userId},` } },
                    { targetUserId: { endsWith: `,${userId}` } },
                ],
            },
        ];
    } else {
        // Non-user - only show ALL coupons
        where.targetUserType = 'ALL';
    }

    const coupons = await prisma.coupon.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: 10, // Limit to 10 coupons
    });

    // Add public URLs for images
    const couponsWithUrls = coupons.map(coupon => ({
        ...coupon,
        imageUrl: coupon.imageUrl ? getPublicUrl(coupon.imageUrl) : null,
    }));

    return res.status(200).json(
        new ApiResponsive(200, { coupons: couponsWithUrls }, "Coupons ready to show fetched successfully")
    );
});
