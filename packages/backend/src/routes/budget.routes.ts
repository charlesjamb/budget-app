import { Router } from "express";
import { type AppDatabase } from "../db/connection.js";
import { createBudgetService } from "../services/budget.service.js";

const MONTH_RE = /^\d{4}-\d{2}$/;

export function budgetRoutes(db: AppDatabase): Router {
  const router = Router();
  const budgetService = createBudgetService(db);

  router.get("/", (req, res) => {
    const month = req.query.month as string;

    if (!month || !MONTH_RE.test(month)) {
      res.status(400).json({ error: "month query parameter is required (YYYY-MM)" });
      return;
    }

    const budgets = budgetService.getByMonth(req.householdId!, month);
    res.json({ month, budgets });
  });

  router.put("/", (req, res) => {
    const { month, budgets } = req.body;

    if (!month || !MONTH_RE.test(month)) {
      res.status(400).json({ error: "month is required (YYYY-MM)" });
      return;
    }

    if (!Array.isArray(budgets)) {
      res.status(400).json({ error: "budgets array is required" });
      return;
    }

    for (const b of budgets) {
      if (typeof b.categoryId !== "number" || typeof b.amountCents !== "number") {
        res.status(400).json({
          error: "Each budget must have categoryId and amountCents as numbers",
        });
        return;
      }
      if (b.amountCents < 0) {
        res.status(400).json({ error: "amountCents must be >= 0" });
        return;
      }
    }

    budgetService.upsertBulk(req.householdId!, month, budgets);
    const updated = budgetService.getByMonth(req.householdId!, month);
    res.json({ month, budgets: updated });
  });

  router.post("/copy", (req, res) => {
    const { sourceMonth, targetMonth } = req.body;

    if (
      !sourceMonth ||
      !targetMonth ||
      !MONTH_RE.test(sourceMonth) ||
      !MONTH_RE.test(targetMonth)
    ) {
      res.status(400).json({
        error: "sourceMonth and targetMonth are required (YYYY-MM)",
      });
      return;
    }

    if (sourceMonth === targetMonth) {
      res.status(400).json({ error: "sourceMonth and targetMonth must differ" });
      return;
    }

    const copiedCount = budgetService.copyFromMonth(req.householdId!, sourceMonth, targetMonth);

    res.json({ copiedCount });
  });

  return router;
}
