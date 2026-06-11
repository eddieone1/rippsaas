"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { validatePassword, getPasswordRuleStatus } from "@/lib/password-rules";

function friendlyError(message: string): string {
  const lower = message.toLowerCase();
  if (lower.includes("already registered") || lower.includes("already exists") || lower.includes("user already") || lower.includes("already been registered")) {
    return "This email is already being used. Try signing in or use a different email.";
  }
  if (lower.includes("invalid email")) {
    return "Please enter a valid email address.";
  }
  if (lower.includes("password")) {
    return "Password does not meet requirements. Check the rules below.";
  }
  return message;
}

interface SignupFormProps {
  selectedPlan?: string;
}

export default function SignupForm({ selectedPlan }: SignupFormProps) {
  const router = useRouter();
  const errorRef = useRef<HTMLDivElement>(null);
  const [step, setStep] = useState<1 | 2>(1);
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [clientCount, setClientCount] = useState<string>("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [emailVerificationSent, setEmailVerificationSent] = useState(false);

  const passwordRules = getPasswordRuleStatus(password);

  useEffect(() => {
    if (error && errorRef.current) {
      errorRef.current.focus();
    }
  }, [error]);

  const handleStep1 = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    const passwordCheck = validatePassword(password);
    if (!passwordCheck.valid) {
      setError(passwordCheck.message ?? "Password does not meet requirements");
      return;
    }

    setStep(2);
  };

  const handleStep2Back = () => {
    setError(null);
    setStep(1);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

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
      const response = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          password,
          fullName: fullName.trim(),
          clientCount,
          selectedPlan: selectedPlan || null,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(friendlyError(data.error || "Failed to create account"));
        setLoading(false);
        return;
      }

      const supabase = createClient();
      const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });

      if (signInError) {
        setEmailVerificationSent(true);
        setError(null);
        setLoading(false);
        // Redirect to verify-email page so they know what to do next
        router.push(`/verify-email?email=${encodeURIComponent(email)}`);
        return;
      }

      router.push("/onboarding/welcome");
      router.refresh();
    } catch (err) {
      setError("An unexpected error occurred. Please try again.");
      setLoading(false);
    }
  };

  const RuleCheck = ({ met, label }: { met: boolean; label: string }) => (
    <li className={`flex items-center gap-2 text-xs ${met ? "text-lime-600" : "text-gray-500"}`}>
      {met ? (
        <svg className="h-4 w-4 shrink-0" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
        </svg>
      ) : (
        <span className="h-4 w-4 shrink-0 rounded-full border-2 border-gray-300" />
      )}
      {label}
    </li>
  );

  if (emailVerificationSent) {
    return (
      <div className="rounded-md bg-green-50 p-4" role="alert">
        <p className="text-sm text-green-800">
          Account created successfully! Please check your email and click the verification link to activate your account.
        </p>
      </div>
    );
  }

  if (step === 1) {
    return (
      <form className="space-y-5" onSubmit={handleStep1}>
        {error && (
          <div
            ref={errorRef}
            id="signup-error"
            role="alert"
            aria-live="polite"
            tabIndex={-1}
            className="rounded-md bg-red-50 p-4 focus:outline-none"
          >
            <p className="text-sm text-red-800">{error}</p>
          </div>
        )}
        <div className="space-y-4">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700">
              Email address
            </label>
            <input
              id="email"
              name="email"
              type="email"
              inputMode="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              aria-invalid={!!error}
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 shadow-sm placeholder:text-gray-400 focus:border-lime-500 focus:outline-none focus:ring-lime-500"
              placeholder="you@example.com"
            />
          </div>
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700">
              Password
            </label>
            <div className="relative mt-1">
              <input
                id="password"
                name="password"
                type={showPassword ? "text" : "password"}
                autoComplete="new-password"
                required
                minLength={8}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                aria-invalid={!!error}
                className="block w-full rounded-md border border-gray-300 px-3 py-2 pr-10 text-gray-900 shadow-sm placeholder:text-gray-400 focus:border-lime-500 focus:outline-none focus:ring-lime-500"
                placeholder="••••••••"
              />
              <button
                type="button"
                onClick={() => setShowPassword((p) => !p)}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-2 text-gray-500 hover:text-gray-700 focus:outline-none focus:text-lime-600"
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? (
                  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                  </svg>
                ) : (
                  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                )}
              </button>
            </div>
            <ul className="mt-2 space-y-1">
              <RuleCheck met={passwordRules.length} label="At least 8 characters" />
              <RuleCheck met={passwordRules.upper} label="One uppercase letter" />
              <RuleCheck met={passwordRules.lower} label="One lowercase letter" />
              <RuleCheck met={passwordRules.number} label="One number" />
            </ul>
          </div>
          <div>
            <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">
              Confirm password
            </label>
            <div className="relative mt-1">
              <input
                id="confirmPassword"
                name="confirmPassword"
                type={showConfirmPassword ? "text" : "password"}
                autoComplete="new-password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                aria-invalid={!!error}
                className="block w-full rounded-md border border-gray-300 px-3 py-2 pr-10 text-gray-900 shadow-sm placeholder:text-gray-400 focus:border-lime-500 focus:outline-none focus:ring-lime-500"
                placeholder="••••••••"
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword((p) => !p)}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-2 text-gray-500 hover:text-gray-700 focus:outline-none focus:text-lime-600"
                aria-label={showConfirmPassword ? "Hide password" : "Show password"}
              >
                {showConfirmPassword ? (
                  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                  </svg>
                ) : (
                  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                )}
              </button>
            </div>
          </div>
        </div>
        <button
          type="submit"
          className="w-full justify-center rounded-md border border-transparent bg-lime-500 px-4 py-3 text-sm font-medium text-gray-900 hover:bg-lime-400 focus:outline-none focus:ring-2 focus:ring-lime-500 focus:ring-offset-2 min-h-[44px]"
        >
          Continue
        </button>
      </form>
    );
  }

  return (
    <form className="space-y-5" onSubmit={handleSubmit} aria-describedby={error ? "signup-error" : undefined}>
      {error && (
        <div
          ref={errorRef}
          id="signup-error"
          role="alert"
          aria-live="polite"
          tabIndex={-1}
          className="rounded-md bg-red-50 p-4 focus:outline-none"
        >
          <p className="text-sm text-red-800">{error}</p>
        </div>
      )}
      <div className="flex items-center gap-2 text-sm text-gray-600">
        <span className="flex h-6 w-6 items-center justify-center rounded-full bg-lime-100 text-lime-700 font-medium">1</span>
        <span className="text-gray-400">→</span>
        <span className="flex h-6 w-6 items-center justify-center rounded-full bg-lime-500 text-gray-900 font-medium">2</span>
        <span className="text-xs">Your details</span>
      </div>
      <div className="space-y-4">
        <div>
          <label htmlFor="fullName" className="block text-sm font-medium text-gray-700">
            Full name
          </label>
          <input
            id="fullName"
            name="fullName"
            type="text"
            autoComplete="name"
            required
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            aria-invalid={!!error}
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 shadow-sm placeholder:text-gray-400 focus:border-lime-500 focus:outline-none focus:ring-lime-500"
            placeholder="John Doe"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Number of clients
          </label>
          <div className="grid grid-cols-2 gap-3">
            {["0-50", "51-150", "151-500", "501+"].map((range) => (
              <button
                key={range}
                type="button"
                onClick={() => setClientCount(range)}
                className={`rounded-md border-2 px-4 py-3 text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-lime-500 min-h-[44px] ${
                  clientCount === range
                    ? "border-lime-600 bg-lime-50 text-lime-900"
                    : "border-gray-300 bg-white text-gray-700 hover:bg-gray-50"
                }`}
              >
                {range}
              </button>
            ))}
          </div>
          <p className="mt-2 text-xs text-gray-500">
            This helps us personalise your experience
          </p>
        </div>
      </div>
      <div className="space-y-3">
        <div className="flex gap-3">
          <button
            type="button"
            onClick={handleStep2Back}
            className="flex-1 rounded-md border border-gray-300 bg-white px-4 py-3 text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-lime-500 focus:ring-offset-2"
          >
            Back
          </button>
          <button
            type="submit"
            disabled={loading}
            className="flex-1 rounded-md border border-transparent bg-lime-500 px-4 py-3 text-sm font-medium text-gray-900 hover:bg-lime-400 focus:outline-none focus:ring-2 focus:ring-lime-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed min-h-[44px]"
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="h-5 w-5 animate-spin" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" aria-hidden>
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                Creating account…
              </span>
            ) : (
              "Create account"
            )}
          </button>
        </div>
        <p className="text-center text-xs text-gray-500 flex items-center justify-center gap-1.5">
          <svg className="h-4 w-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
          Secure signup
        </p>
      </div>
    </form>
  );
}
