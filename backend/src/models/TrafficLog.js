import mongoose from "mongoose";

const TrafficLogSchema = new mongoose.Schema(
  {
    path: { type: String, required: true, index: true },
    method: { type: String, required: true },
    ip: { type: String },
    city: { type: String, index: true },
    country: { type: String },
  },
  { timestamps: true }
);

TrafficLogSchema.index({ path: 1, method: 1 });
TrafficLogSchema.index({ city: 1, country: 1 });

export const TrafficLog = mongoose.model("TrafficLog", TrafficLogSchema);
