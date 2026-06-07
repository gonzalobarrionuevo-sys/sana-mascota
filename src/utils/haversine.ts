/**
 * Calculates the distance between two coordinate pairs on Earth's surface
 * using the Haversine formula (without commercial mapping dependencies).
 */
export function calculateHaversineDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371; // Earth's average radius in kilometers
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) *
      Math.cos(lat2 * (Math.PI / 180)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c; // Distance in kilometers
  
  return Number(distance.toFixed(2)); // Return rounded to 2 decimal places
}

/**
 * Constants for the shop local physical address and delivery fee details.
 */
export const SHOP_LATITUDE = -28.435;
export const SHOP_LONGITUDE = -65.731;
export const SHIPPING_COST_PER_KM = 500; // ARS per km
