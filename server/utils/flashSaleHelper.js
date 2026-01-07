import { prisma } from '../config/db.js';

/**
 * Check if there's an active flash sale for a specific item
 * Returns the flash sale details if active, null otherwise
 */
export const getActiveFlashSaleForItem = async (type, referenceId) => {
    const now = new Date();

    const flashSale = await prisma.flashSale.findFirst({
        where: {
            type,
            referenceIds: { has: referenceId },
            isActive: true,
            startDate: { lte: now },
            endDate: { gte: now },
        },
    });

    return flashSale;
};

/**
 * Calculate the effective price considering flash sale
 * @param {number} originalPrice - The original price
 * @param {number|null} salePrice - The regular sale price (if any)
 * @param {object|null} flashSale - The active flash sale (if any)
 * @returns {object} { effectivePrice, originalPrice, discountPercent, hasFlashSale, flashSaleTitle }
 */
export const calculateEffectivePrice = (originalPrice, salePrice, flashSale) => {
    // Base price is salePrice if available, otherwise originalPrice
    const basePrice = salePrice && salePrice > 0 ? salePrice : originalPrice;

    if (flashSale && flashSale.discountPercent > 0) {
        const flashSalePrice = Math.round(basePrice * (1 - flashSale.discountPercent / 100));
        return {
            effectivePrice: flashSalePrice,
            displayOriginalPrice: basePrice,
            actualOriginalPrice: originalPrice,
            discountPercent: flashSale.discountPercent,
            hasFlashSale: true,
            flashSaleTitle: flashSale.title,
            flashSaleEndDate: flashSale.endDate,
        };
    }

    // No flash sale - return regular pricing
    if (salePrice && salePrice > 0 && salePrice < originalPrice) {
        const discount = Math.round(((originalPrice - salePrice) / originalPrice) * 100);
        return {
            effectivePrice: salePrice,
            displayOriginalPrice: originalPrice,
            actualOriginalPrice: originalPrice,
            discountPercent: discount,
            hasFlashSale: false,
            flashSaleTitle: null,
            flashSaleEndDate: null,
        };
    }

    return {
        effectivePrice: originalPrice,
        displayOriginalPrice: originalPrice,
        actualOriginalPrice: originalPrice,
        discountPercent: 0,
        hasFlashSale: false,
        flashSaleTitle: null,
        flashSaleEndDate: null,
    };
};

/**
 * Get pricing info for an item with flash sale consideration
 */
export const getItemPricing = async (type, referenceId, price, salePrice) => {
    const flashSale = await getActiveFlashSaleForItem(type, referenceId);
    return calculateEffectivePrice(price, salePrice, flashSale);
};

