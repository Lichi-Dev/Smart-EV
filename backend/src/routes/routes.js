import express from "express";
import Joi from "joi";
import { getRouteWithAlternatives } from "../services/routeService.js";
import { geocode } from "../services/geocodeService.js";

const router = express.Router();

const routeSchema = Joi.object({
  source: Joi.string().required().trim().min(1),
  destination: Joi.string().required().trim().min(1),
});

router.post("/", async (req, res, next) => {
  try {
    const { value, error } = routeSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ error: error.message });
    }

    const { source, destination } = value;

    const [originGeocode, destGeocode] = await Promise.all([
      geocode(source),
      geocode(destination),
    ]);

    const origin = {
      address: originGeocode.address,
      latitude: originGeocode.lat,
      longitude: originGeocode.lng,
    };
    const dest = {
      address: destGeocode.address,
      latitude: destGeocode.lat,
      longitude: destGeocode.lng,
    };

    const data = await getRouteWithAlternatives({
      origin,
      destination: dest,
    });

    res.json({
      ...data,
      origin: {
        address: origin.address,
        lat: origin.latitude,
        lng: origin.longitude,
      },
      destination: {
        address: dest.address,
        lat: dest.latitude,
        lng: dest.longitude,
      },
    });
  } catch (err) {
    next(err);
  }
});

export default router;
