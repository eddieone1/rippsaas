"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import MembershipTypesTab from "./MembershipTypesTab";

interface Gym {
  id: string;
  name: string;
  subscription_status: string;
  address_line1?: string | null;
  address_line2?: string | null;
  city?: string | null;
  postcode?: string | null;
  country?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  logo_url?: string | null;
  brand_primary_color?: string | null;
  brand_secondary_color?: string | null;
}

interface UserProfile {
  full_name: string;
}

interface Template {
  id: string;
  name: string;
  subject: string;
  body: string;
  gym_id: string | null;
}

interface MembershipType {
  id: string;
  gym_id: string;
  name: string;
  description: string | null;
  price: number | null;
  billing_frequency: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export default function SettingsForm({
  gym,
  userProfile,
  templates,
  membershipTypes = [],
}: {
  gym: Gym | null;
  userProfile: UserProfile | null;
  templates: Template[];
  membershipTypes?: MembershipType[];
}) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"profile" | "branding" | "membership-types" | "subscription" | "templates">("profile");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [addressSearch, setAddressSearch] = useState("");
  const [searchingAddress, setSearchingAddress] = useState(false);
  const [addressFields, setAddressFields] = useState({
    address_line1: gym?.address_line1 || "",
    address_line2: gym?.address_line2 || "",
    city: gym?.city || "",
    postcode: gym?.postcode || "",
    country: gym?.country || "UK",
    latitude: gym?.latitude || null,
    longitude: gym?.longitude || null,
  });
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(gym?.logo_url || null);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [brandColors, setBrandColors] = useState({
    primary: gym?.brand_primary_color || "#2563EB",
    secondary: gym?.brand_secondary_color || "#1E40AF",
  });

  const handleFindAddress = async () => {
    if (!addressSearch.trim()) {
      setError("Please enter an address or postcode to search");
      return;
    }

    setSearchingAddress(true);
    setError(null);

    try {
      const searchQuery = addressSearch.trim();
      const isPostcode = /^[A-Z]{1,2}\d{1,2}[A-Z]?\s?\d[A-Z]{2}$/i.test(searchQuery);
      
      let response;

      if (isPostcode) {
        const postcodeNormalized = searchQuery.replace(/\s+/g, "").toUpperCase();
        response = await fetch(`https://api.postcodes.io/postcodes/${postcodeNormalized}`);
        
        if (response.ok) {
          const data = await response.json();
          if (data.result) {
            setAddressFields({
              address_line1: data.result.admin_ward || "",
              address_line2: "",
              city: data.result.admin_district || data.result.region || "",
              postcode: data.result.postcode || postcodeNormalized,
              country: "UK",
              latitude: data.result.latitude,
              longitude: data.result.longitude,
            });
            setSearchingAddress(false);
            return;
          }
        }
      }
      
      const nominatimUrl = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery)}&countrycodes=gb&limit=1`;
      response = await fetch(nominatimUrl, {
        headers: {
          "User-Agent": "Rip/1.0",
        },
      });

      if (response.ok) {
        const data = await response.json();
        if (data.length > 0) {
          const result = data[0];
          setAddressFields({
            address_line1: result.address.house_number ? `${result.address.house_number} ${result.address.road}` : result.address.road || result.display_name.split(',')[0],
            address_line2: result.address.suburb || "",
            city: result.address.city || result.address.town || result.address.village || "",
            postcode: result.address.postcode || "",
            country: result.address.country_code?.toUpperCase() || "UK",
            latitude: parseFloat(result.lat),
            longitude: parseFloat(result.lon),
          });
          setSearchingAddress(false);
          return;
        }
      }

      setError("Address not found. Please try a different search or enter manually.");
    } catch (err) {
      console.error("Address search error:", err);
      setError("An error occurred during address search.");
    } finally {
      setSearchingAddress(false);
    }
  };

  const handleUpdateProfile = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    const gymName = formData.get("gymName") as string;
    const fullName = formData.get("fullName") as string;

    try {
      const response = await fetch("/api/settings/profile", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ 
          gymName, 
          fullName,
          ...addressFields,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        setError(data.error || "Failed to update profile");
        setLoading(false);
        return;
      }

      router.refresh();
      setLoading(false);
      alert("Profile updated successfully!");
    } catch (err) {
      setError("An unexpected error occurred");
      setLoading(false);
    }
  };

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith("image/")) {
      setError("Please upload an image file (PNG, JPG, etc.)");
      return;
    }

    // Validate file size (2MB max)
    if (file.size > 2 * 1024 * 1024) {
      setError("File size must be less than 2MB");
      return;
    }

    setLogoFile(file);
    setError(null);

    // Create preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setLogoPreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleLogoUpload = async () => {
    if (!logoFile) return;

    setUploadingLogo(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append("logo", logoFile);

      const response = await fetch("/api/settings/upload-logo", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Failed to upload logo");
        setUploadingLogo(false);
        return;
      }

      setLogoPreview(data.logo_url);
      setLogoFile(null);
      setUploadingLogo(false);
      router.refresh();
      alert("Logo uploaded successfully!");
    } catch (err) {
      setError("An unexpected error occurred while uploading logo");
      setUploadingLogo(false);
    }
  };

  const handleUpdateBranding = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const response = await fetch("/api/settings/profile", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          // Don't send gymName or fullName to avoid overwriting them
          logo_url: logoPreview, // Current logo URL
          brand_primary_color: brandColors.primary,
          brand_secondary_color: brandColors.secondary,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        setError(data.error || "Failed to update branding");
        setLoading(false);
        return;
      }

      router.refresh();
      setLoading(false);
      alert("Branding updated successfully!");
    } catch (err) {
      setError("An unexpected error occurred");
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab("profile")}
            className={`whitespace-nowrap border-b-2 px-1 py-4 text-sm font-medium ${
              activeTab === "profile"
                ? "border-blue-500 text-blue-600"
                : "border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700"
            }`}
          >
            Gym Profile
          </button>
          <button
            onClick={() => setActiveTab("branding")}
            className={`whitespace-nowrap border-b-2 px-1 py-4 text-sm font-medium ${
              activeTab === "branding"
                ? "border-blue-500 text-blue-600"
                : "border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700"
            }`}
          >
            Branding
          </button>
          <button
            onClick={() => setActiveTab("membership-types")}
            className={`whitespace-nowrap border-b-2 px-1 py-4 text-sm font-medium ${
              activeTab === "membership-types"
                ? "border-blue-500 text-blue-600"
                : "border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700"
            }`}
          >
            Membership Types
          </button>
          <button
            onClick={() => setActiveTab("subscription")}
            className={`whitespace-nowrap border-b-2 px-1 py-4 text-sm font-medium ${
              activeTab === "subscription"
                ? "border-blue-500 text-blue-600"
                : "border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700"
            }`}
          >
            Subscription
          </button>
          <button
            onClick={() => setActiveTab("templates")}
            className={`whitespace-nowrap border-b-2 px-1 py-4 text-sm font-medium ${
              activeTab === "templates"
                ? "border-blue-500 text-blue-600"
                : "border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700"
            }`}
          >
            Email Templates
          </button>
        </nav>
      </div>

      {error && (
        <div className="rounded-md bg-red-50 p-4">
          <p className="text-sm text-red-800">{error}</p>
        </div>
      )}

      {/* Profile Tab */}
      {activeTab === "profile" && (
        <div className="rounded-lg border border-gray-200 bg-white p-6 shadow">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Gym Profile</h2>
          <form onSubmit={handleUpdateProfile} className="space-y-4">
            <div>
              <label htmlFor="gymName" className="block text-sm font-medium text-gray-700">
                Gym Name
              </label>
              <input
                type="text"
                id="gymName"
                name="gymName"
                defaultValue={gym?.name || ""}
                className="mt-1 block w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-gray-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500"
                required
              />
            </div>
            <div>
              <label htmlFor="fullName" className="block text-sm font-medium text-gray-700">
                Your Full Name
              </label>
              <input
                type="text"
                id="fullName"
                name="fullName"
                defaultValue={userProfile?.full_name || ""}
                className="mt-1 block w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-gray-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500"
                required
              />
            </div>

            {/* Address Search */}
            <div className="border-t border-gray-200 pt-4 mt-4">
              <h3 className="text-lg font-medium text-gray-900 mb-3">Gym Address</h3>
              <div className="flex gap-2 mb-4">
                <input
                  type="text"
                  placeholder="Enter postcode or address"
                  value={addressSearch}
                  onChange={(e) => setAddressSearch(e.target.value)}
                  className="flex-grow rounded-md border border-gray-300 bg-white px-3 py-2 text-gray-900 text-sm placeholder:text-gray-400 focus:border-blue-500 focus:outline-none focus:ring-blue-500"
                  disabled={searchingAddress}
                />
                <button
                  type="button"
                  onClick={handleFindAddress}
                  disabled={searchingAddress}
                  className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
                >
                  {searchingAddress ? "Searching..." : "Find Address"}
                </button>
              </div>

              {/* Address Fields */}
              <div className="space-y-3">
                <div>
                  <label htmlFor="address_line1" className="block text-sm font-medium text-gray-700">
                    Address Line 1
                  </label>
                  <input
                    type="text"
                    id="address_line1"
                    name="address_line1"
                    value={addressFields.address_line1}
                    onChange={(e) => setAddressFields({ ...addressFields, address_line1: e.target.value })}
                    className="mt-1 block w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-gray-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label htmlFor="address_line2" className="block text-sm font-medium text-gray-700">
                    Address Line 2 (Optional)
                  </label>
                  <input
                    type="text"
                    id="address_line2"
                    name="address_line2"
                    value={addressFields.address_line2}
                    onChange={(e) => setAddressFields({ ...addressFields, address_line2: e.target.value })}
                    className="mt-1 block w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-gray-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500"
                  />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="city" className="block text-sm font-medium text-gray-700">
                      City
                    </label>
                    <input
                      type="text"
                      id="city"
                      name="city"
                      value={addressFields.city}
                      onChange={(e) => setAddressFields({ ...addressFields, city: e.target.value })}
                      className="mt-1 block w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-gray-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label htmlFor="postcode" className="block text-sm font-medium text-gray-700">
                      Postcode
                    </label>
                    <input
                      type="text"
                      id="postcode"
                      name="postcode"
                      value={addressFields.postcode}
                      onChange={(e) => setAddressFields({ ...addressFields, postcode: e.target.value })}
                      className="mt-1 block w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-gray-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500"
                    />
                  </div>
                </div>
                <div>
                  <label htmlFor="country" className="block text-sm font-medium text-gray-700">
                    Country
                  </label>
                  <input
                    type="text"
                    id="country"
                    name="country"
                    value={addressFields.country}
                    onChange={(e) => setAddressFields({ ...addressFields, country: e.target.value })}
                    className="mt-1 block w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-gray-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500"
                  />
                </div>
              </div>
            </div>
            <button
              type="submit"
              disabled={loading}
              className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
            >
              {loading ? "Saving..." : "Save Changes"}
            </button>
          </form>
        </div>
      )}

      {/* Branding Tab */}
      {activeTab === "branding" && (
        <div className="rounded-lg border border-gray-200 bg-white p-6 shadow">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Branding</h2>
          
          <form onSubmit={handleUpdateBranding} className="space-y-6">
            {/* Logo Upload */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Logo
              </label>
              <div className="flex items-start gap-4">
                {logoPreview && (
                  <div className="flex-shrink-0">
                    <img
                      src={logoPreview}
                      alt="Gym logo"
                      className="h-20 w-20 object-contain rounded-md border border-gray-300 bg-white p-2"
                    />
                  </div>
                )}
                <div className="flex-1">
                  <input
                    type="file"
                    id="logoUpload"
                    accept="image/*"
                    onChange={handleLogoChange}
                    className="hidden"
                    disabled={uploadingLogo}
                  />
                  <label
                    htmlFor="logoUpload"
                    className="cursor-pointer inline-block rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
                  >
                    {uploadingLogo ? "Uploading..." : logoPreview ? "Change Logo" : "Upload Logo"}
                  </label>
                  <p className="mt-2 text-xs text-gray-500">
                    Recommended: PNG or JPG, max 2MB. Logo will appear in emails and on your dashboard.
                  </p>
                  {logoFile && !uploadingLogo && (
                    <button
                      type="button"
                      onClick={handleLogoUpload}
                      className="mt-2 rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      Upload Now
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Brand Colors */}
            <div className="border-t border-gray-200 pt-4">
              <h3 className="text-sm font-medium text-gray-700 mb-4">Brand Colours</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="primaryColor" className="block text-sm font-medium text-gray-700 mb-2">
                    Primary Colour
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="color"
                      id="primaryColor"
                      value={brandColors.primary}
                      onChange={(e) => setBrandColors({ ...brandColors, primary: e.target.value })}
                      className="h-10 w-20 rounded border border-gray-300 cursor-pointer"
                    />
                    <input
                      type="text"
                      value={brandColors.primary}
                      onChange={(e) => setBrandColors({ ...brandColors, primary: e.target.value })}
                      className="flex-1 rounded-md border border-gray-300 bg-white px-3 py-2 text-gray-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500"
                      placeholder="#2563EB"
                    />
                  </div>
                </div>
                <div>
                  <label htmlFor="secondaryColor" className="block text-sm font-medium text-gray-700 mb-2">
                    Secondary Colour
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="color"
                      id="secondaryColor"
                      value={brandColors.secondary}
                      onChange={(e) => setBrandColors({ ...brandColors, secondary: e.target.value })}
                      className="h-10 w-20 rounded border border-gray-300 cursor-pointer"
                    />
                    <input
                      type="text"
                      value={brandColors.secondary}
                      onChange={(e) => setBrandColors({ ...brandColors, secondary: e.target.value })}
                      className="flex-1 rounded-md border border-gray-300 bg-white px-3 py-2 text-gray-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500"
                      placeholder="#1E40AF"
                    />
                  </div>
                </div>
              </div>
              <p className="mt-2 text-xs text-gray-500">
                Primary colour is used for buttons and links. Secondary colour is used for accents.
              </p>
            </div>

            <div className="flex gap-3">
              <button
                type="submit"
                disabled={loading || uploadingLogo}
                className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
              >
                {loading ? "Saving..." : "Save Branding"}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Membership Types Tab */}
      {activeTab === "membership-types" && gym?.id && (
        <MembershipTypesTab membershipTypes={membershipTypes} gymId={gym.id} onUpdate={() => router.refresh()} />
      )}

      {/* Subscription Tab */}
      {activeTab === "subscription" && (
        <div className="rounded-lg border border-gray-200 bg-white p-6 shadow">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Subscription</h2>
          <dl className="space-y-4">
            <div>
              <dt className="text-sm font-medium text-gray-700">Status</dt>
              <dd className="mt-1">
                <span
                  className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ${
                    gym?.subscription_status === "active"
                      ? "bg-green-100 text-green-800"
                      : gym?.subscription_status === "trialing"
                      ? "bg-blue-100 text-blue-800"
                      : "bg-gray-100 text-gray-800"
                  }`}
                >
                  {gym?.subscription_status || "Unknown"}
                </span>
              </dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-700">Plan</dt>
              <dd className="mt-1 text-sm text-gray-900">Free Trial - £29/month after trial</dd>
            </div>
            <p className="text-sm text-gray-700">
              Stripe integration for subscription management will be configured in production.
            </p>
          </dl>
        </div>
      )}

      {/* Templates Tab */}
      {activeTab === "templates" && (
        <div className="rounded-lg border border-gray-200 bg-white p-6 shadow">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Email Templates</h2>
          <div className="space-y-4">
            {templates.map((template) => {
              // Format template name to use consistent "days+" format
              const formatTemplateName = (name: string): string => {
                // Match patterns like "14 Days Inactive", "21 Days Inactive", "30+ Days Inactive"
                const daysMatch = name.match(/(\d+)\+?\s*Days?\s*Inactive/i);
                if (daysMatch) {
                  const days = daysMatch[1];
                  return `${days}+ Days Inactive`;
                }
                return name; // Return original if pattern doesn't match
              };
              
              return (
              <div key={template.id} className="border-b border-gray-200 pb-4 last:border-0">
                <h3 className="font-medium text-gray-900">{formatTemplateName(template.name)}</h3>
                <p className="mt-1 text-sm text-gray-900">
                  <strong className="text-gray-700">Subject:</strong> {template.subject}
                </p>
                <p className="mt-2 text-sm text-gray-900 whitespace-pre-wrap">
                  <strong className="text-gray-700">Body:</strong> {template.body}
                </p>
              </div>
              );
            })}
            <p className="text-sm text-gray-700 mt-4">
              Template editing will be available in a future update.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
