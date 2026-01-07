import { DeleteObjectCommand } from "@aws-sdk/client-s3";
import s3client from "./s3client.js";

export const deleteFromS3 = async (fileUrl) => {
  try {
    let Key;

    // Check if fileUrl is a full URL
    if (fileUrl && fileUrl.startsWith("http")) {
      const parsedUrl = new URL(fileUrl);
      Key = parsedUrl.pathname.slice(1);
    } else if (fileUrl) {
      Key = fileUrl.startsWith("/") ? fileUrl.slice(1) : fileUrl;
    } else {
      return; // No file URL to delete
    }

    await s3client.send(
      new DeleteObjectCommand({
        Bucket: process.env.R2_BUCKET_NAME,
        Key,
      })
    );

    console.log(`Successfully deleted file: ${Key}`);
  } catch (error) {
    console.error("S3 deletion error:", error);
    throw error;
  }
};

export const getFileUrl = (filename) => {
  if (!filename) return null;

  // If custom domain/CDN is configured, use it
  if (process.env.R2_PUBLIC_URL) {
    return `${process.env.R2_PUBLIC_URL}/${filename}`;
  }

  // Default R2 public URL format
  if (process.env.R2_ACCOUNT_ID && process.env.R2_BUCKET_NAME) {
    return `https://${process.env.R2_BUCKET_NAME}.${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com/${filename}`;
  }

  // Fallback: Use custom domain if bucket has one configured
  return `https://${process.env.R2_BUCKET_NAME}.r2.dev/${filename}`;
};
