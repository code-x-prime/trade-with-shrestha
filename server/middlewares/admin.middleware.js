import jwt from "jsonwebtoken";
import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { prisma } from "../config/db.js";

// Verify admin JWT token - uses User model with ADMIN role
export const verifyAdminJWT = asyncHandler(async (req, res, next) => {
    try {
        const token =
            req.cookies?.accessToken ||
            req.headers?.authorization?.replace("Bearer ", "") ||
            req.query?.accessToken;

        if (!token) {
            throw new ApiError(401, "Admin authentication required");
        }

        const decoded = jwt.verify(token, process.env.ACCESS_JWT_SECRET);

        const admin = await prisma.user.findUnique({
            where: { id: decoded.id },
            select: {
                id: true,
                email: true,
                name: true,
                role: true,
                isActive: true,
                isVerified: true,
                avatar: true,
            },
        });

        if (!admin) {
            throw new ApiError(401, "Invalid token or admin not found");
        }

        if (!admin.isActive) {
            throw new ApiError(403, "Your account has been deactivated");
        }

        if (admin.role !== "ADMIN") {
            throw new ApiError(403, "Admin access required");
        }

        // Attach admin data to request
        req.admin = {
            id: admin.id,
            email: admin.email,
            name: admin.name,
            role: admin.role,
        };
        req.user = admin; // Also set as user for compatibility

        next();
    } catch (error) {
        if (error.name === "JsonWebTokenError") {
            throw new ApiError(401, "Invalid token");
        } else if (error.name === "TokenExpiredError") {
            throw new ApiError(401, "Token expired");
        }
        throw error;
    }
});

// Check if admin has specific permission (simplified - can be extended later)
export const hasPermission = (resource, action) => {
    return asyncHandler(async (req, res, next) => {
        // For now, all admins have all permissions
        // Can be extended later with a permissions table
        if (req.admin && req.admin.role === "ADMIN") {
            return next();
        }
        throw new ApiError(403, "Insufficient permissions");
    });
};

// Check if admin has one of the specified roles
export const hasRole = (roles) => {
    return asyncHandler(async (req, res, next) => {
        if (!Array.isArray(roles)) {
            roles = [roles];
        }

        if (!req.admin || !roles.includes(req.admin.role)) {
            throw new ApiError(403, "Insufficient role permissions");
        }

        next();
    });
};
