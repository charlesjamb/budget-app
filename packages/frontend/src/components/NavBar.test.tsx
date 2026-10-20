import { afterEach, beforeEach, describe, it, expect, vi } from "vite-plus/test";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { http, HttpResponse } from "msw";
import { server } from "../mocks/server.js";
import { TestWrapper } from "../test/TestWrapper.js";

function setupDashboard(unclassified: number[] = []) {
  server.use(
    http.get("/api/auth/me", () =>
      HttpResponse.json({ user: { id: 1, email: "test@example.com" }, householdId: 1 }),
    ),
    http.get("/api/transactions/monthly-summary", () =>
      HttpResponse.json({
        month: "2026-11",
        totalAmount: 0,
        categories: [],
        uncategorized: { totalAmount: 0, transactionCount: 0 },
      }),
    ),
    http.get("/api/transactions", () => HttpResponse.json({ transactions: [] })),
    http.get("/api/transactions/uncategorized-subcategories", () =>
      HttpResponse.json({
        subcategories: unclassified.map((count, i) => ({
          bankSubCategory: `sub ${i}`,
          labelSimplified: `label ${i}`,
          count,
          transactions: [],
        })),
      }),
    ),
  );
}

describe("NavBar", () => {
  beforeEach(() => {
    // Day 3 of November: plan November, close October.
    vi.setSystemTime(new Date(2026, 10, 3, 12, 0, 0));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("groups the monthly flows under Plan and Close with the relevant month", async () => {
    setupDashboard();
    render(<TestWrapper initialPath="/" />);

    const sidebar = (await screen.findByText("Plan · Nov")).closest("nav") as HTMLElement;
    expect(within(sidebar).getByText("Close · Oct")).toBeInTheDocument();

    expect(within(sidebar).getByRole("link", { name: /Budget/ })).toHaveAttribute(
      "href",
      "/budget?month=2026-11",
    );
    expect(within(sidebar).getByRole("link", { name: /Wires/ })).toHaveAttribute(
      "href",
      "/plan/wires?month=2026-11",
    );
    expect(within(sidebar).getByRole("link", { name: /Settle up/ })).toHaveAttribute(
      "href",
      "/close/settle?month=2026-10",
    );
  });

  it("shows the number of transactions to classify on the Classify link", async () => {
    setupDashboard([2, 1]);
    render(<TestWrapper initialPath="/" />);

    expect(await screen.findByRole("link", { name: /Classify\s*3/ })).toBeInTheDocument();
  });

  it("opens the menu sheet from the mobile tab bar", async () => {
    setupDashboard();
    const user = userEvent.setup();
    render(<TestWrapper initialPath="/" />);

    await screen.findByText("Plan · Nov");
    const tabs = screen.getByLabelText("Main");
    expect(within(tabs).getByRole("link", { name: "Month", hidden: true })).toHaveAttribute(
      "href",
      "/budget?month=2026-11",
    );

    await user.click(within(tabs).getByRole("button", { name: "Menu", hidden: true }));

    const sheet = screen.getByRole("dialog", { name: "Menu" });
    expect(within(sheet).getByRole("link", { name: "History" })).toBeInTheDocument();
    expect(within(sheet).getByRole("link", { name: "Categories" })).toBeInTheDocument();
    expect(within(sheet).getByRole("link", { name: "Settings" })).toBeInTheDocument();
    expect(within(sheet).getByRole("button", { name: "Logout" })).toBeInTheDocument();
  });
});
