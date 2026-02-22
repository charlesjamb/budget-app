import { describe, it, expect, beforeEach } from "vitest";
import request from "supertest";
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

      const listRes = await request(app)
        .get("/api/mapping-rules")
        .set("Cookie", ctx.sessionCookie);

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
});
