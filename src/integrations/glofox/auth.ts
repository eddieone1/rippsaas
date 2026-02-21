/**
 * Glofox API authentication.
 * Bearer token from env; base URL can be tenant-specific (GLOFOX_BASE_URL).
 */

export interface GlofoxAuthConfig {
  accessToken: string;
  baseUrl?: string;
}

const DEFAULT_GLOFOX_BASE = "https://api.glofox.com/v2";

export function getGlofoxAuthFromEnv(): GlofoxAuthConfig {
  const accessToken = process.env.GLOFOX_ACCESS_TOKEN;
  if (!accessToken) {
    throw new Error("Missing Glofox credentials. Set GLOFOX_ACCESS_TOKEN.");
  }
  return {
    accessToken,
    baseUrl: process.env.GLOFOX_BASE_URL || DEFAULT_GLOFOX_BASE,
  };
}

export function getGlofoxHeaders(config: GlofoxAuthConfig): Record<string, string> {
  return {
    Authorization: `Bearer ${config.accessToken}`,
    "Content-Type": "application/json",
  };
}
