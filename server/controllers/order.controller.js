import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiResponsive } from "../utils/ApiResponsive.js";
import { ApiError } from "../utils/ApiError.js";
import { prisma } from "../config/db.js";
import { createRazorpayOrder, verifyRazorpaySignature } from "../utils/razorpay.js";
import { getPublicUrl } from "../utils/cloudflare.js";
import sendEmail from "../utils/sendEmail.js";
import {
    getGuidanceBookingTemplate,
    getWebinarBookingTemplate,
    getMentorshipEnrollmentTemplate,
    getCourseEnrollmentTemplate,
    getAdminNotificationTemplate,
    getOrderConfirmationTemplate,
} from "../email/templates/emailTemplates.js";
import { getItemPricing } from "../utils/flashSaleHelper.js";

/**
 * Create bundle order
 */
export const createBundleOrder = asyncHandler(async (req, res) => {
    const { bundleId, couponCode } = req.body;
    const userId = req.user.id;
    const user = req.user;

    if (!bundleId) {
        throw new ApiError(400, "Bundle ID is required");
    }

    // Get bundle
    const bundle = await prisma.bundle.findUnique({
        where: { id: bundleId },
    });

    if (!bundle || !bundle.isPublished) {
        throw new ApiError(404, "Bundle not found");
    }

    // Check if duplicate enrollment
    const existingEnrollment = await prisma.bundleEnrollment.findUnique({
        where: {
            bundleId_userId: {
                bundleId,
                userId,
            },
        },
    });

    if (existingEnrollment) {
        throw new ApiError(400, "You are already enrolled in this bundle");
    }

    // Check if there is already a pending order for this bundle
    const pendingOrder = await prisma.bundleOrder.findFirst({
        where: {
            userId,
            bundleId,
            paymentStatus: "CREATED",
            order: {
                status: "PENDING",
            },
        },
        include: {
            order: true,
        },
    });

    // Calculate price
    const pricing = await getItemPricing('BUNDLE', bundle.id, bundle.price, bundle.salePrice);
    let finalAmount = pricing.effectivePrice;

    // Apply coupon if provided
    let discountAmount = 0;
    let coupon = null;
    if (couponCode) {
        coupon = await prisma.coupon.findFirst({
            where: {
                code: couponCode.toUpperCase(),
                isActive: true,
                validFrom: { lte: new Date() },
                validUntil: { gte: new Date() },
            },
        });

        if (coupon) {
            // Check applicability
            if (coupon.applicableTo === "ALL" || coupon.applicableTo === "BUNDLE") {
                if (coupon.type === "PERCENTAGE") {
                    discountAmount = (finalAmount * coupon.discountValue) / 100;
                    if (coupon.maxDiscount && discountAmount > coupon.maxDiscount) {
                        discountAmount = coupon.maxDiscount;
                    }
                } else {
                    discountAmount = coupon.discountValue;
                }

                // Ensure discount doesn't exceed total
                if (discountAmount > finalAmount) {
                    discountAmount = finalAmount;
                }

                // Check usage limit
                if (coupon.usageLimit && coupon.usedCount >= coupon.usageLimit) {
                    // Coupon limit reached - ignore
                    discountAmount = 0;
                    coupon = null;
                }
            } else {
                // Not applicable
                discountAmount = 0;
                coupon = null;
            }
        }
    }

    finalAmount = Math.max(0, finalAmount - discountAmount);

    // If pending order exists with same amount, reuse it
    if (pendingOrder) {
        const orderAge = new Date() - new Date(pendingOrder.createdAt);
        // Reuse if less than 15 mins old and amount matches
        if (orderAge < 15 * 60 * 1000 && Math.abs(pendingOrder.order.finalAmount - finalAmount) < 1) {
            return res.status(200).json(
                new ApiResponsive(
                    200,
                    {
                        order: pendingOrder.order,
                        razorpayOrder: {
                            id: pendingOrder.order.razorpayOrderId,
                            amount: pendingOrder.order.finalAmount * 100,
                            currency: "INR",
                            key: process.env.RAZORPAY_KEY_ID,
                        },
                    },
                    "Pending order retrieved"
                )
            );
        }
    }

    // Create razorpay order if amount > 0
    let razorpayOrder = null;
    if (finalAmount > 0) {
        razorpayOrder = await createRazorpayOrder(finalAmount);
    }

    // Create order transaction
    const order = await prisma.$transaction(async (tx) => {
        // Create main order
        const newOrder = await tx.order.create({
            data: {
                userId,
                totalAmount: pricing.effectivePrice,
                discountAmount,
                finalAmount,
                couponCode: coupon ? coupon.code : null,
                status: finalAmount === 0 ? "COMPLETED" : "PENDING",
                razorpayOrderId: razorpayOrder ? razorpayOrder.id : null,
                orderType: "BUNDLE",
                orderNumber: `ORD-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
            },
        });

        // Create bundle order
        await tx.bundleOrder.create({
            data: {
                bundleId,
                userId,
                orderId: newOrder.id,
                amountPaid: finalAmount,
                paymentStatus: finalAmount === 0 ? "PAID" : "CREATED",
            },
        });

        // If free, enroll immediately
        if (finalAmount === 0) {
            await tx.bundleEnrollment.create({
                data: {
                    bundleId,
                    userId,
                },
            });

            // Enroll user in all courses in the bundle
            const bundleWithCourses = await tx.bundle.findUnique({
                where: { id: bundleId },
                include: {
                    courses: {
                        include: {
                            course: {
                                select: {
                                    id: true,
                                    price: true,
                                    salePrice: true,
                                },
                            },
                        },
                    },
                },
            });

            if (bundleWithCourses && bundleWithCourses.courses.length > 0) {
                // Calculate total course value for price distribution
                let totalCourseValue = 0;
                const coursePrices = bundleWithCourses.courses.map(bc => {
                    const coursePrice = bc.course.salePrice || bc.course.price || 0;
                    totalCourseValue += coursePrice;
                    return {
                        courseId: bc.course.id,
                        price: coursePrice,
                    };
                });

                // Distribute bundle price proportionally among courses
                const bundleFinalAmount = finalAmount;

                for (let i = 0; i < bundleWithCourses.courses.length; i++) {
                    const bundleCourse = bundleWithCourses.courses[i];
                    const courseId = bundleCourse.course.id;
                    const coursePrice = coursePrices[i].price;

                    // Calculate distributed price for this course
                    let distributedPrice = 0;
                    if (totalCourseValue > 0) {
                        distributedPrice = (coursePrice / totalCourseValue) * bundleFinalAmount;
                        // Round to 2 decimal places
                        distributedPrice = Math.round(distributedPrice * 100) / 100;
                    } else {
                        // If no course prices, distribute equally
                        distributedPrice = bundleFinalAmount / bundleWithCourses.courses.length;
                        distributedPrice = Math.round(distributedPrice * 100) / 100;
                    }

                    // For the last course, ensure total matches bundle price exactly
                    if (i === bundleWithCourses.courses.length - 1) {
                        const totalDistributed = coursePrices.slice(0, -1).reduce((sum, cp, idx) => {
                            const price = (cp.price / totalCourseValue) * bundleFinalAmount;
                            return sum + Math.round(price * 100) / 100;
                        }, 0);
                        distributedPrice = bundleFinalAmount - totalDistributed;
                    }

                    // Check if user is already enrolled in this course
                    const existingCourseEnrollment = await tx.courseEnrollment.findUnique({
                        where: {
                            courseId_userId: {
                                courseId,
                                userId,
                            },
                        },
                    });

                    // If not enrolled, create enrollment
                    if (!existingCourseEnrollment) {
                        await tx.courseEnrollment.create({
                            data: {
                                courseId,
                                userId,
                            },
                        });
                    }

                    // Also create course order if not exists (for order history)
                    const existingCourseOrder = await tx.courseOrder.findFirst({
                        where: {
                            courseId,
                            userId,
                            orderId: newOrder.id,
                            paymentMode: 'BUNDLE',
                        },
                    });

                    if (!existingCourseOrder) {
                        await tx.courseOrder.create({
                            data: {
                                courseId,
                                userId,
                                orderId: newOrder.id,
                                amountPaid: distributedPrice,
                                paymentStatus: 'PAID',
                                paymentMode: 'BUNDLE',
                            },
                        });
                    }
                }
            }

            // Update coupon if used
            if (coupon) {
                await tx.coupon.update({
                    where: { id: coupon.id },
                    data: { usedCount: { increment: 1 } },
                });
            }
        }

        return newOrder;
    });

    // If free, send emails immediately
    if (finalAmount === 0) {
        try {
            const adminEmail = process.env.ADMIN_EMAIL || process.env.FROM_EMAIL;
            const bundleUrl = `${process.env.CLIENT_URL || 'http://localhost:3000'}/bundle/${bundle.slug}`;

            // Admin notification
            await sendEmail({
                email: adminEmail,
                subject: `New Bundle Enrollment - ${order.orderNumber}`,
                html: getAdminNotificationTemplate({
                    type: 'enrollment',
                    orderNumber: order.orderNumber,
                    customerName: user.name,
                    customerEmail: user.email,
                    customerPhone: user.phone,
                    itemName: bundle.title,
                    amount: 0,
                    dashboardUrl: `${process.env.CLIENT_URL || 'http://localhost:3000'}/admin/bundles`,
                }),
            });

            // User confirmation
            await sendEmail({
                email: user.email,
                subject: `Bundle Enrollment Confirmed - ${bundle.title}`,
                html: getBundleEnrollmentTemplate ? getBundleEnrollmentTemplate({
                    userName: user.name,
                    bundleName: bundle.title,
                    bundleUrl: bundleUrl,
                    orderNumber: order.orderNumber,
                    bundleImage: bundle.thumbnail ? getPublicUrl(bundle.thumbnail) : null,
                }) : `<p>You have successfully enrolled in ${bundle.title}</p>`,
            });
        } catch (emailError) {
            console.error("Error sending enrollment emails:", emailError);
        }
    }

    return res.status(201).json(
        new ApiResponsive(
            201,
            {
                order,
                razorpayOrder: razorpayOrder ? {
                    id: razorpayOrder.id,
                    amount: razorpayOrder.amount,
                    currency: razorpayOrder.currency,
                    key: process.env.RAZORPAY_KEY_ID,
                } : null,
            },
            "Order created successfully"
        )
    );
});


export const createOrder = asyncHandler(async (req, res) => {
    const { ebookIds, couponCode } = req.body;
    const userId = req.user.id;

    if (!ebookIds || !Array.isArray(ebookIds) || ebookIds.length === 0) {
        throw new ApiError(400, "E-book IDs are required");
    }

    // Get e-books
    const ebooks = await prisma.ebook.findMany({
        where: {
            id: { in: ebookIds },
            isPublished: true, // Only published e-books can be purchased
        },
    });

    if (ebooks.length !== ebookIds.length) {
        throw new ApiError(400, "Some e-books are not available");
    }

    // Check if user already owns any of these e-books
    const existingOrders = await prisma.order.findMany({
        where: {
            userId,
            status: "COMPLETED",
            items: {
                some: {
                    ebookId: { in: ebookIds },
                },
            },
        },
        include: {
            items: true,
        },
    });

    const ownedEbookIds = new Set();
    existingOrders.forEach((order) => {
        order.items.forEach((item) => {
            ownedEbookIds.add(item.ebookId);
        });
    });

    const newEbookIds = ebookIds.filter((id) => !ownedEbookIds.has(id));
    if (newEbookIds.length === 0) {
        throw new ApiError(400, "You already own all selected e-books");
    }

    const newEbooks = ebooks.filter((ebook) => newEbookIds.includes(ebook.id));

    // Calculate totals with flash sale pricing
    let totalAmount = 0;
    const orderItems = [];

    for (const ebook of newEbooks) {
        // Get flash sale pricing if available
        const pricing = await getItemPricing('EBOOK', ebook.id, ebook.price, ebook.salePrice);
        const effectivePrice = ebook.isFree ? 0 : pricing.effectivePrice;
        totalAmount += effectivePrice;
        orderItems.push({
            ebookId: ebook.id,
            price: ebook.price,
            salePrice: effectivePrice, // Store the actual paid price (including flash sale)
            isFree: ebook.isFree,
        });
    }

    // Apply coupon if provided
    let discountAmount = 0;
    let coupon = null;
    if (couponCode) {
        coupon = await prisma.coupon.findFirst({
            where: {
                code: couponCode.toUpperCase(),
                isActive: true,
                validFrom: { lte: new Date() },
                validUntil: { gte: new Date() },
            },
        });

        if (coupon) {
            if (coupon.usageLimit && coupon.usedCount >= coupon.usageLimit) {
                throw new ApiError(400, "Coupon usage limit exceeded");
            }

            if (coupon.discountType === "PERCENTAGE") {
                discountAmount = (totalAmount * coupon.discountValue) / 100;
                if (coupon.maxDiscount) {
                    discountAmount = Math.min(discountAmount, coupon.maxDiscount);
                }
            } else {
                discountAmount = coupon.discountValue;
            }

            if (coupon.minAmount && totalAmount < coupon.minAmount) {
                throw new ApiError(400, `Minimum order amount is ${coupon.minAmount}`);
            }
        } else {
            throw new ApiError(400, "Invalid coupon code");
        }
    }

    const finalAmount = Math.max(0, totalAmount - discountAmount);

    // Generate order number
    const orderNumber = `ORD-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;

    // If all e-books are free, complete order immediately
    if (finalAmount === 0) {
        const order = await prisma.order.create({
            data: {
                userId,
                orderNumber,
                orderType: "EBOOK",
                totalAmount,
                discountAmount,
                finalAmount: 0,
                status: "COMPLETED",
                paymentStatus: "PAID",
                couponCode: couponCode || null,
                items: {
                    create: orderItems,
                },
            },
            include: {
                items: {
                    include: {
                        ebook: true,
                    },
                },
            },
        });

        // Update purchase count
        for (const ebook of newEbooks) {
            await prisma.ebook.update({
                where: { id: ebook.id },
                data: { purchaseCount: { increment: 1 } },
            });
        }

        // Update coupon usage
        if (coupon) {
            await prisma.coupon.update({
                where: { id: coupon.id },
                data: { usedCount: { increment: 1 } },
            });
        }

        return res.status(201).json(
            new ApiResponsive(201, { order }, "Order completed successfully (Free e-books)")
        );
    }

    // Create Razorpay order for paid e-books
    const razorpayOrder = await createRazorpayOrder(finalAmount, "INR", orderNumber);

    const order = await prisma.order.create({
        data: {
            userId,
            orderNumber,
            orderType: "EBOOK",
            totalAmount,
            discountAmount,
            finalAmount,
            status: "PENDING",
            paymentStatus: "PENDING",
            razorpayOrderId: razorpayOrder.id,
            couponCode: couponCode || null,
            items: {
                create: orderItems,
            },
        },
        include: {
            items: {
                include: {
                    ebook: true,
                },
            },
        },
    });

    return res.status(201).json(
        new ApiResponsive(
            201,
            {
                order,
                razorpayOrder: {
                    id: razorpayOrder.id,
                    amount: razorpayOrder.amount,
                    currency: razorpayOrder.currency,
                    key: process.env.RAZORPAY_KEY_ID,
                },
            },
            "Order created successfully"
        )
    );
});

/**
 * Verify Razorpay payment and complete order
 */
export const verifyPayment = asyncHandler(async (req, res) => {
    const { orderId, paymentId, signature } = req.body;
    const userId = req.user.id;

    if (!orderId || !paymentId || !signature) {
        throw new ApiError(400, "Payment details are required");
    }

    // Verify signature
    const isValid = verifyRazorpaySignature(orderId, paymentId, signature);
    if (!isValid) {
        throw new ApiError(400, "Invalid payment signature");
    }

    // Find order
    const order = await prisma.order.findFirst({
        where: {
            razorpayOrderId: orderId,
            userId,
            status: "PENDING",
        },
        include: {
            items: {
                include: {
                    ebook: true,
                },
            },
            user: true,
        },
    });

    if (!order) {
        throw new ApiError(404, "Order not found");
    }

    // Update order
    const updatedOrder = await prisma.order.update({
        where: { id: order.id },
        data: {
            status: "COMPLETED",
            paymentStatus: "PAID",
            razorpayPaymentId: paymentId,
            razorpaySignature: signature,
        },
        include: {
            items: {
                include: {
                    ebook: true,
                },
            },
            user: true,
        },
    });

    // Update purchase count for ebooks
    for (const item of order.items) {
        await prisma.ebook.update({
            where: { id: item.ebookId },
            data: { purchaseCount: { increment: 1 } },
        });
    }

    // Handle guidance orders if orderType is GUIDANCE
    if (order.orderType === "GUIDANCE") {
        // Find guidance order linked to this order
        const guidanceOrder = await prisma.guidanceOrder.findFirst({
            where: {
                userId,
                paymentId: order.id,
            },
            include: {
                guidance: true,
                slot: true,
            },
        });

        if (guidanceOrder) {
            // Update with payment info
            // Keep paymentId as order.id to maintain link to Order record
            // Razorpay payment ID is stored in Order.razorpayPaymentId
            await prisma.guidanceOrder.update({
                where: { id: guidanceOrder.id },
                data: {
                    paymentStatus: "PAID",
                    paymentMode: "RAZORPAY",
                    // Keep paymentId as order.id to maintain link to Order
                },
            });

            // Send booking confirmation emails
            try {
                const adminEmail = process.env.ADMIN_EMAIL || process.env.FROM_EMAIL;
                const slotDate = new Date(guidanceOrder.slot.date).toLocaleDateString('en-IN', { dateStyle: 'long' });
                const slotTime = `${guidanceOrder.slot.startTime} - ${guidanceOrder.slot.endTime}`;

                // Admin notification
                await sendEmail({
                    email: adminEmail,
                    subject: `New 1:1 Guidance Booking - ${order.orderNumber}`,
                    html: getAdminNotificationTemplate({
                        type: 'guidance',
                        orderNumber: order.orderNumber,
                        customerName: order.user.name,
                        customerEmail: order.user.email,
                        customerPhone: order.user.phone,
                        itemName: guidanceOrder.guidance.title,
                        amount: order.finalAmount,
                        additionalInfo: `Expert: ${guidanceOrder.guidance.expertName} | Date: ${slotDate} | Time: ${slotTime}`,
                        dashboardUrl: `${process.env.CLIENT_URL || 'http://localhost:3000'}/admin/guidance`,
                    }),
                });

                // User confirmation
                await sendEmail({
                    email: order.user.email,
                    subject: `Booking Confirmed - ${guidanceOrder.guidance.title}`,
                    html: getGuidanceBookingTemplate({
                        userName: order.user.name,
                        guidanceTitle: guidanceOrder.guidance.title,
                        expertName: guidanceOrder.guidance.expertName,
                        slotDate: slotDate,
                        slotTime: slotTime,
                        orderNumber: order.orderNumber,
                    }),
                });
            } catch (emailError) {
                console.error("Error sending booking emails:", emailError);
            }
        }
    }

    // Handle webinar orders if orderType is WEBINAR
    if (order.orderType === "WEBINAR") {
        // Find webinar order items linked to this order
        const webinarOrders = await prisma.webinarOrderItem.findMany({
            where: {
                userId,
                paymentId: order.id,
            },
            include: {
                webinar: true,
            },
        });

        // Update with payment info
        await prisma.webinarOrderItem.updateMany({
            where: {
                userId,
                paymentId: order.id,
            },
            data: {
                paymentId: paymentId,
                paymentMode: "RAZORPAY",
            },
        });

        // Send enrollment emails
        try {
            const adminEmail = process.env.ADMIN_EMAIL || process.env.FROM_EMAIL;
            const webinar = webinarOrders[0]?.webinar;
            const webinarTitles = webinarOrders.map(wo => wo.webinar.title).join(', ');

            // Admin notification
            await sendEmail({
                email: adminEmail,
                subject: `New Webinar Enrollment - ${order.orderNumber}`,
                html: getAdminNotificationTemplate({
                    type: 'webinar',
                    orderNumber: order.orderNumber,
                    customerName: order.user.name,
                    customerEmail: order.user.email,
                    customerPhone: order.user.phone,
                    itemName: webinarTitles,
                    amount: order.finalAmount,
                    dashboardUrl: `${process.env.CLIENT_URL || 'http://localhost:3000'}/admin/webinars`,
                }),
            });

            // User confirmation
            await sendEmail({
                email: order.user.email,
                subject: `Webinar Booking Confirmed - ${webinar?.title || 'Webinar'}`,
                html: getWebinarBookingTemplate({
                    userName: order.user.name,
                    webinarTitle: webinar?.title || 'Webinar',
                    scheduledAt: webinar?.startDate ? new Date(webinar.startDate).toLocaleString('en-IN', { dateStyle: 'long', timeStyle: 'short' }) : 'TBA',
                    duration: webinar?.duration || 60,
                    meetLink: null, // Will be sent before webinar
                }),
            });
        } catch (emailError) {
            console.error("Error sending enrollment emails:", emailError);
        }
    }

    // Handle mentorship orders if orderType is MENTORSHIP
    if (order.orderType === "MENTORSHIP") {
        // Find mentorship order linked to this order
        const mentorshipOrder = await prisma.mentorshipOrder.findFirst({
            where: {
                userId,
                paymentId: order.id,
            },
            include: {
                mentorship: true,
            },
        });

        if (mentorshipOrder) {
            // Update with payment info
            await prisma.mentorshipOrder.update({
                where: { id: mentorshipOrder.id },
                data: {
                    paymentStatus: "PAID",
                    paymentMode: "RAZORPAY",
                    // Keep paymentId as order.id to maintain link to Order
                },
            });

            // Create enrollment if not exists
            const existingEnrollment = await prisma.mentorshipEnrollment.findUnique({
                where: {
                    mentorshipId_userId: {
                        mentorshipId: mentorshipOrder.mentorshipId,
                        userId,
                    },
                },
            });

            if (!existingEnrollment) {
                await prisma.mentorshipEnrollment.create({
                    data: {
                        mentorshipId: mentorshipOrder.mentorshipId,
                        userId,
                    },
                });
            }

            // Send enrollment emails
            try {
                const adminEmail = process.env.ADMIN_EMAIL || process.env.FROM_EMAIL;

                // Admin notification
                await sendEmail({
                    email: adminEmail,
                    subject: `New Mentorship Enrollment - ${order.orderNumber}`,
                    html: getAdminNotificationTemplate({
                        type: 'mentorship',
                        orderNumber: order.orderNumber,
                        customerName: order.user.name,
                        customerEmail: order.user.email,
                        customerPhone: order.user.phone,
                        itemName: mentorshipOrder.mentorship.title,
                        amount: order.finalAmount,
                        additionalInfo: `Instructor: ${mentorshipOrder.mentorship.instructorName}`,
                        dashboardUrl: `${process.env.CLIENT_URL || 'http://localhost:3000'}/admin/mentorship`,
                    }),
                });

                // User confirmation
                await sendEmail({
                    email: order.user.email,
                    subject: `Mentorship Enrollment Confirmed - ${mentorshipOrder.mentorship.title}`,
                    html: getMentorshipEnrollmentTemplate({
                        userName: order.user.name,
                        mentorshipTitle: mentorshipOrder.mentorship.title,
                        instructorName: mentorshipOrder.mentorship.instructorName,
                        orderNumber: order.orderNumber,
                        accessUrl: `${process.env.CLIENT_URL || 'http://localhost:3000'}/profile/enrolled`,
                    }),
                });
            } catch (emailError) {
                console.error("Error sending enrollment emails:", emailError);
            }
        }
    }

    // Handle course orders if orderType is COURSE
    if (order.orderType === "COURSE") {
        // Find course order linked to this order
        const courseOrder = await prisma.courseOrder.findFirst({
            where: {
                userId,
                orderId: order.id,
            },
            include: {
                course: true,
            },
        });

        if (courseOrder) {
            // Update with payment info
            await prisma.courseOrder.update({
                where: { id: courseOrder.id },
                data: {
                    paymentStatus: "PAID",
                    paymentMode: "RAZORPAY",
                    paymentId: paymentId,
                },
            });

            // Create enrollment if not exists
            const existingEnrollment = await prisma.courseEnrollment.findUnique({
                where: {
                    courseId_userId: {
                        courseId: courseOrder.courseId,
                        userId,
                    },
                },
            });

            if (!existingEnrollment) {
                await prisma.courseEnrollment.create({
                    data: {
                        courseId: courseOrder.courseId,
                        userId,
                    },
                });
            }

            // Send enrollment emails
            try {
                const adminEmail = process.env.ADMIN_EMAIL || process.env.FROM_EMAIL;
                const courseUrl = `${process.env.CLIENT_URL || 'http://localhost:3000'}/courses/${courseOrder.course.slug}/learn`;

                // Admin notification
                await sendEmail({
                    email: adminEmail,
                    subject: `New Course Enrollment - ${order.orderNumber}`,
                    html: getAdminNotificationTemplate({
                        type: 'enrollment',
                        orderNumber: order.orderNumber,
                        customerName: order.user.name,
                        customerEmail: order.user.email,
                        customerPhone: order.user.phone,
                        itemName: courseOrder.course.title,
                        amount: order.finalAmount,
                        dashboardUrl: `${process.env.CLIENT_URL || 'http://localhost:3000'}/admin/course-progress`,
                    }),
                });

                // User confirmation
                await sendEmail({
                    email: order.user.email,
                    subject: `Course Enrollment Confirmed - ${courseOrder.course.title}`,
                    html: getCourseEnrollmentTemplate({
                        userName: order.user.name,
                        courseName: courseOrder.course.title,
                        courseUrl: courseUrl,
                        orderNumber: order.orderNumber,
                        courseImage: courseOrder.course.coverImage ? getPublicUrl(courseOrder.course.coverImage) : null,
                    }),
                });
            } catch (emailError) {
                console.error("Error sending enrollment emails:", emailError);
            }
        }
    }

    // Handle bundle orders if orderType is BUNDLE
    if (order.orderType === "BUNDLE") {
        // Find bundle order linked to this order
        const bundleOrder = await prisma.bundleOrder.findFirst({
            where: {
                userId,
                orderId: order.id,
            },
            include: {
                bundle: true,
            },
        });

        if (bundleOrder) {
            // Update with payment info
            await prisma.bundleOrder.update({
                where: { id: bundleOrder.id },
                data: {
                    paymentStatus: "PAID",
                },
            });

            // Create enrollment if not exists
            const existingEnrollment = await prisma.bundleEnrollment.findUnique({
                where: {
                    bundleId_userId: {
                        bundleId: bundleOrder.bundleId,
                        userId,
                    },
                },
            });

            if (!existingEnrollment) {
                await prisma.bundleEnrollment.create({
                    data: {
                        bundleId: bundleOrder.bundleId,
                        userId,
                    },
                });
            }

            // Enroll user in all courses in the bundle
            const bundle = await prisma.bundle.findUnique({
                where: { id: bundleOrder.bundleId },
                include: {
                    courses: {
                        include: {
                            course: {
                                select: {
                                    id: true,
                                    price: true,
                                    salePrice: true,
                                },
                            },
                        },
                    },
                },
            });

            if (bundle && bundle.courses.length > 0) {
                // Calculate total course value for price distribution
                let totalCourseValue = 0;
                const coursePrices = bundle.courses.map(bc => {
                    const coursePrice = bc.course.salePrice || bc.course.price || 0;
                    totalCourseValue += coursePrice;
                    return {
                        courseId: bc.course.id,
                        price: coursePrice,
                    };
                });

                // Distribute bundle price proportionally among courses
                const bundleFinalAmount = order.finalAmount || bundleOrder.amountPaid || 0;

                for (let i = 0; i < bundle.courses.length; i++) {
                    const bundleCourse = bundle.courses[i];
                    const courseId = bundleCourse.course.id;
                    const coursePrice = coursePrices[i].price;

                    // Calculate distributed price for this course
                    let distributedPrice = 0;
                    if (totalCourseValue > 0) {
                        distributedPrice = (coursePrice / totalCourseValue) * bundleFinalAmount;
                        // Round to 2 decimal places
                        distributedPrice = Math.round(distributedPrice * 100) / 100;
                    } else {
                        // If no course prices, distribute equally
                        distributedPrice = bundleFinalAmount / bundle.courses.length;
                        distributedPrice = Math.round(distributedPrice * 100) / 100;
                    }

                    // For the last course, ensure total matches bundle price exactly
                    if (i === bundle.courses.length - 1) {
                        const totalDistributed = coursePrices.slice(0, -1).reduce((sum, cp, idx) => {
                            const price = (cp.price / totalCourseValue) * bundleFinalAmount;
                            return sum + Math.round(price * 100) / 100;
                        }, 0);
                        distributedPrice = bundleFinalAmount - totalDistributed;
                    }

                    // Check if user is already enrolled in this course
                    const existingCourseEnrollment = await prisma.courseEnrollment.findUnique({
                        where: {
                            courseId_userId: {
                                courseId,
                                userId,
                            },
                        },
                    });

                    // If not enrolled, create enrollment
                    if (!existingCourseEnrollment) {
                        await prisma.courseEnrollment.create({
                            data: {
                                courseId,
                                userId,
                            },
                        });
                    }

                    // Also create course order if not exists (for order history)
                    const existingCourseOrder = await prisma.courseOrder.findFirst({
                        where: {
                            courseId,
                            userId,
                            orderId: order.id,
                            paymentMode: 'BUNDLE',
                        },
                    });

                    if (!existingCourseOrder) {
                        // Create a course order linked to the bundle order with distributed price
                        await prisma.courseOrder.create({
                            data: {
                                courseId,
                                userId,
                                orderId: order.id,
                                amountPaid: distributedPrice,
                                paymentStatus: 'PAID',
                                paymentMode: 'BUNDLE',
                            },
                        });
                    }
                }
            }

            // Update coupon usage if applicable
            if (order.couponCode) {
                const coupon = await prisma.coupon.findFirst({
                    where: { code: order.couponCode },
                });
                if (coupon) {
                    await prisma.coupon.update({
                        where: { id: coupon.id },
                        data: { usedCount: { increment: 1 } },
                    });
                }
            }

            // Send enrollment emails
            try {
                const adminEmail = process.env.ADMIN_EMAIL || process.env.FROM_EMAIL;
                const bundleUrl = `${process.env.CLIENT_URL || 'http://localhost:3000'}/bundle/${bundleOrder.bundle.slug}`;

                // Admin notification
                await sendEmail({
                    email: adminEmail,
                    subject: `New Bundle Enrollment - ${order.orderNumber}`,
                    html: getAdminNotificationTemplate({
                        type: 'enrollment',
                        orderNumber: order.orderNumber,
                        customerName: order.user.name,
                        customerEmail: order.user.email,
                        customerPhone: order.user.phone,
                        itemName: bundleOrder.bundle.title,
                        amount: order.finalAmount,
                        dashboardUrl: `${process.env.CLIENT_URL || 'http://localhost:3000'}/admin/bundles`,
                    }),
                });

                // User confirmation
                await sendEmail({
                    email: order.user.email,
                    subject: `Bundle Enrollment Confirmed - ${bundleOrder.bundle.title}`,
                    html: getBundleEnrollmentTemplate ? getBundleEnrollmentTemplate({
                        userName: order.user.name,
                        bundleName: bundleOrder.bundle.title,
                        bundleUrl: bundleUrl,
                        orderNumber: order.orderNumber,
                        bundleImage: bundleOrder.bundle.thumbnail ? getPublicUrl(bundleOrder.bundle.thumbnail) : null,
                    }) : `<p>You have successfully enrolled in ${bundleOrder.bundle.title}</p>`,
                });
            } catch (emailError) {
                console.error("Error sending enrollment emails:", emailError);
            }
        }
    }

    // Handle offline batch orders if orderType is OFFLINE_BATCH
    if (order.orderType === "OFFLINE_BATCH") {
        // Find offline batch order linked to this order
        const offlineBatchOrder = await prisma.offlineBatchOrder.findFirst({
            where: {
                userId,
                orderId: order.id,
            },
            include: {
                batch: true,
            },
        });

        if (offlineBatchOrder) {
            // Update with payment info
            await prisma.offlineBatchOrder.update({
                where: { id: offlineBatchOrder.id },
                data: {
                    paymentStatus: "PAID",
                },
            });

            // Create enrollment if not exists
            const existingEnrollment = await prisma.offlineBatchEnrollment.findUnique({
                where: {
                    batchId_userId: {
                        batchId: offlineBatchOrder.batchId,
                        userId,
                    },
                },
            });

            if (!existingEnrollment) {
                await prisma.offlineBatchEnrollment.create({
                    data: {
                        batchId: offlineBatchOrder.batchId,
                        userId,
                        paymentStatus: "PAID",
                        amountPaid: order.finalAmount,
                        paymentMode: "RAZORPAY",
                    },
                });

                // Update seats filled
                await prisma.offlineBatch.update({
                    where: { id: offlineBatchOrder.batchId },
                    data: {
                        seatsFilled: { increment: 1 },
                    },
                });
            }

            // Send enrollment emails
            try {
                const adminEmail = process.env.ADMIN_EMAIL || process.env.FROM_EMAIL;

                // Admin notification
                await sendEmail({
                    email: adminEmail,
                    subject: `New Offline Batch Enrollment - ${order.orderNumber}`,
                    html: getAdminNotificationTemplate({
                        type: 'enrollment',
                        orderNumber: order.orderNumber,
                        customerName: order.user.name,
                        customerEmail: order.user.email,
                        customerPhone: order.user.phone,
                        itemName: offlineBatchOrder.batch.title,
                        amount: order.finalAmount,
                        additionalInfo: `City: ${offlineBatchOrder.batch.city} | Start Date: ${new Date(offlineBatchOrder.batch.startDate).toLocaleDateString()}`,
                        dashboardUrl: `${process.env.CLIENT_URL || 'http://localhost:3000'}/admin/offline-batches`,
                    }),
                });

                // User confirmation
                await sendEmail({
                    email: order.user.email,
                    subject: `Offline Batch Enrollment Confirmed - ${offlineBatchOrder.batch.title}`,
                    html: `
                        <h2>Enrollment Confirmed!</h2>
                        <p>Dear ${order.user.name},</p>
                        <p>You have successfully enrolled in <strong>${offlineBatchOrder.batch.title}</strong>.</p>
                        <p><strong>Details:</strong></p>
                        <ul>
                            <li>Location: ${offlineBatchOrder.batch.city}</li>
                            <li>Venue: ${offlineBatchOrder.batch.venue || 'TBA'}</li>
                            <li>Start Date: ${new Date(offlineBatchOrder.batch.startDate).toLocaleDateString()}</li>
                            <li>Order Number: ${order.orderNumber}</li>
                        </ul>
                        <p>Thank you for enrolling!</p>
                    `,
                });
            } catch (emailError) {
                console.error("Error sending enrollment emails:", emailError);
            }
        }
    }

    // Update coupon usage
    if (order.couponCode) {
        const coupon = await prisma.coupon.findFirst({
            where: { code: order.couponCode },
        });
        if (coupon) {
            await prisma.coupon.update({
                where: { id: coupon.id },
                data: { usedCount: { increment: 1 } },
            });
        }
    }

    return res.status(200).json(
        new ApiResponsive(200, { order: updatedOrder }, "Payment verified and order completed")
    );
});

/**
 * Get user orders
 */
export const getUserOrders = asyncHandler(async (req, res) => {
    const userId = req.user.id;
    const { status, type } = req.query; // type: all, purchased, enrolled, free

    const where = { userId };

    if (status) {
        where.status = status.toUpperCase();
    }

    // Filter by order type
    if (type === "webinar" || type === "enrolled") {
        where.orderType = "WEBINAR";
    } else if (type !== "all") {
        where.orderType = "EBOOK";
    }

    const orders = await prisma.order.findMany({
        where,
        include: {
            items: {
                include: {
                    ebook: {
                        select: {
                            id: true,
                            title: true,
                            slug: true,
                            image1: true,
                            shortDescription: true,
                            isFree: true,
                            pdfFile: true,
                        },
                    },
                },
            },
            subscriptions: {
                include: {
                    plan: {
                        select: {
                            id: true,
                            planType: true,
                            price: true,
                            salePrice: true,
                        },
                    },
                },
            },
        },
        orderBy: { createdAt: "desc" },
    });

    // Get order IDs for linking guidance orders
    const orderIds = orders.map(o => o.id);

    // Fetch webinar orders separately
    const webinarOrders = await prisma.webinarOrderItem.findMany({
        where: {
            userId,
            ...(status && { paymentId: { not: null } }), // Only paid if status filter
        },
        include: {
            webinar: {
                select: {
                    id: true,
                    title: true,
                    slug: true,
                    image: true,
                    type: true,
                    startDate: true,
                    startTime: true,
                    instructorName: true,
                },
            },
        },
        orderBy: { createdAt: "desc" },
    });

    // Fetch guidance orders separately - include both linked to orders and standalone
    const guidanceOrders = await prisma.guidanceOrder.findMany({
        where: {
            userId,
            ...(status && { paymentStatus: "PAID" }), // Only paid if status filter
        },
        include: {
            guidance: {
                select: {
                    id: true,
                    title: true,
                    slug: true,
                    expertName: true,
                    expertImage: true,
                    googleMeetLink: true,
                },
            },
            slot: {
                select: {
                    id: true,
                    date: true,
                    startTime: true,
                    endTime: true,
                    status: true,
                },
            },
        },
        orderBy: { createdAt: "desc" },
    });

    // Fetch course orders separately
    const courseOrders = await prisma.courseOrder.findMany({
        where: {
            userId,
            ...(status && { paymentStatus: "PAID" }), // Only paid if status filter
        },
        include: {
            course: {
                select: {
                    id: true,
                    title: true,
                    slug: true,
                    coverImage: true,
                    language: true,
                },
            },
        },
        orderBy: { createdAt: "desc" },
    });

    // Fetch mentorship orders separately
    const mentorshipOrders = await prisma.mentorshipOrder.findMany({
        where: {
            userId,
            ...(status && { paymentStatus: "PAID" }), // Only paid if status filter
        },
        include: {
            mentorship: {
                select: {
                    id: true,
                    title: true,
                    slug: true,
                    coverImage: true,
                    instructorName: true,
                    instructorImage: true,
                    googleMeetLink: true,
                    startDate: true,
                    endDate: true,
                    totalSessions: true,
                },
            },
        },
        orderBy: { createdAt: "desc" },
    });

    // Fetch offline batch orders separately
    const offlineBatchOrders = await prisma.offlineBatchOrder.findMany({
        where: {
            userId,
            ...(status && { paymentStatus: "PAID" }),
        },
        include: {
            batch: {
                select: {
                    id: true,
                    title: true,
                    slug: true,
                    thumbnail: true,
                    startDate: true,
                    endDate: true,
                    pricingType: true,
                    city: true,
                },
            },
        },
        orderBy: { createdAt: "desc" },
    });

    // Fetch bundle orders separately
    const bundleOrders = await prisma.bundleOrder.findMany({
        where: {
            userId,
            ...(status && { paymentStatus: "PAID" }),
        },
        include: {
            bundle: {
                select: {
                    id: true,
                    title: true,
                    slug: true,
                    thumbnail: true,
                    price: true,
                    salePrice: true,
                },
            },
            order: {
                select: {
                    id: true,
                    couponCode: true,
                    discountAmount: true,
                },
            },
        },
        orderBy: { createdAt: "desc" },
    });

    // Filter by type if specified
    let filteredOrders = orders;
    if (type === "purchased") {
        filteredOrders = orders.filter((o) => o.status === "COMPLETED" && o.finalAmount > 0);
    } else if (type === "free") {
        filteredOrders = orders.filter((o) => o.status === "COMPLETED" && o.finalAmount === 0);
    } else if (type === "enrolled") {
        filteredOrders = orders.filter((o) => o.status === "COMPLETED" && o.orderType === "WEBINAR");
    }

    // Add image URLs and format data
    const ordersWithUrls = filteredOrders.map((order) => {
        // Find guidance orders linked to this order
        const linkedGuidanceOrders = guidanceOrders.filter(go => go.paymentId === order.id);
        // Find mentorship orders linked to this order
        const linkedMentorshipOrders = mentorshipOrders.filter(mo => mo.paymentId === order.id);
        // Find course orders linked to this order
        const linkedCourseOrders = courseOrders.filter(co => co.orderId === order.id);
        // Find offline batch orders linked to this order
        const linkedOfflineBatchOrders = offlineBatchOrders.filter(bo => bo.orderId === order.id);
        // Find bundle orders linked to this order
        const linkedBundleOrders = bundleOrders.filter(bo => bo.orderId === order.id);

        return {
            ...order,
            couponCode: order.couponCode || null, // Ensure couponCode is included
            items: order.items.map((item) => ({
                ...item,
                ebook: {
                    ...item.ebook,
                    image1Url: item.ebook.image1 ? getPublicUrl(item.ebook.image1) : null,
                    pdfUrl: item.ebook.pdfFile ? getPublicUrl(item.ebook.pdfFile) : null,
                },
            })),
            subscriptions: order.subscriptions ? order.subscriptions.map((sub) => ({
                ...sub,
                plan: {
                    ...sub.plan,
                },
            })) : [],
            webinarOrders: type === "all" || type === "webinar" || type === "enrolled"
                ? webinarOrders
                    .filter(wo => wo.paymentId === order.id && (!status || wo.paymentId))
                    .map(wo => ({
                        ...wo,
                        webinar: {
                            ...wo.webinar,
                            imageUrl: wo.webinar.image ? getPublicUrl(wo.webinar.image) : null,
                        },
                    }))
                : [],
            guidanceOrders: (type === "all" || type === "guidance")
                ? linkedGuidanceOrders
                    .filter(go => !status || go.paymentStatus === "PAID")
                    .map(go => ({
                        ...go,
                        guidance: {
                            ...go.guidance,
                            expertImageUrl: go.guidance.expertImage ? getPublicUrl(go.guidance.expertImage) : null,
                        },
                    }))
                : [],
            mentorshipOrders: (type === "all" || type === "mentorship")
                ? linkedMentorshipOrders
                    .filter(mo => !status || mo.paymentStatus === "PAID")
                    .map(mo => ({
                        ...mo,
                        mentorship: {
                            ...mo.mentorship,
                            coverImageUrl: mo.mentorship.coverImage ? getPublicUrl(mo.mentorship.coverImage) : null,
                            instructorImageUrl: mo.mentorship.instructorImage ? getPublicUrl(mo.mentorship.instructorImage) : null,
                        },
                    }))
                : [],
            courseOrders: (type === "all" || type === "course" || type === "courses")
                ? linkedCourseOrders
                    .filter(co => !status || co.paymentStatus === "PAID")
                    .map(co => ({
                        ...co,
                        course: {
                            ...co.course,
                            coverImageUrl: co.course.coverImage ? getPublicUrl(co.course.coverImage) : null,
                        },
                    }))
                : [],
            offlineBatchOrders: (type === "all" || type === "offlineBatch")
                ? linkedOfflineBatchOrders
                    .filter(bo => !status || bo.paymentStatus === "PAID")
                    .map(bo => ({
                        ...bo,
                        batch: {
                            ...bo.batch,
                            thumbnailUrl: bo.batch.thumbnail ? getPublicUrl(bo.batch.thumbnail) : null,
                        },
                    }))
                : [],
            bundleOrders: (type === "all" || type === "bundle")
                ? linkedBundleOrders
                    .filter(bo => !status || bo.paymentStatus === "PAID")
                    .map(bo => {
                        // Get course orders linked to this bundle order
                        const bundleCourseOrders = linkedCourseOrders.filter(co =>
                            co.orderId === order.id && co.paymentMode === 'BUNDLE'
                        );

                        return {
                            ...bo,
                            bundle: {
                                ...bo.bundle,
                                thumbnailUrl: bo.bundle.thumbnail ? getPublicUrl(bo.bundle.thumbnail) : null,
                            },
                            couponCode: bo.order?.couponCode || null, // Include coupon code from linked order
                            courseOrders: bundleCourseOrders.map(co => ({
                                ...co,
                                course: {
                                    ...co.course,
                                    coverImageUrl: co.course.coverImage ? getPublicUrl(co.course.coverImage) : null,
                                },
                            })),
                        };
                    })
                : [],
        };
    });

    // For guidance type, return standalone guidance orders (not linked to any order) as separate entries
    if (type === "guidance") {
        const orderIdsSet = new Set(orderIds);
        const standaloneGuidanceOrders = guidanceOrders
            .filter(go => !go.paymentId || !orderIdsSet.has(go.paymentId))
            .filter(go => !status || go.paymentStatus === "PAID")
            .map(go => ({
                id: go.id,
                orderNumber: go.paymentId ? `GUID-${go.id.slice(0, 8).toUpperCase()}` : `GUID-${go.id.slice(0, 8).toUpperCase()}`,
                orderType: "GUIDANCE",
                status: go.paymentStatus === "PAID" ? "COMPLETED" : "PENDING",
                paymentStatus: go.paymentStatus,
                totalAmount: go.amountPaid,
                finalAmount: go.amountPaid,
                createdAt: go.createdAt,
                items: [],
                subscriptions: [],
                webinarOrders: [],
                guidanceOrders: [{
                    ...go,
                    guidance: {
                        ...go.guidance,
                        expertImageUrl: go.guidance.expertImage ? getPublicUrl(go.guidance.expertImage) : null,
                    },
                }],
            }));

        // Combine orders with guidance orders and standalone guidance orders
        const allGuidanceOrders = [
            ...ordersWithUrls.filter(o => o.orderType === "GUIDANCE"),
            ...standaloneGuidanceOrders
        ];

        return res.status(200).json(
            new ApiResponsive(200, { orders: allGuidanceOrders }, "Orders fetched successfully")
        );
    }

    // For mentorship type, return standalone mentorship orders (not linked to any order) as separate entries
    if (type === "mentorship") {
        const orderIdsSet = new Set(orderIds);
        const standaloneMentorshipOrders = mentorshipOrders
            .filter(mo => !mo.paymentId || !orderIdsSet.has(mo.paymentId))
            .filter(mo => !status || mo.paymentStatus === "PAID")
            .map(mo => ({
                id: mo.id,
                orderNumber: mo.paymentId ? `MENT-${mo.id.slice(0, 8).toUpperCase()}` : `MENT-${mo.id.slice(0, 8).toUpperCase()}`,
                orderType: "MENTORSHIP",
                status: mo.paymentStatus === "PAID" ? "COMPLETED" : "PENDING",
                paymentStatus: mo.paymentStatus,
                totalAmount: mo.amountPaid,
                finalAmount: mo.amountPaid,
                createdAt: mo.createdAt,
                items: [],
                subscriptions: [],
                webinarOrders: [],
                guidanceOrders: [],
                mentorshipOrders: [{
                    ...mo,
                    mentorship: {
                        ...mo.mentorship,
                        coverImageUrl: mo.mentorship.coverImage ? getPublicUrl(mo.mentorship.coverImage) : null,
                        instructorImageUrl: mo.mentorship.instructorImage ? getPublicUrl(mo.mentorship.instructorImage) : null,
                    },
                }],
            }));

        // Combine orders with mentorship orders and standalone mentorship orders
        const allMentorshipOrders = [
            ...ordersWithUrls.filter(o => o.orderType === "MENTORSHIP"),
            ...standaloneMentorshipOrders
        ];

        return res.status(200).json(
            new ApiResponsive(200, { orders: allMentorshipOrders }, "Orders fetched successfully")
        );
    }

    // For "all" type, include standalone mentorship orders, course orders, and guidance orders
    const orderIdsSet = new Set(orderIds);

    // Get standalone guidance orders
    const standaloneGuidanceOrders = guidanceOrders
        .filter(go => !go.paymentId || !orderIdsSet.has(go.paymentId))
        .filter(go => !status || go.paymentStatus === "PAID")
        .map(go => ({
            id: go.id,
            orderNumber: go.paymentId ? `GUID-${go.id.slice(0, 8).toUpperCase()}` : `GUID-${go.id.slice(0, 8).toUpperCase()}`,
            orderType: "GUIDANCE",
            status: go.paymentStatus === "PAID" ? "COMPLETED" : "PENDING",
            paymentStatus: go.paymentStatus,
            totalAmount: go.amountPaid,
            finalAmount: go.amountPaid,
            createdAt: go.createdAt,
            items: [],
            subscriptions: [],
            webinarOrders: [],
            guidanceOrders: [{
                ...go,
                guidance: {
                    ...go.guidance,
                    expertImageUrl: go.guidance.expertImage ? getPublicUrl(go.guidance.expertImage) : null,
                },
            }],
            mentorshipOrders: [],
            courseOrders: [],
        }));

    // Get standalone mentorship orders
    const standaloneMentorshipOrders = mentorshipOrders
        .filter(mo => !mo.paymentId || !orderIdsSet.has(mo.paymentId))
        .filter(mo => !status || mo.paymentStatus === "PAID")
        .map(mo => ({
            id: mo.id,
            orderNumber: mo.paymentId ? `MENT-${mo.id.slice(0, 8).toUpperCase()}` : `MENT-${mo.id.slice(0, 8).toUpperCase()}`,
            orderType: "MENTORSHIP",
            status: mo.paymentStatus === "PAID" ? "COMPLETED" : "PENDING",
            paymentStatus: mo.paymentStatus,
            totalAmount: mo.amountPaid,
            finalAmount: mo.amountPaid,
            createdAt: mo.createdAt,
            items: [],
            subscriptions: [],
            webinarOrders: [],
            guidanceOrders: [],
            mentorshipOrders: [{
                ...mo,
                mentorship: {
                    ...mo.mentorship,
                    coverImageUrl: mo.mentorship.coverImage ? getPublicUrl(mo.mentorship.coverImage) : null,
                    instructorImageUrl: mo.mentorship.instructorImage ? getPublicUrl(mo.mentorship.instructorImage) : null,
                },
            }],
            courseOrders: [],
        }));

    // Get standalone course orders
    // Separate bundle course orders from direct course orders
    const bundleCourseOrders = courseOrders.filter(co => co.paymentMode === 'BUNDLE');
    const directCourseOrders = courseOrders.filter(co => co.paymentMode !== 'BUNDLE');

    const standaloneCourseOrders = directCourseOrders
        .filter(co => !co.orderId || !orderIdsSet.has(co.orderId))
        .filter(co => !status || co.paymentStatus === "PAID")
        .map(co => ({
            id: co.id,
            orderNumber: co.orderId ? `COURSE-${co.id.slice(0, 8).toUpperCase()}` : `COURSE-${co.id.slice(0, 8).toUpperCase()}`,
            orderType: "COURSE",
            status: co.paymentStatus === "PAID" ? "COMPLETED" : "PENDING",
            paymentStatus: co.paymentStatus,
            totalAmount: co.amountPaid,
            finalAmount: co.amountPaid,
            createdAt: co.createdAt,
            items: [],
            subscriptions: [],
            webinarOrders: [],
            guidanceOrders: [],
            mentorshipOrders: [],
            courseOrders: [{
                ...co,
                course: {
                    ...co.course,
                    coverImageUrl: co.course.coverImage ? getPublicUrl(co.course.coverImage) : null,
                },
            }],
        }));

    // Bundle course orders should be included in bundle orders, not as separate course orders
    // They are already linked to bundle orders via orderId

    // Get standalone webinar orders (not linked to any order)
    const standaloneWebinarOrders = webinarOrders
        .filter(wo => !wo.paymentId || !orderIdsSet.has(wo.paymentId))
        .filter(wo => !status || wo.paymentId)
        .map(wo => ({
            id: wo.id,
            orderNumber: wo.paymentId ? `WEB-${wo.id.slice(0, 8).toUpperCase()}` : `WEB-${wo.id.slice(0, 8).toUpperCase()}`,
            orderType: "WEBINAR",
            status: wo.paymentId ? "COMPLETED" : "PENDING",
            paymentStatus: wo.paymentId ? "PAID" : wo.paymentMode === "FREE" ? "FREE" : "PENDING",
            totalAmount: wo.amountPaid,
            finalAmount: wo.amountPaid,
            createdAt: wo.createdAt,
            items: [],
            subscriptions: [],
            webinarOrders: [{
                ...wo,
                webinar: {
                    ...wo.webinar,
                    imageUrl: wo.webinar.image ? getPublicUrl(wo.webinar.image) : null,
                },
            }],
            guidanceOrders: [],
            mentorshipOrders: [],
            courseOrders: [],
        }));

    // Get standalone offline batch orders
    const standaloneOfflineBatchOrders = offlineBatchOrders
        .filter(bo => !bo.orderId || !orderIdsSet.has(bo.orderId))
        .filter(bo => !status || bo.paymentStatus === "PAID")
        .map(bo => ({
            id: bo.id,
            orderNumber: bo.orderId ? `BATCH-${bo.id.slice(0, 8).toUpperCase()}` : `BATCH-${bo.id.slice(0, 8).toUpperCase()}`,
            orderType: "OFFLINE_BATCH",
            status: bo.paymentStatus === "PAID" ? "COMPLETED" : "PENDING",
            paymentStatus: bo.paymentStatus,
            totalAmount: bo.amountPaid,
            finalAmount: bo.amountPaid,
            createdAt: bo.createdAt,
            items: [],
            subscriptions: [],
            webinarOrders: [],
            guidanceOrders: [],
            mentorshipOrders: [],
            courseOrders: [],
            offlineBatchOrders: [{
                ...bo,
                batch: {
                    ...bo.batch,
                    thumbnailUrl: bo.batch.thumbnail ? getPublicUrl(bo.batch.thumbnail) : null,
                },
            }],
            bundleOrders: [],
        }));

    // Get standalone bundle orders
    const standaloneBundleOrders = bundleOrders
        .filter(bo => !bo.orderId || !orderIdsSet.has(bo.orderId))
        .filter(bo => !status || bo.paymentStatus === "PAID")
        .map(bo => ({
            id: bo.id,
            orderNumber: bo.orderId ? `BND-${bo.id.slice(0, 8).toUpperCase()}` : `BND-${bo.id.slice(0, 8).toUpperCase()}`,
            orderType: "BUNDLE",
            status: bo.paymentStatus === "PAID" ? "COMPLETED" : "PENDING",
            paymentStatus: bo.paymentStatus,
            totalAmount: bo.amountPaid,
            finalAmount: bo.amountPaid,
            couponCode: bo.order?.couponCode || null, // Include coupon code from linked order
            discountAmount: bo.order?.discountAmount || 0,
            createdAt: bo.createdAt,
            items: [],
            subscriptions: [],
            webinarOrders: [],
            guidanceOrders: [],
            mentorshipOrders: [],
            courseOrders: [],
            offlineBatchOrders: [],
            bundleOrders: [{
                ...bo,
                bundle: {
                    ...bo.bundle,
                    thumbnailUrl: bo.bundle.thumbnail ? getPublicUrl(bo.bundle.thumbnail) : null,
                },
            }],
        }));

    return res.status(200).json(
        new ApiResponsive(200, {
            orders: [
                ...ordersWithUrls,
                ...standaloneWebinarOrders,
                ...standaloneGuidanceOrders,
                ...standaloneMentorshipOrders,
                ...standaloneCourseOrders,
                ...standaloneOfflineBatchOrders,
                ...standaloneBundleOrders
            ]
        }, "Orders fetched successfully")
    );
});

/**
 * Create review for e-book
 */
/**
 * Get all orders (Admin only)
 */
export const getAllOrders = asyncHandler(async (req, res) => {
    const { status, type, page = 1, limit = 50, search } = req.query;
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    const where = {};

    if (status) {
        where.status = status.toUpperCase();
    }

    if (type && type !== "all") {
        where.orderType = type.toUpperCase();
    }

    if (search) {
        where.OR = [
            { orderNumber: { contains: search, mode: "insensitive" } },
            { user: { name: { contains: search, mode: "insensitive" } } },
            { user: { email: { contains: search, mode: "insensitive" } } },
        ];
    }

    const [orders, total] = await Promise.all([
        prisma.order.findMany({
            where,
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
                                image1: true,
                                price: true,
                                salePrice: true,
                            },
                        },
                    },
                },
                subscriptions: {
                    include: {
                        plan: {
                            select: {
                                id: true,
                                planType: true,
                                price: true,
                            },
                        },
                    },
                },
            },
            orderBy: { createdAt: "desc" },
            skip,
            take: limitNum,
        }),
        prisma.order.count({ where }),
    ]);

    // Get all webinar orders
    const webinarOrders = await prisma.webinarOrderItem.findMany({
        include: {
            user: {
                select: {
                    id: true,
                    name: true,
                    email: true,
                    phone: true,
                },
            },
            webinar: {
                select: {
                    id: true,
                    title: true,
                    slug: true,
                    image: true,
                    price: true,
                    salePrice: true,
                },
            },
        },
        orderBy: { createdAt: "desc" },
    });

    // Get all guidance orders
    const guidanceOrders = await prisma.guidanceOrder.findMany({
        include: {
            user: {
                select: {
                    id: true,
                    name: true,
                    email: true,
                    phone: true,
                },
            },
            guidance: {
                select: {
                    id: true,
                    title: true,
                    slug: true,
                    expertName: true,
                    price: true,
                },
            },
            slot: {
                select: {
                    id: true,
                    date: true,
                    startTime: true,
                    endTime: true,
                },
            },
        },
        orderBy: { createdAt: "desc" },
    });

    // Get all mentorship orders
    const mentorshipOrders = await prisma.mentorshipOrder.findMany({
        include: {
            user: {
                select: {
                    id: true,
                    name: true,
                    email: true,
                    phone: true,
                },
            },
            mentorship: {
                select: {
                    id: true,
                    title: true,
                    slug: true,
                    coverImage: true,
                    price: true,
                    salePrice: true,
                },
            },
        },
        orderBy: { createdAt: "desc" },
    });

    // Get all course orders
    const courseOrders = await prisma.courseOrder.findMany({
        include: {
            user: {
                select: {
                    id: true,
                    name: true,
                    email: true,
                    phone: true,
                },
            },
            course: {
                select: {
                    id: true,
                    title: true,
                    slug: true,
                    coverImage: true,
                    price: true,
                    salePrice: true,
                },
            },
        },
        orderBy: { createdAt: "desc" },
    });

    // Get all offline batch orders
    const offlineBatchOrders = await prisma.offlineBatchOrder.findMany({
        include: {
            user: {
                select: {
                    id: true,
                    name: true,
                    email: true,
                    phone: true,
                },
            },
            batch: {
                select: {
                    id: true,
                    title: true,
                    slug: true,
                    thumbnail: true,
                    price: true,
                    salePrice: true,
                },
            },
            order: {
                select: {
                    id: true,
                    couponCode: true,
                    discountAmount: true,
                    totalAmount: true,
                },
            },
        },
        orderBy: { createdAt: "desc" },
    });

    // Get all bundle orders with courses
    const bundleOrders = await prisma.bundleOrder.findMany({
        include: {
            user: {
                select: {
                    id: true,
                    name: true,
                    email: true,
                    phone: true,
                },
            },
            bundle: {
                select: {
                    id: true,
                    title: true,
                    slug: true,
                    thumbnail: true,
                    price: true,
                    salePrice: true,
                    courses: {
                        include: {
                            course: {
                                select: {
                                    id: true,
                                    title: true,
                                    slug: true,
                                    coverImage: true,
                                    price: true,
                                    salePrice: true,
                                },
                            },
                        },
                    },
                },
            },
            order: {
                select: {
                    id: true,
                    couponCode: true,
                    discountAmount: true,
                },
            },
        },
        orderBy: { createdAt: "desc" },
    });

    // Format orders with URLs
    const ordersWithUrls = orders.map((order) => ({
        ...order,
        items: order.items.map((item) => ({
            ...item,
            ebook: {
                ...item.ebook,
                image1Url: item.ebook.image1 ? getPublicUrl(item.ebook.image1) : null,
            },
        })),
    }));

    // Format webinar orders
    const webinarOrdersWithUrls = webinarOrders.map((wo) => ({
        ...wo,
        webinar: {
            ...wo.webinar,
            imageUrl: wo.webinar.image ? getPublicUrl(wo.webinar.image) : null,
        },
    }));

    // Format guidance orders
    const guidanceOrdersWithUrls = guidanceOrders.map((go) => ({
        ...go,
        guidance: {
            ...go.guidance,
        },
    }));

    // Format mentorship orders
    const mentorshipOrdersWithUrls = mentorshipOrders.map((mo) => ({
        ...mo,
        mentorship: {
            ...mo.mentorship,
            coverImageUrl: mo.mentorship.coverImage ? getPublicUrl(mo.mentorship.coverImage) : null,
        },
    }));

    // Format course orders - exclude bundle-linked course orders
    const standaloneCourseOrders = courseOrders.filter(co => co.paymentMode !== 'BUNDLE');
    const courseOrdersWithUrls = standaloneCourseOrders.map((co) => ({
        ...co,
        course: {
            ...co.course,
            coverImageUrl: co.course.coverImage ? getPublicUrl(co.course.coverImage) : null,
        },
    }));

    // Format offline batch orders
    const offlineBatchOrdersWithUrls = offlineBatchOrders.map((obo) => ({
        ...obo,
        batch: {
            ...obo.batch,
            thumbnailUrl: obo.batch.thumbnail ? getPublicUrl(obo.batch.thumbnail) : null,
        },
        couponCode: obo.order?.couponCode || null,
        discountAmount: obo.order?.discountAmount || 0,
        totalAmount: obo.order?.totalAmount || obo.amountPaid || 0,
    }));

    // Format bundle orders with courses
    const bundleOrdersWithUrls = bundleOrders.map((bo) => ({
        ...bo,
        bundle: {
            ...bo.bundle,
            thumbnailUrl: bo.bundle.thumbnail ? getPublicUrl(bo.bundle.thumbnail) : null,
            courses: bo.bundle.courses?.map(bc => ({
                ...bc.course,
                coverImageUrl: bc.course.coverImage ? getPublicUrl(bc.course.coverImage) : null,
            })) || [],
        },
        couponCode: bo.order?.couponCode || null,
        discountAmount: bo.order?.discountAmount || 0,
    }));

    return res.status(200).json(
        new ApiResponsive(200, {
            orders: ordersWithUrls,
            webinarOrders: webinarOrdersWithUrls,
            guidanceOrders: guidanceOrdersWithUrls,
            mentorshipOrders: mentorshipOrdersWithUrls,
            courseOrders: courseOrdersWithUrls,
            offlineBatchOrders: offlineBatchOrdersWithUrls,
            bundleOrders: bundleOrdersWithUrls,
            pagination: {
                page: pageNum,
                limit: limitNum,
                total,
                pages: Math.ceil(total / limitNum),
            },
        }, "All orders fetched successfully")
    );
});

export const createReview = asyncHandler(async (req, res) => {
    const { ebookId, rating, comment } = req.body;
    const userId = req.user.id;

    if (!ebookId || !rating || rating < 1 || rating > 5) {
        throw new ApiError(400, "E-book ID and rating (1-5) are required");
    }

    // Check if user owns the e-book
    const order = await prisma.order.findFirst({
        where: {
            userId,
            status: "COMPLETED",
            items: {
                some: {
                    ebookId,
                },
            },
        },
    });

    if (!order) {
        throw new ApiError(403, "You must purchase this e-book before reviewing");
    }

    // Check if review already exists
    const existingReview = await prisma.review.findUnique({
        where: {
            userId_ebookId: {
                userId,
                ebookId,
            },
        },
    });

    if (existingReview) {
        throw new ApiError(400, "You have already reviewed this e-book");
    }

    const review = await prisma.review.create({
        data: {
            userId,
            ebookId,
            rating: parseInt(rating),
            comment: comment || null,
        },
        include: {
            user: {
                select: {
                    id: true,
                    name: true,
                    avatar: true,
                },
            },
        },
    });

    const reviewWithAvatar = {
        ...review,
        user: {
            ...review.user,
            avatarUrl: review.user.avatar ? getPublicUrl(review.user.avatar) : null,
        },
    };

    return res.status(201).json(
        new ApiResponsive(201, { review: reviewWithAvatar }, "Review created successfully")
    );
});

/**
 * Create webinar order
 */
export const createWebinarOrder = asyncHandler(async (req, res) => {
    const { webinarIds, couponCode } = req.body;
    const userId = req.user.id;

    if (!webinarIds || !Array.isArray(webinarIds) || webinarIds.length === 0) {
        throw new ApiError(400, "Webinar IDs are required");
    }

    // Get webinars
    const webinars = await prisma.webinar.findMany({
        where: {
            id: { in: webinarIds },
            isPublished: true,
        },
    });

    if (webinars.length !== webinarIds.length) {
        throw new ApiError(400, "Some webinars are not available");
    }

    // Check if user already enrolled
    const existingEnrollments = await prisma.webinarOrderItem.findMany({
        where: {
            userId,
            webinarId: { in: webinarIds },
        },
    });

    const enrolledWebinarIds = new Set(existingEnrollments.map(e => e.webinarId));
    const newWebinarIds = webinarIds.filter(id => !enrolledWebinarIds.has(id));

    if (newWebinarIds.length === 0) {
        throw new ApiError(400, "You are already enrolled in all selected webinars");
    }

    const newWebinars = webinars.filter(w => newWebinarIds.includes(w.id));

    // Check seat availability
    for (const webinar of newWebinars) {
        if (webinar.seatType === "LIMITED" && webinar.maxSeats) {
            const enrolledCount = await prisma.webinarOrderItem.count({
                where: {
                    webinarId: webinar.id,
                },
            });
            if (enrolledCount >= webinar.maxSeats) {
                throw new ApiError(400, `${webinar.title} is full. No more seats available.`);
            }
        }
    }

    // Calculate totals with flash sale pricing
    let totalAmount = 0;
    const webinarOrders = [];

    for (const webinar of newWebinars) {
        // Get flash sale pricing if available
        const pricing = await getItemPricing('WEBINAR', webinar.id, webinar.price, webinar.salePrice);
        const price = webinar.isFree ? 0 : pricing.effectivePrice;
        totalAmount += price;
        webinarOrders.push({
            webinarId: webinar.id,
            amountPaid: price,
            paymentMode: webinar.isFree ? "FREE" : null,
        });
    }

    // Apply coupon if provided
    let discountAmount = 0;
    let coupon = null;
    if (couponCode) {
        coupon = await prisma.coupon.findFirst({
            where: {
                code: couponCode.toUpperCase(),
                isActive: true,
                validFrom: { lte: new Date() },
                validUntil: { gte: new Date() },
                OR: [
                    { applicableTo: "ALL" },
                    { applicableTo: "WEBINAR" },
                ],
            },
        });

        if (coupon) {
            if (coupon.usageLimit && coupon.usedCount >= coupon.usageLimit) {
                throw new ApiError(400, "Coupon usage limit exceeded");
            }

            if (coupon.discountType === "PERCENTAGE") {
                discountAmount = (totalAmount * coupon.discountValue) / 100;
                if (coupon.maxDiscount) {
                    discountAmount = Math.min(discountAmount, coupon.maxDiscount);
                }
            } else {
                discountAmount = coupon.discountValue;
            }

            if (coupon.minAmount && totalAmount < coupon.minAmount) {
                throw new ApiError(400, `Minimum order amount is ₹${coupon.minAmount}`);
            }
        } else {
            throw new ApiError(400, "Invalid coupon code");
        }
    }

    const finalAmount = Math.max(0, totalAmount - discountAmount);

    // If all free, create orders directly
    if (finalAmount === 0) {
        const orders = [];
        for (const orderData of webinarOrders) {
            const order = await prisma.webinarOrderItem.create({
                data: {
                    ...orderData,
                    userId,
                },
                include: {
                    webinar: true,
                    user: true,
                },
            });
            orders.push(order);
        }

        // Update coupon usage
        if (coupon) {
            await prisma.coupon.update({
                where: { id: coupon.id },
                data: { usedCount: { increment: 1 } },
            });
        }

        // Send email notifications
        try {
            const adminEmail = process.env.ADMIN_EMAIL || process.env.FROM_EMAIL;
            const user = orders[0].user;
            const webinar = orders[0].webinar;
            const webinarTitles = orders.map(o => o.webinar.title).join(', ');

            // Admin notification
            await sendEmail({
                email: adminEmail,
                subject: `New Webinar Enrollment - ${user.name}`,
                html: getAdminNotificationTemplate({
                    type: 'webinar',
                    orderNumber: 'FREE',
                    customerName: user.name,
                    customerEmail: user.email,
                    customerPhone: user.phone,
                    itemName: webinarTitles,
                    amount: 0,
                    dashboardUrl: `${process.env.CLIENT_URL || 'http://localhost:3000'}/admin/webinars`,
                }),
            });

            // User confirmation
            await sendEmail({
                email: user.email,
                subject: `Webinar Enrollment Confirmed - ${webinar.title}`,
                html: getWebinarBookingTemplate({
                    userName: user.name,
                    webinarTitle: webinar.title,
                    scheduledAt: webinar?.startDate ? new Date(webinar.startDate).toLocaleString('en-IN', { dateStyle: 'long', timeStyle: 'short' }) : 'TBA',
                    duration: webinar?.duration || 60,
                    meetLink: null,
                }),
            });
        } catch (emailError) {
            console.error("Error sending enrollment emails:", emailError);
        }

        return res.status(201).json(
            new ApiResponsive(201, { orders }, "Enrollment completed successfully")
        );
    }

    // Create Razorpay order for paid webinars
    const orderNumber = `WEB-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
    const razorpayOrder = await createRazorpayOrder(finalAmount, "INR", orderNumber);

    // Create Order record
    const order = await prisma.order.create({
        data: {
            userId,
            orderNumber,
            orderType: "WEBINAR",
            totalAmount,
            discountAmount,
            finalAmount,
            status: "PENDING",
            paymentStatus: "PENDING",
            razorpayOrderId: razorpayOrder.id,
            couponCode: couponCode || null,
        },
    });

    // Store webinar order items temporarily (will be created after payment)
    // For now, we'll create them and link to order later
    const createdOrders = [];
    for (const orderData of webinarOrders) {
        const webinarOrder = await prisma.webinarOrderItem.create({
            data: {
                ...orderData,
                userId,
                paymentId: order.id, // Temporary link
            },
            include: {
                webinar: true,
            },
        });
        createdOrders.push(webinarOrder);
    }

    return res.status(201).json(
        new ApiResponsive(
            201,
            {
                order,
                webinarOrders: createdOrders,
                razorpayOrder: {
                    id: razorpayOrder.id,
                    amount: razorpayOrder.amount,
                    currency: razorpayOrder.currency,
                    key: process.env.RAZORPAY_KEY_ID,
                },
            },
            "Order created successfully"
        )
    );
});

/**
 * Create guidance order (slot booking)
 */
export const createGuidanceOrder = asyncHandler(async (req, res) => {
    const { slotId, couponCode } = req.body;
    const userId = req.user.id;

    if (!slotId) {
        throw new ApiError(400, "Slot ID is required");
    }

    // Get slot with guidance
    const slot = await prisma.guidanceSlot.findUnique({
        where: { id: slotId },
        include: {
            guidance: true,
            order: true,
        },
    });

    if (!slot) {
        throw new ApiError(404, "Slot not found");
    }

    if (slot.guidance.status !== "ACTIVE") {
        throw new ApiError(400, "Guidance is not active");
    }

    // Check if slot is available (race condition prevention)
    if (slot.status !== "AVAILABLE" || slot.order) {
        throw new ApiError(400, "Slot is no longer available");
    }

    // Check if user already has a booking for this slot
    const existingOrder = await prisma.guidanceOrder.findFirst({
        where: {
            slotId,
            userId,
        },
    });

    if (existingOrder) {
        throw new ApiError(400, "You have already booked this slot");
    }

    // Get flash sale pricing (Guidance doesn't have salePrice)
    const pricing = await getItemPricing('GUIDANCE', slot.guidance.id, slot.guidance.price, null);
    const totalAmount = pricing.effectivePrice;

    // Apply coupon if provided
    let discountAmount = 0;
    let coupon = null;
    if (couponCode) {
        coupon = await prisma.coupon.findFirst({
            where: {
                code: couponCode.toUpperCase(),
                isActive: true,
                validFrom: { lte: new Date() },
                validUntil: { gte: new Date() },
                OR: [
                    { applicableTo: "ALL" },
                    { applicableTo: "GUIDANCE" },
                ],
            },
        });

        if (coupon) {
            if (coupon.usageLimit && coupon.usedCount >= coupon.usageLimit) {
                throw new ApiError(400, "Coupon usage limit exceeded");
            }

            if (coupon.discountType === "PERCENTAGE") {
                discountAmount = (totalAmount * coupon.discountValue) / 100;
                if (coupon.maxDiscount) {
                    discountAmount = Math.min(discountAmount, coupon.maxDiscount);
                }
            } else {
                discountAmount = coupon.discountValue;
            }

            if (coupon.minAmount && totalAmount < coupon.minAmount) {
                throw new ApiError(400, `Minimum order amount is ₹${coupon.minAmount}`);
            }
        } else {
            throw new ApiError(400, "Invalid coupon code");
        }
    }

    const finalAmount = Math.max(0, totalAmount - discountAmount);

    // Lock the slot immediately (transaction)
    const lockedSlot = await prisma.guidanceSlot.update({
        where: { id: slotId },
        data: { status: "BOOKED" },
    });

    if (!lockedSlot) {
        throw new ApiError(400, "Failed to lock slot");
    }

    // Create Razorpay order
    const orderNumber = `GUID-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
    const razorpayOrder = await createRazorpayOrder(finalAmount, "INR", orderNumber);

    // Create Order record
    const order = await prisma.order.create({
        data: {
            userId,
            orderNumber,
            orderType: "GUIDANCE",
            totalAmount,
            discountAmount,
            finalAmount,
            status: "PENDING",
            paymentStatus: "PENDING",
            razorpayOrderId: razorpayOrder.id,
            couponCode: couponCode || null,
        },
    });

    // Create GuidanceOrder (temporary, will be updated after payment)
    const guidanceOrder = await prisma.guidanceOrder.create({
        data: {
            guidanceId: slot.guidanceId,
            slotId,
            userId,
            amountPaid: finalAmount,
            paymentId: order.id, // Link to Order.id (will be updated to Razorpay payment ID after verification)
            paymentStatus: "CREATED",
            paymentMode: "RAZORPAY",
        },
        include: {
            guidance: true,
            slot: true,
        },
    });

    // Link GuidanceOrder to Order (update Order to include guidanceOrders relation)
    // Note: This is handled via the paymentId field which links to Order.id

    return res.status(201).json(
        new ApiResponsive(
            201,
            {
                order,
                guidanceOrder,
                razorpayOrder: {
                    id: razorpayOrder.id,
                    amount: razorpayOrder.amount,
                    currency: razorpayOrder.currency,
                    key: process.env.RAZORPAY_KEY_ID,
                },
            },
            "Order created successfully"
        )
    );
});

/**
 * Check guidance slot booking status
 */
export const checkGuidanceBooking = asyncHandler(async (req, res) => {
    const { slotId } = req.params;
    const userId = req.user.id;

    const order = await prisma.guidanceOrder.findFirst({
        where: {
            slotId,
            userId,
            paymentStatus: "PAID",
        },
        include: {
            slot: {
                include: {
                    guidance: {
                        select: {
                            id: true,
                            title: true,
                            expertName: true,
                        },
                    },
                },
            },
        },
    });

    if (!order) {
        return res.status(200).json(
            new ApiResponsive(200, {
                booked: false,
                canAccessLink: false,
                googleMeetLink: null,
            }, "No booking found")
        );
    }

    // Check if current time is within 10 minutes before slot start
    const now = new Date();
    const slotDate = new Date(order.slot.date);
    const [hours, minutes] = order.slot.startTime.split(":").map(Number);
    slotDate.setHours(hours, minutes, 0, 0);

    const tenMinutesBefore = new Date(slotDate.getTime() - 10 * 60 * 1000);
    const canAccessLink = now >= tenMinutesBefore;

    // Get Google Meet link from guidance (only if can access)
    const guidance = await prisma.guidance.findUnique({
        where: { id: order.guidanceId },
        select: { googleMeetLink: true },
    });

    return res.status(200).json(
        new ApiResponsive(200, {
            booked: true,
            canAccessLink,
            googleMeetLink: canAccessLink && guidance?.googleMeetLink
                ? guidance.googleMeetLink
                : null,
            slotDate: order.slot.date,
            startTime: order.slot.startTime,
            endTime: order.slot.endTime,
        }, "Booking status checked successfully")
    );
});

/**
 * Create mentorship order (enrollment)
 */
export const createMentorshipOrder = asyncHandler(async (req, res) => {
    const { mentorshipId, couponCode } = req.body;
    const userId = req.user.id;

    if (!mentorshipId) {
        throw new ApiError(400, "Mentorship ID is required");
    }

    // Get mentorship
    const mentorship = await prisma.liveMentorshipProgram.findUnique({
        where: { id: mentorshipId },
    });

    if (!mentorship) {
        throw new ApiError(404, "Mentorship program not found");
    }

    if (mentorship.status !== "PUBLISHED") {
        throw new ApiError(400, "Mentorship program is not published");
    }

    // Check if user is already enrolled
    const existingEnrollment = await prisma.mentorshipEnrollment.findUnique({
        where: {
            mentorshipId_userId: {
                mentorshipId,
                userId,
            },
        },
    });

    if (existingEnrollment) {
        throw new ApiError(400, "You are already enrolled in this program");
    }

    // Get flash sale pricing
    const pricing = await getItemPricing('MENTORSHIP', mentorship.id, mentorship.price, mentorship.salePrice);
    const totalAmount = mentorship.isFree ? 0 : pricing.effectivePrice;

    // Apply coupon if provided
    let discountAmount = 0;
    let coupon = null;
    if (couponCode && !mentorship.isFree) {
        coupon = await prisma.coupon.findFirst({
            where: {
                code: couponCode.toUpperCase(),
                isActive: true,
                validFrom: { lte: new Date() },
                validUntil: { gte: new Date() },
                OR: [
                    { applicableTo: "ALL" },
                    { applicableTo: "MENTORSHIP" },
                ],
            },
        });

        if (coupon) {
            if (coupon.usageLimit && coupon.usedCount >= coupon.usageLimit) {
                throw new ApiError(400, "Coupon usage limit exceeded");
            }

            if (coupon.discountType === "PERCENTAGE") {
                discountAmount = (totalAmount * coupon.discountValue) / 100;
                if (coupon.maxDiscount) {
                    discountAmount = Math.min(discountAmount, coupon.maxDiscount);
                }
            } else {
                discountAmount = coupon.discountValue;
            }

            if (coupon.minAmount && totalAmount < coupon.minAmount) {
                throw new ApiError(400, `Minimum order amount is ₹${coupon.minAmount}`);
            }
        } else {
            throw new ApiError(400, "Invalid coupon code");
        }
    }

    const finalAmount = Math.max(0, totalAmount - discountAmount);

    // If free, create enrollment directly
    if (mentorship.isFree || finalAmount === 0) {
        // Create enrollment
        await prisma.mentorshipEnrollment.create({
            data: {
                mentorshipId,
                userId,
            },
        });

        // Create free order
        const order = await prisma.order.create({
            data: {
                userId,
                orderNumber: `MENT-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`,
                orderType: "MENTORSHIP",
                totalAmount: 0,
                discountAmount: 0,
                finalAmount: 0,
                status: "COMPLETED",
                paymentStatus: "FREE",
                couponCode: couponCode || null,
            },
        });

        // Create mentorship order
        await prisma.mentorshipOrder.create({
            data: {
                mentorshipId,
                userId,
                amountPaid: 0,
                paymentId: order.id,
                paymentStatus: "PAID",
                paymentMode: "FREE",
            },
        });

        return res.status(201).json(
            new ApiResponsive(201, { order, enrollment: true }, "Enrollment completed successfully")
        );
    }

    // Create Razorpay order
    const orderNumber = `MENT-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
    const razorpayOrder = await createRazorpayOrder(finalAmount, "INR", orderNumber);

    // Create Order record
    const order = await prisma.order.create({
        data: {
            userId,
            orderNumber,
            orderType: "MENTORSHIP",
            totalAmount,
            discountAmount,
            finalAmount,
            status: "PENDING",
            paymentStatus: "PENDING",
            razorpayOrderId: razorpayOrder.id,
            couponCode: couponCode || null,
        },
    });

    // Create MentorshipOrder (temporary, will be updated after payment)
    const mentorshipOrder = await prisma.mentorshipOrder.create({
        data: {
            mentorshipId,
            userId,
            amountPaid: finalAmount,
            paymentId: order.id, // Link to Order.id
            paymentStatus: "CREATED",
            paymentMode: "RAZORPAY",
        },
        include: {
            mentorship: true,
        },
    });

    return res.status(201).json(
        new ApiResponsive(
            201,
            {
                order,
                mentorshipOrder,
                razorpayOrder: {
                    id: razorpayOrder.id,
                    amount: razorpayOrder.amount,
                    currency: razorpayOrder.currency,
                    key: process.env.RAZORPAY_KEY_ID,
                },
            },
            "Order created successfully"
        )
    );
});

/**
 * Create course order
 */
export const createCourseOrder = asyncHandler(async (req, res) => {
    const { courseId, couponCode } = req.body;
    const userId = req.user.id;

    if (!courseId) {
        throw new ApiError(400, "Course ID is required");
    }

    // Get course
    const course = await prisma.course.findUnique({
        where: { id: courseId },
    });

    if (!course) {
        throw new ApiError(404, "Course not found");
    }

    if (!course.isPublished) {
        throw new ApiError(400, "Course is not published");
    }

    // Check if user is already enrolled
    const existingEnrollment = await prisma.courseEnrollment.findUnique({
        where: {
            courseId_userId: {
                courseId,
                userId,
            },
        },
    });

    if (existingEnrollment) {
        throw new ApiError(400, "You are already enrolled in this course");
    }

    // Get flash sale pricing
    const pricing = await getItemPricing('COURSE', course.id, course.price, course.salePrice);
    const totalAmount = course.isFree ? 0 : pricing.effectivePrice;

    // Apply coupon if provided
    let discountAmount = 0;
    let coupon = null;
    if (couponCode && !course.isFree) {
        coupon = await prisma.coupon.findFirst({
            where: {
                code: couponCode.toUpperCase(),
                isActive: true,
                validFrom: { lte: new Date() },
                validUntil: { gte: new Date() },
                OR: [
                    { applicableTo: "ALL" },
                    { applicableTo: "COURSE" },
                ],
            },
        });

        if (coupon) {
            if (coupon.usageLimit && coupon.usedCount >= coupon.usageLimit) {
                throw new ApiError(400, "Coupon usage limit exceeded");
            }

            if (coupon.discountType === "PERCENTAGE") {
                discountAmount = (totalAmount * coupon.discountValue) / 100;
                if (coupon.maxDiscount) {
                    discountAmount = Math.min(discountAmount, coupon.maxDiscount);
                }
            } else {
                discountAmount = coupon.discountValue;
            }

            if (coupon.minAmount && totalAmount < coupon.minAmount) {
                throw new ApiError(400, `Minimum order amount is ₹${coupon.minAmount}`);
            }
        } else {
            throw new ApiError(400, "Invalid coupon code");
        }
    }

    const finalAmount = Math.max(0, totalAmount - discountAmount);

    // If free, create enrollment directly
    if (course.isFree || finalAmount === 0) {
        // Create enrollment
        await prisma.courseEnrollment.create({
            data: {
                courseId,
                userId,
            },
        });

        // Create free order
        const order = await prisma.order.create({
            data: {
                userId,
                orderNumber: `COURSE-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`,
                orderType: "COURSE",
                totalAmount: 0,
                discountAmount: 0,
                finalAmount: 0,
                status: "COMPLETED",
                paymentStatus: "FREE",
                couponCode: couponCode || null,
            },
        });

        // Create course order
        await prisma.courseOrder.create({
            data: {
                courseId,
                userId,
                orderId: order.id,
                amountPaid: 0,
                paymentStatus: "PAID",
                paymentMode: "FREE",
            },
        });

        // Update coupon usage
        if (coupon) {
            await prisma.coupon.update({
                where: { id: coupon.id },
                data: { usedCount: coupon.usedCount + 1 },
            });
        }

        return res.status(200).json(
            new ApiResponsive(
                200,
                {
                    order: {
                        ...order,
                        status: "COMPLETED",
                    },
                },
                "Course enrolled successfully"
            )
        );
    }

    // Create Razorpay order first
    const orderNumber = `COURSE-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
    const razorpayOrder = await createRazorpayOrder(
        finalAmount,
        "INR",
        orderNumber
    );

    // Create order for paid course
    const order = await prisma.order.create({
        data: {
            userId,
            orderNumber,
            orderType: "COURSE",
            totalAmount,
            discountAmount,
            finalAmount,
            status: "PENDING",
            paymentStatus: "PENDING",
            razorpayOrderId: razorpayOrder.id,
            couponCode: couponCode || null,
        },
    });

    // Create course order
    const courseOrder = await prisma.courseOrder.create({
        data: {
            courseId,
            userId,
            orderId: order.id,
            amountPaid: finalAmount,
            paymentStatus: "CREATED",
            paymentMode: "RAZORPAY",
        },
    });

    return res.status(200).json(
        new ApiResponsive(
            200,
            {
                order,
                courseOrder,
                razorpayOrder: {
                    id: razorpayOrder.id,
                    amount: razorpayOrder.amount,
                    currency: razorpayOrder.currency,
                    key: process.env.RAZORPAY_KEY_ID,
                },
            },
            "Order created successfully"
        )
    );
});

/**
 * Create offline batch order
 */
export const createOfflineBatchOrder = asyncHandler(async (req, res) => {
    const { batchId, couponCode } = req.body;
    const userId = req.user.id;

    if (!batchId) {
        throw new ApiError(400, "Batch ID is required");
    }

    // Get offline batch
    const batch = await prisma.offlineBatch.findUnique({
        where: { id: batchId },
    });

    if (!batch) {
        throw new ApiError(404, "Offline batch not found");
    }

    if (batch.status !== "OPEN") {
        throw new ApiError(400, "Batch is not open for enrollment");
    }

    // Check if batch is full
    if (!batch.isUnlimitedSeats && batch.seatLimit && batch.seatsFilled >= batch.seatLimit) {
        throw new ApiError(400, "Batch is full");
    }

    // Check if user is already enrolled
    const existingEnrollment = await prisma.offlineBatchEnrollment.findUnique({
        where: {
            batchId_userId: {
                batchId,
                userId,
            },
        },
    });

    if (existingEnrollment) {
        throw new ApiError(400, "You are already enrolled in this batch");
    }

    // Get flash sale pricing
    const pricing = await getItemPricing('OFFLINE_BATCH', batch.id, batch.price || 0, batch.salePrice);
    const totalAmount = (batch.isFree || batch.pricingType === 'FREE') ? 0 : pricing.effectivePrice;

    // Apply coupon if provided
    let discountAmount = 0;
    let coupon = null;
    if (couponCode && !batch.isFree && batch.pricingType !== 'FREE') {
        coupon = await prisma.coupon.findFirst({
            where: {
                code: couponCode.toUpperCase(),
                isActive: true,
                validFrom: { lte: new Date() },
                validUntil: { gte: new Date() },
                OR: [
                    { applicableTo: "ALL" },
                    { applicableTo: "OFFLINE_BATCH" },
                ],
            },
        });

        if (coupon) {
            if (coupon.usageLimit && coupon.usedCount >= coupon.usageLimit) {
                throw new ApiError(400, "Coupon usage limit exceeded");
            }

            if (coupon.discountType === "PERCENTAGE") {
                discountAmount = (totalAmount * coupon.discountValue) / 100;
                if (coupon.maxDiscount) {
                    discountAmount = Math.min(discountAmount, coupon.maxDiscount);
                }
            } else {
                discountAmount = coupon.discountValue;
            }

            if (coupon.minAmount && totalAmount < coupon.minAmount) {
                throw new ApiError(400, `Minimum order amount is ₹${coupon.minAmount}`);
            }
        } else {
            throw new ApiError(400, "Invalid coupon code");
        }
    }

    const finalAmount = Math.max(0, totalAmount - discountAmount);

    // If free, create enrollment directly
    if (batch.isFree || batch.pricingType === 'FREE' || finalAmount === 0) {
        // Create enrollment
        await prisma.offlineBatchEnrollment.create({
            data: {
                batchId,
                userId,
                paymentStatus: "PAID",
                amountPaid: 0,
                paymentMode: "FREE",
            },
        });

        // Update seats filled
        await prisma.offlineBatch.update({
            where: { id: batchId },
            data: {
                seatsFilled: { increment: 1 },
            },
        });

        // Create free order
        const order = await prisma.order.create({
            data: {
                userId,
                orderNumber: `OFFLINE_BATCH-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`,
                orderType: "OFFLINE_BATCH",
                totalAmount: 0,
                discountAmount: 0,
                finalAmount: 0,
                status: "COMPLETED",
                paymentStatus: "FREE",
                couponCode: couponCode || null,
            },
        });

        // Create offline batch order
        await prisma.offlineBatchOrder.create({
            data: {
                batchId,
                userId,
                orderId: order.id,
                amountPaid: 0,
                paymentStatus: "PAID",
                paymentMode: "FREE",
            },
        });

        // Update coupon usage
        if (coupon) {
            await prisma.coupon.update({
                where: { id: coupon.id },
                data: { usedCount: coupon.usedCount + 1 },
            });
        }

        return res.status(200).json(
            new ApiResponsive(
                200,
                {
                    order: {
                        ...order,
                        status: "COMPLETED",
                    },
                },
                "Batch enrolled successfully"
            )
        );
    }

    // Create Razorpay order first
    const orderNumber = `OFFLINE_BATCH-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
    const razorpayOrder = await createRazorpayOrder(
        finalAmount,
        "INR",
        orderNumber
    );

    // Create order for paid batch
    const order = await prisma.order.create({
        data: {
            userId,
            orderNumber,
            orderType: "OFFLINE_BATCH",
            totalAmount,
            discountAmount,
            finalAmount,
            status: "PENDING",
            paymentStatus: "PENDING",
            razorpayOrderId: razorpayOrder.id,
            couponCode: couponCode || null,
        },
    });

    // Create offline batch order
    const offlineBatchOrder = await prisma.offlineBatchOrder.create({
        data: {
            batchId,
            userId,
            orderId: order.id,
            amountPaid: finalAmount,
            paymentStatus: "CREATED",
            paymentMode: "RAZORPAY",
        },
    });

    return res.status(200).json(
        new ApiResponsive(
            200,
            {
                order,
                offlineBatchOrder,
                razorpayOrder: {
                    id: razorpayOrder.id,
                    amount: razorpayOrder.amount,
                    currency: razorpayOrder.currency,
                    key: process.env.RAZORPAY_KEY_ID,
                },
            },
            "Order created successfully"
        )
    );
});


/**
 * Initialize payment - creates ONLY Razorpay order (no DB order)
 * DB order is created only after payment verification
 */
export const initPayment = asyncHandler(async (req, res) => {
    const { items, couponCode } = req.body;

    if (!items || typeof items !== 'object') {
        throw new ApiError(400, "Items are required");
    }

    const {
        ebookIds = [],
        webinarIds = [],
        guidanceSlotIds = [],
        mentorshipIds = [],
        courseIds = [],
        offlineBatchIds = [],
        bundleIds = [],
    } = items;

    const totalItems = ebookIds.length + webinarIds.length + guidanceSlotIds.length +
        mentorshipIds.length + courseIds.length + offlineBatchIds.length + bundleIds.length;

    if (totalItems === 0) {
        throw new ApiError(400, "At least one item is required");
    }

    let totalAmount = 0;
    const itemDetails = {
        ebooks: [],
        webinars: [],
        guidanceSlots: [],
        mentorships: [],
        courses: [],
        offlineBatches: [],
        bundles: [],
    };

    // Calculate ebook totals
    if (ebookIds.length > 0) {
        const ebooks = await prisma.ebook.findMany({
            where: { id: { in: ebookIds }, isPublished: true },
        });

        for (const ebook of ebooks) {
            if (ebook.isFree) continue;

            const pricing = await getItemPricing('EBOOK', ebook.id, ebook.price, ebook.salePrice);
            totalAmount += pricing.effectivePrice;
            itemDetails.ebooks.push({
                id: ebook.id,
                title: ebook.title,
                price: ebook.price,
                effectivePrice: pricing.effectivePrice,
            });
        }
    }

    // Calculate webinar totals
    if (webinarIds.length > 0) {
        const webinars = await prisma.webinar.findMany({
            where: { id: { in: webinarIds }, isPublished: true },
        });

        for (const webinar of webinars) {
            if (webinar.isFree) continue;

            const pricing = await getItemPricing('WEBINAR', webinar.id, webinar.price, webinar.salePrice);
            totalAmount += pricing.effectivePrice;
            itemDetails.webinars.push({
                id: webinar.id,
                title: webinar.title,
                price: webinar.price,
                effectivePrice: pricing.effectivePrice,
            });
        }
    }

    // Calculate guidance totals
    if (guidanceSlotIds.length > 0) {
        for (const slotId of guidanceSlotIds) {
            const slot = await prisma.guidanceSlot.findUnique({
                where: { id: slotId },
                include: { guidance: true },
            });

            if (!slot || slot.status === 'BOOKED') continue;

            const pricing = await getItemPricing('GUIDANCE', slot.guidance.id, slot.guidance.price, slot.guidance.salePrice);
            totalAmount += pricing.effectivePrice;
            itemDetails.guidanceSlots.push({
                slotId: slot.id,
                guidanceId: slot.guidance.id,
                title: slot.guidance.title,
                price: slot.guidance.price,
                effectivePrice: pricing.effectivePrice,
            });
        }
    }

    // Calculate mentorship totals
    if (mentorshipIds.length > 0) {
        const mentorships = await prisma.liveMentorshipProgram.findMany({
            where: { id: { in: mentorshipIds }, status: "PUBLISHED" },
        });

        for (const mentorship of mentorships) {
            if (mentorship.isFree) continue;

            const pricing = await getItemPricing('MENTORSHIP', mentorship.id, mentorship.price, mentorship.salePrice);
            totalAmount += pricing.effectivePrice;
            itemDetails.mentorships.push({
                id: mentorship.id,
                title: mentorship.title,
                price: mentorship.price,
                effectivePrice: pricing.effectivePrice,
            });
        }
    }

    // Calculate course totals
    if (courseIds.length > 0) {
        const courses = await prisma.course.findMany({
            where: { id: { in: courseIds }, isPublished: true },
        });

        for (const course of courses) {
            if (course.isFree) continue;

            const pricing = await getItemPricing('COURSE', course.id, course.price, course.salePrice);
            totalAmount += pricing.effectivePrice;
            itemDetails.courses.push({
                id: course.id,
                title: course.title,
                price: course.price,
                effectivePrice: pricing.effectivePrice,
            });
        }
    }

    // Calculate offline batch totals
    if (offlineBatchIds.length > 0) {
        const batches = await prisma.offlineBatch.findMany({
            where: { id: { in: offlineBatchIds }, status: "OPEN" },
        });

        for (const batch of batches) {
            if (batch.isFree || batch.pricingType === 'FREE') continue;

            const pricing = await getItemPricing('OFFLINE_BATCH', batch.id, batch.price, batch.salePrice);
            totalAmount += pricing.effectivePrice;
            itemDetails.offlineBatches.push({
                id: batch.id,
                title: batch.title,
                price: batch.price,
                effectivePrice: pricing.effectivePrice,
            });
        }
    }

    // Calculate bundle totals
    if (bundleIds.length > 0) {
        const bundles = await prisma.bundle.findMany({
            where: { id: { in: bundleIds }, isPublished: true },
        });

        for (const bundle of bundles) {

            const pricing = await getItemPricing('BUNDLE', bundle.id, bundle.price, bundle.salePrice);
            totalAmount += pricing.effectivePrice;
            itemDetails.bundles.push({
                id: bundle.id,
                title: bundle.title,
                price: bundle.price,
                effectivePrice: pricing.effectivePrice,
            });
        }
    }

    // Apply coupon if provided
    let discountAmount = 0;
    let coupon = null;
    if (couponCode && totalAmount > 0) {
        coupon = await prisma.coupon.findFirst({
            where: {
                code: couponCode.toUpperCase(),
                isActive: true,
                validFrom: { lte: new Date() },
                validUntil: { gte: new Date() },
            },
        });

        if (coupon) {
            if (coupon.usageLimit && coupon.usedCount >= coupon.usageLimit) {
                throw new ApiError(400, "Coupon usage limit exceeded");
            }

            if (coupon.discountType === "PERCENTAGE" || coupon.type === "PERCENTAGE") {
                discountAmount = (totalAmount * coupon.discountValue) / 100;
                if (coupon.maxDiscount) {
                    discountAmount = Math.min(discountAmount, coupon.maxDiscount);
                }
            } else {
                discountAmount = coupon.discountValue;
            }

            if (coupon.minAmount && totalAmount < coupon.minAmount) {
                throw new ApiError(400, `Minimum order amount is ₹${coupon.minAmount}`);
            }
        }
    }

    const finalAmount = Math.max(0, totalAmount - discountAmount);

    // If everything is free, return immediately
    if (finalAmount === 0) {
        return res.status(200).json(
            new ApiResponsive(
                200,
                {
                    isFree: true,
                    totalAmount,
                    discountAmount,
                    finalAmount: 0,
                    itemDetails,
                    couponCode: coupon?.code || null,
                },
                "All items are free"
            )
        );
    }

    // Create ONLY Razorpay order (no DB order)
    const paymentRef = `PAY-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
    const razorpayOrder = await createRazorpayOrder(finalAmount, "INR", paymentRef);

    return res.status(200).json(
        new ApiResponsive(
            200,
            {
                isFree: false,
                totalAmount,
                discountAmount,
                finalAmount,
                itemDetails,
                couponCode: coupon?.code || null,
                paymentRef,
                razorpayOrder: {
                    id: razorpayOrder.id,
                    amount: razorpayOrder.amount,
                    currency: razorpayOrder.currency,
                    key: process.env.RAZORPAY_KEY_ID,
                },
            },
            "Payment initialized"
        )
    );
});

/**
 * Complete payment - creates DB order AFTER successful payment
 */
export const completePayment = asyncHandler(async (req, res) => {
    const { razorpayOrderId, paymentId, signature, items, couponCode } = req.body;
    const userId = req.user.id;
    const user = req.user;

    if (!razorpayOrderId || !paymentId || !signature) {
        throw new ApiError(400, "Payment details are required");
    }

    // Check if order with this payment already exists (idempotency check)
    // Check for any order with same razorpayOrderId and paymentId that is COMPLETED
    const existingOrder = await prisma.order.findFirst({
        where: {
            razorpayOrderId: razorpayOrderId,
            razorpayPaymentId: paymentId,
            userId: userId,
            status: 'COMPLETED',
        },
    });

    if (existingOrder) {
        // Order already processed, return existing order
        // Also check for offline batch orders linked to this order
        const offlineBatchOrders = await prisma.offlineBatchOrder.findMany({
            where: {
                orderId: existingOrder.id,
            },
            include: {
                batch: true,
            },
        });

        return res.status(200).json(
            new ApiResponsive(200, {
                order: existingOrder,
                offlineBatchOrders: offlineBatchOrders,
                message: "Payment already processed"
            }, "Payment already completed")
        );
    }

    // Also check if there's a PENDING order with same razorpayOrderId (from createOfflineBatchOrder)
    const pendingOrder = await prisma.order.findFirst({
        where: {
            razorpayOrderId: razorpayOrderId,
            userId: userId,
            status: 'PENDING',
        },
    });

    if (pendingOrder) {
        // Update the pending order instead of creating new one
        const updatedOrder = await prisma.order.update({
            where: { id: pendingOrder.id },
            data: {
                status: 'COMPLETED',
                paymentStatus: 'PAID',
                razorpayPaymentId: paymentId,
                razorpaySignature: signature,
                couponCode: couponCode || pendingOrder.couponCode,
            },
        });

        // Update linked offline batch orders if any
        await prisma.offlineBatchOrder.updateMany({
            where: {
                orderId: updatedOrder.id,
            },
            data: {
                paymentStatus: 'PAID',
                paymentMode: 'RAZORPAY',
            },
        });

        // Create enrollments for offline batches
        const offlineBatchOrders = await prisma.offlineBatchOrder.findMany({
            where: {
                orderId: updatedOrder.id,
            },
        });

        for (const batchOrder of offlineBatchOrders) {
            await prisma.offlineBatchEnrollment.upsert({
                where: {
                    batchId_userId: {
                        batchId: batchOrder.batchId,
                        userId: userId,
                    },
                },
                update: {
                    amountPaid: updatedOrder.finalAmount,
                    paymentStatus: "PAID",
                    paymentMode: "RAZORPAY",
                },
                create: {
                    batchId: batchOrder.batchId,
                    userId: userId,
                    amountPaid: updatedOrder.finalAmount,
                    paymentStatus: "PAID",
                    paymentMode: "RAZORPAY",
                },
            });

            // Update seats filled
            await prisma.offlineBatch.update({
                where: { id: batchOrder.batchId },
                data: {
                    seatsFilled: { increment: 1 },
                },
            });
        }

        return res.status(200).json(
            new ApiResponsive(200, {
                order: updatedOrder,
                message: "Payment completed successfully"
            }, "Payment completed successfully")
        );
    }

    // Verify signature
    const isValid = verifyRazorpaySignature(razorpayOrderId, paymentId, signature);
    if (!isValid) {
        throw new ApiError(400, "Invalid payment signature");
    }

    const {
        ebookIds = [],
        webinarIds = [],
        guidanceSlotIds = [],
        mentorshipIds = [],
        courseIds = [],
        offlineBatchIds = [],
        bundleIds = [],
    } = items || {};

    const orders = [];

    // Process ebooks
    if (ebookIds.length > 0) {
        const ebooks = await prisma.ebook.findMany({
            where: { id: { in: ebookIds }, isPublished: true },
        });

        let totalAmount = 0;
        const orderItems = [];

        for (const ebook of ebooks) {
            if (ebook.isFree) continue;
            const pricing = await getItemPricing('EBOOK', ebook.id, ebook.price, ebook.salePrice);
            totalAmount += pricing.effectivePrice;
            orderItems.push({
                ebookId: ebook.id,
                price: ebook.price,
                salePrice: pricing.effectivePrice,
                isFree: false,
            });
        }

        if (orderItems.length > 0) {
            const order = await prisma.order.create({
                data: {
                    userId,
                    orderNumber: `ORD-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`,
                    orderType: "EBOOK",
                    totalAmount,
                    discountAmount: 0,
                    finalAmount: totalAmount,
                    status: "COMPLETED",
                    paymentStatus: "PAID",
                    razorpayOrderId,
                    razorpayPaymentId: paymentId,
                    razorpaySignature: signature,
                    couponCode: couponCode || null,
                    items: { create: orderItems },
                },
            });

            // Update purchase counts
            for (const ebook of ebooks) {
                await prisma.ebook.update({
                    where: { id: ebook.id },
                    data: { purchaseCount: { increment: 1 } },
                });
            }

            orders.push({ type: 'EBOOK', order });
        }
    }

    // Process webinars
    if (webinarIds.length > 0) {
        const webinars = await prisma.webinar.findMany({
            where: { id: { in: webinarIds }, isPublished: true },
        });

        let totalAmount = 0;

        for (const webinar of webinars) {
            if (webinar.isFree) continue;
            const pricing = await getItemPricing('WEBINAR', webinar.id, webinar.price, webinar.salePrice);
            totalAmount += pricing.effectivePrice;

            // Create or update webinar order item (enrollment)
            await prisma.webinarOrderItem.upsert({
                where: {
                    webinarId_userId: {
                        webinarId: webinar.id,
                        userId
                    }
                },
                update: {
                    amountPaid: pricing.effectivePrice,
                    paymentId,
                    paymentMode: "RAZORPAY",
                },
                create: {
                    webinarId: webinar.id,
                    userId,
                    amountPaid: pricing.effectivePrice,
                    paymentId,
                    paymentMode: "RAZORPAY",
                },
            });
        }

        if (totalAmount > 0) {
            const order = await prisma.order.create({
                data: {
                    userId,
                    orderNumber: `WEB-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`,
                    orderType: "WEBINAR",
                    totalAmount,
                    discountAmount: 0,
                    finalAmount: totalAmount,
                    status: "COMPLETED",
                    paymentStatus: "PAID",
                    razorpayOrderId,
                    razorpayPaymentId: paymentId,
                    razorpaySignature: signature,
                    couponCode: couponCode || null,
                },
            });
            orders.push({ type: 'WEBINAR', order });
        }
    }

    // Process guidance slots
    if (guidanceSlotIds.length > 0) {
        for (const slotId of guidanceSlotIds) {
            const slot = await prisma.guidanceSlot.findUnique({
                where: { id: slotId },
                include: { guidance: true },
            });

            if (!slot || slot.isBooked) continue;

            const pricing = await getItemPricing('GUIDANCE', slot.guidance.id, slot.guidance.price, slot.guidance.salePrice);

            // Create order
            const order = await prisma.order.create({
                data: {
                    userId,
                    orderNumber: `GUID-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`,
                    orderType: "GUIDANCE",
                    totalAmount: pricing.effectivePrice,
                    discountAmount: 0,
                    finalAmount: pricing.effectivePrice,
                    status: "COMPLETED",
                    paymentStatus: "PAID",
                    razorpayOrderId,
                    razorpayPaymentId: paymentId,
                    razorpaySignature: signature,
                    couponCode: couponCode || null,
                },
            });

            // Create guidance order and mark slot as booked
            // Create or update guidance order and mark slot as booked
            await prisma.guidanceOrder.upsert({
                where: { slotId: slot.id },
                update: {
                    paymentId: order.id,
                    amountPaid: pricing.effectivePrice,
                    paymentStatus: "PAID",
                    paymentMode: "RAZORPAY",
                },
                create: {
                    guidanceId: slot.guidance.id,
                    slotId: slot.id,
                    userId,
                    paymentId: order.id,
                    amountPaid: pricing.effectivePrice,
                    paymentStatus: "PAID",
                    paymentMode: "RAZORPAY",
                },
            });

            await prisma.guidanceSlot.update({
                where: { id: slotId },
                data: { status: "BOOKED" },
            });

            orders.push({ type: 'GUIDANCE', order });
        }
    }

    // Process mentorships
    if (mentorshipIds.length > 0) {
        for (const mentorshipId of mentorshipIds) {
            const mentorship = await prisma.liveMentorshipProgram.findUnique({
                where: { id: mentorshipId },
            });

            if (!mentorship || mentorship.isFree) continue;

            const pricing = await getItemPricing('MENTORSHIP', mentorship.id, mentorship.price, mentorship.salePrice);

            const order = await prisma.order.create({
                data: {
                    userId,
                    orderNumber: `MENT-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`,
                    orderType: "MENTORSHIP",
                    totalAmount: pricing.effectivePrice,
                    discountAmount: 0,
                    finalAmount: pricing.effectivePrice,
                    status: "COMPLETED",
                    paymentStatus: "PAID",
                    razorpayOrderId,
                    razorpayPaymentId: paymentId,
                    razorpaySignature: signature,
                    couponCode: couponCode || null,
                },
            });

            // Create mentorship order and enrollment
            await prisma.mentorshipOrder.create({
                data: {
                    mentorshipId,
                    userId,
                    paymentId: order.id,
                    amountPaid: pricing.effectivePrice,
                    paymentStatus: "PAID",
                    paymentMode: "RAZORPAY",
                },
            });

            await prisma.mentorshipEnrollment.upsert({
                where: {
                    mentorshipId_userId: {
                        mentorshipId,
                        userId
                    }
                },
                update: {
                    enrolledAt: new Date(),
                },
                create: {
                    mentorshipId,
                    userId,
                },
            });

            orders.push({ type: 'MENTORSHIP', order });
        }
    }

    // Process courses
    if (courseIds.length > 0) {
        for (const courseId of courseIds) {
            const course = await prisma.course.findUnique({
                where: { id: courseId },
            });

            if (!course || course.isFree) continue;

            const pricing = await getItemPricing('COURSE', course.id, course.price, course.salePrice);
            const totalAmount = pricing.effectivePrice;

            // Calculate coupon discount for this course
            let discountAmount = 0;
            let finalAmount = totalAmount;

            if (couponCode && totalAmount > 0) {
                const coupon = await prisma.coupon.findFirst({
                    where: {
                        code: couponCode.toUpperCase(),
                        isActive: true,
                        validFrom: { lte: new Date() },
                        validUntil: { gte: new Date() },
                        OR: [
                            { applicableTo: "ALL" },
                            { applicableTo: "COURSE" },
                        ],
                    },
                });

                if (coupon) {
                    // Skip min amount check and usage limit for completed payments
                    if (coupon.discountType === "PERCENTAGE") {
                        discountAmount = (totalAmount * coupon.discountValue) / 100;
                        if (coupon.maxDiscount) {
                            discountAmount = Math.min(discountAmount, coupon.maxDiscount);
                        }
                    } else {
                        discountAmount = Math.min(coupon.discountValue, totalAmount);
                    }
                    finalAmount = Math.max(0, totalAmount - discountAmount);

                    // Update coupon usage
                    await prisma.coupon.update({
                        where: { id: coupon.id },
                        data: { usedCount: { increment: 1 } },
                    });
                }
            }

            const order = await prisma.order.create({
                data: {
                    userId,
                    orderNumber: `CRS-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`,
                    orderType: "COURSE",
                    totalAmount,
                    discountAmount,
                    finalAmount,
                    status: "COMPLETED",
                    paymentStatus: "PAID",
                    razorpayOrderId,
                    razorpayPaymentId: paymentId,
                    razorpaySignature: signature,
                    couponCode: couponCode || null,
                },
            });

            // Create course order and enrollment
            await prisma.courseOrder.create({
                data: {
                    courseId,
                    userId,
                    orderId: order.id,
                    amountPaid: finalAmount,
                    paymentStatus: "PAID",
                    paymentMode: "RAZORPAY",
                    paymentId,
                },
            });

            await prisma.courseEnrollment.upsert({
                where: {
                    courseId_userId: {
                        courseId,
                        userId
                    }
                },
                update: {
                    enrolledAt: new Date(),
                },
                create: {
                    courseId,
                    userId,
                },
            });

            orders.push({ type: 'COURSE', order });
        }
    }

    // Process offline batches
    if (offlineBatchIds.length > 0) {
        for (const batchId of offlineBatchIds) {
            const batch = await prisma.offlineBatch.findUnique({
                where: { id: batchId },
            });

            if (!batch || batch.isFree || batch.pricingType === 'FREE') continue;

            // Check if an order already exists for this offline batch with this razorpayOrderId
            const existingOfflineBatchOrder = await prisma.offlineBatchOrder.findFirst({
                where: {
                    batchId,
                    userId,
                    order: {
                        razorpayOrderId: razorpayOrderId,
                    },
                },
                include: {
                    order: true,
                },
            });

            let order;

            if (existingOfflineBatchOrder && existingOfflineBatchOrder.order) {
                // Update existing order
                order = await prisma.order.update({
                    where: { id: existingOfflineBatchOrder.order.id },
                    data: {
                        status: "COMPLETED",
                        paymentStatus: "PAID",
                        razorpayPaymentId: paymentId,
                        razorpaySignature: signature,
                        couponCode: couponCode || existingOfflineBatchOrder.order.couponCode,
                    },
                });

                // Update offline batch order
                await prisma.offlineBatchOrder.update({
                    where: { id: existingOfflineBatchOrder.id },
                    data: {
                        paymentStatus: "PAID",
                        paymentMode: "RAZORPAY",
                    },
                });
            } else {
                // Create new order only if it doesn't exist
                const pricing = await getItemPricing('OFFLINE_BATCH', batch.id, batch.price, batch.salePrice);

                order = await prisma.order.create({
                    data: {
                        userId,
                        orderNumber: `BATCH-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`,
                        orderType: "OFFLINE_BATCH",
                        totalAmount: pricing.effectivePrice,
                        discountAmount: 0,
                        finalAmount: pricing.effectivePrice,
                        status: "COMPLETED",
                        paymentStatus: "PAID",
                        razorpayOrderId,
                        razorpayPaymentId: paymentId,
                        razorpaySignature: signature,
                        couponCode: couponCode || null,
                    },
                });

                // Create batch order and enrollment
                await prisma.offlineBatchOrder.create({
                    data: {
                        batchId,
                        userId,
                        orderId: order.id,
                        amountPaid: pricing.effectivePrice,
                        paymentStatus: "PAID",
                        paymentMode: "RAZORPAY",
                    },
                });
            }

            // Ensure enrollment exists
            await prisma.offlineBatchEnrollment.upsert({
                where: {
                    batchId_userId: {
                        batchId,
                        userId
                    }
                },
                update: {
                    amountPaid: order.finalAmount,
                    paymentStatus: "PAID",
                    paymentMode: "RAZORPAY",
                },
                create: {
                    batchId,
                    userId,
                    amountPaid: order.finalAmount,
                    paymentStatus: "PAID",
                    paymentMode: "RAZORPAY",
                },
            });

            orders.push({ type: 'OFFLINE_BATCH', order });
        }
    }

    // Process bundles
    if (bundleIds.length > 0) {
        for (const bundleId of bundleIds) {
            const bundle = await prisma.bundle.findUnique({
                where: { id: bundleId },
            });

            if (!bundle) continue;

            const pricing = await getItemPricing('BUNDLE', bundle.id, bundle.price, bundle.salePrice);

            const order = await prisma.order.create({
                data: {
                    userId,
                    orderNumber: `BND-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`,
                    orderType: "BUNDLE",
                    totalAmount: pricing.effectivePrice,
                    discountAmount: 0,
                    finalAmount: pricing.effectivePrice,
                    status: "COMPLETED",
                    paymentStatus: "PAID",
                    razorpayOrderId,
                    razorpayPaymentId: paymentId,
                    razorpaySignature: signature,
                    couponCode: couponCode || null,
                },
            });

            // Create bundle order and enrollment
            await prisma.bundleOrder.create({
                data: {
                    bundleId,
                    userId,
                    orderId: order.id,
                    amountPaid: pricing.effectivePrice,
                    paymentStatus: "PAID",
                },
            });

            await prisma.bundleEnrollment.upsert({
                where: {
                    bundleId_userId: {
                        bundleId,
                        userId
                    }
                },
                update: {
                    enrolledAt: new Date(),
                },
                create: {
                    bundleId,
                    userId,
                },
            });

            // Enroll user in all courses in the bundle
            const bundleWithCourses = await prisma.bundle.findUnique({
                where: { id: bundleId },
                include: {
                    courses: {
                        include: {
                            course: {
                                select: {
                                    id: true,
                                    price: true,
                                    salePrice: true,
                                },
                            },
                        },
                    },
                },
            });

            if (bundleWithCourses && bundleWithCourses.courses.length > 0) {
                // Calculate total course value for price distribution
                let totalCourseValue = 0;
                const coursePrices = bundleWithCourses.courses.map(bc => {
                    const coursePrice = bc.course.salePrice || bc.course.price || 0;
                    totalCourseValue += coursePrice;
                    return {
                        courseId: bc.course.id,
                        price: coursePrice,
                    };
                });

                // Distribute bundle price proportionally among courses
                const bundleFinalAmount = order.finalAmount || pricing.effectivePrice || 0;

                for (let i = 0; i < bundleWithCourses.courses.length; i++) {
                    const bundleCourse = bundleWithCourses.courses[i];
                    const courseId = bundleCourse.course.id;
                    const coursePrice = coursePrices[i].price;

                    // Calculate distributed price for this course
                    let distributedPrice = 0;
                    if (totalCourseValue > 0) {
                        distributedPrice = (coursePrice / totalCourseValue) * bundleFinalAmount;
                        // Round to 2 decimal places
                        distributedPrice = Math.round(distributedPrice * 100) / 100;
                    } else {
                        // If no course prices, distribute equally
                        distributedPrice = bundleFinalAmount / bundleWithCourses.courses.length;
                        distributedPrice = Math.round(distributedPrice * 100) / 100;
                    }

                    // For the last course, ensure total matches bundle price exactly
                    if (i === bundleWithCourses.courses.length - 1) {
                        const totalDistributed = coursePrices.slice(0, -1).reduce((sum, cp, idx) => {
                            const price = (cp.price / totalCourseValue) * bundleFinalAmount;
                            return sum + Math.round(price * 100) / 100;
                        }, 0);
                        distributedPrice = bundleFinalAmount - totalDistributed;
                    }

                    // Check if user is already enrolled in this course
                    const existingCourseEnrollment = await prisma.courseEnrollment.findUnique({
                        where: {
                            courseId_userId: {
                                courseId,
                                userId,
                            },
                        },
                    });

                    // If not enrolled, create enrollment
                    if (!existingCourseEnrollment) {
                        await prisma.courseEnrollment.create({
                            data: {
                                courseId,
                                userId,
                            },
                        });
                    }

                    // Also create course order if not exists (for order history)
                    const existingCourseOrder = await prisma.courseOrder.findFirst({
                        where: {
                            courseId,
                            userId,
                            orderId: order.id,
                            paymentMode: 'BUNDLE',
                        },
                    });

                    if (!existingCourseOrder) {
                        // Create a course order linked to the bundle order with distributed price
                        await prisma.courseOrder.create({
                            data: {
                                courseId,
                                userId,
                                orderId: order.id,
                                amountPaid: distributedPrice,
                                paymentStatus: 'PAID',
                                paymentMode: 'BUNDLE',
                            },
                        });
                    }
                }
            }

            orders.push({ type: 'BUNDLE', order });
        }
    }

    // Update coupon usage if applicable
    if (couponCode) {
        const coupon = await prisma.coupon.findFirst({
            where: { code: couponCode.toUpperCase() },
        });
        if (coupon) {
            await prisma.coupon.update({
                where: { id: coupon.id },
                data: { usedCount: { increment: 1 } },
            });
        }
    }

    // Send order confirmation emails for each order
    try {
        const adminEmail = process.env.ADMIN_EMAIL || process.env.FROM_EMAIL;

        for (const orderInfo of orders) {
            const { type, order } = orderInfo;

            // Get item names based on order type
            let itemNames = [];
            let itemDetails = '';

            if (type === 'EBOOK' && order.items) {
                const ebooks = await prisma.ebook.findMany({
                    where: { id: { in: order.items.map(i => i.ebookId).filter(Boolean) } },
                    select: { title: true }
                });
                itemNames = ebooks.map(e => e.title);
            } else if (type === 'WEBINAR') {
                const webinarItems = await prisma.webinarOrderItem.findMany({
                    where: { userId, paymentId },
                    include: { webinar: { select: { title: true } } }
                });
                itemNames = webinarItems.map(w => w.webinar?.title).filter(Boolean);
            } else if (type === 'COURSE') {
                const courseOrders = await prisma.courseOrder.findMany({
                    where: { orderId: order.id },
                    include: { course: { select: { title: true } } }
                });
                itemNames = courseOrders.map(c => c.course?.title).filter(Boolean);
            } else if (type === 'MENTORSHIP') {
                const mentorshipOrders = await prisma.mentorshipOrder.findMany({
                    where: { paymentId: order.id },
                    include: { mentorship: { select: { title: true } } }
                });
                itemNames = mentorshipOrders.map(m => m.mentorship?.title).filter(Boolean);
            } else if (type === 'GUIDANCE') {
                const guidanceOrders = await prisma.guidanceOrder.findMany({
                    where: { paymentId: order.id },
                    include: { guidance: { select: { title: true } } }
                });
                itemNames = guidanceOrders.map(g => g.guidance?.title).filter(Boolean);
            } else if (type === 'OFFLINE_BATCH') {
                const batchOrders = await prisma.offlineBatchOrder.findMany({
                    where: { orderId: order.id },
                    include: { batch: { select: { title: true } } }
                });
                itemNames = batchOrders.map(b => b.batch?.title).filter(Boolean);
            } else if (type === 'BUNDLE') {
                const bundleOrders = await prisma.bundleOrder.findMany({
                    where: { orderId: order.id },
                    include: { bundle: { select: { title: true } } }
                });
                itemNames = bundleOrders.map(b => b.bundle?.title).filter(Boolean);
            }

            itemDetails = itemNames.length > 0 ? itemNames.join(', ') : `${type} Order`;

            // Send user confirmation email
            await sendEmail({
                email: user.email,
                subject: `Order Confirmed - ${order.orderNumber}`,
                html: getOrderConfirmationTemplate({
                    userName: user.name || 'Customer',
                    orderNo: order.orderNumber,
                    itemName: itemDetails,
                    totalAmount: order.totalAmount || 0,
                    discountAmount: order.discountAmount || 0,
                    finalAmount: order.finalAmount || 0,
                    couponCode: order.couponCode || null,
                    orderDate: new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }),
                }),
            });

            // Send admin notification
            await sendEmail({
                email: adminEmail,
                subject: `New ${type} Order - ${order.orderNumber}`,
                html: getAdminNotificationTemplate({
                    type: 'order',
                    orderNumber: order.orderNumber,
                    customerName: user.name || 'Customer',
                    customerEmail: user.email,
                    customerPhone: user.phone || 'N/A',
                    itemName: itemDetails,
                    totalAmount: order.totalAmount || 0,
                    discountAmount: order.discountAmount || 0,
                    amount: order.finalAmount || 0,
                    couponCode: order.couponCode || null,
                    dashboardUrl: `${process.env.CLIENT_URL || 'http://localhost:3000'}/admin/orders`,
                }),
            });
        }
    } catch (emailError) {
        console.error("Error sending order confirmation emails:", emailError);
        // Don't fail the request if email fails
    }

    return res.status(200).json(
        new ApiResponsive(
            200,
            { orders },
            "Payment completed and orders created successfully"
        )
    );
});

