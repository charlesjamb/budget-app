import { apiRequest } from "./client.js";
import type {
  CategoriesResponse,
  CreateCategoryRequest,
  UpdateCategoryRequest,
  BudgetCategory,
} from "@budget-app/shared";

export function getCategories(): Promise<CategoriesResponse> {
  return apiRequest("/api/categories");
}

export function createCategory(
  data: CreateCategoryRequest,
): Promise<{ category: BudgetCategory }> {
  return apiRequest("/api/categories", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export function updateCategory(
  id: number,
  data: UpdateCategoryRequest,
): Promise<{ category: BudgetCategory }> {
  return apiRequest(`/api/categories/${id}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
}

export function deleteCategory(id: number): Promise<void> {
  return apiRequest(`/api/categories/${id}`, { method: "DELETE" });
}
