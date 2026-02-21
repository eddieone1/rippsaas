import { NextResponse } from "next/server";
import { ApiAuthError } from "@/lib/auth/guards";

/**
 * Standardised API response helpers.
 * Every API route should use these to ensure consistent JSON shapes:
 *   Success → { success: true, data?: T }
 *   Error   → { error: string, details?: unknown }
 */

export function successResponse<T>(data?: T, status = 200) {
  return NextResponse.json(
    data !== undefined ? { success: true, data } : { success: true },
    { status }
  );
}

export function errorResponse(message: string, status = 500, details?: unknown) {
  return NextResponse.json(
    details !== undefined ? { error: message, details } : { error: message },
    { status }
  );
}

/**
 * Catch-all error handler for API routes.
 * Converts known error types (ApiAuthError, ZodError, etc.) into proper JSON responses.
 */
export function handleApiError(error: unknown, context?: string): NextResponse {
  if (error instanceof ApiAuthError) {
    return errorResponse(error.message, error.status);
  }

  // Re-throw Next.js redirect errors so the framework can handle them
  if (error instanceof Error && error.message === "NEXT_REDIRECT") {
    throw error;
  }

  const message = error instanceof Error ? error.message : "An unexpected error occurred";
  if (context) {
    console.error(`${context}:`, error);
  }
  return errorResponse(message, 500);
}
