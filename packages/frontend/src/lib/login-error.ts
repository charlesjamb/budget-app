import { ApiError } from "../api/client.js";

/** User-facing reason a login attempt failed: bad credentials, throttling, unreachable server, or other. */
export function describeLoginError(error: unknown): string {
  if (error instanceof ApiError) {
    if (error.status === 401) return "Invalid email or password";
    if (error.status === 429) return "Too many attempts, try again in a few minutes";
    return "Something went wrong on the server, please try again";
  }
  return "Can't reach the server, check your connection";
}
