import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiResponsive } from '../utils/ApiResponsive.js';
import { prisma } from '../config/db.js';

/**
 * Get analytics data for admin dashboard
 */
export const getAnalytics = asyncHandler(async (req, res) => {
    // Get date range (default: last 30 days)
    const { days = 30 } = req.query;
    const daysNum = parseInt(days);
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - daysNum);

    // Total counts
    let totalUsers = 0;
    let totalEbooks = 0;
    let totalCourses = 0;
    let totalWebinars = 0;
    let totalMentorships = 0;
    let totalGuidance = 0;
    let totalSubscriptions = 0;

    try {
        [
            totalUsers,
            totalEbooks,
            totalCourses,
            totalWebinars,
            totalMentorships,
            totalGuidance,
            totalSubscriptions,
        ] = await Promise.all([
            prisma.user.count(),
            prisma.ebook.count({ where: { isPublished: true } }),
            prisma.course.count({ where: { isPublished: true } }),
            prisma.webinar.count({ where: { isPublished: true } }),
            prisma.liveMentorshipProgram.count({ where: { status: 'PUBLISHED' } }).catch(() => 0),
            prisma.guidance.count({ where: { status: 'ACTIVE' } }),
            prisma.subscription.count({ where: { status: 'ACTIVE' } }),
        ]);
    } catch (error) {
        console.error('Error fetching counts:', error);
        // Continue with default values (0)
    }

    // Revenue calculations
    const allOrders = await prisma.order.findMany({
        where: {
            status: 'COMPLETED',
            paymentStatus: 'PAID',
            createdAt: { gte: startDate },
        },
        select: {
            finalAmount: true,
            createdAt: true,
            orderType: true,
        },
    });

    const webinarOrders = await prisma.webinarOrderItem.findMany({
        where: {
            paymentId: { not: null },
            createdAt: { gte: startDate },
        },
        select: {
            amountPaid: true,
            createdAt: true,
        },
    });

    const guidanceOrders = await prisma.guidanceOrder.findMany({
        where: {
            paymentStatus: 'PAID',
            createdAt: { gte: startDate },
        },
        select: {
            amountPaid: true,
            createdAt: true,
        },
    });

    const mentorshipOrders = await prisma.mentorshipOrder.findMany({
        where: {
            paymentStatus: 'PAID',
            createdAt: { gte: startDate },
        },
        select: {
            amountPaid: true,
            createdAt: true,
        },
    });

    const courseOrders = await prisma.courseOrder.findMany({
        where: {
            paymentStatus: 'PAID',
            createdAt: { gte: startDate },
        },
        select: {
            amountPaid: true,
            createdAt: true,
        },
    });

    const subscriptions = await prisma.subscription.findMany({
        where: {
            razorpayPaymentId: { not: null },
            createdAt: { gte: startDate },
        },
        select: {
            finalAmount: true,
            createdAt: true,
        },
    });

    // Calculate total revenue
    const totalRevenue =
        allOrders.reduce((sum, o) => sum + (o.finalAmount || 0), 0) +
        webinarOrders.reduce((sum, o) => sum + (o.amountPaid || 0), 0) +
        guidanceOrders.reduce((sum, o) => sum + (o.amountPaid || 0), 0) +
        mentorshipOrders.reduce((sum, o) => sum + (o.amountPaid || 0), 0) +
        courseOrders.reduce((sum, o) => sum + (o.amountPaid || 0), 0) +
        subscriptions.reduce((sum, s) => sum + (s.finalAmount || 0), 0);

    // Revenue by type
    const revenueByType = {
        EBOOK: allOrders.filter(o => o.orderType === 'EBOOK').reduce((sum, o) => sum + (o.finalAmount || 0), 0),
        WEBINAR: webinarOrders.reduce((sum, o) => sum + (o.amountPaid || 0), 0),
        GUIDANCE: guidanceOrders.reduce((sum, o) => sum + (o.amountPaid || 0), 0),
        MENTORSHIP: mentorshipOrders.reduce((sum, o) => sum + (o.amountPaid || 0), 0),
        COURSE: courseOrders.reduce((sum, o) => sum + (o.amountPaid || 0), 0),
        SUBSCRIPTION: subscriptions.reduce((sum, s) => sum + (s.finalAmount || 0), 0),
    };

    // Orders count by type
    const ordersByType = {
        EBOOK: allOrders.filter(o => o.orderType === 'EBOOK').length,
        WEBINAR: webinarOrders.length,
        GUIDANCE: guidanceOrders.length,
        MENTORSHIP: mentorshipOrders.length,
        COURSE: courseOrders.length,
        SUBSCRIPTION: subscriptions.length,
    };

    // Daily revenue for chart (last 30 days)
    const dailyRevenue = [];
    for (let i = daysNum - 1; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        date.setHours(0, 0, 0, 0);
        const nextDate = new Date(date);
        nextDate.setDate(nextDate.getDate() + 1);

        const dayOrders = allOrders.filter(o => {
            const orderDate = new Date(o.createdAt);
            return orderDate >= date && orderDate < nextDate;
        });

        const dayWebinars = webinarOrders.filter(o => {
            const orderDate = new Date(o.createdAt);
            return orderDate >= date && orderDate < nextDate;
        });

        const dayGuidance = guidanceOrders.filter(o => {
            const orderDate = new Date(o.createdAt);
            return orderDate >= date && orderDate < nextDate;
        });

        const dayMentorship = mentorshipOrders.filter(o => {
            const orderDate = new Date(o.createdAt);
            return orderDate >= date && orderDate < nextDate;
        });

        const dayCourses = courseOrders.filter(o => {
            const orderDate = new Date(o.createdAt);
            return orderDate >= date && orderDate < nextDate;
        });

        const daySubscriptions = subscriptions.filter(s => {
            const subDate = new Date(s.createdAt);
            return subDate >= date && subDate < nextDate;
        });

        const dayRevenue =
            dayOrders.reduce((sum, o) => sum + (o.finalAmount || 0), 0) +
            dayWebinars.reduce((sum, o) => sum + (o.amountPaid || 0), 0) +
            dayGuidance.reduce((sum, o) => sum + (o.amountPaid || 0), 0) +
            dayMentorship.reduce((sum, o) => sum + (o.amountPaid || 0), 0) +
            dayCourses.reduce((sum, o) => sum + (o.amountPaid || 0), 0) +
            daySubscriptions.reduce((sum, s) => sum + (s.finalAmount || 0), 0);

        dailyRevenue.push({
            date: date.toISOString().split('T')[0],
            revenue: dayRevenue,
            orders: dayOrders.length + dayWebinars.length + dayGuidance.length + dayMentorship.length + dayCourses.length + daySubscriptions.length,
        });
    }

    // Monthly revenue (last 12 months)
    const monthlyRevenue = [];
    for (let i = 11; i >= 0; i--) {
        const date = new Date();
        date.setMonth(date.getMonth() - i);
        date.setDate(1);
        date.setHours(0, 0, 0, 0);
        const nextDate = new Date(date);
        nextDate.setMonth(nextDate.getMonth() + 1);

        const monthOrders = allOrders.filter(o => {
            const orderDate = new Date(o.createdAt);
            return orderDate >= date && orderDate < nextDate;
        });

        const monthWebinars = webinarOrders.filter(o => {
            const orderDate = new Date(o.createdAt);
            return orderDate >= date && orderDate < nextDate;
        });

        const monthGuidance = guidanceOrders.filter(o => {
            const orderDate = new Date(o.createdAt);
            return orderDate >= date && orderDate < nextDate;
        });

        const monthMentorship = mentorshipOrders.filter(o => {
            const orderDate = new Date(o.createdAt);
            return orderDate >= date && orderDate < nextDate;
        });

        const monthCourses = courseOrders.filter(o => {
            const orderDate = new Date(o.createdAt);
            return orderDate >= date && orderDate < nextDate;
        });

        const monthSubscriptions = subscriptions.filter(s => {
            const subDate = new Date(s.createdAt);
            return subDate >= date && subDate < nextDate;
        });

        const monthRevenue =
            monthOrders.reduce((sum, o) => sum + (o.finalAmount || 0), 0) +
            monthWebinars.reduce((sum, o) => sum + (o.amountPaid || 0), 0) +
            monthGuidance.reduce((sum, o) => sum + (o.amountPaid || 0), 0) +
            monthMentorship.reduce((sum, o) => sum + (o.amountPaid || 0), 0) +
            monthCourses.reduce((sum, o) => sum + (o.amountPaid || 0), 0) +
            monthSubscriptions.reduce((sum, s) => sum + (s.finalAmount || 0), 0);

        monthlyRevenue.push({
            month: date.toLocaleString('default', { month: 'short', year: 'numeric' }),
            revenue: monthRevenue,
            orders: monthOrders.length + monthWebinars.length + monthGuidance.length + monthMentorship.length + monthCourses.length + monthSubscriptions.length,
        });
    }

    // Recent orders (last 10)
    const recentOrders = await prisma.order.findMany({
        where: {
            createdAt: { gte: startDate },
        },
        include: {
            user: {
                select: {
                    name: true,
                    email: true,
                },
            },
        },
        orderBy: { createdAt: 'desc' },
        take: 10,
    });

    // Top selling items
    const topEbooks = await prisma.ebook.findMany({
        where: { isPublished: true },
        include: {
            _count: {
                select: { orders: true },
            },
        },
        orderBy: {
            purchaseCount: 'desc',
        },
        take: 5,
    });

    const topCourses = await prisma.course.findMany({
        where: { isPublished: true },
        include: {
            _count: {
                select: { enrollments: true },
            },
        },
        orderBy: {
            enrollments: {
                _count: 'desc',
            },
        },
        take: 5,
    });

    return res.status(200).json(
        new ApiResponsive(200, {
            overview: {
                totalUsers,
                totalEbooks,
                totalCourses,
                totalWebinars,
                totalMentorships,
                totalGuidance,
                totalSubscriptions,
                totalRevenue,
                totalOrders: allOrders.length + webinarOrders.length + guidanceOrders.length + mentorshipOrders.length + courseOrders.length + subscriptions.length,
            },
            revenueByType,
            ordersByType,
            dailyRevenue,
            monthlyRevenue,
            recentOrders: recentOrders.map(order => ({
                id: order.id,
                orderNumber: order.orderNumber,
                orderType: order.orderType,
                finalAmount: order.finalAmount,
                status: order.status,
                paymentStatus: order.paymentStatus,
                createdAt: order.createdAt,
                userName: order.user.name,
                userEmail: order.user.email,
            })),
            topEbooks: topEbooks.map(ebook => ({
                id: ebook.id,
                title: ebook.title,
                purchaseCount: ebook.purchaseCount,
                ordersCount: ebook._count.orders,
            })),
            topCourses: topCourses.map(course => ({
                id: course.id,
                title: course.title,
                enrollmentsCount: course._count.enrollments || 0,
            })),
        }, 'Analytics fetched successfully')
    );
});

