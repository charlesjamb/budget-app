import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getMe, login, logout } from "../api/auth.js";
import type { LoginRequest } from "@budget-app/shared";

export function useAuth() {
  const query = useQuery({
    queryKey: ["auth", "me"],
    queryFn: getMe,
    retry: false,
  });

  return {
    user: query.data?.user ?? null,
    householdId: query.data?.householdId ?? null,
    isLoading: query.isLoading,
    isAuthenticated: !!query.data?.user,
  };
}

export function useLogin() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: LoginRequest) => login(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["auth"] });
    },
  });
}

export function useLogout() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: logout,
    onSuccess: () => {
      queryClient.clear();
    },
  });
}
