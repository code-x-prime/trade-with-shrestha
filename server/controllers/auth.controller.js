import { ApiError } from "../utils/ApiError.js";
import { ApiResponsive } from "../utils/ApiResponsive.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { prisma } from "../utils/prisma.js";
import bcrypt from "bcryptjs";
import {
  generateAccessAndRefreshTokens,
  setCookies,
} from "../helper/generateAccessAndRefreshTokens.js";
import { validatePassword } from "../helper/validatePassword.js";
import { generateOTP, isValidOTP } from "../utils/otp.js";
import { sendEmail } from "../utils/email.js";
import { getOTPTemplate } from "../email/templates/emailTemplates.js";
import { getPublicUrl, uploadToR2 } from "../utils/cloudflare.js";

/**
 * Download Google profile image and upload to R2
 */
async function downloadAndUploadGoogleAvatar(googleAvatarUrl, userId) {
  if (!googleAvatarUrl) return null;

  try {
    // Fetch image from Google
    const response = await fetch(googleAvatarUrl);
    if (!response.ok) return null;

    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Get content type and extension
    const contentType = response.headers.get('content-type') || 'image/jpeg';
    const extension = contentType.includes('png') ? 'png' : 'jpg';

    // Create a file-like object for uploadToR2
    const file = {
      buffer,
      originalname: `avatar_${userId}.${extension}`,
      mimetype: contentType,
    };

    // Upload to R2
    const r2Path = await uploadToR2(file, 'avatars');
    return r2Path;
  } catch (error) {
    console.error('Error uploading Google avatar to R2:', error);
    return null;
  }
}

/**
 * Email signup with OTP
 */
export const emailSignup = asyncHandler(async (req, res) => {
  const { name, email, password, phone } = req.body;

  if (!name || !email || !password) {
    throw new ApiError(400, "Name, email, and password are required");
  }

  // Check if user already exists
  const existingUser = await prisma.user.findUnique({
    where: { email },
  });

  if (existingUser) {
    throw new ApiError(409, "Email already registered");
  }

  // Validate password
  validatePassword(password);

  // Hash password
  const hashedPassword = await bcrypt.hash(password, 10);

  // Generate OTP
  const otpCode = generateOTP();
  const expiresAt = new Date();
  expiresAt.setMinutes(expiresAt.getMinutes() + 10);

  // Create user
  const newUser = await prisma.user.create({
    data: {
      name,
      email,
      password: hashedPassword,
      phone: phone || null,
      authProvider: "EMAIL",
      isVerified: false,
    },
  });

  // Create OTP record
  await prisma.oTP.create({
    data: {
      userId: newUser.id,
      code: otpCode,
      purpose: "EMAIL_VERIFY",
      expiresAt,
    },
  });

  // Send OTP email
  try {
    await sendEmail({
      email,
      subject: "Verify Your Email - Shrestha Academy",
      html: getOTPTemplate(otpCode, "EMAIL_VERIFY"),
    });
  } catch (error) {
    console.error("Error sending OTP email:", error);
    // Don't throw error - user is created, they can request OTP again
  }

  const userWithoutPassword = { ...newUser };
  delete userWithoutPassword.password;

  res
    .status(201)
    .json(
      new ApiResponsive(
        201,
        userWithoutPassword,
        "User registered successfully. Please verify with the OTP sent to your email."
      )
    );
});

/**
 * Verify OTP
 */
export const verifyOTP = asyncHandler(async (req, res) => {
  const { email, otp, purpose = "EMAIL_VERIFY" } = req.body;

  if (!email || !otp) {
    throw new ApiError(400, "Email and OTP are required");
  }

  if (!isValidOTP(otp)) {
    throw new ApiError(400, "Invalid OTP format");
  }

  const user = await prisma.user.findUnique({
    where: { email },
  });

  if (!user) {
    throw new ApiError(404, "User not found");
  }

  // Find valid OTP
  const otpRecord = await prisma.oTP.findFirst({
    where: {
      userId: user.id,
      code: otp,
      purpose,
      isUsed: false,
      expiresAt: {
        gt: new Date(),
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  if (!otpRecord) {
    throw new ApiError(400, "Invalid or expired OTP");
  }

  // Mark OTP as used
  await prisma.oTP.update({
    where: { id: otpRecord.id },
    data: { isUsed: true },
  });

  // Update user verification status if email verification
  if (purpose === "EMAIL_VERIFY") {
    await prisma.user.update({
      where: { id: user.id },
      data: {
        isVerified: true,
        lastLoginAt: new Date(),
      },
    });

    // Generate tokens for automatic login
    const { accessToken, refreshToken } = await generateAccessAndRefreshTokens(
      user.id
    );

    // Set cookies
    setCookies(res, accessToken, refreshToken);

    const userWithoutPassword = { ...user };
    delete userWithoutPassword.password;

    const userData = {
      ...userWithoutPassword,
      avatarUrl: userWithoutPassword.avatar ? getPublicUrl(userWithoutPassword.avatar) : null,
    };

    return res.status(200).json(
      new ApiResponsive(
        200,
        {
          user: userData,
          accessToken,
          refreshToken,
        },
        "Email verified successfully. You are now logged in."
      )
    );
  }

  res.status(200).json(new ApiResponsive(200, {}, "OTP verified successfully"));
});

/**
 * Login
 */
export const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    throw new ApiError(400, "Email and password are required");
  }

  const user = await prisma.user.findUnique({
    where: { email },
  });

  if (!user) {
    throw new ApiError(401, "Invalid email or password");
  }

  if (!user.isActive) {
    throw new ApiError(403, "Your account has been deactivated");
  }

  if (!user.password) {
    throw new ApiError(400, "Please login using Google OAuth");
  }

  const isPasswordValid = await bcrypt.compare(password, user.password);

  if (!isPasswordValid) {
    throw new ApiError(401, "Invalid email or password");
  }

  if (!user.isVerified) {
    throw new ApiError(403, "Please verify your email first");
  }

  // Generate tokens
  const { accessToken, refreshToken } = await generateAccessAndRefreshTokens(
    user.id
  );

  // Set cookies
  setCookies(res, accessToken, refreshToken);

  // Update last login
  await prisma.user.update({
    where: { id: user.id },
    data: { lastLoginAt: new Date() },
  });

  const userWithoutPassword = { ...user };
  delete userWithoutPassword.password;

  const userData = {
    ...userWithoutPassword,
    avatarUrl: userWithoutPassword.avatar ? getPublicUrl(userWithoutPassword.avatar) : null,
  };

  res.status(200).json(
    new ApiResponsive(
      200,
      {
        user: userData,
        accessToken,
        refreshToken,
      },
      "Logged in successfully"
    )
  );
});

/**
 * Google OAuth
 */
export const googleAuth = asyncHandler(async (req, res) => {
  const { googleId, email, name, avatar } = req.body;

  if (!googleId || !email) {
    throw new ApiError(400, "Google ID and email are required");
  }

  // Check if user exists with Google ID
  let user = await prisma.user.findUnique({
    where: { googleId },
  });

  if (!user) {
    // Check if user exists with email
    user = await prisma.user.findUnique({
      where: { email },
    });

    if (user) {
      // Update existing user with Google ID
      user = await prisma.user.update({
        where: { id: user.id },
        data: {
          googleId,
          authProvider: "GOOGLE",
          avatar: avatar || user.avatar,
          isVerified: true,
          lastLoginAt: new Date(),
        },
      });
    } else {
      // Create new user
      user = await prisma.user.create({
        data: {
          googleId,
          email,
          name: name || email.split("@")[0],
          avatar: null, // Will be updated after R2 upload
          authProvider: "GOOGLE",
          isVerified: true,
          lastLoginAt: new Date(),
        },
      });

      // Download Google avatar and upload to R2
      if (avatar) {
        const r2AvatarPath = await downloadAndUploadGoogleAvatar(avatar, user.id);
        if (r2AvatarPath) {
          user = await prisma.user.update({
            where: { id: user.id },
            data: { avatar: r2AvatarPath },
          });
        }
      }
    }
  } else {
    // Update last login
    await prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });
  }

  if (!user.isActive) {
    throw new ApiError(403, "Your account has been deactivated");
  }

  // Generate tokens
  const { accessToken, refreshToken } = await generateAccessAndRefreshTokens(
    user.id
  );

  // Set cookies
  setCookies(res, accessToken, refreshToken);

  const userWithoutPassword = { ...user };
  delete userWithoutPassword.password;

  const userData = {
    ...userWithoutPassword,
    avatarUrl: userWithoutPassword.avatar ? getPublicUrl(userWithoutPassword.avatar) : null,
  };

  res.status(200).json(
    new ApiResponsive(
      200,
      {
        user: userData,
        accessToken,
        refreshToken,
      },
      "Logged in successfully"
    )
  );
});

/**
 * Forgot password
 */
export const forgotPassword = asyncHandler(async (req, res) => {
  const { email } = req.body;

  if (!email) {
    throw new ApiError(400, "Email is required");
  }

  const user = await prisma.user.findUnique({
    where: { email },
  });

  if (!user) {
    // Return success for security
    return res
      .status(200)
      .json(
        new ApiResponsive(
          200,
          {},
          "If your email is registered, you will receive a password reset OTP"
        )
      );
  }

  // Generate OTP
  const otpCode = generateOTP();
  const expiresAt = new Date();
  expiresAt.setMinutes(expiresAt.getMinutes() + 10);

  // Create OTP record
  await prisma.oTP.create({
    data: {
      userId: user.id,
      code: otpCode,
      purpose: "PASSWORD_RESET",
      expiresAt,
    },
  });

  // Send OTP email with nice template
  try {
    await sendEmail({
      email,
      subject: "Reset Your Password - Shrestha Academy",
      html: getOTPTemplate(otpCode, "PASSWORD_RESET"),
    });
  } catch (error) {
    console.error("Error sending password reset email:", error);
  }

  res
    .status(200)
    .json(
      new ApiResponsive(
        200,
        {},
        "If your email is registered, you will receive a password reset OTP"
      )
    );
});

/**
 * Reset password
 */
export const resetPassword = asyncHandler(async (req, res) => {
  const { email, otp, newPassword } = req.body;

  if (!email || !otp || !newPassword) {
    throw new ApiError(400, "Email, OTP, and new password are required");
  }

  if (!isValidOTP(otp)) {
    throw new ApiError(400, "Invalid OTP format");
  }

  validatePassword(newPassword);

  const user = await prisma.user.findUnique({
    where: { email },
  });

  if (!user) {
    throw new ApiError(404, "User not found");
  }

  // Find valid OTP
  const otpRecord = await prisma.oTP.findFirst({
    where: {
      userId: user.id,
      code: otp,
      purpose: "PASSWORD_RESET",
      isUsed: false,
      expiresAt: {
        gt: new Date(),
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  if (!otpRecord) {
    throw new ApiError(400, "Invalid or expired OTP");
  }

  // Hash new password
  const hashedPassword = await bcrypt.hash(newPassword, 10);

  // Update password and mark OTP as used
  await prisma.$transaction([
    prisma.user.update({
      where: { id: user.id },
      data: { password: hashedPassword },
    }),
    prisma.oTP.update({
      where: { id: otpRecord.id },
      data: { isUsed: true },
    }),
  ]);

  res.status(200).json(new ApiResponsive(200, {}, "Password reset successful"));
});

/**
 * Logout
 */
export const logout = asyncHandler(async (req, res) => {
  res.clearCookie("accessToken", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
  });

  res.clearCookie("refreshToken", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
  });

  res.status(200).json(new ApiResponsive(200, {}, "Logged out successfully"));
});

/**
 * Refresh token
 */
export const refreshToken = asyncHandler(async (req, res) => {
  const incomingRefreshToken =
    req.cookies?.refreshToken || req.body.refreshToken;

  if (!incomingRefreshToken) {
    throw new ApiError(401, "Unauthorized request");
  }

  const { verifyToken } = await import("../utils/jwt.js");
  const decodedToken = verifyToken(
    incomingRefreshToken,
    process.env.REFRESH_TOKEN_SECRET
  );

  const user = await prisma.user.findUnique({
    where: { id: decodedToken.id },
  });

  if (!user) {
    throw new ApiError(401, "Invalid refresh token");
  }

  // Generate new tokens
  const { accessToken, refreshToken } = await generateAccessAndRefreshTokens(
    user.id
  );

  // Set cookies
  setCookies(res, accessToken, refreshToken);

  res
    .status(200)
    .json(
      new ApiResponsive(
        200,
        { accessToken, refreshToken },
        "Access token refreshed"
      )
    );
});
