import { Router } from "express";
import { type AppDatabase } from "../db/connection.js";
import { createTransactionService } from "../services/transaction.service.js";
import { createMappingRuleService } from "../services/mapping-rule.service.js";

export function transactionRoutes(db: AppDatabase): Router {
  const router = Router();
  const transactionService = createTransactionService(db);
  const mappingRuleService = createMappingRuleService(db);

  router.get("/", (req, res) => {
    const month = req.query.month as string;

    if (!month || !/^\d{4}-\d{2}$/.test(month)) {
      res
        .status(400)
        .json({ error: "month query parameter is required (YYYY-MM)" });
      return;
    }

    const txs = transactionService.getByMonth(req.householdId!, month);
    res.json({ transactions: txs });
  });

  router.get("/monthly-summary", (req, res) => {
    const month = req.query.month as string;

    if (!month || !/^\d{4}-\d{2}$/.test(month)) {
      res
        .status(400)
        .json({ error: "month query parameter is required (YYYY-MM)" });
      return;
    }

    const summary = transactionService.getMonthlySummary(
      req.householdId!,
      month,
    );
    res.json(summary);
  });

  router.get("/history", (req, res) => {
    const from = req.query.from as string;
    const to = req.query.to as string;

    if (
      !from ||
      !to ||
      !/^\d{4}-\d{2}$/.test(from) ||
      !/^\d{4}-\d{2}$/.test(to)
    ) {
      res
        .status(400)
        .json({ error: "from and to query parameters are required (YYYY-MM)" });
      return;
    }

    const history = transactionService.getHistory(req.householdId!, from, to);
    res.json(history);
  });

  router.get("/uncategorized-subcategories", (req, res) => {
    const subcategories = mappingRuleService.getUncategorizedSubCategories(
      req.householdId!,
    );
    res.json({ subcategories });
  });

  return router;
}
