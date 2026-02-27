import { Router } from "express";
import multer from "multer";
import { type AppDatabase } from "../db/connection.js";
import { createImportService } from "../services/import.service.js";

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
});

export function importRoutes(db: AppDatabase): Router {
  const router = Router();
  const importService = createImportService(db);

  router.post("/", upload.single("file"), (req, res) => {
    if (!req.file) {
      res.status(400).json({ error: "No file uploaded" });
      return;
    }

    const csvContent = req.file.buffer.toString("utf-8");
    const result = importService.importCsv(req.householdId!, csvContent);

    res.json(result);
  });

  return router;
}
