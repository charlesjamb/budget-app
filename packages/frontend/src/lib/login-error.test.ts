import { describe, it, expect } from "vite-plus/test";
import { ApiError } from "../api/client.js";
import { describeLoginError } from "./login-error.js";

describe("describeLoginError", () => {
  it("distinguishes bad credentials, throttling, server errors and network failures", () => {
    expect(describeLoginError(new ApiError(401, "Invalid credentials"))).toBe(
      "Invalid email or password",
    );
    expect(describeLoginError(new ApiError(429, "slow down"))).toMatch(/Too many attempts/);
    expect(describeLoginError(new ApiError(500, "boom"))).toMatch(/server/);
    expect(describeLoginError(new TypeError("Failed to fetch"))).toMatch(/Can't reach the server/);
  });
});
