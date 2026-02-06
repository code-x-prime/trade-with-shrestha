import { prisma } from '../config/db.js';
import { completeWebinarForEnrolledUsers } from './certificateGenerator.js';

let schedulerInterval = null;

/**
 * Process all ended webinars and generate certificates
 */
const processEndedWebinars = async () => {
    try {
        const now = new Date();

        // Find webinars that have ended (startDate + duration < now)
        const webinars = await prisma.webinar.findMany({
            where: {
                isPublished: true,
                startDate: { lt: now },
            },
            select: {
                id: true,
                title: true,
                startDate: true,
                duration: true,
            },
        });

        let totalProcessed = 0;

        for (const webinar of webinars) {
            const endTime = new Date(webinar.startDate);
            endTime.setMinutes(endTime.getMinutes() + (webinar.duration || 60));

            // Only process if webinar has ended
            if (now > endTime) {
                try {
                    const result = await completeWebinarForEnrolledUsers(webinar.id);
                    if (result.processed > 0) {
                        console.log(`[Webinar Certificate] Processed ${result.processed} certificates for "${webinar.title}"`);
                        totalProcessed += result.processed;
                    }
                } catch (error) {
                    console.error(`[Webinar Certificate] Error processing webinar ${webinar.id}:`, error.message);
                }
            }
        }

        if (totalProcessed > 0) {
            console.log(`[Webinar Certificate] Total certificates generated: ${totalProcessed}`);
        }
    } catch (error) {
        console.error('[Webinar Certificate] Scheduler error:', error);
    }
};

/**
 * Start the webinar certificate scheduler
 * Runs every 5 minutes to check for ended webinars
 */
export const startWebinarCertificateScheduler = () => {
    if (schedulerInterval) {
        console.log('[Webinar Certificate] Scheduler already running');
        return;
    }

    // Run immediately on start
    processEndedWebinars();

    // Then run every 5 minutes
    schedulerInterval = setInterval(processEndedWebinars, 5 * 60 * 1000);

};

/**
 * Stop the webinar certificate scheduler
 */
export const stopWebinarCertificateScheduler = () => {
    if (schedulerInterval) {
        clearInterval(schedulerInterval);
        schedulerInterval = null;
        console.log('[Webinar Certificate] Scheduler stopped');
    }
};

