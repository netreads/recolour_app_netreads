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

    // Force refresh user data from database
    const db = getDatabase();
    const userData = await db.getUserById(user.id);
    
    if (!userData) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json({
      id: userData.id,
      email: userData.email,
      credits: userData.credits,
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
