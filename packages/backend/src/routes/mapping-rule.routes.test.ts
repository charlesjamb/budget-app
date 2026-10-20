import { describe, it, expect, beforeEach } from "vite-plus/test";
import request from "supertest";
import { eq } from "drizzle-orm";
import { transactions } from "../db/schema.js";
import { createApp } from "../app.js";
import {
  setupTestContext,
  createCategory,
  createTransaction,
  type TestContext,
} from "../test/helpers.js";

describe("Mapping Rule Routes", () => {
  let ctx: TestContext;
  let app: ReturnType<typeof createApp>;

  beforeEach(async () => {
    ctx = await setupTestContext();
    app = createApp(ctx.db);
  });

  describe("CRUD", () => {
    it("should create and list rules", async () => {
      const cat = createCategory(ctx.db, ctx.householdId, "Food");

      const createRes = await request(app)
        .post("/api/mapping-rules")
        .set("Cookie", ctx.sessionCookie)
        .send({
          bankSubCategory: "Hyper/supermarche",
          labelSimplified: "CARREFOUR MARKET",
          budgetCategoryId: cat.id,
        });

      expect(createRes.status).toBe(201);

      const listRes = await request(app).get("/api/mapping-rules").set("Cookie", ctx.sessionCookie);

      expect(listRes.body.rules).toHaveLength(1);
      expect(listRes.body.rules[0].bankSubCategory).toBe("Hyper/supermarche");
      expect(listRes.body.rules[0].labelSimplified).toBe("CARREFOUR MARKET");
      expect(listRes.body.rules[0].budgetCategoryName).toBe("Food");
    });

    it("should update a rule", async () => {
      const cat1 = createCategory(ctx.db, ctx.householdId, "Food");
      const cat2 = createCategory(ctx.db, ctx.householdId, "Groceries");

      const createRes = await request(app)
        .post("/api/mapping-rules")
        .set("Cookie", ctx.sessionCookie)
        .send({
          bankSubCategory: "Hyper/supermarche",
          labelSimplified: "CARREFOUR",
          budgetCategoryId: cat1.id,
        });

      const res = await request(app)
        .put(`/api/mapping-rules/${createRes.body.rule.id}`)
        .set("Cookie", ctx.sessionCookie)
        .send({ budgetCategoryId: cat2.id });

      expect(res.status).toBe(200);
      expect(res.body.rule.budgetCategoryId).toBe(cat2.id);
    });

    it("should delete a rule", async () => {
      const cat = createCategory(ctx.db, ctx.householdId, "Food");

      const createRes = await request(app)
        .post("/api/mapping-rules")
        .set("Cookie", ctx.sessionCookie)
        .send({
          bankSubCategory: "Hyper/supermarche",
          labelSimplified: "CARREFOUR",
          budgetCategoryId: cat.id,
        });

      const res = await request(app)
        .delete(`/api/mapping-rules/${createRes.body.rule.id}`)
        .set("Cookie", ctx.sessionCookie);

      expect(res.status).toBe(204);
    });

    it("should uncategorize matching transactions when deleting a rule", async () => {
      const food = createCategory(ctx.db, ctx.householdId, "Food");
      const dining = createCategory(ctx.db, ctx.householdId, "Dining");

      // Classify two CARREFOUR transactions as Food
      createTransaction(ctx.db, ctx.householdId, {
        bankSubCategory: "Hyper/supermarche",
        labelSimplified: "CARREFOUR MARKET",
        budgetCategoryId: null,
      });
      createTransaction(ctx.db, ctx.householdId, {
        bankSubCategory: "Hyper/supermarche",
        labelSimplified: "CARREFOUR MARKET",
        budgetCategoryId: null,
      });
      // A transaction with a different rule (should not be affected)
      createTransaction(ctx.db, ctx.householdId, {
        bankSubCategory: "Restaurant",
        labelSimplified: "UBER EATS",
        budgetCategoryId: dining.id,
      });

      const classifyRes = await request(app)
        .post("/api/mapping-rules/classify")
        .set("Cookie", ctx.sessionCookie)
        .send({
          bankSubCategory: "Hyper/supermarche",
          labelSimplified: "CARREFOUR MARKET",
          budgetCategoryId: food.id,
        });

      expect(classifyRes.body.updatedCount).toBe(2);

      // No uncategorized transactions for this group
      const beforeDelete = await request(app)
        .get("/api/transactions/uncategorized-subcategories")
        .set("Cookie", ctx.sessionCookie);

      const carrefourBefore = beforeDelete.body.subcategories.find(
        (g: { labelSimplified: string }) => g.labelSimplified === "CARREFOUR MARKET",
      );
      expect(carrefourBefore).toBeUndefined();

      // Delete the rule
      const deleteRes = await request(app)
        .delete(`/api/mapping-rules/${classifyRes.body.rule.id}`)
        .set("Cookie", ctx.sessionCookie);

      expect(deleteRes.status).toBe(204);

      // Transactions should now be uncategorized again
      const afterDelete = await request(app)
        .get("/api/transactions/uncategorized-subcategories")
        .set("Cookie", ctx.sessionCookie);

      const carrefourAfter = afterDelete.body.subcategories.find(
        (g: { labelSimplified: string }) => g.labelSimplified === "CARREFOUR MARKET",
      );
      expect(carrefourAfter).toBeDefined();
      expect(carrefourAfter.count).toBe(2);

      // UBER EATS should still be categorized (not affected by the delete)
      const uberAfter = afterDelete.body.subcategories.find(
        (g: { labelSimplified: string }) => g.labelSimplified === "UBER EATS",
      );
      expect(uberAfter).toBeUndefined();
    });
  });

  describe("POST /api/mapping-rules/classify", () => {
    it("should create rule and retroactively apply matching transactions only", async () => {
      const cat = createCategory(ctx.db, ctx.householdId, "Food");

      // Same sub-category, different labels
      createTransaction(ctx.db, ctx.householdId, {
        bankSubCategory: "Hyper/supermarche",
        labelSimplified: "CARREFOUR MARKET",
        budgetCategoryId: null,
      });
      createTransaction(ctx.db, ctx.householdId, {
        bankSubCategory: "Hyper/supermarche",
        labelSimplified: "CARREFOUR MARKET",
        budgetCategoryId: null,
      });
      createTransaction(ctx.db, ctx.householdId, {
        bankSubCategory: "Hyper/supermarche",
        labelSimplified: "ESPRIT THAI",
        budgetCategoryId: null,
      });
      createTransaction(ctx.db, ctx.householdId, {
        bankSubCategory: "Restaurant",
        labelSimplified: "UBER EATS",
        budgetCategoryId: null,
      });

      const res = await request(app)
        .post("/api/mapping-rules/classify")
        .set("Cookie", ctx.sessionCookie)
        .send({
          bankSubCategory: "Hyper/supermarche",
          labelSimplified: "CARREFOUR MARKET",
          budgetCategoryId: cat.id,
        });

      expect(res.status).toBe(200);
      expect(res.body.rule.bankSubCategory).toBe("Hyper/supermarche");
      expect(res.body.rule.labelSimplified).toBe("CARREFOUR MARKET");
      // Only the 2 CARREFOUR MARKET transactions, not ESPRIT THAI
      expect(res.body.updatedCount).toBe(2);
    });
  });

  describe("manual category overrides", () => {
    const rule = { bankSubCategory: "Hyper/supermarche", labelSimplified: "CARREFOUR MARKET" };

    it("classify should re-apply the rule to unlocked transactions already categorized", async () => {
      const food = createCategory(ctx.db, ctx.householdId, "Food");
      const fun = createCategory(ctx.db, ctx.householdId, "Fun");
      const tx = createTransaction(ctx.db, ctx.householdId, {
        ...rule,
        budgetCategoryId: food.id,
      });

      const res = await request(app)
        .post("/api/mapping-rules/classify")
        .set("Cookie", ctx.sessionCookie)
        .send({ ...rule, budgetCategoryId: fun.id });

      expect(res.body.updatedCount).toBe(1);
      const row = ctx.db.select().from(transactions).where(eq(transactions.id, tx.id)).get();
      expect(row?.budgetCategoryId).toBe(fun.id);
    });

    it("classify should skip locked transactions", async () => {
      const food = createCategory(ctx.db, ctx.householdId, "Food");
      const fun = createCategory(ctx.db, ctx.householdId, "Fun");
      const locked = createTransaction(ctx.db, ctx.householdId, {
        ...rule,
        budgetCategoryId: food.id,
        categoryLocked: 1,
      });
      const unlocked = createTransaction(ctx.db, ctx.householdId, {
        ...rule,
        budgetCategoryId: food.id,
      });

      const res = await request(app)
        .post("/api/mapping-rules/classify")
        .set("Cookie", ctx.sessionCookie)
        .send({ ...rule, budgetCategoryId: fun.id });

      expect(res.body.updatedCount).toBe(1);
      const rows = ctx.db.select().from(transactions).all();
      expect(rows.find((r) => r.id === locked.id)?.budgetCategoryId).toBe(food.id);
      expect(rows.find((r) => r.id === unlocked.id)?.budgetCategoryId).toBe(fun.id);
    });

    it("deleting a rule should keep locked transactions categorized", async () => {
      const food = createCategory(ctx.db, ctx.householdId, "Food");
      const created = await request(app)
        .post("/api/mapping-rules")
        .set("Cookie", ctx.sessionCookie)
        .send({ ...rule, budgetCategoryId: food.id });
      const locked = createTransaction(ctx.db, ctx.householdId, {
        ...rule,
        budgetCategoryId: food.id,
        categoryLocked: 1,
      });
      const unlocked = createTransaction(ctx.db, ctx.householdId, {
        ...rule,
        budgetCategoryId: food.id,
      });

      await request(app)
        .delete(`/api/mapping-rules/${created.body.rule.id}`)
        .set("Cookie", ctx.sessionCookie);

      const rows = ctx.db.select().from(transactions).all();
      expect(rows.find((r) => r.id === locked.id)?.budgetCategoryId).toBe(food.id);
      expect(rows.find((r) => r.id === unlocked.id)?.budgetCategoryId).toBeNull();
    });
  });
});
