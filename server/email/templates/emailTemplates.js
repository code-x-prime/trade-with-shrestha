/**
 * Email Templates for Shrestha Academy
 * Modern, professional email designs with consistent branding
 */

const brandColors = {
    primary: '#6366F1',      // Indigo
    primaryDark: '#4F46E5',
    secondary: '#8B5CF6',    // Purple
    success: '#10B981',      // Emerald
    warning: '#F59E0B',      // Amber
    error: '#EF4444',        // Red
    dark: '#1F2937',
    gray: '#6B7280',
    lightGray: '#F3F4F6',
    white: '#FFFFFF',
};

// Helper for IST Date Formatting
const formatDateIST = (date = new Date()) => {
    return new Date(date).toLocaleString('en-IN', {
        timeZone: 'Asia/Kolkata',
        dateStyle: 'full',
        timeStyle: 'medium'
    });
};

// Base email wrapper template
const getBaseTemplate = (content, previewText = '') => `
<!DOCTYPE html>
<html lang="en" xmlns:v="urn:schemas-microsoft-com:vml">
<head>
    <meta charset="utf-8">
    <meta name="x-apple-disable-message-reformatting">
    <meta http-equiv="x-ua-compatible" content="ie=edge">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <meta name="format-detection" content="telephone=no, date=no, address=no, email=no">
    <!--[if mso]>
    <noscript>
        <xml>
            <o:OfficeDocumentSettings xmlns:o="urn:schemas-microsoft-com:office:office">
                <o:PixelsPerInch>96</o:PixelsPerInch>
            </o:OfficeDocumentSettings>
        </xml>
    </noscript>
    <style>
        td,th,div,p,a,h1,h2,h3,h4,h5,h6 {font-family: "Segoe UI", sans-serif; mso-line-height-rule: exactly;}
    </style>
    <![endif]-->
    <title>Shrestha Academy</title>
    <style>
        .hover-bg-primary-dark:hover { background-color: ${brandColors.primaryDark} !important; }
        @media (max-width: 600px) {
            .sm-w-full { width: 100% !important; }
            .sm-px-4 { padding-left: 16px !important; padding-right: 16px !important; }
            .sm-py-8 { padding-top: 32px !important; padding-bottom: 32px !important; }
            .sm-text-3xl { font-size: 30px !important; }
        }
    </style>
</head>
<body style="margin: 0; padding: 0; width: 100%; word-break: break-word; -webkit-font-smoothing: antialiased; background-color: ${brandColors.lightGray};">
    ${previewText ? `<div style="display: none; max-height: 0; overflow: hidden;">${previewText}</div>` : ''}
    <div role="article" aria-roledescription="email" aria-label="Email from Shrestha Academy" lang="en">
        <table style="width: 100%; font-family: 'Segoe UI', Roboto, -apple-system, BlinkMacSystemFont, sans-serif;" cellpadding="0" cellspacing="0" role="presentation">
            <tr>
                <td align="center" style="background-color: ${brandColors.lightGray}; padding: 24px;">
                    <table class="sm-w-full" style="width: 600px;" cellpadding="0" cellspacing="0" role="presentation">
                        ${content}
                    </table>
                </td>
            </tr>
        </table>
    </div>
</body>
</html>
`;

// Header component
const getHeader = (title, emoji = '✨') => `
<tr>
    <td style="border-radius: 8px 8px 0 0; background: linear-gradient(135deg, ${brandColors.primary} 0%, ${brandColors.secondary} 100%); padding: 40px 24px; text-align: center;">
        <div style="font-size: 48px; margin-bottom: 16px;">${emoji}</div>
        <h1 style="margin: 0; font-size: 28px; font-weight: 700; color: ${brandColors.white}; letter-spacing: -0.5px;">${title}</h1>
    </td>
</tr>
`;

// Logo URL - use environment variable or default
const LOGO_URL = process.env.CLIENT_URL ? `${process.env.CLIENT_URL}/logo.png` : 'https://shresthaacademy.com/logo.png';

// Logo header (simpler version)
const getLogoHeader = () => `
<tr>
    <td style="padding: 24px 0; text-align: center;">
        <a href="${process.env.CLIENT_URL || 'https://shresthaacademy.com'}" style="text-decoration: none;">
            <img src="${LOGO_URL}" alt="Shrestha Academy" width="150" height="auto" style="max-width: 150px; height: auto;" />
        </a>
    </td>
</tr>
`;

// Footer component
const getFooter = () => `
<tr>
    <td style="padding: 32px 24px; text-align: center; border-radius: 0 0 8px 8px; background-color: ${brandColors.white}; border-top: 1px solid #E5E7EB;">
        <p style="margin: 0 0 8px; font-size: 14px; color: ${brandColors.gray};">
            Need help? <a href="mailto:${process.env.SUPPORT_EMAIL}" style="color: ${brandColors.primary}; text-decoration: none; font-weight: 600;">Contact Support</a>
        </p>
        <p style="margin: 0; font-size: 12px; color: #9CA3AF;">
            © ${new Date().getFullYear()} Shrestha Academy. All rights reserved.
        </p>
        <div style="margin-top: 16px;">
            <a href="#" style="display: inline-block; margin: 0 8px; color: ${brandColors.gray}; text-decoration: none;">
                <img src="https://cdn-icons-png.flaticon.com/24/733/733547.png" alt="Facebook" width="20" height="20" style="opacity: 0.7;">
            </a>
            <a href="#" style="display: inline-block; margin: 0 8px; color: ${brandColors.gray}; text-decoration: none;">
                <img src="https://cdn-icons-png.flaticon.com/24/733/733558.png" alt="Instagram" width="20" height="20" style="opacity: 0.7;">
            </a>
            <a href="#" style="display: inline-block; margin: 0 8px; color: ${brandColors.gray}; text-decoration: none;">
                <img src="https://cdn-icons-png.flaticon.com/24/733/733579.png" alt="Twitter" width="20" height="20" style="opacity: 0.7;">
            </a>
        </div>
    </td>
</tr>
`;

// Button component
const getButton = (text, url, color = brandColors.primary) => `
<table cellpadding="0" cellspacing="0" role="presentation" style="margin: 24px auto;">
    <tr>
        <td style="border-radius: 8px; background-color: ${color};">
            <a href="${url}" style="display: block; padding: 14px 32px; color: ${brandColors.white}; font-size: 16px; font-weight: 600; text-decoration: none; text-align: center;">
                ${text}
            </a>
        </td>
    </tr>
</table>
`;

// Info box component
const getInfoBox = (content, bgColor = brandColors.lightGray, borderColor = '#E5E7EB') => `
<div style="background-color: ${bgColor}; border: 1px solid ${borderColor}; border-radius: 12px; padding: 20px; margin: 20px 0;">
    ${content}
</div>
`;

// Success box component
const getSuccessBox = (text) => `
<div style="background-color: #ECFDF5; border-left: 4px solid ${brandColors.success}; border-radius: 0 8px 8px 0; padding: 16px 20px; margin: 20px 0;">
    <p style="margin: 0; font-size: 16px; font-weight: 600; color: #065F46;">
        ✓ ${text}
    </p>
</div>
`;

// Warning box component
const getWarningBox = (text) => `
<div style="background-color: #FFFBEB; border-left: 4px solid ${brandColors.warning}; border-radius: 0 8px 8px 0; padding: 16px 20px; margin: 20px 0;">
    <p style="margin: 0; font-size: 16px; font-weight: 600; color: #92400E;">
        ⚠️ ${text}
    </p>
</div>
`;

// Detail row component
const getDetailRow = (label, value, isLast = false) => `
<tr>
    <td style="padding: 12px 0; border-bottom: ${isLast ? 'none' : '1px solid #E5E7EB'};">
        <table width="100%" cellpadding="0" cellspacing="0">
            <tr>
                <td style="font-size: 14px; color: ${brandColors.gray}; width: 40%;">${label}</td>
                <td style="font-size: 14px; font-weight: 600; color: ${brandColors.dark}; text-align: right;">${value}</td>
            </tr>
        </table>
    </td>
</tr>
`;

// ===================== OTP EMAIL TEMPLATE =====================
export const getOTPTemplate = (otp, purpose = "EMAIL_VERIFY") => {
    const purposeConfig = {
        EMAIL_VERIFY: {
            title: "Verify Your Email",
            emoji: "📧",
            description: "Please use the code below to verify your email address.",
            previewText: `Your verification code is ${otp}`,
        },
        PASSWORD_RESET: {
            title: "Reset Your Password",
            emoji: "🔐",
            description: "Use the code below to reset your password.",
            previewText: `Your password reset code is ${otp}`,
        },
        LOGIN: {
            title: "Login Verification",
            emoji: "🔑",
            description: "Use this code to complete your login.",
            previewText: `Your login code is ${otp}`,
        },
    };

    const config = purposeConfig[purpose] || purposeConfig.EMAIL_VERIFY;

    const content = `
        ${getLogoHeader()}
        ${getHeader(config.title, config.emoji)}
        <tr>
            <td style="background-color: ${brandColors.white}; padding: 40px 32px;">
                <p style="margin: 0 0 24px; font-size: 16px; color: ${brandColors.dark}; line-height: 1.6;">
                    Hello,
                </p>
                <p style="margin: 0 0 32px; font-size: 16px; color: ${brandColors.gray}; line-height: 1.6;">
                    ${config.description}
                </p>
                
                <!-- OTP Box -->
                <div style="background: linear-gradient(135deg, #F5F3FF 0%, #EEF2FF 100%); border: 2px dashed ${brandColors.primary}; border-radius: 16px; padding: 32px; text-align: center; margin: 0 0 32px;">
                    <p style="margin: 0 0 8px; font-size: 14px; color: ${brandColors.gray}; text-transform: uppercase; letter-spacing: 2px;">Your Code</p>
                    <p style="margin: 0; font-size: 48px; font-weight: 700; color: ${brandColors.primary}; letter-spacing: 12px; font-family: 'Courier New', monospace;">
                        ${otp}
                    </p>
                </div>
                
                ${getWarningBox('This code will expire in 10 minutes. Do not share it with anyone.')}
                
                <p style="margin: 32px 0 0; font-size: 14px; color: ${brandColors.gray}; line-height: 1.6;">
                    If you didn't request this code, please ignore this email or contact support if you have concerns.
                </p>
            </td>
        </tr>
        ${getFooter()}
    `;

    return getBaseTemplate(content, config.previewText);
};

// ===================== ORDER CONFIRMATION TEMPLATE =====================
export const getOrderConfirmationTemplate = (orderData) => {
    const content = `
        ${getLogoHeader()}
        ${getHeader('Order Confirmed!', '🎉')}
        <tr>
            <td style="background-color: ${brandColors.white}; padding: 40px 32px;">
                <p style="margin: 0 0 24px; font-size: 16px; color: ${brandColors.dark}; line-height: 1.6;">
                    Hi ${orderData.userName || 'there'},
                </p>
                
                ${getSuccessBox('Your order has been confirmed successfully!')}
                
                <p style="margin: 0 0 24px; font-size: 16px; color: ${brandColors.gray}; line-height: 1.6;">
                    Thank you for your purchase. Here are your order details:
                </p>
                
                <!-- Order Details Card -->
                <div style="background-color: ${brandColors.lightGray}; border-radius: 12px; padding: 24px; margin: 24px 0;">
                    <table width="100%" cellpadding="0" cellspacing="0">
                        ${getDetailRow('Order Number', `<span style="color: ${brandColors.primary}; font-weight: 700;">#${orderData.orderNo}</span>`)}
                        ${getDetailRow('Item', orderData.itemName)}
                        ${getDetailRow('Date', orderData.orderDate || formatDateIST())}
                    </table>
                    
                    <!-- Pricing Breakdown -->
                    ${orderData.totalAmount > orderData.finalAmount || orderData.couponCode || orderData.discountAmount > 0 ? `
                    <div style="margin-top: 20px; padding-top: 20px; border-top: 2px solid #E5E7EB;">
                        <h3 style="margin: 0 0 16px; font-size: 16px; font-weight: 700; color: ${brandColors.dark};">Price Breakdown</h3>
                        <table width="100%" cellpadding="0" cellspacing="0" style="font-size: 15px;">
                            <tr>
                                <td style="padding: 10px 0; color: ${brandColors.gray}; font-weight: 500;">Original Price:</td>
                                <td style="padding: 10px 0; text-align: right; color: ${brandColors.dark}; font-weight: 600;">₹${(orderData.totalAmount || orderData.finalAmount || 0).toFixed(2)}</td>
                            </tr>
                            ${orderData.couponCode ? `
                            <tr style="background-color: #F0F9FF; border-radius: 8px;">
                                <td style="padding: 10px 12px; color: ${brandColors.dark}; font-weight: 600;">
                                    🎟️ Coupon Applied: <span style="color: ${brandColors.primary}; font-weight: 700; text-transform: uppercase;">${orderData.couponCode}</span>
                                </td>
                                <td style="padding: 10px 12px; text-align: right; color: ${brandColors.success}; font-weight: 700; font-size: 16px;">
                                    -₹${(orderData.discountAmount || 0).toFixed(2)}
                                </td>
                            </tr>
                            ` : orderData.discountAmount > 0 ? `
                            <tr style="background-color: #F0FDF4;">
                                <td style="padding: 10px 12px; color: ${brandColors.dark}; font-weight: 600;">Discount:</td>
                                <td style="padding: 10px 12px; text-align: right; color: ${brandColors.success}; font-weight: 700; font-size: 16px;">
                                    -₹${orderData.discountAmount.toFixed(2)}
                                </td>
                            </tr>
                            ` : ''}
                        </table>
                    </div>
                    ` : ''}
                    
                    <!-- Total -->
                    <div style="margin-top: 16px; padding-top: 16px; border-top: 2px solid ${brandColors.primary};">
                        <table width="100%" cellpadding="0" cellspacing="0">
                            <tr>
                                <td style="font-size: 18px; font-weight: 700; color: ${brandColors.dark};">Total Paid</td>
                                <td style="font-size: 24px; font-weight: 700; color: ${brandColors.primary}; text-align: right;">₹${orderData.finalAmount.toFixed(2)}</td>
                            </tr>
                        </table>    
                    </div>
                </div>
                
                ${orderData.invoiceUrl ? getButton('Download Invoice', orderData.invoiceUrl) : ''}
                
                <p style="margin: 24px 0 0; font-size: 14px; color: ${brandColors.gray}; text-align: center;">
                    Questions? Reply to this email and we'll help you out!
                </p>
            </td>
        </tr>
        ${getFooter()}
    `;

    return getBaseTemplate(content, `Order #${orderData.orderNo} confirmed!`);
};

// ===================== PAYMENT CONFIRMATION TEMPLATE =====================
export const getPaymentConfirmationTemplate = (paymentData) => {
    const content = `
        ${getLogoHeader()}
        ${getHeader('Payment Successful!', '💳')}
        <tr>
            <td style="background-color: ${brandColors.white}; padding: 40px 32px;">
                <p style="margin: 0 0 24px; font-size: 16px; color: ${brandColors.dark};">
                    Hi ${paymentData.userName || 'there'},
                </p>
                
                ${getSuccessBox(`Payment of ₹${paymentData.amount.toFixed(2)} has been successfully processed.`)}
                
                <div style="background-color: ${brandColors.lightGray}; border-radius: 12px; padding: 24px; margin: 24px 0;">
                    <table width="100%" cellpadding="0" cellspacing="0">
                        ${getDetailRow('Order Number', `#${paymentData.orderNo}`)}
                        ${getDetailRow('Payment ID', paymentData.paymentId)}
                        ${getDetailRow('Item', paymentData.itemName)}
                        ${getDetailRow('Amount', `₹${paymentData.amount.toFixed(2)}`, true)}
                    </table>
                </div>
                
                <p style="margin: 24px 0; font-size: 16px; color: ${brandColors.gray}; line-height: 1.6; text-align: center;">
                    Your purchase is now active. You can access your content immediately!
                </p>
                
                ${getButton('Access Your Content', paymentData.accessUrl || '#', brandColors.success)}
            </td>
        </tr>
        ${getFooter()}
    `;

    return getBaseTemplate(content, `Payment confirmed for order #${paymentData.orderNo}`);
};

// ===================== WEBINAR BOOKING TEMPLATE =====================
export const getWebinarBookingTemplate = (bookingData) => {
    const content = `
        ${getLogoHeader()}
        ${getHeader('Webinar Booking Confirmed!', '🎥')}
        <tr>
            <td style="background-color: ${brandColors.white}; padding: 40px 32px;">
                <p style="margin: 0 0 24px; font-size: 16px; color: ${brandColors.dark};">
                    Hi ${bookingData.userName || 'there'},
                </p>
                
                ${getSuccessBox('Your webinar seat has been reserved!')}
                
                <!-- Webinar Card -->
                <div style="background: linear-gradient(135deg, #EEF2FF 0%, #F5F3FF 100%); border-radius: 16px; padding: 24px; margin: 24px 0; border: 1px solid #E0E7FF;">
                    <h3 style="margin: 0 0 16px; font-size: 20px; color: ${brandColors.dark};">${bookingData.webinarTitle}</h3>
                    
                    <div style="display: flex; align-items: center; margin-bottom: 12px;">
                        <span style="font-size: 24px; margin-right: 12px;">📅</span>
                        <div>
                            <p style="margin: 0; font-size: 14px; color: ${brandColors.gray};">Date & Time</p>
                            <p style="margin: 0; font-size: 16px; font-weight: 600; color: ${brandColors.dark};">${bookingData.scheduledAt}</p>
                        </div>
                    </div>
                    
                    <div style="display: flex; align-items: center;">
                        <span style="font-size: 24px; margin-right: 12px;">⏱️</span>
                        <div>
                            <p style="margin: 0; font-size: 14px; color: ${brandColors.gray};">Duration</p>
                            <p style="margin: 0; font-size: 16px; font-weight: 600; color: ${brandColors.dark};">${bookingData.duration} minutes</p>
                        </div>
                    </div>
                </div>
                
                ${bookingData.meetLink ? `
                    <div style="background-color: ${brandColors.primary}; border-radius: 12px; padding: 24px; text-align: center; margin: 24px 0;">
                        <p style="margin: 0 0 12px; font-size: 14px; color: rgba(255,255,255,0.8);">Join Link</p>
                        <a href="${bookingData.meetLink}" style="color: ${brandColors.white}; font-size: 16px; font-weight: 600; text-decoration: underline;">
                            ${bookingData.meetLink}
                        </a>
                    </div>
                ` : getInfoBox(`
                    <p style="margin: 0; font-size: 14px; color: ${brandColors.gray}; text-align: center;">
                        📧 You'll receive the meeting link 10 minutes before the webinar starts.
                    </p>
                `)}
                
                ${getWarningBox('Mark your calendar! We\'ll send you a reminder before the session.')}
            </td>
        </tr>
        ${getFooter()}
    `;

    return getBaseTemplate(content, `Webinar confirmed: ${bookingData.webinarTitle}`);
};

// ===================== WEBINAR REMINDER TEMPLATE =====================
export const getWebinarReminderTemplate = (reminderData) => {
    const content = `
        ${getLogoHeader()}
        ${getHeader('Starting in 15 Minutes!', '⏰')}
        <tr>
            <td style="background-color: ${brandColors.white}; padding: 40px 32px;">
                <p style="margin: 0 0 24px; font-size: 16px; color: ${brandColors.dark};">
                    Hi ${reminderData.userName || 'there'},
                </p>
                
                <div style="background: linear-gradient(135deg, #FEF3C7 0%, #FDE68A 100%); border-radius: 16px; padding: 24px; text-align: center; margin: 0 0 24px;">
                    <p style="margin: 0 0 8px; font-size: 48px;">🔔</p>
                    <p style="margin: 0; font-size: 20px; font-weight: 700; color: #92400E;">
                        Your webinar starts in 15 minutes!
                    </p>
                </div>
                
                <div style="background-color: ${brandColors.lightGray}; border-radius: 12px; padding: 24px; margin: 24px 0;">
                    <h3 style="margin: 0 0 16px; font-size: 18px; color: ${brandColors.dark};">${reminderData.webinarTitle}</h3>
                    <p style="margin: 0; font-size: 14px; color: ${brandColors.gray};">
                        <strong>Time:</strong> ${reminderData.scheduledAt}<br>
                        <strong>Duration:</strong> ${reminderData.duration} minutes
                    </p>
                </div>
                
                ${reminderData.meetLink ? getButton('Join Webinar Now →', reminderData.meetLink, brandColors.success) : ''}
                
                <p style="margin: 24px 0 0; font-size: 14px; color: ${brandColors.gray}; text-align: center;">
                    Get ready with a stable internet connection and your questions!
                </p>
            </td>
        </tr>
        ${getFooter()}
    `;

    return getBaseTemplate(content, `Your webinar "${reminderData.webinarTitle}" starts in 15 minutes!`);
};

// ===================== MENTORSHIP ENROLLMENT TEMPLATE =====================
export const getMentorshipEnrollmentTemplate = (data) => {
    const content = `
        ${getLogoHeader()}
        ${getHeader('Welcome to Mentorship!', '🎓')}
        <tr>
            <td style="background-color: ${brandColors.white}; padding: 40px 32px;">
                <p style="margin: 0 0 24px; font-size: 16px; color: ${brandColors.dark};">
                    Hi ${data.userName || 'there'},
                </p>
                
                ${getSuccessBox('Your mentorship enrollment is confirmed!')}
                
                <!-- Mentorship Card -->
                <div style="background: linear-gradient(135deg, #ECFDF5 0%, #D1FAE5 100%); border-radius: 16px; padding: 24px; margin: 24px 0; border: 1px solid #A7F3D0;">
                    <h3 style="margin: 0 0 16px; font-size: 20px; color: ${brandColors.dark};">${data.mentorshipTitle}</h3>
                    
                    <div style="margin-bottom: 12px;">
                        <span style="font-size: 14px; color: ${brandColors.gray};">Instructor</span>
                        <p style="margin: 4px 0 0; font-size: 16px; font-weight: 600; color: ${brandColors.dark};">
                            👨‍🏫 ${data.instructorName}
                        </p>
                    </div>
                    
                    <div>
                        <span style="font-size: 14px; color: ${brandColors.gray};">Order Number</span>
                        <p style="margin: 4px 0 0; font-size: 16px; font-weight: 600; color: ${brandColors.primary};">
                            #${data.orderNumber}
                        </p>
                    </div>
                </div>
                
                <div style="background-color: ${brandColors.lightGray}; border-radius: 12px; padding: 20px; margin: 24px 0;">
                    <h4 style="margin: 0 0 12px; font-size: 16px; color: ${brandColors.dark};">What's Next?</h4>
                    <ul style="margin: 0; padding: 0 0 0 20px; color: ${brandColors.gray}; line-height: 1.8;">
                        <li>You'll receive session schedules via email</li>
                        <li>Meeting links will be sent 10 minutes before each session</li>
                        <li>Check your enrolled section for resources</li>
                    </ul>
                </div>
                
                ${data.accessUrl ? getButton('View Mentorship Details', data.accessUrl) : ''}
            </td>
        </tr>
        ${getFooter()}
    `;

    return getBaseTemplate(content, `Mentorship enrollment confirmed: ${data.mentorshipTitle}`);
};

// ===================== GUIDANCE BOOKING TEMPLATE =====================
export const getGuidanceBookingTemplate = (data) => {
    const content = `
        ${getLogoHeader()}
        ${getHeader('1:1 Guidance Booked!', '💬')}
        <tr>
            <td style="background-color: ${brandColors.white}; padding: 40px 32px;">
                <p style="margin: 0 0 24px; font-size: 16px; color: ${brandColors.dark};">
                    Hi ${data.userName || 'there'},
                </p>
                
                ${getSuccessBox('Your 1:1 guidance session has been booked!')}
                
                <!-- Session Card -->
                <div style="background: linear-gradient(135deg, #FDF4FF 0%, #FAE8FF 100%); border-radius: 16px; padding: 24px; margin: 24px 0; border: 1px solid #F5D0FE;">
                    <h3 style="margin: 0 0 20px; font-size: 20px; color: ${brandColors.dark};">${data.guidanceTitle}</h3>
                    
                    <table width="100%" cellpadding="0" cellspacing="0">
                        <tr>
                            <td style="padding: 8px 0;">
                                <span style="font-size: 20px; margin-right: 8px;">👨‍💼</span>
                                <span style="font-size: 14px; color: ${brandColors.gray};">Expert: </span>
                                <span style="font-weight: 600; color: ${brandColors.dark};">${data.expertName}</span>
                            </td>
                        </tr>
                        <tr>
                            <td style="padding: 8px 0;">
                                <span style="font-size: 20px; margin-right: 8px;">📅</span>
                                <span style="font-size: 14px; color: ${brandColors.gray};">Date: </span>
                                <span style="font-weight: 600; color: ${brandColors.dark};">${data.slotDate}</span>
                            </td>
                        </tr>
                        <tr>
                            <td style="padding: 8px 0;">
                                <span style="font-size: 20px; margin-right: 8px;">⏰</span>
                                <span style="font-size: 14px; color: ${brandColors.gray};">Time: </span>
                                <span style="font-weight: 600; color: ${brandColors.dark};">${data.slotTime}</span>
                            </td>
                        </tr>
                    </table>
                </div>
                
                <div style="background-color: #FEF3C7; border-radius: 12px; padding: 16px; margin: 24px 0; text-align: center;">
                    <p style="margin: 0; font-size: 14px; color: #92400E;">
                        📧 You'll receive the Google Meet link 10 minutes before your session
                    </p>
                </div>
                
                <p style="margin: 24px 0 0; font-size: 14px; color: ${brandColors.gray}; text-align: center;">
                    Prepare your questions and be ready on time!
                </p>
            </td>
        </tr>
        ${getFooter()}
    `;

    return getBaseTemplate(content, `Guidance session booked: ${data.guidanceTitle}`);
};

// ===================== COURSE ENROLLMENT TEMPLATE =====================
export const getCourseEnrollmentTemplate = (data) => {
    const content = `
        ${getLogoHeader()}
        ${getHeader('Course Enrollment Confirmed!', '📚')}
        <tr>
            <td style="background-color: ${brandColors.white}; padding: 40px 32px;">
                <p style="margin: 0 0 24px; font-size: 16px; color: ${brandColors.dark};">
                    Hi ${data.userName || 'there'},
                </p>
                
                ${getSuccessBox(`You're now enrolled in "${data.courseName}"!`)}
                
                <!-- Course Card -->
                <div style="background: linear-gradient(135deg, #EFF6FF 0%, #DBEAFE 100%); border-radius: 16px; overflow: hidden; margin: 24px 0; border: 1px solid #BFDBFE;">
                    ${data.courseImage ? `<img src="${data.courseImage}" alt="${data.courseName}" style="width: 100%; height: 160px; object-fit: cover;">` : ''}
                    <div style="padding: 20px;">
                        <h3 style="margin: 0 0 12px; font-size: 20px; color: ${brandColors.dark};">${data.courseName}</h3>
                        <p style="margin: 0; font-size: 14px; color: ${brandColors.gray};">
                            Order #${data.orderNumber}
                        </p>
                    </div>
                </div>
                
                <div style="background-color: ${brandColors.lightGray}; border-radius: 12px; padding: 20px; margin: 24px 0;">
                    <h4 style="margin: 0 0 12px; font-size: 16px; color: ${brandColors.dark};">🚀 Start Learning Now</h4>
                    <ul style="margin: 0; padding: 0 0 0 20px; color: ${brandColors.gray}; line-height: 1.8;">
                        <li>Access all course videos and materials</li>
                        <li>Track your progress as you learn</li>
                        <li>Get a certificate upon completion</li>
                    </ul>
                </div>
                
                ${getButton('Start Learning →', data.courseUrl || '#', brandColors.primary)}
            </td>
        </tr>
        ${getFooter()}
    `;

    return getBaseTemplate(content, `You're enrolled in ${data.courseName}!`);
};

// ===================== SUBSCRIPTION CONFIRMATION TEMPLATE =====================
export const getSubscriptionConfirmationTemplate = (data) => {
    const content = `
        ${getLogoHeader()}
        ${getHeader('Subscription Activated!', '⭐')}
        <tr>
            <td style="background-color: ${brandColors.white}; padding: 40px 32px;">
                <p style="margin: 0 0 24px; font-size: 16px; color: ${brandColors.dark};">
                    Hi ${data.userName || 'there'},
                </p>
                
                ${getSuccessBox('Your subscription is now active!')}
                
                <!-- Subscription Card -->
                <div style="background: linear-gradient(135deg, ${brandColors.primary} 0%, ${brandColors.secondary} 100%); border-radius: 16px; padding: 24px; margin: 24px 0; text-align: center; color: white;">
                    <p style="margin: 0 0 8px; font-size: 14px; opacity: 0.9;">Your Plan</p>
                    <h2 style="margin: 0 0 16px; font-size: 28px; font-weight: 700;">${data.planName}</h2>
                    <p style="margin: 0; font-size: 32px; font-weight: 700;">₹${data.amount}</p>
                </div>
                
                <div style="background-color: ${brandColors.lightGray}; border-radius: 12px; padding: 24px; margin: 24px 0;">
                    <table width="100%" cellpadding="0" cellspacing="0">
                        ${getDetailRow('Start Date', data.startDate)}
                        ${getDetailRow('End Date', data.endDate)}
                        ${getDetailRow('TradingView Username', data.tradingViewUsername || 'Not Set', true)}
                    </table>
                </div>
                
                <div style="background-color: #FEF3C7; border-radius: 12px; padding: 16px; margin: 24px 0;">
                    <p style="margin: 0; font-size: 14px; color: #92400E;">
                        ⚡ <strong>Important:</strong> Make sure your TradingView username is correct to receive indicator access.
                    </p>
                </div>
                
                ${getButton('Access Indicators', data.indicatorsUrl || '#')}
            </td>
        </tr>
        ${getFooter()}
    `;

    return getBaseTemplate(content, `Subscription activated: ${data.planName}`);
};

// ===================== ADMIN NOTIFICATION TEMPLATE =====================
export const getAdminNotificationTemplate = (data) => {
    const typeEmoji = {
        order: '🛒',
        enrollment: '📚',
        webinar: '🎥',
        mentorship: '🎓',
        guidance: '💬',
        subscription: '⭐',
    };

    const content = `
        ${getLogoHeader()}
        <tr>
            <td style="border-radius: 8px 8px 0 0; background-color: ${brandColors.dark}; padding: 32px 24px; text-align: center;">
                <div style="font-size: 40px; margin-bottom: 12px;">${typeEmoji[data.type] || '📬'}</div>
                <h1 style="margin: 0; font-size: 24px; font-weight: 700; color: ${brandColors.white};">New ${data.type.charAt(0).toUpperCase() + data.type.slice(1)}</h1>
            </td>
        </tr>
        <tr>
            <td style="background-color: ${brandColors.white}; padding: 32px;">
                <div style="background-color: ${brandColors.lightGray}; border-radius: 12px; padding: 24px; margin: 0 0 24px;">
                    <table width="100%" cellpadding="0" cellspacing="0">
                        ${getDetailRow('Order Number', `#${data.orderNumber}`)}
                        ${getDetailRow('Customer', data.customerName)}
                        ${getDetailRow('Email', data.customerEmail)}
                        ${data.customerPhone ? getDetailRow('Phone', data.customerPhone) : ''}
                        ${getDetailRow('Item', data.itemName)}
                        ${data.couponCode ? getDetailRow('Coupon Code', `<span style="color: ${brandColors.primary}; font-weight: 600;">${data.couponCode}</span>`) : ''}
                        ${data.totalAmount && data.totalAmount > data.amount ? `
                        <tr>
                            <td style="padding: 8px 0; color: ${brandColors.gray}; font-size: 14px;">Subtotal:</td>
                            <td style="padding: 8px 0; text-align: right; color: ${brandColors.dark}; font-size: 14px;">₹${data.totalAmount.toFixed(2)}</td>
                        </tr>
                        ${data.discountAmount > 0 ? `
                        <tr>
                            <td style="padding: 8px 0; color: ${brandColors.gray}; font-size: 14px;">Discount:</td>
                            <td style="padding: 8px 0; text-align: right; color: ${brandColors.success}; font-weight: 600; font-size: 14px;">-₹${data.discountAmount.toFixed(2)}</td>
                        </tr>
                        ` : ''}
                        ` : ''}
                        ${getDetailRow('Amount', `₹${data.amount}`, true)}
                    </table>
                </div>
                
                ${data.additionalInfo ? `
                    <div style="background-color: #EFF6FF; border-radius: 12px; padding: 16px; margin: 0 0 24px;">
                        <p style="margin: 0; font-size: 14px; color: #1E40AF;">
                            ${data.additionalInfo}
                        </p>
                    </div>
                ` : ''}
                
                ${getButton('View in Dashboard', data.dashboardUrl || '#')}
            </td>
        </tr>
        <tr>
            <td style="padding: 16px; text-align: center; background-color: ${brandColors.lightGray}; border-radius: 0 0 8px 8px;">
                <p style="margin: 0; font-size: 12px; color: ${brandColors.gray};">
                    Admin notification • ${formatDateIST()}
                </p>
            </td>
        </tr>
    `;

    return getBaseTemplate(content, `New ${data.type}: #${data.orderNumber}`);
};

// ===================== MEETING LINK TEMPLATE =====================
export const getMeetingLinkTemplate = (data) => {
    const content = `
        ${getLogoHeader()}
        ${getHeader('Your Meeting Link is Ready!', '🔗')}
        <tr>
            <td style="background-color: ${brandColors.white}; padding: 40px 32px;">
                <p style="margin: 0 0 24px; font-size: 16px; color: ${brandColors.dark};">
                    Hi ${data.userName || 'there'},
                </p>
                
                <div style="background: linear-gradient(135deg, #FEF3C7 0%, #FDE68A 100%); border-radius: 16px; padding: 24px; text-align: center; margin: 0 0 24px;">
                    <p style="margin: 0 0 8px; font-size: 40px;">🔔</p>
                    <p style="margin: 0; font-size: 18px; font-weight: 600; color: #92400E;">
                        Your session starts in 10 minutes!
                    </p>
                </div>
                
                <div style="background-color: ${brandColors.lightGray}; border-radius: 12px; padding: 20px; margin: 24px 0;">
                    <h3 style="margin: 0 0 12px; font-size: 18px; color: ${brandColors.dark};">${data.sessionTitle}</h3>
                    <p style="margin: 0; font-size: 14px; color: ${brandColors.gray};">
                        ${data.sessionType} • ${data.scheduledTime}
                    </p>
                </div>
                
                <!-- Meeting Link Button -->
                <div style="background-color: ${brandColors.success}; border-radius: 12px; padding: 24px; text-align: center; margin: 24px 0;">
                    <p style="margin: 0 0 16px; font-size: 14px; color: rgba(255,255,255,0.9);">Click below to join</p>
                    <a href="${data.meetLink}" style="display: inline-block; padding: 14px 32px; background-color: white; color: ${brandColors.success}; font-size: 16px; font-weight: 700; text-decoration: none; border-radius: 8px;">
                        Join Google Meet →
                    </a>
                </div>
                
                <p style="margin: 24px 0 0; font-size: 14px; color: ${brandColors.gray}; text-align: center;">
                    Make sure you have a stable internet connection and your camera/mic ready!
                </p>
            </td>
        </tr>
        ${getFooter()}
    `;

    return getBaseTemplate(content, `Join now: ${data.sessionTitle}`);
};

// Legacy export for backward compatibility  
export const getEnrollmentConfirmationTemplate = getCourseEnrollmentTemplate;

// ===================== CONTACT FORM TEMPLATES =====================
export const getContactAdminTemplate = (data) => {
    const content = `
        ${getLogoHeader()}
        ${getHeader('New Contact Inquiry', '📬')}
        <tr>
            <td style="background-color: ${brandColors.white}; padding: 40px 32px;">
                <p style="margin: 0 0 24px; font-size: 16px; color: ${brandColors.dark};">
                    You have received a new message from the Shrestha Academy contact form.
                </p>
                
                <div style="background-color: ${brandColors.lightGray}; border-radius: 12px; padding: 24px; margin: 24px 0;">
                    <table width="100%" cellpadding="0" cellspacing="0">
                        ${getDetailRow('Date', formatDateIST())}
                        ${getDetailRow('Name', data.name)}
                        ${getDetailRow('Email', `<a href="mailto:${data.email}" style="color: ${brandColors.primary}; text-decoration: none;">${data.email}</a>`)}
                        ${getDetailRow('Phone', `<a href="tel:${data.phone}" style="color: ${brandColors.primary}; text-decoration: none;">${data.phone}</a>`)}
                        ${getDetailRow('Subject', data.subject, true)}
                    </table>
                </div>

                <div style="background-color: #F8FAFC; padding: 20px; border-radius: 6px; border: 1px solid #E2E8F0; margin-bottom: 24px;">
                    <h3 style="color: ${brandColors.dark}; margin-top: 0; margin-bottom: 10px; font-size: 16px;">Message Content:</h3>
                    <p style="color: ${brandColors.gray}; white-space: pre-wrap; margin: 0; line-height: 1.6;">${data.message}</p>
                </div>

                <div style="margin-top: 20px; font-size: 12px; color: ${brandColors.gray}; text-align: right;">
                    Database ID: ${data.id || 'Not Saved'}
                </div>
            </td>
        </tr>
        ${getFooter()}
    `;

    return getBaseTemplate(content, `New Inquiry: ${data.subject}`);
};

export const getContactUserTemplate = (data) => {
    const content = `
        ${getLogoHeader()}
        ${getHeader('We Received Your Message', '✅')}
        <tr>
            <td style="background-color: ${brandColors.white}; padding: 40px 32px;">
                <p style="margin: 0 0 24px; font-size: 16px; color: ${brandColors.dark};">
                    Hi <strong>${data.name}</strong>,
                </p>
                
                ${getSuccessBox('Thank you for contacting Shrestha Academy.')}

                <p style="margin: 0 0 24px; font-size: 16px; color: ${brandColors.gray}; line-height: 1.6;">
                    We have successfully received your message regarding <strong>"${data.subject}"</strong>. Our team is reviewing your query and will get back to you shortly (usually within 24 hours).
                </p>

                <p style="margin: 0 0 24px; font-size: 16px; color: ${brandColors.gray}; line-height: 1.6;">
                    In the meantime, feel free to explore our latest courses and resources.
                </p>
                
                ${getButton('Explore Courses', `${process.env.CLIENT_URL || 'https://shrestha.academy'}/courses`, brandColors.primary)}
            </td>
        </tr>
        ${getFooter()}
    `;

    return getBaseTemplate(content, `We received your message: ${data.subject}`);
};

export const getSubscriptionStatusChangeTemplate = (data) => {
    const statusConfig = {
        CANCELLED: {
            title: "Subscription Cancelled",
            emoji: "❌",
            message: "Your subscription has been cancelled.",
            color: brandColors.error
        },
        STOPPED: {
            title: "Subscription Stopped",
            emoji: "🛑",
            message: "Your subscription has been stopped by the administrator.",
            color: brandColors.error
        },
        UPDATED: {
            title: "Subscription Updated",
            emoji: "📝",
            message: "Your subscription details have been updated.",
            color: brandColors.primary
        }
    };

    const config = statusConfig[data.status] || statusConfig.UPDATED;

    const content = `
        ${getLogoHeader()}
        ${getHeader(config.title, config.emoji)}
        <tr>
            <td style="background-color: ${brandColors.white}; padding: 40px 32px;">
                <p style="margin: 0 0 24px; font-size: 16px; color: ${brandColors.dark};">
                    Hi ${data.userName || 'there'},
                </p>
                
                <div style="background-color: #FEF2F2; border-left: 4px solid ${config.color}; padding: 15px; margin: 20px 0; border-radius: 4px;">
                    <p style="margin: 0; color: #991B1B; font-weight: 600;">${config.message}</p>
                </div>

                <div style="background-color: ${brandColors.lightGray}; border-radius: 12px; padding: 24px; margin: 24px 0;">
                    <table width="100%" cellpadding="0" cellspacing="0">
                        ${getDetailRow('Plan', data.planName)}
                        ${data.tradingViewUsername ? getDetailRow('TradingView ID', data.tradingViewUsername) : ''}
                        ${data.date ? getDetailRow('Date', formatDateIST(data.date)) : ''}
                        ${data.refundNote ? `
                        <tr>
                            <td colspan="2" style="padding-top: 12px; font-size: 14px; color: ${brandColors.gray}; border-top: 1px solid #E5E7EB;">
                                <strong>Note:</strong> ${data.refundNote}
                            </td>
                        </tr>
                        ` : ''}
                    </table>
                </div>
                
                <p style="margin: 24px 0 0; font-size: 14px; color: ${brandColors.gray}; text-align: center;">
                    If you have questions, please contact our support team.
                </p>
            </td>
        </tr>
        ${getFooter()}
    `;

    return getBaseTemplate(content, `${config.title}: ${data.planName}`);
};

export const getSubscriptionRenewalReminderTemplate = (data) => {
    const content = `
        ${getLogoHeader()}
        ${getHeader('Subscription Expiring Soon', '⏳')}
        <tr>
            <td style="background-color: ${brandColors.white}; padding: 40px 32px;">
                <p style="margin: 0 0 24px; font-size: 16px; color: ${brandColors.dark};">
                    Hi ${data.userName || 'there'},
                </p>
                
                ${getWarningBox('Your subscription is expiring soon. Renew now to avoid interruption.')}
                
                <div style="background-color: ${brandColors.lightGray}; border-radius: 12px; padding: 24px; margin: 24px 0;">
                    <table width="100%" cellpadding="0" cellspacing="0">
                        ${getDetailRow('Plan', data.planName)}
                        ${getDetailRow('Expires On', formatDateIST(data.endDate))}
                    </table>
                </div>
                
                ${getButton('Renew Subscription', data.renewUrl || '#', brandColors.primary)}
            </td>
        </tr>
        ${getFooter()}
    `;

    return getBaseTemplate(content, `Action Required: Renew your ${data.planName}`);
};
