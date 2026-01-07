import { prisma } from "../config/db.js";
import sendEmail from "./sendEmail.js";
import { getMeetingLinkTemplate, getAdminNotificationTemplate } from "../email/templates/emailTemplates.js";

/**
 * Send guidance session reminder emails 10 minutes before start
 */
export const sendGuidanceReminders = async () => {
    try {
        const now = new Date();
        const tenMinutesFromNow = new Date(now.getTime() + 10 * 60 * 1000);

        // Find all paid guidance orders with slots starting in 10 minutes
        const guidanceOrders = await prisma.guidanceOrder.findMany({
            where: {
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
                                googleMeetLink: true,
                            },
                        },
                    },
                },
                user: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                    },
                },
            },
        });

        for (const order of guidanceOrders) {
            // Skip if no Google Meet link
            if (!order.slot.guidance.googleMeetLink) {
                continue;
            }

            // Calculate slot start datetime
            const slotDate = new Date(order.slot.date);
            const [hours, minutes] = order.slot.startTime.split(":").map(Number);
            slotDate.setHours(hours, minutes, 0, 0);

            // Calculate 10 minutes before slot start
            const tenMinutesBefore = new Date(slotDate.getTime() - 10 * 60 * 1000);

            // Check if we're within 1 minute of the 10-minute mark
            const timeDiff = Math.abs(now.getTime() - tenMinutesBefore.getTime());
            if (timeDiff > 60 * 1000) {
                continue; // Not yet time to send
            }

            // Check if slot has already started
            if (now >= slotDate) {
                continue; // Slot already started
            }

            const adminEmail = process.env.ADMIN_EMAIL || process.env.FROM_EMAIL;

            // Format scheduled time
            const scheduledTime = slotDate.toLocaleString('en-IN', {
                day: 'numeric',
                month: 'long',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
            });

            // Send to admin
            if (adminEmail) {
                try {
                    await sendEmail({
                        email: adminEmail,
                        subject: `🔔 Guidance Session Starting Soon: ${order.slot.guidance.title}`,
                        html: getAdminNotificationTemplate({
                            type: 'guidance',
                            orderNumber: order.orderNumber || 'REMINDER',
                            customerName: order.user.name,
                            customerEmail: order.user.email,
                            itemName: order.slot.guidance.title,
                            amount: order.amount || 0,
                            additionalInfo: `Starting at: ${scheduledTime} | Google Meet: ${order.slot.guidance.googleMeetLink}`,
                            dashboardUrl: order.slot.guidance.googleMeetLink,
                        }),
                    });
                } catch (error) {
                    console.error(`Error sending admin reminder for guidance order ${order.id}:`, error);
                }
            }

            // Send to user
            try {
                await sendEmail({
                    email: order.user.email,
                    subject: `🔔 Your Guidance Session Starts in 10 Minutes: ${order.slot.guidance.title}`,
                    html: getMeetingLinkTemplate({
                        userName: order.user.name,
                        sessionTitle: order.slot.guidance.title,
                        sessionType: '1:1 Guidance',
                        scheduledTime: scheduledTime,
                        meetLink: order.slot.guidance.googleMeetLink,
                    }),
                });
            } catch (error) {
                console.error(`Error sending reminder to user ${order.user.id} for guidance order ${order.id}:`, error);
            }
        }

        return { success: true, processed: guidanceOrders.length };
    } catch (error) {
        console.error("Error in sendGuidanceReminders:", error);
        throw error;
    }
};

/**
 * Start the guidance reminder scheduler (runs every minute)
 */
export const startGuidanceReminderScheduler = () => {
    console.log("📧 Guidance reminder scheduler started");

    // Run immediately on start
    sendGuidanceReminders().catch((error) => {
        console.error("Error in initial guidance reminder check:", error);
    });

    // Then run every minute
    setInterval(() => {
        sendGuidanceReminders().catch((error) => {
            console.error("Error in guidance reminder scheduler:", error);
        });
    }, 60 * 1000); // Every minute
};

