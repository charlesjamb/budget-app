import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getMerchantAliases,
  createMerchantAlias,
  updateMerchantAlias,
  deleteMerchantAlias,
} from "../api/merchant-aliases.js";

export function useMerchantAliases() {
  return useQuery({
    queryKey: ["merchant-aliases"],
    queryFn: getMerchantAliases,
  });
}

export function useCreateMerchantAlias() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createMerchantAlias,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["merchant-aliases"] });
    },
  });
}

export function useUpdateMerchantAlias() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, displayName }: { id: number; displayName: string }) =>
      updateMerchantAlias(id, { displayName }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["merchant-aliases"] });
    },
  });
}

export function useDeleteMerchantAlias() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteMerchantAlias,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["merchant-aliases"] });
    },
  });
}
