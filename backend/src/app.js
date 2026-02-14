import express from "express";
import cors from "cors";
import morgan from "morgan";
import mongoose from "mongoose";
import { config } from "./config/env.js";
import { trafficLogger } from "./middleware/trafficLogger.js";
import routesRouter from "./routes/routes.js";
import stationsRouter from "./routes/stations.js";
import tripsRouter from "./routes/trips.js";
import adminRouter from "./routes/admin.js";
import geocodeRouter from "./routes/geocode.js";

export const createApp = async () => {
  await mongoose.connect(config.mongoUri);

  const app = express();

  app.use(
    cors({
      origin: config.clientOrigin,
      credentials: true,
    })
  );
  app.use(express.json({ limit: "2mb" }));
  app.use(morgan("dev"));
  app.use(trafficLogger);

  app.get("/health", (req, res) => {
    res.json({ status: "ok" });
  });

  app.use("/api/routes", routesRouter);
  app.use("/api/geocode", geocodeRouter);
  app.use("/api/stations", stationsRouter);
  app.use("/api/trips", tripsRouter);
  app.use("/api/admin", adminRouter);

  // Global error handler
  // eslint-disable-next-line no-unused-vars
  app.use((err, req, res, next) => {
    console.error(err);
    const status = err.status || 500;
    res.status(status).json({
      error: err.message || "Internal Server Error",
    });
  });

  return app;
};
