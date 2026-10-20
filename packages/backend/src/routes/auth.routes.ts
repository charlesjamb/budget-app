import { Router } from "express";
import rateLimit from "express-rate-limit";
import { type AppDatabase } from "../db/connection.js";
import { createAuthService } from "../services/auth.service.js";

const MAX_DISPLAY_NAME_LENGTH = 50;

const loginRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  message: { error: "Too many login attempts, please try again later." },
  standardHeaders: true,
  legacyHeaders: false,
});

export function authRoutes(db: AppDatabase): Router {
  const router = Router();
  const authService = createAuthService(db);

  router.post("/login", loginRateLimiter, async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
      res.status(400).json({ error: "Email and password are required" });
      return;
    }

    const result = await authService.login(email, password);

    if (!result) {
      res.status(401).json({ error: "Invalid credentials" });
      return;
    }

    res.cookie("session", result.sessionId, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    res.json({ user: result.user, householdId: result.householdId });
  });

  router.post("/logout", (req, res) => {
    const sessionId = req.cookies?.session;
    if (sessionId) {
      authService.logout(sessionId);
    }
    res.clearCookie("session");
    res.status(204).send();
  });

  router.get("/me", (req, res) => {
    const sessionId = req.cookies?.session;

    if (!sessionId) {
      res.status(401).json({ error: "Not authenticated" });
      return;
    }

    const result = authService.getUserFromSession(sessionId);

    if (!result) {
      res.status(401).json({ error: "Not authenticated" });
      return;
    }

    res.json({
      user: result.user,
      householdId: result.householdId,
    });
  });

  router.patch("/me", (req, res) => {
    const sessionId = req.cookies?.session;
    const session = sessionId ? authService.getUserFromSession(sessionId) : null;

    if (!session) {
      res.status(401).json({ error: "Not authenticated" });
      return;
    }

    const { displayName } = req.body;
    if (typeof displayName !== "string" || displayName.trim().length > MAX_DISPLAY_NAME_LENGTH) {
      res.status(400).json({
        error: `displayName must be a string of at most ${MAX_DISPLAY_NAME_LENGTH} characters`,
      });
      return;
    }

    const user = authService.updateDisplayName(session.user.id, displayName.trim() || null);
    res.json({ user, householdId: session.householdId });
  });

  return router;
}
