"use client";

import { useState } from "react";

const GYM_SOFTWARE_OPTIONS = [
  "ClubRight",
  "Glofox",
  "Mindbody",
  "Ashbourne",
  "TeamUp",
  "Other",
] as const;

export default function AuditRequestForm() {
  const [gymName, setGymName] = useState("");
  const [contactName, setContactName] = useState("");
  const [email, setEmail] = useState("");
  const [activeMembers, setActiveMembers] = useState("");
  const [gymSoftware, setGymSoftware] = useState<string>(GYM_SOFTWARE_OPTIONS[0]);
  const [gymSoftwareOther, setGymSoftwareOther] = useState("");
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const software =
        gymSoftware === "Other" ? gymSoftwareOther.trim() || "Other" : gymSoftware;

      const formData = new FormData();
      formData.append("gymName", gymName.trim());
      formData.append("contactName", contactName.trim());
      formData.append("email", email.trim());
      formData.append("activeMembers", activeMembers.trim());
      formData.append("gymSoftware", software);
      if (csvFile) formData.append("csv", csvFile);

      const res = await fetch("/api/audit/request", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Failed to submit audit request");
        setLoading(false);
        return;
      }

      setSuccess(true);
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="rounded-xl border border-[#9EFF00]/30 bg-[#9EFF00]/10 p-8 text-center">
        <h2 className="text-xl font-bold text-white">Audit request received</h2>
        <p className="mt-3 text-sm text-white/70">
          Thanks — we&apos;ll review your details
          {csvFile ? " and member CSV" : ""} and send your free retention audit
          report to <span className="font-medium text-white">{email}</span> within 2
          business days.
        </p>
        <p className="mt-4 text-sm text-white/55">
          Ready to track at-risk members yourself?{" "}
          <a href="/pricing" className="text-[#9EFF00] hover:underline">
            View paid plans
          </a>
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {error && (
        <div className="rounded-md border border-red-500/30 bg-red-500/10 p-3">
          <p className="text-sm text-red-200">{error}</p>
        </div>
      )}

      <div>
        <label htmlFor="gymName" className="block text-sm font-medium text-white/80">
          Gym name
        </label>
        <input
          id="gymName"
          type="text"
          required
          value={gymName}
          onChange={(e) => setGymName(e.target.value)}
          className="mt-1 w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder:text-white/40 focus:border-[#9EFF00]/50 focus:outline-none focus:ring-1 focus:ring-[#9EFF00]/50"
        />
      </div>

      <div>
        <label htmlFor="contactName" className="block text-sm font-medium text-white/80">
          Contact name
        </label>
        <input
          id="contactName"
          type="text"
          required
          value={contactName}
          onChange={(e) => setContactName(e.target.value)}
          className="mt-1 w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder:text-white/40 focus:border-[#9EFF00]/50 focus:outline-none focus:ring-1 focus:ring-[#9EFF00]/50"
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
          className="mt-1 w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder:text-white/40 focus:border-[#9EFF00]/50 focus:outline-none focus:ring-1 focus:ring-[#9EFF00]/50"
        />
      </div>

      <div>
        <label htmlFor="activeMembers" className="block text-sm font-medium text-white/80">
          Number of active members
        </label>
        <input
          id="activeMembers"
          type="text"
          required
          placeholder="e.g. 180"
          value={activeMembers}
          onChange={(e) => setActiveMembers(e.target.value)}
          className="mt-1 w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder:text-white/40 focus:border-[#9EFF00]/50 focus:outline-none focus:ring-1 focus:ring-[#9EFF00]/50"
        />
      </div>

      <div>
        <label htmlFor="gymSoftware" className="block text-sm font-medium text-white/80">
          Gym management software
        </label>
        <select
          id="gymSoftware"
          value={gymSoftware}
          onChange={(e) => setGymSoftware(e.target.value)}
          className="mt-1 w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white focus:border-[#9EFF00]/50 focus:outline-none focus:ring-1 focus:ring-[#9EFF00]/50"
        >
          {GYM_SOFTWARE_OPTIONS.map((opt) => (
            <option key={opt} value={opt} className="bg-rip-bg-2 text-white">
              {opt}
            </option>
          ))}
        </select>
        {gymSoftware === "Other" && (
          <input
            type="text"
            placeholder="Which software?"
            value={gymSoftwareOther}
            onChange={(e) => setGymSoftwareOther(e.target.value)}
            className="mt-2 w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder:text-white/40 focus:border-[#9EFF00]/50 focus:outline-none focus:ring-1 focus:ring-[#9EFF00]/50"
          />
        )}
      </div>

      <div>
        <label htmlFor="csvFile" className="block text-sm font-medium text-white/80">
          Member CSV <span className="text-white/45">(optional)</span>
        </label>
        <input
          id="csvFile"
          type="file"
          accept=".csv"
          onChange={(e) => setCsvFile(e.target.files?.[0] ?? null)}
          className="mt-1 w-full text-sm text-white/70 file:mr-3 file:rounded-md file:border-0 file:bg-[#9EFF00]/20 file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-[#9EFF00]"
        />
        <p className="mt-1 text-xs text-white/45">
          Optional — upload your member export now so we can prepare your audit faster (max 10MB).
        </p>
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full rounded-lg bg-[#9EFF00] px-4 py-3 text-sm font-semibold text-black hover:opacity-90 disabled:opacity-50"
      >
        {loading ? "Submitting…" : "Request Free Audit"}
      </button>

      <p className="text-center text-xs text-white/45">
        No card required for your free audit. No software subscription required.
      </p>
    </form>
  );
}
