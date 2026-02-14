import mongoose from "mongoose";

const StopSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: ["origin", "destination", "charging"],
      required: true,
    },
    station: { type: mongoose.Schema.Types.ObjectId, ref: "Station" },
    name: { type: String },
    latitude: { type: Number, required: true },
    longitude: { type: Number, required: true },
    arrivalTime: { type: Date },
    departureTime: { type: Date },
  },
  { _id: false }
);

const TripSchema = new mongoose.Schema(
  {
    userId: { type: String }, // could be anonymous or from auth in a real app
    origin: {
      address: { type: String, required: true },
      latitude: { type: Number, required: true },
      longitude: { type: Number, required: true },
    },
    destination: {
      address: { type: String, required: true },
      latitude: { type: Number, required: true },
      longitude: { type: Number, required: true },
    },
    routeProvider: {
      type: String,
      enum: ["graphhopper"],
      default: "graphhopper",
    },
    distanceMeters: { type: Number },
    durationSeconds: { type: Number },
    stops: [StopSchema],
    meta: {
      vehicleRangeKm: { type: Number },
      createdFromIp: { type: String },
      createdFromCity: { type: String },
    },
  },
  { timestamps: true }
);

export const Trip = mongoose.model("Trip", TripSchema);
