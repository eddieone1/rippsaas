"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

interface StudioIntegrationStatus {
  hasMindbodyCredentials: boolean;
  hasGlofoxCredentials: boolean;
}

export default function StudioIntegrationsSection({ onSuccess }: { onSuccess?: (msg: string) => void } = {}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [status, setStatus] = useState<StudioIntegrationStatus | null>(null);

  const [mindbodyApiKey, setMindbodyApiKey] = useState("");
  const [mindbodySiteId, setMindbodySiteId] = useState("");
  const [mindbodyAccessToken, setMindbodyAccessToken] = useState("");
  const [glofoxAccessToken, setGlofoxAccessToken] = useState("");
  const [glofoxBaseUrl, setGlofoxBaseUrl] = useState("");

  useEffect(() => {
    fetch("/api/settings/integrations")
      .then((res) => res.json())
      .then((data) => {
        if (data.hasMindbodyCredentials !== undefined && data.hasGlofoxCredentials !== undefined) {
          setStatus({
            hasMindbodyCredentials: data.hasMindbodyCredentials,
            hasGlofoxCredentials: data.hasGlofoxCredentials,
          });
        }
      })
      .catch(() => setStatus({ hasMindbodyCredentials: false, hasGlofoxCredentials: false }));
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setLoading(true);
    try {
      const body: Record<string, string | null> = {};
      if (mindbodyApiKey.trim()) body.mindbody_api_key = mindbodyApiKey.trim();
      if (mindbodySiteId.trim()) body.mindbody_site_id = mindbodySiteId.trim();
      if (mindbodyAccessToken.trim()) body.mindbody_access_token = mindbodyAccessToken.trim();
      if (glofoxAccessToken.trim()) body.glofox_access_token = glofoxAccessToken.trim();
      if (glofoxBaseUrl.trim()) body.glofox_base_url = glofoxBaseUrl.trim();

      const res = await fetch("/api/settings/profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed to save");
        return;
      }
      setSuccess("Studio integrations saved.");
      onSuccess?.("Studio integrations saved");
      setMindbodyApiKey("");
      setMindbodySiteId("");
      setMindbodyAccessToken("");
      setGlofoxAccessToken("");
      setGlofoxBaseUrl("");
      router.refresh();
      fetch("/api/settings/integrations")
        .then((r) => r.json())
        .then((d) => {
          if (d.hasMindbodyCredentials !== undefined && d.hasGlofoxCredentials !== undefined) {
            setStatus({
              hasMindbodyCredentials: d.hasMindbodyCredentials,
              hasGlofoxCredentials: d.hasGlofoxCredentials,
            });
          }
        });
    } catch {
      setError("Failed to save");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-6 shadow">
      <h2 className="text-lg font-semibold text-gray-900 mb-1">Studio integrations</h2>
      <p className="text-sm text-gray-600 mb-4">
        Connect Mindbody or Glofox to sync members, attendance, and payments. Keeps churn scoring accurate.
      </p>

      {error && (
        <div className="mb-4 rounded-md bg-red-50 p-3 text-sm text-red-800">{error}</div>
      )}
      {success && (
        <div className="mb-4 rounded-md bg-green-50 p-3 text-sm text-green-800">{success}</div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <h3 className="text-base font-semibold text-gray-900 mb-2">Mindbody</h3>
          <p className="text-xs text-gray-500 mb-3">
            API key, Site ID, and access token from your Mindbody developer account. Used to fetch clients, visits, contracts, and sales.
          </p>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">API key</label>
              <input
                type="password"
                value={mindbodyApiKey}
                onChange={(e) => setMindbodyApiKey(e.target.value)}
                placeholder={status?.hasMindbodyCredentials ? "Enter new key to replace" : "Mindbody API key"}
                autoComplete="off"
                className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-gray-900 font-mono focus:border-lime-500 focus:outline-none focus:ring-lime-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Site ID</label>
              <input
                type="text"
                value={mindbodySiteId}
                onChange={(e) => setMindbodySiteId(e.target.value)}
                placeholder={status?.hasMindbodyCredentials ? "Enter new to replace" : "Site ID"}
                autoComplete="off"
                className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-gray-900 focus:border-lime-500 focus:outline-none focus:ring-lime-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Access token</label>
              <input
                type="password"
                value={mindbodyAccessToken}
                onChange={(e) => setMindbodyAccessToken(e.target.value)}
                placeholder={status?.hasMindbodyCredentials ? "Enter new token to replace" : "Bearer token"}
                autoComplete="off"
                className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-gray-900 font-mono focus:border-lime-500 focus:outline-none focus:ring-lime-500"
              />
            </div>
            {status?.hasMindbodyCredentials && (
              <p className="text-xs text-green-700">Mindbody credentials are set. Enter new values to replace.</p>
            )}
          </div>
        </div>

        <div>
          <h3 className="text-base font-semibold text-gray-900 mb-2">Glofox</h3>
          <p className="text-xs text-gray-500 mb-3">
            Access token from Glofox. Optionally set a custom base URL if your account uses a different API endpoint.
          </p>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Access token</label>
              <input
                type="password"
                value={glofoxAccessToken}
                onChange={(e) => setGlofoxAccessToken(e.target.value)}
                placeholder={status?.hasGlofoxCredentials ? "Enter new token to replace" : "Glofox Bearer token"}
                autoComplete="off"
                className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-gray-900 font-mono focus:border-lime-500 focus:outline-none focus:ring-lime-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Base URL (optional)</label>
              <input
                type="url"
                value={glofoxBaseUrl}
                onChange={(e) => setGlofoxBaseUrl(e.target.value)}
                placeholder="https://api.glofox.com/v2"
                autoComplete="off"
                className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-gray-900 focus:border-lime-500 focus:outline-none focus:ring-lime-500"
              />
              <p className="mt-1 text-xs text-gray-500">Leave blank for default Glofox API URL.</p>
            </div>
            {status?.hasGlofoxCredentials && (
              <p className="text-xs text-green-700">Glofox credentials are set. Enter new values to replace.</p>
            )}
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="rounded-md bg-lime-500 px-4 py-2 text-sm font-medium text-gray-900 hover:bg-lime-400 disabled:opacity-50"
        >
          {loading ? "Saving…" : "Save studio integrations"}
        </button>
      </form>
    </div>
  );
}
