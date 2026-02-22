export interface ParsedRow {
  dateOperation: string;
  labelSimplified: string;
  labelOperation: string;
  reference: string | null;
  additionalInfo: string | null;
  operationType: string;
  bankCategory: string;
  bankSubCategory: string;
  amount: number;
}

function parseFrenchDate(dateStr: string): string {
  const [day, month, year] = dateStr.split("/");
  return `${year}-${month}-${day}`;
}

function parseFrenchAmount(amountStr: string): number {
  // "-35,00" → 3500 (positive integer in cents)
  const cleaned = amountStr.replace(",", ".");
  const value = parseFloat(cleaned);
  return Math.round(Math.abs(value) * 100);
}

export function parseCsv(content: string): ParsedRow[] {
  const lines = content.trim().split("\n");

  if (lines.length < 2) {
    return [];
  }

  // Skip header
  const dataLines = lines.slice(1);
  const results: ParsedRow[] = [];

  for (const line of dataLines) {
    if (!line.trim()) continue;

    const columns = line.split(";");
    if (columns.length < 13) continue;

    const debit = columns[8]?.trim();
    const bankCategory = columns[6]?.trim() ?? "";
    const dateOperation = columns[10]?.trim();

    // Skip credits (only keep debits)
    if (!debit || debit === "") continue;

    // Skip "Transaction exclue"
    if (bankCategory === "Transaction exclue") continue;

    if (!dateOperation) continue;

    results.push({
      dateOperation: parseFrenchDate(dateOperation),
      labelSimplified: columns[1]?.trim() ?? "",
      labelOperation: columns[2]?.trim() ?? "",
      reference: columns[3]?.trim() || null,
      additionalInfo: columns[4]?.trim() || null,
      operationType: columns[5]?.trim() ?? "",
      bankCategory,
      bankSubCategory: columns[7]?.trim() ?? "",
      amount: parseFrenchAmount(debit),
    });
  }

  return results;
}
