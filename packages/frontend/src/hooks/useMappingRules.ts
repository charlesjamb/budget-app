import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getMappingRules,
  createMappingRule,
  updateMappingRule,
  deleteMappingRule,
  classifySubCategory,
} from "../api/mapping-rules.js";
import type { ClassifyRequest } from "@budget-app/shared";

export function useMappingRules() {
  return useQuery({
    queryKey: ["mapping-rules"],
    queryFn: getMappingRules,
  });
}

export function useCreateMappingRule() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createMappingRule,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["mapping-rules"] });
    },
  });
}

export function useUpdateMappingRule() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, budgetCategoryId }: { id: number; budgetCategoryId: number }) =>
      updateMappingRule(id, { budgetCategoryId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["mapping-rules"] });
    },
  });
}

export function useDeleteMappingRule() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteMappingRule,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["mapping-rules"] });
      queryClient.invalidateQueries({ queryKey: ["transactions"] });
    },
  });
}

export function useClassify() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: ClassifyRequest) => classifySubCategory(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["mapping-rules"] });
      queryClient.invalidateQueries({ queryKey: ["transactions"] });
    },
  });
}
