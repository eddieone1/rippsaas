"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface Gym {
  id: string;
  name: string;
  subscription_status: string;
  address_line1?: string | null;
  address_line2?: string | null;
  city?: string | null;
  postcode?: string | null;
  country?: string | null;
}

interface UserProfile {
  full_name: string;
}

/**
 * Settings - Minimum Viable Control
 * Purpose: Only what's absolutely required
 * No advanced rules, no custom scoring logic, defaults should be locked
 */
export default function MinimumViableControl({
  gym,
  userProfile,
}: {
  gym: Gym | null;
  userProfile: UserProfile | null;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [addressSearch, setAddressSearch] = useState("");
  const [searchingAddress, setSearchingAddress] = useState(false);
  const [formData, setFormData] = useState({
    gym_name: gym?.name || "",
    full_name: userProfile?.full_name || "",
    address_line1: gym?.address_line1 || "",
    address_line2: gym?.address_line2 || "",
    city: gym?.city || "",
    postcode: gym?.postcode || "",
    country: gym?.country || "UK",
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
            setFormData({
              ...formData,
              address_line1: data.result.parish || data.result.admin_ward || "",
              city: data.result.admin_district || "",
              postcode: data.result.postcode,
              country: "UK",
            });
            setSuccess("Address found and populated");
            setSearchingAddress(false);
            return;
          }
        }
      }

      // Fallback to Nominatim (OpenStreetMap)
      response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery)}&countrycodes=gb&limit=1`,
        {
          headers: {
            "User-Agent": "Rip/1.0",
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        if (data.length > 0) {
          const result = data[0];
          const addressParts = result.display_name.split(",");
          setFormData({
            ...formData,
            address_line1: addressParts[0]?.trim() || "",
            city: addressParts[addressParts.length - 3]?.trim() || "",
            postcode: result.address?.postcode || "",
            country: "UK",
          });
          setSuccess("Address found and populated");
        } else {
          setError("Address not found. Please try a different search term.");
        }
      } else {
        setError("Failed to search address. Please try again.");
      }
    } catch (err) {
      setError("An error occurred while searching for the address.");
    } finally {
      setSearchingAddress(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await fetch("/api/settings/profile", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          gym_name: formData.gym_name,
          full_name: formData.full_name,
          address_line1: formData.address_line1,
          address_line2: formData.address_line2,
          city: formData.city,
          postcode: formData.postcode,
          country: formData.country,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Failed to update profile");
        return;
      }

      setSuccess("Profile updated successfully");
      router.refresh();
    } catch (err) {
      setError("An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Gym Profile */}
      <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Gym Profile</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="rounded-md bg-red-50 p-3">
              <p className="text-sm text-red-800">{error}</p>
            </div>
          )}
          {success && (
            <div className="rounded-md bg-green-50 p-3">
              <p className="text-sm text-green-800">{success}</p>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Gym Name
            </label>
            <input
              type="text"
              value={formData.gym_name}
              onChange={(e) => setFormData({ ...formData, gym_name: e.target.value })}
              className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-blue-500"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Your Full Name
            </label>
            <input
              type="text"
              value={formData.full_name}
              onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
              className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-blue-500"
              required
            />
          </div>

          {/* Gym Address */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Gym Address
            </label>
            <div className="flex gap-2 mb-2">
              <input
                type="text"
                value={addressSearch}
                onChange={(e) => setAddressSearch(e.target.value)}
                placeholder="Search by postcode or address..."
                className="flex-1 rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-blue-500"
              />
              <button
                type="button"
                onClick={handleFindAddress}
                disabled={searchingAddress}
                className="rounded-md bg-gray-100 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-200 disabled:opacity-50"
              >
                {searchingAddress ? "Searching..." : "Find Address"}
              </button>
            </div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <input
                type="text"
                value={formData.address_line1}
                onChange={(e) => setFormData({ ...formData, address_line1: e.target.value })}
                placeholder="Address Line 1"
                className="rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-blue-500"
              />
              <input
                type="text"
                value={formData.address_line2}
                onChange={(e) => setFormData({ ...formData, address_line2: e.target.value })}
                placeholder="Address Line 2 (optional)"
                className="rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-blue-500"
              />
              <input
                type="text"
                value={formData.city}
                onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                placeholder="City"
                className="rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-blue-500"
              />
              <input
                type="text"
                value={formData.postcode}
                onChange={(e) => setFormData({ ...formData, postcode: e.target.value })}
                placeholder="Postcode"
                className="rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-blue-500"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? "Saving..." : "Save Changes"}
          </button>
        </form>
      </div>

      {/* Subscription Status */}
      <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Subscription</h2>
        <dl className="space-y-2">
          <div className="flex justify-between">
            <dt className="text-sm font-medium text-gray-500">Status</dt>
            <dd>
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
        </dl>
        <p className="mt-4 text-xs text-gray-500">
          Billing and subscription management coming soon.
        </p>
      </div>
    </div>
  );
}
