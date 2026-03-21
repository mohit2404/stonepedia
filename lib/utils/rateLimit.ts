import { NextRequest } from "next/server";

// Simple in-memory rate limiter for demo
const requestCounts = new Map<string, { count: number; resetTime: number }>();

const WINDOW_MS = 60 * 1000; // 1 minute
const MAX_REQUESTS = 20; // 20 requests per minute per IP

export function rateLimit(req: NextRequest): {
  success: boolean;
  error?: Response;
} {
  const ip =
    req.headers.get("x-forwarded-for")?.split(",")[0] ||
    req.headers.get("x-real-ip") ||
    "unknown";

  const now = Date.now();
  const record = requestCounts.get(ip);

  // Reset window if expired
  if (!record || now > record.resetTime) {
    requestCounts.set(ip, { count: 1, resetTime: now + WINDOW_MS });
    return { success: true };
  }

  // Increment count
  record.count++;

  if (record.count > MAX_REQUESTS) {
    return {
      success: false,
      error: Response.json(
        { success: false, error: "Too many requests. Please slow down." },
        {
          status: 429,
          headers: {
            "Retry-After": "60",
            "X-RateLimit-Limit": String(MAX_REQUESTS),
            "X-RateLimit-Remaining": "0",
          },
        },
      ),
    };
  }

  return { success: true };
}
