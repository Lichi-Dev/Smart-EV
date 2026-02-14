import { createApp } from "./app.js";
import { config } from "./config/env.js";

const start = async () => {
  try {
    const app = await createApp();
    app.listen(config.port, () => {
      console.log(`Backend listening on port ${config.port}`);
    });
  } catch (err) {
    console.error("Failed to start server", err);
    process.exit(1);
  }
};

start();
