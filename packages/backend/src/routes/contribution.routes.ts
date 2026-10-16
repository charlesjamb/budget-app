import { Router } from "express";
import { type AppDatabase } from "../db/connection.js";
import { createContributionService } from "../services/contribution.service.js";

const MONTH_RE = /^\d{4}-\d{2}$/;

export function contributionRoutes(db: AppDatabase): Router {
  const router = Router();
  const contributionService = createContributionService(db);

  router.get("/", (req, res) => {
    const month = req.query.month as string;

    if (!month || !MONTH_RE.test(month)) {
      res.status(400).json({ error: "month query parameter is required (YYYY-MM)" });
      return;
    }

    const members = contributionService.getByMonth(req.householdId!, month);
    res.json({ month, members });
  });

  router.put("/", (req, res) => {
    const { month, contributions } = req.body;

    if (!month || !MONTH_RE.test(month)) {
      res.status(400).json({ error: "month is required (YYYY-MM)" });
      return;
    }

    if (!Array.isArray(contributions)) {
      res.status(400).json({ error: "contributions array is required" });
      return;
    }

    for (const c of contributions) {
      if (typeof c.userId !== "number" || typeof c.revenueCents !== "number") {
        res.status(400).json({
          error: "Each contribution must have userId and revenueCents as numbers",
        });
        return;
      }
      if (c.revenueCents < 0) {
        res.status(400).json({ error: "revenueCents must be >= 0" });
        return;
      }
    }

    contributionService.upsertBulk(req.householdId!, month, contributions);
    const updated = contributionService.getByMonth(req.householdId!, month);
    res.json({ month, members: updated });
  });

  return router;
}
