import { apiRequest } from "./client.js";
import type {
  LoginRequest,
  LoginResponse,
  AuthMeResponse,
} from "@budget-app/shared";

export function login(data: LoginRequest): Promise<LoginResponse> {
  return apiRequest("/api/auth/login", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export function logout(): Promise<void> {
  return apiRequest("/api/auth/logout", { method: "POST" });
}

export function getMe(): Promise<AuthMeResponse> {
  return apiRequest("/api/auth/me");
}
