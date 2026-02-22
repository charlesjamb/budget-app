import { Router } from "express";
import { type AppDatabase } from "../db/connection.js";
import { createCategoryService } from "../services/category.service.js";

export function categoryRoutes(db: AppDatabase): Router {
  const router = Router();
  const categoryService = createCategoryService(db);

  router.get("/", (req, res) => {
    const categories = categoryService.getAll(req.householdId!);
    res.json({ categories });
  });

  router.post("/", (req, res) => {
    const { name } = req.body;

    if (!name || typeof name !== "string" || !name.trim()) {
      res.status(400).json({ error: "Name is required" });
      return;
    }

    try {
      const category = categoryService.create(req.householdId!, name.trim());
      res.status(201).json({ category });
    } catch {
      res.status(409).json({ error: "Category already exists" });
    }
  });

  router.put("/:id", (req, res) => {
    const id = parseInt(req.params.id, 10);
    const { name } = req.body;

    if (!name || typeof name !== "string" || !name.trim()) {
      res.status(400).json({ error: "Name is required" });
      return;
    }

    try {
      const category = categoryService.update(
        id,
        req.householdId!,
        name.trim(),
      );
      if (!category) {
        res.status(404).json({ error: "Category not found" });
        return;
      }
      res.json({ category });
    } catch {
      res.status(409).json({ error: "Category name already exists" });
    }
  });

  router.delete("/:id", (req, res) => {
    const id = parseInt(req.params.id, 10);
    const result = categoryService.delete(id, req.householdId!);

    if (result.error === "conflict") {
      res
        .status(409)
        .json({ error: "Cannot delete: transactions reference this category" });
      return;
    }

    if (result.error === "not_found") {
      res.status(404).json({ error: "Category not found" });
      return;
    }

    res.status(204).send();
  });

  return router;
}
