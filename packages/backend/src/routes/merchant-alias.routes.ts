import { Router } from "express";
import { type AppDatabase } from "../db/connection.js";
import { createMerchantAliasService } from "../services/merchant-alias.service.js";

export function merchantAliasRoutes(db: AppDatabase): Router {
  const router = Router();
  const merchantAliasService = createMerchantAliasService(db);

  router.get("/", (req, res) => {
    const aliases = merchantAliasService.getAll(req.householdId!);
    res.json({ aliases });
  });

  router.post("/", (req, res) => {
    const { originalLabel, displayName } = req.body;

    if (!originalLabel || !displayName) {
      res.status(400).json({ error: "originalLabel and displayName are required" });
      return;
    }

    try {
      const alias = merchantAliasService.create(req.householdId!, originalLabel, displayName);
      res.status(201).json({ alias });
    } catch {
      res.status(409).json({ error: "Alias already exists for this label" });
    }
  });

  router.put("/:id", (req, res) => {
    const id = parseInt(req.params.id, 10);
    const { displayName } = req.body;

    if (!displayName) {
      res.status(400).json({ error: "displayName is required" });
      return;
    }

    const alias = merchantAliasService.update(id, req.householdId!, displayName);
    if (!alias) {
      res.status(404).json({ error: "Alias not found" });
      return;
    }

    res.json({ alias });
  });

  router.delete("/:id", (req, res) => {
    const id = parseInt(req.params.id, 10);
    const deleted = merchantAliasService.delete(id, req.householdId!);

    if (!deleted) {
      res.status(404).json({ error: "Alias not found" });
      return;
    }

    res.status(204).send();
  });

  return router;
}
