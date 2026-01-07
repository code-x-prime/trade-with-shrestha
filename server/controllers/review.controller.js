import { prisma } from '../config/db.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiError } from '../utils/ApiError.js';
import { ApiResponsive } from '../utils/ApiResponsive.js';
import { getPublicUrl } from '../utils/cloudflare.js';

/**
 * Admin: Get all reviews with filters and pagination
 */
export const getAllReviews = asyncHandler(async (req, res) => {
    const {
        page = 1,
        limit = 20,
        type = 'all', // all, ebook, course, indicator
        search = '',
        rating = '',
        sortBy = 'createdAt',
        sortOrder = 'desc',
    } = req.query;

    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    // Fetch all review types
    const results = {
        reviews: [],
        total: 0,
    };

    // Ebook Reviews
    if (type === 'all' || type === 'ebook') {
        const ebookWhere = {};
        if (search) {
            ebookWhere.OR = [
                { comment: { contains: search, mode: 'insensitive' } },
                { user: { name: { contains: search, mode: 'insensitive' } } },
                { user: { email: { contains: search, mode: 'insensitive' } } },
                { ebook: { title: { contains: search, mode: 'insensitive' } } },
            ];
        }
        if (rating) {
            ebookWhere.rating = parseInt(rating);
        }

        const [ebookReviews, ebookCount] = await Promise.all([
            prisma.review.findMany({
                where: ebookWhere,
                include: {
                    user: {
                        select: { id: true, name: true, email: true, avatar: true },
                    },
                    ebook: {
                        select: { id: true, title: true, slug: true, image1: true },
                    },
                },
                orderBy: { [sortBy]: sortOrder },
                skip: type === 'ebook' ? skip : 0,
                take: type === 'ebook' ? limitNum : undefined,
            }),
            prisma.review.count({ where: ebookWhere }),
        ]);

        const formattedEbookReviews = ebookReviews.map(r => ({
            ...r,
            reviewType: 'EBOOK',
            itemTitle: r.ebook?.title || 'Unknown Ebook',
            itemSlug: r.ebook?.slug,
            itemImage: r.ebook?.image1 ? getPublicUrl(r.ebook.image1) : null,
            user: {
                ...r.user,
                avatarUrl: r.user?.avatar ? getPublicUrl(r.user.avatar) : null,
            },
        }));

        results.reviews.push(...formattedEbookReviews);
        results.total += ebookCount;
    }

    // Course Reviews
    if (type === 'all' || type === 'course') {
        const courseWhere = {};
        if (search) {
            courseWhere.OR = [
                { comment: { contains: search, mode: 'insensitive' } },
                { user: { name: { contains: search, mode: 'insensitive' } } },
                { user: { email: { contains: search, mode: 'insensitive' } } },
                { course: { title: { contains: search, mode: 'insensitive' } } },
            ];
        }
        if (rating) {
            courseWhere.rating = parseInt(rating);
        }

        const [courseReviews, courseCount] = await Promise.all([
            prisma.courseReview.findMany({
                where: courseWhere,
                include: {
                    user: {
                        select: { id: true, name: true, email: true, avatar: true },
                    },
                    course: {
                        select: { id: true, title: true, slug: true, coverImage: true },
                    },
                },
                orderBy: { [sortBy]: sortOrder },
                skip: type === 'course' ? skip : 0,
                take: type === 'course' ? limitNum : undefined,
            }),
            prisma.courseReview.count({ where: courseWhere }),
        ]);

        const formattedCourseReviews = courseReviews.map(r => ({
            ...r,
            reviewType: 'COURSE',
            itemTitle: r.course?.title || 'Unknown Course',
            itemSlug: r.course?.slug,
            itemImage: r.course?.coverImage ? getPublicUrl(r.course.coverImage) : null,
            user: {
                ...r.user,
                avatarUrl: r.user?.avatar ? getPublicUrl(r.user.avatar) : null,
            },
        }));

        results.reviews.push(...formattedCourseReviews);
        results.total += courseCount;
    }

    // Indicator Reviews
    if (type === 'all' || type === 'indicator') {
        const indicatorWhere = {};
        if (search) {
            indicatorWhere.OR = [
                { comment: { contains: search, mode: 'insensitive' } },
                { user: { name: { contains: search, mode: 'insensitive' } } },
                { user: { email: { contains: search, mode: 'insensitive' } } },
                { indicator: { name: { contains: search, mode: 'insensitive' } } },
            ];
        }
        if (rating) {
            indicatorWhere.rating = parseInt(rating);
        }

        const [indicatorReviews, indicatorCount] = await Promise.all([
            prisma.indicatorReview.findMany({
                where: indicatorWhere,
                include: {
                    user: {
                        select: { id: true, name: true, email: true, avatar: true },
                    },
                    indicator: {
                        select: { id: true, name: true, slug: true, image: true },
                    },
                },
                orderBy: { [sortBy]: sortOrder },
                skip: type === 'indicator' ? skip : 0,
                take: type === 'indicator' ? limitNum : undefined,
            }),
            prisma.indicatorReview.count({ where: indicatorWhere }),
        ]);

        const formattedIndicatorReviews = indicatorReviews.map(r => ({
            ...r,
            reviewType: 'INDICATOR',
            itemTitle: r.indicator?.name || 'Unknown Indicator',
            itemSlug: r.indicator?.slug,
            itemImage: r.indicator?.image ? getPublicUrl(r.indicator.image) : null,
            user: {
                ...r.user,
                avatarUrl: r.user?.avatar ? getPublicUrl(r.user.avatar) : null,
            },
        }));

        results.reviews.push(...formattedIndicatorReviews);
        results.total += indicatorCount;
    }

    // Sort combined results if type is 'all'
    if (type === 'all') {
        results.reviews.sort((a, b) => {
            const aVal = a[sortBy];
            const bVal = b[sortBy];
            if (sortOrder === 'desc') {
                return new Date(bVal) - new Date(aVal);
            }
            return new Date(aVal) - new Date(bVal);
        });
        // Paginate combined results
        results.reviews = results.reviews.slice(skip, skip + limitNum);
    }

    return res.status(200).json(
        new ApiResponsive(200, {
            reviews: results.reviews,
            pagination: {
                page: pageNum,
                limit: limitNum,
                total: results.total,
                pages: Math.ceil(results.total / limitNum),
            },
        }, 'Reviews fetched successfully')
    );
});

/**
 * Admin: Get review stats
 */
export const getReviewStats = asyncHandler(async (req, res) => {
    const [
        ebookCount,
        courseCount,
        indicatorCount,
        ebookAvg,
        courseAvg,
        indicatorAvg,
        recentEbook,
        recentCourse,
        recentIndicator,
    ] = await Promise.all([
        prisma.review.count(),
        prisma.courseReview.count(),
        prisma.indicatorReview.count(),
        prisma.review.aggregate({ _avg: { rating: true } }),
        prisma.courseReview.aggregate({ _avg: { rating: true } }),
        prisma.indicatorReview.aggregate({ _avg: { rating: true } }),
        prisma.review.count({ where: { createdAt: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } } }),
        prisma.courseReview.count({ where: { createdAt: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } } }),
        prisma.indicatorReview.count({ where: { createdAt: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } } }),
    ]);

    // Rating distribution
    const [ebookRatings, courseRatings, indicatorRatings] = await Promise.all([
        prisma.review.groupBy({ by: ['rating'], _count: true }),
        prisma.courseReview.groupBy({ by: ['rating'], _count: true }),
        prisma.indicatorReview.groupBy({ by: ['rating'], _count: true }),
    ]);

    const ratingDistribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    [...ebookRatings, ...courseRatings, ...indicatorRatings].forEach(r => {
        ratingDistribution[r.rating] = (ratingDistribution[r.rating] || 0) + r._count;
    });

    return res.status(200).json(
        new ApiResponsive(200, {
            total: ebookCount + courseCount + indicatorCount,
            byType: {
                ebook: ebookCount,
                course: courseCount,
                indicator: indicatorCount,
            },
            averageRating: {
                ebook: ebookAvg._avg.rating || 0,
                course: courseAvg._avg.rating || 0,
                indicator: indicatorAvg._avg.rating || 0,
                overall: ((ebookAvg._avg.rating || 0) + (courseAvg._avg.rating || 0) + (indicatorAvg._avg.rating || 0)) / 3,
            },
            recentWeek: recentEbook + recentCourse + recentIndicator,
            ratingDistribution,
        }, 'Review stats fetched successfully')
    );
});

/**
 * Admin: Update a review
 */
export const updateReview = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { reviewType } = req.query;
    const { rating, comment } = req.body;

    if (!reviewType) {
        throw new ApiError(400, 'Review type is required');
    }

    let updatedReview;

    if (reviewType === 'EBOOK') {
        updatedReview = await prisma.review.update({
            where: { id },
            data: {
                rating: rating !== undefined ? parseInt(rating) : undefined,
                comment: comment !== undefined ? comment : undefined,
            },
            include: {
                user: { select: { id: true, name: true, email: true, avatar: true } },
                ebook: { select: { id: true, title: true, slug: true } },
            },
        });
    } else if (reviewType === 'COURSE') {
        updatedReview = await prisma.courseReview.update({
            where: { id },
            data: {
                rating: rating !== undefined ? parseInt(rating) : undefined,
                comment: comment !== undefined ? comment : undefined,
            },
            include: {
                user: { select: { id: true, name: true, email: true, avatar: true } },
                course: { select: { id: true, title: true, slug: true } },
            },
        });
    } else if (reviewType === 'INDICATOR') {
        updatedReview = await prisma.indicatorReview.update({
            where: { id },
            data: {
                rating: rating !== undefined ? parseInt(rating) : undefined,
                comment: comment !== undefined ? comment : undefined,
            },
            include: {
                user: { select: { id: true, name: true, email: true, avatar: true } },
                indicator: { select: { id: true, name: true, slug: true } },
            },
        });
    } else {
        throw new ApiError(400, 'Invalid review type');
    }

    return res.status(200).json(
        new ApiResponsive(200, { review: updatedReview }, 'Review updated successfully')
    );
});

/**
 * Admin: Delete a review
 */
export const deleteReview = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { reviewType } = req.query;

    if (!reviewType) {
        throw new ApiError(400, 'Review type is required');
    }

    if (reviewType === 'EBOOK') {
        await prisma.review.delete({ where: { id } });
    } else if (reviewType === 'COURSE') {
        await prisma.courseReview.delete({ where: { id } });
    } else if (reviewType === 'INDICATOR') {
        await prisma.indicatorReview.delete({ where: { id } });
    } else {
        throw new ApiError(400, 'Invalid review type');
    }

    return res.status(200).json(
        new ApiResponsive(200, null, 'Review deleted successfully')
    );
});

/**
 * Admin: Get single review details
 */
export const getReviewById = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { reviewType } = req.query;

    if (!reviewType) {
        throw new ApiError(400, 'Review type is required');
    }

    let review;

    if (reviewType === 'EBOOK') {
        review = await prisma.review.findUnique({
            where: { id },
            include: {
                user: { select: { id: true, name: true, email: true, avatar: true } },
                ebook: { select: { id: true, title: true, slug: true, image1: true } },
            },
        });
        if (review) {
            review = {
                ...review,
                reviewType: 'EBOOK',
                itemTitle: review.ebook?.title,
                itemSlug: review.ebook?.slug,
                itemImage: review.ebook?.image1 ? getPublicUrl(review.ebook.image1) : null,
            };
        }
    } else if (reviewType === 'COURSE') {
        review = await prisma.courseReview.findUnique({
            where: { id },
            include: {
                user: { select: { id: true, name: true, email: true, avatar: true } },
                course: { select: { id: true, title: true, slug: true, coverImage: true } },
            },
        });
        if (review) {
            review = {
                ...review,
                reviewType: 'COURSE',
                itemTitle: review.course?.title,
                itemSlug: review.course?.slug,
                itemImage: review.course?.coverImage ? getPublicUrl(review.course.coverImage) : null,
            };
        }
    } else if (reviewType === 'INDICATOR') {
        review = await prisma.indicatorReview.findUnique({
            where: { id },
            include: {
                user: { select: { id: true, name: true, email: true, avatar: true } },
                indicator: { select: { id: true, name: true, slug: true, image: true } },
            },
        });
        if (review) {
            review = {
                ...review,
                reviewType: 'INDICATOR',
                itemTitle: review.indicator?.name,
                itemSlug: review.indicator?.slug,
                itemImage: review.indicator?.image ? getPublicUrl(review.indicator.image) : null,
            };
        }
    } else {
        throw new ApiError(400, 'Invalid review type');
    }

    if (!review) {
        throw new ApiError(404, 'Review not found');
    }

    return res.status(200).json(
        new ApiResponsive(200, { review }, 'Review fetched successfully')
    );
});

