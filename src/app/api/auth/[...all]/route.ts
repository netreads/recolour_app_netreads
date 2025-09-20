import { auth } from "@/lib/auth";
import "@noble/hashes/sha3.js";

// Force Node.js runtime
export const runtime = 'nodejs';

export const GET = auth.handler;
export const POST = auth.handler;

// Explicitly export head/options for Next.js routing and CORS preflight
// export const HEAD = auth.handler as unknown as typeof GET;
// export const OPTIONS = auth.handler as unknown as typeof GET;
