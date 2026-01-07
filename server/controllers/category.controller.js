import { ApiError } from '../utils/ApiError.js';
import { ApiResponsive } from '../utils/ApiResponsive.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { generateSlug } from '../utils/slugGenerator.js';
import { prisma } from '../config/db.js';

/**
 * Get all categories
 */
export const getCategories = asyncHandler(async (req, res) => {
    const { active } = req.query;

    const where = {};
    if (active === 'true') {
        where.isActive = true;
    }

    const categories = await prisma.courseCategory.findMany({
        where,
        orderBy: [
            { isDefault: 'desc' },
            { name: 'asc' },
        ],
        include: {
            _count: {
                select: {
                    courses: true,
                },
            },
        },
    });

    return res.status(200).json(
        new ApiResponsive(200, { categories }, 'Categories fetched successfully')
    );
});

/**
 * Get category by ID
 */
export const getCategoryById = asyncHandler(async (req, res) => {
    const { id } = req.params;

    const category = await prisma.courseCategory.findUnique({
        where: { id },
        include: {
            _count: {
                select: {
                    courses: true,
                },
            },
        },
    });

    if (!category) {
        throw new ApiError(404, 'Category not found');
    }

    return res.status(200).json(
        new ApiResponsive(200, { category }, 'Category fetched successfully')
    );
});

/**
 * Create category
 */
export const createCategory = asyncHandler(async (req, res) => {
    const { name } = req.body;

    if (!name || !name.trim()) {
        throw new ApiError(400, 'Category name is required');
    }

    const slug = generateSlug(name);

    // Check if slug already exists
    const existing = await prisma.courseCategory.findUnique({
        where: { slug },
    });

    if (existing) {
        throw new ApiError(400, 'Category with this name already exists');
    }

    const category = await prisma.courseCategory.create({
        data: {
            name: name.trim(),
            slug,
            isDefault: false,
            isActive: true,
        },
    });

    return res.status(201).json(
        new ApiResponsive(201, { category }, 'Category created successfully')
    );
});

/**
 * Update category
 */
export const updateCategory = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { name, isActive } = req.body;

    const category = await prisma.courseCategory.findUnique({
        where: { id },
    });

    if (!category) {
        throw new ApiError(404, 'Category not found');
    }

    if (category.isDefault) {
        throw new ApiError(400, 'Default categories cannot be modified');
    }

    const updateData = {};
    if (name && name.trim()) {
        const slug = generateSlug(name);
        // Check if new slug conflicts with another category
        const existing = await prisma.courseCategory.findUnique({
            where: { slug },
        });
        if (existing && existing.id !== id) {
            throw new ApiError(400, 'Category with this name already exists');
        }
        updateData.name = name.trim();
        updateData.slug = slug;
    }
    if (isActive !== undefined) {
        updateData.isActive = isActive === 'true' || isActive === true;
    }

    const updatedCategory = await prisma.courseCategory.update({
        where: { id },
        data: updateData,
    });

    return res.status(200).json(
        new ApiResponsive(200, { category: updatedCategory }, 'Category updated successfully')
    );
});

/**
 * Delete category
 */
export const deleteCategory = asyncHandler(async (req, res) => {
    const { id } = req.params;

    const category = await prisma.courseCategory.findUnique({
        where: { id },
        include: {
            _count: {
                select: {
                    courses: true,
                },
            },
        },
    });

    if (!category) {
        throw new ApiError(404, 'Category not found');
    }

    if (category.isDefault) {
        throw new ApiError(400, 'Default categories cannot be deleted');
    }

    if (category._count.courses > 0) {
        throw new ApiError(400, 'Cannot delete category with associated courses');
    }

    await prisma.courseCategory.delete({
        where: { id },
    });

    return res.status(200).json(
        new ApiResponsive(200, {}, 'Category deleted successfully')
    );
});

