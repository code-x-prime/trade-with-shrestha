import { prisma } from '../config/db.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiError } from '../utils/ApiError.js';
import { ApiResponsive } from '../utils/ApiResponsive.js';
import { getPublicUrl } from '../utils/cloudflare.js';

/**
 * Get active flash sale (public) - returns all items in the sale
 */
export const getActiveFlashSale = asyncHandler(async (req, res) => {
    const now = new Date();

    const flashSale = await prisma.flashSale.findFirst({
        where: {
            isActive: true,
            startDate: { lte: now },
            endDate: { gte: now },
        },
        orderBy: { createdAt: 'desc' },
    });

    if (!flashSale || !flashSale.referenceIds || flashSale.referenceIds.length === 0) {
        return res.status(200).json(
            new ApiResponsive(200, { flashSale: null }, 'No active flash sale')
        );
    }

    // Get all referenced item details
    const items = [];

    if (flashSale.type === 'COURSE') {
        const courses = await prisma.course.findMany({
            where: { id: { in: flashSale.referenceIds } },
            select: {
                id: true,
                title: true,
                slug: true,
                coverImage: true,
                price: true,
                salePrice: true,
            },
        });
        items.push(...courses.map(course => ({
            ...course,
            imageUrl: course.coverImage ? getPublicUrl(course.coverImage) : null,
            itemType: 'COURSE',
            link: `/courses/${course.slug}`,
        })));
    } else if (flashSale.type === 'EBOOK') {
        const ebooks = await prisma.ebook.findMany({
            where: { id: { in: flashSale.referenceIds } },
            select: {
                id: true,
                title: true,
                slug: true,
                image1: true,
                price: true,
                salePrice: true,
                shortDescription: true,
            },
        });
        items.push(...ebooks.map(ebook => ({
            ...ebook,
            imageUrl: ebook.image1 ? getPublicUrl(ebook.image1) : null,
            itemType: 'EBOOK',
            link: `/ebooks/${ebook.slug}`,
        })));
    } else if (flashSale.type === 'WEBINAR') {
        const webinars = await prisma.webinar.findMany({
            where: { id: { in: flashSale.referenceIds } },
            select: {
                id: true,
                title: true,
                slug: true,
                image: true,
                price: true,
                salePrice: true,
            },
        });
        items.push(...webinars.map(webinar => ({
            ...webinar,
            imageUrl: webinar.image ? getPublicUrl(webinar.image) : null,
            itemType: 'WEBINAR',
            link: `/webinars/${webinar.slug}`,
        })));
    } else if (flashSale.type === 'GUIDANCE') {
        const guidances = await prisma.guidance.findMany({
            where: { id: { in: flashSale.referenceIds } },
            select: {
                id: true,
                title: true,
                slug: true,
                expertImage: true,
                price: true,
            },
        });
        items.push(...guidances.map(guidance => ({
            ...guidance,
            imageUrl: guidance.expertImage ? getPublicUrl(guidance.expertImage) : null,
            itemType: 'GUIDANCE',
            link: `/guidance/${guidance.slug}`,
            salePrice: null,
        })));
    } else if (flashSale.type === 'BUNDLE') {
        const bundles = await prisma.bundle.findMany({
            where: { id: { in: flashSale.referenceIds } },
            select: {
                id: true,
                title: true,
                slug: true,
                thumbnail: true,
                price: true,
                salePrice: true,
                shortDescription: true,
            },
        });
        items.push(...bundles.map(bundle => ({
            ...bundle,
            imageUrl: bundle.thumbnail ? getPublicUrl(bundle.thumbnail) : null,
            itemType: 'BUNDLE',
            link: `/bundle/${bundle.slug}`,
        })));
    }

    return res.status(200).json(
        new ApiResponsive(200, {
            flashSale: {
                ...flashSale,
                items,
            },
        }, 'Flash sale fetched')
    );
});

/**
 * Admin: Get all flash sales
 */
export const getAllFlashSales = asyncHandler(async (req, res) => {
    const { page = 1, limit = 20, type = '', isActive = '' } = req.query;

    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    const where = {};
    if (type) where.type = type;
    if (isActive !== '') where.isActive = isActive === 'true';

    const [flashSales, total] = await Promise.all([
        prisma.flashSale.findMany({
            where,
            orderBy: { createdAt: 'desc' },
            skip,
            take: limitNum,
        }),
        prisma.flashSale.count({ where }),
    ]);

    // Enrich with item details
    const enrichedSales = await Promise.all(
        flashSales.map(async (sale) => {
            const itemTitles = [];
            const itemImages = [];

            if (sale.referenceIds && sale.referenceIds.length > 0) {
                if (sale.type === 'COURSE') {
                    const courses = await prisma.course.findMany({
                        where: { id: { in: sale.referenceIds } },
                        select: { title: true, coverImage: true, slug: true },
                    });
                    courses.forEach(course => {
                        itemTitles.push(course.title);
                        if (course.coverImage) itemImages.push(getPublicUrl(course.coverImage));
                    });
                } else if (sale.type === 'EBOOK') {
                    const ebooks = await prisma.ebook.findMany({
                        where: { id: { in: sale.referenceIds } },
                        select: { title: true, image1: true, slug: true },
                    });
                    ebooks.forEach(ebook => {
                        itemTitles.push(ebook.title);
                        if (ebook.image1) itemImages.push(getPublicUrl(ebook.image1));
                    });
                } else if (sale.type === 'WEBINAR') {
                    const webinars = await prisma.webinar.findMany({
                        where: { id: { in: sale.referenceIds } },
                        select: { title: true, image: true, slug: true },
                    });
                    webinars.forEach(webinar => {
                        itemTitles.push(webinar.title);
                        if (webinar.image) itemImages.push(getPublicUrl(webinar.image));
                    });
                } else if (sale.type === 'GUIDANCE') {
                    const guidances = await prisma.guidance.findMany({
                        where: { id: { in: sale.referenceIds } },
                        select: { title: true, expertImage: true, slug: true },
                    });
                    guidances.forEach(guidance => {
                        itemTitles.push(guidance.title);
                        if (guidance.expertImage) itemImages.push(getPublicUrl(guidance.expertImage));
                    });
                } else if (sale.type === 'BUNDLE') {
                    const bundles = await prisma.bundle.findMany({
                        where: { id: { in: sale.referenceIds } },
                        select: { title: true, thumbnail: true, slug: true },
                    });
                    bundles.forEach(bundle => {
                        itemTitles.push(bundle.title);
                        if (bundle.thumbnail) itemImages.push(getPublicUrl(bundle.thumbnail));
                    });
                }
            }

            return {
                ...sale,
                itemTitle: itemTitles.length > 0 ? itemTitles.join(', ') : 'Unknown',
                itemCount: sale.referenceIds?.length || 0,
                itemImage: itemImages[0] || null,
            };
        })
    );

    return res.status(200).json(
        new ApiResponsive(200, {
            flashSales: enrichedSales,
            pagination: {
                page: pageNum,
                limit: limitNum,
                total,
                pages: Math.ceil(total / limitNum),
            },
        }, 'Flash sales fetched')
    );
});

/**
 * Admin: Create flash sale
 */
export const createFlashSale = asyncHandler(async (req, res) => {
    const {
        type,
        referenceIds,
        title,
        subtitle,
        discountPercent,
        theme,
        bgColor,
        textColor,
        startDate,
        endDate,
        isActive,
    } = req.body;

    if (!type || !referenceIds || !Array.isArray(referenceIds) || referenceIds.length === 0 || !title || !discountPercent || !startDate || !endDate) {
        throw new ApiError(400, 'Type, referenceIds (array), title, discountPercent, startDate and endDate are required');
    }

    // Validate all references exist
    let itemsExist = false;
    if (type === 'COURSE') {
        const count = await prisma.course.count({ where: { id: { in: referenceIds } } });
        itemsExist = count === referenceIds.length;
    } else if (type === 'EBOOK') {
        const count = await prisma.ebook.count({ where: { id: { in: referenceIds } } });
        itemsExist = count === referenceIds.length;
    } else if (type === 'WEBINAR') {
        const count = await prisma.webinar.count({ where: { id: { in: referenceIds } } });
        itemsExist = count === referenceIds.length;
    } else if (type === 'GUIDANCE') {
        const count = await prisma.guidance.count({ where: { id: { in: referenceIds } } });
        itemsExist = count === referenceIds.length;
    } else if (type === 'BUNDLE') {
        const count = await prisma.bundle.count({ where: { id: { in: referenceIds } } });
        itemsExist = count === referenceIds.length;
    }

    if (!itemsExist) {
        throw new ApiError(404, 'One or more referenced items not found');
    }

    // If creating an active sale, deactivate other active sales
    if (isActive) {
        await prisma.flashSale.updateMany({
            where: { isActive: true },
            data: { isActive: false },
        });
    }

    const flashSale = await prisma.flashSale.create({
        data: {
            type,
            referenceIds,
            title,
            subtitle: subtitle || null,
            discountPercent: parseInt(discountPercent),
            theme: theme || 'default',
            bgColor: bgColor || '#dc2626',
            textColor: textColor || '#ffffff',
            startDate: new Date(startDate),
            endDate: new Date(endDate),
            isActive: isActive ?? true,
        },
    });

    return res.status(201).json(
        new ApiResponsive(201, { flashSale }, 'Flash sale created successfully')
    );
});

/**
 * Admin: Update flash sale
 */
export const updateFlashSale = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const {
        type,
        referenceIds,
        title,
        subtitle,
        discountPercent,
        theme,
        bgColor,
        textColor,
        startDate,
        endDate,
        isActive,
    } = req.body;

    const existing = await prisma.flashSale.findUnique({ where: { id } });
    if (!existing) {
        throw new ApiError(404, 'Flash sale not found');
    }

    // Validate referenceIds if provided
    if (referenceIds && Array.isArray(referenceIds) && referenceIds.length > 0) {
        const saleType = type || existing.type;
        let itemsExist = false;
        if (saleType === 'COURSE') {
            const count = await prisma.course.count({ where: { id: { in: referenceIds } } });
            itemsExist = count === referenceIds.length;
        } else if (saleType === 'EBOOK') {
            const count = await prisma.ebook.count({ where: { id: { in: referenceIds } } });
            itemsExist = count === referenceIds.length;
        } else if (saleType === 'WEBINAR') {
            const count = await prisma.webinar.count({ where: { id: { in: referenceIds } } });
            itemsExist = count === referenceIds.length;
        } else if (saleType === 'GUIDANCE') {
            const count = await prisma.guidance.count({ where: { id: { in: referenceIds } } });
            itemsExist = count === referenceIds.length;
        } else if (saleType === 'BUNDLE') {
            const count = await prisma.bundle.count({ where: { id: { in: referenceIds } } });
            itemsExist = count === referenceIds.length;
        }

        if (!itemsExist) {
            throw new ApiError(404, 'One or more referenced items not found');
        }
    }

    // If activating this sale, deactivate others
    if (isActive && !existing.isActive) {
        await prisma.flashSale.updateMany({
            where: { isActive: true, id: { not: id } },
            data: { isActive: false },
        });
    }

    const flashSale = await prisma.flashSale.update({
        where: { id },
        data: {
            type: type || existing.type,
            referenceIds: referenceIds || existing.referenceIds,
            title: title || existing.title,
            subtitle: subtitle !== undefined ? subtitle : existing.subtitle,
            discountPercent: discountPercent ? parseInt(discountPercent) : existing.discountPercent,
            theme: theme || existing.theme,
            bgColor: bgColor || existing.bgColor,
            textColor: textColor || existing.textColor,
            startDate: startDate ? new Date(startDate) : existing.startDate,
            endDate: endDate ? new Date(endDate) : existing.endDate,
            isActive: isActive !== undefined ? isActive : existing.isActive,
        },
    });

    return res.status(200).json(
        new ApiResponsive(200, { flashSale }, 'Flash sale updated successfully')
    );
});

/**
 * Admin: Delete flash sale
 */
export const deleteFlashSale = asyncHandler(async (req, res) => {
    const { id } = req.params;

    const existing = await prisma.flashSale.findUnique({ where: { id } });
    if (!existing) {
        throw new ApiError(404, 'Flash sale not found');
    }

    await prisma.flashSale.delete({ where: { id } });

    return res.status(200).json(
        new ApiResponsive(200, null, 'Flash sale deleted successfully')
    );
});

/**
 * Admin: Toggle flash sale active status
 */
export const toggleFlashSale = asyncHandler(async (req, res) => {
    const { id } = req.params;

    const existing = await prisma.flashSale.findUnique({ where: { id } });
    if (!existing) {
        throw new ApiError(404, 'Flash sale not found');
    }

    // If activating, deactivate others
    if (!existing.isActive) {
        await prisma.flashSale.updateMany({
            where: { isActive: true, id: { not: id } },
            data: { isActive: false },
        });
    }

    const flashSale = await prisma.flashSale.update({
        where: { id },
        data: { isActive: !existing.isActive },
    });

    return res.status(200).json(
        new ApiResponsive(200, { flashSale }, `Flash sale ${flashSale.isActive ? 'activated' : 'deactivated'}`)
    );
});

/**
 * Admin: Get items by type for dropdown
 */
export const getItemsByType = asyncHandler(async (req, res) => {
    const { type } = req.params;

    let items = [];

    if (type === 'COURSE') {
        const courses = await prisma.course.findMany({
            where: { isPublished: true, isFree: false }, // Only paid courses
            select: { id: true, title: true, coverImage: true, price: true, salePrice: true },
            orderBy: { title: 'asc' },
        });
        items = courses.map(c => ({
            id: c.id,
            title: c.title,
            image: c.coverImage ? getPublicUrl(c.coverImage) : null,
            price: c.price,
            salePrice: c.salePrice,
        }));
    } else if (type === 'EBOOK') {
        const ebooks = await prisma.ebook.findMany({
            where: { isPublished: true, isFree: false }, // Only paid ebooks
            select: { id: true, title: true, image1: true, price: true, salePrice: true },
            orderBy: { title: 'asc' },
        });
        items = ebooks.map(e => ({
            id: e.id,
            title: e.title,
            image: e.image1 ? getPublicUrl(e.image1) : null,
            price: e.price,
            salePrice: e.salePrice,
        }));
    } else if (type === 'WEBINAR') {
        const webinars = await prisma.webinar.findMany({
            where: { isPublished: true, isFree: false }, // Only paid webinars
            select: { id: true, title: true, image: true, price: true, salePrice: true },
            orderBy: { title: 'asc' },
        });
        items = webinars.map(w => ({
            id: w.id,
            title: w.title,
            image: w.image ? getPublicUrl(w.image) : null,
            price: w.price,
            salePrice: w.salePrice,
        }));
    } else if (type === 'GUIDANCE') {
        // Guidance uses status instead of isPublished, and has expertImage instead of image
        // Only paid guidance (price > 0)
        const guidances = await prisma.guidance.findMany({
            where: { status: 'ACTIVE', price: { gt: 0 } },
            select: { id: true, title: true, expertImage: true, price: true },
            orderBy: { title: 'asc' },
        });
        items = guidances.map(g => ({
            id: g.id,
            title: g.title,
            image: g.expertImage ? getPublicUrl(g.expertImage) : null,
            price: g.price,
            salePrice: null, // Guidance doesn't have salePrice
        }));
    } else if (type === 'BUNDLE') {
        // Get published bundles with price > 0
        const bundles = await prisma.bundle.findMany({
            where: { isPublished: true, price: { gt: 0 } },
            select: { id: true, title: true, thumbnail: true, price: true, salePrice: true },
            orderBy: { title: 'asc' },
        });
        items = bundles.map(b => ({
            id: b.id,
            title: b.title,
            image: b.thumbnail ? getPublicUrl(b.thumbnail) : null,
            price: b.price,
            salePrice: b.salePrice,
        }));
    }

    return res.status(200).json(
        new ApiResponsive(200, { items }, 'Items fetched')
    );
});
