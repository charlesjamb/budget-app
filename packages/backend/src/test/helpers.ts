import bcrypt from "bcrypt";
import { v4 as uuidv4 } from "uuid";
import { createTestDb, type AppDatabase } from "../db/connection.js";
import {
  users,
  households,
  householdMembers,
  sessions,
  budgetCategories,
  transactions,
} from "../db/schema.js";

export interface TestContext {
  db: AppDatabase;
  userId: number;
  householdId: number;
  sessionId: string;
  sessionCookie: string;
}

export async function setupTestContext(): Promise<TestContext> {
  const db = createTestDb();

  // Create household
  db.insert(households).values({ name: "Test Household" }).run();

  // Create user
  const passwordHash = await bcrypt.hash("password123", 10);
  db.insert(users).values({ email: "test@example.com", passwordHash }).run();

  // Add user to household
  db.insert(householdMembers).values({ userId: 1, householdId: 1 }).run();

  // Create session
  const sessionId = uuidv4();
  const expiresAt = new Date(
    Date.now() + 7 * 24 * 60 * 60 * 1000,
  ).toISOString();
  db.insert(sessions).values({ id: sessionId, userId: 1, expiresAt }).run();

  return {
    db,
    userId: 1,
    householdId: 1,
    sessionId,
    sessionCookie: `session=${sessionId}`,
  };
}

export function createCategory(
  db: AppDatabase,
  householdId: number,
  name: string,
  type?: "fixed" | "variable",
) {
  return db
    .insert(budgetCategories)
    .values({ householdId, name, ...(type && { type }) })
    .returning()
    .get();
}

export function createTransaction(
  db: AppDatabase,
  householdId: number,
  overrides: Partial<typeof transactions.$inferInsert> = {},
) {
  return db
    .insert(transactions)
    .values({
      householdId,
      dateOperation: "2026-02-13",
      labelSimplified: "TEST",
      labelOperation: "CB TEST",
      amount: 1000,
      bankCategory: "Test",
      bankSubCategory: "Test sub",
      operationType: "Carte bancaire",
      dedupHash: uuidv4(),
      ...overrides,
    })
    .returning()
    .get();
}
