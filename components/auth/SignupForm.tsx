"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { validatePassword, PASSWORD_RULES_TEXT } from "@/lib/password-rules";

export default function SignupForm() {
  const router = useRouter();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [clientCount, setClientCount] = useState<string>("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [emailVerificationSent, setEmailVerificationSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    const passwordCheck = validatePassword(password);
    if (!passwordCheck.valid) {
      setError(passwordCheck.message ?? PASSWORD_RULES_TEXT);
      return;
    }

    if (!fullName || fullName.trim().length === 0) {
      setError("Full name is required");
      return;
    }

    if (!clientCount) {
      setError("Please select your client count range");
      return;
    }

    setLoading(true);

    try {
      // Use API route to create user and gym
      const response = await fetch("/api/auth/signup", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email,
          password,
          fullName: fullName.trim(),
          clientCount,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Failed to create account");
        setLoading(false);
        return;
      }

      // Sign in with the created account
      const supabase = createClient();
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (signInError) {
        // Account was created successfully, but sign-in failed (likely email verification required)
        // Always show email verification message since account creation succeeded
        setEmailVerificationSent(true);
        setError(null);
        setLoading(false);
        return;
      }

      // Redirect to onboarding welcome
      router.push("/onboarding/welcome");
      router.refresh();
    } catch (err) {
      setError("An unexpected error occurred");
      setLoading(false);
    }
  };

  return (
    <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
      <div className="text-center text-sm text-gray-600 mb-4">
        Already have an invite?{" "}
        <a
          href="/join"
          className="font-medium text-lime-600 hover:text-lime-500"
        >
          Join organisation
        </a>
      </div>
      {emailVerificationSent && (
        <div className="rounded-md bg-green-50 p-4">
          <p className="text-sm text-green-800">
            Account created successfully! Please check your email and click the verification link to activate your account.
          </p>
        </div>
      )}
      {error && (
        <div className="rounded-md bg-red-50 p-4">
          <p className="text-sm text-red-800">{error}</p>
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
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 shadow-sm placeholder:text-gray-400 focus:border-lime-500 focus:outline-none focus:ring-lime-500"
            placeholder="you@example.com"
          />
        </div>
        <div>
          <label htmlFor="fullName" className="block text-sm font-medium text-gray-700">
            Full Name
          </label>
          <input
            id="fullName"
            name="fullName"
            type="text"
            autoComplete="name"
            required
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 shadow-sm placeholder:text-gray-400 focus:border-lime-500 focus:outline-none focus:ring-lime-500"
            placeholder="John Doe"
          />
        </div>
        <div>
          <label htmlFor="password" className="block text-sm font-medium text-gray-700">
            Password
          </label>
          <input
            id="password"
            name="password"
            type="password"
            autoComplete="new-password"
            required
            minLength={8}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 shadow-sm placeholder:text-gray-400 focus:border-lime-500 focus:outline-none focus:ring-lime-500"
            placeholder="••••••••"
          />
          <p className="mt-1 text-xs text-gray-500">{PASSWORD_RULES_TEXT}</p>
        </div>
        <div>
          <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">
            Confirm Password
          </label>
          <input
            id="confirmPassword"
            name="confirmPassword"
            type="password"
            autoComplete="new-password"
            required
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 shadow-sm placeholder:text-gray-400 focus:border-lime-500 focus:outline-none focus:ring-lime-500"
            placeholder="••••••••"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Number of Clients
          </label>
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setClientCount("0-50")}
              className={`rounded-md border-2 px-4 py-3 text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-lime-500 ${
                clientCount === "0-50"
                  ? "border-lime-600 bg-lime-50 text-lime-900"
                  : "border-gray-300 bg-white text-gray-700 hover:bg-gray-50"
              }`}
            >
              0-50
            </button>
            <button
              type="button"
              onClick={() => setClientCount("51-150")}
              className={`rounded-md border-2 px-4 py-3 text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-lime-500 ${
                clientCount === "51-150"
                  ? "border-lime-600 bg-lime-50 text-lime-900"
                  : "border-gray-300 bg-white text-gray-700 hover:bg-gray-50"
              }`}
            >
              51-150
            </button>
            <button
              type="button"
              onClick={() => setClientCount("151-500")}
              className={`rounded-md border-2 px-4 py-3 text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-lime-500 ${
                clientCount === "151-500"
                  ? "border-lime-600 bg-lime-50 text-lime-900"
                  : "border-gray-300 bg-white text-gray-700 hover:bg-gray-50"
              }`}
            >
              151-500
            </button>
            <button
              type="button"
              onClick={() => setClientCount("501+")}
              className={`rounded-md border-2 px-4 py-3 text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-lime-500 ${
                clientCount === "501+"
                  ? "border-lime-600 bg-lime-50 text-lime-900"
                  : "border-gray-300 bg-white text-gray-700 hover:bg-gray-50"
              }`}
            >
              501+
            </button>
          </div>
          <p className="mt-2 text-xs text-gray-500">
            This helps us personalise your experience
          </p>
        </div>
      </div>

      <div>
        <button
          type="submit"
          disabled={loading}
          className="group relative flex w-full justify-center rounded-md border border-transparent bg-lime-500 px-4 py-2 text-sm font-medium text-gray-900 hover:bg-lime-400 focus:outline-none focus:ring-2 focus:ring-lime-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? "Creating account..." : "Create account"}
        </button>
      </div>
    </form>
  );
}
