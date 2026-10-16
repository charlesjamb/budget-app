import { eq, and } from "drizzle-orm";
import { type AppDatabase } from "../db/connection.js";
import { merchantAliases } from "../db/schema.js";

export function createMerchantAliasService(db: AppDatabase) {
  return {
    getAll(householdId: number) {
      return db
        .select({
          id: merchantAliases.id,
          originalLabel: merchantAliases.originalLabel,
          displayName: merchantAliases.displayName,
        })
        .from(merchantAliases)
        .where(eq(merchantAliases.householdId, householdId))
        .all();
    },

    create(householdId: number, originalLabel: string, displayName: string) {
      const result = db
        .insert(merchantAliases)
        .values({ householdId, originalLabel, displayName })
        .returning({
          id: merchantAliases.id,
          originalLabel: merchantAliases.originalLabel,
          displayName: merchantAliases.displayName,
        })
        .get();
      return result;
    },

    update(id: number, householdId: number, displayName: string) {
      const result = db
        .update(merchantAliases)
        .set({ displayName })
        .where(and(eq(merchantAliases.id, id), eq(merchantAliases.householdId, householdId)))
        .returning({
          id: merchantAliases.id,
          originalLabel: merchantAliases.originalLabel,
          displayName: merchantAliases.displayName,
        })
        .get();
      return result ?? null;
    },

    delete(id: number, householdId: number) {
      const result = db
        .delete(merchantAliases)
        .where(and(eq(merchantAliases.id, id), eq(merchantAliases.householdId, householdId)))
        .returning()
        .get();
      return !!result;
    },
  };
}
