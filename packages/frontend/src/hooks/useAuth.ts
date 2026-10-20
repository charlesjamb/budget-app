import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "@tanstack/react-router";
import { getMe, login, logout, updateProfile } from "../api/auth.js";
import type { LoginRequest, AuthMeResponse, UpdateProfileRequest } from "@budget-app/shared";

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
    onSuccess: (data) => {
      queryClient.setQueryData<AuthMeResponse>(["auth", "me"], {
        user: data.user,
        householdId: data.householdId,
      });
    },
  });
}

export function useLogout() {
  const queryClient = useQueryClient();
  const router = useRouter();

  return useMutation({
    mutationFn: logout,
    onSuccess: () => {
      queryClient.clear();
      void router.navigate({ to: "/login" });
    },
  });
}

export function useUpdateProfile() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: UpdateProfileRequest) => updateProfile(data),
    onSuccess: (data) => {
      queryClient.setQueryData<AuthMeResponse>(["auth", "me"], data);
      void queryClient.invalidateQueries({ queryKey: ["contributions"] });
    },
  });
}
