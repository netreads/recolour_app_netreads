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

    // Force refresh user data from database
    const db = getDatabase();
    const user = await db.getUserById(session.user.id);
    
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json({
      id: user.id,
      email: user.email,
      credits: user.credits,
      refreshed: true,
    });
  } catch (error) {
    console.error("Error refreshing user data:", error);
    return NextResponse.json(
      { error: "Failed to refresh user data" },
      { status: 500 }
    );
  }
}
