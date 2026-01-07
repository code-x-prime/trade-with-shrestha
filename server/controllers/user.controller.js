import { ApiError } from "../utils/ApiError.js";
import { ApiResponsive } from "../utils/ApiResponsive.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { prisma } from "../utils/prisma.js";
import bcrypt from "bcryptjs";
import { validatePassword } from "../helper/validatePassword.js";
import { uploadToR2, deleteFromR2, getPublicUrl } from "../utils/cloudflare.js";

/**
 * Get user profile
 */
export const getProfile = asyncHandler(async (req, res) => {
  const user = await prisma.user.findUnique({
    where: { id: req.user.id },
    select: {
      id: true,
      name: true,
      email: true,
      avatar: true,
      phone: true,
      role: true,
      isVerified: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  if (!user) {
    throw new ApiError(404, "User not found");
  }

  const userData = {
    ...user,
    avatarUrl: user.avatar ? getPublicUrl(user.avatar) : null,
  };

  res
    .status(200)
    .json(
      new ApiResponsive(200, { user: userData }, "Profile fetched successfully")
    );
});

/**
 * Update user profile
 */
export const updateProfile = asyncHandler(async (req, res) => {
  const { name, phone } = req.body;

  const updateData = {};
  if (name) updateData.name = name;
  if (phone !== undefined) updateData.phone = phone;

  const updatedUser = await prisma.user.update({
    where: { id: req.user.id },
    data: updateData,
    select: {
      id: true,
      name: true,
      email: true,
      avatar: true,
      phone: true,
      role: true,
      isVerified: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  const userData = {
    ...updatedUser,
    avatarUrl: updatedUser.avatar ? getPublicUrl(updatedUser.avatar) : null,
  };

  res
    .status(200)
    .json(
      new ApiResponsive(200, { user: userData }, "Profile updated successfully")
    );
});

/**
 * Upload avatar
 */
export const uploadAvatar = asyncHandler(async (req, res) => {
  if (!req.file) {
    throw new ApiError(400, "Avatar file is required");
  }

  // Get current user
  const user = await prisma.user.findUnique({
    where: { id: req.user.id },
    select: { avatar: true },
  });

  // Delete old avatar if exists
  if (user.avatar) {
    try {
      await deleteFromR2(user.avatar);
    } catch (error) {
      console.error("Error deleting old avatar:", error);
    }
  }

  // Upload new avatar
  const filename = await uploadToR2(req.file, "avatars");

  // Update user
  const updatedUser = await prisma.user.update({
    where: { id: req.user.id },
    data: { avatar: filename },
    select: {
      id: true,
      name: true,
      email: true,
      avatar: true,
      phone: true,
      role: true,
      isVerified: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  const userData = {
    ...updatedUser,
    avatarUrl: getPublicUrl(updatedUser.avatar),
  };

  res
    .status(200)
    .json(
      new ApiResponsive(200, { user: userData }, "Avatar uploaded successfully")
    );
});

/**
 * Change password
 */
export const changePassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body;

  if (!currentPassword || !newPassword) {
    throw new ApiError(400, "Current password and new password are required");
  }

  validatePassword(newPassword);

  const user = await prisma.user.findUnique({
    where: { id: req.user.id },
    select: { password: true },
  });

  if (!user.password) {
    throw new ApiError(400, "Password not set. Please use password reset.");
  }

  const isPasswordValid = await bcrypt.compare(currentPassword, user.password);

  if (!isPasswordValid) {
    throw new ApiError(400, "Current password is incorrect");
  }

  const hashedPassword = await bcrypt.hash(newPassword, 10);

  await prisma.user.update({
    where: { id: req.user.id },
    data: { password: hashedPassword },
  });

  res
    .status(200)
    .json(new ApiResponsive(200, {}, "Password changed successfully"));
});

/**
 * Delete account
 */
export const deleteAccount = asyncHandler(async (req, res) => {
  const user = await prisma.user.findUnique({
    where: { id: req.user.id },
    select: { avatar: true },
  });

  // Delete avatar if exists
  if (user.avatar) {
    try {
      await deleteFromR2(user.avatar);
    } catch (error) {
      console.error("Error deleting avatar:", error);
    }
  }

  // Delete user (cascade will handle related records)
  await prisma.user.delete({
    where: { id: req.user.id },
  });

  // Clear cookies
  res.clearCookie("accessToken");
  res.clearCookie("refreshToken");

  res
    .status(200)
    .json(new ApiResponsive(200, {}, "Account deleted successfully"));
});

/**
 * Get purchase status for multiple items (courses, bundles, webinars, mentorship, ebooks, offline-batches, indicators)
 * Accepts array of items with type and id
 */
export const getPurchaseStatus = asyncHandler(async (req, res) => {
  const { items } = req.body; // Array of { type: 'COURSE'|'BUNDLE'|'WEBINAR'|'MENTORSHIP'|'EBOOK'|'OFFLINE_BATCH'|'INDICATOR', id: string }

  if (!Array.isArray(items) || items.length === 0) {
    return res.status(200).json(
      new ApiResponsive(200, { purchaseStatus: {} }, 'Purchase status fetched')
    );
  }

  const userId = req.user.id;
  const purchaseStatus = {};

  // Group items by type for efficient querying
  const itemsByType = {};
  items.forEach(item => {
    if (!itemsByType[item.type]) {
      itemsByType[item.type] = [];
    }
    itemsByType[item.type].push(item.id);
  });

  // Check course enrollments
  if (itemsByType.COURSE && itemsByType.COURSE.length > 0) {
    const enrollments = await prisma.courseEnrollment.findMany({
      where: {
        userId,
        courseId: { in: itemsByType.COURSE },
      },
      select: { courseId: true },
    });
    enrollments.forEach(e => {
      purchaseStatus[`COURSE_${e.courseId}`] = true;
    });
  }

  // Check bundle orders and enrollments
  if (itemsByType.BUNDLE && itemsByType.BUNDLE.length > 0) {
    // Check bundle orders (paid)
    const bundleOrders = await prisma.bundleOrder.findMany({
      where: {
        userId,
        bundleId: { in: itemsByType.BUNDLE },
        paymentStatus: 'PAID',
      },
      select: { bundleId: true },
    });
    bundleOrders.forEach(bo => {
      purchaseStatus[`BUNDLE_${bo.bundleId}`] = true;
    });

    // Also check enrollments (in case order exists but enrollment was created separately)
    const bundleEnrollments = await prisma.bundleEnrollment.findMany({
      where: {
        userId,
        bundleId: { in: itemsByType.BUNDLE },
      },
      select: { bundleId: true },
    });
    bundleEnrollments.forEach(be => {
      purchaseStatus[`BUNDLE_${be.bundleId}`] = true;
    });
  }

  // Check webinar orders
  if (itemsByType.WEBINAR && itemsByType.WEBINAR.length > 0) {
    const webinarOrders = await prisma.webinarOrderItem.findMany({
      where: {
        userId,
        webinarId: { in: itemsByType.WEBINAR },
        paymentId: { not: null },
      },
      select: { webinarId: true },
    });
    webinarOrders.forEach(wo => {
      purchaseStatus[`WEBINAR_${wo.webinarId}`] = true;
    });
  }

  // Check mentorship orders
  if (itemsByType.MENTORSHIP && itemsByType.MENTORSHIP.length > 0) {
    const mentorshipOrders = await prisma.mentorshipOrder.findMany({
      where: {
        userId,
        mentorshipId: { in: itemsByType.MENTORSHIP },
        paymentStatus: 'PAID',
      },
      select: { mentorshipId: true },
    });
    mentorshipOrders.forEach(mo => {
      purchaseStatus[`MENTORSHIP_${mo.mentorshipId}`] = true;
    });
  }

  // Check ebook orders (from order items)
  if (itemsByType.EBOOK && itemsByType.EBOOK.length > 0) {
    const orders = await prisma.order.findMany({
      where: {
        userId,
        status: 'COMPLETED',
      },
      include: {
        items: {
          where: {
            ebookId: { in: itemsByType.EBOOK },
          },
          select: { ebookId: true },
        },
      },
    });
    orders.forEach(order => {
      order.items.forEach(item => {
        if (item.ebookId) {
          purchaseStatus[`EBOOK_${item.ebookId}`] = true;
        }
      });
    });
  }

  // Check offline batch orders and enrollments
  if (itemsByType.OFFLINE_BATCH && itemsByType.OFFLINE_BATCH.length > 0) {
    // Check offline batch orders (paid)
    const batchOrders = await prisma.offlineBatchOrder.findMany({
      where: {
        userId,
        batchId: { in: itemsByType.OFFLINE_BATCH },
        paymentStatus: 'PAID',
      },
      select: { batchId: true },
    });
    batchOrders.forEach(bo => {
      purchaseStatus[`OFFLINE_BATCH_${bo.batchId}`] = true;
    });

    // Also check enrollments (in case enrollment was created separately)
    const batchEnrollments = await prisma.offlineBatchEnrollment.findMany({
      where: {
        userId,
        batchId: { in: itemsByType.OFFLINE_BATCH },
        paymentStatus: 'PAID',
      },
      select: { batchId: true },
    });
    batchEnrollments.forEach(be => {
      purchaseStatus[`OFFLINE_BATCH_${be.batchId}`] = true;
    });
  }

  // Check indicator access (through subscriptions - indicators are accessed via global subscription)
  if (itemsByType.INDICATOR && itemsByType.INDICATOR.length > 0) {
    // Indicators are accessed through global subscriptions, not order items
    const activeSubscriptions = await prisma.subscription.findMany({
      where: {
        userId,
        status: 'ACTIVE',
        OR: [
          { endDate: null }, // Lifetime
          { endDate: { gte: new Date() } }, // Not expired
        ],
      },
      include: {
        plan: {
          select: {
            planType: true,
          },
        },
      },
    });

    // If user has active subscription, they have access to all indicators
    const hasActiveSubscription = activeSubscriptions.length > 0;
    if (hasActiveSubscription) {
      itemsByType.INDICATOR.forEach(indicatorId => {
        purchaseStatus[`INDICATOR_${indicatorId}`] = true;
      });
    }
  }

  // Set false for items not found
  items.forEach(item => {
    const key = `${item.type}_${item.id}`;
    if (!(key in purchaseStatus)) {
      purchaseStatus[key] = false;
    }
  });

  res.status(200).json(
    new ApiResponsive(200, { purchaseStatus }, 'Purchase status fetched successfully')
  );
});