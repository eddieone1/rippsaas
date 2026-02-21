"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

interface Gym {
  id: string;
  name?: string;
  sender_name?: string | null;
  sender_email?: string | null;
  sms_from_number?: string | null;
}

interface IntegrationStatus {
  hasResendKey: boolean;
  hasTwilioCredentials: boolean;
}

export default function IntegrationsSection({ gym, onSuccess }: { gym: Gym | null; onSuccess?: (msg: string) => void }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [status, setStatus] = useState<IntegrationStatus | null>(null);

  const [senderName, setSenderName] = useState(gym?.sender_name ?? "");
  const [senderEmail, setSenderEmail] = useState(gym?.sender_email ?? "");
  const [smsFromNumber, setSmsFromNumber] = useState(gym?.sms_from_number ?? "");
  const [resendApiKey, setResendApiKey] = useState("");
  const [twilioAccountSid, setTwilioAccountSid] = useState("");
  const [twilioAuthToken, setTwilioAuthToken] = useState("");

  useEffect(() => {
    setSenderName(gym?.sender_name ?? "");
    setSenderEmail(gym?.sender_email ?? "");
    setSmsFromNumber(gym?.sms_from_number ?? "");
  }, [gym?.sender_name, gym?.sender_email, gym?.sms_from_number]);

  useEffect(() => {
    fetch("/api/settings/integrations")
      .then((res) => res.json())
      .then((data) => {
        if (data.hasResendKey !== undefined && data.hasTwilioCredentials !== undefined) {
          setStatus({ hasResendKey: data.hasResendKey, hasTwilioCredentials: data.hasTwilioCredentials });
        }
      })
      .catch(() => setStatus({ hasResendKey: false, hasTwilioCredentials: false }));
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setLoading(true);
    try {
      const body: Record<string, string | null> = {
        sender_name: senderName.trim() || null,
        sender_email: senderEmail.trim() || null,
        sms_from_number: smsFromNumber.trim() || null,
      };
      if (resendApiKey.trim()) body.resend_api_key = resendApiKey.trim();
      if (twilioAccountSid.trim()) body.twilio_account_sid = twilioAccountSid.trim();
      if (twilioAuthToken.trim()) body.twilio_auth_token = twilioAuthToken.trim();

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
      setSuccess("Integrations and sender settings saved.");
      onSuccess?.("Communications saved");
      setResendApiKey("");
      setTwilioAccountSid("");
      setTwilioAuthToken("");
      router.refresh();
      fetch("/api/settings/integrations")
        .then((r) => r.json())
        .then((d) => {
          if (d.hasResendKey !== undefined && d.hasTwilioCredentials !== undefined) {
            setStatus({ hasResendKey: d.hasResendKey, hasTwilioCredentials: d.hasTwilioCredentials });
          }
        });
    } catch {
      setError("Failed to save");
    } finally {
      setLoading(false);
    }
  };

  const emailStatus = status?.hasResendKey ? "connected" : "not-set";
  const smsStatus = status?.hasTwilioCredentials ? "connected" : "not-set";

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-6 shadow">
      <h2 className="text-lg font-semibold text-gray-900 mb-1">Email & SMS</h2>
      <p className="text-sm text-gray-600 mb-4">
        Required for outreach campaigns. Configure sender identity and connect Resend (email) or Twilio (SMS). Members see your brand in every message.
      </p>

      <div className="mb-6 flex flex-wrap gap-3">
        <div className="flex items-center gap-2 rounded-lg border border-gray-200 bg-gray-50 px-3 py-2">
          <span className={`inline-flex h-2.5 w-2.5 rounded-full ${emailStatus === "connected" ? "bg-green-500" : "bg-amber-400"}`} />
          <span className="text-sm font-medium text-gray-700">Email</span>
          <span className="text-xs text-gray-500">({emailStatus === "connected" ? "Resend connected" : "Using default"})</span>
        </div>
        <div className="flex items-center gap-2 rounded-lg border border-gray-200 bg-gray-50 px-3 py-2">
          <span className={`inline-flex h-2.5 w-2.5 rounded-full ${smsStatus === "connected" ? "bg-green-500" : "bg-amber-400"}`} />
          <span className="text-sm font-medium text-gray-700">SMS</span>
          <span className="text-xs text-gray-500">({smsStatus === "connected" ? "Twilio connected" : "Using default"})</span>
        </div>
      </div>

      <details className="mb-4 rounded-lg border border-gray-200 bg-gray-50/50 p-3">
        <summary className="cursor-pointer text-sm font-medium text-gray-700">Setup guidance</summary>
        <ul className="mt-2 space-y-1 text-xs text-gray-600">
          <li>• <strong>Resend:</strong> Create an account at resend.com, verify your domain, then add your API key.</li>
          <li>• <strong>Twilio:</strong> Create an account at twilio.com, get a phone number, add Account SID and Auth Token.</li>
        </ul>
      </details>

      {error && (
        <div className="mb-4 rounded-md bg-red-50 p-3 text-sm text-red-800">{error}</div>
      )}
      {success && (
        <div className="mb-4 rounded-md bg-green-50 p-3 text-sm text-green-800">{success}</div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <h3 className="text-base font-semibold text-gray-900 mb-2">Sender identity</h3>
          <p className="text-xs text-gray-500 mb-3">
            Display name and from address for outreach emails; from number for SMS.
          </p>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Sender name (emails)</label>
              <input
                type="text"
                value={senderName}
                onChange={(e) => setSenderName(e.target.value)}
                placeholder="e.g. Acme Gym"
                className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-gray-900 focus:border-lime-500 focus:outline-none focus:ring-lime-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">From email address</label>
              <input
                type="email"
                value={senderEmail}
                onChange={(e) => setSenderEmail(e.target.value)}
                placeholder="e.g. hello@acmegym.com"
                className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-gray-900 focus:border-lime-500 focus:outline-none focus:ring-lime-500"
              />
            </div>
          </div>
        </div>

        <div>
          <h3 className="text-base font-semibold text-gray-900 mb-2">Email (Resend)</h3>
          <p className="text-xs text-gray-500 mb-3">
            Add your Resend API key to send from your own domain. Verify your domain in the Resend dashboard.
          </p>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Resend API key</label>
            <input
              type="password"
              value={resendApiKey}
              onChange={(e) => setResendApiKey(e.target.value)}
              placeholder={status?.hasResendKey ? "Enter new key to replace existing" : "re_… (leave blank to use app default)"}
              autoComplete="off"
              className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-gray-900 font-mono focus:border-lime-500 focus:outline-none focus:ring-lime-500"
            />
            {status?.hasResendKey && (
              <p className="mt-1 text-xs text-green-700">Resend key is set. Enter a new value to replace.</p>
            )}
          </div>
        </div>

        <div>
          <h3 className="text-base font-semibold text-gray-900 mb-2">SMS (Twilio)</h3>
          <p className="text-xs text-gray-500 mb-3">
            Add your Twilio Account SID and Auth Token to send SMS from your own account. Set the from number (E.164) for outbound SMS.
          </p>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">SMS from number</label>
              <input
                type="text"
                value={smsFromNumber}
                onChange={(e) => setSmsFromNumber(e.target.value)}
                placeholder="e.g. +1234567890"
                className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-gray-900 focus:border-lime-500 focus:outline-none focus:ring-lime-500"
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Twilio Account SID</label>
                <input
                  type="password"
                  value={twilioAccountSid}
                  onChange={(e) => setTwilioAccountSid(e.target.value)}
                  placeholder={status?.hasTwilioCredentials ? "Enter new to replace" : "AC…"}
                  autoComplete="off"
                  className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-gray-900 font-mono focus:border-lime-500 focus:outline-none focus:ring-lime-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Twilio Auth Token</label>
                <input
                  type="password"
                  value={twilioAuthToken}
                  onChange={(e) => setTwilioAuthToken(e.target.value)}
                  placeholder={status?.hasTwilioCredentials ? "Enter new to replace" : "Leave blank for default"}
                  autoComplete="off"
                  className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-gray-900 font-mono focus:border-lime-500 focus:outline-none focus:ring-lime-500"
                />
              </div>
            </div>
            {status?.hasTwilioCredentials && (
              <p className="text-xs text-green-700">Twilio credentials are set. Enter new values to replace.</p>
            )}
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="rounded-md bg-lime-500 px-4 py-2 text-sm font-medium text-gray-900 hover:bg-lime-400 disabled:opacity-50"
        >
          {loading ? "Saving…" : "Save integrations"}
        </button>
      </form>
    </div>
  );
}
