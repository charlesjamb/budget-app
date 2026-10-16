import { describe, it, expect, beforeEach } from "vite-plus/test";
import { createTestDb, type AppDatabase } from "./connection.js";
import {
  users,
  households,
  householdMembers,
  sessions,
  budgetCategories,
  transactions,
  mappingRules,
  merchantAliases,
} from "./schema.js";
import { eq } from "drizzle-orm";

describe("Database Schema", () => {
  let db: AppDatabase;

  beforeEach(() => {
    db = createTestDb();
  });

  it("should create and query users", () => {
    db.insert(users).values({ email: "test@example.com", passwordHash: "hash123" }).run();

    const result = db.select().from(users).all();
    expect(result).toHaveLength(1);
    expect(result[0].email).toBe("test@example.com");
    expect(result[0].id).toBe(1);
  });

  it("should enforce unique email on users", () => {
    db.insert(users).values({ email: "test@example.com", passwordHash: "hash" }).run();

    expect(() =>
      db.insert(users).values({ email: "test@example.com", passwordHash: "hash2" }).run(),
    ).toThrow();
  });

  it("should create households and members", () => {
    db.insert(users).values({ email: "user@test.com", passwordHash: "hash" }).run();
    db.insert(households).values({ name: "Test Household" }).run();
    db.insert(householdMembers).values({ userId: 1, householdId: 1 }).run();

    const members = db.select().from(householdMembers).all();
    expect(members).toHaveLength(1);
    expect(members[0].userId).toBe(1);
    expect(members[0].householdId).toBe(1);
  });

  it("should create sessions", () => {
    db.insert(users).values({ email: "user@test.com", passwordHash: "hash" }).run();
    db.insert(sessions)
      .values({
        id: "session-uuid",
        userId: 1,
        expiresAt: "2026-12-31T00:00:00Z",
      })
      .run();

    const result = db.select().from(sessions).where(eq(sessions.id, "session-uuid")).all();
    expect(result).toHaveLength(1);
    expect(result[0].userId).toBe(1);
  });

  it("should create budget categories with unique constraint", () => {
    db.insert(households).values({ name: "Household" }).run();
    db.insert(budgetCategories).values({ householdId: 1, name: "Food" }).run();

    const cats = db.select().from(budgetCategories).all();
    expect(cats).toHaveLength(1);
    expect(cats[0].name).toBe("Food");

    expect(() =>
      db.insert(budgetCategories).values({ householdId: 1, name: "Food" }).run(),
    ).toThrow();
  });

  it("should create transactions with dedup hash", () => {
    db.insert(households).values({ name: "Household" }).run();
    db.insert(transactions)
      .values({
        householdId: 1,
        dateOperation: "2026-02-13",
        labelSimplified: "CARREFOUR",
        labelOperation: "CB CARREFOUR",
        amount: 1277,
        bankCategory: "Alimentation",
        bankSubCategory: "Hyper/supermarche",
        operationType: "Carte bancaire",
        dedupHash: "abc123",
      })
      .run();

    const txs = db.select().from(transactions).all();
    expect(txs).toHaveLength(1);
    expect(txs[0].amount).toBe(1277);

    expect(() =>
      db
        .insert(transactions)
        .values({
          householdId: 1,
          dateOperation: "2026-02-13",
          labelSimplified: "CARREFOUR",
          labelOperation: "CB CARREFOUR",
          amount: 1277,
          bankCategory: "Alimentation",
          bankSubCategory: "Hyper/supermarche",
          operationType: "Carte bancaire",
          dedupHash: "abc123",
        })
        .run(),
    ).toThrow();
  });

  it("should create mapping rules with unique constraint on (sub_category, label)", () => {
    db.insert(households).values({ name: "Household" }).run();
    db.insert(budgetCategories).values({ householdId: 1, name: "Food" }).run();
    db.insert(mappingRules)
      .values({
        householdId: 1,
        bankSubCategory: "Hyper/supermarche",
        labelSimplified: "CARREFOUR",
        budgetCategoryId: 1,
      })
      .run();

    // Same sub-category but different label is allowed
    db.insert(mappingRules)
      .values({
        householdId: 1,
        bankSubCategory: "Hyper/supermarche",
        labelSimplified: "ESPRIT THAI",
        budgetCategoryId: 1,
      })
      .run();

    const rules = db.select().from(mappingRules).all();
    expect(rules).toHaveLength(2);

    // Same sub-category AND same label should fail
    expect(() =>
      db
        .insert(mappingRules)
        .values({
          householdId: 1,
          bankSubCategory: "Hyper/supermarche",
          labelSimplified: "CARREFOUR",
          budgetCategoryId: 1,
        })
        .run(),
    ).toThrow();
  });

  it("should create merchant aliases with unique constraint", () => {
    db.insert(households).values({ name: "Household" }).run();
    db.insert(merchantAliases)
      .values({
        householdId: 1,
        originalLabel: "SARL CHEVALLIER",
        displayName: "Boulangerie Chevallier",
      })
      .run();

    const aliases = db.select().from(merchantAliases).all();
    expect(aliases).toHaveLength(1);
    expect(aliases[0].displayName).toBe("Boulangerie Chevallier");

    expect(() =>
      db
        .insert(merchantAliases)
        .values({
          householdId: 1,
          originalLabel: "SARL CHEVALLIER",
          displayName: "Other",
        })
        .run(),
    ).toThrow();
  });
});
