/**
 * Glofox HTTP client with auth and configurable base URL.
 */

import { createHttpClient } from "../../utils/http";
import { getGlofoxHeaders } from "./auth";
import type { GlofoxAuthConfig } from "./auth";

export function createGlofoxClient(config: GlofoxAuthConfig) {
  const baseUrl = (config.baseUrl || "https://api.glofox.com/v2").replace(/\/$/, "");
  const headers = getGlofoxHeaders(config);
  return createHttpClient({
    baseUrl,
    headers,
    retry: { maxAttempts: 3, retryableStatuses: [429, 500, 502, 503, 504] },
  });
}

export type GlofoxClientInstance = ReturnType<typeof createGlofoxClient>;
