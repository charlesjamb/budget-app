import express from "express";
import cookieParser from "cookie-parser";
import path from "path";
import { fileURLToPath } from "url";
import { type AppDatabase } from "./db/connection.js";
import { authRoutes } from "./routes/auth.routes.js";
import { categoryRoutes } from "./routes/category.routes.js";
import { importRoutes } from "./routes/import.routes.js";
import { mappingRuleRoutes } from "./routes/mapping-rule.routes.js";
import { transactionRoutes } from "./routes/transaction.routes.js";
import { merchantAliasRoutes } from "./routes/merchant-alias.routes.js";
import { authMiddleware } from "./middleware/auth.js";

export function createApp(db: AppDatabase) {
  const app = express();

  app.use(express.json());
  app.use(cookieParser());

  // Public routes
  app.use("/api/auth", authRoutes(db));

  // Protected routes
  app.use("/api/categories", authMiddleware(db), categoryRoutes(db));
  app.use("/api/import", authMiddleware(db), importRoutes(db));
  app.use("/api/mapping-rules", authMiddleware(db), mappingRuleRoutes(db));
  app.use("/api/transactions", authMiddleware(db), transactionRoutes(db));
  app.use("/api/merchant-aliases", authMiddleware(db), merchantAliasRoutes(db));

  // Serve frontend in production
  if (process.env.NODE_ENV === "production") {
    const __dirname = path.dirname(fileURLToPath(import.meta.url));
    const frontendDist = path.join(__dirname, "../../frontend/dist");
    app.use(express.static(frontendDist));
    app.get("*", (_req, res) => {
      res.sendFile(path.join(frontendDist, "index.html"));
    });
  }

  return app;
}
