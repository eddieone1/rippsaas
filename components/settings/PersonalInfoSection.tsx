"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { validatePassword, PASSWORD_RULES_TEXT } from "@/lib/password-rules";

export default function PersonalInfoSection() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [profile, setProfile] = useState({ email: "", full_name: "", phone: "" });
  const [passwordForm, setPasswordForm] = useState({ new_password: "", confirm: "" });
  const [passwordSaving, setPasswordSaving] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [passwordSuccess, setPasswordSuccess] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/settings/me")
      .then((res) => res.json())
      .then((data) => {
        if (data.email !== undefined) {
          setProfile({
            email: data.email ?? "",
            full_name: data.full_name ?? "",
            phone: data.phone ?? "",
          });
        }
      })
      .finally(() => setLoading(false));
  }, []);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setSaving(true);
    try {
      const res = await fetch("/api/settings/me", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(profile),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed to update");
        return;
      }
      setSuccess("Profile updated");
      router.refresh();
    } catch {
      setError("An unexpected error occurred");
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError(null);
    setPasswordSuccess(null);
    if (passwordForm.new_password !== passwordForm.confirm) {
      setPasswordError("Passwords do not match");
      return;
    }
    const passwordCheck = validatePassword(passwordForm.new_password);
    if (!passwordCheck.valid) {
      setPasswordError(passwordCheck.message ?? PASSWORD_RULES_TEXT);
      return;
    }
    setPasswordSaving(true);
    try {
      const res = await fetch("/api/settings/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ new_password: passwordForm.new_password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setPasswordError(data.error || "Failed to update password");
        return;
      }
      setPasswordSuccess("Password updated");
      setPasswordForm({ new_password: "", confirm: "" });
    } catch {
      setPasswordError("An unexpected error occurred");
    } finally {
      setPasswordSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="rounded-lg border border-gray-200 bg-white p-6 shadow">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Personal information</h2>
        <p className="text-sm text-gray-500">Loading…</p>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-6 shadow">
      <h2 className="text-lg font-semibold text-gray-900 mb-4">Personal information</h2>
      <p className="text-sm text-gray-600 mb-4">
        Your email and phone are shown below. You can update them and change your password.
      </p>

      {error && (
        <div className="mb-4 rounded-md bg-red-50 p-3 text-sm text-red-800">{error}</div>
      )}
      {success && (
        <div className="mb-4 rounded-md bg-green-50 p-3 text-sm text-green-800">{success}</div>
      )}

      <form onSubmit={handleSaveProfile} className="space-y-4 mb-8">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
          <input
            type="email"
            value={profile.email}
            onChange={(e) => setProfile({ ...profile, email: e.target.value })}
            className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-blue-500"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Phone number</label>
          <input
            type="tel"
            value={profile.phone}
            onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
            className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-blue-500"
            placeholder="Optional"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Full name</label>
          <input
            type="text"
            value={profile.full_name}
            onChange={(e) => setProfile({ ...profile, full_name: e.target.value })}
            className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-blue-500"
            required
          />
        </div>
        <button
          type="submit"
          disabled={saving}
          className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
        >
          {saving ? "Saving…" : "Update profile"}
        </button>
      </form>

      <h3 className="text-sm font-semibold text-gray-900 mb-2">Change password</h3>
      {passwordError && (
        <div className="mb-4 rounded-md bg-red-50 p-3 text-sm text-red-800">{passwordError}</div>
      )}
      {passwordSuccess && (
        <div className="mb-4 rounded-md bg-green-50 p-3 text-sm text-green-800">{passwordSuccess}</div>
      )}
      <p className="mb-3 text-xs text-gray-500">{PASSWORD_RULES_TEXT}</p>
      <form onSubmit={handleChangePassword} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">New password</label>
          <input
            type="password"
            value={passwordForm.new_password}
            onChange={(e) => setPasswordForm({ ...passwordForm, new_password: e.target.value })}
            className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-blue-500"
            placeholder="••••••••"
            minLength={8}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Confirm new password</label>
          <input
            type="password"
            value={passwordForm.confirm}
            onChange={(e) => setPasswordForm({ ...passwordForm, confirm: e.target.value })}
            className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-blue-500"
            placeholder="Confirm"
          />
        </div>
        <button
          type="submit"
          disabled={passwordSaving}
          className="rounded-md bg-gray-800 px-4 py-2 text-sm font-medium text-white hover:bg-gray-900 disabled:opacity-50"
        >
          {passwordSaving ? "Updating…" : "Change password"}
        </button>
      </form>
    </div>
  );
}
