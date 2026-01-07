import app from "./app.js";
import dotenv from "dotenv";
import { prisma } from "./config/db.js";
import { startWebinarReminderScheduler } from "./utils/webinarReminder.js";
import { startMentorshipReminderScheduler } from "./utils/mentorshipReminder.js";
import { startGuidanceReminderScheduler } from "./utils/guidanceReminder.js";
import { startWebinarCertificateScheduler } from "./utils/webinarCertificateScheduler.js";

dotenv.config({ path: ".env" });

const PORT = process.env.PORT || 4000;

// Handle unhandled promise rejections
process.on("unhandledRejection", (reason, promise) => {
  console.error("Unhandled Rejection at:", promise, "reason:", reason);
  // Application should continue running despite unhandled promises
});

// Handle uncaught exceptions
process.on("uncaughtException", (error) => {
  console.error("Uncaught Exception:", error);
  // Give server time to handle ongoing requests before shutting down
  setTimeout(() => {
    process.exit(1);
  }, 1000);
});

// Graceful shutdown
const gracefulShutdown = async () => {
  console.log("Shutting down gracefully...");
  try {
    await prisma.$disconnect();
    console.log("Database disconnected successfully");
    process.exit(0);
  } catch (error) {
    console.error("Error during graceful shutdown:", error);
    process.exit(1);
  }
};

// Listen for termination signals
process.on("SIGTERM", gracefulShutdown);
process.on("SIGINT", gracefulShutdown);

// Connect to the database and start the server
prisma
  .$connect()
  .then(() => {
    const server = app.listen(PORT, () => {
      console.log(`Server is running on port ${PORT} 🚀`);

      if (process.env.NODE_ENV !== "test") {
        startWebinarReminderScheduler();
        startMentorshipReminderScheduler();
        startGuidanceReminderScheduler();
        startWebinarCertificateScheduler();
      }
    });

    // Set timeout to 1 hour for large file uploads (2GB)
    server.setTimeout(3600000);
  })
  .catch((error) => {
    console.error("Error connecting to the database:", error);
    process.exit(1);
  });
