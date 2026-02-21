"use client";

import { useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

export default function ForgotPasswordForm() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    try {
      const supabase = createClient();
      // Use NEXT_PUBLIC_APP_URL if set, otherwise fall back to window.location.origin
      // Ensure we use https in production
      const baseUrl = 
        typeof window !== 'undefined' 
          ? (process.env.NEXT_PUBLIC_APP_URL || window.location.origin)
          : process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
      
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${baseUrl}/reset-password`,
      });

      if (error) {
        setMessage({ type: "error", text: error.message });
        setLoading(false);
        return;
      }

      setMessage({
        type: "success",
        text: "Check your email for a password reset link. If you don't see it, check your spam folder.",
      });
      setLoading(false);
    } catch (err) {
      setMessage({ type: "error", text: "An unexpected error occurred" });
      setLoading(false);
    }
  };

  return (
    <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
      {message && (
        <div
          className={`rounded-md p-4 ${
            message.type === "success"
              ? "bg-green-50 text-green-800"
              : "bg-red-50 text-red-800"
          }`}
        >
          <p className="text-sm">{message.text}</p>
        </div>
      )}
      <div className="space-y-4 rounded-md">
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-700">
            Email address
          </label>
          <input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="mt-1 block w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-gray-900 shadow-sm placeholder:text-gray-400 focus:border-lime-500 focus:outline-none focus:ring-lime-500"
            placeholder="you@example.com"
          />
        </div>
      </div>

      <div>
        <button
          type="submit"
          disabled={loading}
          className="group relative flex w-full justify-center rounded-md border border-transparent bg-lime-500 px-4 py-2 text-sm font-medium text-gray-900 hover:bg-lime-400 focus:outline-none focus:ring-2 focus:ring-lime-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? "Sending..." : "Send reset link"}
        </button>
      </div>

      <div className="text-center">
        <Link
          href="/login"
          className="text-sm font-medium text-lime-600 hover:text-lime-500"
        >
          ← Back to sign in
        </Link>
      </div>
    </form>
  );
}
