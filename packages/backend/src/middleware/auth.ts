import { type Request, type Response, type NextFunction } from "express";
import { type AppDatabase } from "../db/connection.js";
import { createAuthService } from "../services/auth.service.js";

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      userId?: number;
      householdId?: number;
    }
  }
}

export function authMiddleware(db: AppDatabase) {
  const authService = createAuthService(db);

  return (req: Request, res: Response, next: NextFunction) => {
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

    req.userId = result.user.id;
    req.householdId = result.householdId ?? undefined;
    next();
  };
}
