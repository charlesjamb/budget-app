import { describe, it, expect, beforeEach } from "vite-plus/test";
import request from "supertest";
import bcrypt from "bcrypt";
import { createApp } from "../app.js";
import { setupTestContext, type TestContext } from "../test/helpers.js";
import { users, householdMembers } from "../db/schema.js";

describe("Contribution Routes", () => {
  let ctx: TestContext;
  let app: ReturnType<typeof createApp>;

  beforeEach(async () => {
    ctx = await setupTestContext();
    app = createApp(ctx.db);
  });

  describe("GET /api/contributions", () => {
    it("should return household members with 0 revenue when none set", async () => {
      const res = await request(app)
        .get("/api/contributions?month=2026-02")
        .set("Cookie", ctx.sessionCookie);

      expect(res.status).toBe(200);
      expect(res.body.month).toBe("2026-02");
      expect(res.body.members).toHaveLength(1);
      expect(res.body.members[0]).toEqual({
        userId: ctx.userId,
        email: "test@example.com",
        displayName: null,
        revenueCents: 0,
      });
    });

    it("should require month parameter", async () => {
      const res = await request(app).get("/api/contributions").set("Cookie", ctx.sessionCookie);

      expect(res.status).toBe(400);
    });

    it("should reject invalid month format", async () => {
      const res = await request(app)
        .get("/api/contributions?month=202602")
        .set("Cookie", ctx.sessionCookie);

      expect(res.status).toBe(400);
    });

    it("should require auth", async () => {
      const res = await request(app).get("/api/contributions?month=2026-02");
      expect(res.status).toBe(401);
    });

    it("should return members with stored revenues", async () => {
      await request(app)
        .put("/api/contributions")
        .set("Cookie", ctx.sessionCookie)
        .send({
          month: "2026-02",
          contributions: [{ userId: ctx.userId, revenueCents: 420000 }],
        });

      const res = await request(app)
        .get("/api/contributions?month=2026-02")
        .set("Cookie", ctx.sessionCookie);

      expect(res.status).toBe(200);
      expect(res.body.members[0].revenueCents).toBe(420000);
    });

    it("should return all household members including second user", async () => {
      const passwordHash = await bcrypt.hash("password123", 10);
      ctx.db.insert(users).values({ email: "other@example.com", passwordHash }).run();
      ctx.db.insert(householdMembers).values({ userId: 2, householdId: ctx.householdId }).run();

      const res = await request(app)
        .get("/api/contributions?month=2026-02")
        .set("Cookie", ctx.sessionCookie);

      expect(res.status).toBe(200);
      expect(res.body.members).toHaveLength(2);
    });
  });

  describe("PUT /api/contributions", () => {
    it("should upsert contributions", async () => {
      const res = await request(app)
        .put("/api/contributions")
        .set("Cookie", ctx.sessionCookie)
        .send({
          month: "2026-02",
          contributions: [{ userId: ctx.userId, revenueCents: 420000 }],
        });

      expect(res.status).toBe(200);
      expect(res.body.members).toHaveLength(1);
      expect(res.body.members[0].revenueCents).toBe(420000);
    });

    it("should update existing contribution", async () => {
      await request(app)
        .put("/api/contributions")
        .set("Cookie", ctx.sessionCookie)
        .send({
          month: "2026-02",
          contributions: [{ userId: ctx.userId, revenueCents: 420000 }],
        });

      const res = await request(app)
        .put("/api/contributions")
        .set("Cookie", ctx.sessionCookie)
        .send({
          month: "2026-02",
          contributions: [{ userId: ctx.userId, revenueCents: 500000 }],
        });

      expect(res.status).toBe(200);
      expect(res.body.members[0].revenueCents).toBe(500000);
    });

    it("should allow 0 revenue", async () => {
      const res = await request(app)
        .put("/api/contributions")
        .set("Cookie", ctx.sessionCookie)
        .send({
          month: "2026-02",
          contributions: [{ userId: ctx.userId, revenueCents: 0 }],
        });

      expect(res.status).toBe(200);
      expect(res.body.members[0].revenueCents).toBe(0);
    });

    it("should reject missing month", async () => {
      const res = await request(app)
        .put("/api/contributions")
        .set("Cookie", ctx.sessionCookie)
        .send({ contributions: [] });

      expect(res.status).toBe(400);
    });

    it("should reject missing contributions array", async () => {
      const res = await request(app)
        .put("/api/contributions")
        .set("Cookie", ctx.sessionCookie)
        .send({ month: "2026-02" });

      expect(res.status).toBe(400);
    });

    it("should reject negative revenueCents", async () => {
      const res = await request(app)
        .put("/api/contributions")
        .set("Cookie", ctx.sessionCookie)
        .send({
          month: "2026-02",
          contributions: [{ userId: ctx.userId, revenueCents: -100 }],
        });

      expect(res.status).toBe(400);
    });
  });
});
