import dotenv from "dotenv";

dotenv.config();

export const config = {
  port: process.env.PORT || 4000,
  mongoUri: process.env.MONGO_URI || "mongodb://localhost:27017/smart_ev",
  graphhopperApiKey: process.env.GRAPHHOPPER_API_KEY || "",
  clientOrigin: process.env.CLIENT_ORIGIN || "http://localhost:3000",
};
