import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getDatabase } from "@/lib/db";

export async function POST(request: NextRequest) {
  try {
    // Verify authentication
    const session = await auth.api.getSession({
      headers: request.headers,
    });

    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get user data
    const db = getDatabase();
    const user = await db.getUserById(session.user.id);
    
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Only give credits if user has 0 credits (first time)
    if ((user as any).credits === 0) {
      const updatedUser = await db.addCredits(session.user.id, 1);
      console.log(`Gave 1 free HD credit to new user: ${session.user.email}`);
      
      return NextResponse.json({
        success: true,
        credits: (updatedUser as any).credits,
        message: "Welcome! You've received 1 free HD credit."
      });
    } else {
      return NextResponse.json({
        success: false,
        credits: (user as any).credits,
        message: "You already have credits."
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
