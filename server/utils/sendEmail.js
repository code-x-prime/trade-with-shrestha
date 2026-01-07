import nodemailer from "nodemailer";
import { ApiError } from "./ApiError.js";

const sendEmail = async (options) => {
  try {
    let transporter;

    // Use Brevo (Sendinblue) SMTP configuration
    const smtpHost = process.env.SMTP_HOST || "smtp-relay.brevo.com";
    const smtpPort = Number(process.env.SMTP_PORT || 587);
    const smtpUser = process.env.SMTP_USER || process.env.FROM_EMAIL;
    const smtpPassword = process.env.SMTP_PASSWORD;

    if (!smtpUser || !smtpPassword) {
      console.error("SMTP credentials not configured");
      throw new ApiError(
        500,
        "Email service not configured. Please check SMTP credentials."
      );
    }

    transporter = nodemailer.createTransport({
      host: smtpHost,
      port: smtpPort,
      secure: false, // Brevo uses TLS on port 587
      auth: {
        user: smtpUser,
        pass: smtpPassword,
      },
      tls: {
        rejectUnauthorized: false, // For Brevo
      },
    });

    // Verify connection in development
    if (process.env.NODE_ENV === "development") {
      try {
        await transporter.verify();
        console.log("SMTP connection verified successfully");
      } catch (verifyError) {
        console.error(
          "SMTP verification failed:",
          verifyError?.message || verifyError
        );
        throw new ApiError(
          500,
          `Email service verification failed: ${verifyError?.message || "Unknown error"
          }`
        );
      }
    }

    const fromAddress = `Shrestha Academy <${process.env.FROM_EMAIL || smtpUser
      }>`;

    const mailOptions = {
      from: fromAddress,
      to: options.email,
      subject: options.subject,
      html: options.html,
      text: options.text || options.html.replace(/<[^>]*>/g, ""), // Plain text fallback
      attachments: options.attachments || [],
    };

    const info = await transporter.sendMail(mailOptions);

    console.log(`Email sent successfully to ${options.email}:`, info.messageId);
    return info;
  } catch (error) {
    console.error("Email sending error:", error);

    // Provide detailed error messages
    if (error.response) {
      throw new ApiError(500, `Email service error: ${error.response}`);
    } else if (error.code === "EAUTH") {
      throw new ApiError(
        500,
        "Email authentication failed. Please check SMTP credentials."
      );
    } else if (error.code === "ECONNECTION") {
      throw new ApiError(
        500,
        "Could not connect to email server. Please check SMTP host and port."
      );
    } else if (error.message) {
      throw new ApiError(500, `Failed to send email: ${error.message}`);
    } else {
      throw new ApiError(500, "Failed to send email. Please try again later.");
    }
  }
};

export default sendEmail;
