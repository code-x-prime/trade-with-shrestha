import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import Razorpay from "razorpay";
import userRoutes from "./routes/user.routes.js";
import authRoutes from "./routes/auth.routes.js";
import uploadRoutes from "./routes/upload.routes.js";
import contactRoutes from "./routes/contact.routes.js";
import adminRoutes from "./routes/admin.routes.js";
import ebookRoutes from "./routes/ebook.routes.js";
import orderRoutes from "./routes/order.routes.js";
import couponRoutes from "./routes/coupon.routes.js";
import webinarRoutes from "./routes/webinar.routes.js";
import guidanceRoutes from "./routes/guidance.routes.js";
import courseRoutes from "./routes/course.routes.js";
import categoryRoutes from "./routes/category.routes.js";
import analyticsRoutes from "./routes/analytics.routes.js";
import certificateRoutes from "./routes/certificate.routes.js";
import reviewRoutes from "./routes/review.routes.js";
import flashSaleRoutes from "./routes/flashSale.routes.js";
import cartRoutes from "./routes/cart.routes.js";
import footerRoutes from "./routes/footer.routes.js";
import offlineBatchRoutes from "./routes/offlineBatch.routes.js";
import bundleRoutes from "./routes/bundle.routes.js";
import mediaRoutes from "./routes/media.routes.js";
import invoiceRoutes from "./routes/invoice.routes.js";
import bannerRoutes from "./routes/banner.routes.js";
import placementRoutes from "./routes/placement.routes.js";
import trainingScheduleRoutes from "./routes/trainingSchedule.routes.js";
import demoRequestRoutes from "./routes/demoRequest.routes.js";
import mockInterviewRoutes from "./routes/mockInterview.routes.js";
import expertPracticeRoutes from "./routes/expertPractice.routes.js";
import hireFromUsRoutes from "./routes/hireFromUs.routes.js";
import placementTrainingRoutes from "./routes/placementTraining.routes.js";
import {
  errorHandler,
  notFoundHandler,
} from "./middlewares/error.middleware.js";

const app = express();

// Security & Parse Middlewares
app.use(express.json({ limit: '2048mb' }));

app.use(express.urlencoded({ extended: false, limit: '2048mb' }));
app.use(cookieParser());

// CORS Configuration
const allowedOrigins = process.env.CORS_ORIGIN
  ? process.env.CORS_ORIGIN.split(",").map((origin) => origin.trim())
  : ["http://localhost:3000"];

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps or curl requests)
      if (!origin) return callback(null, true);

      if (
        allowedOrigins.indexOf(origin) !== -1 ||
        process.env.NODE_ENV === "development"
      ) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
    allowedHeaders: [
      "Content-Type",
      "Authorization",
      "Cache-Control",
      "Pragma",
      "Origin",
      "Accept",
      "X-Requested-With",
    ],
    exposedHeaders: ["Set-Cookie"],
    preflightContinue: false,
    optionsSuccessStatus: 204,
    maxAge: 86400, // 24 hours
  })
);

// Cache Control Headers
app.use((req, res, next) => {
  res.header("Cache-Control", "no-store, no-cache, must-revalidate, private");
  res.header("Pragma", "no-cache");
  res.header("Expires", "0");
  res.header("X-Content-Type-Options", "nosniff");
  res.header("X-Frame-Options", "DENY");
  res.header("X-XSS-Protection", "1; mode=block");
  res.header(
    "Strict-Transport-Security",
    "max-age=31536000; includeSubDomains"
  );
  next();
});

// Static Files
app.use(express.static("public/upload"));

// Initialize Razorpay
let razorpay;
try {
  razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET,
  });

  console.log("Razorpay Initialized Successfully");
} catch (error) {
  console.error("Razorpay Initialization Error:", error);
}

export { razorpay };

// API Routes
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/upload", uploadRoutes);
app.use("/api/contact", contactRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/ebooks", ebookRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/coupons", couponRoutes);
app.use("/api/webinars", webinarRoutes);
app.use("/api/guidance", guidanceRoutes);
app.use("/api/courses", courseRoutes);
app.use("/api/categories", categoryRoutes);
app.use("/api/analytics", analyticsRoutes);
app.use("/api/certificates", certificateRoutes);
app.use("/api/reviews", reviewRoutes);
app.use("/api/flash-sales", flashSaleRoutes);
app.use("/api/cart", cartRoutes);
app.use("/api/footer", footerRoutes);
app.use("/api/offline-batches", offlineBatchRoutes);
app.use("/api/bundles", bundleRoutes);
app.use("/api/media", mediaRoutes);
app.use("/api/invoice", invoiceRoutes);
app.use("/api/banners", bannerRoutes);
app.use("/api/placement", placementRoutes);
app.use("/api/training-schedule", trainingScheduleRoutes);
app.use("/api/demo-requests", demoRequestRoutes);
app.use("/api/mock-interview", mockInterviewRoutes);
app.use("/api/expert-practice", expertPracticeRoutes);
app.use("/api/hire-from-us", hireFromUsRoutes);
app.use("/api/placement-training", placementTrainingRoutes);

// Health check endpoint
app.get("/health", (req, res) => {
  res.status(200).json({
    status: "success",
    message: "Server is running",
    timestamp: new Date().toISOString(),
  });
});

// Error Handling Middleware
app.use(errorHandler);

// 404 Handler
app.use(notFoundHandler);

export default app;
