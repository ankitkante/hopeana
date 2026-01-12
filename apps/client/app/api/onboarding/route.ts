import { NextRequest, NextResponse } from "next/server";
import { prisma, type User, type Schedule } from "../../../../../packages/db/src";

// POST /api/onboarding - Create a new user with their initial schedule
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, name, channel, frequency, timeOfDay, timezone } = body;

    // Validate required fields
    if (!email) {
      return NextResponse.json(
        { error: "Email is required" },
        { status: 400 }
      );
    }

    if (!channel) {
      return NextResponse.json(
        { error: "Communication channel is required" },
        { status: 400 }
      );
    }

    if (!frequency) {
      return NextResponse.json(
        { error: "Message frequency is required" },
        { status: 400 }
      );
    }

    // Create user and schedule in a transaction
    const result = await prisma.$transaction(async (tx) => {
      // Check if user already exists
      let user: User | null = await tx.user.findUnique({
        where: { email },
      });

      if (user) {
        // Update existing user
        user = await tx.user.update({
          where: { email },
          data: {
            name: name || user.name,
            provider: "email",
          },
        });
      } else {
        // Create new user
        user = await tx.user.create({
          data: {
            email,
            name,
            provider: "email",
          },
        });
      }

      // Create a new schedule for the user
      const schedule: Schedule = await tx.schedule.create({
        data: {
          userId: user.id,
          channel,
          frequency,
          timeOfDay: timeOfDay || "09:00",
          timezone: timezone || "UTC",
          isActive: true,
        },
      });

      return { user, schedule };
    });

    return NextResponse.json({
      success: true,
      message: "User onboarded successfully",
      data: {
        userId: result.user.id,
        email: result.user.email,
        scheduleId: result.schedule.id,
        channel: result.schedule.channel,
        frequency: result.schedule.frequency,
      },
    });
  } catch (error) {
    console.error("Onboarding error:", error);
    return NextResponse.json(
      { error: "Failed to complete onboarding" },
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
        { error: "Email parameter is required" },
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
        name: user.name,
        schedules: user.schedules.map((s: Schedule) => ({
          id: s.id,
          channel: s.channel,
          frequency: s.frequency,
          isActive: s.isActive,
        })),
      },
    });
  } catch (error) {
    console.error("Error checking onboarding status:", error);
    return NextResponse.json(
      { error: "Failed to check onboarding status" },
      { status: 500 }
    );
  }
}
