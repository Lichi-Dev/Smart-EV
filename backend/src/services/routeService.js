import axios from "axios";
import { config } from "../config/env.js";

// Get multiple route options using GraphHopper
export const getRouteWithAlternatives = async ({ origin, destination }) => {
  if (!config.graphhopperApiKey) {
    const error = new Error("GraphHopper API key not configured");
    error.status = 500;
    throw error;
  }

  const url = "https://graphhopper.com/api/1/route";

  // GraphHopper expects multiple 'point' query parameters, not an array
  // We need to build the query string manually or use paramsSerializer
  const params = new URLSearchParams();
  params.append("point", `${origin.latitude},${origin.longitude}`);
  params.append("point", `${destination.latitude},${destination.longitude}`);
  params.append("vehicle", "car");
  params.append("locale", "en");
  params.append("instructions", "false");
  params.append("algorithm", "alternative_route");
  params.append("points_encoded", "false"); // so we get coordinates array for map
  params.append("key", config.graphhopperApiKey);

  try {
    const resp = await axios.get(`${url}?${params.toString()}`);

    // Check for GraphHopper API errors
    if (resp.data.message) {
      const error = new Error(`GraphHopper API error: ${resp.data.message}`);
      error.status = resp.status || 500;
      throw error;
    }

    const paths = resp.data.paths || [];

    if (paths.length === 0) {
      const error = new Error("No routes found");
      error.status = 404;
      throw error;
    }

    const routes = paths.map((p, idx) => {
      // points_encoded=false: p.points.coordinates is [[lng, lat], ...]
      const coordinates = p.points?.coordinates || [];
      // Compute bbox from coordinates when API doesn't return it (e.g. points_encoded=false)
      let bbox = p.bbox;
      if (!bbox && coordinates.length > 0) {
        const lngs = coordinates.map((c) => c[0]);
        const lats = coordinates.map((c) => c[1]);
        bbox = [
          Math.min(...lngs),
          Math.min(...lats),
          Math.max(...lngs),
          Math.max(...lats),
        ];
      }
      return {
        id: idx,
        distanceMeters: p.distance,
        durationSeconds: p.time / 1000,
        bbox, // [minLon, minLat, maxLon, maxLat]
        coordinates,
      };
    });

    routes.sort((a, b) => a.distanceMeters - b.distanceMeters);

    routes.forEach((r, i) => {
      r.id = i;
    });

    return { provider: "graphhopper", routes };
  } catch (err) {
    // If axios error, extract GraphHopper's error message if available
    if (err.response?.data?.message) {
      const error = new Error(
        `GraphHopper API error: ${err.response.data.message}`
      );
      error.status = err.response.status;
      throw error;
    }
    throw err;
  }
};
