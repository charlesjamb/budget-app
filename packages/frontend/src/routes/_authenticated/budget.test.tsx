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

function setupBudgetData() {
  server.use(
    http.get("/api/categories", () => {
      return HttpResponse.json({
        categories: [
          { id: 1, name: "Loyer", groupName: "Dépenses Fixes" },
          { id: 2, name: "Assurance", groupName: "Dépenses Fixes" },
          { id: 3, name: "Courses", groupName: "Budget couple" },
          { id: 4, name: "Divers" },
        ],
      });
    }),
    http.get("/api/budgets", () => {
      return HttpResponse.json({
        month: "2026-02",
        budgets: [
          { categoryId: 0, amountCents: 300000 },
          { categoryId: 1, amountCents: 80000 },
          { categoryId: 3, amountCents: 40000 },
        ],
      });
    }),
    http.get("/api/transactions/monthly-summary", () => {
      return HttpResponse.json({
        month: "2026-02",
        totalAmount: 150000,
        globalBudgetCents: 300000,
        categories: [
          {
            id: 1,
            name: "Loyer",
            totalAmount: 80000,
            transactionCount: 1,
            budgetAmountCents: 80000,
          },
          {
            id: 3,
            name: "Courses",
            totalAmount: 35000,
            transactionCount: 8,
            budgetAmountCents: 40000,
          },
        ],
        uncategorized: { totalAmount: 35000, transactionCount: 3 },
      });
    }),
    http.get("/api/transactions", () => {
      return HttpResponse.json({ transactions: [] });
    }),
  );
}

describe("Budget Page", () => {
  it("should display grouped categories", async () => {
    setupAuthenticatedUser();
    setupBudgetData();

    render(<TestWrapper initialPath="/budget" />);

    expect(await screen.findByText("Loyer")).toBeInTheDocument();
    expect(screen.getByText("Assurance")).toBeInTheDocument();
    expect(screen.getByText("Courses")).toBeInTheDocument();
    expect(screen.getByText("Divers")).toBeInTheDocument();
  });

  it("should show group section headers", async () => {
    setupAuthenticatedUser();
    setupBudgetData();

    render(<TestWrapper initialPath="/budget" />);

    expect(await screen.findByText("Dépenses Fixes")).toBeInTheDocument();
    expect(screen.getByText("Budget couple")).toBeInTheDocument();
    expect(screen.getByText("Other")).toBeInTheDocument();
  });

  it("should show global monthly cap section", async () => {
    setupAuthenticatedUser();
    setupBudgetData();

    render(<TestWrapper initialPath="/budget" />);

    expect(await screen.findByText("Global monthly cap")).toBeInTheDocument();
    expect(screen.getByText("Spent: 1500.00 \u20AC")).toBeInTheDocument();
  });

  it("should show empty state when no categories", async () => {
    setupAuthenticatedUser();
    server.use(
      http.get("/api/categories", () => {
        return HttpResponse.json({ categories: [] });
      }),
      http.get("/api/budgets", () => {
        return HttpResponse.json({ month: "2026-02", budgets: [] });
      }),
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

    render(<TestWrapper initialPath="/budget" />);

    expect(
      await screen.findByText(
        "No categories yet. Create some in the Categories page first.",
      ),
    ).toBeInTheDocument();
  });
});
