import multer from "multer";
import { ApiError } from "../utils/ApiError.js";

// Configure multer for memory storage
const storage = multer.memoryStorage();

// File filter function
const fileFilter = (req, file, cb) => {
  // Define allowed file types
  const allowedMimes = [
    // Images
    "image/jpeg",
    "image/jpg",
    "image/png",
    "image/gif",
    "image/webp",
    // Videos
    "video/mp4",
    "video/mpeg",
    "video/quicktime",
    "video/x-msvideo",
    // Documents
    "application/pdf",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "application/vnd.ms-excel",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    // Archives
    "application/zip",
    "application/x-zip-compressed",
    // Trading files
    "application/octet-stream", // For .ex4, .mq4 files
  ];

  if (allowedMimes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(
      new ApiError(
        400,
        `Invalid file type. Allowed types: images, videos, PDFs, documents, and archives`
      ),
      false
    );
  }
};

// Configure multer
export const upload = multer({
  storage,
  limits: {
    fileSize: 100 * 1024 * 1024, // 100MB max file size
  },
  fileFilter,
});

// Single file upload middleware
export const uploadSingle = (fieldName = "file") => {
  return upload.single(fieldName);
};

// Multiple files upload middleware
export const uploadMultiple = (fieldName = "files", maxCount = 10) => {
  return upload.array(fieldName, maxCount);
};

// Multiple fields upload middleware
export const uploadFields = (fields) => {
  return upload.fields(fields);
};
