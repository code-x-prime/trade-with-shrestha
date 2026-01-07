import { prisma } from "../config/db.js";
import sendEmail from "./sendEmail.js";
import { getMeetingLinkTemplate, getAdminNotificationTemplate } from "../email/templates/emailTemplates.js";

/**
 * Send mentorship session reminder emails 10 minutes before start
 */
export const sendMentorshipReminders = async () => {
    try {
        const now = new Date();
        const tenMinutesFromNow = new Date(now.getTime() + 10 * 60 * 1000);

        // Find all published mentorship programs
        const mentorshipPrograms = await prisma.liveMentorshipProgram.findMany({
            where: {
                status: "PUBLISHED",
            },
            include: {
                sessions: {
                    orderBy: { order: "asc" },
                },
            },
        });

        for (const mentorship of mentorshipPrograms) {
            // Skip if no Google Meet link
            if (!mentorship.googleMeetLink) {
                continue;
            }

            for (const session of mentorship.sessions) {
                // Calculate session start datetime
                const sessionDate = new Date(session.sessionDate);
                const [hours, minutes] = session.startTime.split(":").map(Number);
                sessionDate.setHours(hours, minutes, 0, 0);

                // Calculate 10 minutes before session start
                const tenMinutesBefore = new Date(sessionDate.getTime() - 10 * 60 * 1000);

                // Check if we're within 1 minute of the 10-minute mark
                const timeDiff = Math.abs(now.getTime() - tenMinutesBefore.getTime());
                if (timeDiff > 60 * 1000) {
                    continue; // Not yet time to send
                }

                // Check if session has already started
                if (now >= sessionDate) {
                    continue; // Session already started
                }

                // Get all enrolled users
                const enrollments = await prisma.mentorshipEnrollment.findMany({
                    where: {
                        mentorshipId: mentorship.id,
                    },
                    include: {
                        user: {
                            select: {
                                id: true,
                                name: true,
                                email: true,
                            },
                        },
                    },
                });

                const enrolledUsers = enrollments.map(e => e.user).filter(Boolean);
                const adminEmail = process.env.ADMIN_EMAIL || process.env.FROM_EMAIL;

                // Calculate session end time for display
                const [endHours, endMinutes] = session.endTime.split(":").map(Number);
                const sessionEnd = new Date(sessionDate);
                sessionEnd.setHours(endHours, endMinutes, 0, 0);

                // Format session times
                const scheduledTime = sessionDate.toLocaleString('en-IN', {
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
                            subject: `🔔 Mentorship Session Starting: ${mentorship.title} - ${session.title}`,
                            html: getAdminNotificationTemplate({
                                type: 'mentorship',
                                orderNumber: 'REMINDER',
                                customerName: `${enrolledUsers.length} Enrolled Users`,
                                customerEmail: '-',
                                itemName: `${mentorship.title} - ${session.title}`,
                                amount: 0,
                                additionalInfo: `Instructor: ${mentorship.instructorName} | Time: ${scheduledTime}`,
                                dashboardUrl: mentorship.googleMeetLink,
                            }),
                        });
                    } catch (error) {
                        console.error(`Error sending admin reminder for mentorship ${mentorship.id}, session ${session.id}:`, error);
                    }
                }

                // Send to all enrolled users
                for (const user of enrolledUsers) {
                    try {
                        await sendEmail({
                            email: user.email,
                            subject: `🔔 Your Session Starts in 10 Minutes: ${session.title}`,
                            html: getMeetingLinkTemplate({
                                userName: user.name,
                                sessionTitle: `${mentorship.title} - ${session.title}`,
                                sessionType: 'Mentorship Session',
                                scheduledTime: scheduledTime,
                                meetLink: mentorship.googleMeetLink,
                            }),
                        });
                    } catch (error) {
                        console.error(`Error sending reminder to user ${user.id} for mentorship ${mentorship.id}, session ${session.id}:`, error);
                    }
                }
            }
        }

        return { success: true };
    } catch (error) {
        console.error("Error in sendMentorshipReminders:", error);
        throw error;
    }
};

/**
 * Start the mentorship reminder scheduler (runs every minute)
 */
export const startMentorshipReminderScheduler = () => {
    console.log("📧 Mentorship reminder scheduler started");

    // Run immediately, then every minute
    sendMentorshipReminders().catch(console.error);

    setInterval(() => {
        sendMentorshipReminders().catch(console.error);
    }, 60 * 1000); // Every minute
};
