import { eq, and, isNull } from "drizzle-orm";
import { type AppDatabase } from "../db/connection.js";
import { mappingRules, budgetCategories, transactions } from "../db/schema.js";

export function createMappingRuleService(db: AppDatabase) {
  return {
    getAll(householdId: number) {
      const rules = db
        .select({
          id: mappingRules.id,
          bankSubCategory: mappingRules.bankSubCategory,
          labelSimplified: mappingRules.labelSimplified,
          budgetCategoryId: mappingRules.budgetCategoryId,
          budgetCategoryName: budgetCategories.name,
        })
        .from(mappingRules)
        .leftJoin(
          budgetCategories,
          eq(mappingRules.budgetCategoryId, budgetCategories.id),
        )
        .where(eq(mappingRules.householdId, householdId))
        .all();

      return rules;
    },

    create(
      householdId: number,
      bankSubCategory: string,
      labelSimplified: string,
      budgetCategoryId: number,
    ) {
      const result = db
        .insert(mappingRules)
        .values({
          householdId,
          bankSubCategory,
          labelSimplified,
          budgetCategoryId,
        })
        .returning()
        .get();
      return result;
    },

    update(id: number, householdId: number, budgetCategoryId: number) {
      const result = db
        .update(mappingRules)
        .set({ budgetCategoryId })
        .where(
          and(
            eq(mappingRules.id, id),
            eq(mappingRules.householdId, householdId),
          ),
        )
        .returning()
        .get();
      return result ?? null;
    },

    delete(id: number, householdId: number) {
      const result = db
        .delete(mappingRules)
        .where(
          and(
            eq(mappingRules.id, id),
            eq(mappingRules.householdId, householdId),
          ),
        )
        .returning()
        .get();
      return !!result;
    },

    classify(
      householdId: number,
      bankSubCategory: string,
      labelSimplified: string,
      budgetCategoryId: number,
    ) {
      // Upsert mapping rule
      const existingRule = db
        .select()
        .from(mappingRules)
        .where(
          and(
            eq(mappingRules.householdId, householdId),
            eq(mappingRules.bankSubCategory, bankSubCategory),
            eq(mappingRules.labelSimplified, labelSimplified),
          ),
        )
        .get();

      let rule;
      if (existingRule) {
        rule = db
          .update(mappingRules)
          .set({ budgetCategoryId })
          .where(eq(mappingRules.id, existingRule.id))
          .returning()
          .get()!;
      } else {
        rule = db
          .insert(mappingRules)
          .values({
            householdId,
            bankSubCategory,
            labelSimplified,
            budgetCategoryId,
          })
          .returning()
          .get();
      }

      // Retroactively apply to uncategorized transactions matching both fields
      const updateResult = db
        .update(transactions)
        .set({ budgetCategoryId })
        .where(
          and(
            eq(transactions.householdId, householdId),
            eq(transactions.bankSubCategory, bankSubCategory),
            eq(transactions.labelSimplified, labelSimplified),
            isNull(transactions.budgetCategoryId),
          ),
        )
        .run();

      return {
        rule: {
          id: rule.id,
          bankSubCategory: rule.bankSubCategory,
          labelSimplified: rule.labelSimplified,
          budgetCategoryId: rule.budgetCategoryId,
        },
        updatedCount: updateResult.changes,
      };
    },

    getUncategorizedSubCategories(householdId: number) {
      const rows = db
        .select({
          id: transactions.id,
          dateOperation: transactions.dateOperation,
          labelSimplified: transactions.labelSimplified,
          labelOperation: transactions.labelOperation,
          amount: transactions.amount,
          bankSubCategory: transactions.bankSubCategory,
        })
        .from(transactions)
        .where(
          and(
            eq(transactions.householdId, householdId),
            isNull(transactions.budgetCategoryId),
          ),
        )
        .orderBy(transactions.dateOperation)
        .all();

      // Group by (bankSubCategory, labelSimplified) pair
      const grouped = new Map<
        string,
        {
          bankSubCategory: string;
          labelSimplified: string;
          count: number;
          transactions: {
            id: number;
            dateOperation: string;
            labelSimplified: string;
            labelOperation: string;
            amount: number;
          }[];
        }
      >();

      for (const row of rows) {
        const key = `${row.bankSubCategory}::${row.labelSimplified}`;
        if (!grouped.has(key)) {
          grouped.set(key, {
            bankSubCategory: row.bankSubCategory,
            labelSimplified: row.labelSimplified,
            count: 0,
            transactions: [],
          });
        }
        const group = grouped.get(key)!;
        group.count++;
        group.transactions.push({
          id: row.id,
          dateOperation: row.dateOperation,
          labelSimplified: row.labelSimplified,
          labelOperation: row.labelOperation,
          amount: row.amount,
        });
      }

      return Array.from(grouped.values());
    },
  };
}
