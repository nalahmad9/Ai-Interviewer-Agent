const dotenv = require("dotenv");

dotenv.config();

const env = {
    port: process.env.PORT || 5000,
    mongoUri: process.env.MONGODB_URI || "mongodb://localhost:27017/ai-interview",
    gemini: {
        apiKey: process.env.GEMINI_API_KEY,
        model: process.env.GEMINI_MODEL || "gemini-2.5-flash"
    },
    groq: {
        apiKey: process.env.GROQ_API_KEY,
        model: process.env.GROQ_MODEL || "llama-3.3-70b-versatile"
    }
}

module.exports = { env };