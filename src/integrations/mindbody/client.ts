/**
 * Mindbody HTTP client with auth and base URL.
 */

import { createHttpClient } from "../../utils/http";
import { getMindbodyHeaders } from "./auth";
import type { MindbodyAuthConfig } from "./auth";

export const MINDBODY_BASE_URL = "https://api.mindbodyonline.com/public/v6";

export function createMindbodyClient(config: MindbodyAuthConfig) {
  const headers = getMindbodyHeaders(config);
  return createHttpClient({
    baseUrl: MINDBODY_BASE_URL,
    headers,
    retry: { maxAttempts: 3, retryableStatuses: [429, 500, 502, 503, 504] },
  });
}

export type MindbodyClientInstance = ReturnType<typeof createMindbodyClient>;
