import { describe, it, expect } from "vite-plus/test";
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

describe("Classify Page", () => {
  it("should show empty state when everything is classified", async () => {
    setupAuthenticatedUser();
    server.use(
      http.get("/api/transactions/uncategorized-subcategories", () => {
        return HttpResponse.json({ subcategories: [] });
      }),
      http.get("/api/categories", () => {
        return HttpResponse.json({ categories: [] });
      }),
    );

    render(<TestWrapper initialPath="/classify" />);

    expect(
      await screen.findByText("All transactions are classified! Nothing to do here."),
    ).toBeInTheDocument();
  });

  it("should display groups by (sub-category, label) pair", async () => {
    setupAuthenticatedUser();
    server.use(
      http.get("/api/transactions/uncategorized-subcategories", () => {
        return HttpResponse.json({
          subcategories: [
            {
              bankSubCategory: "Hyper/supermarche",
              labelSimplified: "CARREFOUR MARKET",
              count: 2,
              transactions: [
                {
                  id: 1,
                  dateOperation: "2026-02-07",
                  labelSimplified: "CARREFOUR MARKET",
                  labelOperation: "CB CARREFOUR MARKE",
                  amount: 1277,
                },
                {
                  id: 2,
                  dateOperation: "2026-02-12",
                  labelSimplified: "CARREFOUR MARKET",
                  labelOperation: "CB CARREFOUR MARKE",
                  amount: 900,
                },
              ],
            },
            {
              bankSubCategory: "Restaurant",
              labelSimplified: "UBER EATS",
              count: 1,
              transactions: [
                {
                  id: 3,
                  dateOperation: "2026-02-06",
                  labelSimplified: "UBER EATS",
                  labelOperation: "CB UBER EATS",
                  amount: 2820,
                },
              ],
            },
          ],
        });
      }),
      http.get("/api/categories", () => {
        return HttpResponse.json({
          categories: [
            { id: 1, name: "Food", type: "variable" },
            { id: 2, name: "Going Out", type: "variable" },
          ],
        });
      }),
    );

    render(<TestWrapper initialPath="/classify" />);

    // One merchant at a time, with progress
    expect(await screen.findByRole("heading", { name: "CARREFOUR MARKET" })).toBeInTheDocument();
    expect(screen.getByText("1 / 2")).toBeInTheDocument();
    expect(screen.queryByText("UBER EATS")).not.toBeInTheDocument();

    await userEvent.click(screen.getByRole("button", { name: "Skip" }));
    expect(await screen.findByRole("heading", { name: "UBER EATS" })).toBeInTheDocument();
  });

  it("should suggest categories used by rules of the same sub-category and classify on click", async () => {
    setupAuthenticatedUser();
    let classifyBody: unknown = null;
    server.use(
      http.get("/api/transactions/uncategorized-subcategories", () =>
        HttpResponse.json({
          subcategories: [
            {
              bankSubCategory: "Restaurant",
              labelSimplified: "UBER EATS",
              count: 1,
              transactions: [
                {
                  id: 3,
                  dateOperation: "2026-02-06",
                  labelSimplified: "UBER EATS",
                  labelOperation: "CB UBER EATS",
                  amount: 2820,
                },
              ],
            },
          ],
        }),
      ),
      http.get("/api/categories", () =>
        HttpResponse.json({
          categories: [
            { id: 1, name: "Food", type: "variable" },
            { id: 2, name: "Going Out", type: "variable" },
          ],
        }),
      ),
      http.get("/api/mapping-rules", () =>
        HttpResponse.json({
          rules: [
            {
              id: 9,
              bankSubCategory: "Restaurant",
              labelSimplified: "BISTROT",
              budgetCategoryId: 2,
            },
          ],
        }),
      ),
      http.post("/api/mapping-rules/classify", async ({ request }) => {
        classifyBody = await request.json();
        return HttpResponse.json({ updatedCount: 1 });
      }),
    );

    render(<TestWrapper initialPath="/classify" />);

    expect(await screen.findByText("Suggested")).toBeInTheDocument();
    await userEvent.click(await screen.findByRole("button", { name: "Going Out" }));

    await waitFor(() =>
      expect(classifyBody).toEqual({
        bankSubCategory: "Restaurant",
        labelSimplified: "UBER EATS",
        budgetCategoryId: 2,
      }),
    );
  });
});
