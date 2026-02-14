import express from "express";
import Joi from "joi";
import { Station } from "../models/Station.js";
import { Trip } from "../models/Trip.js";
import { TrafficLog } from "../models/TrafficLog.js";

const router = express.Router();

const stationSchema = Joi.object({
  name: Joi.string().required(),
  latitude: Joi.number().required(),
  longitude: Joi.number().required(),
  location: Joi.string().allow("").optional(),
  city: Joi.string().allow("").optional(),
  country_code: Joi.string().allow("").optional(),
  ports: Joi.number().integer().min(0).optional(),
  powerKw: Joi.number().min(0).optional(),
  isFastCharging: Joi.boolean().optional(),
  isActive: Joi.boolean().default(true),
});

router.get("/stations", async (req, res, next) => {
  try {
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 20));
    const skip = (page - 1) * limit;
    const q = (req.query.q || "").trim();

    const filter = {};
    if (q) {
      const re = new RegExp(q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");
      filter.$or = [
        { name: re },
        { location: re },
        { city: re },
      ];
    }

    const [stations, total] = await Promise.all([
      Station.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
      Station.countDocuments(filter),
    ]);

    res.json({
      stations,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    });
  } catch (err) {
    next(err);
  }
});

router.post("/stations", async (req, res, next) => {
  try {
    const { value, error } = stationSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ error: error.message });
    }

    const station = await Station.create(value);
    res.status(201).json({ station });
  } catch (err) {
    next(err);
  }
});

router.get("/trips", async (req, res, next) => {
  try {
    const trips = await Trip.find().sort({ createdAt: -1 }).limit(100).lean();
    res.json({ trips });
  } catch (err) {
    next(err);
  }
});

router.get("/traffic", async (req, res, next) => {
  try {
    const agg = await TrafficLog.aggregate([
      {
        $group: {
          _id: { city: "$city", country: "$country" },
          count: { $sum: 1 },
        },
      },
      {
        $sort: { count: -1 },
      },
      { $limit: 50 },
    ]);

    res.json({
      byCity: agg.map((x) => ({
        city: x._id.city,
        country: x._id.country,
        count: x.count,
      })),
    });
  } catch (err) {
    next(err);
  }
});

export default router;
