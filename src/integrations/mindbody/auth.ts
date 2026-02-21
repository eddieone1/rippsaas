/**
 * Mindbody API authentication.
 * Uses API key, Site ID, and Bearer token from environment.
 */

export interface MindbodyAuthConfig {
  apiKey: string;
  siteId: string;
  accessToken: string;
}

export function getMindbodyAuthFromEnv(): MindbodyAuthConfig {
  const apiKey = process.env.MINDBODY_API_KEY;
  const siteId = process.env.MINDBODY_SITE_ID;
  const accessToken = process.env.MINDBODY_ACCESS_TOKEN;
  if (!apiKey || !siteId || !accessToken) {
    throw new Error(
      "Missing Mindbody credentials. Set MINDBODY_API_KEY, MINDBODY_SITE_ID, and MINDBODY_ACCESS_TOKEN."
    );
  }
  return { apiKey, siteId, accessToken };
}

export function getMindbodyHeaders(config: MindbodyAuthConfig): Record<string, string> {
  return {
    "Api-Key": config.apiKey,
    "Site-ID": config.siteId,
    Authorization: `Bearer ${config.accessToken}`,
  };
}
