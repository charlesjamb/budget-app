import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getContributions, upsertContributions } from "../api/contributions.js";
import type { UpsertContributionsRequest } from "@budget-app/shared";

export function useContributions(month: string) {
  return useQuery({
    queryKey: ["contributions", month],
    queryFn: () => getContributions(month),
  });
}

export function useUpsertContributions() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: UpsertContributionsRequest) => upsertContributions(data),
    onSuccess: (_data, variables) => {
      void queryClient.invalidateQueries({
        queryKey: ["contributions", variables.month],
      });
    },
  });
}
