import { describe, it, expect, beforeEach } from "vitest";
import request from "supertest";
import { createApp } from "../app.js";
import {
  setupTestContext,
  createCategory,
  type TestContext,
} from "../test/helpers.js";

describe("Budget Routes", () => {
  let ctx: TestContext;
  let app: ReturnType<typeof createApp>;

  beforeEach(async () => {
    ctx = await setupTestContext();
    app = createApp(ctx.db);
  });

  describe("GET /api/budgets", () => {
    it("should return empty budgets for a month", async () => {
      const res = await request(app)
        .get("/api/budgets?month=2026-02")
        .set("Cookie", ctx.sessionCookie);

      expect(res.status).toBe(200);
      expect(res.body.month).toBe("2026-02");
      expect(res.body.budgets).toEqual([]);
    });

    it("should require month parameter", async () => {
      const res = await request(app)
        .get("/api/budgets")
        .set("Cookie", ctx.sessionCookie);

      expect(res.status).toBe(400);
    });

    it("should reject invalid month format", async () => {
      const res = await request(app)
        .get("/api/budgets?month=202602")
        .set("Cookie", ctx.sessionCookie);

      expect(res.status).toBe(400);
    });

    it("should require auth", async () => {
      const res = await request(app).get("/api/budgets?month=2026-02");
      expect(res.status).toBe(401);
    });

    it("should return budgets after upsert", async () => {
      const cat = createCategory(ctx.db, ctx.householdId, "Food");

      await request(app)
        .put("/api/budgets")
        .set("Cookie", ctx.sessionCookie)
        .send({
          month: "2026-02",
          budgets: [{ categoryId: cat.id, amountCents: 50000 }],
        });

      const res = await request(app)
        .get("/api/budgets?month=2026-02")
        .set("Cookie", ctx.sessionCookie);

      expect(res.status).toBe(200);
      expect(res.body.budgets).toHaveLength(1);
      expect(res.body.budgets[0]).toEqual({
        categoryId: cat.id,
        amountCents: 50000,
      });
    });
  });

  describe("PUT /api/budgets", () => {
    it("should upsert budgets", async () => {
      const cat = createCategory(ctx.db, ctx.householdId, "Food");

      const res = await request(app)
        .put("/api/budgets")
        .set("Cookie", ctx.sessionCookie)
        .send({
          month: "2026-02",
          budgets: [{ categoryId: cat.id, amountCents: 30000 }],
        });

      expect(res.status).toBe(200);
      expect(res.body.budgets).toHaveLength(1);
      expect(res.body.budgets[0].amountCents).toBe(30000);
    });

    it("should update existing budget", async () => {
      const cat = createCategory(ctx.db, ctx.householdId, "Food");

      await request(app)
        .put("/api/budgets")
        .set("Cookie", ctx.sessionCookie)
        .send({
          month: "2026-02",
          budgets: [{ categoryId: cat.id, amountCents: 30000 }],
        });

      const res = await request(app)
        .put("/api/budgets")
        .set("Cookie", ctx.sessionCookie)
        .send({
          month: "2026-02",
          budgets: [{ categoryId: cat.id, amountCents: 50000 }],
        });

      expect(res.status).toBe(200);
      expect(res.body.budgets).toHaveLength(1);
      expect(res.body.budgets[0].amountCents).toBe(50000);
    });

    it("should delete budget when amountCents is 0", async () => {
      const cat = createCategory(ctx.db, ctx.householdId, "Food");

      await request(app)
        .put("/api/budgets")
        .set("Cookie", ctx.sessionCookie)
        .send({
          month: "2026-02",
          budgets: [{ categoryId: cat.id, amountCents: 30000 }],
        });

      const res = await request(app)
        .put("/api/budgets")
        .set("Cookie", ctx.sessionCookie)
        .send({
          month: "2026-02",
          budgets: [{ categoryId: cat.id, amountCents: 0 }],
        });

      expect(res.status).toBe(200);
      expect(res.body.budgets).toHaveLength(0);
    });

    it("should support global cap (categoryId 0)", async () => {
      const res = await request(app)
        .put("/api/budgets")
        .set("Cookie", ctx.sessionCookie)
        .send({
          month: "2026-02",
          budgets: [{ categoryId: 0, amountCents: 200000 }],
        });

      expect(res.status).toBe(200);
      expect(res.body.budgets).toHaveLength(1);
      expect(res.body.budgets[0]).toEqual({
        categoryId: 0,
        amountCents: 200000,
      });
    });

    it("should reject missing month", async () => {
      const res = await request(app)
        .put("/api/budgets")
        .set("Cookie", ctx.sessionCookie)
        .send({ budgets: [] });

      expect(res.status).toBe(400);
    });

    it("should reject missing budgets array", async () => {
      const res = await request(app)
        .put("/api/budgets")
        .set("Cookie", ctx.sessionCookie)
        .send({ month: "2026-02" });

      expect(res.status).toBe(400);
    });

    it("should reject negative amountCents", async () => {
      const res = await request(app)
        .put("/api/budgets")
        .set("Cookie", ctx.sessionCookie)
        .send({
          month: "2026-02",
          budgets: [{ categoryId: 1, amountCents: -100 }],
        });

      expect(res.status).toBe(400);
    });
  });

  describe("POST /api/budgets/copy", () => {
    it("should copy budgets from one month to another", async () => {
      const cat1 = createCategory(ctx.db, ctx.householdId, "Food");
      const cat2 = createCategory(ctx.db, ctx.householdId, "Transport");

      await request(app)
        .put("/api/budgets")
        .set("Cookie", ctx.sessionCookie)
        .send({
          month: "2026-01",
          budgets: [
            { categoryId: cat1.id, amountCents: 30000 },
            { categoryId: cat2.id, amountCents: 15000 },
            { categoryId: 0, amountCents: 200000 },
          ],
        });

      const copyRes = await request(app)
        .post("/api/budgets/copy")
        .set("Cookie", ctx.sessionCookie)
        .send({ sourceMonth: "2026-01", targetMonth: "2026-02" });

      expect(copyRes.status).toBe(200);
      expect(copyRes.body.copiedCount).toBe(3);

      const getRes = await request(app)
        .get("/api/budgets?month=2026-02")
        .set("Cookie", ctx.sessionCookie);

      expect(getRes.body.budgets).toHaveLength(3);
    });

    it("should reject same source and target month", async () => {
      const res = await request(app)
        .post("/api/budgets/copy")
        .set("Cookie", ctx.sessionCookie)
        .send({ sourceMonth: "2026-02", targetMonth: "2026-02" });

      expect(res.status).toBe(400);
    });

    it("should reject missing months", async () => {
      const res = await request(app)
        .post("/api/budgets/copy")
        .set("Cookie", ctx.sessionCookie)
        .send({});

      expect(res.status).toBe(400);
    });
  });
});
