/**
 * Fetch wrapper that handles 401/403 by redirecting to login with a reason.
 * Use for API calls that require authentication.
 */
export async function fetchWithAuth(
  input: RequestInfo | URL,
  init?: RequestInit
): Promise<Response> {
  const res = await fetch(input, init);
  if (res.status === 401 || res.status === 403) {
    if (typeof window !== "undefined") {
      const returnUrl = encodeURIComponent(window.location.pathname + window.location.search);
      window.location.href = `/login?reason=session_expired&returnUrl=${returnUrl}`;
    }
    throw new Error("Session expired");
  }
  return res;
}
