import { describe, it, expect, beforeEach } from "vitest";
import request from "supertest";
import { createApp } from "../app.js";
import {
  setupTestContext,
  createCategory,
  createTransaction,
  type TestContext,
} from "../test/helpers.js";

describe("Transaction Routes", () => {
  let ctx: TestContext;
  let app: ReturnType<typeof createApp>;

  beforeEach(async () => {
    ctx = await setupTestContext();
    app = createApp(ctx.db);
  });

  describe("GET /api/transactions", () => {
    it("should return transactions for a month", async () => {
      const cat = createCategory(ctx.db, ctx.householdId, "Food");
      createTransaction(ctx.db, ctx.householdId, {
        dateOperation: "2026-02-13",
        budgetCategoryId: cat.id,
      });
      createTransaction(ctx.db, ctx.householdId, {
        dateOperation: "2026-02-14",
      });
      createTransaction(ctx.db, ctx.householdId, {
        dateOperation: "2026-03-01",
      });

      const res = await request(app)
        .get("/api/transactions?month=2026-02")
        .set("Cookie", ctx.sessionCookie);

      expect(res.status).toBe(200);
      expect(res.body.transactions).toHaveLength(2);
    });

    it("should reject invalid month format", async () => {
      const res = await request(app)
        .get("/api/transactions?month=2026")
        .set("Cookie", ctx.sessionCookie);

      expect(res.status).toBe(400);
    });
  });

  describe("GET /api/transactions/monthly-summary", () => {
    it("should return monthly summary grouped by category", async () => {
      const food = createCategory(ctx.db, ctx.householdId, "Food");
      const transport = createCategory(ctx.db, ctx.householdId, "Transport");

      createTransaction(ctx.db, ctx.householdId, {
        dateOperation: "2026-02-10",
        amount: 1500,
        budgetCategoryId: food.id,
      });
      createTransaction(ctx.db, ctx.householdId, {
        dateOperation: "2026-02-15",
        amount: 2000,
        budgetCategoryId: food.id,
      });
      createTransaction(ctx.db, ctx.householdId, {
        dateOperation: "2026-02-20",
        amount: 500,
        budgetCategoryId: transport.id,
      });
      createTransaction(ctx.db, ctx.householdId, {
        dateOperation: "2026-02-20",
        amount: 800,
        budgetCategoryId: null,
      });

      const res = await request(app)
        .get("/api/transactions/monthly-summary?month=2026-02")
        .set("Cookie", ctx.sessionCookie);

      expect(res.status).toBe(200);
      expect(res.body.month).toBe("2026-02");
      expect(res.body.totalAmount).toBe(4800);
      expect(res.body.categories).toHaveLength(2);

      const foodCat = res.body.categories.find(
        (c: { name: string }) => c.name === "Food",
      );
      expect(foodCat.totalAmount).toBe(3500);
      expect(foodCat.transactionCount).toBe(2);

      expect(res.body.uncategorized.totalAmount).toBe(800);
      expect(res.body.uncategorized.transactionCount).toBe(1);
    });

    it("should compute globalBudgetCents from sum of per-category budgets", async () => {
      const food = createCategory(ctx.db, ctx.householdId, "Food");
      const transport = createCategory(ctx.db, ctx.householdId, "Transport");

      createTransaction(ctx.db, ctx.householdId, {
        dateOperation: "2026-02-10",
        amount: 1500,
        budgetCategoryId: food.id,
      });
      createTransaction(ctx.db, ctx.householdId, {
        dateOperation: "2026-02-15",
        amount: 500,
        budgetCategoryId: transport.id,
      });

      await request(app)
        .put("/api/budgets")
        .set("Cookie", ctx.sessionCookie)
        .send({
          month: "2026-02",
          budgets: [
            { categoryId: 0, amountCents: 999999 },
            { categoryId: food.id, amountCents: 50000 },
            { categoryId: transport.id, amountCents: 30000 },
          ],
        });

      const res = await request(app)
        .get("/api/transactions/monthly-summary?month=2026-02")
        .set("Cookie", ctx.sessionCookie);

      expect(res.status).toBe(200);
      expect(res.body.globalBudgetCents).toBe(80000);
    });
  });

  describe("GET /api/transactions/history", () => {
    it("should return history data pivoted by month", async () => {
      const food = createCategory(ctx.db, ctx.householdId, "Food");

      createTransaction(ctx.db, ctx.householdId, {
        dateOperation: "2026-01-15",
        amount: 1000,
        budgetCategoryId: food.id,
      });
      createTransaction(ctx.db, ctx.householdId, {
        dateOperation: "2026-02-15",
        amount: 2000,
        budgetCategoryId: food.id,
      });

      const res = await request(app)
        .get("/api/transactions/history?from=2026-01&to=2026-02")
        .set("Cookie", ctx.sessionCookie);

      expect(res.status).toBe(200);
      expect(res.body.months).toEqual(["2026-01", "2026-02"]);
      expect(res.body.categories).toHaveLength(1);
      expect(res.body.categories[0].name).toBe("Food");
      expect(res.body.categories[0].amounts["2026-01"]).toBe(1000);
      expect(res.body.categories[0].amounts["2026-02"]).toBe(2000);
    });
  });

  describe("GET /api/transactions/uncategorized-subcategories", () => {
    it("should group by (sub-category, label) pair with transactions", async () => {
      createTransaction(ctx.db, ctx.householdId, {
        bankSubCategory: "Hyper/supermarche",
        labelSimplified: "CARREFOUR",
        amount: 1277,
        budgetCategoryId: null,
      });
      createTransaction(ctx.db, ctx.householdId, {
        bankSubCategory: "Hyper/supermarche",
        labelSimplified: "CARREFOUR",
        amount: 900,
        budgetCategoryId: null,
      });
      createTransaction(ctx.db, ctx.householdId, {
        bankSubCategory: "Hyper/supermarche",
        labelSimplified: "ESPRIT THAI",
        amount: 1730,
        budgetCategoryId: null,
      });
      createTransaction(ctx.db, ctx.householdId, {
        bankSubCategory: "Restaurant",
        labelSimplified: "UBER EATS",
        amount: 2820,
        budgetCategoryId: null,
      });

      const res = await request(app)
        .get("/api/transactions/uncategorized-subcategories")
        .set("Cookie", ctx.sessionCookie);

      expect(res.status).toBe(200);
      // 3 groups: (Hyper/supermarche, CARREFOUR), (Hyper/supermarche, ESPRIT THAI), (Restaurant, UBER EATS)
      expect(res.body.subcategories).toHaveLength(3);

      const carrefour = res.body.subcategories.find(
        (s: { labelSimplified: string }) => s.labelSimplified === "CARREFOUR",
      );
      expect(carrefour.bankSubCategory).toBe("Hyper/supermarche");
      expect(carrefour.count).toBe(2);
      expect(carrefour.transactions).toHaveLength(2);

      const esprit = res.body.subcategories.find(
        (s: { labelSimplified: string }) => s.labelSimplified === "ESPRIT THAI",
      );
      expect(esprit.bankSubCategory).toBe("Hyper/supermarche");
      expect(esprit.count).toBe(1);

      const uber = res.body.subcategories.find(
        (s: { labelSimplified: string }) => s.labelSimplified === "UBER EATS",
      );
      expect(uber.bankSubCategory).toBe("Restaurant");
      expect(uber.count).toBe(1);
    });
  });
});
