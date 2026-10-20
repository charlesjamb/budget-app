const MONTH_PATTERN = /^\d{4}-(0[1-9]|1[0-2])$/;

export function getCurrentMonth(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}

export function parseMonth(value: unknown): string | undefined {
  return typeof value === "string" && MONTH_PATTERN.test(value) ? value : undefined;
}

export function addMonths(month: string, offset: number): string {
  const [year, m] = month.split("-").map(Number);
  const date = new Date(year, m - 1 + offset);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}
