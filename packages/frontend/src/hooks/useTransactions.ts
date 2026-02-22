import { useQuery } from "@tanstack/react-query";
import {
  getTransactions,
  getMonthlySummary,
  getHistory,
  getUncategorizedSubcategories,
} from "../api/transactions.js";

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
