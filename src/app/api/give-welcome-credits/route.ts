import { NextRequest, NextResponse } from "next/server";
import { getServerUser } from "@/lib/auth";
import { getDatabase } from "@/lib/db";
import { logAuthError } from "@/lib/auth-errors";

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

    // Use atomic transaction for welcome credits
    try {
      const updatedUser = await db.giveWelcomeCreditsAtomically(user.id, 1);
      
      return NextResponse.json({
        success: true,
        credits: updatedUser.credits,
        message: "Welcome! You've received 1 free HD credit."
      });
    } catch (creditError: any) {
      if (creditError.message === 'Welcome credits already given') {
        return NextResponse.json({
          success: false,
          credits: userData.credits,
          message: "Welcome credits already given."
        });
      }
      throw creditError;
    }
  } catch (error) {
    logAuthError(error, 'give-welcome-credits');
    return NextResponse.json(
      { error: "Failed to give welcome credits" },
      { status: 500 }
    );
  }
}
