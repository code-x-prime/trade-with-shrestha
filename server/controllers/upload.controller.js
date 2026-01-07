import { ApiError } from "../utils/ApiError.js";
import { ApiResponsive } from "../utils/ApiResponsive.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import {
  uploadToR2,
  deleteFromR2,
  getPublicUrl,
  getSignedUrlForR2,
} from "../utils/cloudflare.js";

/**
 * Upload to R2 (images, videos, PDFs, files)
 */
export const uploadToR2Controller = asyncHandler(async (req, res) => {
  if (!req.file) {
    throw new ApiError(400, "File is required");
  }

  const { folder = "uploads" } = req.body;

  const filename = await uploadToR2(req.file, folder);
  const publicUrl = getPublicUrl(filename);

  if (!publicUrl) {
    console.warn(
      "R2_PUBLIC_URL not set, returning filename only. Please set R2_PUBLIC_URL in .env"
    );
  }

  res.status(200).json(
    new ApiResponsive(
      200,
      {
        filename,
        url: publicUrl || filename, // Fallback to filename if publicUrl is null
      },
      "File uploaded successfully"
    )
  );
});

/**
 * Delete from R2
 */
export const deleteFromR2Controller = asyncHandler(async (req, res) => {
  const { fileUrl } = req.body;

  if (!fileUrl) {
    throw new ApiError(400, "File URL is required");
  }

  await deleteFromR2(fileUrl);

  res.status(200).json(new ApiResponsive(200, {}, "File deleted successfully"));
});

/**
 * Get signed URL
 */
export const getSignedUrl = asyncHandler(async (req, res) => {
  const { fileUrl, expiresIn = 3600 } = req.query;

  if (!fileUrl) {
    throw new ApiError(400, "File URL is required");
  }

  const signedUrl = await getSignedUrlForR2(fileUrl, parseInt(expiresIn));

  res.status(200).json(
    new ApiResponsive(
      200,
      {
        signedUrl,
        expiresIn: parseInt(expiresIn),
      },
      "Signed URL generated successfully"
    )
  );
});
