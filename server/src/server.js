const mongoose = require("mongoose");
const app = require("./app");
const { env } = require("./config/env");

let isConnected = false;

async function connectDB() {
  if (isConnected && mongoose.connection.readyState === 1) return;
  try {
    await mongoose.connect(env.mongoUri, {
      bufferCommands: false,
      serverSelectionTimeoutMS: 5000,
    });
    isConnected = true;
  } catch (error) {
    isConnected = false;
    throw error;
  }
}

export default {
  async fetch(request, env, ctx) {
    try {
      await connectDB();

      // Dispatch request directly to your Express app or handle route matching
      const url = new URL(request.url);
      
      // If hitting the root or health check:
      if (url.pathname === "/" || url.pathname === "/health") {
        return new Response(JSON.stringify({ status: "API is online and connected to MongoDB!" }), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        });
      }

      // For all other routes, let's forward them or handle via Express router
      // (If you want full Express router matching on Cloudflare Workers, you can use itty-router or standard fetch routing)
      
      return app.handle ? await app.handle(request) : new Response("Route handled", { status: 200 });

    } catch (error) {
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }
  },
};