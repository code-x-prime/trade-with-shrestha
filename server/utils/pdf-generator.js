// Example PDF generator using pdfkit or similar
// You'll need to install: npm install pdfkit
// This file uses dynamic imports to avoid crashing if pdfkit is not installed

import { PassThrough } from "stream";

let PDFDocument = null;

/**
 * Lazy load PDFDocument only when needed
 */
async function getPDFDocument() {
  if (!PDFDocument) {
    try {
      const pdfkitModule = await import("pdfkit");
      PDFDocument = pdfkitModule.default || pdfkitModule;
    } catch (error) {
      throw new Error(
        "pdfkit package is not installed. Please install it with: npm install pdfkit"
      );
    }
  }
  return PDFDocument;
}

/**
 * Generate certificate PDF
 * Returns PDF buffer
 */
export async function generateCertificatePDF({
  userName,
  courseName,
  certificateNo,
  issuedDate,
}) {
  const PDFDoc = await getPDFDocument();

  return new Promise((resolve, reject) => {
    const doc = new PDFDoc({
      size: "A4",
      layout: "landscape",
      margins: { top: 50, bottom: 50, left: 50, right: 50 },
    });

    const chunks = [];
    const stream = new PassThrough();

    stream.on("data", (chunk) => chunks.push(chunk));
    stream.on("end", () => resolve(Buffer.concat(chunks)));
    stream.on("error", reject);

    doc.pipe(stream);

    // Certificate Design
    doc
      .fontSize(36)
      .font("Helvetica-Bold")
      .text("Certificate of Completion", { align: "center", y: 100 });

    doc
      .fontSize(20)
      .font("Helvetica")
      .text("This is to certify that", { align: "center", y: 180 });

    doc
      .fontSize(28)
      .font("Helvetica-Bold")
      .text(userName, { align: "center", y: 220 });

    doc
      .fontSize(18)
      .font("Helvetica")
      .text("has successfully completed the course", { align: "center", y: 280 });

    doc
      .fontSize(24)
      .font("Helvetica-Bold")
      .text(courseName, { align: "center", y: 320 });

    doc
      .fontSize(12)
      .font("Helvetica")
      .text(`Certificate No: ${certificateNo}`, { align: "center", y: 400 });

    doc
      .fontSize(12)
      .font("Helvetica")
      .text(`Issued on: ${issuedDate}`, { align: "center", y: 430 });

    // Border
    doc
      .lineWidth(3)
      .strokeColor("#2563eb")
      .rect(50, 50, 694, 494)
      .stroke();

    doc.end();
  });
}

