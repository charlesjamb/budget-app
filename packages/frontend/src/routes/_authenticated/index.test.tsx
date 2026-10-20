import { describe, it, expect } from "vite-plus/test";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { http, HttpResponse } from "msw";
import { server } from "../../mocks/server.js";
import { TestWrapper } from "../../test/TestWrapper.js";

function setupAuthenticatedUser(displayName: string | null = null) {
  server.use(
    http.get("/api/auth/me", () => {
      return HttpResponse.json({
        user: { id: 1, email: "test@example.com", displayName },
        householdId: 1,
      });
    }),
  );
}

const summary = {
  month: "2026-02",
  totalAmount: 116500,
  globalBudgetCents: 117000,
  categories: [
    {
      id: 1,
      name: "Food",
      icon: "🥖",
      type: "variable",
      totalAmount: 7750,
      transactionCount: 5,
      budgetAmountCents: 10000,
    },
    {
      id: 2,
      name: "Fun",
      type: "variable",
      totalAmount: 2000,
      transactionCount: 2,
      budgetAmountCents: 10000,
    },
    {
      id: 3,
      name: "Rent",
      type: "fixed",
      totalAmount: 80000,
      transactionCount: 1,
      budgetAmountCents: 80000,
    },
    {
      id: 4,
      name: "Gym",
      type: "fixed",
      totalAmount: 3000,
      transactionCount: 1,
      budgetAmountCents: 5000,
    },
    {
      id: 5,
      name: "Taxes",
      type: "fixed",
      totalAmount: 20000,
      transactionCount: 1,
      budgetAmountCents: 12000,
    },
    {
      id: 6,
      name: "Health",
      type: "variable",
      totalAmount: 3750,
      transactionCount: 1,
    },
  ],
  uncategorized: { totalAmount: 0, transactionCount: 0 },
};

const foodTransaction = {
  id: 10,
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
  reimbursedAmount: 0,
  reimbursementNote: null,
  categoryLocked: false,
};

function setupSummary(overrides: Partial<typeof summary> = {}, transactions: object[] = []) {
  server.use(
    http.get("/api/transactions/monthly-summary", () =>
      HttpResponse.json({ ...summary, ...overrides }),
    ),
    http.get("/api/transactions", () => HttpResponse.json({ transactions })),
  );
}

describe("Dashboard Page", () => {
  it("should show empty state when no transactions", async () => {
    setupAuthenticatedUser();
    setupSummary({ totalAmount: 0, categories: [], globalBudgetCents: undefined });

    render(<TestWrapper initialPath="/?month=2026-02" />);

    expect(await screen.findByText("No transactions for this month.")).toBeInTheDocument();
  });

  it("should greet the current user by display name", async () => {
    setupAuthenticatedUser("Charles");
    setupSummary();

    render(<TestWrapper initialPath="/?month=2026-02" />);

    expect(await screen.findByRole("heading", { name: "Hi Charles" })).toBeInTheDocument();
  });

  it("should show how much is left of the budget in the hero", async () => {
    setupAuthenticatedUser();
    setupSummary();

    render(<TestWrapper initialPath="/?month=2026-02" />);

    await screen.findByText("Food");
    expect(document.body).toHaveTextContent(/5\s€\s*left/);
    expect(document.body).toHaveTextContent(/of\s1\s170\s€\s·\s1\s165\s€\sspent/);
  });

  it("should show how much is over when the budget is exceeded", async () => {
    setupAuthenticatedUser();
    setupSummary({ totalAmount: 120000 });

    render(<TestWrapper initialPath="/?month=2026-02" />);

    await screen.findByText("Food");
    expect(document.body).toHaveTextContent(/30\s€\s*over/);
  });

  it("should float over-budget categories to Needs attention", async () => {
    setupAuthenticatedUser();
    setupSummary();

    render(<TestWrapper initialPath="/?month=2026-02" />);

    const heading = await screen.findByRole("heading", { name: "Needs attention" });
    const card = heading.nextElementSibling as HTMLElement;
    expect(within(card).getByText("Taxes")).toBeInTheDocument();
    expect(within(card).getByText(/\+80\s€\sover/)).toBeInTheDocument();
    expect(within(card).queryByText("Food")).not.toBeInTheDocument();
  });

  it("should list variable categories with what is left", async () => {
    setupAuthenticatedUser();
    setupSummary();

    render(<TestWrapper initialPath="/?month=2026-02" />);

    expect(await screen.findByText("Food")).toBeInTheDocument();
    expect(screen.getByText("🥖")).toBeInTheDocument();
    expect(screen.getByText(/23\s€\sleft/)).toBeInTheDocument();
    expect(screen.getByText("Fun")).toBeInTheDocument();
  });

  it("should collapse fixed expenses into a summary and expand on demand", async () => {
    const user = userEvent.setup();
    setupAuthenticatedUser();
    setupSummary();

    render(<TestWrapper initialPath="/?month=2026-02" />);

    const toggle = await screen.findByRole("button", { name: /1 of 2 paid/ });
    expect(toggle).toHaveTextContent(/830\s€/);
    expect(screen.queryByText("Rent")).not.toBeInTheDocument();

    await user.click(toggle);

    expect(screen.getByText("Rent")).toBeInTheDocument();
    expect(screen.getByText("paid ✓")).toBeInTheDocument();
    expect(screen.getByText("Gym")).toBeInTheDocument();
  });

  it("should show unbudgeted spending as a callout linking to the budget", async () => {
    setupAuthenticatedUser();
    setupSummary();

    render(<TestWrapper initialPath="/?month=2026-02" />);

    const callout = (await screen.findByText("Unbudgeted")).closest("aside") as HTMLElement;
    expect(callout).toHaveTextContent(/38\s€\s·\sHealth/);
    expect(within(callout).getByRole("link", { name: "→ Budget" })).toHaveAttribute(
      "href",
      "/budget?month=2026-02",
    );
    // Unbudgeted categories are not listed as rows.
    expect(screen.queryByRole("button", { name: /Health/ })).not.toBeInTheDocument();
  });

  it("should show the transactions of a category when its row is expanded", async () => {
    const user = userEvent.setup();
    setupAuthenticatedUser();
    setupSummary({}, [foodTransaction]);

    render(<TestWrapper initialPath="/?month=2026-02" />);

    await user.click(await screen.findByRole("button", { name: /Food/ }));

    expect(screen.getByText("CARREFOUR")).toBeInTheDocument();
    expect(screen.getByText(/12\.77\s€/)).toBeInTheDocument();
  });

  it("should show uncategorized transactions as their own row", async () => {
    setupAuthenticatedUser();
    setupSummary({
      totalAmount: 119000,
      uncategorized: { totalAmount: 2500, transactionCount: 2 },
    });

    render(<TestWrapper initialPath="/?month=2026-02" />);

    expect(await screen.findByRole("heading", { name: "Uncategorized" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Uncategorized/ })).toBeInTheDocument();
  });
});
