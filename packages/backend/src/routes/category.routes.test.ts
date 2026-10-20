import { describe, it, expect, beforeEach } from "vite-plus/test";
import request from "supertest";
import { createApp } from "../app.js";
import {
  setupTestContext,
  createCategory,
  createTransaction,
  type TestContext,
} from "../test/helpers.js";

describe("Category Routes", () => {
  let ctx: TestContext;
  let app: ReturnType<typeof createApp>;

  beforeEach(async () => {
    ctx = await setupTestContext();
    app = createApp(ctx.db);
  });

  describe("GET /api/categories", () => {
    it("should return empty list initially", async () => {
      const res = await request(app).get("/api/categories").set("Cookie", ctx.sessionCookie);

      expect(res.status).toBe(200);
      expect(res.body.categories).toEqual([]);
    });

    it("should return categories", async () => {
      createCategory(ctx.db, ctx.householdId, "Food");
      createCategory(ctx.db, ctx.householdId, "Transport");

      const res = await request(app).get("/api/categories").set("Cookie", ctx.sessionCookie);

      expect(res.status).toBe(200);
      expect(res.body.categories).toHaveLength(2);
    });

    it("should require auth", async () => {
      const res = await request(app).get("/api/categories");
      expect(res.status).toBe(401);
    });
  });

  describe("POST /api/categories", () => {
    it("should create a category", async () => {
      const res = await request(app)
        .post("/api/categories")
        .set("Cookie", ctx.sessionCookie)
        .send({ name: "Food" });

      expect(res.status).toBe(201);
      expect(res.body.category.name).toBe("Food");
    });

    it("should store an icon", async () => {
      const res = await request(app)
        .post("/api/categories")
        .set("Cookie", ctx.sessionCookie)
        .send({ name: "Food", icon: "🥖" });

      expect(res.status).toBe(201);
      expect(res.body.category.icon).toBe("🥖");
    });

    it("should default the icon to null", async () => {
      const res = await request(app)
        .post("/api/categories")
        .set("Cookie", ctx.sessionCookie)
        .send({ name: "Food" });

      expect(res.body.category.icon).toBeNull();
    });

    it("should reject duplicate names", async () => {
      createCategory(ctx.db, ctx.householdId, "Food");

      const res = await request(app)
        .post("/api/categories")
        .set("Cookie", ctx.sessionCookie)
        .send({ name: "Food" });

      expect(res.status).toBe(409);
    });

    it("should reject empty name", async () => {
      const res = await request(app)
        .post("/api/categories")
        .set("Cookie", ctx.sessionCookie)
        .send({ name: "" });

      expect(res.status).toBe(400);
    });

    it("should create a category with type fixed", async () => {
      const res = await request(app)
        .post("/api/categories")
        .set("Cookie", ctx.sessionCookie)
        .send({ name: "Rent", type: "fixed" });

      expect(res.status).toBe(201);
      expect(res.body.category.name).toBe("Rent");
      expect(res.body.category.type).toBe("fixed");
    });

    it("should default type to variable when not provided", async () => {
      const res = await request(app)
        .post("/api/categories")
        .set("Cookie", ctx.sessionCookie)
        .send({ name: "Groceries" });

      expect(res.status).toBe(201);
      expect(res.body.category.type).toBe("variable");
    });

    it("should reject invalid type", async () => {
      const res = await request(app)
        .post("/api/categories")
        .set("Cookie", ctx.sessionCookie)
        .send({ name: "Test", type: "invalid" });

      expect(res.status).toBe(400);
    });
  });

  describe("PUT /api/categories/:id", () => {
    it("should update a category", async () => {
      const cat = createCategory(ctx.db, ctx.householdId, "Food");

      const res = await request(app)
        .put(`/api/categories/${cat.id}`)
        .set("Cookie", ctx.sessionCookie)
        .send({ name: "Groceries" });

      expect(res.status).toBe(200);
      expect(res.body.category.name).toBe("Groceries");
    });

    it("should update and clear the icon", async () => {
      const cat = createCategory(ctx.db, ctx.householdId, "Food");

      const set = await request(app)
        .put(`/api/categories/${cat.id}`)
        .set("Cookie", ctx.sessionCookie)
        .send({ name: "Food", icon: "🥖" });
      expect(set.body.category.icon).toBe("🥖");

      const kept = await request(app)
        .put(`/api/categories/${cat.id}`)
        .set("Cookie", ctx.sessionCookie)
        .send({ name: "Food" });
      expect(kept.body.category.icon).toBe("🥖");

      const cleared = await request(app)
        .put(`/api/categories/${cat.id}`)
        .set("Cookie", ctx.sessionCookie)
        .send({ name: "Food", icon: "" });
      expect(cleared.body.category.icon).toBeNull();
    });

    it("should return 404 for non-existent category", async () => {
      const res = await request(app)
        .put("/api/categories/999")
        .set("Cookie", ctx.sessionCookie)
        .send({ name: "Test" });

      expect(res.status).toBe(404);
    });

    it("should update a category type", async () => {
      const cat = createCategory(ctx.db, ctx.householdId, "Food");

      const res = await request(app)
        .put(`/api/categories/${cat.id}`)
        .set("Cookie", ctx.sessionCookie)
        .send({ name: "Food", type: "fixed" });

      expect(res.status).toBe(200);
      expect(res.body.category.type).toBe("fixed");
    });
  });

  describe("DELETE /api/categories/:id", () => {
    it("should delete a category", async () => {
      const cat = createCategory(ctx.db, ctx.householdId, "Food");

      const res = await request(app)
        .delete(`/api/categories/${cat.id}`)
        .set("Cookie", ctx.sessionCookie);

      expect(res.status).toBe(204);
    });

    it("should reject deletion when transactions reference it", async () => {
      const cat = createCategory(ctx.db, ctx.householdId, "Food");
      createTransaction(ctx.db, ctx.householdId, {
        budgetCategoryId: cat.id,
      });

      const res = await request(app)
        .delete(`/api/categories/${cat.id}`)
        .set("Cookie", ctx.sessionCookie);

      expect(res.status).toBe(409);
    });
  });
});
