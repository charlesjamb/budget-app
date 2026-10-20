import { afterEach, beforeEach, describe, it, expect, vi } from "vite-plus/test";
import { render, screen } from "@testing-library/react";
import { http, HttpResponse } from "msw";
import { server } from "../../mocks/server.js";
import { TestWrapper } from "../../test/TestWrapper.js";

function setupAuthenticatedUser() {
  server.use(
    http.get("/api/auth/me", () => {
      return HttpResponse.json({
        user: { id: 1, email: "test@example.com" },
        householdId: 1,
      });
    }),
  );
}

function setupSplitData(overrides?: {
  members?: { userId: number; email: string; revenueCents: number }[];
  budgets?: { categoryId: number; amountCents: number }[];
  totalSpent?: number;
}) {
  const members = overrides?.members ?? [
    { userId: 1, email: "charles@example.com", revenueCents: 420000 },
    { userId: 2, email: "mathilde@example.com", revenueCents: 229000 },
  ];
  const budgets = overrides?.budgets ?? [
    { categoryId: 1, amountCents: 80000 },
    { categoryId: 2, amountCents: 40000 },
  ];
  const totalSpent = overrides?.totalSpent ?? 321127; // 3211.27 € overspent

  server.use(
    http.get("/api/contributions", () => {
      return HttpResponse.json({ month: "2026-02", members });
    }),
    http.get("/api/budgets", () => {
      return HttpResponse.json({ month: "2026-02", budgets });
    }),
    http.get("/api/transactions/monthly-summary", () => {
      return HttpResponse.json({
        month: "2026-02",
        totalAmount: totalSpent,
        categories: [],
        uncategorized: { totalAmount: 0, transactionCount: 0 },
      });
    }),
  );
}

describe("Settle Page", () => {
  beforeEach(() => {
    // The page derives the month from the current date; pin it to match the
    // February 2026 fixtures below so the test does not depend on "today".
    vi.setSystemTime(new Date(2026, 1, 15, 12, 0, 0));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("should show end-of-month settlement when overspent", async () => {
    setupAuthenticatedUser();
    setupSplitData();

    render(<TestWrapper initialPath="/close/settle" />);

    expect(await screen.findByText("End-of-month settlement")).toBeInTheDocument();
    expect(screen.getByText("Total spent")).toBeInTheDocument();
    expect(screen.getByText("Difference (spent − budgeted)")).toBeInTheDocument();
    // totalSpent 321127, totalBudgeted 120000, difference = 201127 cents
    expect(screen.getByText("+2011.27 €")).toBeInTheDocument();
    // Settlement hint appears when overspent (once per member)
    expect(screen.getAllByText(/wire additional/).length).toBeGreaterThanOrEqual(1);
  });

  it("should show empty state when no household members", async () => {
    setupAuthenticatedUser();
    setupSplitData({ members: [] });

    server.use(
      http.get("/api/contributions", () => {
        return HttpResponse.json({ month: "2026-02", members: [] });
      }),
    );

    render(<TestWrapper initialPath="/close/settle" />);

    expect(
      await screen.findByText("No household members found. Add members in Settings."),
    ).toBeInTheDocument();
  });
});
