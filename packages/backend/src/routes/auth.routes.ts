import { Router } from "express";
import { type AppDatabase } from "../db/connection.js";
import { createAuthService } from "../services/auth.service.js";

export function authRoutes(db: AppDatabase): Router {
  const router = Router();
  const authService = createAuthService(db);

  router.post("/login", async (req, res) => {
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
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    res.json({ user: result.user });
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

  return router;
}
