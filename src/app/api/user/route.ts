import { NextRequest, NextResponse } from "next/server";
import { getServerUserWithSync } from "@/lib/auth";
import { getDatabase } from "@/lib/db";

export async function GET(request: NextRequest) {
  try {
    // Verify authentication and sync user to database
    const userData = await getServerUserWithSync();

    if (!userData?.neonUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = userData.neonUser;

    // Get user data including credits
    const db = getDatabase();
    const dbUserData = await db.getUserById(user.id);
    
    if (!dbUserData) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json({
      id: dbUserData.id,
      email: dbUserData.email,
      credits: dbUserData.credits,
    });
  } catch (error) {
    console.error("Error fetching user data:", error);
    return NextResponse.json(
      { error: "Failed to fetch user data" },
      { status: 500 }
    );
  }
}
