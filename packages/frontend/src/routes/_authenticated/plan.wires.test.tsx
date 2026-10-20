import { afterEach, beforeEach, describe, it, expect, vi } from "vite-plus/test";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
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

describe("Wires Page", () => {
  beforeEach(() => {
    // The page derives the month from the current date; pin it to match the
    // February 2026 fixtures below so the test does not depend on "today".
    vi.setSystemTime(new Date(2026, 1, 15, 12, 0, 0));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("should display page title and revenue inputs", async () => {
    setupAuthenticatedUser();
    setupSplitData();

    render(<TestWrapper initialPath="/plan/wires" />);

    expect(await screen.findByRole("heading", { name: "Wires" })).toBeInTheDocument();
    expect(screen.getByText("Revenue (monthly income)")).toBeInTheDocument();
    expect(screen.getByDisplayValue("4200.00")).toBeInTheDocument();
    expect(screen.getByDisplayValue("2290.00")).toBeInTheDocument();
  });

  it("should show total revenue and ratios", async () => {
    setupAuthenticatedUser();
    setupSplitData();

    render(<TestWrapper initialPath="/plan/wires" />);

    expect(await screen.findByText("Total revenue")).toBeInTheDocument();
    expect(screen.getByText("6490.00 €")).toBeInTheDocument();
    expect(screen.getByText("64.7%")).toBeInTheDocument();
    expect(screen.getByText("35.3%")).toBeInTheDocument();
  });

  it("should show wire amounts based on total budgeted", async () => {
    setupAuthenticatedUser();
    setupSplitData();

    render(<TestWrapper initialPath="/plan/wires" />);

    expect(await screen.findByText("Wire amounts (beginning of month)")).toBeInTheDocument();
    expect(screen.getByText("Total budgeted")).toBeInTheDocument();
    // Total budgeted = 80000 + 40000 = 120000 cents = 1200 €
    expect(screen.getByText("1200.00 €")).toBeInTheDocument();
    // Wire amounts are split proportionally (Charles ~65%, Mathilde ~35%)
    expect(screen.getByText(/776\.\d+ €/)).toBeInTheDocument();
    expect(screen.getByText(/423\.\d+ €/)).toBeInTheDocument();
  });

  it("should show empty state when no household members", async () => {
    setupAuthenticatedUser();
    setupSplitData({ members: [] });

    server.use(
      http.get("/api/contributions", () => {
        return HttpResponse.json({ month: "2026-02", members: [] });
      }),
    );

    render(<TestWrapper initialPath="/plan/wires" />);

    expect(
      await screen.findByText("No household members found. Add members in Settings."),
    ).toBeInTheDocument();
  });

  it("should save contributions when Save is clicked", async () => {
    setupAuthenticatedUser();
    setupSplitData();

    let putPayload: {
      month: string;
      contributions: { userId: number; revenueCents: number }[];
    } | null = null;
    server.use(
      http.put("/api/contributions", async ({ request }) => {
        putPayload = (await request.json()) as typeof putPayload;
        return HttpResponse.json({
          month: "2026-02",
          members: putPayload!.contributions.map((c) => ({
            userId: c.userId,
            email: c.userId === 1 ? "charles@example.com" : "mathilde@example.com",
            revenueCents: c.revenueCents,
          })),
        });
      }),
    );

    const user = userEvent.setup();
    render(<TestWrapper initialPath="/plan/wires" />);

    await screen.findByRole("heading", { name: "Wires" });

    const revenueInput = screen.getByDisplayValue("4200.00");
    await user.clear(revenueInput);
    await user.type(revenueInput, "4500");

    const saveButton = screen.getByRole("button", { name: "Save" });
    await user.click(saveButton);

    expect(await screen.findByText("Saved!")).toBeInTheDocument();
    expect(putPayload).not.toBeNull();
    expect(putPayload!.month).toBe("2026-02");
    expect(putPayload!.contributions).toHaveLength(2);
    const charlesContrib = putPayload!.contributions.find((c) => c.userId === 1);
    expect(charlesContrib?.revenueCents).toBe(450000);
  });
});
