import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiResponsive } from "../utils/ApiResponsive.js";
import { ApiError } from "../utils/ApiError.js";
import { prisma } from "../config/db.js";
import { getPublicUrl } from "../utils/cloudflare.js";

/**
 * Get all users (Admin only)
 */
export const getUsers = asyncHandler(async (req, res) => {
    const { page = 1, limit = 50, search = "", role, isVerified, isActive } = req.query;

    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    // Build where clause
    const where = {};

    if (search) {
        where.OR = [
            { email: { contains: search, mode: "insensitive" } },
            { name: { contains: search, mode: "insensitive" } },
        ];
    }

    if (role) {
        where.role = role;
    }

    if (isVerified !== undefined) {
        where.isVerified = isVerified === "true";
    }

    if (isActive !== undefined) {
        where.isActive = isActive === "true";
    }

    // Get users with pagination
    const [users, total] = await Promise.all([
        prisma.user.findMany({
            where,
            select: {
                id: true,
                email: true,
                name: true,
                avatar: true,
                phone: true,
                role: true,
                isVerified: true,
                isActive: true,
                authProvider: true,
                createdAt: true,
                updatedAt: true,
                lastLoginAt: true,
            },
            orderBy: {
                createdAt: "desc",
            },
            skip,
            take: limitNum,
        }),
        prisma.user.count({ where }),
    ]);

    // Add avatarUrl to each user
    const usersWithAvatar = users.map((user) => ({
        ...user,
        avatarUrl: user.avatar ? getPublicUrl(user.avatar) : null,
    }));

    return res.status(200).json(
        new ApiResponsive(
            200,
            {
                users: usersWithAvatar,
                pagination: {
                    page: pageNum,
                    limit: limitNum,
                    total,
                    totalPages: Math.ceil(total / limitNum),
                },
            },
            "Users fetched successfully"
        )
    );
});

/**
 * Update user verification status (Admin only)
 */
export const updateUserVerification = asyncHandler(async (req, res) => {
    const { userId } = req.params;
    const { isVerified } = req.body;

    if (typeof isVerified !== "boolean") {
        throw new ApiError(400, "isVerified must be a boolean");
    }

    const user = await prisma.user.findUnique({
        where: { id: userId },
        select: {
            id: true,
            email: true,
            name: true,
            avatar: true,
            phone: true,
            role: true,
            isVerified: true,
            isActive: true,
            authProvider: true,
            createdAt: true,
            updatedAt: true,
        },
    });

    if (!user) {
        throw new ApiError(404, "User not found");
    }

    // Update verification status
    const updatedUser = await prisma.user.update({
        where: { id: userId },
        data: { isVerified },
        select: {
            id: true,
            email: true,
            name: true,
            avatar: true,
            phone: true,
            role: true,
            isVerified: true,
            isActive: true,
            authProvider: true,
            createdAt: true,
            updatedAt: true,
        },
    });

    const userWithAvatar = {
        ...updatedUser,
        avatarUrl: updatedUser.avatar ? getPublicUrl(updatedUser.avatar) : null,
    };

    return res.status(200).json(
        new ApiResponsive(
            200,
            { user: userWithAvatar },
            `User ${isVerified ? "verified" : "unverified"} successfully`
        )
    );
});

/**
 * Update user active status (Admin only)
 */
export const updateUserActiveStatus = asyncHandler(async (req, res) => {
    const { userId } = req.params;
    const { isActive } = req.body;

    if (typeof isActive !== "boolean") {
        throw new ApiError(400, "isActive must be a boolean");
    }

    const user = await prisma.user.findUnique({
        where: { id: userId },
    });

    if (!user) {
        throw new ApiError(404, "User not found");
    }

    // Prevent admin from deactivating themselves
    if (user.id === req.user.id && !isActive) {
        throw new ApiError(400, "You cannot deactivate your own account");
    }

    const updatedUser = await prisma.user.update({
        where: { id: userId },
        data: { isActive },
        select: {
            id: true,
            email: true,
            name: true,
            avatar: true,
            phone: true,
            role: true,
            isVerified: true,
            isActive: true,
            authProvider: true,
            createdAt: true,
            updatedAt: true,
        },
    });

    const userWithAvatar = {
        ...updatedUser,
        avatarUrl: updatedUser.avatar ? getPublicUrl(updatedUser.avatar) : null,
    };

    return res.status(200).json(
        new ApiResponsive(
            200,
            { user: userWithAvatar },
            `User ${isActive ? "activated" : "deactivated"} successfully`
        )
    );
});

