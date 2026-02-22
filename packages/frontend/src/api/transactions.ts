import { apiRequest } from "./client.js";
import type {
  TransactionsResponse,
  MonthlySummary,
  HistoryData,
  UncategorizedSubcategoriesResponse,
} from "@budget-app/shared";

export function getTransactions(month: string): Promise<TransactionsResponse> {
  return apiRequest(`/api/transactions?month=${month}`);
}

export function getMonthlySummary(month: string): Promise<MonthlySummary> {
  return apiRequest(`/api/transactions/monthly-summary?month=${month}`);
}

export function getHistory(from: string, to: string): Promise<HistoryData> {
  return apiRequest(`/api/transactions/history?from=${from}&to=${to}`);
}

export function getUncategorizedSubcategories(): Promise<UncategorizedSubcategoriesResponse> {
  return apiRequest("/api/transactions/uncategorized-subcategories");
}
