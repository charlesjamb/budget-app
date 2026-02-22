import { describe, it, expect, beforeEach } from "vitest";
import request from "supertest";
import { createApp } from "../app.js";
import { setupTestContext, type TestContext } from "../test/helpers.js";

describe("Merchant Alias Routes", () => {
  let ctx: TestContext;
  let app: ReturnType<typeof createApp>;

  beforeEach(async () => {
    ctx = await setupTestContext();
    app = createApp(ctx.db);
  });

  it("should create and list aliases", async () => {
    const createRes = await request(app)
      .post("/api/merchant-aliases")
      .set("Cookie", ctx.sessionCookie)
      .send({
        originalLabel: "SARL CHEVALLIER",
        displayName: "Boulangerie Chevallier",
      });

    expect(createRes.status).toBe(201);
    expect(createRes.body.alias.displayName).toBe("Boulangerie Chevallier");

    const listRes = await request(app)
      .get("/api/merchant-aliases")
      .set("Cookie", ctx.sessionCookie);

    expect(listRes.body.aliases).toHaveLength(1);
  });

  it("should update an alias", async () => {
    const createRes = await request(app)
      .post("/api/merchant-aliases")
      .set("Cookie", ctx.sessionCookie)
      .send({
        originalLabel: "SARL CHEVALLIER",
        displayName: "Boulangerie Chevallier",
      });

    const res = await request(app)
      .put(`/api/merchant-aliases/${createRes.body.alias.id}`)
      .set("Cookie", ctx.sessionCookie)
      .send({ displayName: "Boulangerie" });

    expect(res.status).toBe(200);
    expect(res.body.alias.displayName).toBe("Boulangerie");
  });

  it("should delete an alias", async () => {
    const createRes = await request(app)
      .post("/api/merchant-aliases")
      .set("Cookie", ctx.sessionCookie)
      .send({
        originalLabel: "SARL CHEVALLIER",
        displayName: "Boulangerie Chevallier",
      });

    const res = await request(app)
      .delete(`/api/merchant-aliases/${createRes.body.alias.id}`)
      .set("Cookie", ctx.sessionCookie);

    expect(res.status).toBe(204);
  });

  it("should reject duplicate original label", async () => {
    await request(app)
      .post("/api/merchant-aliases")
      .set("Cookie", ctx.sessionCookie)
      .send({
        originalLabel: "SARL CHEVALLIER",
        displayName: "Boulangerie Chevallier",
      });

    const res = await request(app)
      .post("/api/merchant-aliases")
      .set("Cookie", ctx.sessionCookie)
      .send({
        originalLabel: "SARL CHEVALLIER",
        displayName: "Other",
      });

    expect(res.status).toBe(409);
  });
});
