import { Context, Next } from "hono";

export async function authMiddleware(c: Context, next: Next) {
  const authHeader = c.req.header("Authorization");
  const token = authHeader?.replace("Bearer ", "");
  const expectedToken = process.env.API_SECRET_TOKEN;

  if (!expectedToken) {
    console.warn("API_SECRET_TOKEN not set — skipping auth");
    return next();
  }

  if (!token || token !== expectedToken) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  return next();
}