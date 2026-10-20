import { describe, it, expect } from "vite-plus/test";
import { render, screen, within } from "@testing-library/react";
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

type TestTransaction = typeof baseTx & {
  id: number;
  dateOperation: string;
  labelSimplified: string;
  labelOperation: string;
  amount: number;
};

function setupTransactions(transactions: TestTransaction[]) {
  server.use(
    http.get("/api/transactions", () => {
      return HttpResponse.json({ transactions });
    }),
    http.get("/api/categories", () => {
      return HttpResponse.json({
        categories: [
          { id: 1, name: "Food", type: "variable", icon: "🥖" },
          { id: 2, name: "Leisure", type: "variable" },
        ],
      });
    }),
  );
}

const baseTx = {
  bankCategory: "Alimentation",
  bankSubCategory: "Hyper/supermarche",
  budgetCategoryId: 1 as number | null,
  budgetCategoryName: "Food" as string | null,
  displayName: null as string | null,
  reference: null,
  additionalInfo: null,
  operationType: "Carte bancaire",
  excluded: false,
  excludedReason: null as string | null,
  reimbursedAmount: 0,
  reimbursementNote: null as string | null,
  categoryLocked: false,
};

const carrefour: TestTransaction = {
  ...baseTx,
  id: 1,
  dateOperation: "2026-02-13",
  labelSimplified: "CARREFOUR",
  labelOperation: "CB CARREFOUR",
  amount: 1277,
};

const uber: TestTransaction = {
  ...baseTx,
  id: 2,
  dateOperation: "2026-02-15",
  labelSimplified: "UBER EATS",
  labelOperation: "CB UBER EATS",
  amount: 2820,
  bankCategory: "Restaurant",
  bankSubCategory: "Restaurant",
  budgetCategoryId: 2,
  budgetCategoryName: "Leisure",
};

const PATH = "/transactions?month=2026-02";

async function openMenu(user: ReturnType<typeof userEvent.setup>, merchant: string) {
  await user.click(await screen.findByRole("button", { name: `Actions for ${merchant}` }));
}

describe("Transactions Page", () => {
  it("should group transactions by day with title-cased merchants and daily totals", async () => {
    setupAuthenticatedUser();
    setupTransactions([carrefour, uber]);

    render(<TestWrapper initialPath={PATH} />);

    expect(await screen.findByRole("heading", { name: "Transactions" })).toBeInTheDocument();
    expect(await screen.findByText("Carrefour")).toBeInTheDocument();
    expect(screen.getByText("Uber Eats")).toBeInTheDocument();
    expect(screen.getByText(/−12\.77\s€/)).toBeInTheDocument();
    expect(screen.getByText(/−28\.20\s€/)).toBeInTheDocument();

    const dayHeaders = screen.getAllByRole("heading", { level: 2 }).map((h) => h.textContent);
    expect(dayHeaders).toEqual(["Sun 15 Feb", "Fri 13 Feb"]);
    expect(screen.getByText(/−28\s€/)).toBeInTheDocument();
  });

  it("should show the count and total of what is listed", async () => {
    setupAuthenticatedUser();
    setupTransactions([carrefour, uber]);

    render(<TestWrapper initialPath={PATH} />);

    const summary = await screen.findByText(/^2 · /);
    expect(summary).toHaveTextContent(/2\s·\s−41\s€/);
  });

  it("should prefer the merchant alias over the bank label", async () => {
    setupAuthenticatedUser();
    setupTransactions([{ ...carrefour, displayName: "Le Carrouf" }]);

    render(<TestWrapper initialPath={PATH} />);

    expect(await screen.findByText("Le Carrouf")).toBeInTheDocument();
    expect(screen.queryByText("Carrefour")).not.toBeInTheDocument();
  });

  it("should show empty state when no transactions", async () => {
    setupAuthenticatedUser();
    setupTransactions([]);

    render(<TestWrapper initialPath={PATH} />);

    expect(await screen.findByText("No transactions for this month.")).toBeInTheDocument();
  });

  it("should filter by merchant search", async () => {
    const user = userEvent.setup();
    setupAuthenticatedUser();
    setupTransactions([carrefour, uber]);

    render(<TestWrapper initialPath={PATH} />);

    await user.type(await screen.findByRole("searchbox", { name: "Search merchant" }), "uber");

    expect(screen.getByText("Uber Eats")).toBeInTheDocument();
    expect(screen.queryByText("Carrefour")).not.toBeInTheDocument();
    expect(screen.getByText(/^1 · /)).toBeInTheDocument();
  });

  it("should filter by category and explain when nothing matches", async () => {
    const user = userEvent.setup();
    setupAuthenticatedUser();
    setupTransactions([carrefour, uber]);

    render(<TestWrapper initialPath={PATH} />);

    const filter = await screen.findByRole("combobox", { name: "Filter by category" });
    await screen.findByRole("option", { name: /Leisure/ });
    await user.selectOptions(filter, "2");
    expect(screen.queryByText("Carrefour")).not.toBeInTheDocument();
    expect(screen.getByText("Uber Eats")).toBeInTheDocument();

    await user.selectOptions(filter, "uncategorized");
    expect(screen.getByText("No transactions match your filters.")).toBeInTheDocument();
  });

  it("should keep Exclude and Reimburse in the row menu", async () => {
    const user = userEvent.setup();
    setupAuthenticatedUser();
    setupTransactions([carrefour]);

    render(<TestWrapper initialPath={PATH} />);

    expect(await screen.findByText("Carrefour")).toBeInTheDocument();
    expect(screen.queryByRole("menuitem", { name: "Exclude" })).not.toBeInTheDocument();

    await openMenu(user, "Carrefour");

    expect(screen.getByRole("menuitem", { name: "Exclude" })).toBeInTheDocument();
    expect(screen.getByRole("menuitem", { name: "Reimburse" })).toBeInTheDocument();
    expect(screen.getByRole("menuitem", { name: "Change category" })).toBeInTheDocument();
  });

  it("should offer Include for excluded transactions and tag them instead of striking through", async () => {
    const user = userEvent.setup();
    setupAuthenticatedUser();
    setupTransactions([
      {
        ...carrefour,
        labelSimplified: "BANK FEE",
        budgetCategoryId: null,
        budgetCategoryName: null,
        excluded: true,
        excludedReason: "Reimbursed by bank",
      },
    ]);

    render(<TestWrapper initialPath={PATH} />);

    expect(await screen.findByText("excluded")).toBeInTheDocument();
    expect(screen.getByText("Reimbursed by bank")).toBeInTheDocument();

    await openMenu(user, "Bank Fee");
    expect(screen.getByRole("menuitem", { name: "Include" })).toBeInTheDocument();
    expect(screen.queryByRole("menuitem", { name: "Reimburse" })).not.toBeInTheDocument();
  });

  it("should not count excluded transactions in the totals", async () => {
    setupAuthenticatedUser();
    setupTransactions([carrefour, { ...uber, id: 3, excluded: true }]);

    render(<TestWrapper initialPath={PATH} />);

    const summary = await screen.findByText(/^2 · /);
    expect(summary).toHaveTextContent(/2\s·\s−13\s€/);
  });

  it("should open the exclude modal from the menu", async () => {
    const user = userEvent.setup();
    setupAuthenticatedUser();
    setupTransactions([carrefour]);

    render(<TestWrapper initialPath={PATH} />);

    await openMenu(user, "Carrefour");
    await user.click(screen.getByRole("menuitem", { name: "Exclude" }));

    expect(screen.getByText("Exclude transaction")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("e.g. Reimbursed by bank")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Cancel" })).toBeInTheDocument();
  });

  it("should show reimbursement note and effective amount when reimbursedAmount > 0", async () => {
    const user = userEvent.setup();
    setupAuthenticatedUser();
    setupTransactions([
      {
        ...carrefour,
        labelSimplified: "VET CLINIC",
        amount: 5000,
        reimbursedAmount: 3000,
        reimbursementNote: "Dog insurance",
      },
    ]);

    render(<TestWrapper initialPath={PATH} />);

    expect(await screen.findByText("Vet Clinic")).toBeInTheDocument();
    expect(screen.getByText("Dog insurance")).toBeInTheDocument();
    // Effective amount shown, original struck-through
    expect(screen.getAllByText(/−20\.00\s€/).length).toBeGreaterThan(0);
    expect(screen.getByText(/−50\.00\s€/)).toBeInTheDocument();

    await openMenu(user, "Vet Clinic");
    expect(screen.getByRole("menuitem", { name: "Clear reimbursement" })).toBeInTheDocument();
  });

  it("should open the reimburse modal from the menu", async () => {
    const user = userEvent.setup();
    setupAuthenticatedUser();
    setupTransactions([{ ...carrefour, labelSimplified: "VET CLINIC", amount: 5000 }]);

    render(<TestWrapper initialPath={PATH} />);

    await openMenu(user, "Vet Clinic");
    await user.click(screen.getByRole("menuitem", { name: "Reimburse" }));

    expect(screen.getByText("Add reimbursement")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("e.g. Insurance reimbursement")).toBeInTheDocument();
  });

  it("should update the merchant rule by default when changing the category chip", async () => {
    const user = userEvent.setup();
    setupAuthenticatedUser();
    setupTransactions([carrefour]);
    let payload: unknown = null;
    server.use(
      http.post("/api/mapping-rules/classify", async ({ request }) => {
        payload = await request.json();
        return HttpResponse.json({ rule: {}, updatedCount: 3 });
      }),
    );

    render(<TestWrapper initialPath={PATH} />);

    await user.click(await screen.findByRole("button", { name: "Change category of Carrefour" }));
    const dialog = screen.getByRole("dialog", { name: "Change category" });
    await within(dialog).findByRole("option", { name: /Leisure/ });
    await user.selectOptions(within(dialog).getByRole("combobox"), "2");
    expect(
      within(dialog).getByRole("radio", { name: /All “Carrefour” transactions/ }),
    ).toBeChecked();
    await user.click(within(dialog).getByRole("button", { name: "Save" }));

    await screen.findByText("Carrefour");
    expect(payload).toEqual({
      bankSubCategory: "Hyper/supermarche",
      labelSimplified: "CARREFOUR",
      budgetCategoryId: 2,
    });
    expect(screen.queryByRole("dialog", { name: "Change category" })).not.toBeInTheDocument();
  });

  it("should override only this transaction with Just this one", async () => {
    const user = userEvent.setup();
    setupAuthenticatedUser();
    setupTransactions([carrefour]);
    let payload: unknown = null;
    let calledPath = "";
    server.use(
      http.patch("/api/transactions/:id/category", async ({ request, params }) => {
        payload = await request.json();
        calledPath = String(params.id);
        return HttpResponse.json({ ...carrefour, categoryLocked: true });
      }),
    );

    render(<TestWrapper initialPath={PATH} />);

    await openMenu(user, "Carrefour");
    await user.click(screen.getByRole("menuitem", { name: "Change category" }));
    const dialog = screen.getByRole("dialog", { name: "Change category" });
    await within(dialog).findByRole("option", { name: /Leisure/ });
    await user.selectOptions(within(dialog).getByRole("combobox"), "2");
    await user.click(within(dialog).getByRole("radio", { name: "Just this one" }));
    await user.click(within(dialog).getByRole("button", { name: "Save" }));

    await screen.findByText("Carrefour");
    expect(calledPath).toBe("1");
    expect(payload).toEqual({ budgetCategoryId: 2 });
  });

  it("should flag manually set categories", async () => {
    setupAuthenticatedUser();
    setupTransactions([{ ...carrefour, categoryLocked: true }]);

    render(<TestWrapper initialPath={PATH} />);

    expect(await screen.findByLabelText("Set manually")).toBeInTheDocument();
  });
});
