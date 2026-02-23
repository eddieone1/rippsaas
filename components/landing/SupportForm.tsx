"use client";

import { useState } from "react";
import Link from "next/link";

export default function SupportForm() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "success" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("sending");
    setErrorMsg("");

    try {
      const res = await fetch("/api/support", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, message }),
      });
      const data = await res.json();

      if (!res.ok) {
        setStatus("error");
        setErrorMsg(data.error || "Something went wrong. Please try again.");
        return;
      }

      setStatus("success");
      setName("");
      setEmail("");
      setMessage("");
    } catch {
      setStatus("error");
      setErrorMsg("Failed to send message. Please try again.");
    }
  }

  if (status === "success") {
    return (
      <div className="rounded-xl border border-[#9EFF00]/30 bg-[#9EFF00]/5 p-8 text-center">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-[#9EFF00]/20">
          <svg className="h-6 w-6 text-[#9EFF00]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h2 className="text-xl font-semibold text-white">Message sent</h2>
        <p className="mt-2 text-white/65">
          Thanks for reaching out. We&apos;ll get back to you soon.
        </p>
        <button
          type="button"
          onClick={() => setStatus("idle")}
          className="mt-6 text-sm font-medium text-[#9EFF00] hover:underline"
        >
          Send another message
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="rounded-xl border border-white/[0.08] bg-white/[0.03] p-6 sm:p-8">
      <div className="space-y-6">
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-white/80">
            Name
          </label>
          <input
            id="name"
            type="text"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="mt-2 block w-full rounded-lg border border-white/[0.12] bg-white/[0.05] px-4 py-2.5 text-white placeholder-white/40 focus:border-[#9EFF00]/50 focus:outline-none focus:ring-1 focus:ring-[#9EFF00]/50"
            placeholder="Your name"
          />
        </div>
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-white/80">
            Email
          </label>
          <input
            id="email"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="mt-2 block w-full rounded-lg border border-white/[0.12] bg-white/[0.05] px-4 py-2.5 text-white placeholder-white/40 focus:border-[#9EFF00]/50 focus:outline-none focus:ring-1 focus:ring-[#9EFF00]/50"
            placeholder="you@example.com"
          />
        </div>
        <div>
          <label htmlFor="message" className="block text-sm font-medium text-white/80">
            Message
          </label>
          <textarea
            id="message"
            required
            rows={5}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            className="mt-2 block w-full rounded-lg border border-white/[0.12] bg-white/[0.05] px-4 py-2.5 text-white placeholder-white/40 focus:border-[#9EFF00]/50 focus:outline-none focus:ring-1 focus:ring-[#9EFF00]/50 resize-none"
            placeholder="How can we help?"
          />
        </div>
        {errorMsg && (
          <p className="text-sm text-red-400">{errorMsg}</p>
        )}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <button
            type="submit"
            disabled={status === "sending"}
            className="inline-flex justify-center rounded-lg bg-[#9EFF00] px-6 py-3 text-base font-semibold text-black hover:opacity-90 transition-opacity disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {status === "sending" ? "Sending…" : "Send message"}
          </button>
          <Link
            href="/"
            className="text-center text-sm text-white/65 hover:text-[#9EFF00] transition-colors"
          >
            Back to home
          </Link>
        </div>
      </div>
    </form>
  );
}
