import { apiRequest } from "./client.js";
import type {
  MappingRulesResponse,
  CreateMappingRuleRequest,
  UpdateMappingRuleRequest,
  ClassifyRequest,
  ClassifyResponse,
  MappingRule,
} from "@budget-app/shared";

export function getMappingRules(): Promise<MappingRulesResponse> {
  return apiRequest("/api/mapping-rules");
}

export function createMappingRule(data: CreateMappingRuleRequest): Promise<{ rule: MappingRule }> {
  return apiRequest("/api/mapping-rules", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export function updateMappingRule(
  id: number,
  data: UpdateMappingRuleRequest,
): Promise<{ rule: MappingRule }> {
  return apiRequest(`/api/mapping-rules/${id}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
}

export function deleteMappingRule(id: number): Promise<void> {
  return apiRequest(`/api/mapping-rules/${id}`, { method: "DELETE" });
}

export function classifySubCategory(data: ClassifyRequest): Promise<ClassifyResponse> {
  return apiRequest("/api/mapping-rules/classify", {
    method: "POST",
    body: JSON.stringify(data),
  });
}
