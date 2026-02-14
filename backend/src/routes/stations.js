import express from "express";
import Joi from "joi";
import { Station } from "../models/Station.js";

const router = express.Router();

function haversineKm(lat1, lng1, lat2, lng2) {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function minDistanceToRouteKm(stationLat, stationLng, routeCoordinates) {
  if (!routeCoordinates || routeCoordinates.length === 0) return Infinity;
  let min = Infinity;
  for (const pt of routeCoordinates) {
    const lng = Array.isArray(pt) ? pt[0] : pt.lng;
    const lat = Array.isArray(pt) ? pt[1] : pt.lat;
    const d = haversineKm(stationLat, stationLng, lat, lng);
    if (d < min) min = d;
  }
  return min;
}

const nearRouteSchema = Joi.object({
  bufferKm: Joi.number().min(0.5).max(50).default(5),
  bounds: Joi.object({
    minLat: Joi.number().required(),
    maxLat: Joi.number().required(),
    minLng: Joi.number().required(),
    maxLng: Joi.number().required(),
  }).required(),
  coordinates: Joi.array()
    .items(Joi.array().length(2).ordered(Joi.number(), Joi.number()))
    .optional(),
});

router.post("/near-route", async (req, res, next) => {
  try {
    const { value, error } = nearRouteSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ error: error.message });
    }

    const { bufferKm, bounds, coordinates } = value;
    const { minLat, maxLat, minLng, maxLng } = bounds;

    const latDelta = bufferKm / 111;
    const lngDelta =
      bufferKm / (111 * Math.cos(((minLat + maxLat) / 2) * (Math.PI / 180)));

    const raw = await Station.find({
      latitude: { $gte: minLat - latDelta, $lte: maxLat + latDelta },
      longitude: { $gte: minLng - lngDelta, $lte: maxLng + lngDelta },
      isActive: true,
    })
      .select("name latitude longitude location city country_code ports powerKw isFastCharging")
      .lean();

    let stations = raw.map((s) => ({
      _id: s._id,
      name: s.name,
      latitude: Number(s.latitude),
      longitude: Number(s.longitude),
      location: s.location,
      city: s.city,
      country_code: s.country_code,
      ports: s.ports,
      powerKw: s.powerKw,
      isFastCharging: s.isFastCharging,
    }));

    if (coordinates && coordinates.length > 0 && bufferKm > 0) {
      stations = stations.filter((s) => {
        const d = minDistanceToRouteKm(s.latitude, s.longitude, coordinates);
        return d <= bufferKm;
      });
    }

    res.json({ stations });
  } catch (err) {
    next(err);
  }
});

export default router;
