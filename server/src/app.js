const express = require("express");
const cors = require("cors");
const interviewRoutes = require("./routes/interviewRoutes");

const app = express();

app.use(cors({
  origin: true
}));
app.use(express.json());

app.get("/health", (req, res) => {
  res.status(200).json({ status: "ok" });
});

app.use("/api/interviews", interviewRoutes);

app.use((req, res) => {
  res.status(404).json({ error: "Not found" });
});

app.use((err, req, res, next) => {
  console.error(err);
  res.status(err.status || 500).json({
    error: err.message || "Internal server error",
  });
});

module.exports = app;