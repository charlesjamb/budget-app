import { eq, and, sql } from "drizzle-orm";
import { type AppDatabase } from "../db/connection.js";
import { monthlyBudgets } from "../db/schema.js";

export function createBudgetService(db: AppDatabase) {
  return {
    getByMonth(householdId: number, month: string) {
      return db
        .select({
          categoryId: monthlyBudgets.categoryId,
          amountCents: monthlyBudgets.amountCents,
        })
        .from(monthlyBudgets)
        .where(
          and(
            eq(monthlyBudgets.householdId, householdId),
            eq(monthlyBudgets.month, month),
          ),
        )
        .all();
    },

    upsert(
      householdId: number,
      month: string,
      categoryId: number,
      amountCents: number,
    ) {
      if (amountCents === 0) {
        db.delete(monthlyBudgets)
          .where(
            and(
              eq(monthlyBudgets.householdId, householdId),
              eq(monthlyBudgets.month, month),
              eq(monthlyBudgets.categoryId, categoryId),
            ),
          )
          .run();
        return null;
      }

      const result = db
        .insert(monthlyBudgets)
        .values({ householdId, month, categoryId, amountCents })
        .onConflictDoUpdate({
          target: [
            monthlyBudgets.householdId,
            monthlyBudgets.month,
            monthlyBudgets.categoryId,
          ],
          set: {
            amountCents,
            updatedAt: sql`datetime('now')`,
          },
        })
        .returning({
          categoryId: monthlyBudgets.categoryId,
          amountCents: monthlyBudgets.amountCents,
        })
        .get();

      return result;
    },

    upsertBulk(
      householdId: number,
      month: string,
      budgets: { categoryId: number; amountCents: number }[],
    ) {
      for (const b of budgets) {
        this.upsert(householdId, month, b.categoryId, b.amountCents);
      }
    },

    copyFromMonth(
      householdId: number,
      sourceMonth: string,
      targetMonth: string,
    ) {
      const sourceBudgets = this.getByMonth(householdId, sourceMonth);

      for (const b of sourceBudgets) {
        this.upsert(householdId, targetMonth, b.categoryId, b.amountCents);
      }

      return sourceBudgets.length;
    },
  };
}
