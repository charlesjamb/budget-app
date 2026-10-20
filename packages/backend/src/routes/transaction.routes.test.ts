import { describe, it, expect, beforeEach } from "vite-plus/test";
import request from "supertest";
import { eq } from "drizzle-orm";
import { budgetCategories, monthlyBudgets } from "../db/schema.js";
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

  describe("PATCH /api/transactions/:id/exclude", () => {
    it("should exclude a transaction with optional reason", async () => {
      const cat = createCategory(ctx.db, ctx.householdId, "Food");
      const tx = createTransaction(ctx.db, ctx.householdId, {
        dateOperation: "2026-02-13",
        budgetCategoryId: cat.id,
      });

      const res = await request(app)
        .patch(`/api/transactions/${tx.id}/exclude`)
        .set("Cookie", ctx.sessionCookie)
        .send({ excluded: true, reason: "Reimbursed by bank" });

      expect(res.status).toBe(200);
      expect(res.body.excluded).toBe(true);
      expect(res.body.excludedReason).toBe("Reimbursed by bank");
    });

    it("should un-exclude a transaction and clear reason", async () => {
      const tx = createTransaction(ctx.db, ctx.householdId, {
        dateOperation: "2026-02-13",
        excluded: 1,
        excludedReason: "Was reimbursed",
      });

      const res = await request(app)
        .patch(`/api/transactions/${tx.id}/exclude`)
        .set("Cookie", ctx.sessionCookie)
        .send({ excluded: false });

      expect(res.status).toBe(200);
      expect(res.body.excluded).toBe(false);
      expect(res.body.excludedReason).toBeNull();
    });

    it("should return 404 for non-existent transaction", async () => {
      const res = await request(app)
        .patch("/api/transactions/99999/exclude")
        .set("Cookie", ctx.sessionCookie)
        .send({ excluded: true });

      expect(res.status).toBe(404);
    });

    it("should return 400 for invalid body", async () => {
      const tx = createTransaction(ctx.db, ctx.householdId);

      const res = await request(app)
        .patch(`/api/transactions/${tx.id}/exclude`)
        .set("Cookie", ctx.sessionCookie)
        .send({ excluded: "yes" });

      expect(res.status).toBe(400);
    });
  });

  describe("PUT /api/transactions/:id/reimbursement", () => {
    it("should set reimbursement amount and note", async () => {
      const cat = createCategory(ctx.db, ctx.householdId, "Vet");
      const tx = createTransaction(ctx.db, ctx.householdId, {
        dateOperation: "2026-02-13",
        amount: 5000,
        budgetCategoryId: cat.id,
      });

      const res = await request(app)
        .put(`/api/transactions/${tx.id}/reimbursement`)
        .set("Cookie", ctx.sessionCookie)
        .send({ amount: 3000, note: "Insurance" });

      expect(res.status).toBe(200);
      expect(res.body.reimbursedAmount).toBe(3000);
      expect(res.body.reimbursementNote).toBe("Insurance");
    });

    it("should reject amount <= 0", async () => {
      const tx = createTransaction(ctx.db, ctx.householdId, {
        amount: 5000,
      });

      const res = await request(app)
        .put(`/api/transactions/${tx.id}/reimbursement`)
        .set("Cookie", ctx.sessionCookie)
        .send({ amount: 0 });

      expect(res.status).toBe(400);
    });

    it("should reject amount > transaction amount", async () => {
      const tx = createTransaction(ctx.db, ctx.householdId, {
        amount: 5000,
      });

      const res = await request(app)
        .put(`/api/transactions/${tx.id}/reimbursement`)
        .set("Cookie", ctx.sessionCookie)
        .send({ amount: 6000 });

      expect(res.status).toBe(400);
    });

    it("should return 404 for non-existent transaction", async () => {
      const res = await request(app)
        .put("/api/transactions/99999/reimbursement")
        .set("Cookie", ctx.sessionCookie)
        .send({ amount: 1000 });

      expect(res.status).toBe(404);
    });
  });

  describe("DELETE /api/transactions/:id/reimbursement", () => {
    it("should clear reimbursement", async () => {
      const tx = createTransaction(ctx.db, ctx.householdId, {
        amount: 5000,
        reimbursedAmount: 3000,
        reimbursementNote: "Insurance",
      });

      const res = await request(app)
        .delete(`/api/transactions/${tx.id}/reimbursement`)
        .set("Cookie", ctx.sessionCookie);

      expect(res.status).toBe(200);
      expect(res.body.reimbursedAmount).toBe(0);
      expect(res.body.reimbursementNote).toBeNull();
    });

    it("should return 404 for non-existent transaction", async () => {
      const res = await request(app)
        .delete("/api/transactions/99999/reimbursement")
        .set("Cookie", ctx.sessionCookie);

      expect(res.status).toBe(404);
    });
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

    it("should return reimbursement fields", async () => {
      createTransaction(ctx.db, ctx.householdId, {
        dateOperation: "2026-02-13",
        reimbursedAmount: 500,
        reimbursementNote: "Dog insurance",
      });

      const res = await request(app)
        .get("/api/transactions?month=2026-02")
        .set("Cookie", ctx.sessionCookie);

      expect(res.status).toBe(200);
      expect(res.body.transactions[0].reimbursedAmount).toBe(500);
      expect(res.body.transactions[0].reimbursementNote).toBe("Dog insurance");
    });

    it("should include excluded transactions with excluded flag", async () => {
      const tx = createTransaction(ctx.db, ctx.householdId, {
        dateOperation: "2026-02-13",
        excluded: 1,
        excludedReason: "Reimbursed",
      });

      const res = await request(app)
        .get("/api/transactions?month=2026-02")
        .set("Cookie", ctx.sessionCookie);

      expect(res.status).toBe(200);
      const found = res.body.transactions.find((t: { id: number }) => t.id === tx.id);
      expect(found).toBeDefined();
      expect(found.excluded).toBe(true);
      expect(found.excludedReason).toBe("Reimbursed");
    });
  });

  describe("GET /api/transactions/monthly-summary", () => {
    it("should include the category icon", async () => {
      const food = createCategory(ctx.db, ctx.householdId, "Food");
      ctx.db
        .update(budgetCategories)
        .set({ icon: "🥖" })
        .where(eq(budgetCategories.id, food.id))
        .run();
      createTransaction(ctx.db, ctx.householdId, {
        dateOperation: "2026-02-10",
        amount: 1500,
        budgetCategoryId: food.id,
      });

      const res = await request(app)
        .get("/api/transactions/monthly-summary?month=2026-02")
        .set("Cookie", ctx.sessionCookie);

      expect(res.body.categories[0].icon).toBe("🥖");
    });

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

      const foodCat = res.body.categories.find((c: { name: string }) => c.name === "Food");
      expect(foodCat.totalAmount).toBe(3500);
      expect(foodCat.transactionCount).toBe(2);

      expect(res.body.uncategorized.totalAmount).toBe(800);
      expect(res.body.uncategorized.transactionCount).toBe(1);
    });

    it("should exclude excluded transactions from summary", async () => {
      const food = createCategory(ctx.db, ctx.householdId, "Food");
      createTransaction(ctx.db, ctx.householdId, {
        dateOperation: "2026-02-10",
        amount: 1500,
        budgetCategoryId: food.id,
      });
      createTransaction(ctx.db, ctx.householdId, {
        dateOperation: "2026-02-15",
        amount: 2000,
        budgetCategoryId: food.id,
        excluded: 1,
      });

      const res = await request(app)
        .get("/api/transactions/monthly-summary?month=2026-02")
        .set("Cookie", ctx.sessionCookie);

      expect(res.status).toBe(200);
      expect(res.body.totalAmount).toBe(1500);
      const foodCat = res.body.categories.find((c: { name: string }) => c.name === "Food");
      expect(foodCat.totalAmount).toBe(1500);
      expect(foodCat.transactionCount).toBe(1);
    });

    it("should subtract reimbursedAmount from summary totals", async () => {
      const food = createCategory(ctx.db, ctx.householdId, "Food");
      createTransaction(ctx.db, ctx.householdId, {
        dateOperation: "2026-02-10",
        amount: 5000,
        budgetCategoryId: food.id,
        reimbursedAmount: 2000,
      });
      createTransaction(ctx.db, ctx.householdId, {
        dateOperation: "2026-02-15",
        amount: 1000,
        budgetCategoryId: null,
        reimbursedAmount: 300,
      });

      const res = await request(app)
        .get("/api/transactions/monthly-summary?month=2026-02")
        .set("Cookie", ctx.sessionCookie);

      expect(res.status).toBe(200);
      // Food: 5000 - 2000 = 3000, Uncategorized: 1000 - 300 = 700
      expect(res.body.totalAmount).toBe(3700);
      const foodCat = res.body.categories.find((c: { name: string }) => c.name === "Food");
      expect(foodCat.totalAmount).toBe(3000);
      expect(res.body.uncategorized.totalAmount).toBe(700);
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

    it("should exclude excluded transactions from history", async () => {
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
        excluded: 1,
      });

      const res = await request(app)
        .get("/api/transactions/history?from=2026-01&to=2026-02")
        .set("Cookie", ctx.sessionCookie);

      expect(res.status).toBe(200);
      expect(res.body.categories[0].amounts["2026-01"]).toBe(1000);
      expect(res.body.categories[0].amounts["2026-02"]).toBeUndefined();
    });
  });

  describe("GET /api/transactions/history budgets and totals", () => {
    it("should return planned budgets and per-month totals", async () => {
      const food = createCategory(ctx.db, ctx.householdId, "Food");
      createTransaction(ctx.db, ctx.householdId, {
        dateOperation: "2026-01-15",
        amount: 1000,
        budgetCategoryId: food.id,
      });
      createTransaction(ctx.db, ctx.householdId, {
        dateOperation: "2026-01-20",
        amount: 500,
        budgetCategoryId: food.id,
      });
      ctx.db
        .insert(monthlyBudgets)
        .values([
          {
            householdId: ctx.householdId,
            month: "2026-01",
            categoryId: food.id,
            amountCents: 3000,
          },
          { householdId: ctx.householdId, month: "2026-01", categoryId: 0, amountCents: 99999 },
        ])
        .run();

      const res = await request(app)
        .get("/api/transactions/history?from=2026-01&to=2026-02")
        .set("Cookie", ctx.sessionCookie);

      expect(res.status).toBe(200);
      expect(res.body.budgets).toEqual({ "2026-01": { [food.id]: 3000 } });
      expect(res.body.totals).toEqual({
        "2026-01": { spent: 1500, budget: 3000 },
        "2026-02": { spent: 0, budget: 0 },
      });
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

    it("should exclude excluded transactions from uncategorized groups", async () => {
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
        excluded: 1,
      });

      const res = await request(app)
        .get("/api/transactions/uncategorized-subcategories")
        .set("Cookie", ctx.sessionCookie);

      expect(res.status).toBe(200);
      const carrefour = res.body.subcategories.find(
        (s: { labelSimplified: string }) => s.labelSimplified === "CARREFOUR",
      );
      expect(carrefour.count).toBe(1);
      expect(carrefour.transactions).toHaveLength(1);
    });
  });

  describe("PATCH /api/transactions/:id/category", () => {
    it("should set the category and lock the transaction", async () => {
      const food = createCategory(ctx.db, ctx.householdId, "Food");
      const tx = createTransaction(ctx.db, ctx.householdId, { budgetCategoryId: null });

      const res = await request(app)
        .patch(`/api/transactions/${tx.id}/category`)
        .set("Cookie", ctx.sessionCookie)
        .send({ budgetCategoryId: food.id });

      expect(res.status).toBe(200);
      expect(res.body.budgetCategoryId).toBe(food.id);
      expect(res.body.budgetCategoryName).toBe("Food");
      expect(res.body.categoryLocked).toBe(true);
    });

    it("should leave other transactions of the same merchant untouched", async () => {
      const food = createCategory(ctx.db, ctx.householdId, "Food");
      const other = createTransaction(ctx.db, ctx.householdId, {
        labelSimplified: "SAME",
        budgetCategoryId: null,
      });
      const tx = createTransaction(ctx.db, ctx.householdId, { labelSimplified: "SAME" });

      await request(app)
        .patch(`/api/transactions/${tx.id}/category`)
        .set("Cookie", ctx.sessionCookie)
        .send({ budgetCategoryId: food.id });

      const res = await request(app)
        .get("/api/transactions?month=2026-02")
        .set("Cookie", ctx.sessionCookie);
      const untouched = res.body.transactions.find((t: { id: number }) => t.id === other.id);
      expect(untouched.budgetCategoryId).toBeNull();
      expect(untouched.categoryLocked).toBe(false);
    });

    it("should reject a category from another household", async () => {
      const tx = createTransaction(ctx.db, ctx.householdId);

      const res = await request(app)
        .patch(`/api/transactions/${tx.id}/category`)
        .set("Cookie", ctx.sessionCookie)
        .send({ budgetCategoryId: 9999 });

      expect(res.status).toBe(400);
    });

    it("should return 404 for an unknown transaction", async () => {
      const food = createCategory(ctx.db, ctx.householdId, "Food");

      const res = await request(app)
        .patch("/api/transactions/9999/category")
        .set("Cookie", ctx.sessionCookie)
        .send({ budgetCategoryId: food.id });

      expect(res.status).toBe(404);
    });

    it("should require a numeric budgetCategoryId", async () => {
      const tx = createTransaction(ctx.db, ctx.householdId);

      const res = await request(app)
        .patch(`/api/transactions/${tx.id}/category`)
        .set("Cookie", ctx.sessionCookie)
        .send({});

      expect(res.status).toBe(400);
    });

    it("should require auth", async () => {
      const res = await request(app).patch("/api/transactions/1/category").send({});
      expect(res.status).toBe(401);
    });
  });
});
