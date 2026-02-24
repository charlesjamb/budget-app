import { describe, it, expect } from "vitest";
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

describe("Dashboard Page", () => {
  it("should show empty state when no transactions", async () => {
    setupAuthenticatedUser();
    server.use(
      http.get("/api/transactions/monthly-summary", () => {
        return HttpResponse.json({
          month: "2026-02",
          totalAmount: 0,
          categories: [],
          uncategorized: { totalAmount: 0, transactionCount: 0 },
        });
      }),
      http.get("/api/transactions", () => {
        return HttpResponse.json({ transactions: [] });
      }),
    );

    render(<TestWrapper initialPath="/" />);

    expect(
      await screen.findByText("No transactions for this month."),
    ).toBeInTheDocument();
  });

  it("should display monthly summary with categories", async () => {
    setupAuthenticatedUser();
    server.use(
      http.get("/api/transactions/monthly-summary", () => {
        return HttpResponse.json({
          month: "2026-02",
          totalAmount: 15000,
          categories: [
            {
              id: 1,
              name: "Food",
              totalAmount: 10000,
              transactionCount: 5,
              type: "variable",
            },
            {
              id: 2,
              name: "Transport",
              totalAmount: 5000,
              transactionCount: 2,
              type: "variable",
            },
          ],
          uncategorized: { totalAmount: 0, transactionCount: 0 },
        });
      }),
      http.get("/api/transactions", () => {
        return HttpResponse.json({ transactions: [] });
      }),
    );

    render(<TestWrapper initialPath="/" />);

    expect(await screen.findByText("Food")).toBeInTheDocument();
    expect(screen.getByText("Transport")).toBeInTheDocument();
    expect(screen.getByText("Variable expenses")).toBeInTheDocument();
    expect(screen.getAllByText("150.00 \u20AC").length).toBeGreaterThan(0);
  });

  it("should show fixed and variable expense sections with subtotals", async () => {
    setupAuthenticatedUser();
    server.use(
      http.get("/api/transactions/monthly-summary", () => {
        return HttpResponse.json({
          month: "2026-02",
          totalAmount: 15000,
          categories: [
            {
              id: 1,
              name: "Rent",
              totalAmount: 80000,
              transactionCount: 1,
              type: "fixed",
            },
            {
              id: 2,
              name: "Groceries",
              totalAmount: 70000,
              transactionCount: 5,
              type: "variable",
            },
          ],
          uncategorized: { totalAmount: 0, transactionCount: 0 },
        });
      }),
      http.get("/api/transactions", () => {
        return HttpResponse.json({ transactions: [] });
      }),
    );

    render(<TestWrapper initialPath="/" />);

    expect(await screen.findByText("Fixed expenses")).toBeInTheDocument();
    expect(screen.getByText("Variable expenses")).toBeInTheDocument();
    expect(screen.getByText("Rent")).toBeInTheDocument();
    expect(screen.getByText("Groceries")).toBeInTheDocument();
    expect(screen.getAllByText("800.00 \u20AC").length).toBeGreaterThan(0);
    expect(screen.getAllByText("700.00 \u20AC").length).toBeGreaterThan(0);
  });
});
