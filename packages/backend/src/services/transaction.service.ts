import { eq, and, between, isNull, sql } from "drizzle-orm";
import { type AppDatabase } from "../db/connection.js";
import { transactions, budgetCategories, merchantAliases } from "../db/schema.js";

export function createTransactionService(db: AppDatabase) {
  function getFullTransaction(householdId: number, transactionId: number) {
    const row = db
      .select({
        id: transactions.id,
        dateOperation: transactions.dateOperation,
        labelSimplified: transactions.labelSimplified,
        labelOperation: transactions.labelOperation,
        amount: transactions.amount,
        bankCategory: transactions.bankCategory,
        bankSubCategory: transactions.bankSubCategory,
        budgetCategoryId: transactions.budgetCategoryId,
        budgetCategoryName: budgetCategories.name,
        displayName: merchantAliases.displayName,
        reference: transactions.reference,
        additionalInfo: transactions.additionalInfo,
        operationType: transactions.operationType,
        excluded: transactions.excluded,
        excludedReason: transactions.excludedReason,
        reimbursedAmount: transactions.reimbursedAmount,
        reimbursementNote: transactions.reimbursementNote,
        categoryLocked: transactions.categoryLocked,
      })
      .from(transactions)
      .leftJoin(budgetCategories, eq(transactions.budgetCategoryId, budgetCategories.id))
      .leftJoin(
        merchantAliases,
        and(
          eq(transactions.labelSimplified, merchantAliases.originalLabel),
          eq(merchantAliases.householdId, householdId),
        ),
      )
      .where(and(eq(transactions.id, transactionId), eq(transactions.householdId, householdId)))
      .get();
    return row
      ? {
          ...row,
          excluded: row.excluded === 1,
          categoryLocked: row.categoryLocked === 1,
        }
      : null;
  }

  return {
    getByMonth(householdId: number, month: string) {
      // month is "YYYY-MM"
      const startDate = `${month}-01`;
      const endDate = `${month}-31`;

      const results = db
        .select({
          id: transactions.id,
          dateOperation: transactions.dateOperation,
          labelSimplified: transactions.labelSimplified,
          labelOperation: transactions.labelOperation,
          amount: transactions.amount,
          bankCategory: transactions.bankCategory,
          bankSubCategory: transactions.bankSubCategory,
          budgetCategoryId: transactions.budgetCategoryId,
          budgetCategoryName: budgetCategories.name,
          displayName: merchantAliases.displayName,
          reference: transactions.reference,
          additionalInfo: transactions.additionalInfo,
          operationType: transactions.operationType,
          excluded: transactions.excluded,
          excludedReason: transactions.excludedReason,
          reimbursedAmount: transactions.reimbursedAmount,
          reimbursementNote: transactions.reimbursementNote,
          categoryLocked: transactions.categoryLocked,
        })
        .from(transactions)
        .leftJoin(budgetCategories, eq(transactions.budgetCategoryId, budgetCategories.id))
        .leftJoin(
          merchantAliases,
          and(
            eq(transactions.labelSimplified, merchantAliases.originalLabel),
            eq(merchantAliases.householdId, householdId),
          ),
        )
        .where(
          and(
            eq(transactions.householdId, householdId),
            between(transactions.dateOperation, startDate, endDate),
          ),
        )
        .orderBy(transactions.dateOperation)
        .all();

      return results.map((r) => ({
        ...r,
        excluded: r.excluded === 1,
        categoryLocked: r.categoryLocked === 1,
      }));
    },

    getMonthlySummary(householdId: number, month: string) {
      const startDate = `${month}-01`;
      const endDate = `${month}-31`;

      // Categorized transactions
      const categorized = db
        .select({
          id: budgetCategories.id,
          name: budgetCategories.name,
          type: budgetCategories.type,
          totalAmount:
            sql<number>`sum(${transactions.amount} - ${transactions.reimbursedAmount})`.as(
              "total_amount",
            ),
          transactionCount: sql<number>`count(*)`.as("transaction_count"),
        })
        .from(transactions)
        .innerJoin(budgetCategories, eq(transactions.budgetCategoryId, budgetCategories.id))
        .where(
          and(
            eq(transactions.householdId, householdId),
            between(transactions.dateOperation, startDate, endDate),
            eq(transactions.excluded, 0),
          ),
        )
        .groupBy(budgetCategories.id, budgetCategories.name, budgetCategories.type)
        .all();

      // Uncategorized transactions
      const uncategorized = db
        .select({
          totalAmount:
            sql<number>`coalesce(sum(${transactions.amount} - ${transactions.reimbursedAmount}), 0)`.as(
              "total_amount",
            ),
          transactionCount: sql<number>`count(*)`.as("transaction_count"),
        })
        .from(transactions)
        .where(
          and(
            eq(transactions.householdId, householdId),
            between(transactions.dateOperation, startDate, endDate),
            isNull(transactions.budgetCategoryId),
            eq(transactions.excluded, 0),
          ),
        )
        .get()!;

      const totalAmount =
        categorized.reduce((sum, c) => sum + c.totalAmount, 0) + uncategorized.totalAmount;

      return {
        month,
        totalAmount,
        categories: categorized,
        uncategorized: {
          totalAmount: uncategorized.totalAmount,
          transactionCount: uncategorized.transactionCount,
        },
      };
    },

    getHistory(householdId: number, from: string, to: string) {
      // Generate month list
      const months: string[] = [];
      const [fromYear, fromMonth] = from.split("-").map(Number);
      const [toYear, toMonth] = to.split("-").map(Number);

      let currentYear = fromYear;
      let currentMonth = fromMonth;

      while (currentYear < toYear || (currentYear === toYear && currentMonth <= toMonth)) {
        months.push(`${currentYear}-${String(currentMonth).padStart(2, "0")}`);
        currentMonth++;
        if (currentMonth > 12) {
          currentMonth = 1;
          currentYear++;
        }
      }

      const startDate = `${from}-01`;
      const endDate = `${to}-31`;

      // Get all categorized transactions in range
      const results = db
        .select({
          categoryId: budgetCategories.id,
          categoryName: budgetCategories.name,
          month: sql<string>`substr(${transactions.dateOperation}, 1, 7)`.as("month"),
          totalAmount:
            sql<number>`sum(${transactions.amount} - ${transactions.reimbursedAmount})`.as(
              "total_amount",
            ),
        })
        .from(transactions)
        .innerJoin(budgetCategories, eq(transactions.budgetCategoryId, budgetCategories.id))
        .where(
          and(
            eq(transactions.householdId, householdId),
            between(transactions.dateOperation, startDate, endDate),
            eq(transactions.excluded, 0),
          ),
        )
        .groupBy(
          budgetCategories.id,
          budgetCategories.name,
          sql`substr(${transactions.dateOperation}, 1, 7)`,
        )
        .all();

      // Pivot to { categoryId, categoryName, amounts: { month: amount } }
      const categoryMap = new Map<
        number,
        { id: number; name: string; amounts: Record<string, number> }
      >();

      for (const row of results) {
        if (!categoryMap.has(row.categoryId)) {
          categoryMap.set(row.categoryId, {
            id: row.categoryId,
            name: row.categoryName,
            amounts: {},
          });
        }
        categoryMap.get(row.categoryId)!.amounts[row.month] = row.totalAmount;
      }

      return {
        months,
        categories: Array.from(categoryMap.values()),
      };
    },

    updateExclude(householdId: number, transactionId: number, excluded: boolean, reason?: string) {
      const updated = db
        .update(transactions)
        .set({
          excluded: excluded ? 1 : 0,
          excludedReason: excluded ? (reason ?? null) : null,
        })
        .where(and(eq(transactions.id, transactionId), eq(transactions.householdId, householdId)))
        .returning()
        .get();
      if (!updated) return null;

      return getFullTransaction(householdId, transactionId);
    },

    updateReimbursement(householdId: number, transactionId: number, amount: number, note?: string) {
      // Fetch the transaction first to validate
      const tx = db
        .select({ id: transactions.id, amount: transactions.amount })
        .from(transactions)
        .where(and(eq(transactions.id, transactionId), eq(transactions.householdId, householdId)))
        .get();

      if (!tx) return { error: "not_found" as const };
      if (amount <= 0 || amount > tx.amount) return { error: "invalid_amount" as const };

      db.update(transactions)
        .set({
          reimbursedAmount: amount,
          reimbursementNote: note ?? null,
        })
        .where(and(eq(transactions.id, transactionId), eq(transactions.householdId, householdId)))
        .run();

      return { data: getFullTransaction(householdId, transactionId)! };
    },

    clearReimbursement(householdId: number, transactionId: number) {
      const tx = db
        .select({ id: transactions.id })
        .from(transactions)
        .where(and(eq(transactions.id, transactionId), eq(transactions.householdId, householdId)))
        .get();

      if (!tx) return null;

      db.update(transactions)
        .set({
          reimbursedAmount: 0,
          reimbursementNote: null,
        })
        .where(and(eq(transactions.id, transactionId), eq(transactions.householdId, householdId)))
        .run();

      return getFullTransaction(householdId, transactionId);
    },
  };
}
