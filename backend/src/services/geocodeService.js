import axios from "axios";
import { config } from "../config/env.js";

/**
 * Geocode a place name/address to coordinates using GraphHopper Geocoding API.
 * @param {string} query - Address or place name (e.g. "Berlin", "Connaught Place, Delhi")
 * @returns {{ lat: number, lng: number, address: string }}
 */
export async function geocode(query) {
  if (!config.graphhopperApiKey) {
    const error = new Error("GraphHopper API key not configured");
    error.status = 500;
    throw error;
  }
  if (!query || typeof query !== "string" || !query.trim()) {
    const error = new Error("Geocode query is required");
    error.status = 400;
    throw error;
  }

  const params = new URLSearchParams();
  params.append("q", query.trim());
  params.append("limit", "1");
  params.append("locale", "en");
  params.append("key", config.graphhopperApiKey);
  // Free tier only allows default geocoding provider (do not set provider=nominatim)

  const url = `https://graphhopper.com/api/1/geocode?${params.toString()}`;
  const resp = await axios.get(url);

  if (resp.data.message) {
    const error = new Error(`Geocoding error: ${resp.data.message}`);
    error.status = resp.status || 500;
    throw error;
  }

  const hits = resp.data.hits || [];
  if (hits.length === 0) {
    const error = new Error(`No results found for "${query.trim()}"`);
    error.status = 404;
    throw error;
  }

  const hit = hits[0];
  const point = hit.point || {};
  const lat = point.lat;
  const lng = point.lng;
  const address =
    [hit.name, hit.street, hit.city, hit.country].filter(Boolean).join(", ") ||
    query.trim();

  if (lat == null || lng == null) {
    const error = new Error("Geocoding returned no coordinates");
    error.status = 502;
    throw error;
  }

  return { lat, lng, address };
}

export async function suggestLocations(query, limit = 8) {
  if (!config.graphhopperApiKey) {
    const error = new Error("GraphHopper API key not configured");
    error.status = 500;
    throw error;
  }
  if (!query || typeof query !== "string" || query.trim().length < 2) {
    return [];
  }

  const params = new URLSearchParams();
  params.append("q", query.trim());
  params.append("limit", String(Math.min(limit, 10)));
  params.append("locale", "en");
  params.append("key", config.graphhopperApiKey);

  const url = `https://graphhopper.com/api/1/geocode?${params.toString()}`;
  const resp = await axios.get(url);

  if (resp.data.message) return [];

  const hits = resp.data.hits || [];
  return hits.map((hit) => {
    const point = hit.point || {};
    const address =
      [hit.name, hit.street, hit.city, hit.country].filter(Boolean).join(", ") ||
      query.trim();
    return {
      address,
      lat: point.lat,
      lng: point.lng,
    };
  }).filter((s) => s.lat != null && s.lng != null);
}

export async function reverseGeocode(lat, lng) {
  if (!config.graphhopperApiKey) {
    const error = new Error("GraphHopper API key not configured");
    error.status = 500;
    throw error;
  }
  const latNum = Number(lat);
  const lngNum = Number(lng);
  if (Number.isNaN(latNum) || Number.isNaN(lngNum)) {
    const error = new Error("Valid latitude and longitude are required");
    error.status = 400;
    throw error;
  }

  const params = new URLSearchParams();
  params.append("reverse", "true");
  params.append("point", `${latNum},${lngNum}`);
  params.append("limit", "1");
  params.append("locale", "en");
  params.append("key", config.graphhopperApiKey);

  const url = `https://graphhopper.com/api/1/geocode?${params.toString()}`;
  const resp = await axios.get(url);

  if (resp.data.message) {
    const error = new Error(`Reverse geocoding error: ${resp.data.message}`);
    error.status = resp.status || 500;
    throw error;
  }

  const hits = resp.data.hits || [];
  if (hits.length === 0) {
    const error = new Error("No address found for these coordinates");
    error.status = 404;
    throw error;
  }

  const hit = hits[0];
  const address =
    [hit.name, hit.street, hit.city, hit.country].filter(Boolean).join(", ") ||
    `${latNum}, ${lngNum}`;
  const city = hit.city || undefined;

  return { address, city };
}
