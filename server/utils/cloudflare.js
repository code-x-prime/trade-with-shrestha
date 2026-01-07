import {
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import s3client from "./s3client.js";
import { ApiError } from "./ApiError.js";

/**
 * Upload file to Cloudflare R2
 */
export const uploadToR2 = async (file, folder = "uploads") => {
  try {
    const { originalname, buffer, mimetype } = file;

    const timestamp = Date.now();
    const sanitizedName = originalname
      .toLowerCase()
      .replace(/[^a-z0-9.]/g, "-");

    const uploadFolder = process.env.UPLOAD_FOLDER || "e-learning";
    const filename = `${uploadFolder}/${folder}/${timestamp}-${sanitizedName}`;

    const putCommand = new PutObjectCommand({
      Bucket: process.env.R2_BUCKET_NAME,
      Key: filename,
      Body: buffer,
      // Note: R2 doesn't support ACL, files are public if bucket is public
      ContentType: mimetype || "application/octet-stream",
    });

    await s3client.send(putCommand);

    return filename;
  } catch (error) {
    console.error("R2 upload error:", error);
    throw new ApiError(500, `Failed to upload file to R2: ${error.message}`);
  }
};

/**
 * Upload buffer directly to Cloudflare R2 (for generated files like PDFs)
 * @param {Buffer} buffer - The file buffer to upload
 * @param {string} key - The full path/key for the file
 * @param {string} contentType - The MIME type of the file
 */
export const uploadBufferToR2 = async (buffer, key, contentType = "application/octet-stream") => {
  try {
    const uploadFolder = process.env.UPLOAD_FOLDER || "e-learning";
    const fullKey = key.startsWith(uploadFolder) ? key : `${uploadFolder}/${key}`;

    const putCommand = new PutObjectCommand({
      Bucket: process.env.R2_BUCKET_NAME,
      Key: fullKey,
      Body: buffer,
      ContentType: contentType,
    });

    await s3client.send(putCommand);
    console.log("R2 buffer upload success:", fullKey);

    return fullKey;
  } catch (error) {
    console.error("R2 buffer upload error:", error);
    throw new ApiError(500, "Failed to upload buffer to R2");
  }
};

/**
 * Delete file from Cloudflare R2
 */
export const deleteFromR2 = async (fileUrl) => {
  try {
    if (!fileUrl) {
      console.log("deleteFromR2: No file URL provided");
      return false;
    }

    let Key;

    // Handle different URL formats
    if (fileUrl.startsWith("http://") || fileUrl.startsWith("https://")) {
      try {
        const parsedUrl = new URL(fileUrl);
        // Remove leading slash from pathname
        Key = parsedUrl.pathname.startsWith("/") ? parsedUrl.pathname.slice(1) : parsedUrl.pathname;
      } catch (urlError) {
        console.error("Failed to parse URL:", fileUrl, urlError);
        Key = fileUrl;
      }
    } else {
      // It's a path/key directly
      Key = fileUrl.startsWith("/") ? fileUrl.slice(1) : fileUrl;
    }

    // If Key still contains the domain, extract just the path
    if (Key.includes("r2.dev/")) {
      Key = Key.split("r2.dev/")[1];
    }
    if (Key.includes(".r2.cloudflarestorage.com/")) {
      Key = Key.split(".r2.cloudflarestorage.com/")[1];
    }

    console.log("deleteFromR2: Attempting to delete Key:", Key);

    await s3client.send(
      new DeleteObjectCommand({
        Bucket: process.env.R2_BUCKET_NAME,
        Key,
      })
    );

    console.log("deleteFromR2: Successfully deleted:", Key);
    return true;
  } catch (error) {
    console.error("R2 deletion error for URL:", fileUrl);
    console.error("R2 deletion error details:", error.message || error);
    // Don't throw error, just return false - we don't want to fail the entire operation
    // if old file deletion fails
    return false;
  }
};

/**
 * Get signed URL for private file access
 */
export const getSignedUrlForR2 = async (fileUrl, expiresIn = 3600) => {
  try {
    if (!fileUrl) return null;

    let Key;
    if (fileUrl.startsWith("http")) {
      const parsedUrl = new URL(fileUrl);
      Key = parsedUrl.pathname.slice(1);
    } else {
      Key = fileUrl.startsWith("/") ? fileUrl.slice(1) : fileUrl;
    }

    const getCommand = new GetObjectCommand({
      Bucket: process.env.R2_BUCKET_NAME,
      Key,
    });

    const signedUrl = await getSignedUrl(s3client, getCommand, {
      expiresIn,
    });

    return signedUrl;
  } catch (error) {
    console.error("R2 signed URL error:", error);
    throw new ApiError(500, "Failed to generate signed URL");
  }
};

/**
 * Get public URL for file
 * Priority:
 * 1. R2_PUBLIC_URL (if set) - Use this for public development URL or custom domain
 * 2. R2_PUBLIC_DEV_URL (if set) - Alternative env var for public dev URL
 * 3. Extract from existing URL if filename is already a full URL
 */
export const getPublicUrl = (filename) => {
  if (!filename) return null;

  // If filename is already a full URL, check if it's valid
  if (filename.startsWith("http://") || filename.startsWith("https://")) {
    try {
      const url = new URL(filename);
      // If it's already a valid URL, return it as-is
      // But we should validate it's the correct R2 domain
      const r2PublicUrl = process.env.R2_PUBLIC_URL;
      if (r2PublicUrl) {
        const correctDomain = new URL(r2PublicUrl).hostname;
        const fileDomain = url.hostname;
        // If domains don't match, reconstruct with correct domain
        if (fileDomain !== correctDomain) {
          const path = url.pathname.startsWith("/") ? url.pathname.slice(1) : url.pathname;
          return `${r2PublicUrl.replace(/\/$/, '')}/${path}`;
        }
      }
      return filename;
    } catch (error) {
      // Invalid URL, treat as filename
      console.warn("Invalid URL format, treating as filename:", filename);
    }
  }

  // Extract just the path if it's a URL path
  let cleanFilename = filename;
  if (filename.includes("/")) {
    // If it looks like a URL path, extract just the path part
    if (filename.startsWith("/")) {
      cleanFilename = filename.slice(1);
    }
    // If it contains a domain, extract just the path
    if (filename.includes("r2.dev/") || filename.includes("pub-")) {
      try {
        const url = new URL(filename.startsWith("http") ? filename : `https://${filename}`);
        cleanFilename = url.pathname.startsWith("/") ? url.pathname.slice(1) : url.pathname;
      } catch (error) {
        // Not a valid URL, use as-is
      }
    }
  }

  // Priority 1: R2_PUBLIC_URL (recommended - set this in .env)
  if (process.env.R2_PUBLIC_URL) {
    const baseUrl = process.env.R2_PUBLIC_URL.replace(/\/$/, '');
    return `${baseUrl}/${cleanFilename}`;
  }

  // Priority 2: R2_PUBLIC_DEV_URL (alternative env var)
  if (process.env.R2_PUBLIC_DEV_URL) {
    const baseUrl = process.env.R2_PUBLIC_DEV_URL.replace(/\/$/, '');
    return `${baseUrl}/${cleanFilename}`;
  }

  // Fallback: If filename already contains a full URL, return it
  if (filename.startsWith("http://") || filename.startsWith("https://")) {
    return filename;
  }

  // No public URL configured
  console.warn(
    'R2_PUBLIC_URL not set in environment variables. ' +
    'Please set R2_PUBLIC_URL in your .env file with your R2 public development URL. ' +
    'Format: https://pub-67f953912205445f932ab892164f22e5.r2.dev'
  );

  return null;
};
