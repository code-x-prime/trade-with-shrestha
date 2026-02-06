import { prisma } from "../config/db.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponsive } from "../utils/ApiResponsive.js";
import { getPublicUrl } from "../utils/cloudflare.js";

function extractPathFromUrl(url) {
  if (!url || (!url.startsWith("http://") && !url.startsWith("https://"))) return url;
  try {
    const parts = url.split("/");
    const idx = parts.findIndex((p) => p === "e-learning" || p === "uploads");
    if (idx !== -1) return parts.slice(idx).join("/");
  } catch (_) {}
  return url;
}

/**
 * Get active banners for homepage (public)
 */
export const getActiveBanners = asyncHandler(async (req, res) => {
  const banners = await prisma.banner.findMany({
    where: { isActive: true },
    orderBy: { sortOrder: "asc" },
  });
  const withUrls = banners.map((b) => ({
    ...b,
    imageUrl: b.imageUrl ? getPublicUrl(b.imageUrl) : null,
    imageUrlMobile: b.imageUrlMobile ? getPublicUrl(b.imageUrlMobile) : null,
  }));
  return res.status(200).json(
    new ApiResponsive(200, withUrls, "Banners fetched")
  );
});

/**
 * Get all banners (admin)
 */
export const getAllBanners = asyncHandler(async (req, res) => {
  const banners = await prisma.banner.findMany({
    orderBy: { sortOrder: "asc" },
  });
  const withUrls = banners.map((b) => ({
    ...b,
    imageUrl: b.imageUrl ? getPublicUrl(b.imageUrl) : null,
    imageUrlMobile: b.imageUrlMobile ? getPublicUrl(b.imageUrlMobile) : null,
  }));
  return res.status(200).json(
    new ApiResponsive(200, withUrls, "Banners fetched")
  );
});

/**
 * Create banner (admin)
 */
export const createBanner = asyncHandler(async (req, res) => {
  const { title, imageUrl, imageUrlMobile, link, sortOrder, isActive } = req.body;
  const last = await prisma.banner.findFirst({
    orderBy: { sortOrder: "desc" },
    select: { sortOrder: true },
  });
  const order = sortOrder !== undefined ? Number(sortOrder) : (last ? last.sortOrder + 1 : 0);
  const banner = await prisma.banner.create({
    data: {
      title: title || null,
      imageUrl: extractPathFromUrl(imageUrl) || null,
      imageUrlMobile: extractPathFromUrl(imageUrlMobile) || null,
      link: link || null,
      sortOrder: order,
      isActive: isActive !== false,
    },
  });
  const imageUrlPublic = banner.imageUrl ? getPublicUrl(banner.imageUrl) : null;
  const imageUrlMobilePublic = banner.imageUrlMobile ? getPublicUrl(banner.imageUrlMobile) : null;
  return res.status(201).json(
    new ApiResponsive(201, { ...banner, imageUrl: imageUrlPublic, imageUrlMobile: imageUrlMobilePublic }, "Banner created")
  );
});

/**
 * Update banner (admin)
 */
export const updateBanner = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { title, imageUrl, imageUrlMobile, link, sortOrder, isActive } = req.body;
  const data = {};
  if (title !== undefined) data.title = title;
  if (imageUrl !== undefined) data.imageUrl = extractPathFromUrl(imageUrl) || null;
  if (imageUrlMobile !== undefined) data.imageUrlMobile = extractPathFromUrl(imageUrlMobile) || null;
  if (link !== undefined) data.link = link || null;
  if (sortOrder !== undefined) data.sortOrder = Number(sortOrder);
  if (isActive !== undefined) data.isActive = Boolean(isActive);
  const banner = await prisma.banner.update({
    where: { id },
    data,
  });
  const imageUrlPublic = banner.imageUrl ? getPublicUrl(banner.imageUrl) : null;
  const imageUrlMobilePublic = banner.imageUrlMobile ? getPublicUrl(banner.imageUrlMobile) : null;
  return res.status(200).json(
    new ApiResponsive(200, { ...banner, imageUrl: imageUrlPublic, imageUrlMobile: imageUrlMobilePublic }, "Banner updated")
  );
});

/**
 * Delete banner (admin)
 */
export const deleteBanner = asyncHandler(async (req, res) => {
  const { id } = req.params;
  await prisma.banner.delete({ where: { id } });
  return res.status(200).json(
    new ApiResponsive(200, null, "Banner deleted")
  );
});
