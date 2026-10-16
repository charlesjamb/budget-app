import { apiRequest } from "./client.js";
import type { MonthlyContributionsResponse, UpsertContributionsRequest } from "@budget-app/shared";

export function getContributions(month: string): Promise<MonthlyContributionsResponse> {
  return apiRequest(`/api/contributions?month=${month}`);
}

export function upsertContributions(
  data: UpsertContributionsRequest,
): Promise<MonthlyContributionsResponse> {
  return apiRequest("/api/contributions", {
    method: "PUT",
    body: JSON.stringify(data),
  });
}
