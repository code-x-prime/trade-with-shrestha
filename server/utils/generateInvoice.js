import { prisma } from "../config/db.js";
import { getPublicUrl } from "./cloudflare.js";
import { uploadToR2 } from "./cloudflare.js";
import { ApiError } from "./ApiError.js";

/**
 * Generate PDF invoice for order
 * Note: This is a placeholder. You'll need to install a PDF library like pdfkit or puppeteer
 */
export const generateInvoicePDF = async (orderId) => {
  try {
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        user: {
          select: {
            name: true,
            email: true,
            phone: true,
          },
        },
      },
    });

    if (!order) {
      throw new ApiError(404, "Order not found");
    }

    // TODO: Implement actual PDF generation using pdfkit or puppeteer
    // For now, return a placeholder structure

    const invoiceData = {
      orderNo: order.orderNo,
      date: order.createdAt,
      user: order.user,
      itemName: order.itemName,
      amount: order.amount,
      discountAmount: order.discountAmount,
      finalAmount: order.finalAmount,
      currency: order.currency,
      status: order.status,
    };

    // Placeholder: In production, use pdfkit or puppeteer to generate PDF
    // const pdfBuffer = await createPDFBuffer(invoiceData);
    // const filename = await uploadToR2({ buffer: pdfBuffer, originalname: `invoice-${order.orderNo}.pdf`, mimetype: 'application/pdf' }, 'invoices');

    // For now, return null - implement PDF generation based on your needs
    return null;
  } catch (error) {
    console.error("Invoice generation error:", error);
    throw new ApiError(500, "Failed to generate invoice");
  }
};

/**
 * Get invoice URL
 */
export const getInvoiceUrl = async (orderId) => {
  try {
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      select: { invoiceUrl: true },
    });

    if (!order || !order.invoiceUrl) {
      // Generate invoice if it doesn't exist
      const invoiceUrl = await generateInvoicePDF(orderId);
      return invoiceUrl ? getPublicUrl(invoiceUrl) : null;
    }

    return getPublicUrl(order.invoiceUrl);
  } catch (error) {
    console.error("Get invoice URL error:", error);
    throw new ApiError(500, "Failed to get invoice URL");
  }
};
