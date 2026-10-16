import { eq, and } from "drizzle-orm";
import { type AppDatabase } from "../db/connection.js";
import { budgetCategories, transactions } from "../db/schema.js";

export function createCategoryService(db: AppDatabase) {
  return {
    getAll(householdId: number) {
      return db
        .select({
          id: budgetCategories.id,
          name: budgetCategories.name,
          groupName: budgetCategories.groupName,
          type: budgetCategories.type,
        })
        .from(budgetCategories)
        .where(eq(budgetCategories.householdId, householdId))
        .all();
    },

    create(householdId: number, name: string, groupName?: string, type?: "fixed" | "variable") {
      const result = db
        .insert(budgetCategories)
        .values({
          householdId,
          name,
          groupName: groupName ?? null,
          ...(type && { type }),
        })
        .returning({
          id: budgetCategories.id,
          name: budgetCategories.name,
          groupName: budgetCategories.groupName,
          type: budgetCategories.type,
        })
        .get();
      return result;
    },

    update(
      id: number,
      householdId: number,
      name: string,
      groupName?: string | null,
      type?: "fixed" | "variable",
    ) {
      const setValues: Record<string, unknown> = {
        name,
        updatedAt: new Date().toISOString(),
      };
      if (groupName !== undefined) {
        setValues.groupName = groupName;
      }
      if (type !== undefined) {
        setValues.type = type;
      }

      const result = db
        .update(budgetCategories)
        .set(setValues)
        .where(and(eq(budgetCategories.id, id), eq(budgetCategories.householdId, householdId)))
        .returning({
          id: budgetCategories.id,
          name: budgetCategories.name,
          groupName: budgetCategories.groupName,
          type: budgetCategories.type,
        })
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
        .where(and(eq(budgetCategories.id, id), eq(budgetCategories.householdId, householdId)))
        .returning()
        .get();

      return result ? { success: true as const } : { error: "not_found" as const };
    },
  };
}
