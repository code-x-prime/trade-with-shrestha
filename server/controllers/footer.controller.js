import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiResponsive } from "../utils/ApiResponsive.js";
import { ApiError } from "../utils/ApiError.js";
import { prisma } from "../config/db.js";

/**
 * Get all active footer links (Public)
 */
export const getFooterLinks = asyncHandler(async (req, res) => {
    const links = await prisma.footerLink.findMany({
        where: {
            isActive: true,
        },
        orderBy: {
            order: "asc",
        },
    });

    return res.status(200).json(
        new ApiResponsive(200, links, "Footer links fetched successfully")
    );
});

/**
 * Get all footer links (Admin)
 */
export const getAllFooterLinks = asyncHandler(async (req, res) => {
    const links = await prisma.footerLink.findMany({
        orderBy: {
            order: "asc",
        },
    });

    return res.status(200).json(
        new ApiResponsive(200, links, "Footer links fetched successfully")
    );
});

/**
 * Create footer link (Admin)
 */
export const createFooterLink = asyncHandler(async (req, res) => {
    const { label, url, icon, color } = req.body;

    if (!label || !url) {
        throw new ApiError(400, "Label and URL are required");
    }

    // Check if we already have 6 links
    const count = await prisma.footerLink.count();
    if (count >= 6) {
        throw new ApiError(400, "Maximum 6 footer links allowed");
    }

    // Get the highest order value
    const lastLink = await prisma.footerLink.findFirst({
        orderBy: {
            order: "desc",
        },
    });

    const order = lastLink ? lastLink.order + 1 : 0;

    const link = await prisma.footerLink.create({
        data: {
            label,
            url,
            icon: icon || null,
            color: color || null,
            order,
        },
    });

    return res.status(201).json(
        new ApiResponsive(201, link, "Footer link created successfully")
    );
});

/**
 * Update footer link (Admin)
 */
export const updateFooterLink = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { label, url, icon, color, isActive, order } = req.body;

    const link = await prisma.footerLink.findUnique({
        where: { id },
    });

    if (!link) {
        throw new ApiError(404, "Footer link not found");
    }

    const updatedLink = await prisma.footerLink.update({
        where: { id },
        data: {
            ...(label && { label }),
            ...(url && { url }),
            ...(icon !== undefined && { icon }),
            ...(color !== undefined && { color }),
            ...(isActive !== undefined && { isActive }),
            ...(order !== undefined && { order }),
        },
    });

    return res.status(200).json(
        new ApiResponsive(200, updatedLink, "Footer link updated successfully")
    );
});

/**
 * Delete footer link (Admin)
 */
export const deleteFooterLink = asyncHandler(async (req, res) => {
    const { id } = req.params;

    const link = await prisma.footerLink.findUnique({
        where: { id },
    });

    if (!link) {
        throw new ApiError(404, "Footer link not found");
    }

    await prisma.footerLink.delete({
        where: { id },
    });

    return res.status(200).json(
        new ApiResponsive(200, null, "Footer link deleted successfully")
    );
});

/**
 * Reorder footer links (Admin)
 */
export const reorderFooterLinks = asyncHandler(async (req, res) => {
    const { links } = req.body; // Array of { id, order }

    if (!Array.isArray(links)) {
        throw new ApiError(400, "Links array is required");
    }

    // Update all links in a transaction
    await prisma.$transaction(
        links.map((link) =>
            prisma.footerLink.update({
                where: { id: link.id },
                data: { order: link.order },
            })
        )
    );

    const updatedLinks = await prisma.footerLink.findMany({
        orderBy: {
            order: "asc",
        },
    });

    return res.status(200).json(
        new ApiResponsive(200, updatedLinks, "Footer links reordered successfully")
    );
});

