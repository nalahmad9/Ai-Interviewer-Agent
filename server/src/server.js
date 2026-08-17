const app = require("./app");
const { env } = require("./config/env");
const mongoose = require("mongoose");

async function startServer() {
  try {
    await mongoose.connect(env.mongoUri, {
      family: 4, // Force IPv4
    });
    console.log("Connected to MongoDB");

    const PORT = process.env.PORT || env.port || 3000;
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  } catch (err) {
    console.error("Failed to connect to database or start server:", err);
    process.exit(1);
  }
}

startServer();