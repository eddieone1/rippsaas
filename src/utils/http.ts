/**
 * Reusable HTTP client with retry, JSON parsing, and basic rate limit handling.
 */

import { withRetry, RetryOptions } from "./retry";
import { createLogger } from "./logger";

const log = createLogger("http");

export interface HttpClientOptions {
  baseUrl: string;
  headers?: Record<string, string>;
  retry?: RetryOptions;
}

export interface RequestOptions {
  method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  headers?: Record<string, string>;
  searchParams?: Record<string, string | number | undefined>;
  body?: unknown;
}

export class HttpError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly body?: unknown
  ) {
    super(message);
    this.name = "HttpError";
  }
}

function buildUrl(base: string, path: string, searchParams?: Record<string, string | number | undefined>): string {
  const url = new URL(path.startsWith("http") ? path : path, base);
  if (searchParams) {
    Object.entries(searchParams).forEach(([k, v]) => {
      if (v !== undefined && v !== "") url.searchParams.set(k, String(v));
    });
  }
  return url.toString();
}

export function createHttpClient(options: HttpClientOptions) {
  const { baseUrl, headers: defaultHeaders = {}, retry: retryOptions } = options;

  async function request<T>(path: string, opts: RequestOptions = {}): Promise<T> {
    const { method = "GET", headers = {}, searchParams, body } = opts;
    const url = buildUrl(baseUrl, path, searchParams);
    const headersCombined = { "Content-Type": "application/json", ...defaultHeaders, ...headers };

    const doFetch = async (): Promise<T> => {
      const res = await fetch(url, {
        method,
        headers: headersCombined,
        body: body !== undefined ? JSON.stringify(body) : undefined,
      });

      if (res.status === 429) {
        const retryAfter = res.headers.get("Retry-After");
        const waitMs = retryAfter ? parseInt(retryAfter, 10) * 1000 : 60000;
        log.warn("Rate limited", { status: 429, retryAfter: waitMs });
        await new Promise((r) => setTimeout(r, waitMs));
        return doFetch();
      }

      let parsed: unknown;
      const contentType = res.headers.get("Content-Type") || "";
      if (contentType.includes("application/json")) {
        try {
          parsed = await res.json();
        } catch {
          parsed = await res.text();
        }
      } else {
        parsed = await res.text();
      }

      if (!res.ok) {
        throw new HttpError(res.statusText || `HTTP ${res.status}`, res.status, parsed);
      }

      return parsed as T;
    }

    return withRetry(doFetch, retryOptions);
  }

  return {
    get: <T>(path: string, searchParams?: RequestOptions["searchParams"]) =>
      request<T>(path, { method: "GET", searchParams }),
    post: <T>(path: string, body?: unknown) => request<T>(path, { method: "POST", body }),
    put: <T>(path: string, body?: unknown) => request<T>(path, { method: "PUT", body }),
    patch: <T>(path: string, body?: unknown) => request<T>(path, { method: "PATCH", body }),
    delete: <T>(path: string) => request<T>(path, { method: "DELETE" }),
  };
}
