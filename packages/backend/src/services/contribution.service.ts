import { eq, and, sql } from "drizzle-orm";
import { type AppDatabase } from "../db/connection.js";
import { householdMembers, users, monthlyContributions } from "../db/schema.js";

export function createContributionService(db: AppDatabase) {
  return {
    getByMonth(householdId: number, month: string) {
      const members = db
        .select({
          userId: users.id,
          email: users.email,
          revenueCents: sql<number>`COALESCE(${monthlyContributions.revenueCents}, 0)`,
        })
        .from(householdMembers)
        .innerJoin(users, eq(householdMembers.userId, users.id))
        .leftJoin(
          monthlyContributions,
          and(
            eq(householdMembers.householdId, monthlyContributions.householdId),
            eq(householdMembers.userId, monthlyContributions.userId),
            eq(monthlyContributions.month, month),
          ),
        )
        .where(eq(householdMembers.householdId, householdId))
        .all();

      return members.map((m) => ({
        userId: m.userId,
        email: m.email,
        revenueCents: Number(m.revenueCents),
      }));
    },

    upsert(householdId: number, month: string, userId: number, revenueCents: number) {
      const result = db
        .insert(monthlyContributions)
        .values({ householdId, month, userId, revenueCents })
        .onConflictDoUpdate({
          target: [
            monthlyContributions.householdId,
            monthlyContributions.month,
            monthlyContributions.userId,
          ],
          set: {
            revenueCents,
            updatedAt: sql`datetime('now')`,
          },
        })
        .returning({
          userId: monthlyContributions.userId,
          revenueCents: monthlyContributions.revenueCents,
        })
        .get();

      return result;
    },

    upsertBulk(
      householdId: number,
      month: string,
      contributions: { userId: number; revenueCents: number }[],
    ) {
      for (const c of contributions) {
        this.upsert(householdId, month, c.userId, c.revenueCents);
      }
    },
  };
}
