import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getBudgets, upsertBudgets, copyBudgetFromMonth } from "../api/budgets.js";
import type { UpsertBudgetsRequest, CopyBudgetRequest } from "@budget-app/shared";

export function useBudgets(month: string) {
  return useQuery({
    queryKey: ["budgets", month],
    queryFn: () => getBudgets(month),
  });
}

export function useUpsertBudgets() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: UpsertBudgetsRequest) => upsertBudgets(data),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["budgets", variables.month] });
      queryClient.invalidateQueries({
        queryKey: ["transactions", "summary", variables.month],
      });
    },
  });
}

export function useCopyBudget() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CopyBudgetRequest) => copyBudgetFromMonth(data),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["budgets", variables.targetMonth],
      });
      queryClient.invalidateQueries({
        queryKey: ["transactions", "summary", variables.targetMonth],
      });
    },
  });
}
