import { prisma } from "../config/db.js";
import sendEmail from "./sendEmail.js";
import { getMeetingLinkTemplate, getAdminNotificationTemplate } from "../email/templates/emailTemplates.js";

/**
 * Send webinar reminder emails 10 minutes before start
 */
export const sendWebinarReminders = async () => {
  try {
    const now = new Date();
    const tenMinutesFromNow = new Date(now.getTime() + 10 * 60 * 1000);

    // Find webinars starting in 10 minutes
    const upcomingWebinars = await prisma.webinar.findMany({
      where: {
        isPublished: true,
        startDate: {
          gte: now,
          lte: tenMinutesFromNow,
        },
        googleMeetLink: {
          not: null,
        },
      },
    });

    for (const webinar of upcomingWebinars) {
      // Calculate exact start time (startDate already contains date and time)
      const sessionStart = new Date(webinar.startDate);

      const tenMinutesBefore = new Date(sessionStart.getTime() - 10 * 60 * 1000);

      // Check if we're within 1 minute of the 10-minute mark
      const timeDiff = Math.abs(now.getTime() - tenMinutesBefore.getTime());
      if (timeDiff > 60 * 1000) {
        continue; // Not yet time to send
      }

      // Get all enrolled users
      const enrollments = await prisma.webinarOrderItem.findMany({
        where: {
          webinarId: webinar.id,
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
      const scheduledTime = sessionStart.toLocaleString('en-IN', {
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
            subject: `🔔 Webinar Starting Soon: ${webinar.title}`,
            html: getAdminNotificationTemplate({
              type: 'webinar',
              orderNumber: 'REMINDER',
              customerName: `${enrolledUsers.length} Enrolled Users`,
              customerEmail: '-',
              itemName: webinar.title,
              amount: 0,
              additionalInfo: `Starting at: ${scheduledTime} | Google Meet: ${webinar.googleMeetLink}`,
              dashboardUrl: webinar.googleMeetLink,
            }),
          });
        } catch (error) {
          console.error(`Error sending admin reminder for webinar ${webinar.id}:`, error);
        }
      }

      // Send to all enrolled users
      for (const user of enrolledUsers) {
        try {
          await sendEmail({
            email: user.email,
            subject: `🔔 Your Webinar Starts in 10 Minutes: ${webinar.title}`,
            html: getMeetingLinkTemplate({
              userName: user.name,
              sessionTitle: webinar.title,
              sessionType: 'Webinar',
              scheduledTime: scheduledTime,
              meetLink: webinar.googleMeetLink,
            }),
          });
        } catch (error) {
          console.error(`Error sending reminder to user ${user.id} for webinar ${webinar.id}:`, error);
        }
      }
    }

    return { success: true, processed: upcomingWebinars.length };
  } catch (error) {
    console.error("Error in sendWebinarReminders:", error);
    throw error;
  }
};

/**
 * Start the webinar reminder scheduler (runs every minute)
 */
export const startWebinarReminderScheduler = () => {
  console.log("📧 Webinar reminder scheduler started");

  // Run immediately, then every minute
  sendWebinarReminders().catch(console.error);

  setInterval(() => {
    sendWebinarReminders().catch(console.error);
  }, 60 * 1000); // Every minute
};
