import { NextRequest, NextResponse } from "next/server";
import { getServerUser, syncUserToDatabase } from "@/lib/auth";

export async function POST(request: NextRequest) {
  try {
    // Get the current Supabase user
    const supabaseUser = await getServerUser();

    if (!supabaseUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Sync user to Neon database
    const neonUser = await syncUserToDatabase(supabaseUser);

    if (!neonUser) {
      return NextResponse.json({ error: "Failed to sync user to database" }, { status: 500 });
    }

    return NextResponse.json({
      message: "User synced successfully",
      user: {
        id: neonUser.id,
        email: neonUser.email,
        credits: neonUser.credits,
        welcomeCreditsGiven: neonUser.welcomeCreditsGiven,
      }
    });
  } catch (error) {
    console.error("Error syncing user:", error);
    return NextResponse.json(
      { error: "Failed to sync user" },
      { status: 500 }
    );
  }
}
