"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function GymInfoForm() {
  const router = useRouter();
  const [gymName, setGymName] = useState("");
  const [ownerName, setOwnerName] = useState("");
  const [phone, setPhone] = useState("");
  const [addressSearch, setAddressSearch] = useState("");
  const [searchingAddress, setSearchingAddress] = useState(false);
  const [addressFields, setAddressFields] = useState({
    address_line1: "",
    address_line2: "",
    city: "",
    postcode: "",
    country: "UK",
    latitude: null as number | null,
    longitude: null as number | null,
  });
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleFindAddress = async () => {
    if (!addressSearch.trim()) {
      setError("Please enter an address or postcode to search");
      return;
    }

    setSearchingAddress(true);
    setError(null);

    try {
      // Use UK Postcodes.io API for UK postcodes, or Nominatim for general addresses
      const searchQuery = addressSearch.trim();
      
      // Check if it's a UK postcode format (basic check)
      const isPostcode = /^[A-Z]{1,2}\d{1,2}[A-Z]?\s?\d[A-Z]{2}$/i.test(searchQuery);
      
      let response;
      let geocodedLat: number | null = null;
      let geocodedLon: number | null = null;

      if (isPostcode) {
        // Use UK Postcodes.io for UK postcodes
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
      
      // Fallback to Nominatim (OpenStreetMap) for general address search
      const nominatimUrl = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery)}&countrycodes=gb&limit=1`;
      response = await fetch(nominatimUrl, {
        headers: {
          "User-Agent": "Rip/1.0", // Nominatim requires a user agent
        },
      });

      if (response.ok) {
        const data = await response.json();
        if (data.length > 0) {
          const result = data[0];
          geocodedLat = parseFloat(result.lat);
          geocodedLon = parseFloat(result.lon);

          setAddressFields({
            address_line1: result.address.house_number ? `${result.address.house_number} ${result.address.road}` : result.address.road || result.display_name.split(',')[0],
            address_line2: result.address.suburb || "",
            city: result.address.city || result.address.town || result.address.village || "",
            postcode: result.address.postcode || "",
            country: result.address.country_code?.toUpperCase() || "UK",
            latitude: geocodedLat,
            longitude: geocodedLon,
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const response = await fetch("/api/onboarding/gym-info", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          gymName,
          ownerName,
          phone: phone || null,
          ...addressFields, // Include address fields
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Failed to update gym information");
        setLoading(false);
        return;
      }

      router.push("/onboarding/payment");
    } catch (err) {
      setError("An unexpected error occurred");
      setLoading(false);
    }
  };

  return (
    <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
      {error && (
        <div className="rounded-md bg-red-50 p-4">
          <p className="text-sm text-red-800">{error}</p>
        </div>
      )}
      <div className="space-y-4">
        <div>
          <label htmlFor="gymName" className="block text-sm font-medium text-gray-700">
            Gym Name <span className="text-red-500">*</span>
          </label>
          <input
            id="gymName"
            name="gymName"
            type="text"
            required
            value={gymName}
            onChange={(e) => setGymName(e.target.value)}
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 shadow-sm placeholder:text-gray-400 focus:border-blue-500 focus:outline-none focus:ring-blue-500"
            placeholder="My Gym"
          />
        </div>
        <div>
          <label htmlFor="ownerName" className="block text-sm font-medium text-gray-700">
            Your Full Name <span className="text-red-500">*</span>
          </label>
          <input
            id="ownerName"
            name="ownerName"
            type="text"
            required
            value={ownerName}
            onChange={(e) => setOwnerName(e.target.value)}
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 shadow-sm placeholder:text-gray-400 focus:border-blue-500 focus:outline-none focus:ring-blue-500"
            placeholder="John Doe"
          />
        </div>
        <div>
          <label htmlFor="phone" className="block text-sm font-medium text-gray-700">
            Phone Number (Optional)
          </label>
          <input
            id="phone"
            name="phone"
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 shadow-sm placeholder:text-gray-400 focus:border-blue-500 focus:outline-none focus:ring-blue-500"
            placeholder="+44 7700 900123"
          />
        </div>

        {/* Address Section */}
        <div className="border-t border-gray-200 pt-4 mt-4">
          <h3 className="text-sm font-medium text-gray-900 mb-3">Gym Address</h3>
          <div className="flex gap-2 mb-4">
            <input
              type="text"
              placeholder="Enter postcode or address"
              value={addressSearch}
              onChange={(e) => setAddressSearch(e.target.value)}
              className="flex-grow rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900 shadow-sm placeholder:text-gray-400 focus:border-blue-500 focus:outline-none focus:ring-blue-500"
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
                Address Line 1 <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="address_line1"
                name="address_line1"
                value={addressFields.address_line1}
                onChange={(e) => setAddressFields({ ...addressFields, address_line1: e.target.value })}
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 shadow-sm placeholder:text-gray-400 focus:border-blue-500 focus:outline-none focus:ring-blue-500"
                required
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
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 shadow-sm placeholder:text-gray-400 focus:border-blue-500 focus:outline-none focus:ring-blue-500"
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="city" className="block text-sm font-medium text-gray-700">
                  City <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  id="city"
                  name="city"
                  value={addressFields.city}
                  onChange={(e) => setAddressFields({ ...addressFields, city: e.target.value })}
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 shadow-sm placeholder:text-gray-400 focus:border-blue-500 focus:outline-none focus:ring-blue-500"
                  required
                />
              </div>
              <div>
                <label htmlFor="postcode" className="block text-sm font-medium text-gray-700">
                  Postcode <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  id="postcode"
                  name="postcode"
                  value={addressFields.postcode}
                  onChange={(e) => setAddressFields({ ...addressFields, postcode: e.target.value })}
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 shadow-sm placeholder:text-gray-400 focus:border-blue-500 focus:outline-none focus:ring-blue-500"
                  required
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
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 shadow-sm placeholder:text-gray-400 focus:border-blue-500 focus:outline-none focus:ring-blue-500"
              />
            </div>
          </div>
        </div>
      </div>

      <div>
        <button
          type="submit"
          disabled={loading}
          className="group relative flex w-full justify-center rounded-md border border-transparent bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? "Saving..." : "Continue"}
        </button>
      </div>
    </form>
  );
}
