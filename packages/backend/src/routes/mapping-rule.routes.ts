import { Router } from "express";
import { type AppDatabase } from "../db/connection.js";
import { createMappingRuleService } from "../services/mapping-rule.service.js";

export function mappingRuleRoutes(db: AppDatabase): Router {
  const router = Router();
  const mappingRuleService = createMappingRuleService(db);

  router.get("/", (req, res) => {
    const rules = mappingRuleService.getAll(req.householdId!);
    res.json({ rules });
  });

  router.post("/", (req, res) => {
    const { bankSubCategory, labelSimplified, budgetCategoryId } = req.body;

    if (!bankSubCategory || !labelSimplified || !budgetCategoryId) {
      res.status(400).json({
        error: "bankSubCategory, labelSimplified and budgetCategoryId are required",
      });
      return;
    }

    try {
      const rule = mappingRuleService.create(
        req.householdId!,
        bankSubCategory,
        labelSimplified,
        budgetCategoryId,
      );
      res.status(201).json({ rule });
    } catch {
      res.status(409).json({ error: "Mapping rule already exists" });
    }
  });

  router.put("/:id", (req, res) => {
    const id = parseInt(req.params.id, 10);
    const { budgetCategoryId } = req.body;

    if (!budgetCategoryId) {
      res.status(400).json({ error: "budgetCategoryId is required" });
      return;
    }

    const rule = mappingRuleService.update(id, req.householdId!, budgetCategoryId);
    if (!rule) {
      res.status(404).json({ error: "Rule not found" });
      return;
    }

    res.json({ rule });
  });

  router.delete("/:id", (req, res) => {
    const id = parseInt(req.params.id, 10);
    const deleted = mappingRuleService.delete(id, req.householdId!);

    if (!deleted) {
      res.status(404).json({ error: "Rule not found" });
      return;
    }

    res.status(204).send();
  });

  router.post("/classify", (req, res) => {
    const { bankSubCategory, labelSimplified, budgetCategoryId } = req.body;

    if (!bankSubCategory || !labelSimplified || !budgetCategoryId) {
      res.status(400).json({
        error: "bankSubCategory, labelSimplified and budgetCategoryId are required",
      });
      return;
    }

    const result = mappingRuleService.classify(
      req.householdId!,
      bankSubCategory,
      labelSimplified,
      budgetCategoryId,
    );

    res.json(result);
  });

  return router;
}
