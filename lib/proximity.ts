/**
 * Calculate distance between two geographical points using Haversine formula
 * @param lat1 Latitude of point 1
 * @param lon1 Longitude of point 1
 * @param lat2 Latitude of point 2
 * @param lon2 Longitude of point 2
 * @returns Distance in kilometers
 */
export function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371; // Radius of Earth in kilometers
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) *
      Math.cos(lat2 * (Math.PI / 180)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c; // Distance in km
}

/**
 * Geocode a UK postcode or address using UK Postcodes.io or Nominatim
 * @param address Address string (postcode or full address)
 * @returns Promise with { latitude, longitude } or null if geocoding fails
 */
export async function geocodeAddress(address: string): Promise<{ latitude: number; longitude: number } | null> {
  if (!address || !address.trim()) return null;

  const searchQuery = address.trim();
  
  try {
    // Check if it's a UK postcode format (basic check)
    const isPostcode = /^[A-Z]{1,2}\d{1,2}[A-Z]?\s?\d[A-Z]{2}$/i.test(searchQuery);
    
    if (isPostcode) {
      // Use UK Postcodes.io for UK postcodes
      const postcodeNormalized = searchQuery.replace(/\s+/g, "").toUpperCase();
      const response = await fetch(`https://api.postcodes.io/postcodes/${postcodeNormalized}`);
      
      if (response.ok) {
        const data = await response.json();
        if (data.result && data.result.latitude && data.result.longitude) {
          return {
            latitude: data.result.latitude,
            longitude: data.result.longitude,
          };
        }
      }
    }
    
    // Fallback to Nominatim (OpenStreetMap) for general address search
    const nominatimUrl = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery)}&countrycodes=gb&limit=1`;
    const response = await fetch(nominatimUrl, {
      headers: {
        "User-Agent": "Rip/1.0", // Nominatim requires a user agent
      },
    });

    if (response.ok) {
      const data = await response.json();
      if (data.length > 0 && data[0].lat && data[0].lon) {
        return {
          latitude: parseFloat(data[0].lat),
          longitude: parseFloat(data[0].lon),
        };
      }
    }
  } catch (error) {
    console.error("Geocoding error:", error);
  }

  return null;
}

/**
 * Calculate distance risk score based on distance from gym
 * Greater distance = higher risk (higher score)
 * @param distanceKm Distance in kilometers
 * @returns Risk score (0-100)
 */
export function getDistanceRiskScore(distanceKm: number | null | undefined): number {
  if (distanceKm === null || distanceKm === undefined) return 0; // No risk if unknown

  // Distance-based risk scoring - greater distance = higher risk
  if (distanceKm <= 2) return 0; // Very close, no risk
  if (distanceKm <= 5) return 10; // Close, slight risk
  if (distanceKm <= 10) return 25; // Moderate distance, moderate risk
  if (distanceKm <= 20) return 45; // Far, higher risk
  if (distanceKm <= 30) return 65; // Very far, high risk
  return 85; // Extremely far, very high risk
}
