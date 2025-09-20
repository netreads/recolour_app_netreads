import { NextRequest, NextResponse } from "next/server";
import { getServerUser } from "@/lib/auth";
import { getDatabase } from "@/lib/db";

export async function POST(request: NextRequest) {
  try {
    // Verify authentication
    const user = await getServerUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get user data
    const db = getDatabase();
    const userData = await db.getUserById(user.id);
    
    if (!userData) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Only give credits if user hasn't received welcome credits yet (fresh signup)
    if (!(userData as any).welcomeCreditsGiven) {
      const updatedUser = await db.addCredits(user.id, 1);
      // Mark that welcome credits have been given
      await db.markWelcomeCreditsGiven(user.id);
      console.log(`Gave 1 free HD credit to new user: ${user.email}`);
      
      return NextResponse.json({
        success: true,
        credits: (updatedUser as any).credits,
        message: "Welcome! You've received 1 free HD credit."
      });
    } else {
      return NextResponse.json({
        success: false,
        credits: (userData as any).credits,
        message: "Welcome credits already given."
      });
    }
  } catch (error) {
    console.error("Error giving welcome credits:", error);
    return NextResponse.json(
      { error: "Failed to give welcome credits" },
      { status: 500 }
    );
  }
}
