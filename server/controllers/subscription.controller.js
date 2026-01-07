import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiResponsive } from "../utils/ApiResponsive.js";
import { ApiError } from "../utils/ApiError.js";
import { prisma } from "../config/db.js";
import { createRazorpayOrder, verifyRazorpaySignature } from "../utils/razorpay.js";
import { sendEmail } from "../utils/email.js";
import { getPublicUrl } from "../utils/cloudflare.js";
import {
    getSubscriptionConfirmationTemplate,
    getAdminNotificationTemplate,
    getSubscriptionStatusChangeTemplate,
    getSubscriptionRenewalReminderTemplate,
} from "../email/templates/emailTemplates.js";

/**
 * Calculate end date based on plan type
 */
const calculateEndDate = (planType, startDate) => {
    const start = new Date(startDate);
    switch (planType) {
        case "ONE_MONTH":
            return new Date(start.setMonth(start.getMonth() + 1));
        case "QUARTER":
            return new Date(start.setMonth(start.getMonth() + 3));
        case "SIX_MONTHS":
            return new Date(start.setMonth(start.getMonth() + 6));
        case "ONE_YEAR":
            return new Date(start.setFullYear(start.getFullYear() + 1));
        case "LIFETIME":
            return null; // Lifetime has no end date
        default:
            throw new ApiError(400, "Invalid plan type");
    }
};

/**
 * Create subscription order (for free plans, auto-complete; for paid, create Razorpay order)
 */
export const createSubscription = asyncHandler(async (req, res) => {
    const { planId, tradingViewUsername, couponCode } = req.body;
    const userId = req.user.id;

    if (!planId) {
        throw new ApiError(400, "Plan ID is required");
    }

    if (!tradingViewUsername || !tradingViewUsername.trim()) {
        throw new ApiError(400, "TradingView username is required to access indicators");
    }

    // Get global subscription plan
    const plan = await prisma.globalSubscriptionPlan.findUnique({
        where: { id: planId },
    });

    if (!plan) {
        throw new ApiError(400, "Plan not found");
    }

    if (!plan.isActive) {
        throw new ApiError(400, "Plan is not active");
    }

    // Check if user already has an active subscription (any active subscription gives access to all indicators)
    const existingSubscription = await prisma.subscription.findFirst({
        where: {
            userId,
            status: "ACTIVE",
            OR: [
                { endDate: null }, // Lifetime
                { endDate: { gte: new Date() } }, // Not expired
            ],
        },
    });

    if (existingSubscription) {
        throw new ApiError(400, "You already have an active subscription. Please cancel your current subscription first.");
    }

    const price = plan.salePrice || plan.price;
    let discountAmount = 0;
    let coupon = null;

    // Apply coupon if provided
    if (couponCode) {
        coupon = await prisma.coupon.findFirst({
            where: {
                code: couponCode.toUpperCase(),
                isActive: true,
                validFrom: { lte: new Date() },
                validUntil: { gte: new Date() },
                OR: [
                    { applicableTo: "ALL" },
                    { applicableTo: "SUBSCRIPTION" },
                ],
            },
        });

        if (coupon) {
            if (coupon.usageLimit && coupon.usedCount >= coupon.usageLimit) {
                throw new ApiError(400, "Coupon usage limit exceeded");
            }

            if (coupon.discountType === "PERCENTAGE") {
                discountAmount = (price * coupon.discountValue) / 100;
                if (coupon.maxDiscount) {
                    discountAmount = Math.min(discountAmount, coupon.maxDiscount);
                }
            } else {
                discountAmount = coupon.discountValue;
            }

            if (coupon.minAmount && price < coupon.minAmount) {
                throw new ApiError(400, `Minimum order amount is ₹${coupon.minAmount}`);
            }
        } else {
            throw new ApiError(400, "Invalid coupon code");
        }
    }

    const finalAmount = Math.max(0, price - discountAmount);
    const startDate = new Date();
    const endDate = calculateEndDate(plan.planType, startDate);

    // Generate order number
    const orderNumber = `SUB-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;

    // If free plan, complete subscription immediately
    if (finalAmount === 0) {
        const subscription = await prisma.subscription.create({
            data: {
                userId,
                planId,
                planType: plan.planType,
                startDate,
                endDate,
                tradingViewUsername: tradingViewUsername.trim(),
                status: "ACTIVE",
                totalAmount: price,
                discountAmount,
                finalAmount: 0,
                couponCode: couponCode || null,
            },
            include: {
                plan: true,
                user: true,
            },
        });

        // Send email notifications
        await sendSubscriptionEmails(subscription, "purchase");

        return res.status(201).json(
            new ApiResponsive(201, { subscription }, "Subscription created successfully (Free plan)")
        );
    }

    // Create Razorpay order for paid plans
    const razorpayOrder = await createRazorpayOrder(finalAmount, "INR", orderNumber);

    const subscription = await prisma.subscription.create({
        data: {
            userId,
            planId,
            planType: plan.planType,
            startDate,
            endDate,
            tradingViewUsername: tradingViewUsername.trim(),
            status: "PENDING",
            razorpayOrderId: razorpayOrder.id,
            totalAmount: price,
            discountAmount,
            finalAmount,
            couponCode: couponCode || null,
        },
        include: {
            plan: true,
            user: true,
        },
    });

    return res.status(201).json(
        new ApiResponsive(
            201,
            {
                subscription,
                razorpayOrder: {
                    id: razorpayOrder.id,
                    amount: razorpayOrder.amount,
                    currency: razorpayOrder.currency,
                    key: process.env.RAZORPAY_KEY_ID,
                },
            },
            "Subscription order created successfully"
        )
    );
});

/**
 * Verify Razorpay payment and complete subscription
 */
export const verifySubscriptionPayment = asyncHandler(async (req, res) => {
    const { razorpayOrderId, paymentId, signature } = req.body;
    const userId = req.user.id;

    if (!razorpayOrderId || !paymentId || !signature) {
        throw new ApiError(400, "Payment details are required");
    }

    // Find subscription
    const subscription = await prisma.subscription.findFirst({
        where: {
            razorpayOrderId,
            userId,
        },
        include: {
            user: true,
            plan: true,
        },
    });

    if (!subscription) {
        throw new ApiError(404, "Subscription not found");
    }

    // Verify signature
    const isValid = verifyRazorpaySignature(subscription.razorpayOrderId, paymentId, signature);
    if (!isValid) {
        throw new ApiError(400, "Invalid payment signature");
    }

    // Update subscription
    const updatedSubscription = await prisma.subscription.update({
        where: { id: subscription.id },
        data: {
            razorpayPaymentId: paymentId,
            razorpaySignature: signature,
            status: "ACTIVE",
        },
        include: {
            plan: true,
            user: true,
        },
    });

    // Create order record
    await prisma.order.create({
        data: {
            userId,
            orderNumber: `SUB-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`,
            orderType: "SUBSCRIPTION",
            totalAmount: subscription.totalAmount,
            discountAmount: subscription.discountAmount,
            finalAmount: subscription.finalAmount,
            status: "COMPLETED",
            paymentStatus: "PAID",
            razorpayOrderId: subscription.razorpayOrderId,
            razorpayPaymentId: paymentId,
            razorpaySignature: signature,
            couponCode: subscription.couponCode,
            subscriptions: {
                connect: { id: subscription.id },
            },
        },
    });

    // No need to update indicator purchase count - global subscription

    // Update coupon usage
    if (subscription.couponCode) {
        const coupon = await prisma.coupon.findFirst({
            where: { code: subscription.couponCode },
        });
        if (coupon) {
            await prisma.coupon.update({
                where: { id: coupon.id },
                data: { usedCount: { increment: 1 } },
            });
        }
    }

    // Send email notifications
    await sendSubscriptionEmails(updatedSubscription, "purchase");

    return res.status(200).json(
        new ApiResponsive(200, { subscription: updatedSubscription }, "Payment verified and subscription activated")
    );
});

/**
 * Check if user has active subscription
 */
export const checkActiveSubscription = asyncHandler(async (req, res) => {
    const userId = req.user.id;

    const activeSubscription = await prisma.subscription.findFirst({
        where: {
            userId,
            status: "ACTIVE",
            OR: [
                { endDate: null }, // Lifetime
                { endDate: { gte: new Date() } }, // Not expired
            ],
        },
        include: {
            plan: true,
        },
        orderBy: { createdAt: "desc" },
    });

    return res.status(200).json(
        new ApiResponsive(200, { hasActiveSubscription: !!activeSubscription, subscription: activeSubscription }, "Active subscription status checked")
    );
});

/**
 * Get user subscriptions
 */
export const getUserSubscriptions = asyncHandler(async (req, res) => {
    const userId = req.user.id;
    const { status } = req.query;

    const where = { userId };
    if (status) {
        where.status = status.toUpperCase();
    }

    const subscriptions = await prisma.subscription.findMany({
        where,
        include: {
            plan: true,
            user: true,
        },
        orderBy: { createdAt: "desc" },
    });

    return res.status(200).json(
        new ApiResponsive(200, { subscriptions }, "Subscriptions fetched successfully")
    );
});

/**
 * Update TradingView username (Admin only)
 */
export const updateTradingViewUsername = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { tradingViewUsername } = req.body;

    const subscription = await prisma.subscription.findUnique({
        where: { id },
        include: {
            plan: true,
            user: true,
        },
    });

    if (!subscription) {
        throw new ApiError(404, "Subscription not found");
    }

    const updatedSubscription = await prisma.subscription.update({
        where: { id },
        data: { tradingViewUsername },
        include: {
            plan: true,
            user: true,
        },
    });

    // Send email to user
    // Send email to user
    const planName = subscription.planType.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase());
    await sendEmail({
        email: subscription.user.email,
        subject: "TradingView Username Assigned - Shrestha Academy",
        html: getSubscriptionStatusChangeTemplate({
            status: 'UPDATED',
            userName: subscription.user.name,
            planName: planName,
            tradingViewUsername: tradingViewUsername,
            date: new Date()
        }),
    });

    return res.status(200).json(
        new ApiResponsive(200, { subscription: updatedSubscription }, "TradingView username updated successfully")
    );
});

/**
 * Cancel subscription
 */
export const cancelSubscription = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const userId = req.user.id;

    const subscription = await prisma.subscription.findFirst({
        where: { id, userId },
        include: {
            plan: true,
            user: true,
        },
    });

    if (!subscription) {
        throw new ApiError(404, "Subscription not found");
    }

    if (subscription.status === "CANCELLED") {
        throw new ApiError(400, "Subscription is already cancelled");
    }

    const updatedSubscription = await prisma.subscription.update({
        where: { id },
        data: {
            status: "CANCELLED",
            cancelledAt: new Date(),
        },
        include: {
            plan: true,
            user: true,
        },
    });

    // Send email to admin
    // Send email to admin
    const planName = subscription.planType.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase());
    await sendEmail({
        email: process.env.ADMIN_EMAIL || "admin@example.com",
        subject: `Subscription Cancelled - ${subscription.user.name}`,
        html: getAdminNotificationTemplate({
            type: 'subscription',
            orderNumber: 'CANCELLED',
            customerName: subscription.user.name,
            customerEmail: subscription.user.email,
            itemName: `${planName} (Cancelled)`,
            amount: subscription.finalAmount,
            additionalInfo: `Reason: User Initiated | Date: ${new Date().toLocaleDateString('en-IN')}`,
            dashboardUrl: `${process.env.CLIENT_URL || 'http://localhost:3000'}/admin/subscriptions`
        }),
    });

    // Send email to user
    await sendEmail({
        email: subscription.user.email,
        subject: `Subscription Cancelled - Shrestha Academy`,
        html: getSubscriptionStatusChangeTemplate({
            status: 'CANCELLED',
            userName: subscription.user.name,
            planName: planName,
            date: new Date(),
            refundNote: "Payment refund will be processed within 5-7 working days."
        }),
    });

    return res.status(200).json(
        new ApiResponsive(200, { subscription: updatedSubscription }, "Subscription cancelled successfully")
    );
});

/**
 * Renew subscription
 */
export const renewSubscription = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { planId, couponCode } = req.body;
    const userId = req.user.id;

    const existingSubscription = await prisma.subscription.findFirst({
        where: { id, userId },
        include: { plan: true },
    });

    if (!existingSubscription) {
        throw new ApiError(404, "Subscription not found");
    }

    // Create new subscription with same logic as createSubscription
    return createSubscription(req, res);
});

/**
 * Update subscription status (Admin only) - Enable/Disable access
 */
export const updateSubscriptionStatus = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { status } = req.body;

    if (!status || !["ACTIVE", "EXPIRED", "CANCELLED", "PENDING"].includes(status.toUpperCase())) {
        throw new ApiError(400, "Valid status is required (ACTIVE, EXPIRED, CANCELLED, PENDING)");
    }

    const subscription = await prisma.subscription.findUnique({
        where: { id },
        include: { user: true, plan: true },
    });

    if (!subscription) {
        throw new ApiError(404, "Subscription not found");
    }

    const updatedSubscription = await prisma.subscription.update({
        where: { id },
        data: {
            status: status.toUpperCase(),
            ...(status.toUpperCase() === "CANCELLED" && !subscription.cancelledAt
                ? { cancelledAt: new Date() }
                : {}),
        },
        include: { user: true, plan: true },
    });

    return res.status(200).json(
        new ApiResponsive(200, { subscription: updatedSubscription }, "Subscription status updated successfully")
    );
});

/**
 * Change subscription plan (Admin only)
 */
export const changeSubscriptionPlan = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { planId } = req.body;

    if (!planId) {
        throw new ApiError(400, "Plan ID is required");
    }

    const subscription = await prisma.subscription.findUnique({
        where: { id },
        include: { user: true, plan: true },
    });

    if (!subscription) {
        throw new ApiError(404, "Subscription not found");
    }

    const newPlan = await prisma.globalSubscriptionPlan.findUnique({
        where: { id: planId },
    });

    if (!newPlan) {
        throw new ApiError(404, "Plan not found");
    }

    // Calculate new end date based on new plan
    const startDate = subscription.startDate;
    const newEndDate = calculateEndDate(newPlan.planType, startDate);

    const updatedSubscription = await prisma.subscription.update({
        where: { id },
        data: {
            planId: newPlan.id,
            planType: newPlan.planType,
            endDate: newEndDate,
            totalAmount: newPlan.salePrice || newPlan.price,
            finalAmount: newPlan.salePrice || newPlan.price,
        },
        include: { user: true, plan: true },
    });

    return res.status(200).json(
        new ApiResponsive(200, { subscription: updatedSubscription }, "Subscription plan changed successfully")
    );
});

/**
 * Stop subscription (Admin only) - Same as cancel but admin initiated
 */
export const stopSubscription = asyncHandler(async (req, res) => {
    const { id } = req.params;

    const subscription = await prisma.subscription.findUnique({
        where: { id },
        include: { user: true, plan: true },
    });

    if (!subscription) {
        throw new ApiError(404, "Subscription not found");
    }

    if (subscription.status === "CANCELLED") {
        throw new ApiError(400, "Subscription is already cancelled");
    }

    const updatedSubscription = await prisma.subscription.update({
        where: { id },
        data: {
            status: "CANCELLED",
            cancelledAt: new Date(),
        },
        include: { user: true, plan: true },
    });

    // Send email to admin
    // Send email to admin
    const planName = subscription.planType.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase());
    await sendEmail({
        email: process.env.ADMIN_EMAIL || "admin@example.com",
        subject: `Subscription Stopped - ${subscription.user.name}`,
        html: getAdminNotificationTemplate({
            type: 'subscription',
            orderNumber: 'STOPPED',
            customerName: subscription.user.name,
            customerEmail: subscription.user.email,
            itemName: `${planName} (Stopped)`,
            amount: subscription.finalAmount,
            additionalInfo: `Stopped by Admin | Date: ${new Date().toLocaleDateString('en-IN')}`,
            dashboardUrl: `${process.env.CLIENT_URL || 'http://localhost:3000'}/admin/subscriptions`
        }),
    });

    // Send email to user
    await sendEmail({
        email: subscription.user.email,
        subject: `Subscription Stopped - Shrestha Academy`,
        html: getSubscriptionStatusChangeTemplate({
            status: 'STOPPED',
            userName: subscription.user.name,
            planName: planName,
            date: new Date(),
            tradingViewUsername: subscription.tradingViewUsername
        }),
    });

    return res.status(200).json(
        new ApiResponsive(200, { subscription: updatedSubscription }, "Subscription stopped successfully")
    );
});

/**
 * Renew subscription (Admin only)
 */
export const adminRenewSubscription = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { planId, couponCode } = req.body;

    const subscription = await prisma.subscription.findUnique({
        where: { id },
        include: { user: true, plan: true },
    });

    if (!subscription) {
        throw new ApiError(404, "Subscription not found");
    }

    const newPlanId = planId || subscription.planId;
    const plan = await prisma.globalSubscriptionPlan.findUnique({
        where: { id: newPlanId },
    });

    if (!plan) {
        throw new ApiError(404, "Plan not found");
    }

    // Calculate new dates
    const newStartDate = new Date();
    const newEndDate = calculateEndDate(plan.planType, newStartDate);

    // Calculate pricing
    let totalAmount = plan.salePrice || plan.price;
    let discountAmount = 0;
    let finalAmount = totalAmount;

    // Apply coupon if provided
    if (couponCode) {
        const coupon = await prisma.coupon.findFirst({
            where: {
                code: couponCode.toUpperCase(),
                isActive: true,
                validFrom: { lte: new Date() },
                validUntil: { gte: new Date() },
                OR: [{ applicableTo: "ALL" }, { applicableTo: "SUBSCRIPTION" }],
            },
        });

        if (coupon) {
            if (coupon.discountType === "PERCENTAGE") {
                discountAmount = (totalAmount * coupon.discountValue) / 100;
            } else {
                discountAmount = coupon.discountValue;
            }
            finalAmount = Math.max(0, totalAmount - discountAmount);
        }
    }

    const renewedSubscription = await prisma.subscription.update({
        where: { id },
        data: {
            planId: plan.id,
            planType: plan.planType,
            startDate: newStartDate,
            endDate: newEndDate,
            status: "ACTIVE",
            totalAmount,
            discountAmount,
            finalAmount,
            couponCode: couponCode || null,
            cancelledAt: null, // Reset cancellation
        },
        include: { user: true, plan: true },
    });

    // Send emails
    await sendSubscriptionEmails(renewedSubscription, "purchase");

    return res.status(200).json(
        new ApiResponsive(200, { subscription: renewedSubscription }, "Subscription renewed successfully")
    );
});

/**
 * Get all subscriptions (Admin only)
 */
export const getAllSubscriptions = asyncHandler(async (req, res) => {
    const { page = 1, limit = 50, status, indicatorId } = req.query;

    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    const where = {};
    if (status) where.status = status.toUpperCase();
    // Removed indicatorId filter - subscriptions are now global

    const [subscriptions, total] = await Promise.all([
        prisma.subscription.findMany({
            where,
            include: {
                user: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                        avatar: true,
                    },
                },
                plan: true,
            },
            orderBy: { createdAt: "desc" },
            skip,
            take: limitNum,
        }),
        prisma.subscription.count({ where }),
    ]);

    const subscriptionsWithUrls = subscriptions.map((sub) => ({
        ...sub,
        user: {
            ...sub.user,
            avatarUrl: sub.user.avatar ? getPublicUrl(sub.user.avatar) : null,
        },
    }));

    return res.status(200).json(
        new ApiResponsive(
            200,
            {
                subscriptions: subscriptionsWithUrls,
                pagination: {
                    page: pageNum,
                    limit: limitNum,
                    total,
                    totalPages: Math.ceil(total / limitNum),
                },
            },
            "Subscriptions fetched successfully"
        )
    );
});

/**
 * Send subscription emails
 */
const sendSubscriptionEmails = async (subscription, type) => {
    try {
        const planName = subscription.planType.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase());

        if (type === "purchase") {
            // Email to admin
            await sendEmail({
                email: process.env.ADMIN_EMAIL || "admin@example.com",
                subject: `New Subscription Purchase - #${subscription.id.slice(-6).toUpperCase()}`,
                html: getAdminNotificationTemplate({
                    type: 'subscription',
                    orderNumber: subscription.id.slice(-6).toUpperCase(),
                    customerName: subscription.user.name,
                    customerEmail: subscription.user.email,
                    itemName: planName,
                    amount: subscription.finalAmount,
                    additionalInfo: `TradingView ID: ${subscription.tradingViewUsername}`,
                    dashboardUrl: `${process.env.CLIENT_URL || 'http://localhost:3000'}/admin/subscriptions`
                }),
            });

            // Email to user
            await sendEmail({
                email: subscription.user.email,
                subject: `Subscription Confirmed - Shrestha Academy`,
                html: getSubscriptionConfirmationTemplate({
                    userName: subscription.user.name,
                    planName: planName,
                    amount: subscription.finalAmount,
                    startDate: new Date(subscription.startDate).toLocaleDateString('en-IN', { dateStyle: 'long' }),
                    endDate: subscription.endDate ? new Date(subscription.endDate).toLocaleDateString('en-IN', { dateStyle: 'long' }) : 'Lifetime',
                    tradingViewUsername: subscription.tradingViewUsername,
                    indicatorsUrl: 'https://in.tradingview.com/chart/'
                }),
            });
        } else if (type === "due_date") {
            // Email to admin
            await sendEmail({
                email: process.env.ADMIN_EMAIL || "admin@example.com",
                subject: `Subscription Renewal Alert - ${subscription.user.name}`,
                html: getAdminNotificationTemplate({
                    type: 'subscription',
                    orderNumber: 'RENEWAL-ALERT',
                    customerName: subscription.user.name,
                    customerEmail: subscription.user.email,
                    itemName: planName,
                    amount: 0,
                    additionalInfo: `Expires on: ${new Date(subscription.endDate).toLocaleDateString('en-IN')}`,
                    dashboardUrl: `${process.env.CLIENT_URL || 'http://localhost:3000'}/admin/subscriptions`
                }),
            });

            // Email to user
            await sendEmail({
                email: subscription.user.email,
                subject: `Renew Your Subscription - Shrestha Academy`,
                html: getSubscriptionRenewalReminderTemplate({
                    userName: subscription.user.name,
                    planName: planName,
                    endDate: subscription.endDate,
                    renewUrl: `${process.env.NEXT_PUBLIC_APP_URL || 'https://shrestha.academy'}/pricing`
                }),
            });
        }
    } catch (error) {
        console.error("Error sending subscription emails:", error);
    }
};


