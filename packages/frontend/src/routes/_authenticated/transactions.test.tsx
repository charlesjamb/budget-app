import { describe, it, expect } from "vitest";
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

function setupTransactions(
  transactions: Array<{
    id: number;
    dateOperation: string;
    labelSimplified: string;
    labelOperation: string;
    amount: number;
    bankCategory: string;
    bankSubCategory: string;
    budgetCategoryId: number | null;
    budgetCategoryName: string | null;
    displayName: string | null;
    reference: string | null;
    additionalInfo: string | null;
    operationType: string;
    excluded: boolean;
    excludedReason: string | null;
  }>,
) {
  server.use(
    http.get("/api/transactions", () => {
      return HttpResponse.json({ transactions });
    }),
  );
}

describe("Transactions Page", () => {
  it("should display transactions for the selected month", async () => {
    setupAuthenticatedUser();
    setupTransactions([
      {
        id: 1,
        dateOperation: "2026-02-13",
        labelSimplified: "CARREFOUR",
        labelOperation: "CB CARREFOUR",
        amount: 1277,
        bankCategory: "Alimentation",
        bankSubCategory: "Hyper/supermarche",
        budgetCategoryId: 1,
        budgetCategoryName: "Food",
        displayName: null,
        reference: null,
        additionalInfo: null,
        operationType: "Carte bancaire",
        excluded: false,
        excludedReason: null,
      },
      {
        id: 2,
        dateOperation: "2026-02-15",
        labelSimplified: "UBER EATS",
        labelOperation: "CB UBER EATS",
        amount: 2820,
        bankCategory: "Restaurant",
        bankSubCategory: "Restaurant",
        budgetCategoryId: 1,
        budgetCategoryName: "Food",
        displayName: null,
        reference: null,
        additionalInfo: null,
        operationType: "Carte bancaire",
        excluded: false,
        excludedReason: null,
      },
    ]);

    render(<TestWrapper initialPath="/transactions" />);

    expect(
      await screen.findByRole("heading", { name: "Transactions" }),
    ).toBeInTheDocument();
    expect(await screen.findByText("CARREFOUR")).toBeInTheDocument();
    expect(screen.getByText("UBER EATS")).toBeInTheDocument();
    expect(screen.getAllByText("Food")).toHaveLength(2);
    expect(screen.getByText("12.77 €")).toBeInTheDocument();
    expect(screen.getByText("28.20 €")).toBeInTheDocument();
  });

  it("should show empty state when no transactions", async () => {
    setupAuthenticatedUser();
    setupTransactions([]);

    render(<TestWrapper initialPath="/transactions" />);

    expect(
      await screen.findByText("No transactions for this month."),
    ).toBeInTheDocument();
  });

  it("should show Exclude button for non-excluded transactions", async () => {
    setupAuthenticatedUser();
    setupTransactions([
      {
        id: 1,
        dateOperation: "2026-02-13",
        labelSimplified: "CARREFOUR",
        labelOperation: "CB CARREFOUR",
        amount: 1277,
        bankCategory: "Alimentation",
        bankSubCategory: "Hyper/supermarche",
        budgetCategoryId: 1,
        budgetCategoryName: "Food",
        displayName: null,
        reference: null,
        additionalInfo: null,
        operationType: "Carte bancaire",
        excluded: false,
        excludedReason: null,
      },
    ]);

    render(<TestWrapper initialPath="/transactions" />);

    expect(await screen.findByText("Exclude")).toBeInTheDocument();
  });

  it("should show Include button for excluded transactions", async () => {
    setupAuthenticatedUser();
    setupTransactions([
      {
        id: 1,
        dateOperation: "2026-02-13",
        labelSimplified: "BANK FEE",
        labelOperation: "CB BANK FEE",
        amount: 500,
        bankCategory: "Frais",
        bankSubCategory: "Frais",
        budgetCategoryId: null,
        budgetCategoryName: null,
        displayName: null,
        reference: null,
        additionalInfo: null,
        operationType: "Prélèvement",
        excluded: true,
        excludedReason: "Reimbursed by bank",
      },
    ]);

    render(<TestWrapper initialPath="/transactions" />);

    expect(await screen.findByText("Include")).toBeInTheDocument();
    expect(screen.getByText("(Reimbursed by bank)")).toBeInTheDocument();
  });

  it("should open exclude modal when clicking Exclude", async () => {
    const user = userEvent.setup();
    setupAuthenticatedUser();
    setupTransactions([
      {
        id: 1,
        dateOperation: "2026-02-13",
        labelSimplified: "CARREFOUR",
        labelOperation: "CB CARREFOUR",
        amount: 1277,
        bankCategory: "Alimentation",
        bankSubCategory: "Hyper/supermarche",
        budgetCategoryId: 1,
        budgetCategoryName: "Food",
        displayName: null,
        reference: null,
        additionalInfo: null,
        operationType: "Carte bancaire",
        excluded: false,
        excludedReason: null,
      },
    ]);

    render(<TestWrapper initialPath="/transactions" />);

    const excludeButton = await screen.findByText("Exclude");
    await user.click(excludeButton);

    expect(screen.getByText("Exclude transaction")).toBeInTheDocument();
    expect(
      screen.getByPlaceholderText("e.g. Reimbursed by bank"),
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Cancel" })).toBeInTheDocument();
    const excludeButtons = screen.getAllByRole("button", { name: "Exclude" });
    expect(excludeButtons.length).toBeGreaterThanOrEqual(1);
  });
});
