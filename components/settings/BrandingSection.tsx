"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface Gym {
  id: string;
  name?: string;
  logo_url?: string | null;
  brand_primary_color?: string | null;
  brand_secondary_color?: string | null;
}

export default function BrandingSection({ gym }: { gym: Gym | null }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(gym?.logo_url ?? null);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [brandColors, setBrandColors] = useState({
    primary: gym?.brand_primary_color ?? "#2563EB",
    secondary: gym?.brand_secondary_color ?? "#1E40AF",
  });

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setError("Please upload an image (PNG, JPG, etc.)");
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      setError("File must be less than 2MB");
      return;
    }
    setError(null);
    setLogoFile(file);
    const reader = new FileReader();
    reader.onloadend = () => setLogoPreview(reader.result as string);
    reader.readAsDataURL(file);
  };

  const handleLogoUpload = async () => {
    if (!logoFile) return;
    setUploadingLogo(true);
    setError(null);
    try {
      const formData = new FormData();
      formData.append("logo", logoFile);
      const res = await fetch("/api/settings/upload-logo", { method: "POST", body: formData });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Upload failed");
        return;
      }
      setLogoPreview(data.logo_url);
      setLogoFile(null);
      router.refresh();
    } catch {
      setError("Upload failed");
    } finally {
      setUploadingLogo(false);
    }
  };

  const handleSaveBranding = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setLoading(true);
    try {
      const res = await fetch("/api/settings/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          logo_url: logoPreview,
          brand_primary_color: brandColors.primary,
          brand_secondary_color: brandColors.secondary,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed to save");
        return;
      }
      setSuccess("Branding saved. Theme is applied across the CRM.");
      router.refresh();
    } catch {
      setError("Failed to save");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-6 shadow">
      <h2 className="text-lg font-semibold text-gray-900 mb-4">Business branding</h2>

      {error && (
        <div className="mb-4 rounded-md bg-red-50 p-3 text-sm text-red-800">{error}</div>
      )}
      {success && (
        <div className="mb-4 rounded-md bg-green-50 p-3 text-sm text-green-800">{success}</div>
      )}

      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">Logo</label>
        <div className="flex items-start gap-4">
          {logoPreview && (
            <img
              src={logoPreview}
              alt="Gym logo"
              className="h-20 w-20 object-contain rounded-md border border-gray-300 bg-white p-2"
            />
          )}
          <div>
            <input
              type="file"
              accept="image/*"
              onChange={handleLogoChange}
              className="hidden"
              id="logo-upload"
            />
            <label
              htmlFor="logo-upload"
              className="inline-block cursor-pointer rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              {logoPreview ? "Change logo" : "Upload logo"}
            </label>
            {logoFile && (
              <button
                type="button"
                onClick={handleLogoUpload}
                disabled={uploadingLogo}
                className="ml-2 rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
              >
                {uploadingLogo ? "Uploading…" : "Upload"}
              </button>
            )}
          </div>
        </div>
      </div>

      <form onSubmit={handleSaveBranding} className="space-y-4">
        <div>
          <h3 className="text-sm font-medium text-gray-700 mb-2">Theme colours</h3>
          <p className="text-xs text-gray-500 mb-3">
            These colours set the CRM theme across all pages (buttons, links, accents).
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Primary</label>
              <div className="flex gap-2">
                <input
                  type="color"
                  value={brandColors.primary}
                  onChange={(e) => setBrandColors({ ...brandColors, primary: e.target.value })}
                  className="h-10 w-14 rounded border border-gray-300 cursor-pointer"
                />
                <input
                  type="text"
                  value={brandColors.primary}
                  onChange={(e) => setBrandColors({ ...brandColors, primary: e.target.value })}
                  className="flex-1 rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Secondary</label>
              <div className="flex gap-2">
                <input
                  type="color"
                  value={brandColors.secondary}
                  onChange={(e) => setBrandColors({ ...brandColors, secondary: e.target.value })}
                  className="h-10 w-14 rounded border border-gray-300 cursor-pointer"
                />
                <input
                  type="text"
                  value={brandColors.secondary}
                  onChange={(e) => setBrandColors({ ...brandColors, secondary: e.target.value })}
                  className="flex-1 rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900"
                />
              </div>
            </div>
          </div>
        </div>
        <button
          type="submit"
          disabled={loading}
          className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? "Saving…" : "Save branding & theme"}
        </button>
      </form>
    </div>
  );
}
