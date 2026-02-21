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

  const inputClass =
    "mt-1 block w-full rounded-md border border-white/20 bg-white/5 px-3 py-2 text-white placeholder:text-white/40 focus:border-[#9EFF00] focus:outline-none focus:ring-1 focus:ring-[#9EFF00]";
  const labelClass = "block text-sm font-medium text-white/90";

  return (
    <form className="mt-6 space-y-6" onSubmit={handleSubmit}>
      {error && (
        <div className="rounded-md bg-red-500/20 border border-red-500/30 p-4">
          <p className="text-sm text-red-200">{error}</p>
        </div>
      )}
      <div className="space-y-4">
        <div>
          <label htmlFor="gymName" className={labelClass}>
            Gym Name <span className="text-red-400">*</span>
          </label>
          <input
            id="gymName"
            name="gymName"
            type="text"
            required
            value={gymName}
            onChange={(e) => setGymName(e.target.value)}
            className={inputClass}
            placeholder="My Gym"
          />
        </div>
        <div>
          <label htmlFor="ownerName" className={labelClass}>
            Your Full Name <span className="text-red-400">*</span>
          </label>
          <input
            id="ownerName"
            name="ownerName"
            type="text"
            required
            value={ownerName}
            onChange={(e) => setOwnerName(e.target.value)}
            className={inputClass}
            placeholder="John Doe"
          />
        </div>
        <div>
          <label htmlFor="phone" className={labelClass}>
            Phone Number (Optional)
          </label>
          <input
            id="phone"
            name="phone"
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className={inputClass}
            placeholder="+44 7700 900123"
          />
        </div>

        {/* Address Section */}
        <div className="border-t border-white/10 pt-4 mt-4">
          <h3 className="text-sm font-medium text-white mb-3">Gym Address</h3>
          <div className="flex gap-2 mb-4">
            <input
              type="text"
              placeholder="Enter postcode or address"
              value={addressSearch}
              onChange={(e) => setAddressSearch(e.target.value)}
              className={`flex-grow text-sm ${inputClass}`}
              disabled={searchingAddress}
            />
            <button
              type="button"
              onClick={handleFindAddress}
              disabled={searchingAddress}
              className="rounded-md bg-[#9EFF00] px-4 py-2 text-sm font-medium text-black hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-[#9EFF00] disabled:opacity-50"
            >
              {searchingAddress ? "Searching..." : "Find"}
            </button>
          </div>

          <div className="space-y-3">
            <div>
              <label htmlFor="address_line1" className={labelClass}>
                Address Line 1 <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                id="address_line1"
                name="address_line1"
                value={addressFields.address_line1}
                onChange={(e) => setAddressFields({ ...addressFields, address_line1: e.target.value })}
                className={inputClass}
                required
              />
            </div>
            <div>
              <label htmlFor="address_line2" className={labelClass}>
                Address Line 2 (Optional)
              </label>
              <input
                type="text"
                id="address_line2"
                name="address_line2"
                value={addressFields.address_line2}
                onChange={(e) => setAddressFields({ ...addressFields, address_line2: e.target.value })}
                className={inputClass}
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="city" className={labelClass}>
                  City <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  id="city"
                  name="city"
                  value={addressFields.city}
                  onChange={(e) => setAddressFields({ ...addressFields, city: e.target.value })}
                  className={inputClass}
                  required
                />
              </div>
              <div>
                <label htmlFor="postcode" className={labelClass}>
                  Postcode <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  id="postcode"
                  name="postcode"
                  value={addressFields.postcode}
                  onChange={(e) => setAddressFields({ ...addressFields, postcode: e.target.value })}
                  className={inputClass}
                  required
                />
              </div>
            </div>
            <div>
              <label htmlFor="country" className={labelClass}>
                Country
              </label>
              <input
                type="text"
                id="country"
                name="country"
                value={addressFields.country}
                onChange={(e) => setAddressFields({ ...addressFields, country: e.target.value })}
                className={inputClass}
              />
            </div>
          </div>
        </div>
      </div>

      <div>
        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-lg bg-[#9EFF00] px-4 py-3 text-sm font-semibold text-black hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-[#9EFF00] disabled:opacity-50"
        >
          {loading ? "Saving..." : "Continue"}
        </button>
      </div>
    </form>
  );
}
