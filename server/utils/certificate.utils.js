import { prisma } from "./prisma.js";
import { uploadToR2 } from "./cloudflare.js";
// Dynamic import to avoid crashing if pdfkit is not installed
let generateCertificatePDF = null;

async function loadPDFGenerator() {
  if (!generateCertificatePDF) {
    try {
      const pdfGenerator = await import("./pdf-generator.js");
      generateCertificatePDF = pdfGenerator.generateCertificatePDF;
    } catch (error) {
      console.error("Failed to load PDF generator:", error.message);
      throw new Error(
        "Certificate generation is not available. Please install pdfkit: npm install pdfkit"
      );
    }
  }
  return generateCertificatePDF;
}

/**
 * Generate certificate for a completed course
 */
export async function generateCertificate(userId, courseId) {
  // Check if certificate already exists
  const existing = await prisma.certificate.findFirst({
    where: {
      userId,
      courseId,
    },
  });

  if (existing) {
    return existing;
  }

  // Get user and course data
  const [user, course] = await Promise.all([
    prisma.user.findUnique({ where: { id: userId } }),
    prisma.course.findUnique({ where: { id: courseId } }),
  ]);

  if (!user || !course) {
    throw new Error("User or course not found");
  }

  // Generate certificate number
  const certificateNo = `CERT-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;

  // Generate PDF certificate
  const pdfGen = await loadPDFGenerator();
  const pdfBuffer = await pdfGen({
    userName: user.name || user.email,
    courseName: course.title,
    certificateNo,
    issuedDate: new Date().toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    }),
  });

  // Upload to R2
  const fileName = `certificates/${userId}/${courseId}/${certificateNo}.pdf`;
  const certificateUrl = await uploadToR2(pdfBuffer, "certificates", fileName);

  // Create certificate record
  const certificate = await prisma.certificate.create({
    data: {
      userId,
      courseId,
      certificateUrl,
      certificateNo,
    },
    include: {
      user: true,
      course: true,
    },
  });

  return certificate;
}

/**
 * Check if course is completed and generate certificate if needed
 */
export async function checkAndGenerateCertificate(userId, courseId, progress) {
  if (progress < 100) {
    return null;
  }

  // Check if already has certificate
  const existing = await prisma.certificate.findFirst({
    where: { userId, courseId },
  });

  if (existing) {
    return existing;
  }

  // Generate new certificate
  return await generateCertificate(userId, courseId);
}

