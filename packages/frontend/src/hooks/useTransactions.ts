import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getTransactions,
  getMonthlySummary,
  getHistory,
  getUncategorizedSubcategories,
  excludeTransaction,
  setReimbursement,
  clearReimbursement,
} from "../api/transactions.js";
import type {
  ExcludeTransactionRequest,
  ReimbursementRequest,
} from "@budget-app/shared";

export function useTransactions(month: string) {
  return useQuery({
    queryKey: ["transactions", month],
    queryFn: () => getTransactions(month),
  });
}

export function useMonthlySummary(month: string) {
  return useQuery({
    queryKey: ["transactions", "summary", month],
    queryFn: () => getMonthlySummary(month),
  });
}

export function useHistory(from: string, to: string) {
  return useQuery({
    queryKey: ["transactions", "history", from, to],
    queryFn: () => getHistory(from, to),
  });
}

export function useUncategorizedSubcategories() {
  return useQuery({
    queryKey: ["transactions", "uncategorized"],
    queryFn: getUncategorizedSubcategories,
  });
}

export function useExcludeTransaction() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      body,
    }: {
      id: number;
      body: ExcludeTransactionRequest;
    }) => excludeTransaction(id, body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["transactions"] });
    },
  });
}

export function useSetReimbursement() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      body,
    }: {
      id: number;
      body: ReimbursementRequest;
    }) => setReimbursement(id, body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["transactions"] });
    },
  });
}

export function useClearReimbursement() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => clearReimbursement(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["transactions"] });
    },
  });
}
