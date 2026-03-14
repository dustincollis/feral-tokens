import { serve } from "@hono/node-server";
import { Hono } from "hono";
import { cors } from "hono/cors";
import { logger } from "hono/logger";
import { scrapeRoute } from "./routes/scrape";
import { scoreRoute } from "./routes/score";
import { generateRoute } from "./routes/generate";
import { healthRoute } from "./routes/health";
import { sourcesRoute } from "./routes/sources";
import { authMiddleware } from "./middleware/auth";

const app = new Hono();

app.use("*", cors());
app.use("*", logger());
app.use("/api/*", authMiddleware);

app.route("/api/health", healthRoute);
app.route("/api/scrape", scrapeRoute);
app.route("/api/score", scoreRoute);
app.route("/api/generate", generateRoute);
app.route("/api/sources", sourcesRoute);

const port = parseInt(process.env.PORT ?? "3001");

serve({ fetch: app.fetch, port }, () => {
  console.log(`API server running on port ${port}`);
});