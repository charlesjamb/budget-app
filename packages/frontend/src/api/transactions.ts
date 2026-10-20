import { apiRequest } from "./client.js";
import type {
  TransactionsResponse,
  MonthlySummary,
  HistoryData,
  UncategorizedSubcategoriesResponse,
  Transaction,
  ExcludeTransactionRequest,
  ReimbursementRequest,
} from "@budget-app/shared";

export function getTransactions(month: string): Promise<TransactionsResponse> {
  return apiRequest(`/api/transactions?month=${month}`);
}

export function excludeTransaction(
  id: number,
  body: ExcludeTransactionRequest,
): Promise<Transaction> {
  return apiRequest(`/api/transactions/${id}/exclude`, {
    method: "PATCH",
    body: JSON.stringify(body),
  });
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

export function setReimbursement(id: number, body: ReimbursementRequest): Promise<Transaction> {
  return apiRequest(`/api/transactions/${id}/reimbursement`, {
    method: "PUT",
    body: JSON.stringify(body),
  });
}

export function clearReimbursement(id: number): Promise<Transaction> {
  return apiRequest(`/api/transactions/${id}/reimbursement`, {
    method: "DELETE",
  });
}

export function setTransactionCategory(id: number, budgetCategoryId: number): Promise<Transaction> {
  return apiRequest(`/api/transactions/${id}/category`, {
    method: "PATCH",
    body: JSON.stringify({ budgetCategoryId }),
  });
}
