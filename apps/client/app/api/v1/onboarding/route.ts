import { NextRequest, NextResponse } from "next/server";
import { prisma, type User, type Schedule, Prisma } from "db";
import { Autosend, type SendEmailOptions } from 'autosendjs';
import { signToken, AUTH_COOKIE_NAME } from "@/lib/auth";
import { createLogger } from "utils";

const logger = createLogger('api:onboarding');

// POST /api/onboarding - Create a new user with their initial schedule
export async function POST(request: NextRequest) {
  try {
    const autosend = new Autosend(process.env.EMAIL_API_KEY || '');

    const body = await request.json();
    const { channelData, frequencyData } = body;

    const { data: { email } } = channelData;
    const { selectedChannel: channel } = channelData;
    const { selectedSchedule: frequency, timeOfDay, timezone, interval, daysOfWeek } = frequencyData;
    const firstName = body.firstName || null;
    const lastName = body.lastName || null;

    // Return early if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return NextResponse.json(
        { success: false, error: `A user with email ${email} already exists` },
        { status: 409 }
      );
    }

    // Create user and schedule atomically
    const { user, schedule } = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      const user: User = await tx.user.create({
        data: {
          email,
          firstName,
          lastName,
          provider: "email",
        },
      });

      const schedule: Schedule = await tx.schedule.create({
        data: {
          userId: user.id,
          channel,
          frequency,
          timeOfDay: timeOfDay || "morning",
          timezone: timezone || "UTC",
          daysOfWeek: daysOfWeek || [],
          ...(frequency === 'custom_interval' && {
            intervalValue: interval?.value ? parseInt(interval.value) : null,
            intervalUnit: interval?.unit || null,
          }),
          isActive: true,
        },
      });

      const subscription = await tx.subscription.create({
        data: {
          userId: user.id,
          plan: "free",
          status: "active",
          messageLimit: 5,
          messagesUsed: 0,
        },
      });

      return { user, schedule, subscription };
    });

    // Send welcome email
    // Set WELCOME_FROM_EMAIL and WELCOME_EMAIL_TEMPLATE_ID in .env.local
    let emailSent = true;
    let emailId: string | null = null;
    try {
      const emailPayload: SendEmailOptions = {
        from: { email: process.env.WELCOME_FROM_EMAIL || '', name: 'Team Hopeana' },
        to: { email: user.email },
        replyTo: { email: process.env.HOPEANA_REPLY_TO_EMAIL || '', name: "Hopeana Support" },
        subject: 'Welcome to Hopeana!',
        templateId: process.env.WELCOME_EMAIL_TEMPLATE_ID || '',
        dynamicData: {
          firstName: user.firstName || 'there',
          lastName: user.lastName || '',
          frequency: schedule.frequency,
          timeOfDay: schedule.timeOfDay || '',
          currentYear: new Date().getFullYear().toString(),
        },
      };
      logger.debug("Sending welcome email", { to: user.email, templateId: emailPayload.templateId });

      // const emailResponse = await autosend.emails.send(emailPayload);
      // logger.debug("Autosend response", { response: emailResponse });

      // if (emailResponse?.success) {
      //   emailId = emailResponse?.data?.emailId ?? null;
      //   logger.info("Welcome email sent", { emailId, userId: user.id });
      // } else {
      //   emailSent = false;
      //   logger.error("Autosend returned success: false", { response: emailResponse });
      // }
    } catch (emailError) {
      logger.error("Failed to send welcome email", { error: emailError });
      emailSent = false;
    }

    const token = await signToken({ userId: user.id, email: user.email });

    const response = NextResponse.json({
      success: true,
      data: {
        userId: user.id,
        email: user.email,
        emailSent,
      }
    });

    response.cookies.set(AUTH_COOKIE_NAME, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 7, // 7 days
    });

    return response;
  } catch (error) {
    logger.error("POST /api/onboarding error", { error });
    return NextResponse.json(
      { success: false, error: "Failed to complete onboarding" },
      { status: 500 }
    );
  }
}

// GET /api/onboarding - Check onboarding status for a user
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const email = searchParams.get("email");

    if (!email) {
      return NextResponse.json(
        { success: false, error: "Email parameter is required" },
        { status: 400 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { email },
      include: {
        schedules: true,
      },
    });

    if (!user) {
      return NextResponse.json({
        onboarded: false,
        message: "User not found",
      });
    }

    return NextResponse.json({
      onboarded: true,
      data: {
        userId: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        schedules: user.schedules.map((s: Schedule) => ({
          id: s.id,
          channel: s.channel,
          frequency: s.frequency,
          isActive: s.isActive,
        })),
      },
    });
  } catch (error) {
    logger.error("GET /api/onboarding error", { error });
    return NextResponse.json(
      { success: false, error: "Failed to check onboarding status" },
      { status: 500 }
    );
  }
}
