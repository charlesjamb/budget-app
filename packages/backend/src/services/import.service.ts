import { createHash } from "crypto";
import { eq, inArray } from "drizzle-orm";
import { type AppDatabase } from "../db/connection.js";
import { transactions, mappingRules } from "../db/schema.js";
import { parseCsv } from "./csv-parser.service.js";

function computeHash(
  householdId: number,
  dateOperation: string,
  labelOperation: string,
  amount: number,
): string {
  const data = `${householdId}:${dateOperation}:${labelOperation}:${amount}`;
  return createHash("sha256").update(data).digest("hex");
}

export function createImportService(db: AppDatabase) {
  return {
    importCsv(householdId: number, csvContent: string) {
      const rows = parseCsv(csvContent);

      // Load mapping rules for this household
      const rules = db
        .select()
        .from(mappingRules)
        .where(eq(mappingRules.householdId, householdId))
        .all();

      const ruleMap = new Map(
        rules.map((r) => [`${r.bankSubCategory}::${r.labelSimplified}`, r.budgetCategoryId]),
      );

      // Compute hashes for all rows
      const rowsWithHash = rows.map((row) => ({
        ...row,
        dedupHash: computeHash(householdId, row.dateOperation, row.labelOperation, row.amount),
      }));

      // Check existing hashes
      const allHashes = rowsWithHash.map((r) => r.dedupHash);
      const existingHashes = new Set<string>();

      // Batch check in groups of 500 (SQLite variable limit)
      for (let i = 0; i < allHashes.length; i += 500) {
        const batch = allHashes.slice(i, i + 500);
        const existing = db
          .select({ hash: transactions.dedupHash })
          .from(transactions)
          .where(inArray(transactions.dedupHash, batch))
          .all();
        for (const row of existing) {
          existingHashes.add(row.hash);
        }
      }

      let imported = 0;
      let skipped = 0;
      let unmappedCount = 0;

      for (const row of rowsWithHash) {
        if (existingHashes.has(row.dedupHash)) {
          skipped++;
          continue;
        }

        const ruleKey = `${row.bankSubCategory}::${row.labelSimplified}`;
        const budgetCategoryId = ruleMap.get(ruleKey) ?? null;

        if (!budgetCategoryId) {
          unmappedCount++;
        }

        db.insert(transactions)
          .values({
            householdId,
            dateOperation: row.dateOperation,
            labelSimplified: row.labelSimplified,
            labelOperation: row.labelOperation,
            amount: row.amount,
            bankCategory: row.bankCategory,
            bankSubCategory: row.bankSubCategory,
            budgetCategoryId,
            reference: row.reference,
            additionalInfo: row.additionalInfo,
            operationType: row.operationType,
            dedupHash: row.dedupHash,
          })
          .run();

        imported++;
      }

      return {
        imported,
        skipped,
        unmappedCount,
      };
    },
  };
}
