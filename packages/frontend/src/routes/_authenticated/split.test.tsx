import { describe, it, expect } from "vite-plus/test";
import { render, screen } from "@testing-library/react";
import { http, HttpResponse } from "msw";
import { server } from "../../mocks/server.js";
import { TestWrapper } from "../../test/TestWrapper.js";

describe("Split route", () => {
  it("redirects /split to the Wires page, keeping the month", async () => {
    server.use(
      http.get("/api/auth/me", () =>
        HttpResponse.json({ user: { id: 1, email: "test@example.com" }, householdId: 1 }),
      ),
    );

    render(<TestWrapper initialPath="/split?month=2026-02" />);

    expect(await screen.findByRole("heading", { name: "Wires" })).toBeInTheDocument();
    expect(await screen.findByText("February 2026")).toBeInTheDocument();
  });
});
