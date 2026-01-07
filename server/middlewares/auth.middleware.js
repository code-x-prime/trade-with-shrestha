// auth.middleware.js
import jwt from "jsonwebtoken";
import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { prisma } from "../config/db.js";

// Optional JWT verification - doesn't throw error if token is missing
export const optionalJWTToken = asyncHandler(async (req, res, next) => {
  try {
    const token =
      req.cookies?.accessToken ||
      req.headers?.authorization?.replace("Bearer ", "") ||
      req.query?.accessToken;

    if (!token) {
      return next(); // Continue without user
    }

    const decoded = jwt.verify(token, process.env.ACCESS_JWT_SECRET);

    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
      select: {
        id: true,
        name: true,
        email: true,
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
    });

    if (user && user.isActive) {
      req.user = user;
    }
    next();
  } catch (error) {
    // If token is invalid, just continue without user
    next();
  }
});

export const verifyJWTToken = asyncHandler(async (req, res, next) => {
  try {
    const token =
      req.cookies?.accessToken ||
      req.headers?.authorization?.replace("Bearer ", "") ||
      req.query?.accessToken;

    if (!token) {
      throw new ApiError(401, "Authentication required");
    }

    const decoded = jwt.verify(token, process.env.ACCESS_JWT_SECRET);

    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
      select: {
        id: true,
        name: true,
        email: true,
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
    });

    if (!user) {
      throw new ApiError(401, "Invalid token or user not found");
    }

    if (!user.isActive) {
      throw new ApiError(403, "User account is inactive");
    }

    req.user = user;
    next();
  } catch (error) {
    console.error("JWT Verification Error:", error);

    if (error.name === "JsonWebTokenError") {
      throw new ApiError(401, "Invalid token");
    } else if (error.name === "TokenExpiredError") {
      throw new ApiError(401, "Token expired");
    }
    throw new ApiError(500, "Authentication error", [error.message]);
  }
});

// Admin authentication middleware - checks if user has ADMIN role
export const isAdmin = asyncHandler(async (req, res, next) => {
  try {
    // First verify JWT token
    const token =
      req.cookies?.accessToken ||
      req.headers?.authorization?.replace("Bearer ", "") ||
      req.query?.accessToken;

    if (!token) {
      throw new ApiError(401, "Authentication required");
    }

    const decoded = jwt.verify(token, process.env.ACCESS_JWT_SECRET);

    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
      select: {
        id: true,
        name: true,
        email: true,
        avatar: true,
        phone: true,
        role: true,
        isActive: true,
        isVerified: true,
      },
    });

    if (!user) {
      throw new ApiError(401, "Invalid token or user not found");
    }

    if (!user.isActive) {
      throw new ApiError(403, "User account is inactive");
    }

    // Check if user is ADMIN
    if (user.role !== "ADMIN") {
      throw new ApiError(403, "Admin access required");
    }

    req.user = user;
    req.admin = user; // For compatibility
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

// Student authentication middleware - checks if user has STUDENT role
export const isStudent = asyncHandler(async (req, res, next) => {
  try {
    // First verify JWT token
    const token =
      req.cookies?.accessToken ||
      req.headers?.authorization?.replace("Bearer ", "") ||
      req.query?.accessToken;

    if (!token) {
      throw new ApiError(401, "Authentication required");
    }

    const decoded = jwt.verify(token, process.env.ACCESS_JWT_SECRET);

    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
      select: {
        id: true,
        name: true,
        email: true,
        avatar: true,
        phone: true,
        role: true,
        isActive: true,
        isVerified: true,
      },
    });

    if (!user) {
      throw new ApiError(401, "Invalid token or user not found");
    }

    if (!user.isActive) {
      throw new ApiError(403, "User account is inactive");
    }

    // Check if user is STUDENT or ADMIN (admin can access student routes too)
    if (user.role !== "STUDENT" && user.role !== "ADMIN") {
      throw new ApiError(403, "Student or Admin access required");
    }

    req.user = user;
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

// Alias for backward compatibility
export const isAuth = verifyJWTToken;
