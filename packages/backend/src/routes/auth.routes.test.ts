import { describe, it, expect, beforeEach } from "vitest";
import request from "supertest";
import { createApp } from "../app.js";
import { setupTestContext, type TestContext } from "../test/helpers.js";

describe("Auth Routes", () => {
  let ctx: TestContext;
  let app: ReturnType<typeof createApp>;

  beforeEach(async () => {
    ctx = await setupTestContext();
    app = createApp(ctx.db);
  });

  describe("POST /api/auth/login", () => {
    it("should login with valid credentials", async () => {
      const res = await request(app)
        .post("/api/auth/login")
        .send({ email: "test@example.com", password: "password123" });

      expect(res.status).toBe(200);
      expect(res.body.user.email).toBe("test@example.com");
      expect(res.headers["set-cookie"]).toBeDefined();
    });

    it("should reject invalid credentials", async () => {
      const res = await request(app)
        .post("/api/auth/login")
        .send({ email: "test@example.com", password: "wrong" });

      expect(res.status).toBe(401);
    });

    it("should reject missing fields", async () => {
      const res = await request(app)
        .post("/api/auth/login")
        .send({ email: "test@example.com" });

      expect(res.status).toBe(400);
    });
  });

  describe("POST /api/auth/logout", () => {
    it("should clear session", async () => {
      const res = await request(app)
        .post("/api/auth/logout")
        .set("Cookie", ctx.sessionCookie);

      expect(res.status).toBe(204);
    });
  });

  describe("GET /api/auth/me", () => {
    it("should return current user", async () => {
      const res = await request(app)
        .get("/api/auth/me")
        .set("Cookie", ctx.sessionCookie);

      expect(res.status).toBe(200);
      expect(res.body.user.email).toBe("test@example.com");
      expect(res.body.householdId).toBe(1);
    });

    it("should return 401 without session", async () => {
      const res = await request(app).get("/api/auth/me");

      expect(res.status).toBe(401);
    });
  });
});
