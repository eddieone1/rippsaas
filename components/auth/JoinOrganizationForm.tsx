"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";

export default function JoinOrganizationForm({ token }: { token?: string }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [inviteToken, setInviteToken] = useState(token || "");
  const [invites, setInvites] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingInvites, setLoadingInvites] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Load pending invites on mount
  useEffect(() => {
    loadInvites();
  }, []);

  const loadInvites = async () => {
    try {
      const response = await fetch("/api/organizations/invites");
      const data = await response.json();
      if (response.ok) {
        setInvites(data.invites || []);
      }
    } catch (err) {
      console.error("Failed to load invites:", err);
    } finally {
      setLoadingInvites(false);
    }
  };

  const handleJoin = async (tokenToUse: string) => {
    setError(null);
    setLoading(true);

    try {
      const response = await fetch("/api/organizations/join", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ token: tokenToUse }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Failed to join organisation");
        setLoading(false);
        return;
      }

      setSuccess(true);
      setTimeout(() => {
        router.push("/dashboard");
        router.refresh();
      }, 1500);
    } catch (err) {
      setError("An unexpected error occurred");
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteToken.trim()) {
      setError("Please enter an invite token");
      return;
    }
    await handleJoin(inviteToken.trim());
  };

  if (success) {
    return (
      <div className="rounded-md bg-green-50 p-4">
        <p className="text-sm text-green-800">
          Successfully joined organization! Redirecting...
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {error && (
        <div className="rounded-md bg-red-50 p-4">
          <p className="text-sm text-red-800">{error}</p>
        </div>
      )}

      {/* Pending Invites */}
      {loadingInvites ? (
        <div className="text-center text-sm text-gray-500">Loading invites...</div>
      ) : invites.length > 0 ? (
        <div>
          <h3 className="text-sm font-medium text-gray-700 mb-3">
            Pending Invitations
          </h3>
          <div className="space-y-2">
            {invites.map((invite) => (
              <div
                key={invite.id}
                className="flex items-center justify-between rounded-md border border-gray-200 p-3"
              >
                <div>
                  <p className="text-sm font-medium text-gray-900">
                    {invite.gyms?.name || "Organisation"}
                  </p>
                  <p className="text-xs text-gray-500">
                    Invited by {invite.users?.full_name || "Owner"} • Role: {invite.role === 'owner' ? 'Owner' : 'Coach'}
                  </p>
                </div>
                <button
                  onClick={() => handleJoin(invite.token)}
                  disabled={loading}
                  className="rounded-md bg-lime-500 px-3 py-1.5 text-xs font-medium text-gray-900 hover:bg-lime-400 disabled:opacity-50"
                >
                  Accept
                </button>
              </div>
            ))}
          </div>
        </div>
      ) : null}

      {/* Manual Token Entry */}
      <div>
        <h3 className="text-sm font-medium text-gray-700 mb-3">
          {invites.length > 0 ? "Or enter invite token manually" : "Enter Invite Token"}
        </h3>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="token" className="block text-sm font-medium text-gray-700">
              Invite Token
            </label>
            <input
              id="token"
              name="token"
              type="text"
              value={inviteToken}
              onChange={(e) => setInviteToken(e.target.value)}
              placeholder="Enter invite token"
              className="mt-1 block w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-gray-900 shadow-sm placeholder:text-gray-400 focus:border-lime-500 focus:outline-none focus:ring-lime-500"
            />
            <p className="mt-1 text-xs text-gray-500">
              You received this token in your invitation email
            </p>
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-md border border-transparent bg-lime-500 px-4 py-2 text-sm font-medium text-gray-900 hover:bg-lime-400 focus:outline-none focus:ring-2 focus:ring-lime-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? "Joining..." : "Join Organization"}
          </button>
        </form>
      </div>

      <div className="text-center">
        <a
          href="/signup"
          className="text-sm text-lime-600 hover:text-lime-500"
        >
          Create a new organisation instead
        </a>
      </div>
    </div>
  );
}
