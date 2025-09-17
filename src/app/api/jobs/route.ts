import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getDatabase } from "@/lib/db";

// Force Node.js runtime since we're using better-sqlite3
export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  try {
    // Verify authentication
    const session = await auth.api.getSession({
      headers: request.headers,
    });

    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get jobs from database
    const db = getDatabase();
    const jobs = await db.getJobsByUserId(session.user.id);

    // Transform field names to match frontend expectations
    const transformedJobs = jobs.map(job => ({
      id: job.id,
      original_url: job.originalUrl,
      output_url: job.outputUrl,
      status: job.status.toLowerCase(),
      created_at: job.createdAt.toISOString(),
    }));

    return NextResponse.json({ jobs: transformedJobs });
  } catch (error) {
    console.error("Error fetching jobs:", error);
    return NextResponse.json(
      { error: "Failed to fetch jobs" },
      { status: 500 }
    );
  }
}
