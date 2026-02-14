import express from "express";
import { suggestLocations, reverseGeocode } from "../services/geocodeService.js";

const router = express.Router();

router.get("/suggest", async (req, res, next) => {
  try {
    const q = req.query.q;
    const limit = Math.min(parseInt(req.query.limit, 10) || 8, 10);
    const suggestions = await suggestLocations(q, limit);
    res.json({ suggestions });
  } catch (err) {
    next(err);
  }
});

router.get("/reverse", async (req, res, next) => {
  try {
    const lat = req.query.lat;
    const lng = req.query.lng;
    const { address, city } = await reverseGeocode(lat, lng);
    res.json({ address, city });
  } catch (err) {
    next(err);
  }
});

export default router;
