import mongoose from "mongoose";

const StationSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    latitude: { type: Number, required: true, index: true },
    longitude: { type: Number, required: true, index: true },
    location: { type: String },
    city: { type: String, index: true },
    country_code: { type: String },
    ports: { type: Number },
    powerKw: { type: Number },
    isFastCharging: { type: Boolean, default: false },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

StationSchema.index({ latitude: 1, longitude: 1 });
StationSchema.index({ country_code: 1 });
StationSchema.index({ city: 1, country_code: 1 });
StationSchema.index({ createdAt: -1 });

export const Station = mongoose.model("Station", StationSchema);
