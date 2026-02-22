import { apiRequest } from "./client.js";
import type {
  MerchantAliasesResponse,
  CreateMerchantAliasRequest,
  UpdateMerchantAliasRequest,
  MerchantAlias,
} from "@budget-app/shared";

export function getMerchantAliases(): Promise<MerchantAliasesResponse> {
  return apiRequest("/api/merchant-aliases");
}

export function createMerchantAlias(
  data: CreateMerchantAliasRequest,
): Promise<{ alias: MerchantAlias }> {
  return apiRequest("/api/merchant-aliases", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export function updateMerchantAlias(
  id: number,
  data: UpdateMerchantAliasRequest,
): Promise<{ alias: MerchantAlias }> {
  return apiRequest(`/api/merchant-aliases/${id}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
}

export function deleteMerchantAlias(id: number): Promise<void> {
  return apiRequest(`/api/merchant-aliases/${id}`, { method: "DELETE" });
}
