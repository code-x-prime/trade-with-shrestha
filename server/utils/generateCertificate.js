import { prisma } from "../config/db.js";
import { getPublicUrl } from "./cloudflare.js";
import { ApiError } from "./ApiError.js";

/**
 * Generate certificate number
 */
const generateCertificateNumber = () => {
  const prefix = "CERT";
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `${prefix}-${timestamp}-${random}`;
};

/**
 * Generate PDF certificate for course completion
 * Note: This is a placeholder. You'll need to install a PDF library like pdfkit or puppeteer
 */
export const generateCertificatePDF = async (userId, courseId) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        name: true,
        email: true,
      },
    });

    const course = await prisma.course.findUnique({
      where: { id: courseId },
      select: {
        title: true,
      },
    });

    if (!user || !course) {
      throw new ApiError(404, "User or course not found");
    }

    // Check if certificate already exists
    const existingCert = await prisma.certificate.findFirst({
      where: {
        userId,
        courseId,
      },
    });

    if (existingCert) {
      return existingCert.certificateUrl;
    }

    // Generate certificate number
    const certificateNo = generateCertificateNumber();

    // TODO: Implement actual PDF generation using pdfkit or puppeteer
    // For now, return a placeholder structure

    const certificateData = {
      certificateNo,
      userName: user.name,
      courseName: course.title,
      issuedAt: new Date(),
    };

    // Placeholder: In production, use pdfkit or puppeteer to generate PDF
    // const pdfBuffer = await createPDFBuffer(certificateData);
    // const filename = await uploadToR2({ buffer: pdfBuffer, originalname: `certificate-${certificateNo}.pdf`, mimetype: 'application/pdf' }, 'certificates');

    // For now, create certificate record without PDF
    const certificate = await prisma.certificate.create({
      data: {
        userId,
        courseId,
        certificateNo,
        certificateUrl: "", // Will be updated when PDF is generated
      },
    });

    return certificate.certificateUrl;
  } catch (error) {
    console.error("Certificate generation error:", error);
    throw new ApiError(500, "Failed to generate certificate");
  }
};

/**
 * Get certificate URL
 */
export const getCertificateUrl = async (certificateNo) => {
  try {
    const certificate = await prisma.certificate.findUnique({
      where: { certificateNo },
      select: { certificateUrl: true },
    });

    if (!certificate) {
      throw new ApiError(404, "Certificate not found");
    }

    return certificate.certificateUrl
      ? getPublicUrl(certificate.certificateUrl)
      : null;
  } catch (error) {
    console.error("Get certificate URL error:", error);
    throw new ApiError(500, "Failed to get certificate URL");
  }
};

/**
 * Verify certificate
 */
export const verifyCertificate = async (certificateNo) => {
  try {
    const certificate = await prisma.certificate.findUnique({
      where: { certificateNo },
      include: {
        user: {
          select: {
            name: true,
            email: true,
          },
        },
      },
    });

    if (!certificate) {
      return {
        valid: false,
        message: "Certificate not found",
      };
    }

    return {
      valid: true,
      certificateNo: certificate.certificateNo,
      userName: certificate.user.name,
      issuedAt: certificate.issuedAt,
    };
  } catch (error) {
    console.error("Certificate verification error:", error);
    return {
      valid: false,
      message: "Error verifying certificate",
    };
  }
};
