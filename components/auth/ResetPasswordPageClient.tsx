"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import ResetPasswordForm from "@/components/auth/ResetPasswordForm";

export default function ResetPasswordPageClient() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    const handlePasswordReset = async () => {
      const supabase = createClient();

      // Check if there's a hash in the URL (password reset token)
      const hashParams = new URLSearchParams(window.location.hash.substring(1));
      const accessToken = hashParams.get("access_token");
      const type = hashParams.get("type");

      // If we have a recovery token in the URL, exchange it for a session
      if (accessToken && type === "recovery") {
        try {
          const { error: exchangeError } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: hashParams.get("refresh_token") || "",
          });

          if (exchangeError) {
            setError("Invalid or expired reset link. Please request a new password reset.");
            setLoading(false);
            return;
          }

          // Clear the hash from URL
          window.history.replaceState(null, "", window.location.pathname);
          setIsAuthenticated(true);
          setLoading(false);
        } catch (err) {
          setError("Failed to process reset link. Please try again.");
          setLoading(false);
        }
      } else {
        // Check if user is already authenticated
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (user) {
          setIsAuthenticated(true);
          setLoading(false);
        } else {
          setError("No valid reset token found. Please request a new password reset link.");
          setLoading(false);
        }
      }
    };

    handlePasswordReset();
  }, []);

  if (loading) {
    return (
      <div className="flex flex-1 w-full items-center justify-center px-4">
        <div className="w-full max-w-md space-y-8 rounded-lg bg-gray-100 border border-gray-200 p-8 shadow-md">
          <div className="text-center">
            <p className="text-sm text-gray-600">Verifying reset link...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error || !isAuthenticated) {
    return (
      <div className="flex flex-1 w-full items-center justify-center px-4">
        <div className="w-full max-w-md space-y-8 rounded-lg bg-gray-100 border border-gray-200 p-8 shadow-md">
          <div>
            <h2 className="mt-6 text-center text-3xl font-bold tracking-tight text-gray-900">
              Invalid Reset Link
            </h2>
            <p className="mt-2 text-center text-sm text-gray-600">{error}</p>
          </div>
          <div className="text-center">
            <a
              href="/forgot-password"
              className="text-sm font-medium text-lime-600 hover:text-lime-500"
            >
              Request a new password reset link
            </a>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-1 w-full items-center justify-center px-4">
      <div className="w-full max-w-md space-y-8 rounded-lg bg-gray-100 border border-gray-200 p-8 shadow-md">
        <div>
          <h2 className="mt-6 text-center text-3xl font-bold tracking-tight text-gray-900">
            Set new password
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Enter your new password below.
          </p>
        </div>
        <ResetPasswordForm />
      </div>
    </div>
  );
}
