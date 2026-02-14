import express from "express";
import Joi from "joi";
import { Trip } from "../models/Trip.js";

const router = express.Router();

const saveTripSchema = Joi.object({
  userId: Joi.string().optional(),
  origin: Joi.object({
    address: Joi.string().required(),
    latitude: Joi.number().required(),
    longitude: Joi.number().required(),
  }).required(),
  destination: Joi.object({
    address: Joi.string().required(),
    latitude: Joi.number().required(),
    longitude: Joi.number().required(),
  }).required(),
  routeProvider: Joi.string().valid("graphhopper").default("graphhopper"),
  distanceMeters: Joi.number().required(),
  durationSeconds: Joi.number().required(),
  stops: Joi.array()
    .items(
      Joi.object({
        type: Joi.string()
          .valid("origin", "destination", "charging")
          .required(),
        station: Joi.string().optional(),
        name: Joi.string().optional(),
        latitude: Joi.number().required(),
        longitude: Joi.number().required(),
        arrivalTime: Joi.date().optional(),
        departureTime: Joi.date().optional(),
      })
    )
    .default([]),
  meta: Joi.object({
    vehicleRangeKm: Joi.number().optional(),
  }).optional(),
});

router.post("/", async (req, res, next) => {
  try {
    const { value, error } = saveTripSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ error: error.message });
    }

    value.meta = {
      ...(value.meta || {}),
      createdFromIp:
        (req.headers["x-forwarded-for"] || "")
          .toString()
          .split(",")[0]
          .trim() || req.socket.remoteAddress,
      createdFromCity: req.headers["x-client-city"],
    };

    const trip = await Trip.create(value);
    res.status(201).json({ trip });
  } catch (err) {
    next(err);
  }
});

router.get("/history", async (req, res, next) => {
  try {
    const userId = req.query.userId;
    const filter = {};
    if (userId) {
      filter.userId = userId;
    }

    const trips = await Trip.find(filter)
      .sort({ createdAt: -1 })
      .limit(50)
      .lean();

    res.json({ trips });
  } catch (err) {
    next(err);
  }
});

export default router;
