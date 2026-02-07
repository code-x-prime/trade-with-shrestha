import { ApiError } from '../utils/ApiError.js';
import { ApiResponsive } from '../utils/ApiResponsive.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { generateSlug } from '../utils/slugGenerator.js';
import { prisma } from '../config/db.js';

/**
 * Get all active categories (Public)
 */
export const getCategories = asyncHandler(async (req, res) => {
    const categories = await prisma.interviewCategory.findMany({
        where: {
            isActive: true,
        },
        orderBy: {
            sortOrder: 'asc',
        },
        include: {
            _count: {
                select: {
                    questions: {
                        where: { isPublished: true }
                    }
                }
            }
        }
    });

    return res.status(200).json(
        new ApiResponsive(200, { categories }, 'Categories fetched successfully')
    );
});

/**
 * Get all categories including inactive (Admin)
 */
export const getAllCategoriesAdmin = asyncHandler(async (req, res) => {
    const categories = await prisma.interviewCategory.findMany({
        orderBy: {
            sortOrder: 'asc',
        },
        include: {
            _count: {
                select: {
                    questions: true
                }
            }
        }
    });

    return res.status(200).json(
        new ApiResponsive(200, { categories }, 'Categories fetched successfully')
    );
});

/**
 * Get category by ID (Admin)
 */
export const getCategoryById = asyncHandler(async (req, res) => {
    const { id } = req.params;

    const category = await prisma.interviewCategory.findUnique({
        where: { id },
        include: {
            _count: {
                select: {
                    questions: true
                }
            }
        }
    });

    if (!category) {
        throw new ApiError(404, 'Category not found');
    }

    return res.status(200).json(
        new ApiResponsive(200, { category }, 'Category fetched successfully')
    );
});

/**
 * Create new category (Admin)
 */
export const createCategory = asyncHandler(async (req, res) => {
    const { name, slug, description, icon, sortOrder, isActive } = req.body;

    if (!name) {
        throw new ApiError(400, 'Category name is required');
    }

    // Generate slug if not provided
    const finalSlug = slug || generateSlug(name);

    // Check slug uniqueness
    const existingCategory = await prisma.interviewCategory.findUnique({
        where: { slug: finalSlug },
    });

    if (existingCategory) {
        throw new ApiError(400, 'Category with this slug already exists');
    }

    const category = await prisma.interviewCategory.create({
        data: {
            name,
            slug: finalSlug,
            description: description || null,
            icon: icon || null,
            sortOrder: sortOrder ? parseInt(sortOrder) : 0,
            isActive: isActive !== false,
        },
    });

    return res.status(201).json(
        new ApiResponsive(201, { category }, 'Category created successfully')
    );
});

/**
 * Update category (Admin)
 */
export const updateCategory = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { name, slug, description, icon, sortOrder, isActive } = req.body;

    const existingCategory = await prisma.interviewCategory.findUnique({
        where: { id },
    });

    if (!existingCategory) {
        throw new ApiError(404, 'Category not found');
    }

    // Check slug uniqueness if slug is being updated
    if (slug && slug !== existingCategory.slug) {
        const slugExists = await prisma.interviewCategory.findUnique({
            where: { slug },
        });

        if (slugExists) {
            throw new ApiError(400, 'Category with this slug already exists');
        }
    }

    const category = await prisma.interviewCategory.update({
        where: { id },
        data: {
            name: name || existingCategory.name,
            slug: slug || existingCategory.slug,
            description: description !== undefined ? description : existingCategory.description,
            icon: icon !== undefined ? icon : existingCategory.icon,
            sortOrder: sortOrder !== undefined ? parseInt(sortOrder) : existingCategory.sortOrder,
            isActive: isActive !== undefined ? Boolean(isActive) : existingCategory.isActive,
        },
    });

    return res.status(200).json(
        new ApiResponsive(200, { category }, 'Category updated successfully')
    );
});

/**
 * Delete category (Admin)
 */
export const deleteCategory = asyncHandler(async (req, res) => {
    const { id } = req.params;

    const category = await prisma.interviewCategory.findUnique({
        where: { id },
        include: {
            _count: {
                select: {
                    questions: true
                }
            }
        }
    });

    if (!category) {
        throw new ApiError(404, 'Category not found');
    }

    if (category._count.questions > 0) {
        throw new ApiError(400, `Cannot delete category. It has ${category._count.questions} associated questions.`);
    }

    await prisma.interviewCategory.delete({
        where: { id },
    });

    return res.status(200).json(
        new ApiResponsive(200, null, 'Category deleted successfully')
    );
});

/**
 * Toggle category active status (Admin)
 */
export const toggleActiveStatus = asyncHandler(async (req, res) => {
    const { id } = req.params;

    const category = await prisma.interviewCategory.findUnique({
        where: { id },
    });

    if (!category) {
        throw new ApiError(404, 'Category not found');
    }

    const updatedCategory = await prisma.interviewCategory.update({
        where: { id },
        data: {
            isActive: !category.isActive,
        },
    });

    return res.status(200).json(
        new ApiResponsive(200, { category: updatedCategory }, 'Category status updated successfully')
    );
});
