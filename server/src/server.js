const mongoose = require("mongoose");
const app = require("./app");
const { env } = require("./config/env");

async function start() {
  try {
    await mongoose.connect(env.mongoUri);
    console.log("Connected to MongoDB");

    app.listen(env.port, () => {
      console.log(`Server running on port ${env.port}`);
    });
  } catch (error) {
    console.error("Failed to start server:", error);
    process.exit(1);
  }
}

start();