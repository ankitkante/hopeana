import { NextRequest, NextResponse } from "next/server";
import { prisma, type User, type Schedule, Prisma } from "db";

// POST /api/onboarding - Create a new user with their initial schedule
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { channelData, frequencyData } = body;

    // Create user and schedule in a transaction
    const result = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      // Check if user already exists
      const {data: { email }} = channelData;
      const { selectedChannel: channel } = channelData;
      const { selectedSchedule: frequency, timeOfDay, timezone } = frequencyData;
      const name = body.name || null;

      let user: User | null = await tx.user.findUnique({
        where: { email },
      });

      console.log("Onboarding - user found:", user);

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

      // // Create a new schedule for the user
      // const schedule: Schedule = await tx.schedule.create({
      //   data: {
      //     userId: user.id,
      //     channel,
      //     frequency,
      //     timeOfDay: timeOfDay || "09:00",
      //     timezone: timezone || "UTC",
      //     isActive: true,
      //   },
      // });

      // return { user, schedule };
      return {user}
    });

    return NextResponse.json({
      success: true,
      data: {
        userId: result.user.id,
        email: result.user.email,
      }
      
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
