<<<<<<< HEAD
import crypto from "crypto";
import { Autosend, type SendEmailOptions } from "autosendjs";
import { createLogger } from "utils";

const logger = createLogger("lib:auth-tokens");

/** Generate a URL-safe random token (48 hex chars = 192 bits of entropy) */
export function generateToken(): string {
  return crypto.randomBytes(24).toString("hex");
}

/** Send an email verification link to the user */
export async function sendVerificationEmail(
  toEmail: string,
  firstName: string | null,
  token: string,
): Promise<void> {
  const baseUrl = process.env.APP_BASE_URL || "";
  const verificationUrl = `${baseUrl}/verify-email?token=${token}`;

  const autosend = new Autosend(process.env.EMAIL_API_KEY || "");
  const payload: SendEmailOptions = {
    from: { email: process.env.WELCOME_FROM_EMAIL || "", name: "Team Hopeana" },
    to: { email: toEmail },
    replyTo: { email: process.env.HOPEANA_REPLY_TO_EMAIL || "", name: "Hopeana Support" },
    subject: "Verify your Hopeana email address",
=======
import { SignJWT, jwtVerify } from "jose";
import { Autosend, type SendEmailOptions } from "autosendjs";

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET || "");

/**
 * Creates a short-lived verification token for email verification.
 */
export async function createVerificationToken(payload: {
  userId: string;
  email: string;
}): Promise<string> {
  return new SignJWT({ ...payload, purpose: "email_verification" })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("24h")
    .sign(JWT_SECRET);
}

/**
 * Verifies an email verification token and returns the payload.
 */
export async function verifyVerificationToken(
  token: string
): Promise<{ userId: string; email: string } | null> {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    if (payload.purpose !== "email_verification") return null;
    return { userId: payload.userId as string, email: payload.email as string };
  } catch {
    return null;
  }
}

/**
 * Sends a verification email to the user with a link to verify their email address.
 */
export async function sendVerificationEmail({
  email,
  userId,
  firstName,
}: {
  email: string;
  userId: string;
  firstName: string | null;
}): Promise<{ success: boolean; emailId?: string | null }> {
  const autosend = new Autosend(process.env.EMAIL_API_KEY || "");
  const token = await createVerificationToken({ userId, email });

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.DODO_PAYMENTS_RETURN_URL?.replace(/\/onboarding\/status$/, "") || "http://localhost:3000";
  const verificationUrl = `${appUrl}/api/v1/auth/verify-email?token=${token}`;

  const emailPayload: SendEmailOptions = {
    from: {
      email: process.env.WELCOME_FROM_EMAIL || "",
      name: "Team Hopeana",
    },
    to: { email },
    replyTo: {
      email: process.env.HOPEANA_REPLY_TO_EMAIL || "",
      name: "Hopeana Support",
    },
    subject: "Verify your email address - Hopeana",
>>>>>>> a87172d3e6cf064cc11db6c566cbf86029f5542f
    templateId: process.env.VERIFICATION_EMAIL_TEMPLATE_ID || "",
    dynamicData: {
      firstName: firstName || "there",
      verificationUrl,
<<<<<<< HEAD
    },
  };

  try {
    const res = await autosend.emails.send(payload);
    if (!res?.success) {
      logger.error("Verification email send returned success: false", { toEmail });
    }
  } catch (err) {
    logger.error("Failed to send verification email", { error: err, toEmail });
  }
}

/** Send a password reset link to the user */
export async function sendPasswordResetEmail(
  toEmail: string,
  firstName: string | null,
  token: string,
): Promise<void> {
  const baseUrl = process.env.APP_BASE_URL || "";
  const resetUrl = `${baseUrl}/reset-password?token=${token}`;

  const autosend = new Autosend(process.env.EMAIL_API_KEY || "");
  const payload: SendEmailOptions = {
    from: { email: process.env.WELCOME_FROM_EMAIL || "", name: "Team Hopeana" },
    to: { email: toEmail },
    replyTo: { email: process.env.HOPEANA_REPLY_TO_EMAIL || "", name: "Hopeana Support" },
    subject: "Reset your Hopeana password",
    templateId: process.env.PASSWORD_RESET_EMAIL_TEMPLATE_ID || "",
    dynamicData: {
      firstName: firstName || "there",
      resetUrl,
    },
  };

  try {
    const res = await autosend.emails.send(payload);
    if (!res?.success) {
      logger.error("Password reset email send returned success: false", { toEmail });
    }
  } catch (err) {
    logger.error("Failed to send password reset email", { error: err, toEmail });
  }
=======
      currentYear: new Date().getFullYear().toString(),
    },
  };

  const response = await autosend.emails.send(emailPayload);

  if (response?.success) {
    return { success: true, emailId: response?.data?.emailId ?? null };
  }

  return { success: false };
>>>>>>> a87172d3e6cf064cc11db6c566cbf86029f5542f
}
