import { ApiError } from '../utils/ApiError.js';
import { ApiResponsive } from '../utils/ApiResponsive.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { generateSlug } from '../utils/slugGenerator.js';
import { prisma } from '../config/db.js';

/**
 * Get all published questions with filters (Public)
 */
export const getInterviewQuestions = asyncHandler(async (req, res) => {
    const { category, categoryId, difficulty, search, page = 1, limit = 50 } = req.query;

    const where = {
        isPublished: true,
    };

    if (categoryId) {
        where.categoryId = categoryId;
    } else if (category) {
        // Find category by slug
        const cat = await prisma.interviewCategory.findUnique({
            where: { slug: category },
        });
        if (cat) {
            where.categoryId = cat.id;
        }
    }

    if (difficulty) {
        where.difficulty = difficulty;
    }

    if (search) {
        where.OR = [
            { title: { contains: search, mode: 'insensitive' } },
            { tags: { hasSome: [search] } },
        ];
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [questions, total] = await Promise.all([
        prisma.interviewQuestion.findMany({
            where,
            include: {
                category: {
                    select: {
                        id: true,
                        name: true,
                        slug: true,
                    },
                },
            },
            orderBy: [
                { sortOrder: 'asc' },
                { createdAt: 'desc' },
            ],
            skip,
            take: parseInt(limit),
        }),
        prisma.interviewQuestion.count({ where }),
    ]);

    return res.status(200).json(
        new ApiResponsive(200, {
            questions,
            pagination: {
                total,
                page: parseInt(page),
                limit: parseInt(limit),
                totalPages: Math.ceil(total / parseInt(limit)),
            },
        }, 'Questions fetched successfully')
    );
});

/**
 * Get question by slug (Public)
 */
export const getInterviewQuestionBySlug = asyncHandler(async (req, res) => {
    const { slug } = req.params;

    const question = await prisma.interviewQuestion.findUnique({
        where: { slug },
        include: {
            category: {
                select: {
                    id: true,
                    name: true,
                    slug: true,
                },
            },
        },
    });

    if (!question || !question.isPublished) {
        throw new ApiError(404, 'Question not found');
    }

    return res.status(200).json(
        new ApiResponsive(200, { question }, 'Question fetched successfully')
    );
});

/**
 * Get all questions for admin (Admin)
 */
export const getAdminInterviewQuestions = asyncHandler(async (req, res) => {
    const { categoryId, difficulty, isPublished, search, page = 1, limit = 20 } = req.query;

    const where = {};

    if (categoryId) {
        where.categoryId = categoryId;
    }

    if (difficulty) {
        where.difficulty = difficulty;
    }

    if (isPublished !== undefined) {
        where.isPublished = isPublished === 'true';
    }

    if (search) {
        where.OR = [
            { title: { contains: search, mode: 'insensitive' } },
            { tags: { hasSome: [search] } },
        ];
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [questions, total] = await Promise.all([
        prisma.interviewQuestion.findMany({
            where,
            include: {
                category: {
                    select: {
                        id: true,
                        name: true,
                        slug: true,
                    },
                },
            },
            orderBy: [
                { sortOrder: 'asc' },
                { createdAt: 'desc' },
            ],
            skip,
            take: parseInt(limit),
        }),
        prisma.interviewQuestion.count({ where }),
    ]);

    return res.status(200).json(
        new ApiResponsive(200, {
            questions,
            pagination: {
                total,
                page: parseInt(page),
                limit: parseInt(limit),
                totalPages: Math.ceil(total / parseInt(limit)),
            },
        }, 'Questions fetched successfully')
    );
});

/**
 * Get question by ID (Admin)
 */
export const getInterviewQuestionById = asyncHandler(async (req, res) => {
    const { id } = req.params;

    const question = await prisma.interviewQuestion.findUnique({
        where: { id },
        include: {
            category: {
                select: {
                    id: true,
                    name: true,
                    slug: true,
                },
            },
        },
    });

    if (!question) {
        throw new ApiError(404, 'Question not found');
    }

    return res.status(200).json(
        new ApiResponsive(200, { question }, 'Question fetched successfully')
    );
});

/**
 * Create new question (Admin)
 */
export const createInterviewQuestion = asyncHandler(async (req, res) => {
    const { title, slug, answer, categoryId, difficulty, tags, isPublished, sortOrder } = req.body;

    if (!title || !answer || !categoryId) {
        throw new ApiError(400, 'Title, answer, and category are required');
    }

    // Verify category exists
    const category = await prisma.interviewCategory.findUnique({
        where: { id: categoryId },
    });

    if (!category) {
        throw new ApiError(404, 'Category not found');
    }

    // Generate slug if not provided
    const finalSlug = slug || generateSlug(title);

    // Check slug uniqueness
    const existingQuestion = await prisma.interviewQuestion.findUnique({
        where: { slug: finalSlug },
    });

    if (existingQuestion) {
        throw new ApiError(400, 'Question with this slug already exists');
    }

    // Parse tags if string
    let parsedTags = [];
    if (tags) {
        if (Array.isArray(tags)) {
            parsedTags = tags;
        } else if (typeof tags === 'string') {
            try {
                parsedTags = JSON.parse(tags);
            } catch {
                parsedTags = tags.split(',').map(t => t.trim()).filter(Boolean);
            }
        }
    }

    const question = await prisma.interviewQuestion.create({
        data: {
            title,
            slug: finalSlug,
            answer,
            categoryId,
            difficulty: difficulty || null,
            tags: parsedTags,
            isPublished: isPublished !== false,
            sortOrder: sortOrder ? parseInt(sortOrder) : 0,
        },
        include: {
            category: {
                select: {
                    id: true,
                    name: true,
                    slug: true,
                },
            },
        },
    });

    return res.status(201).json(
        new ApiResponsive(201, { question }, 'Question created successfully')
    );
});

/**
 * Bulk create questions (Admin)
 */
export const createBulkInterviewQuestions = asyncHandler(async (req, res) => {
    const { questions } = req.body;

    if (!Array.isArray(questions) || questions.length === 0) {
        throw new ApiError(400, 'Questions array is required');
    }

    const createdQuestions = [];
    const errors = [];

    for (let i = 0; i < questions.length; i++) {
        const q = questions[i];

        try {
            if (!q.title || !q.answer || !q.categoryId) {
                errors.push({ index: i, error: 'Title, answer, and category are required' });
                continue;
            }

            // Verify category exists
            const category = await prisma.interviewCategory.findUnique({
                where: { id: q.categoryId },
            });

            if (!category) {
                errors.push({ index: i, error: 'Category not found' });
                continue;
            }

            // Generate slug
            const finalSlug = q.slug || generateSlug(q.title);

            // Check slug uniqueness
            const existingQuestion = await prisma.interviewQuestion.findUnique({
                where: { slug: finalSlug },
            });

            if (existingQuestion) {
                errors.push({ index: i, error: `Question with slug "${finalSlug}" already exists` });
                continue;
            }

            // Parse tags if string
            let parsedTags = [];
            if (q.tags) {
                if (Array.isArray(q.tags)) {
                    parsedTags = q.tags;
                } else if (typeof q.tags === 'string') {
                    try {
                        parsedTags = JSON.parse(q.tags);
                    } catch {
                        parsedTags = q.tags.split(',').map(t => t.trim()).filter(Boolean);
                    }
                }
            }

            const question = await prisma.interviewQuestion.create({
                data: {
                    title: q.title,
                    slug: finalSlug,
                    answer: q.answer,
                    categoryId: q.categoryId,
                    difficulty: q.difficulty || null,
                    tags: parsedTags,
                    isPublished: q.isPublished !== false,
                    sortOrder: q.sortOrder ? parseInt(q.sortOrder) : 0,
                },
                include: {
                    category: {
                        select: {
                            id: true,
                            name: true,
                            slug: true,
                        },
                    },
                },
            });

            createdQuestions.push(question);
        } catch (error) {
            errors.push({ index: i, error: error.message });
        }
    }

    return res.status(201).json(
        new ApiResponsive(201, {
            created: createdQuestions.length,
            failed: errors.length,
            questions: createdQuestions,
            errors,
        }, `${createdQuestions.length} questions created, ${errors.length} failed`)
    );
});

/**
 * Update question (Admin)
 */
export const updateInterviewQuestion = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { title, slug, answer, categoryId, difficulty, tags, isPublished, sortOrder } = req.body;

    const existingQuestion = await prisma.interviewQuestion.findUnique({
        where: { id },
    });

    if (!existingQuestion) {
        throw new ApiError(404, 'Question not found');
    }

    // Verify category if being updated
    if (categoryId && categoryId !== existingQuestion.categoryId) {
        const category = await prisma.interviewCategory.findUnique({
            where: { id: categoryId },
        });

        if (!category) {
            throw new ApiError(404, 'Category not found');
        }
    }

    // Check slug uniqueness if being updated
    if (slug && slug !== existingQuestion.slug) {
        const slugExists = await prisma.interviewQuestion.findUnique({
            where: { slug },
        });

        if (slugExists) {
            throw new ApiError(400, 'Question with this slug already exists');
        }
    }

    // Parse tags if string
    let parsedTags = existingQuestion.tags;
    if (tags !== undefined) {
        if (Array.isArray(tags)) {
            parsedTags = tags;
        } else if (typeof tags === 'string') {
            try {
                parsedTags = JSON.parse(tags);
            } catch {
                parsedTags = tags.split(',').map(t => t.trim()).filter(Boolean);
            }
        }
    }

    const question = await prisma.interviewQuestion.update({
        where: { id },
        data: {
            title: title || existingQuestion.title,
            slug: slug || existingQuestion.slug,
            answer: answer || existingQuestion.answer,
            categoryId: categoryId || existingQuestion.categoryId,
            difficulty: difficulty !== undefined ? difficulty : existingQuestion.difficulty,
            tags: parsedTags,
            isPublished: isPublished !== undefined ? Boolean(isPublished) : existingQuestion.isPublished,
            sortOrder: sortOrder !== undefined ? parseInt(sortOrder) : existingQuestion.sortOrder,
        },
        include: {
            category: {
                select: {
                    id: true,
                    name: true,
                    slug: true,
                },
            },
        },
    });

    return res.status(200).json(
        new ApiResponsive(200, { question }, 'Question updated successfully')
    );
});

/**
 * Delete question (Admin)
 */
export const deleteInterviewQuestion = asyncHandler(async (req, res) => {
    const { id } = req.params;

    const question = await prisma.interviewQuestion.findUnique({
        where: { id },
    });

    if (!question) {
        throw new ApiError(404, 'Question not found');
    }

    await prisma.interviewQuestion.delete({
        where: { id },
    });

    return res.status(200).json(
        new ApiResponsive(200, null, 'Question deleted successfully')
    );
});

/**
 * Toggle publish status (Admin)
 */
export const togglePublishStatus = asyncHandler(async (req, res) => {
    const { id } = req.params;

    const question = await prisma.interviewQuestion.findUnique({
        where: { id },
    });

    if (!question) {
        throw new ApiError(404, 'Question not found');
    }

    const updatedQuestion = await prisma.interviewQuestion.update({
        where: { id },
        data: {
            isPublished: !question.isPublished,
        },
        include: {
            category: {
                select: {
                    id: true,
                    name: true,
                    slug: true,
                },
            },
        },
    });

    return res.status(200).json(
        new ApiResponsive(200, { question: updatedQuestion }, 'Question status updated successfully')
    );
});
