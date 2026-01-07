import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiResponsive } from "../utils/ApiResponsive.js";
import { ApiError } from "../utils/ApiError.js";
import { prisma } from "../config/db.js";

/**
 * Get all global subscription plans (Public - active plans only)
 */
export const getGlobalPlans = asyncHandler(async (req, res) => {
    const { activeOnly = "true" } = req.query;

    const where = {};
    if (activeOnly === "true") {
        where.isActive = true;
    }

    const plans = await prisma.globalSubscriptionPlan.findMany({
        where,
        orderBy: [
            { isPopular: "desc" },
        ],
    });

    // Sort by plan type order: ONE_MONTH, QUARTER, SIX_MONTHS, ONE_YEAR, LIFETIME
    const planOrder = ["ONE_MONTH", "QUARTER", "SIX_MONTHS", "ONE_YEAR", "LIFETIME"];
    plans.sort((a, b) => {
        const indexA = planOrder.indexOf(a.planType);
        const indexB = planOrder.indexOf(b.planType);
        return indexA - indexB;
    });

    return res.status(200).json(
        new ApiResponsive(200, { plans }, "Subscription plans fetched successfully")
    );
});

/**
 * Get all global subscription plans (Admin - all plans)
 */
export const getAllPlans = asyncHandler(async (req, res) => {
    const plans = await prisma.globalSubscriptionPlan.findMany({
        orderBy: [
            { isPopular: "desc" },
        ],
    });

    // Sort by plan type order: ONE_MONTH, QUARTER, SIX_MONTHS, ONE_YEAR, LIFETIME
    const planOrder = ["ONE_MONTH", "QUARTER", "SIX_MONTHS", "ONE_YEAR", "LIFETIME"];
    plans.sort((a, b) => {
        const indexA = planOrder.indexOf(a.planType);
        const indexB = planOrder.indexOf(b.planType);
        return indexA - indexB;
    });

    return res.status(200).json(
        new ApiResponsive(200, { plans }, "All subscription plans fetched successfully")
    );
});

/**
 * Get plan by ID
 */
export const getPlanById = asyncHandler(async (req, res) => {
    const { id } = req.params;

    const plan = await prisma.globalSubscriptionPlan.findUnique({
        where: { id },
    });

    if (!plan) {
        throw new ApiError(404, "Plan not found");
    }

    return res.status(200).json(
        new ApiResponsive(200, { plan }, "Plan fetched successfully")
    );
});

/**
 * Create or update global subscription plan (Admin only)
 */
export const upsertPlan = asyncHandler(async (req, res) => {
    const { planType, price, salePrice, isActive, isPopular, features } = req.body;

    if (!planType || price === undefined) {
        throw new ApiError(400, "Plan type and price are required");
    }

    // Validate plan type
    const validPlanTypes = ["ONE_MONTH", "QUARTER", "SIX_MONTHS", "ONE_YEAR", "LIFETIME"];
    if (!validPlanTypes.includes(planType)) {
        throw new ApiError(400, "Invalid plan type");
    }

    // Check if plan with this type already exists
    const existingPlan = await prisma.globalSubscriptionPlan.findUnique({
        where: { planType },
    });

    let plan;
    if (existingPlan) {
        // Update existing plan
        plan = await prisma.globalSubscriptionPlan.update({
            where: { id: existingPlan.id },
            data: {
                price: parseFloat(price),
                salePrice: salePrice ? parseFloat(salePrice) : null,
                isActive: isActive !== undefined ? isActive : existingPlan.isActive,
                isPopular: isPopular !== undefined ? isPopular : existingPlan.isPopular,
                features: features || existingPlan.features,
            },
        });
    } else {
        // Create new plan
        plan = await prisma.globalSubscriptionPlan.create({
            data: {
                planType,
                price: parseFloat(price),
                salePrice: salePrice ? parseFloat(salePrice) : null,
                isActive: isActive !== undefined ? isActive : true,
                isPopular: isPopular !== undefined ? isPopular : false,
                features: features || [],
            },
        });
    }

    return res.status(existingPlan ? 200 : 201).json(
        new ApiResponsive(
            existingPlan ? 200 : 201,
            { plan },
            existingPlan ? "Plan updated successfully" : "Plan created successfully"
        )
    );
});

/**
 * Update plan (Admin only)
 */
export const updatePlan = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { price, salePrice, isActive, isPopular, features } = req.body;

    const plan = await prisma.globalSubscriptionPlan.findUnique({
        where: { id },
    });

    if (!plan) {
        throw new ApiError(404, "Plan not found");
    }

    const updateData = {};
    if (price !== undefined) updateData.price = parseFloat(price);
    if (salePrice !== undefined) updateData.salePrice = salePrice ? parseFloat(salePrice) : null;
    if (isActive !== undefined) updateData.isActive = isActive;
    if (isPopular !== undefined) updateData.isPopular = isPopular;
    if (features !== undefined) updateData.features = features;

    const updatedPlan = await prisma.globalSubscriptionPlan.update({
        where: { id },
        data: updateData,
    });

    return res.status(200).json(
        new ApiResponsive(200, { plan: updatedPlan }, "Plan updated successfully")
    );
});

/**
 * Delete plan (Admin only)
 */
export const deletePlan = asyncHandler(async (req, res) => {
    const { id } = req.params;

    const plan = await prisma.globalSubscriptionPlan.findUnique({
        where: { id },
    });

    if (!plan) {
        throw new ApiError(404, "Plan not found");
    }

    // Check if plan has active subscriptions
    const activeSubscriptions = await prisma.subscription.count({
        where: {
            planId: id,
            status: "ACTIVE",
        },
    });

    if (activeSubscriptions > 0) {
        throw new ApiError(400, "Cannot delete plan with active subscriptions. Deactivate it instead.");
    }

    await prisma.globalSubscriptionPlan.delete({
        where: { id },
    });

    return res.status(200).json(
        new ApiResponsive(200, {}, "Plan deleted successfully")
    );
});

