import axios from "axios";
import { TrafficLog } from "../models/TrafficLog.js";

const GEO_TIMEOUT_MS = 2000;

function isLocalIp(ip) {
  if (!ip || typeof ip !== "string") return true;
  const trimmed = ip.trim();
  return (
    trimmed === "127.0.0.1" ||
    trimmed === "::1" ||
    trimmed === "::ffff:127.0.0.1" ||
    trimmed.startsWith("192.168.") ||
    trimmed.startsWith("10.")
  );
}

export const trafficLogger = (req, res, next) => {
  res.on("finish", () => {
    const ip =
      (req.headers["x-forwarded-for"] || "")
        .toString()
        .split(",")[0]
        .trim() || req.socket?.remoteAddress;

    const logEntry = () => {
      TrafficLog.create({
        path: req.path,
        method: req.method,
        ip: ip || undefined,
        city,
        country,
      }).catch(() => {});
    };

    let city;
    let country;

    const query = !ip || isLocalIp(ip) ? "" : encodeURIComponent(ip);
    const geoUrl = `http://ip-api.com/json/${query}?fields=status,city,country`;

    axios
      .get(geoUrl, { timeout: GEO_TIMEOUT_MS })
      .then((resp) => {
        const data = resp.data;
        if (data && data.status === "success") {
          city = data.city ?? undefined;
          country = data.country ?? undefined;
        }
        logEntry();
      })
      .catch(() => {
        logEntry();
      });
  });
  next();
};
