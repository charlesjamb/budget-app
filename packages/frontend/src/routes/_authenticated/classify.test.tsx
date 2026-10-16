import { describe, it, expect } from "vite-plus/test";
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

    // Label is the primary display
    expect(await screen.findByText("CARREFOUR MARKET")).toBeInTheDocument();
    expect(screen.getByText("UBER EATS")).toBeInTheDocument();
  });
});
