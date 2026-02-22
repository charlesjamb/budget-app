import { describe, it, expect, beforeEach } from "vitest";
import request from "supertest";
import { createApp } from "../app.js";
import {
  setupTestContext,
  createCategory,
  type TestContext,
} from "../test/helpers.js";
import { mappingRules, transactions } from "../db/schema.js";

const SAMPLE_CSV = `Date de comptabilisation;Libelle simplifie;Libelle operation;Reference;Informations complementaires;Type operation;Categorie;Sous categorie;Debit;Credit;Date operation;Date de valeur;Pointage operation
14/02/2026;dr HOARAU sc;CB dr HOARAU sc FACT 130226;;;Carte bancaire;Sante;Consultation medicale;-35,00;;13/02/2026;16/02/2026;0
10/02/2026;CARREFOUR MARKET;CB CARREFOUR MARKE FACT 070226;;;Carte bancaire;Alimentation;Hyper/supermarche;-12,77;;07/02/2026;10/02/2026;0
09/02/2026;UBER EATS;CB UBER EATS FACT 060226;;;Carte bancaire;Alimentation;Restaurant;-28,20;;06/02/2026;09/02/2026;0`;

describe("Import Routes", () => {
  let ctx: TestContext;
  let app: ReturnType<typeof createApp>;

  beforeEach(async () => {
    ctx = await setupTestContext();
    app = createApp(ctx.db);
  });

  it("should import CSV and return summary", async () => {
    const res = await request(app)
      .post("/api/import")
      .set("Cookie", ctx.sessionCookie)
      .attach("file", Buffer.from(SAMPLE_CSV), "expenses.csv");

    expect(res.status).toBe(200);
    expect(res.body.imported).toBe(3);
    expect(res.body.skipped).toBe(0);
    expect(res.body.unmappedCount).toBe(3);
  });

  it("should deduplicate on re-import", async () => {
    // First import
    await request(app)
      .post("/api/import")
      .set("Cookie", ctx.sessionCookie)
      .attach("file", Buffer.from(SAMPLE_CSV), "expenses.csv");

    // Second import of same CSV
    const res = await request(app)
      .post("/api/import")
      .set("Cookie", ctx.sessionCookie)
      .attach("file", Buffer.from(SAMPLE_CSV), "expenses.csv");

    expect(res.body.imported).toBe(0);
    expect(res.body.skipped).toBe(3);
  });

  it("should apply mapping rules during import", async () => {
    const cat = createCategory(ctx.db, ctx.householdId, "Food");

    // Create mapping rule keyed on (sub-category, label)
    ctx.db
      .insert(mappingRules)
      .values({
        householdId: ctx.householdId,
        bankSubCategory: "Hyper/supermarche",
        labelSimplified: "CARREFOUR MARKET",
        budgetCategoryId: cat.id,
      })
      .run();

    const res = await request(app)
      .post("/api/import")
      .set("Cookie", ctx.sessionCookie)
      .attach("file", Buffer.from(SAMPLE_CSV), "expenses.csv");

    expect(res.body.imported).toBe(3);
    // 2 unmapped: "dr HOARAU sc" and "UBER EATS"
    expect(res.body.unmappedCount).toBe(2);

    // Verify mapped transaction has budget_category_id
    const txs = ctx.db.select().from(transactions).all();
    const mappedTx = txs.find(
      (t) =>
        t.bankSubCategory === "Hyper/supermarche" &&
        t.labelSimplified === "CARREFOUR MARKET",
    );
    expect(mappedTx?.budgetCategoryId).toBe(cat.id);
  });

  it("should reject request without file", async () => {
    const res = await request(app)
      .post("/api/import")
      .set("Cookie", ctx.sessionCookie);

    expect(res.status).toBe(400);
  });
});
