import { describe, it, expect } from "vite-plus/test";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { http, HttpResponse } from "msw";
import { server } from "../../mocks/server.js";
import { TestWrapper } from "../../test/TestWrapper.js";

function setupHistory(requests: string[] = []) {
  server.use(
    http.get("/api/auth/me", () =>
      HttpResponse.json({ user: { id: 1, email: "test@example.com" }, householdId: 1 }),
    ),
    http.get("/api/transactions/history", ({ request }) => {
      requests.push(new URL(request.url).search);
      return HttpResponse.json({
        months: ["2026-01", "2026-02"],
        categories: [
          { id: 1, name: "Food", icon: "🥖", amounts: { "2026-01": 14000, "2026-02": 42100 } },
        ],
        budgets: { "2026-01": { 1: 50000 }, "2026-02": { 1: 40000 } },
        totals: {
          "2026-01": { spent: 14000, budget: 50000 },
          "2026-02": { spent: 42100, budget: 40000 },
        },
      });
    }),
  );
}

describe("History Page", () => {
  it("should show the chart and a category table with average", async () => {
    setupHistory();

    render(<TestWrapper initialPath="/history?month=2026-02" />);

    expect(
      await screen.findByRole("link", { name: /Feb: 421\s€ spent of 400/ }),
    ).toBeInTheDocument();
    const row = screen.getByText(/Food/).closest("tr")!;
    expect(within(row).getByText(/421/)).toBeInTheDocument();
    expect(within(row).getByText(/140/)).toBeInTheDocument();
  });

  it("should request the selected range preset", async () => {
    const requests: string[] = [];
    setupHistory(requests);

    render(<TestWrapper initialPath="/history?month=2026-02" />);
    await screen.findByText("By category");
    expect(requests.at(-1)).toContain("from=2025-09");

    await userEvent.click(screen.getByRole("button", { name: "3 months" }));
    await screen.findByText("By category");
    expect(requests.at(-1)).toContain("from=2025-12");
  });
});
