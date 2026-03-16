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
    templateId: process.env.VERIFICATION_EMAIL_TEMPLATE_ID || "",
    dynamicData: {
      firstName: firstName || "there",
      verificationUrl,
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
}
