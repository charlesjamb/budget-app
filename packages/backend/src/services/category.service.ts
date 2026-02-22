import { eq, and } from "drizzle-orm";
import { type AppDatabase } from "../db/connection.js";
import { budgetCategories, transactions } from "../db/schema.js";

export function createCategoryService(db: AppDatabase) {
  return {
    getAll(householdId: number) {
      return db
        .select({ id: budgetCategories.id, name: budgetCategories.name })
        .from(budgetCategories)
        .where(eq(budgetCategories.householdId, householdId))
        .all();
    },

    create(householdId: number, name: string) {
      const result = db
        .insert(budgetCategories)
        .values({ householdId, name })
        .returning({ id: budgetCategories.id, name: budgetCategories.name })
        .get();
      return result;
    },

    update(id: number, householdId: number, name: string) {
      const result = db
        .update(budgetCategories)
        .set({ name, updatedAt: new Date().toISOString() })
        .where(
          and(
            eq(budgetCategories.id, id),
            eq(budgetCategories.householdId, householdId),
          ),
        )
        .returning({ id: budgetCategories.id, name: budgetCategories.name })
        .get();
      return result ?? null;
    },

    delete(id: number, householdId: number) {
      // Check if any transactions reference this category
      const txCount = db
        .select({ id: transactions.id })
        .from(transactions)
        .where(eq(transactions.budgetCategoryId, id))
        .all();

      if (txCount.length > 0) {
        return { error: "conflict" as const };
      }

      const result = db
        .delete(budgetCategories)
        .where(
          and(
            eq(budgetCategories.id, id),
            eq(budgetCategories.householdId, householdId),
          ),
        )
        .returning()
        .get();

      return result
        ? { success: true as const }
        : { error: "not_found" as const };
    },
  };
}
