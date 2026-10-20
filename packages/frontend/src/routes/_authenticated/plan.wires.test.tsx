import { afterEach, beforeEach, describe, it, expect, vi } from "vite-plus/test";
import { render, screen, waitFor } from "@testing-library/react";
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
    expect(screen.getByLabelText("charles@example.com revenue")).toHaveValue("4200.00");
    expect(screen.getByLabelText("mathilde@example.com revenue")).toHaveValue("2290.00");
  });

  it("should show each member's share of the revenue", async () => {
    setupAuthenticatedUser();
    setupSplitData();

    render(<TestWrapper initialPath="/plan/wires" />);

    expect(await screen.findByText("65%")).toBeInTheDocument();
    expect(screen.getByText("35%")).toBeInTheDocument();
  });

  it("should show wire amounts based on total budgeted", async () => {
    setupAuthenticatedUser();
    setupSplitData();

    render(<TestWrapper initialPath="/plan/wires" />);

    // Total budgeted = 80000 + 40000 = 120000 cents = 1200 €
    expect(await screen.findByText(/To wire for February \(1\s200\.00\s€\)/)).toBeInTheDocument();
    // Wire amounts are split proportionally (Charles ~65%, Mathilde ~35%)
    expect(screen.getByText(/776\.\d+\s€/)).toBeInTheDocument();
    expect(screen.getByText(/423\.\d+\s€/)).toBeInTheDocument();
  });

  it("should prefer display names over emails", async () => {
    setupAuthenticatedUser();
    setupSplitData();
    server.use(
      http.get("/api/contributions", () =>
        HttpResponse.json({
          month: "2026-02",
          members: [
            { userId: 1, email: "c@example.com", displayName: "Charles", revenueCents: 420000 },
            { userId: 2, email: "m@example.com", displayName: "Mathilde", revenueCents: 229000 },
          ],
        }),
      ),
    );

    render(<TestWrapper initialPath="/plan/wires" />);

    expect(await screen.findByLabelText("Charles revenue")).toBeInTheDocument();
    expect(screen.getByText("➜ Mathilde")).toBeInTheDocument();
  });

  it("should offer last month's incomes when none are entered", async () => {
    setupAuthenticatedUser();
    setupSplitData();
    let putPayload: { contributions: { userId: number; revenueCents: number }[] } | null = null;
    server.use(
      http.get("/api/contributions", ({ request }) => {
        const month = new URL(request.url).searchParams.get("month");
        const revenue = month === "2026-01" ? [300000, 200000] : [0, 0];
        return HttpResponse.json({
          month,
          members: [
            { userId: 1, email: "charles@example.com", revenueCents: revenue[0] },
            { userId: 2, email: "mathilde@example.com", revenueCents: revenue[1] },
          ],
        });
      }),
      http.put("/api/contributions", async ({ request }) => {
        putPayload = (await request.json()) as typeof putPayload;
        return HttpResponse.json({ month: "2026-02", members: [] });
      }),
    );

    const user = userEvent.setup();
    render(<TestWrapper initialPath="/plan/wires" />);

    expect(await screen.findByText("Enter your incomes to compute wires.")).toBeInTheDocument();
    await user.click(await screen.findByRole("button", { name: /Use January.s incomes/ }));

    await waitFor(() =>
      expect(putPayload?.contributions).toEqual([
        { userId: 1, revenueCents: 300000 },
        { userId: 2, revenueCents: 200000 },
      ]),
    );
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

  it("should save one member's revenue on blur", async () => {
    setupAuthenticatedUser();
    setupSplitData();

    let putPayload: {
      month: string;
      contributions: { userId: number; revenueCents: number }[];
    } | null = null;
    server.use(
      http.put("/api/contributions", async ({ request }) => {
        putPayload = (await request.json()) as typeof putPayload;
        return HttpResponse.json({ month: "2026-02", members: [] });
      }),
    );

    const user = userEvent.setup();
    render(<TestWrapper initialPath="/plan/wires" />);

    const revenueInput = await screen.findByLabelText("charles@example.com revenue");
    expect(screen.queryByRole("button", { name: "Save" })).not.toBeInTheDocument();
    await user.clear(revenueInput);
    await user.type(revenueInput, "4500");
    await user.tab();

    await waitFor(() => expect(putPayload).not.toBeNull());
    expect(putPayload!.month).toBe("2026-02");
    expect(putPayload!.contributions).toEqual([{ userId: 1, revenueCents: 450000 }]);
  });
});
