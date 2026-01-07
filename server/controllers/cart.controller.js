import { prisma } from '../config/db.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiError } from '../utils/ApiError.js';
import { ApiResponsive } from '../utils/ApiResponsive.js';

/**
 * Get user's cart
 */
export const getCart = asyncHandler(async (req, res) => {
    const userId = req.user.id;

    const cartItems = await prisma.cartItem.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
    });

    // Group by item type
    const cart = {
        EBOOK: [],
        WEBINAR: [],
        GUIDANCE: [],
        MENTORSHIP: [],
        COURSE: [],
        OFFLINE_BATCH: [],
        BUNDLE: [],
    };

    cartItems.forEach(item => {
        if (cart[item.itemType]) {
            cart[item.itemType].push(item.itemId);
        }
    });

    return res.status(200).json(
        new ApiResponsive(200, { cart }, 'Cart fetched successfully')
    );
});

/**
 * Add item to cart
 */
export const addToCart = asyncHandler(async (req, res) => {
    const userId = req.user.id;
    const { itemType, itemId } = req.body;

    if (!itemType || !itemId) {
        throw new ApiError(400, 'itemType and itemId are required');
    }

    const validTypes = ['EBOOK', 'WEBINAR', 'GUIDANCE', 'MENTORSHIP', 'COURSE', 'BUNDLE', 'OFFLINE_BATCH'];
    if (!validTypes.includes(itemType)) {
        throw new ApiError(400, 'Invalid itemType');
    }

    // Check if already in cart
    const existing = await prisma.cartItem.findUnique({
        where: {
            userId_itemType_itemId: {
                userId,
                itemType,
                itemId,
            },
        },
    });

    if (existing) {
        return res.status(200).json(
            new ApiResponsive(200, { cartItem: existing }, 'Item already in cart')
        );
    }

    const cartItem = await prisma.cartItem.create({
        data: {
            userId,
            itemType,
            itemId,
        },
    });

    return res.status(201).json(
        new ApiResponsive(201, { cartItem }, 'Item added to cart')
    );
});

/**
 * Remove item from cart
 */
export const removeFromCart = asyncHandler(async (req, res) => {
    const userId = req.user.id;
    const { itemType, itemId } = req.body;

    if (!itemType || !itemId) {
        throw new ApiError(400, 'itemType and itemId are required');
    }

    await prisma.cartItem.deleteMany({
        where: {
            userId,
            itemType,
            itemId,
        },
    });

    return res.status(200).json(
        new ApiResponsive(200, null, 'Item removed from cart')
    );
});

/**
 * Clear cart
 */
export const clearCart = asyncHandler(async (req, res) => {
    const userId = req.user.id;

    await prisma.cartItem.deleteMany({
        where: { userId },
    });

    return res.status(200).json(
        new ApiResponsive(200, null, 'Cart cleared')
    );
});

/**
 * Sync cart (replace entire cart)
 */
export const syncCart = asyncHandler(async (req, res) => {
    const userId = req.user.id;
    const { cart } = req.body;

    if (!cart || typeof cart !== 'object') {
        throw new ApiError(400, 'Cart object is required');
    }

    // Clear existing cart
    await prisma.cartItem.deleteMany({
        where: { userId },
    });

    // Add new items
    const itemsToAdd = [];
    const validTypes = ['EBOOK', 'WEBINAR', 'GUIDANCE', 'MENTORSHIP', 'COURSE', 'BUNDLE', 'OFFLINE_BATCH'];

    for (const [itemType, itemIds] of Object.entries(cart)) {
        if (validTypes.includes(itemType) && Array.isArray(itemIds)) {
            for (const itemId of itemIds) {
                if (itemId && typeof itemId === 'string') {
                    itemsToAdd.push({
                        userId,
                        itemType,
                        itemId,
                    });
                }
            }
        }
    }

    if (itemsToAdd.length > 0) {
        await prisma.cartItem.createMany({
            data: itemsToAdd,
            skipDuplicates: true,
        });
    }

    const cartItems = await prisma.cartItem.findMany({
        where: { userId },
    });

    return res.status(200).json(
        new ApiResponsive(200, { cartItems }, 'Cart synced successfully')
    );
});

