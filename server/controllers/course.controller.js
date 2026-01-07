import { ApiError } from '../utils/ApiError.js';
import { ApiResponsive } from '../utils/ApiResponsive.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { uploadToR2, deleteFromR2 } from '../utils/cloudflare.js';
import { generateSlug } from '../utils/slugGenerator.js';
import { getPublicUrl } from '../utils/cloudflare.js';
import { prisma } from '../config/db.js';
import { getItemPricing } from '../utils/flashSaleHelper.js';
import bunnyService from '../services/bunnyService.js';

/**
 * Get all courses (public - only published)
 */
export const getCourses = asyncHandler(async (req, res) => {
    const { published, search, limit, page = 1, isFree, category } = req.query;
    const userId = req.user?.id;
    const where = {};

    if (published === 'true') {
        where.isPublished = true;
    }

    if (search) {
        where.OR = [
            { title: { contains: search, mode: 'insensitive' } },
            { description: { contains: search, mode: 'insensitive' } },
        ];
    }

    if (isFree !== undefined) {
        where.isFree = isFree === 'true';
    }

    // Filter by category
    if (category) {
        where.categories = {
            some: {
                category: {
                    slug: category,
                },
            },
        };
    }

    const pageNum = parseInt(page);
    const limitNum = limit ? parseInt(limit) : 20;
    const skip = (pageNum - 1) * limitNum;

    const [courses, total] = await Promise.all([
        prisma.course.findMany({
            where,
            skip,
            take: limitNum,
            include: {
                sessions: {
                    where: { isPublished: true },
                    orderBy: { order: 'asc' },
                    include: {
                        chapters: {
                            where: { isPublished: true },
                            orderBy: { order: 'asc' },
                        },
                    },
                },
                categories: {
                    include: {
                        category: true,
                    },
                },
                _count: {
                    select: {
                        enrollments: true,
                    },
                },
            },
            orderBy: { createdAt: 'desc' },
        }),
        prisma.course.count({ where }),
    ]);

    // Get user's course enrollments and bundle enrollments if logged in
    // Only count enrollments with COMPLETED orders
    let enrolledCourseIds = new Set();
    if (userId) {
        // Get direct course enrollments - verify order is COMPLETED
        const courseOrders = await prisma.courseOrder.findMany({
            where: {
                userId,
                order: {
                    status: 'COMPLETED',
                    paymentStatus: 'PAID',
                },
            },
            select: { courseId: true },
        });
        courseOrders.forEach(co => enrolledCourseIds.add(co.courseId));

        // Get courses enrolled via bundles - verify order is COMPLETED
        const bundleOrders = await prisma.bundleOrder.findMany({
            where: {
                userId,
                order: {
                    status: 'COMPLETED',
                    paymentStatus: 'PAID',
                },
            },
            include: {
                bundle: {
                    include: {
                        courses: {
                            select: {
                                courseId: true,
                            },
                        },
                    },
                },
            },
        });

        bundleOrders.forEach(bo => {
            bo.bundle.courses.forEach(bc => {
                enrolledCourseIds.add(bc.courseId);
            });
        });
    }

    // Add cover image URLs, flash sale pricing, and enrollment status
    const coursesWithUrls = await Promise.all(courses.map(async (course) => {
        const pricing = await getItemPricing('COURSE', course.id, course.price, course.salePrice);
        const isEnrolled = enrolledCourseIds.has(course.id);
        return {
            ...course,
            coverImageUrl: course.coverImage ? getPublicUrl(course.coverImage) : null,
            pricing,
            isEnrolled,
        };
    }));

    return res.status(200).json(
        new ApiResponsive(200, {
            courses: coursesWithUrls,
            pagination: {
                page: pageNum,
                limit: limitNum,
                total,
                totalPages: Math.ceil(total / limitNum),
            },
        }, 'Courses fetched successfully')
    );
});

/**
 * Get courses by category (for home page)
 */
export const getCoursesByCategory = asyncHandler(async (req, res) => {
    const { category, limit = 10 } = req.query;
    const limitNum = parseInt(limit);

    if (!category) {
        throw new ApiError(400, 'Category is required');
    }

    const where = {
        isPublished: true,
        categories: {
            some: {
                category: {
                    slug: category.toLowerCase(),
                },
            },
        },
    };

    const courses = await prisma.course.findMany({
        where,
        include: {
            categories: {
                include: {
                    category: true,
                },
            },
            _count: {
                select: {
                    enrollments: true,
                },
            },
        },
        orderBy: { createdAt: 'desc' },
        take: limitNum,
    });

    const coursesWithUrls = courses.map(course => ({
        ...course,
        coverImageUrl: course.coverImage ? getPublicUrl(course.coverImage) : null,
    }));

    return res.status(200).json(
        new ApiResponsive(200, { courses: coursesWithUrls }, 'Courses fetched successfully')
    );
});

/**
 * Get featured courses (for home page) - courses with FEATURED badge
 */
export const getFeaturedCourses = asyncHandler(async (req, res) => {
    const { limit = 10 } = req.query;
    const limitNum = parseInt(limit);

    // Get courses with FEATURED badge
    const courses = await prisma.course.findMany({
        where: {
            isPublished: true,
            badges: {
                has: 'FEATURED',
            },
        },
        include: {
            categories: {
                include: {
                    category: true,
                },
            },
            _count: {
                select: {
                    enrollments: true,
                },
            },
        },
        orderBy: {
            enrollments: {
                _count: 'desc',
            },
        },
        take: limitNum,
    });

    const coursesWithUrls = courses.map(course => ({
        ...course,
        coverImageUrl: course.coverImage ? getPublicUrl(course.coverImage) : null,
    }));

    return res.status(200).json(
        new ApiResponsive(200, { courses: coursesWithUrls }, 'Featured courses fetched successfully')
    );
});

/**
 * Get courses by badge (FEATURED, BESTSELLER, NEW, TRENDING, POPULAR)
 */
export const getCoursesByBadge = asyncHandler(async (req, res) => {
    const { badge } = req.params;
    const { limit = 10 } = req.query;
    const limitNum = parseInt(limit);

    const validBadges = ['FEATURED', 'BESTSELLER', 'NEW', 'TRENDING', 'POPULAR'];
    const upperBadge = badge.toUpperCase();

    if (!validBadges.includes(upperBadge)) {
        return res.status(200).json(
            new ApiResponsive(200, { courses: [] }, 'No courses found')
        );
    }

    // Get courses with the specified badge
    const courses = await prisma.course.findMany({
        where: {
            isPublished: true,
            badges: {
                has: upperBadge,
            },
        },
        include: {
            categories: {
                include: {
                    category: true,
                },
            },
            _count: {
                select: {
                    enrollments: true,
                },
            },
        },
        orderBy: {
            enrollments: {
                _count: 'desc',
            },
        },
        take: limitNum,
    });

    const coursesWithUrls = await Promise.all(courses.map(async (course) => {
        // Use shared pricing helper so flash sale (with referenceIds) is applied correctly
        const pricing = await getItemPricing('COURSE', course.id, course.price, course.salePrice);

        return {
            ...course,
            coverImageUrl: course.coverImage ? getPublicUrl(course.coverImage) : null,
            pricing,
        };
    }));

    return res.status(200).json(
        new ApiResponsive(200, { courses: coursesWithUrls }, `${badge} courses fetched successfully`)
    );
});

/**
 * Get free courses (for home page)
 */
export const getFreeCourses = asyncHandler(async (req, res) => {
    const { limit = 10 } = req.query;
    const limitNum = parseInt(limit);

    const courses = await prisma.course.findMany({
        where: {
            isPublished: true,
            isFree: true,
        },
        include: {
            categories: {
                include: {
                    category: true,
                },
            },
            _count: {
                select: {
                    enrollments: true,
                },
            },
        },
        orderBy: { createdAt: 'desc' },
        take: limitNum,
    });

    const coursesWithUrls = courses.map(course => ({
        ...course,
        coverImageUrl: course.coverImage ? getPublicUrl(course.coverImage) : null,
    }));

    return res.status(200).json(
        new ApiResponsive(200, { courses: coursesWithUrls }, 'Free courses fetched successfully')
    );
});

/**
 * Get course by slug
 */
export const getCourseBySlug = asyncHandler(async (req, res) => {
    const { slug } = req.params;
    const userId = req.user?.id;

    const course = await prisma.course.findUnique({
        where: { slug },
        include: {
            sessions: {
                where: { isPublished: true },
                orderBy: { order: 'asc' },
                include: {
                    chapters: {
                        where: { isPublished: true },
                        orderBy: { order: 'asc' },
                    },
                    resources: true,
                },
            },
            categories: {
                include: {
                    category: true,
                },
            },
            _count: {
                select: {
                    enrollments: true,
                },
            },
        },
    });

    if (!course) {
        throw new ApiError(404, 'Course not found');
    }

    // Check enrollment if user is logged in
    let isEnrolled = false;
    let enrollment = null;
    let enrolledViaBundle = false;
    if (userId) {
        // Check direct course enrollment - verify order is COMPLETED
        enrollment = await prisma.courseEnrollment.findUnique({
            where: {
                courseId_userId: {
                    courseId: course.id,
                    userId,
                },
            },
        });

        // If enrollment exists, verify there's a COMPLETED order
        if (enrollment) {
            const courseOrder = await prisma.courseOrder.findFirst({
                where: {
                    courseId: course.id,
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
            // Only consider enrolled if order status is COMPLETED
            isEnrolled = courseOrder?.order?.status === 'COMPLETED' && courseOrder?.order?.paymentStatus === 'PAID';
        }

        // If not directly enrolled, check if enrolled via bundle
        if (!isEnrolled) {
            const bundleEnrollment = await prisma.bundleEnrollment.findFirst({
                where: {
                    userId,
                    bundle: {
                        courses: {
                            some: {
                                courseId: course.id,
                            },
                        },
                    },
                },
                include: {
                    bundle: {
                        select: {
                            id: true,
                            title: true,
                            slug: true,
                        },
                    },
                },
            });

            if (bundleEnrollment) {
                isEnrolled = true;
                enrolledViaBundle = true;
                // Also create course enrollment if not exists (for consistency)
                if (!enrollment) {
                    enrollment = await prisma.courseEnrollment.create({
                        data: {
                            courseId: course.id,
                            userId,
                        },
                    });
                }
            }
        }
    }

    // Get flash sale pricing
    const pricing = await getItemPricing('COURSE', course.id, course.price, course.salePrice);

    // Add cover image URL and conditionally include video URLs
    const courseWithUrls = {
        ...course,
        coverImageUrl: course.coverImage ? getPublicUrl(course.coverImage) : null,
        sessions: course.sessions?.map(session => ({
            ...session,
            chapters: session.chapters?.map(chapter => {
                // Only include videoUrl if:
                // 1. User is enrolled, OR
                // 2. Chapter is a free preview
                const shouldIncludeVideoUrl = isEnrolled || chapter.isFreePreview;

                return {
                    ...chapter,
                    // Remove videoUrl if user is not enrolled and chapter is not free preview
                    videoUrl: shouldIncludeVideoUrl ? chapter.videoUrl : null,
                };
            }),
            resources: session.resources?.map(resource => ({
                ...resource,
                fileUrl: resource.fileUrl ? getPublicUrl(resource.fileUrl) : null,
            })),
        })),
        // Flash sale pricing info
        pricing,
    };

    return res.status(200).json(
        new ApiResponsive(200, {
            course: courseWithUrls,
            isEnrolled,
            enrollmentId: enrollment?.id,
            enrolledViaBundle
        }, 'Course fetched successfully')
    );
});

/**
 * Get course by ID (public for published courses, admin can see all)
 */
export const getCourseById = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const isAdmin = req.user?.role === 'ADMIN';

    const where = { id };
    // Non-admin users can only see published courses
    if (!isAdmin) {
        where.isPublished = true;
    }

    const course = await prisma.course.findUnique({
        where,
        include: {
            categories: {
                include: {
                    category: true,
                },
            },
            _count: {
                select: {
                    enrollments: true,
                },
            },
        },
    });

    if (!course) {
        throw new ApiError(404, 'Course not found');
    }

    // Get flash sale pricing
    const pricing = await getItemPricing('COURSE', course.id, course.price, course.salePrice);

    // Add cover image URL
    const courseWithUrls = {
        ...course,
        coverImageUrl: course.coverImage ? getPublicUrl(course.coverImage) : null,
        categories: course.categories?.map(rel => rel.category) || [],
        pricing,
    };

    return res.status(200).json(
        new ApiResponsive(200, { course: courseWithUrls }, 'Course fetched successfully')
    );
});

/**
 * Create course
 */
export const createCourse = asyncHandler(async (req, res) => {
    const { title, slug, description, language, price, salePrice, isFree, isPublished, categoryIds, coverImageUrl: coverImageUrlFromBody } = req.body;
    let coverImageUrl = null;

    if (!title || !description) {
        throw new ApiError(400, 'Title and description are required');
    }

    // Validate categories
    let categoryIdsArray = [];
    if (categoryIds) {
        if (typeof categoryIds === 'string') {
            try {
                categoryIdsArray = JSON.parse(categoryIds);
            } catch {
                categoryIdsArray = [categoryIds];
            }
        } else if (Array.isArray(categoryIds)) {
            categoryIdsArray = categoryIds;
        }

        if (categoryIdsArray.length === 0) {
            throw new ApiError(400, 'At least one category is required');
        }

        // Validate all categories exist
        const categories = await prisma.courseCategory.findMany({
            where: {
                id: { in: categoryIdsArray },
                isActive: true,
            },
        });

        if (categories.length !== categoryIdsArray.length) {
            throw new ApiError(400, 'One or more categories are invalid');
        }
    } else {
        throw new ApiError(400, 'At least one category is required');
    }

    // Handle cover image upload - either file upload or URL from MediaPicker
    if (req.files?.coverImage?.[0]) {
        // File upload
        const file = req.files.coverImage[0];
        coverImageUrl = await uploadToR2(file, 'courses');
    } else if (coverImageUrlFromBody) {
        // URL from MediaPicker - extract R2 path from public URL
        try {
            const url = new URL(coverImageUrlFromBody);
            coverImageUrl = url.pathname.startsWith('/') ? url.pathname.slice(1) : url.pathname;
        } catch (error) {
            // If coverImageUrl is already a path (not a full URL), use it directly
            coverImageUrl = coverImageUrlFromBody.startsWith('/') ? coverImageUrlFromBody.slice(1) : coverImageUrlFromBody;
        }
    }

    // Generate slug if not provided
    const finalSlug = slug || generateSlug(title);

    // Check if slug exists
    const existingCourse = await prisma.course.findUnique({
        where: { slug: finalSlug },
    });

    if (existingCourse) {
        throw new ApiError(400, 'Slug already exists');
    }

    const course = await prisma.course.create({
        data: {
            title,
            slug: finalSlug,
            description,
            coverImage: coverImageUrl,
            language: language || 'ENGLISH',
            price: parseFloat(price) || 0,
            salePrice: salePrice ? parseFloat(salePrice) : null,
            isFree: isFree === 'true' || isFree === true,
            isPublished: isPublished === 'true' || isPublished === true,
            categories: {
                create: categoryIdsArray.map(categoryId => ({
                    categoryId,
                })),
            },
        },
        include: {
            categories: {
                include: {
                    category: true,
                },
            },
        },
    });

    const courseWithUrls = {
        ...course,
        coverImageUrl: course.coverImage ? getPublicUrl(course.coverImage) : null,
    };

    return res.status(201).json(
        new ApiResponsive(201, { course: courseWithUrls }, 'Course created successfully')
    );
});

/**
 * Update course
 */
export const updateCourse = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { title, slug, description, language, price, salePrice, isFree, isPublished, removeCoverImage, categoryIds } = req.body;

    const course = await prisma.course.findUnique({
        where: { id },
        include: {
            categories: true,
        },
    });

    if (!course) {
        throw new ApiError(404, 'Course not found');
    }

    let coverImageUrl = course.coverImage;

    // Handle cover image upload - either file upload or URL from MediaPicker
    if (req.files?.coverImage?.[0]) {
        // File upload - DON'T delete old image, keep it in media library
        const file = req.files.coverImage[0];
        coverImageUrl = await uploadToR2(file, 'courses');
    } else if (req.body.coverImageUrl && !removeCoverImage) {
        // URL from MediaPicker - extract R2 path from public URL
        // DON'T delete old image, keep it in media library
        try {
            const url = new URL(req.body.coverImageUrl);
            coverImageUrl = url.pathname.startsWith('/') ? url.pathname.slice(1) : url.pathname;
        } catch (error) {
            // If coverImageUrl is already a path (not a full URL), use it directly
            coverImageUrl = req.body.coverImageUrl.startsWith('/') ? req.body.coverImageUrl.slice(1) : req.body.coverImageUrl;
        }
    } else if (removeCoverImage === 'true' || removeCoverImage === true) {
        // Only delete image if explicitly requested to remove
        if (course.coverImage) {
            await deleteFromR2(course.coverImage);
        }
        coverImageUrl = null;
    }

    // Check slug uniqueness if changed
    if (slug && slug !== course.slug) {
        const existingCourse = await prisma.course.findUnique({
            where: { slug },
        });
        if (existingCourse) {
            throw new ApiError(400, 'Slug already exists');
        }
    }

    // Handle categories update
    if (categoryIds !== undefined) {
        let categoryIdsArray = [];
        if (categoryIds) {
            if (typeof categoryIds === 'string') {
                try {
                    categoryIdsArray = JSON.parse(categoryIds);
                } catch {
                    categoryIdsArray = [categoryIds];
                }
            } else if (Array.isArray(categoryIds)) {
                categoryIdsArray = categoryIds;
            }

            if (categoryIdsArray.length === 0) {
                throw new ApiError(400, 'At least one category is required');
            }

            // Validate all categories exist
            const categories = await prisma.courseCategory.findMany({
                where: {
                    id: { in: categoryIdsArray },
                    isActive: true,
                },
            });

            if (categories.length !== categoryIdsArray.length) {
                throw new ApiError(400, 'One or more categories are invalid');
            }

            // Delete existing category relations
            await prisma.courseCategoryRelation.deleteMany({
                where: { courseId: id },
            });

            // Create new category relations
            await prisma.courseCategoryRelation.createMany({
                data: categoryIdsArray.map(categoryId => ({
                    courseId: id,
                    categoryId,
                })),
            });
        }
    }

    const updatedCourse = await prisma.course.update({
        where: { id },
        data: {
            title: title || course.title,
            slug: slug || course.slug,
            description: description || course.description,
            coverImage: coverImageUrl,
            language: language || course.language,
            price: price !== undefined ? parseFloat(price) : course.price,
            salePrice: salePrice !== undefined ? (salePrice ? parseFloat(salePrice) : null) : course.salePrice,
            isFree: isFree !== undefined ? (isFree === 'true' || isFree === true) : course.isFree,
            isPublished: isPublished !== undefined ? (isPublished === 'true' || isPublished === true) : course.isPublished,
        },
        include: {
            categories: {
                include: {
                    category: true,
                },
            },
        },
    });

    const courseWithUrls = {
        ...updatedCourse,
        coverImageUrl: updatedCourse.coverImage ? getPublicUrl(updatedCourse.coverImage) : null,
    };

    return res.status(200).json(
        new ApiResponsive(200, { course: courseWithUrls }, 'Course updated successfully')
    );
});

/**
 * Delete course
 */
export const deleteCourse = asyncHandler(async (req, res) => {
    const { id } = req.params;

    const course = await prisma.course.findUnique({
        where: { id },
        include: {
            sessions: {
                include: {
                    resources: true,
                },
            },
        },
    });

    if (!course) {
        throw new ApiError(404, 'Course not found');
    }

    // Check if course is part of any bundle
    const bundleCourse = await prisma.bundleCourse.findFirst({
        where: { courseId: id },
        include: {
            bundle: {
                select: { title: true },
            },
        },
    });

    if (bundleCourse) {
        throw new ApiError(400, `This course is part of a bundle "${bundleCourse.bundle.title}". Remove it from the bundle first.`);
    }

    // Delete cover image from R2
    if (course.coverImage) {
        try {
            await deleteFromR2(course.coverImage);
        } catch (error) {
            console.error(`Failed to delete cover image: ${course.coverImage}`, error);
        }
    }

    // Delete session resources from R2
    for (const session of course.sessions) {
        for (const resource of session.resources) {
            if (resource.fileUrl) {
                try {
                    await deleteFromR2(resource.fileUrl);
                } catch (error) {
                    console.error(`Failed to delete resource: ${resource.fileUrl}`, error);
                }
            }
        }
    }

    await prisma.course.delete({
        where: { id },
    });

    return res.status(200).json(
        new ApiResponsive(200, {}, 'Course deleted successfully')
    );
});

/**
 * Toggle publish status
 */
export const togglePublishStatus = asyncHandler(async (req, res) => {
    const { id } = req.params;

    const course = await prisma.course.findUnique({
        where: { id },
    });

    if (!course) {
        throw new ApiError(404, 'Course not found');
    }

    const updatedCourse = await prisma.course.update({
        where: { id },
        data: {
            isPublished: !course.isPublished,
        },
    });

    return res.status(200).json(
        new ApiResponsive(200, { course: updatedCourse }, 'Publish status updated')
    );
});

/**
 * Update course badges (FEATURED, BESTSELLER, NEW, TRENDING, POPULAR)
 */
export const updateCourseBadges = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { badges } = req.body;

    const course = await prisma.course.findUnique({
        where: { id },
    });

    if (!course) {
        throw new ApiError(404, 'Course not found');
    }

    // Validate badges
    const validBadges = ['FEATURED', 'BESTSELLER', 'NEW', 'TRENDING', 'POPULAR'];
    const filteredBadges = Array.isArray(badges)
        ? badges.filter(b => validBadges.includes(b.toUpperCase())).map(b => b.toUpperCase())
        : [];

    const updatedCourse = await prisma.course.update({
        where: { id },
        data: {
            badges: filteredBadges,
        },
        include: {
            categories: {
                include: {
                    category: true,
                },
            },
        },
    });

    const courseWithUrls = {
        ...updatedCourse,
        coverImageUrl: updatedCourse.coverImage ? getPublicUrl(updatedCourse.coverImage) : null,
    };

    return res.status(200).json(
        new ApiResponsive(200, { course: courseWithUrls }, 'Course badges updated successfully')
    );
});

/**
 * Create session
 */
export const createSession = asyncHandler(async (req, res) => {
    const { courseId } = req.params;
    const { title, description, order } = req.body;

    if (!title) {
        throw new ApiError(400, 'Title is required');
    }

    const course = await prisma.course.findUnique({
        where: { id: courseId },
    });

    if (!course) {
        throw new ApiError(404, 'Course not found');
    }

    // Get max order if not provided
    let sessionOrder = order ? parseInt(order) : 1;
    if (!order) {
        const maxOrder = await prisma.courseSession.findFirst({
            where: { courseId },
            orderBy: { order: 'desc' },
        });
        sessionOrder = maxOrder ? maxOrder.order + 1 : 1;
    }

    const session = await prisma.courseSession.create({
        data: {
            courseId,
            title,
            description: description || null,
            order: sessionOrder,
            isPublished: false,
        },
    });

    return res.status(201).json(
        new ApiResponsive(201, { session }, 'Session created successfully')
    );
});

/**
 * Update session
 */
export const updateSession = asyncHandler(async (req, res) => {
    const { sessionId } = req.params;
    const { title, description, order, isPublished } = req.body;

    const session = await prisma.courseSession.findUnique({
        where: { id: sessionId },
    });

    if (!session) {
        throw new ApiError(404, 'Session not found');
    }

    const updatedSession = await prisma.courseSession.update({
        where: { id: sessionId },
        data: {
            title: title || session.title,
            description: description !== undefined ? description : session.description,
            order: order !== undefined ? parseInt(order) : session.order,
            isPublished: isPublished !== undefined ? (isPublished === 'true' || isPublished === true) : session.isPublished,
        },
    });

    return res.status(200).json(
        new ApiResponsive(200, { session: updatedSession }, 'Session updated successfully')
    );
});

/**
 * Delete session
 */
export const deleteSession = asyncHandler(async (req, res) => {
    const { sessionId } = req.params;

    const session = await prisma.courseSession.findUnique({
        where: { id: sessionId },
        include: {
            resources: true,
        },
    });

    if (!session) {
        throw new ApiError(404, 'Session not found');
    }

    // Delete resources from R2
    for (const resource of session.resources) {
        if (resource.fileUrl) {
            try {
                await deleteFromR2(resource.fileUrl);
            } catch (error) {
                console.error(`Failed to delete resource: ${resource.fileUrl}`, error);
            }
        }
    }

    await prisma.courseSession.delete({
        where: { id: sessionId },
    });

    return res.status(200).json(
        new ApiResponsive(200, {}, 'Session deleted successfully')
    );
});

/**
 * Get sessions for a course
 */
export const getSessions = asyncHandler(async (req, res) => {
    const { courseId } = req.params;

    const sessions = await prisma.courseSession.findMany({
        where: { courseId },
        include: {
            chapters: {
                orderBy: { order: 'asc' },
            },
            resources: true,
        },
        orderBy: { order: 'asc' },
    });

    return res.status(200).json(
        new ApiResponsive(200, { sessions }, 'Sessions fetched successfully')
    );
});

/**
 * Create chapter
 */
export const createChapter = asyncHandler(async (req, res) => {
    const { sessionId } = req.params;
    const { title, slug, videoUrl, bunnyVideoId, videoDuration, videoStatus, isFreePreview, isPublished, order } = req.body;

    // Require either videoUrl (YouTube) or bunnyVideoId
    if (!title || (!videoUrl && !bunnyVideoId)) {
        throw new ApiError(400, 'Title and video source (URL or Bunny Video ID) are required');
    }

    const session = await prisma.courseSession.findUnique({
        where: { id: sessionId },
        include: {
            course: true,
        },
    });

    if (!session) {
        throw new ApiError(404, 'Session not found');
    }

    // Generate slug if not provided
    const finalSlug = slug || generateSlug(title);

    // Check if slug exists in this session
    const existingChapter = await prisma.courseChapter.findUnique({
        where: {
            sessionId_slug: {
                sessionId,
                slug: finalSlug,
            },
        },
    });

    if (existingChapter) {
        throw new ApiError(400, 'Chapter slug already exists in this session');
    }

    // Get max order if not provided
    let chapterOrder = order ? parseInt(order) : 1;
    if (!order) {
        const maxOrder = await prisma.courseChapter.findFirst({
            where: { sessionId },
            orderBy: { order: 'desc' },
        });
        chapterOrder = maxOrder ? maxOrder.order + 1 : 1;
    }

    const chapter = await prisma.courseChapter.create({
        data: {
            sessionId,
            title,
            slug: finalSlug,
            videoUrl: videoUrl || null, // YouTube URL (optional, deprecated)
            bunnyVideoId: bunnyVideoId || null, // Bunny.net video ID
            videoDuration: videoDuration ? parseInt(videoDuration) : null, // Duration in seconds
            videoStatus: videoStatus !== undefined ? parseInt(videoStatus) : 0, // Bunny status
            isFreePreview: isFreePreview === 'true' || isFreePreview === true,
            order: chapterOrder,
            isPublished: isPublished === 'true' || isPublished === true,
        },
        include: {
            session: {
                include: {
                    course: true,
                },
            },
        },
    });

    return res.status(201).json(
        new ApiResponsive(201, { chapter }, 'Chapter created successfully')
    );
});

/**
 * Update chapter
 */
export const updateChapter = asyncHandler(async (req, res) => {
    const { chapterId } = req.params;
    const { title, slug, videoUrl, bunnyVideoId, videoDuration, videoStatus, duration, isFreePreview, order, isPublished } = req.body;

    const chapter = await prisma.courseChapter.findUnique({
        where: { id: chapterId },
    });

    if (!chapter) {
        throw new ApiError(404, 'Chapter not found');
    }

    // Handle slug update
    let finalSlug = chapter.slug;
    if (slug && slug !== chapter.slug) {
        // Check if new slug exists in this session
        const existingChapter = await prisma.courseChapter.findUnique({
            where: {
                sessionId_slug: {
                    sessionId: chapter.sessionId,
                    slug,
                },
            },
        });

        if (existingChapter && existingChapter.id !== chapterId) {
            throw new ApiError(400, 'Chapter slug already exists in this session');
        }
        finalSlug = slug;
    }

    // Build update data
    const updateData = {
        title: title || chapter.title,
        slug: finalSlug,
        isFreePreview: isFreePreview !== undefined ? (isFreePreview === 'true' || isFreePreview === true) : chapter.isFreePreview,
        order: order !== undefined ? parseInt(order) : chapter.order,
        isPublished: isPublished !== undefined ? (isPublished === 'true' || isPublished === true) : chapter.isPublished,
    };

    // Handle video source update - videoUrl takes precedence if provided
    if (videoUrl !== undefined) {
        updateData.videoUrl = videoUrl || null;
    }
    if (bunnyVideoId !== undefined) {
        // If updating to a new video or removing video, and there was an old video, delete it from Bunny
        if (chapter.bunnyVideoId && chapter.bunnyVideoId !== bunnyVideoId) {
            try {
                await bunnyService.deleteVideo(chapter.bunnyVideoId);
                console.log(`Deleted old Bunny video: ${chapter.bunnyVideoId}`);
            } catch (error) {
                console.error(`Failed to delete old Bunny video ${chapter.bunnyVideoId}:`, error);
                // Continue with update even if delete fails
            }
        }
        updateData.bunnyVideoId = bunnyVideoId || null;
    }
    if (videoDuration !== undefined) {
        updateData.videoDuration = videoDuration ? parseInt(videoDuration) : null;
    }
    if (videoStatus !== undefined) {
        updateData.videoStatus = parseInt(videoStatus);
    }
    if (duration !== undefined) {
        updateData.duration = parseInt(duration);
    }

    const updatedChapter = await prisma.courseChapter.update({
        where: { id: chapterId },
        data: updateData,
    });

    return res.status(200).json(
        new ApiResponsive(200, { chapter: updatedChapter }, 'Chapter updated successfully')
    );
});

/**
 * Delete chapter
 */
export const deleteChapter = asyncHandler(async (req, res) => {
    const { chapterId } = req.params;

    const chapter = await prisma.courseChapter.findUnique({
        where: { id: chapterId },
    });

    if (!chapter) {
        throw new ApiError(404, 'Chapter not found');
    }

    // If chapter has a bunny video, delete it
    if (chapter.bunnyVideoId) {
        try {
            await bunnyService.deleteVideo(chapter.bunnyVideoId);
            console.log(`Deleted Bunny video for deleted chapter: ${chapter.bunnyVideoId}`);
        } catch (error) {
            console.error(`Failed to delete Bunny video ${chapter.bunnyVideoId}:`, error);
            // Continue with delete even if video delete fails
        }
    }

    await prisma.courseChapter.delete({
        where: { id: chapterId },
    });

    return res.status(200).json(
        new ApiResponsive(200, {}, 'Chapter deleted successfully')
    );
});

/**
 * Upload session resource (PDF)
 */
export const uploadSessionResource = asyncHandler(async (req, res) => {
    const { sessionId } = req.params;

    if (!req.files?.resource?.[0]) {
        throw new ApiError(400, 'Resource file is required');
    }

    const session = await prisma.courseSession.findUnique({
        where: { id: sessionId },
    });

    if (!session) {
        throw new ApiError(404, 'Session not found');
    }

    const file = req.files.resource[0];
    const fileUrl = await uploadToR2(file, 'course-resources');

    const resource = await prisma.sessionResource.create({
        data: {
            sessionId,
            fileName: file.originalname,
            fileUrl,
            fileSize: file.size,
        },
    });

    const resourceWithUrl = {
        ...resource,
        fileUrl: resource.fileUrl ? getPublicUrl(resource.fileUrl) : null,
    };

    return res.status(201).json(
        new ApiResponsive(201, { resource: resourceWithUrl }, 'Resource uploaded successfully')
    );
});

/**
 * Delete session resource
 */
export const deleteSessionResource = asyncHandler(async (req, res) => {
    const { resourceId } = req.params;

    const resource = await prisma.sessionResource.findUnique({
        where: { id: resourceId },
    });

    if (!resource) {
        throw new ApiError(404, 'Resource not found');
    }

    if (resource.fileUrl) {
        try {
            await deleteFromR2(resource.fileUrl);
        } catch (error) {
            console.error(`Failed to delete resource: ${resource.fileUrl}`, error);
        }
    }

    await prisma.sessionResource.delete({
        where: { id: resourceId },
    });

    return res.status(200).json(
        new ApiResponsive(200, {}, 'Resource deleted successfully')
    );
});

/**
 * Check enrollment
 */
export const checkEnrollment = asyncHandler(async (req, res) => {
    const { courseId } = req.params;
    const userId = req.user?.id;

    if (!userId) {
        return res.status(200).json(
            new ApiResponsive(200, { isEnrolled: false }, 'Not enrolled')
        );
    }

    const enrollment = await prisma.courseEnrollment.findUnique({
        where: {
            courseId_userId: {
                courseId,
                userId,
            },
        },
    });

    // Verify order is COMPLETED
    let isEnrolled = false;
    if (enrollment) {
        const courseOrder = await prisma.courseOrder.findFirst({
            where: {
                courseId,
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
        isEnrolled = courseOrder?.order?.status === 'COMPLETED' && courseOrder?.order?.paymentStatus === 'PAID';
    }

    return res.status(200).json(
        new ApiResponsive(200, { isEnrolled, enrollmentId: enrollment?.id }, 'Enrollment status fetched')
    );
});

/**
 * Get course progress
 */
export const getCourseProgress = asyncHandler(async (req, res) => {
    const { courseId } = req.params;
    const userId = req.user?.id;

    if (!userId) {
        throw new ApiError(401, 'Unauthorized');
    }

    const enrollment = await prisma.courseEnrollment.findUnique({
        where: {
            courseId_userId: {
                courseId,
                userId,
            },
        },
        include: {
            progress: {
                include: {
                    chapter: {
                        include: {
                            session: true,
                        },
                    },
                },
            },
        },
    });

    if (!enrollment) {
        throw new ApiError(404, 'Not enrolled in this course');
    }

    // Get all chapters with full details (user is enrolled, so include all video URLs)
    const course = await prisma.course.findUnique({
        where: { id: courseId },
        include: {
            sessions: {
                where: { isPublished: true },
                orderBy: { order: 'asc' },
                include: {
                    chapters: {
                        where: { isPublished: true },
                        orderBy: { order: 'asc' },
                    },
                },
            },
        },
    });

    const totalChapters = course.sessions.reduce((sum, session) => sum + session.chapters.length, 0);
    const completedChapters = enrollment.progress.filter(p => p.completed).length;
    const overallProgress = totalChapters > 0 ? (completedChapters / totalChapters) * 100 : 0;

    // Map progress to include full chapter details with video URLs
    const progressWithChapters = enrollment.progress.map(prog => {
        // Find the chapter in course sessions
        let chapterWithVideo = null;
        for (const session of course.sessions) {
            const chapter = session.chapters.find(ch => ch.id === prog.chapter.id);
            if (chapter) {
                chapterWithVideo = {
                    ...prog.chapter,
                    videoUrl: chapter.videoUrl, // Include video URL for enrolled users
                    session: {
                        id: session.id,
                        title: session.title,
                        order: session.order,
                    },
                };
                break;
            }
        }

        return {
            ...prog,
            chapter: chapterWithVideo || prog.chapter,
        };
    });

    return res.status(200).json(
        new ApiResponsive(200, {
            enrollment,
            progress: progressWithChapters,
            overallProgress,
            completedChapters,
            totalChapters,
        }, 'Progress fetched successfully')
    );
});

/**
 * Update chapter progress
 */
export const updateChapterProgress = asyncHandler(async (req, res) => {
    const { chapterId } = req.params;
    const { progress, completed } = req.body;
    const userId = req.user?.id;

    if (!userId) {
        throw new ApiError(401, 'Unauthorized');
    }

    const chapter = await prisma.courseChapter.findUnique({
        where: { id: chapterId },
        include: {
            session: {
                include: {
                    course: true,
                },
            },
        },
    });

    if (!chapter) {
        throw new ApiError(404, 'Chapter not found');
    }

    // Check enrollment
    const enrollment = await prisma.courseEnrollment.findUnique({
        where: {
            courseId_userId: {
                courseId: chapter.session.course.id,
                userId,
            },
        },
    });

    if (!enrollment && !chapter.isFreePreview) {
        throw new ApiError(403, 'Not enrolled in this course');
    }

    // If not enrolled but free preview, create temporary progress (optional)
    let enrollmentId = enrollment?.id;
    if (!enrollmentId && chapter.isFreePreview) {
        // For free preview, we might not track progress, or create a temporary one
        // For now, we'll require enrollment even for free preview tracking
        throw new ApiError(403, 'Please enroll to track progress');
    }

    const progressValue = Math.min(100, Math.max(0, parseFloat(progress) || 0));
    const isCompleted = completed === true || completed === 'true' || progressValue >= 90;

    const chapterProgress = await prisma.chapterProgress.upsert({
        where: {
            chapterId_enrollmentId: {
                chapterId,
                enrollmentId,
            },
        },
        update: {
            progress: progressValue,
            completed: isCompleted,
            lastWatchedAt: new Date(),
        },
        create: {
            chapterId,
            enrollmentId,
            progress: progressValue,
            completed: isCompleted,
            lastWatchedAt: new Date(),
        },
    });

    // Check for course completion and auto-generate certificate
    let courseCompleted = null;
    if (isCompleted) {
        try {
            const { checkAndCompleteCourse } = await import('../utils/certificateGenerator.js');
            courseCompleted = await checkAndCompleteCourse(userId, chapter.session.course.id);
        } catch (error) {
            console.error('Error checking course completion:', error);
        }
    }

    return res.status(200).json(
        new ApiResponsive(200, {
            progress: chapterProgress,
            courseCompleted: courseCompleted?.completed || false,
            certificateGenerated: courseCompleted?.isNew || false,
        }, 'Progress updated successfully')
    );
});

/**
 * Get chapter by slug (with access validation)
 */
export const getChapterBySlug = asyncHandler(async (req, res) => {
    const { courseSlug, chapterSlug } = req.params;
    const userId = req.user?.id;

    // Get course by slug
    const course = await prisma.course.findUnique({
        where: { slug: courseSlug },
        include: {
            sessions: {
                where: { isPublished: true },
                orderBy: { order: 'asc' },
                include: {
                    chapters: {
                        where: { isPublished: true },
                        orderBy: { order: 'asc' },
                    },
                },
            },
        },
    });

    if (!course) {
        throw new ApiError(404, 'Course not found');
    }

    // Find chapter by slug
    let chapter = null;
    let session = null;
    for (const sess of course.sessions) {
        const foundChapter = sess.chapters.find(ch => ch.slug === chapterSlug);
        if (foundChapter) {
            chapter = foundChapter;
            session = sess;
            break;
        }
    }

    if (!chapter) {
        throw new ApiError(404, 'Chapter not found');
    }

    // Check access
    let hasAccess = false;
    let isEnrolled = false;
    let enrollment = null;

    if (chapter.isFreePreview) {
        // Free preview requires login only
        hasAccess = !!userId;
    } else {
        // Paid chapter requires enrollment
        if (userId) {
            enrollment = await prisma.courseEnrollment.findUnique({
                where: {
                    courseId_userId: {
                        courseId: course.id,
                        userId,
                    },
                },
            });

            // Verify order is COMPLETED
            if (enrollment) {
                const courseOrder = await prisma.courseOrder.findFirst({
                    where: {
                        courseId: course.id,
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
                isEnrolled = courseOrder?.order?.status === 'COMPLETED' && courseOrder?.order?.paymentStatus === 'PAID';
            }
            hasAccess = isEnrolled;
        }
    }

    // Get progress if enrolled
    let progress = null;
    if (enrollment) {
        const chapterProgress = await prisma.chapterProgress.findUnique({
            where: {
                enrollmentId_chapterId: {
                    enrollmentId: enrollment.id,
                    chapterId: chapter.id,
                },
            },
        });
        progress = chapterProgress;
    }

    return res.status(200).json(
        new ApiResponsive(200, {
            chapter,
            session,
            course: {
                id: course.id,
                title: course.title,
                slug: course.slug,
            },
            hasAccess,
            isEnrolled,
            progress,
        }, 'Chapter fetched successfully')
    );
});

/**
 * Get course reviews
 */
export const getCourseReviews = asyncHandler(async (req, res) => {
    const { courseId } = req.params;

    const reviews = await prisma.courseReview.findMany({
        where: { courseId },
        include: {
            user: {
                select: {
                    id: true,
                    name: true,
                    avatar: true,
                },
            },
        },
        orderBy: { createdAt: 'desc' },
    });

    const reviewsWithUrls = reviews.map(review => ({
        ...review,
        user: {
            ...review.user,
            avatarUrl: review.user.avatar ? getPublicUrl(review.user.avatar) : null,
        },
    }));

    // Calculate average rating
    const avgRating = reviews.length > 0
        ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
        : 0;

    return res.status(200).json(
        new ApiResponsive(200, {
            reviews: reviewsWithUrls,
            averageRating: avgRating,
            totalReviews: reviews.length,
        }, 'Reviews fetched successfully')
    );
});

/**
 * Create or update course review
 */
export const createCourseReview = asyncHandler(async (req, res) => {
    const { courseId } = req.params;
    const userId = req.user.id;
    const { rating, comment } = req.body;

    if (!rating || rating < 1 || rating > 5) {
        throw new ApiError(400, 'Rating must be between 1 and 5');
    }

    // Check if user is enrolled
    const enrollment = await prisma.courseEnrollment.findUnique({
        where: {
            courseId_userId: {
                courseId,
                userId,
            },
        },
    });

    if (!enrollment) {
        throw new ApiError(403, 'You must be enrolled in this course to review');
    }

    // Get course with all chapters
    const course = await prisma.course.findUnique({
        where: { id: courseId },
        include: {
            sessions: {
                include: {
                    chapters: true,
                },
            },
        },
    });

    if (!course) {
        throw new ApiError(404, 'Course not found');
    }

    // Calculate total progress
    const allChapters = course.sessions.flatMap(s => s.chapters);
    const totalChapters = allChapters.length;

    if (totalChapters === 0) {
        throw new ApiError(400, 'Course has no chapters yet');
    }

    // Get user's progress
    const progressRecords = await prisma.chapterProgress.findMany({
        where: {
            enrollmentId: enrollment.id,
        },
    });

    const completedChapters = progressRecords.filter(p => p.completed).length;
    const progressPercentage = (completedChapters / totalChapters) * 100;

    if (progressPercentage < 50) {
        throw new ApiError(403, 'You must complete at least 50% of the course to review');
    }

    // Check if user already reviewed (users can only review once, no edits allowed)
    const existingReview = await prisma.courseReview.findUnique({
        where: {
            userId_courseId: {
                userId,
                courseId,
            },
        },
    });

    if (existingReview) {
        throw new ApiError(400, 'You have already reviewed this course. Reviews cannot be edited.');
    }

    // Create review (one-time only)
    const review = await prisma.courseReview.create({
        data: {
            userId,
            courseId,
            rating,
            comment: comment || null,
        },
        include: {
            user: {
                select: {
                    id: true,
                    name: true,
                    avatar: true,
                },
            },
        },
    });

    const reviewWithUrls = {
        ...review,
        user: {
            ...review.user,
            avatarUrl: review.user.avatar ? getPublicUrl(review.user.avatar) : null,
        },
    };

    return res.status(200).json(
        new ApiResponsive(200, { review: reviewWithUrls }, 'Review submitted successfully')
    );
});

/**
 * Get user's review for a course
 */
export const getUserCourseReview = asyncHandler(async (req, res) => {
    const { courseId } = req.params;
    const userId = req.user.id;

    const review = await prisma.courseReview.findUnique({
        where: {
            userId_courseId: {
                userId,
                courseId,
            },
        },
        include: {
            user: {
                select: {
                    id: true,
                    name: true,
                    avatar: true,
                },
            },
        },
    });

    if (!review) {
        return res.status(200).json(
            new ApiResponsive(200, { review: null }, 'No review found')
        );
    }

    const reviewWithUrls = {
        ...review,
        user: {
            ...review.user,
            avatarUrl: review.user.avatar ? getPublicUrl(review.user.avatar) : null,
        },
    };

    return res.status(200).json(
        new ApiResponsive(200, { review: reviewWithUrls }, 'Review fetched successfully')
    );
});

/**
 * Admin: Get all course enrollments with progress
 */
export const getAdminCourseEnrollments = asyncHandler(async (req, res) => {
    const {
        page = 1,
        limit = 20,
        courseId,
        search,
        sortBy = 'enrolledAt',
        sortOrder = 'desc'
    } = req.query;

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const where = {};

    if (courseId) {
        where.courseId = courseId;
    }

    if (search) {
        where.user = {
            OR: [
                { name: { contains: search, mode: 'insensitive' } },
                { email: { contains: search, mode: 'insensitive' } },
                { phone: { contains: search } },
            ],
        };
    }

    // Get total count
    const total = await prisma.courseEnrollment.count({ where });

    // Get enrollments with progress
    const enrollments = await prisma.courseEnrollment.findMany({
        where,
        skip,
        take: parseInt(limit),
        orderBy: { [sortBy]: sortOrder },
        include: {
            user: {
                select: {
                    id: true,
                    name: true,
                    email: true,
                    phone: true,
                    avatar: true,
                },
            },
            course: {
                select: {
                    id: true,
                    title: true,
                    slug: true,
                    coverImage: true,
                    sessions: {
                        select: {
                            id: true,
                            chapters: {
                                select: {
                                    id: true,
                                },
                            },
                        },
                    },
                },
            },
            progress: {
                select: {
                    id: true,
                    chapterId: true,
                    progress: true,
                    completed: true,
                    lastWatchedAt: true,
                },
            },
        },
    });

    // Process enrollments to add computed fields
    const processedEnrollments = enrollments.map(enrollment => {
        // Count total chapters
        const totalChapters = enrollment.course.sessions.reduce(
            (acc, session) => acc + session.chapters.length, 0
        );

        // Count completed chapters
        const completedChapters = enrollment.progress.filter(p => p.completed).length;

        // Calculate overall progress percentage
        const progressPercentage = totalChapters > 0
            ? Math.round((completedChapters / totalChapters) * 100)
            : 0;

        // Get last watched date
        const lastWatched = enrollment.progress.length > 0
            ? enrollment.progress.reduce((latest, p) => {
                if (!latest || (p.lastWatchedAt && new Date(p.lastWatchedAt) > new Date(latest))) {
                    return p.lastWatchedAt;
                }
                return latest;
            }, null)
            : null;

        return {
            id: enrollment.id,
            enrolledAt: enrollment.enrolledAt,
            user: {
                ...enrollment.user,
                avatarUrl: enrollment.user.avatar ? getPublicUrl(enrollment.user.avatar) : null,
            },
            course: {
                id: enrollment.course.id,
                title: enrollment.course.title,
                slug: enrollment.course.slug,
                coverImageUrl: enrollment.course.coverImage ? getPublicUrl(enrollment.course.coverImage) : null,
            },
            totalChapters,
            completedChapters,
            progressPercentage,
            lastWatched,
            isCompleted: completedChapters >= totalChapters && totalChapters > 0,
            chapterProgress: enrollment.progress,
        };
    });

    return res.status(200).json(
        new ApiResponsive(200, {
            enrollments: processedEnrollments,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total,
                pages: Math.ceil(total / parseInt(limit)),
            },
        }, 'Course enrollments fetched successfully')
    );
});

/**
 * Admin: Get single enrollment details with full progress
 */
export const getAdminEnrollmentDetails = asyncHandler(async (req, res) => {
    const { enrollmentId } = req.params;

    const enrollment = await prisma.courseEnrollment.findUnique({
        where: { id: enrollmentId },
        include: {
            user: {
                select: {
                    id: true,
                    name: true,
                    email: true,
                    phone: true,
                    avatar: true,
                },
            },
            course: {
                include: {
                    sessions: {
                        orderBy: { order: 'asc' },
                        include: {
                            chapters: {
                                orderBy: { order: 'asc' },
                                select: {
                                    id: true,
                                    title: true,
                                    order: true,
                                    duration: true,
                                },
                            },
                        },
                    },
                },
            },
            progress: true,
        },
    });

    if (!enrollment) {
        throw new ApiError(404, 'Enrollment not found');
    }

    // Map progress to chapters
    const progressMap = new Map(
        enrollment.progress.map(p => [p.chapterId, p])
    );

    const sessionsWithProgress = enrollment.course.sessions.map(session => ({
        id: session.id,
        title: session.title,
        order: session.order,
        chapters: session.chapters.map(chapter => {
            const chapterProgress = progressMap.get(chapter.id);
            return {
                ...chapter,
                progress: chapterProgress?.progress || 0,
                completed: chapterProgress?.completed || false,
                lastWatchedAt: chapterProgress?.lastWatchedAt || null,
            };
        }),
    }));

    // Calculate stats
    const totalChapters = enrollment.course.sessions.reduce(
        (acc, session) => acc + session.chapters.length, 0
    );
    const completedChapters = enrollment.progress.filter(p => p.completed).length;

    // Check if certificate exists for this user and course
    const existingCertificate = await prisma.certificate.findUnique({
        where: {
            userId_type_referenceId: {
                userId: enrollment.user.id,
                type: 'COURSE',
                referenceId: enrollment.course.id,
            },
        },
        select: {
            id: true,
            certificateNo: true,
            certificateUrl: true,
            issuedAt: true,
        },
    });

    return res.status(200).json(
        new ApiResponsive(200, {
            enrollment: {
                id: enrollment.id,
                enrolledAt: enrollment.enrolledAt,
                user: {
                    ...enrollment.user,
                    avatarUrl: enrollment.user.avatar ? getPublicUrl(enrollment.user.avatar) : null,
                },
                course: {
                    id: enrollment.course.id,
                    title: enrollment.course.title,
                    slug: enrollment.course.slug,
                    coverImageUrl: enrollment.course.coverImage ? getPublicUrl(enrollment.course.coverImage) : null,
                },
                sessions: sessionsWithProgress,
                stats: {
                    totalChapters,
                    completedChapters,
                    progressPercentage: totalChapters > 0 ? Math.round((completedChapters / totalChapters) * 100) : 0,
                    isCompleted: completedChapters >= totalChapters && totalChapters > 0,
                },
                certificate: existingCertificate ? {
                    ...existingCertificate,
                    certificateUrl: getPublicUrl(existingCertificate.certificateUrl),
                } : null,
            },
        }, 'Enrollment details fetched successfully')
    );
});

/**
 * Admin: Get course-wise enrollment stats
 */
export const getAdminCourseStats = asyncHandler(async (req, res) => {
    const courses = await prisma.course.findMany({
        include: {
            enrollments: {
                include: {
                    progress: true,
                },
            },
            sessions: {
                include: {
                    chapters: {
                        select: { id: true },
                    },
                },
            },
        },
    });

    const courseStats = courses.map(course => {
        const totalChapters = course.sessions.reduce(
            (acc, session) => acc + session.chapters.length, 0
        );

        const enrollmentStats = course.enrollments.map(enrollment => {
            const completedChapters = enrollment.progress.filter(p => p.completed).length;
            return {
                completedChapters,
                isCompleted: completedChapters >= totalChapters && totalChapters > 0,
            };
        });

        const totalEnrollments = course.enrollments.length;
        const completedEnrollments = enrollmentStats.filter(e => e.isCompleted).length;
        const inProgressEnrollments = totalEnrollments - completedEnrollments;

        // Calculate average progress
        const avgProgress = totalEnrollments > 0
            ? Math.round(
                enrollmentStats.reduce((acc, e) =>
                    acc + (totalChapters > 0 ? (e.completedChapters / totalChapters) * 100 : 0), 0
                ) / totalEnrollments
            )
            : 0;

        return {
            id: course.id,
            title: course.title,
            slug: course.slug,
            coverImageUrl: course.coverImage ? getPublicUrl(course.coverImage) : null,
            isPublished: course.isPublished,
            totalChapters,
            totalEnrollments,
            completedEnrollments,
            inProgressEnrollments,
            avgProgress,
        };
    });

    return res.status(200).json(
        new ApiResponsive(200, { courseStats }, 'Course stats fetched successfully')
    );
});

