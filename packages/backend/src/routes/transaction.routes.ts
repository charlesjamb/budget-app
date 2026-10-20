import { Router } from "express";
import {
  GLOBAL_CAP_CATEGORY_ID,
  type ExcludeTransactionRequest,
  type ReimbursementRequest,
  type SetTransactionCategoryRequest,
} from "@budget-app/shared";
import { type AppDatabase } from "../db/connection.js";
import { createTransactionService } from "../services/transaction.service.js";
import { createMappingRuleService } from "../services/mapping-rule.service.js";
import { createBudgetService } from "../services/budget.service.js";

export function transactionRoutes(db: AppDatabase): Router {
  const router = Router();
  const transactionService = createTransactionService(db);
  const mappingRuleService = createMappingRuleService(db);
  const budgetService = createBudgetService(db);

  router.patch("/:id/exclude", (req, res) => {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) {
      res.status(400).json({ error: "Invalid transaction ID" });
      return;
    }
    const body = req.body as ExcludeTransactionRequest;
    if (typeof body?.excluded !== "boolean") {
      res.status(400).json({ error: "excluded must be a boolean" });
      return;
    }
    const updated = transactionService.updateExclude(
      req.householdId!,
      id,
      body.excluded,
      body.reason,
    );
    if (!updated) {
      res.status(404).json({ error: "Transaction not found" });
      return;
    }
    res.json(updated);
  });

  router.patch("/:id/category", (req, res) => {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) {
      res.status(400).json({ error: "Invalid transaction ID" });
      return;
    }
    const { budgetCategoryId } = req.body as SetTransactionCategoryRequest;
    if (!Number.isInteger(budgetCategoryId)) {
      res.status(400).json({ error: "budgetCategoryId must be an integer" });
      return;
    }
    const result = transactionService.setCategory(req.householdId!, id, budgetCategoryId);
    if ("error" in result) {
      if (result.error === "invalid_category") {
        res.status(400).json({ error: "Category not found" });
      } else {
        res.status(404).json({ error: "Transaction not found" });
      }
      return;
    }
    res.json(result.data);
  });

  router.put("/:id/reimbursement", (req, res) => {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) {
      res.status(400).json({ error: "Invalid transaction ID" });
      return;
    }
    const body = req.body as ReimbursementRequest;
    if (typeof body?.amount !== "number" || body.amount <= 0) {
      res.status(400).json({ error: "amount must be a positive number" });
      return;
    }
    const result = transactionService.updateReimbursement(
      req.householdId!,
      id,
      body.amount,
      body.note,
    );
    if ("error" in result) {
      if (result.error === "not_found") {
        res.status(404).json({ error: "Transaction not found" });
      } else {
        res.status(400).json({ error: "amount must be positive and <= transaction amount" });
      }
      return;
    }
    res.json(result.data);
  });

  router.delete("/:id/reimbursement", (req, res) => {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) {
      res.status(400).json({ error: "Invalid transaction ID" });
      return;
    }
    const updated = transactionService.clearReimbursement(req.householdId!, id);
    if (!updated) {
      res.status(404).json({ error: "Transaction not found" });
      return;
    }
    res.json(updated);
  });

  router.get("/", (req, res) => {
    const month = req.query.month as string;

    if (!month || !/^\d{4}-\d{2}$/.test(month)) {
      res.status(400).json({ error: "month query parameter is required (YYYY-MM)" });
      return;
    }

    const txs = transactionService.getByMonth(req.householdId!, month);
    res.json({ transactions: txs });
  });

  router.get("/monthly-summary", (req, res) => {
    const month = req.query.month as string;

    if (!month || !/^\d{4}-\d{2}$/.test(month)) {
      res.status(400).json({ error: "month query parameter is required (YYYY-MM)" });
      return;
    }

    const summary = transactionService.getMonthlySummary(req.householdId!, month);

    // Enrich with budget data
    const budgets = budgetService.getByMonth(req.householdId!, month);
    const budgetMap = new Map(budgets.map((b) => [b.categoryId, b.amountCents]));

    const enrichedCategories = summary.categories.map((cat) => ({
      ...cat,
      budgetAmountCents: budgetMap.get(cat.id),
    }));

    const globalBudgetCents =
      budgets
        .filter((b) => b.categoryId !== GLOBAL_CAP_CATEGORY_ID)
        .reduce((sum, b) => sum + b.amountCents, 0) || undefined;

    res.json({
      ...summary,
      categories: enrichedCategories,
      globalBudgetCents,
    });
  });

  router.get("/history", (req, res) => {
    const from = req.query.from as string;
    const to = req.query.to as string;

    if (!from || !to || !/^\d{4}-\d{2}$/.test(from) || !/^\d{4}-\d{2}$/.test(to)) {
      res.status(400).json({ error: "from and to query parameters are required (YYYY-MM)" });
      return;
    }

    const history = transactionService.getHistory(req.householdId!, from, to);
    res.json(history);
  });

  router.get("/uncategorized-subcategories", (req, res) => {
    const subcategories = mappingRuleService.getUncategorizedSubCategories(req.householdId!);
    res.json({ subcategories });
  });

  return router;
}
