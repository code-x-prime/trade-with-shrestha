import { prisma } from "../config/db.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponsive } from "../utils/ApiResponsive.js";
import { getPublicUrl } from "../utils/cloudflare.js";

/**
 * Get invoice settings (single row; create default if none)
 */
export const getInvoiceSettings = asyncHandler(async (req, res) => {
  let settings = await prisma.invoiceSettings.findFirst({
    orderBy: { createdAt: "asc" },
  });
  if (!settings) {
    settings = await prisma.invoiceSettings.create({
      data: {
        companyName: "Your Company Name",
        address: "",
        city: "",
        state: "",
        pincode: "",
        gstNumber: "",
        gstRateCourse: 18,
        gstRateNonCourse: 0,
        phone: "",
        email: "",
        website: "",
        bankName: "",
        bankAccount: "",
        ifscCode: "",
        invoicePrefix: "INV/",
        terms: "",
        footerText: "",
      },
    });
  }
  const logoUrl = settings.logo ? getPublicUrl(settings.logo) : null;
  const stampUrl = settings.stamp ? getPublicUrl(settings.stamp) : null;
  let taxPresets = [];
  if (settings.taxPresets) {
    try {
      taxPresets = JSON.parse(settings.taxPresets);
      if (!Array.isArray(taxPresets)) taxPresets = [];
    } catch (_) {}
  }
  return res.status(200).json(
    new ApiResponsive(200, { ...settings, logoUrl, stampUrl, taxPresets }, "Invoice settings fetched")
  );
});

/**
 * Update invoice settings (admin)
 */
export const updateInvoiceSettings = asyncHandler(async (req, res) => {
  const {
    companyName,
    logo,
    stamp,
    address,
    city,
    state,
    pincode,
    gstNumber,
    gstRateCourse,
    gstRateNonCourse,
    phone,
    email,
    website,
    bankName,
    bankAccount,
    ifscCode,
    invoicePrefix,
    taxPresets,
    terms,
    footerText,
  } = req.body;

  const normalizePath = (urlOrPath) => {
    if (!urlOrPath) return null;
    if (urlOrPath.startsWith("http://") || urlOrPath.startsWith("https://")) {
      try {
        const parts = urlOrPath.split("/");
        const idx = parts.findIndex((p) => p === "e-learning" || p === "uploads");
        if (idx !== -1) return parts.slice(idx).join("/");
      } catch (_) {}
    }
    return urlOrPath;
  };
  const logoPath = normalizePath(logo);
  const stampPath = normalizePath(stamp);

  let settings = await prisma.invoiceSettings.findFirst({
    orderBy: { createdAt: "asc" },
  });
  if (!settings) {
    settings = await prisma.invoiceSettings.create({
      data: {
        companyName: companyName || "",
        logo: logoPath || null,
        stamp: stampPath || null,
        address: address || "",
        city: city || "",
        state: state || "",
        pincode: pincode || "",
        gstNumber: gstNumber || "",
        gstRateCourse: gstRateCourse != null && gstRateCourse !== "" ? Number(gstRateCourse) : null,
        gstRateNonCourse: gstRateNonCourse != null && gstRateNonCourse !== "" ? Number(gstRateNonCourse) : null,
        phone: phone || "",
        email: email || "",
        website: website || "",
        bankName: bankName || "",
        bankAccount: bankAccount || "",
        ifscCode: ifscCode || "",
        invoicePrefix: invoicePrefix || null,
        taxPresets: Array.isArray(taxPresets) ? JSON.stringify(taxPresets) : (typeof taxPresets === "string" ? taxPresets : null),
        terms: terms || "",
        footerText: footerText || "",
      },
    });
  } else {
    const updateData = {
      ...(companyName !== undefined && { companyName }),
      ...(logoPath !== undefined && { logo: logoPath || null }),
      ...(stampPath !== undefined && { stamp: stampPath || null }),
      ...(address !== undefined && { address }),
      ...(city !== undefined && { city }),
      ...(state !== undefined && { state }),
      ...(pincode !== undefined && { pincode }),
      ...(gstNumber !== undefined && { gstNumber }),
      ...(gstRateCourse !== undefined && { gstRateCourse: gstRateCourse === "" || gstRateCourse == null ? null : Number(gstRateCourse) }),
      ...(gstRateNonCourse !== undefined && { gstRateNonCourse: gstRateNonCourse === "" || gstRateNonCourse == null ? null : Number(gstRateNonCourse) }),
      ...(phone !== undefined && { phone }),
      ...(email !== undefined && { email }),
      ...(website !== undefined && { website }),
      ...(bankName !== undefined && { bankName }),
      ...(bankAccount !== undefined && { bankAccount }),
      ...(ifscCode !== undefined && { ifscCode }),
      ...(invoicePrefix !== undefined && { invoicePrefix: invoicePrefix || null }),
      ...(terms !== undefined && { terms }),
      ...(footerText !== undefined && { footerText }),
    };
    if (taxPresets !== undefined) {
      updateData.taxPresets = Array.isArray(taxPresets) ? JSON.stringify(taxPresets) : (typeof taxPresets === "string" ? taxPresets : null);
    }
    settings = await prisma.invoiceSettings.update({
      where: { id: settings.id },
      data: updateData,
    });
  }
  const logoUrl = settings.logo ? getPublicUrl(settings.logo) : null;
  const stampUrl = settings.stamp ? getPublicUrl(settings.stamp) : null;
  return res.status(200).json(
    new ApiResponsive(200, { ...settings, logoUrl, stampUrl }, "Invoice settings updated")
  );
});

/**
 * Get order details for invoice (admin) - by orderId
 */
export const getOrderForInvoice = asyncHandler(async (req, res) => {
  const { orderId } = req.params;
  if (!orderId) throw new ApiError(400, "Order ID required");

  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
        },
      },
      items: {
        include: {
          ebook: {
            select: {
              id: true,
              title: true,
              slug: true,
              price: true,
              salePrice: true,
            },
          },
        },
      },
      courseOrders: {
        include: {
          course: {
            select: {
              id: true,
              title: true,
              slug: true,
              price: true,
              salePrice: true,
            },
          },
        },
      },
      bundleOrders: {
        include: {
          bundle: {
            select: {
              id: true,
              title: true,
              slug: true,
              price: true,
              salePrice: true,
            },
          },
        },
      },
      offlineBatchOrders: {
        include: {
          batch: {
            select: {
              id: true,
              title: true,
              slug: true,
              price: true,
              salePrice: true,
              city: true,
              startDate: true,
            },
          },
        },
      },
    },
  });

  if (!order) throw new ApiError(404, "Order not found");

  // Build line items for invoice based on orderType
  const lineItems = [];
  if (order.orderType === "EBOOK" && order.items?.length) {
    order.items.forEach((item) => {
      lineItems.push({
        description: item.ebook?.title || "E-Book",
        quantity: 1,
        unitPrice: item.salePrice ?? item.price ?? 0,
        amount: item.salePrice ?? item.price ?? 0,
      });
    });
  } else if (order.orderType === "COURSE" && order.courseOrders?.length) {
    order.courseOrders.forEach((co) => {
      const price = co.amountPaid ?? co.course?.salePrice ?? co.course?.price ?? 0;
      lineItems.push({
        description: co.course?.title || "Course",
        quantity: 1,
        unitPrice: price,
        amount: price,
      });
    });
  } else if (order.orderType === "BUNDLE" && order.bundleOrders?.length) {
    order.bundleOrders.forEach((bo) => {
      const price = bo.amountPaid ?? bo.bundle?.salePrice ?? bo.bundle?.price ?? 0;
      lineItems.push({
        description: bo.bundle?.title || "Bundle",
        quantity: 1,
        unitPrice: price,
        amount: price,
      });
    });
  } else if (order.orderType === "OFFLINE_BATCH" && order.offlineBatchOrders?.length) {
    order.offlineBatchOrders.forEach((obo) => {
      const price = obo.amountPaid ?? obo.batch?.salePrice ?? obo.batch?.price ?? 0;
      lineItems.push({
        description: obo.batch?.title || "Offline Batch",
        quantity: 1,
        unitPrice: price,
        amount: price,
      });
    });
  } else if (order.orderType === "WEBINAR") {
    const webinarOrders = await prisma.webinarOrderItem.findMany({
      where: { paymentId: order.id },
      include: {
        webinar: {
          select: { id: true, title: true, slug: true, price: true, salePrice: true },
        },
      },
    });
    webinarOrders.forEach((wo) => {
      const price = wo.amountPaid ?? wo.webinar?.salePrice ?? wo.webinar?.price ?? 0;
      lineItems.push({
        description: wo.webinar?.title || "Webinar",
        quantity: 1,
        unitPrice: price,
        amount: price,
      });
    });
  } else if (order.orderType === "GUIDANCE") {
    const guidanceOrders = await prisma.guidanceOrder.findMany({
      where: { paymentId: order.id },
      include: {
        guidance: { select: { id: true, title: true, price: true } },
        slot: { select: { date: true, startTime: true, endTime: true } },
      },
    });
    guidanceOrders.forEach((go) => {
      const price = go.amountPaid ?? go.guidance?.price ?? 0;
      lineItems.push({
        description: `${go.guidance?.title || "1:1 Guidance"} - ${go.slot ? new Date(go.slot.date).toLocaleDateString() : ""} ${go.slot?.startTime || ""}`,
        quantity: 1,
        unitPrice: price,
        amount: price,
      });
    });
  }

  // If no line items from relations, use order totals as single line
  if (lineItems.length === 0) {
    lineItems.push({
      description: order.orderType.replace(/_/g, " ") + " Order",
      quantity: 1,
      unitPrice: order.finalAmount,
      amount: order.finalAmount,
    });
  }

  let settings = await prisma.invoiceSettings.findFirst({
    orderBy: { createdAt: "asc" },
  });
  if (!settings) {
    settings = await prisma.invoiceSettings.create({
      data: { companyName: "Company", address: "", gstNumber: "" },
    });
  }
  const logoUrl = settings.logo ? getPublicUrl(settings.logo) : null;
  const stampUrl = settings.stamp ? getPublicUrl(settings.stamp) : null;

  return res.status(200).json(
    new ApiResponsive(200, {
      order: {
        id: order.id,
        orderNumber: order.orderNumber,
        orderType: order.orderType,
        createdAt: order.createdAt,
        totalAmount: order.totalAmount,
        discountAmount: order.discountAmount,
        finalAmount: order.finalAmount,
        couponCode: order.couponCode,
        status: order.status,
        paymentStatus: order.paymentStatus,
        user: order.user,
      },
      lineItems,
      settings: { ...settings, logoUrl, stampUrl },
    }, "Order invoice data fetched")
  );
});

// ─── Manual invoices (kisi bhi cheez ke liye: course, ebook, office, service) ───
function nextManualInvoiceNumber() {
  const y = new Date().getFullYear();
  const m = String(new Date().getMonth() + 1).padStart(2, "0");
  return `INV/MAN-${y}${m}-`;
}

export const listManualInvoices = asyncHandler(async (req, res) => {
  const list = await prisma.manualInvoice.findMany({
    orderBy: { invoiceDate: "desc" },
  });
  return res.status(200).json(new ApiResponsive(200, list, "Manual invoices fetched"));
});

export const createManualInvoice = asyncHandler(async (req, res) => {
  const { billToName, billToEmail, billToPhone, billToAddress, invoiceDate, dueDate, items, discount, notes, status } = req.body;
  if (!billToName || !items || !Array.isArray(items) || items.length === 0) {
    throw new ApiError(400, "Bill to name and at least one item required");
  }
  const prefix = nextManualInvoiceNumber();
  const count = await prisma.manualInvoice.count({
    where: { invoiceNumber: { startsWith: prefix } },
  });
  const invoiceNumber = prefix + String(count + 1).padStart(3, "0");

  let subtotal = 0;
  let taxTotal = 0;
  const parsedItems = items.map((it) => {
    const qty = Number(it.quantity) || 1;
    const unitPrice = Number(it.unitPrice) || 0;
    const taxRate = Number(it.taxRate) || 0;
    const amount = qty * unitPrice;
    const tax = Math.round((amount * taxRate) / 100 * 100) / 100;
    subtotal += amount;
    taxTotal += tax;
    return {
      description: it.description || "Item",
      quantity: qty,
      unitPrice,
      taxLabel: it.taxLabel || null,
      taxRate,
      amount,
      tax,
    };
  });
  const discountAmount = Number(discount) || 0;
  const total = Math.round((subtotal + taxTotal - discountAmount) * 100) / 100;

  const manual = await prisma.manualInvoice.create({
    data: {
      invoiceNumber,
      billToName: String(billToName).trim(),
      billToEmail: billToEmail ? String(billToEmail).trim() : null,
      billToPhone: billToPhone ? String(billToPhone).trim() : null,
      billToAddress: billToAddress ? String(billToAddress).trim() : null,
      invoiceDate: new Date(invoiceDate || Date.now()),
      dueDate: dueDate ? new Date(dueDate) : null,
      items: JSON.stringify(parsedItems),
      subtotal,
      taxTotal,
      discount: discountAmount,
      total,
      notes: notes ? String(notes).trim() : null,
      status: status || "DRAFT",
    },
  });
  return res.status(201).json(new ApiResponsive(201, manual, "Manual invoice created"));
});

export const getManualInvoiceForView = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const manual = await prisma.manualInvoice.findUnique({
    where: { id },
  });
  if (!manual) throw new ApiError(404, "Manual invoice not found");

  let settings = await prisma.invoiceSettings.findFirst({ orderBy: { createdAt: "asc" } });
  if (!settings) {
    settings = await prisma.invoiceSettings.create({
      data: { companyName: "Company", address: "", gstNumber: "" },
    });
  }
  const logoUrl = settings.logo ? getPublicUrl(settings.logo) : null;
  const stampUrl = settings.stamp ? getPublicUrl(settings.stamp) : null;

  let items = [];
  try {
    items = JSON.parse(manual.items);
    if (!Array.isArray(items)) items = [];
  } catch (_) {}

  return res.status(200).json(
    new ApiResponsive(200, {
      type: "manual",
      manual: {
        id: manual.id,
        invoiceNumber: manual.invoiceNumber,
        billToName: manual.billToName,
        billToEmail: manual.billToEmail,
        billToPhone: manual.billToPhone,
        billToAddress: manual.billToAddress,
        invoiceDate: manual.invoiceDate,
        dueDate: manual.dueDate,
        items,
        subtotal: Number(manual.subtotal),
        taxTotal: Number(manual.taxTotal),
        discount: Number(manual.discount),
        total: Number(manual.total),
        currency: manual.currency,
        notes: manual.notes,
        status: manual.status,
      },
      settings: { ...settings, logoUrl, stampUrl },
    }, "Manual invoice fetched")
  );
});

export const updateManualInvoice = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { billToName, billToEmail, billToPhone, billToAddress, invoiceDate, dueDate, items, discount, notes, status } = req.body;
  const existing = await prisma.manualInvoice.findUnique({ where: { id } });
  if (!existing) throw new ApiError(404, "Manual invoice not found");

  let subtotal = 0;
  let taxTotal = 0;
  const parsedItems = (Array.isArray(items) ? items : []).map((it) => {
    const qty = Number(it.quantity) || 1;
    const unitPrice = Number(it.unitPrice) || 0;
    const taxRate = Number(it.taxRate) || 0;
    const amount = qty * unitPrice;
    const tax = Math.round((amount * taxRate) / 100 * 100) / 100;
    subtotal += amount;
    taxTotal += tax;
    return {
      description: it.description || "Item",
      quantity: qty,
      unitPrice,
      taxLabel: it.taxLabel || null,
      taxRate,
      amount,
      tax,
    };
  });
  const discountAmount = Number(discount) || 0;
  const total = Math.round((subtotal + taxTotal - discountAmount) * 100) / 100;

  const manual = await prisma.manualInvoice.update({
    where: { id },
    data: {
      ...(billToName !== undefined && { billToName: String(billToName).trim() }),
      ...(billToEmail !== undefined && { billToEmail: billToEmail ? String(billToEmail).trim() : null }),
      ...(billToPhone !== undefined && { billToPhone: billToPhone ? String(billToPhone).trim() : null }),
      ...(billToAddress !== undefined && { billToAddress: billToAddress ? String(billToAddress).trim() : null }),
      ...(invoiceDate !== undefined && { invoiceDate: new Date(invoiceDate) }),
      ...(dueDate !== undefined && { dueDate: dueDate ? new Date(dueDate) : null }),
      ...(items !== undefined && { items: JSON.stringify(parsedItems), subtotal, taxTotal, discount: discountAmount, total }),
      ...(notes !== undefined && { notes: notes ? String(notes).trim() : null }),
      ...(status !== undefined && { status }),
    },
  });
  return res.status(200).json(new ApiResponsive(200, manual, "Manual invoice updated"));
});

export const deleteManualInvoice = asyncHandler(async (req, res) => {
  await prisma.manualInvoice.delete({ where: { id: req.params.id } });
  return res.status(200).json(new ApiResponsive(200, null, "Manual invoice deleted"));
});
