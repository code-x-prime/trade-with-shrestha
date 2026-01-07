import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiResponsive } from "../utils/ApiResponsive.js";
import { ApiError } from "../utils/ApiError.js";
import { prisma } from "../config/db.js";
import { uploadToR2, deleteFromR2, getPublicUrl } from "../utils/cloudflare.js";
import { createSlug } from "../helper/Slug.js";
import { getItemPricing } from "../utils/flashSaleHelper.js";

/**
 * Get all e-books (Admin sees all, Users see only published)
 */
export const getEbooks = asyncHandler(async (req, res) => {
    const { page = 1, limit = 50, search = "", isPublished, isFree, category } = req.query;
    const isAdmin = req.user?.role === "ADMIN";

    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    const where = {};

    if (search) {
        where.OR = [
            { title: { contains: search, mode: "insensitive" } },
            { shortDescription: { contains: search, mode: "insensitive" } },
        ];
    }

    // Users can only see published e-books
    if (!isAdmin) {
        where.isPublished = true;
    } else if (isPublished !== undefined) {
        where.isPublished = isPublished === "true";
    }

    if (isFree !== undefined) {
        where.isFree = isFree === "true";
    }

    // Filter by category
    if (category) {
        where.categories = { has: category.toUpperCase() };
    }

    const [ebooks, total] = await Promise.all([
        prisma.ebook.findMany({
            where,
            orderBy: { createdAt: "desc" },
            skip,
            take: limitNum,
            include: {
                _count: {
                    select: {
                        reviews: true,
                        orders: true,
                    },
                },
            },
        }),
        prisma.ebook.count({ where }),
    ]);

    // Get active flash sale for ebooks
    const now = new Date();
    const activeFlashSale = await prisma.flashSale.findFirst({
        where: {
            type: 'EBOOK',
            isActive: true,
            startDate: { lte: now },
            endDate: { gte: now },
        },
    });

    // Add image URLs, review data, and flash sale pricing
    const ebooksWithUrls = await Promise.all(ebooks.map(async (ebook) => {
        const pricing = await getItemPricing('EBOOK', ebook.id, ebook.price, ebook.salePrice);

        return {
            ...ebook,
            image1Url: ebook.image1 ? getPublicUrl(ebook.image1) : null,
            image2Url: ebook.image2 ? getPublicUrl(ebook.image2) : null,
            image3Url: ebook.image3 ? getPublicUrl(ebook.image3) : null,
            pdfUrl: ebook.pdfFile ? getPublicUrl(ebook.pdfFile) : null,
            reviews: [],
            reviewCount: ebook._count.reviews,
            pricing,
        };
    }));

    return res.status(200).json(
        new ApiResponsive(
            200,
            {
                ebooks: ebooksWithUrls,
                pagination: {
                    page: pageNum,
                    limit: limitNum,
                    total,
                    totalPages: Math.ceil(total / limitNum),
                },
            },
            "E-books fetched successfully"
        )
    );
});

/**
 * Get e-books by category (for home page)
 */
export const getEbooksByCategory = asyncHandler(async (req, res) => {
    const { category, limit = 10 } = req.query;
    const limitNum = parseInt(limit);

    if (!category) {
        throw new ApiError(400, "Category is required");
    }

    const ebooks = await prisma.ebook.findMany({
        where: {
            isPublished: true,
            categories: { has: category.toUpperCase() },
        },
        orderBy: { createdAt: "desc" },
        take: limitNum,
    });

    const ebooksWithUrls = await Promise.all(ebooks.map(async (ebook) => {
        // Use shared pricing helper so flash sale (with referenceIds) is applied correctly
        const pricing = await getItemPricing('EBOOK', ebook.id, ebook.price, ebook.salePrice);

        return {
            ...ebook,
            image1Url: ebook.image1 ? getPublicUrl(ebook.image1) : null,
            image2Url: ebook.image2 ? getPublicUrl(ebook.image2) : null,
            image3Url: ebook.image3 ? getPublicUrl(ebook.image3) : null,
            pdfUrl: ebook.pdfFile ? getPublicUrl(ebook.pdfFile) : null,
            pricing,
        };
    }));

    return res.status(200).json(
        new ApiResponsive(200, { ebooks: ebooksWithUrls }, "E-books fetched successfully")
    );
});

/**
 * Get e-book by ID
 */
export const getEbookById = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const isAdmin = req.user?.role === "ADMIN";

    const where = { id };
    if (!isAdmin) {
        where.isPublished = true;
    }

    const ebook = await prisma.ebook.findFirst({
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
            },
        },
    });

    if (!ebook) {
        throw new ApiError(404, "E-book not found");
    }

    // Get flash sale pricing
    const pricing = await getItemPricing('EBOOK', ebook.id, ebook.price, ebook.salePrice);

    const ebookWithUrls = {
        ...ebook,
        image1Url: ebook.image1 ? getPublicUrl(ebook.image1) : null,
        image2Url: ebook.image2 ? getPublicUrl(ebook.image2) : null,
        image3Url: ebook.image3 ? getPublicUrl(ebook.image3) : null,
        pdfUrl: ebook.pdfFile ? getPublicUrl(ebook.pdfFile) : null,
        reviews: ebook.reviews.map((review) => ({
            ...review,
            user: {
                ...review.user,
                avatarUrl: review.user.avatar ? getPublicUrl(review.user.avatar) : null,
            },
        })),
        pricing,
    };

    return res.status(200).json(
        new ApiResponsive(200, { ebook: ebookWithUrls }, "E-book fetched successfully")
    );
});

/**
 * Get e-book by slug
 */
export const getEbookBySlug = asyncHandler(async (req, res) => {
    const { slug } = req.params;
    const isAdmin = req.user?.role === "ADMIN";

    const where = { slug };
    if (!isAdmin) {
        where.isPublished = true;
    }

    const ebook = await prisma.ebook.findFirst({
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
            },
        },
    });

    if (!ebook) {
        throw new ApiError(404, "E-book not found");
    }

    // Get flash sale pricing
    const pricing = await getItemPricing('EBOOK', ebook.id, ebook.price, ebook.salePrice);

    const ebookWithUrls = {
        ...ebook,
        image1Url: ebook.image1 ? getPublicUrl(ebook.image1) : null,
        image2Url: ebook.image2 ? getPublicUrl(ebook.image2) : null,
        image3Url: ebook.image3 ? getPublicUrl(ebook.image3) : null,
        pdfUrl: ebook.pdfFile ? getPublicUrl(ebook.pdfFile) : null,
        reviews: ebook.reviews.map((review) => ({
            ...review,
            user: {
                ...review.user,
                avatarUrl: review.user.avatar ? getPublicUrl(review.user.avatar) : null,
            },
        })),
        // Flash sale pricing info
        pricing,
    };

    return res.status(200).json(
        new ApiResponsive(200, { ebook: ebookWithUrls }, "E-book fetched successfully")
    );
});

/**
 * Create e-book (Admin only)
 */
export const createEbook = asyncHandler(async (req, res) => {
    const {
        title,
        shortDescription,
        description,
        price,
        salePrice,
        isFree,
        pages,
        curriculum,
        categories,
    } = req.body;

    if (!title || !description) {
        throw new ApiError(400, "Title and description are required");
    }

    const uploadedFiles = [];
    let image1 = null;
    let image2 = null;
    let image3 = null;
    let pdfFile = null;

    try {
        // Generate slug from title
        let baseSlug = createSlug(title);
        let slug = baseSlug;
        let slugCounter = 1;

        // Ensure unique slug
        while (await prisma.ebook.findUnique({ where: { slug } })) {
            slug = `${baseSlug}-${slugCounter}`;
            slugCounter++;
        }

        // Handle file uploads
        if (req.files) {
            const files = Array.isArray(req.files) ? req.files : Object.values(req.files).flat();

            // Handle images - either file upload or URL from MediaPicker
            if (req.files.image1 && req.files.image1[0]) {
                image1 = await uploadToR2(req.files.image1[0], "ebooks");
                uploadedFiles.push(image1);
            } else if (req.body.image1Url) {
                try {
                    const url = new URL(req.body.image1Url);
                    image1 = url.pathname.startsWith('/') ? url.pathname.slice(1) : url.pathname;
                } catch (error) {
                    image1 = req.body.image1Url.startsWith('/') ? req.body.image1Url.slice(1) : req.body.image1Url;
                }
            }
            if (req.files.image2 && req.files.image2[0]) {
                image2 = await uploadToR2(req.files.image2[0], "ebooks");
                uploadedFiles.push(image2);
            } else if (req.body.image2Url) {
                try {
                    const url = new URL(req.body.image2Url);
                    image2 = url.pathname.startsWith('/') ? url.pathname.slice(1) : url.pathname;
                } catch (error) {
                    image2 = req.body.image2Url.startsWith('/') ? req.body.image2Url.slice(1) : req.body.image2Url;
                }
            }
            if (req.files.image3 && req.files.image3[0]) {
                image3 = await uploadToR2(req.files.image3[0], "ebooks");
                uploadedFiles.push(image3);
            } else if (req.body.image3Url) {
                try {
                    const url = new URL(req.body.image3Url);
                    image3 = url.pathname.startsWith('/') ? url.pathname.slice(1) : url.pathname;
                } catch (error) {
                    image3 = req.body.image3Url.startsWith('/') ? req.body.image3Url.slice(1) : req.body.image3Url;
                }
            }

            // Handle PDF
            if (req.files.pdf && req.files.pdf[0]) {
                pdfFile = await uploadToR2(req.files.pdf[0], "ebooks");
                uploadedFiles.push(pdfFile);
            } else if (req.body.pdfUrl) {
                try {
                    const url = new URL(req.body.pdfUrl);
                    pdfFile = url.pathname.startsWith('/') ? url.pathname.slice(1) : url.pathname;
                } catch (error) {
                    pdfFile = req.body.pdfUrl.startsWith('/') ? req.body.pdfUrl.slice(1) : req.body.pdfUrl;
                }
            }
        }

        const curriculumArray = Array.isArray(curriculum) ? curriculum : curriculum ? JSON.parse(curriculum) : [];
        const categoriesArray = Array.isArray(categories) ? categories.map(c => c.toUpperCase()) : categories ? JSON.parse(categories).map(c => c.toUpperCase()) : [];

        const ebook = await prisma.ebook.create({
            data: {
                title,
                slug,
                shortDescription: shortDescription || null,
                description,
                price: parseFloat(price) || 0,
                salePrice: salePrice ? parseFloat(salePrice) : null,
                isFree: isFree === true || isFree === "true",
                pages: parseInt(pages) || 0,
                curriculum: curriculumArray,
                categories: categoriesArray,
                image1,
                image2,
                image3,
                pdfFile,
                isPublished: false, // Default to unpublished
            },
        });

        const ebookWithUrls = {
            ...ebook,
            image1Url: ebook.image1 ? getPublicUrl(ebook.image1) : null,
            image2Url: ebook.image2 ? getPublicUrl(ebook.image2) : null,
            image3Url: ebook.image3 ? getPublicUrl(ebook.image3) : null,
            pdfUrl: ebook.pdfFile ? getPublicUrl(ebook.pdfFile) : null,
        };

        return res.status(201).json(
            new ApiResponsive(201, { ebook: ebookWithUrls }, "E-book created successfully")
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
 * Update e-book (Admin only)
 */
export const updateEbook = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const {
        title,
        shortDescription,
        description,
        price,
        salePrice,
        isFree,
        pages,
        curriculum,
        categories,
        removeImage1,
        removeImage2,
        removeImage3,
        removePdf,
    } = req.body;

    const ebook = await prisma.ebook.findUnique({ where: { id } });
    if (!ebook) {
        throw new ApiError(404, "E-book not found");
    }

    const uploadedFiles = [];
    let image1 = ebook.image1;
    let image2 = ebook.image2;
    let image3 = ebook.image3;
    let pdfFile = ebook.pdfFile;
    let slug = ebook.slug;

    try {
        // Update slug if title changed
        if (title && title !== ebook.title) {
            let baseSlug = createSlug(title);
            let newSlug = baseSlug;
            let slugCounter = 1;

            while (await prisma.ebook.findFirst({ where: { slug: newSlug, id: { not: id } } })) {
                newSlug = `${baseSlug}-${slugCounter}`;
                slugCounter++;
            }
            slug = newSlug;
        }

        // Handle removals FIRST (before new uploads)
        if (removeImage1 === "true" || removeImage1 === true) {
            if (image1) {
                try {
                    await deleteFromR2(image1);
                } catch (error) {
                    console.error('Error deleting image1 from R2:', error);
                }
            }
            image1 = null;
        }
        if (removeImage2 === "true" || removeImage2 === true) {
            if (image2) {
                try {
                    await deleteFromR2(image2);
                } catch (error) {
                    console.error('Error deleting image2 from R2:', error);
                }
            }
            image2 = null;
        }
        if (removeImage3 === "true" || removeImage3 === true) {
            if (image3) {
                try {
                    await deleteFromR2(image3);
                } catch (error) {
                    console.error('Error deleting image3 from R2:', error);
                }
            }
            image3 = null;
        }
        if (removePdf === "true" || removePdf === true) {
            if (pdfFile) {
                try {
                    await deleteFromR2(pdfFile);
                } catch (error) {
                    console.error('Error deleting PDF from R2:', error);
                }
            }
            pdfFile = null;
        }

        // Handle file uploads (after removals) - either file upload or URL from MediaPicker
        if (req.files) {
            // Handle images - DON'T delete old images, keep them in media library
            if (req.files.image1 && req.files.image1[0]) {
                image1 = await uploadToR2(req.files.image1[0], "ebooks");
                uploadedFiles.push(image1);
            } else if (req.body.image1Url && !removeImage1) {
                try {
                    const url = new URL(req.body.image1Url);
                    image1 = url.pathname.startsWith('/') ? url.pathname.slice(1) : url.pathname;
                } catch (error) {
                    image1 = req.body.image1Url.startsWith('/') ? req.body.image1Url.slice(1) : req.body.image1Url;
                }
            }
            if (req.files.image2 && req.files.image2[0]) {
                image2 = await uploadToR2(req.files.image2[0], "ebooks");
                uploadedFiles.push(image2);
            } else if (req.body.image2Url && !removeImage2) {
                try {
                    const url = new URL(req.body.image2Url);
                    image2 = url.pathname.startsWith('/') ? url.pathname.slice(1) : url.pathname;
                } catch (error) {
                    image2 = req.body.image2Url.startsWith('/') ? req.body.image2Url.slice(1) : req.body.image2Url;
                }
            }
            if (req.files.image3 && req.files.image3[0]) {
                image3 = await uploadToR2(req.files.image3[0], "ebooks");
                uploadedFiles.push(image3);
            } else if (req.body.image3Url && !removeImage3) {
                try {
                    const url = new URL(req.body.image3Url);
                    image3 = url.pathname.startsWith('/') ? url.pathname.slice(1) : url.pathname;
                } catch (error) {
                    image3 = req.body.image3Url.startsWith('/') ? req.body.image3Url.slice(1) : req.body.image3Url;
                }
            }

            // Handle PDF
            if (req.files.pdf && req.files.pdf[0]) {
                pdfFile = await uploadToR2(req.files.pdf[0], "ebooks");
                uploadedFiles.push(pdfFile);
            } else if (req.body.pdfUrl && !removePdf) {
                try {
                    const url = new URL(req.body.pdfUrl);
                    pdfFile = url.pathname.startsWith('/') ? url.pathname.slice(1) : url.pathname;
                } catch (error) {
                    pdfFile = req.body.pdfUrl.startsWith('/') ? req.body.pdfUrl.slice(1) : req.body.pdfUrl;
                }
            }
        } else {
            // Handle URLs from MediaPicker when no files uploaded
            if (req.body.image1Url && !removeImage1) {
                try {
                    const url = new URL(req.body.image1Url);
                    image1 = url.pathname.startsWith('/') ? url.pathname.slice(1) : url.pathname;
                } catch (error) {
                    image1 = req.body.image1Url.startsWith('/') ? req.body.image1Url.slice(1) : req.body.image1Url;
                }
            }
            if (req.body.image2Url && !removeImage2) {
                try {
                    const url = new URL(req.body.image2Url);
                    image2 = url.pathname.startsWith('/') ? url.pathname.slice(1) : url.pathname;
                } catch (error) {
                    image2 = req.body.image2Url.startsWith('/') ? req.body.image2Url.slice(1) : req.body.image2Url;
                }
            }
            if (req.body.image3Url && !removeImage3) {
                try {
                    const url = new URL(req.body.image3Url);
                    image3 = url.pathname.startsWith('/') ? url.pathname.slice(1) : url.pathname;
                } catch (error) {
                    image3 = req.body.image3Url.startsWith('/') ? req.body.image3Url.slice(1) : req.body.image3Url;
                }
            }
            if (req.body.pdfUrl && !removePdf) {
                try {
                    const url = new URL(req.body.pdfUrl);
                    pdfFile = url.pathname.startsWith('/') ? url.pathname.slice(1) : url.pathname;
                } catch (error) {
                    pdfFile = req.body.pdfUrl.startsWith('/') ? req.body.pdfUrl.slice(1) : req.body.pdfUrl;
                }
            }
        }

        const updateData = {};

        if (title) updateData.title = title;
        if (shortDescription !== undefined) updateData.shortDescription = shortDescription || null;
        if (description) updateData.description = description;
        if (price !== undefined) updateData.price = parseFloat(price);
        if (salePrice !== undefined) updateData.salePrice = salePrice ? parseFloat(salePrice) : null;
        if (isFree !== undefined) updateData.isFree = isFree === true || isFree === "true";
        if (pages !== undefined) updateData.pages = parseInt(pages) || 0;
        if (curriculum !== undefined) {
            updateData.curriculum = Array.isArray(curriculum) ? curriculum : curriculum ? JSON.parse(curriculum) : [];
        }
        if (categories !== undefined) {
            updateData.categories = Array.isArray(categories) ? categories.map(c => c.toUpperCase()) : categories ? JSON.parse(categories).map(c => c.toUpperCase()) : [];
        }
        if (slug !== ebook.slug) updateData.slug = slug;
        if (image1 !== ebook.image1) updateData.image1 = image1;
        if (image2 !== ebook.image2) updateData.image2 = image2;
        if (image3 !== ebook.image3) updateData.image3 = image3;
        if (pdfFile !== ebook.pdfFile) updateData.pdfFile = pdfFile;

        const updatedEbook = await prisma.ebook.update({
            where: { id },
            data: updateData,
        });

        const ebookWithUrls = {
            ...updatedEbook,
            image1Url: updatedEbook.image1 ? getPublicUrl(updatedEbook.image1) : null,
            image2Url: updatedEbook.image2 ? getPublicUrl(updatedEbook.image2) : null,
            image3Url: updatedEbook.image3 ? getPublicUrl(updatedEbook.image3) : null,
            pdfUrl: updatedEbook.pdfFile ? getPublicUrl(updatedEbook.pdfFile) : null,
        };

        return res.status(200).json(
            new ApiResponsive(200, { ebook: ebookWithUrls }, "E-book updated successfully")
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
 * Update e-book categories (Admin only)
 */
export const updateEbookCategories = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { categories } = req.body;

    if (!Array.isArray(categories)) {
        throw new ApiError(400, "Categories must be an array");
    }

    // Validate categories (max 10 per category)
    const validCategories = ['FEATURED', 'BESTSELLER', 'NEW', 'TRENDING', 'POPULAR'];
    const categoryCounts = {};

    categories.forEach(cat => {
        const upperCat = cat.toUpperCase();
        if (!validCategories.includes(upperCat)) {
            throw new ApiError(400, `Invalid category: ${cat}. Valid categories are: ${validCategories.join(', ')}`);
        }
        categoryCounts[upperCat] = (categoryCounts[upperCat] || 0) + 1;
    });

    // Check limits (max 10 per category)
    for (const [cat, count] of Object.entries(categoryCounts)) {
        if (count > 10) {
            throw new ApiError(400, `Maximum 10 books allowed in ${cat} category`);
        }
    }

    const ebook = await prisma.ebook.findUnique({ where: { id } });
    if (!ebook) {
        throw new ApiError(404, "E-book not found");
    }

    const normalizedCategories = categories.map(c => c.toUpperCase());

    const updatedEbook = await prisma.ebook.update({
        where: { id },
        data: { categories: normalizedCategories },
    });

    const ebookWithUrls = {
        ...updatedEbook,
        image1Url: updatedEbook.image1 ? getPublicUrl(updatedEbook.image1) : null,
        image2Url: updatedEbook.image2 ? getPublicUrl(updatedEbook.image2) : null,
        image3Url: updatedEbook.image3 ? getPublicUrl(updatedEbook.image3) : null,
        pdfUrl: updatedEbook.pdfFile ? getPublicUrl(updatedEbook.pdfFile) : null,
    };

    return res.status(200).json(
        new ApiResponsive(200, { ebook: ebookWithUrls }, "E-book categories updated successfully")
    );
});

/**
 * Publish/Unpublish e-book (Admin only)
 */
export const togglePublishEbook = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { isPublished } = req.body;

    if (typeof isPublished !== "boolean") {
        throw new ApiError(400, "isPublished must be a boolean");
    }

    const ebook = await prisma.ebook.update({
        where: { id },
        data: { isPublished },
    });

    const ebookWithUrls = {
        ...ebook,
        image1Url: ebook.image1 ? getPublicUrl(ebook.image1) : null,
        image2Url: ebook.image2 ? getPublicUrl(ebook.image2) : null,
        image3Url: ebook.image3 ? getPublicUrl(ebook.image3) : null,
        pdfUrl: ebook.pdfFile ? getPublicUrl(ebook.pdfFile) : null,
    };

    return res.status(200).json(
        new ApiResponsive(200, { ebook: ebookWithUrls }, "E-book publish status updated successfully")
    );
});

/**
 * Delete e-book (Admin only)
 */
export const deleteEbook = asyncHandler(async (req, res) => {
    const { id } = req.params;

    const ebook = await prisma.ebook.findUnique({ where: { id } });
    if (!ebook) {
        throw new ApiError(404, "E-book not found");
    }

    // Delete files from R2
    const filesToDelete = [ebook.image1, ebook.image2, ebook.image3, ebook.pdfFile].filter(Boolean);
    for (const file of filesToDelete) {
        try {
            await deleteFromR2(file);
        } catch (error) {
            console.error(`Failed to delete file ${file}:`, error);
        }
    }

    await prisma.ebook.delete({ where: { id } });

    return res.status(200).json(
        new ApiResponsive(200, {}, "E-book deleted successfully")
    );
});
