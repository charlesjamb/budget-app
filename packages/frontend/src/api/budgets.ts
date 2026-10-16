import { apiRequest } from "./client.js";
import type {
  MonthlyBudgetsResponse,
  UpsertBudgetsRequest,
  CopyBudgetRequest,
  CopyBudgetResponse,
} from "@budget-app/shared";

export function getBudgets(month: string): Promise<MonthlyBudgetsResponse> {
  return apiRequest(`/api/budgets?month=${month}`);
}

export function upsertBudgets(data: UpsertBudgetsRequest): Promise<MonthlyBudgetsResponse> {
  return apiRequest("/api/budgets", {
    method: "PUT",
    body: JSON.stringify(data),
  });
}

export function copyBudgetFromMonth(data: CopyBudgetRequest): Promise<CopyBudgetResponse> {
  return apiRequest("/api/budgets/copy", {
    method: "POST",
    body: JSON.stringify(data),
  });
}
