import { ApiError } from '../utils/ApiError.js';
import { ApiResponsive } from '../utils/ApiResponsive.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { uploadToR2, deleteFromR2, getPublicUrl } from '../utils/cloudflare.js';
import { generateSlug } from '../utils/slugGenerator.js';
import { prisma } from '../config/db.js';
import { getItemPricing } from '../utils/flashSaleHelper.js';

/**
 * Get all bundles (public - only published)
 */
export const getBundles = asyncHandler(async (req, res) => {
    const { search, limit, page = 1 } = req.query;
    const where = { isPublished: true };

    if (search) {
        where.OR = [
            { title: { contains: search, mode: 'insensitive' } },
            { description: { contains: search, mode: 'insensitive' } },
        ];
    }

    const pageNum = parseInt(page);
    const limitNum = limit ? parseInt(limit) : 20;
    const skip = (pageNum - 1) * limitNum;

    const [bundles, total] = await Promise.all([
        prisma.bundle.findMany({
            where,
            skip,
            take: limitNum,
            include: {
                courses: {
                    include: {
                        course: {
                            select: {
                                id: true,
                                title: true,
                                slug: true,
                                coverImage: true,
                                price: true,
                                salePrice: true,
                            },
                        },
                    },
                },
                _count: {
                    select: { enrollments: true },
                },
            },
            orderBy: { createdAt: 'desc' },
        }),
        prisma.bundle.count({ where }),
    ]);

    // Add image URLs and flash sale pricing
    const bundlesWithUrls = await Promise.all(bundles.map(async (bundle) => {
        const pricing = await getItemPricing('BUNDLE', bundle.id, bundle.price, bundle.salePrice);

        return {
            ...bundle,
            thumbnailUrl: bundle.thumbnail ? getPublicUrl(bundle.thumbnail) : null,
            courses: bundle.courses.map(bc => ({
                ...bc.course,
                coverImageUrl: bc.course.coverImage ? getPublicUrl(bc.course.coverImage) : null,
            })),
            coursesCount: bundle.courses.length,
            enrollmentsCount: bundle._count.enrollments,
            pricing,
        };
    }));

    return res.status(200).json(
        new ApiResponsive(200, {
            bundles: bundlesWithUrls,
            pagination: {
                page: pageNum,
                limit: limitNum,
                total,
                totalPages: Math.ceil(total / limitNum),
            },
        }, 'Bundles fetched successfully')
    );
});

/**
 * Get bundle by slug (public)
 */
export const getBundleBySlug = asyncHandler(async (req, res) => {
    const { slug } = req.params;
    const userId = req.user?.id;

    const bundle = await prisma.bundle.findUnique({
        where: { slug },
        include: {
            courses: {
                include: {
                    course: {
                        include: {
                            sessions: {
                                where: { isPublished: true },
                                include: {
                                    chapters: {
                                        where: { isPublished: true },
                                        select: {
                                            id: true,
                                            title: true,
                                            duration: true,
                                            isFreePreview: true,
                                        },
                                        orderBy: { order: 'asc' },
                                    },
                                },
                                orderBy: { order: 'asc' },
                            },
                            _count: {
                                select: { enrollments: true, reviews: true },
                            },
                        },
                    },
                },
            },
            _count: {
                select: { enrollments: true },
            },
        },
    });

    if (!bundle) {
        throw new ApiError(404, 'Bundle not found');
    }

    if (!bundle.isPublished) {
        throw new ApiError(404, 'Bundle not found');
    }

    // Check if user is enrolled
    let isEnrolled = false;
    let enrollment = null;
    if (userId) {
        enrollment = await prisma.bundleEnrollment.findUnique({
            where: {
                bundleId_userId: {
                    bundleId: bundle.id,
                    userId,
                },
            },
        });

        // Verify order is COMPLETED
        if (enrollment) {
            const bundleOrder = await prisma.bundleOrder.findFirst({
                where: {
                    bundleId: bundle.id,
                    userId,
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
            isEnrolled = bundleOrder?.order?.status === 'COMPLETED' && bundleOrder?.order?.paymentStatus === 'PAID';
        }
    }

    // Get flash sale pricing
    const pricing = await getItemPricing('BUNDLE', bundle.id, bundle.price, bundle.salePrice);

    // Calculate total value of courses
    let totalCoursesValue = 0;
    const coursesWithUrls = (bundle.courses || []).map(bc => {
        const course = bc.course;
        if (!course) return null;
        const effectivePrice = course.salePrice || course.price;
        totalCoursesValue += effectivePrice || 0;

        return {
            ...course,
            coverImageUrl: course.coverImage ? getPublicUrl(course.coverImage) : null,
        };
    }).filter(course => course !== null);

    const bundleWithUrls = {
        ...bundle,
        thumbnailUrl: bundle.thumbnail ? getPublicUrl(bundle.thumbnail) : null,
        courses: coursesWithUrls,
        coursesCount: coursesWithUrls.length,
        enrollmentsCount: bundle._count.enrollments,
        totalCoursesValue,
        savings: totalCoursesValue - (pricing.effectivePrice || bundle.price),
        pricing,
    };

    return res.status(200).json(
        new ApiResponsive(200, { bundle: bundleWithUrls, isEnrolled, enrollmentId: enrollment?.id }, 'Bundle fetched successfully')
    );
});

/**
 * Get bundle by ID (public)
 */
export const getBundleByIdPublic = asyncHandler(async (req, res) => {
    const { id } = req.params;

    const bundle = await prisma.bundle.findUnique({
        where: { id },
        include: {
            courses: {
                include: {
                    course: {
                        select: {
                            id: true,
                            title: true,
                            slug: true,
                            coverImage: true,
                            price: true,
                            salePrice: true,
                        },
                    },
                },
            },
            _count: {
                select: { enrollments: true },
            },
        },
    });

    if (!bundle || !bundle.isPublished) {
        throw new ApiError(404, 'Bundle not found');
    }

    const pricing = await getItemPricing('BUNDLE', bundle.id, bundle.price, bundle.salePrice);

    const bundleWithUrls = {
        ...bundle,
        thumbnailUrl: bundle.thumbnail ? getPublicUrl(bundle.thumbnail) : null,
        courses: bundle.courses.map(bc => ({
            ...bc.course,
            coverImageUrl: bc.course.coverImage ? getPublicUrl(bc.course.coverImage) : null,
        })),
        coursesCount: bundle.courses.length,
        enrollmentsCount: bundle._count.enrollments,
        pricing,
    };

    return res.status(200).json(
        new ApiResponsive(200, { bundle: bundleWithUrls }, 'Bundle fetched successfully')
    );
});

/**
 * Get bundle by ID (admin)
 */
export const getBundleById = asyncHandler(async (req, res) => {
    const { id } = req.params;

    const bundle = await prisma.bundle.findUnique({
        where: { id },
        include: {
            courses: {
                include: {
                    course: {
                        select: {
                            id: true,
                            title: true,
                            slug: true,
                            coverImage: true,
                            price: true,
                            salePrice: true,
                        },
                    },
                },
            },
            _count: {
                select: { enrollments: true, orders: true },
            },
        },
    });

    if (!bundle) {
        throw new ApiError(404, 'Bundle not found');
    }

    const pricing = await getItemPricing('BUNDLE', bundle.id, bundle.price, bundle.salePrice);

    const bundleWithUrls = {
        ...bundle,
        thumbnailUrl: bundle.thumbnail ? getPublicUrl(bundle.thumbnail) : null,
        courses: bundle.courses.map(bc => ({
            ...bc.course,
            coverImageUrl: bc.course.coverImage ? getPublicUrl(bc.course.coverImage) : null,
        })),
        coursesCount: bundle.courses.length,
        enrollmentsCount: bundle._count.enrollments,
        ordersCount: bundle._count.orders,
        pricing,
    };

    return res.status(200).json(
        new ApiResponsive(200, { bundle: bundleWithUrls }, 'Bundle fetched successfully')
    );
});

/**
 * Get all bundles (admin)
 */
export const getAdminBundles = asyncHandler(async (req, res) => {
    const { search, limit, page = 1, isPublished } = req.query;
    const where = {};

    if (search) {
        where.OR = [
            { title: { contains: search, mode: 'insensitive' } },
            { description: { contains: search, mode: 'insensitive' } },
        ];
    }

    if (isPublished === 'true') {
        where.isPublished = true;
    } else if (isPublished === 'false') {
        where.isPublished = false;
    }

    const pageNum = parseInt(page);
    const limitNum = limit ? parseInt(limit) : 20;
    const skip = (pageNum - 1) * limitNum;

    const [bundles, total] = await Promise.all([
        prisma.bundle.findMany({
            where,
            skip,
            take: limitNum,
            include: {
                courses: {
                    include: {
                        course: {
                            select: {
                                id: true,
                                title: true,
                            },
                        },
                    },
                },
                _count: {
                    select: { enrollments: true, orders: true },
                },
            },
            orderBy: { createdAt: 'desc' },
        }),
        prisma.bundle.count({ where }),
    ]);

    const bundlesWithUrls = bundles.map(bundle => ({
        ...bundle,
        thumbnailUrl: bundle.thumbnail ? getPublicUrl(bundle.thumbnail) : null,
        coursesCount: bundle.courses.length,
        courseNames: bundle.courses.map(bc => bc.course.title).join(', '),
        enrollmentsCount: bundle._count.enrollments,
        ordersCount: bundle._count.orders,
    }));

    return res.status(200).json(
        new ApiResponsive(200, {
            bundles: bundlesWithUrls,
            pagination: {
                page: pageNum,
                limit: limitNum,
                total,
                totalPages: Math.ceil(total / limitNum),
            },
        }, 'Bundles fetched successfully')
    );
});

/**
 * Create bundle (admin)
 */
export const createBundle = asyncHandler(async (req, res) => {
    const { title, shortDescription, description, price, salePrice, isPublished, badges, courseIds } = req.body;

    if (!title || !description) {
        throw new ApiError(400, 'Title and description are required');
    }

    let parsedCourseIds = courseIds;
    if (typeof courseIds === 'string') {
        try {
            parsedCourseIds = JSON.parse(courseIds);
        } catch (e) {
            parsedCourseIds = [];
        }
    }

    if (!parsedCourseIds || !Array.isArray(parsedCourseIds) || parsedCourseIds.length < 2) {
        throw new ApiError(400, 'At least 2 courses are required to create a bundle');
    }

    // Verify all courses exist
    const courses = await prisma.course.findMany({
        where: { id: { in: parsedCourseIds } },
    });

    if (courses.length !== parsedCourseIds.length) {
        throw new ApiError(400, 'One or more courses not found');
    }

    // Generate slug
    const slug = await generateSlug(title, prisma.bundle);

    // Handle thumbnail upload - either file upload or URL from MediaPicker
    let thumbnailPath = null;
    if (req.file) {
        // File upload
        thumbnailPath = await uploadToR2(req.file, 'bundles');
    } else if (req.body.thumbnailUrl) {
        // URL from MediaPicker - extract R2 path from public URL
        try {
            const url = new URL(req.body.thumbnailUrl);
            thumbnailPath = url.pathname.startsWith('/') ? url.pathname.slice(1) : url.pathname;
        } catch (error) {
            thumbnailPath = req.body.thumbnailUrl.startsWith('/') ? req.body.thumbnailUrl.slice(1) : req.body.thumbnailUrl;
        }
    }

    // Create bundle with courses
    const bundle = await prisma.bundle.create({
        data: {
            title,
            slug,
            shortDescription: shortDescription || null,
            description,
            thumbnail: thumbnailPath,
            price: parseFloat(price) || 0,
            salePrice: salePrice ? parseFloat(salePrice) : null,
            isPublished: isPublished === 'true' || isPublished === true,
            badges: badges ? (Array.isArray(badges) ? badges : JSON.parse(badges)) : [],
            courses: {
                create: parsedCourseIds.map(courseId => ({
                    courseId,
                })),
            },
        },
        include: {
            courses: {
                include: {
                    course: {
                        select: { id: true, title: true },
                    },
                },
            },
        },
    });

    return res.status(201).json(
        new ApiResponsive(201, { bundle }, 'Bundle created successfully')
    );
});

/**
 * Update bundle (admin)
 */
export const updateBundle = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { title, shortDescription, description, price, salePrice, isPublished, badges, courseIds } = req.body;

    const existing = await prisma.bundle.findUnique({
        where: { id },
        include: { courses: true },
    });

    if (!existing) {
        throw new ApiError(404, 'Bundle not found');
    }

    // If courseIds provided, validate
    if (courseIds) {
        const parsedCourseIds = Array.isArray(courseIds) ? courseIds : JSON.parse(courseIds);

        if (parsedCourseIds.length < 2) {
            throw new ApiError(400, 'At least 2 courses are required in a bundle');
        }

        const courses = await prisma.course.findMany({
            where: { id: { in: parsedCourseIds } },
        });

        if (courses.length !== parsedCourseIds.length) {
            throw new ApiError(400, 'One or more courses not found');
        }
    }

    // Generate new slug if title changed
    let slug = existing.slug;
    if (title && title !== existing.title) {
        slug = await generateSlug(title, prisma.bundle, existing.id);
    }

    // Handle thumbnail update - either file upload or URL from MediaPicker
    let thumbnailPath = existing.thumbnail;
    if (req.file) {
        // File upload - DON'T delete old thumbnail, keep it in media library
        thumbnailPath = await uploadToR2(req.file, 'bundles');
    } else if (req.body.thumbnailUrl) {
        // URL from MediaPicker - extract R2 path from public URL
        // DON'T delete old thumbnail, keep it in media library
        try {
            const url = new URL(req.body.thumbnailUrl);
            thumbnailPath = url.pathname.startsWith('/') ? url.pathname.slice(1) : url.pathname;
        } catch (error) {
            thumbnailPath = req.body.thumbnailUrl.startsWith('/') ? req.body.thumbnailUrl.slice(1) : req.body.thumbnailUrl;
        }
    }

    // Update bundle
    const updateData = {
        title: title || existing.title,
        slug,
        shortDescription: shortDescription !== undefined ? shortDescription : existing.shortDescription,
        description: description || existing.description,
        thumbnail: thumbnailPath,
        price: price !== undefined ? parseFloat(price) : existing.price,
        salePrice: salePrice !== undefined ? (salePrice ? parseFloat(salePrice) : null) : existing.salePrice,
        isPublished: isPublished !== undefined ? (isPublished === 'true' || isPublished === true) : existing.isPublished,
        badges: badges ? (Array.isArray(badges) ? badges : JSON.parse(badges)) : existing.badges,
    };

    // If courseIds provided, update courses
    if (courseIds) {
        const parsedCourseIds = Array.isArray(courseIds) ? courseIds : JSON.parse(courseIds);

        // Delete existing course relations and create new ones
        await prisma.bundleCourse.deleteMany({
            where: { bundleId: id },
        });

        updateData.courses = {
            create: parsedCourseIds.map(courseId => ({
                courseId,
            })),
        };
    }

    const bundle = await prisma.bundle.update({
        where: { id },
        data: updateData,
        include: {
            courses: {
                include: {
                    course: {
                        select: { id: true, title: true },
                    },
                },
            },
        },
    });

    return res.status(200).json(
        new ApiResponsive(200, { bundle }, 'Bundle updated successfully')
    );
});

/**
 * Delete bundle (admin)
 */
export const deleteBundle = asyncHandler(async (req, res) => {
    const { id } = req.params;

    const bundle = await prisma.bundle.findUnique({
        where: { id },
    });

    if (!bundle) {
        throw new ApiError(404, 'Bundle not found');
    }

    // Delete thumbnail from R2
    if (bundle.thumbnail) {
        await deleteFromR2(bundle.thumbnail);
    }

    await prisma.bundle.delete({
        where: { id },
    });

    return res.status(200).json(
        new ApiResponsive(200, null, 'Bundle deleted successfully')
    );
});

/**
 * Toggle bundle publish status (admin)
 */
export const toggleBundlePublish = asyncHandler(async (req, res) => {
    const { id } = req.params;

    const bundle = await prisma.bundle.findUnique({
        where: { id },
        include: { courses: true },
    });

    if (!bundle) {
        throw new ApiError(404, 'Bundle not found');
    }

    // Cannot publish if less than 2 courses
    if (!bundle.isPublished && bundle.courses.length < 2) {
        throw new ApiError(400, 'Cannot publish bundle with less than 2 courses');
    }

    const updated = await prisma.bundle.update({
        where: { id },
        data: { isPublished: !bundle.isPublished },
    });

    return res.status(200).json(
        new ApiResponsive(200, { bundle: updated }, `Bundle ${updated.isPublished ? 'published' : 'unpublished'} successfully`)
    );
});

/**
 * Get available courses for bundle selection (admin)
 */
export const getCoursesForBundle = asyncHandler(async (req, res) => {
    const courses = await prisma.course.findMany({
        where: { isPublished: true },
        select: {
            id: true,
            title: true,
            slug: true,
            coverImage: true,
            price: true,
            salePrice: true,
        },
        orderBy: { title: 'asc' },
    });

    const coursesWithUrls = courses.map(course => ({
        ...course,
        coverImageUrl: course.coverImage ? getPublicUrl(course.coverImage) : null,
    }));

    return res.status(200).json(
        new ApiResponsive(200, { courses: coursesWithUrls }, 'Courses fetched successfully')
    );
});
