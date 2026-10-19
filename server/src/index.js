import "dotenv/config";
import express from "express";
import cors from "cors";
import authRoutes from "./routes/auth.js";
import eventRoutes from "./routes/events.js";
import meRoutes from "./routes/me.js";
import paymentRoutes from "./routes/payments.js";

const app = express();

// Any website may call this API from a browser. That's safe here because
// logins use a token in the Authorization header, not cookies, so another
// site can't act as a logged-in user without that user's token.
app.use(cors());

app.use(express.json({ limit: "100kb" }));

app.get("/", (req, res) => res.json({ name: "Gatepass API", status: "ok" }));
app.get("/health", (req, res) => res.json({ status: "ok" }));

app.use("/auth", authRoutes);
app.use("/events", eventRoutes);
app.use("/", meRoutes);
app.use("/", paymentRoutes);

app.use((req, res) => res.status(404).json({ error: "Not found." }));

// One place that turns every error into a clean JSON response.
// (Express 5 sends errors from async routes here automatically.)
app.use((err, req, res, next) => {
  if (err.status) return res.status(err.status).json({ error: err.message });
  if (err.code === "22P02") return res.status(404).json({ error: "Not found." }); // malformed id
  if (err.code === "23505") return res.status(409).json({ error: "That already exists." });
  if (err.type === "entity.parse.failed") return res.status(400).json({ error: "Invalid JSON." });
  console.error(err);
  res.status(500).json({ error: "Something went wrong on our side." });
});

const port = Number(process.env.PORT) || 4000;
app.listen(port, () => console.log(`Gatepass API running on http://localhost:${port}`));