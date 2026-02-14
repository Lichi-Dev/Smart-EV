import mongoose from "mongoose";

const TrafficLogSchema = new mongoose.Schema(
  {
    path: { type: String, required: true },
    method: { type: String, required: true },
    ip: { type: String },
    city: { type: String },
    country: { type: String },
    userAgent: { type: String },
  },
  { timestamps: true }
);

export const TrafficLog = mongoose.model("TrafficLog", TrafficLogSchema);
