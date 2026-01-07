// optionalAuth.middleware.js
import jwt from "jsonwebtoken";
import { asyncHandler } from "../utils/asyncHandler.js";
import { prisma } from "../config/db.js";

/**
 * Optional authentication middleware
 * Sets req.user if token is valid, but doesn't throw error if token is missing
 */
export const optionalAuth = asyncHandler(async (req, res, next) => {
  try {
    const token =
      req.cookies?.accessToken ||
      req.headers?.authorization?.replace("Bearer ", "") ||
      req.query?.accessToken;

    if (!token) {
      // No token - continue without setting req.user
      return next();
    }

    const decoded = jwt.verify(token, process.env.ACCESS_JWT_SECRET);

    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        isVerified: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (user && user.isActive) {
      req.user = user;
    }
  } catch (error) {
    // Token invalid or expired - continue without setting req.user
    // Don't throw error, just continue
  }

  next();
});

