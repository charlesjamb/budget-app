import { describe, it, expect } from "vite-plus/test";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { http, HttpResponse } from "msw";
import { server } from "../../mocks/server.js";
import { TestWrapper } from "../../test/TestWrapper.js";

function setupSettings() {
  server.use(
    http.get("/api/auth/me", () =>
      HttpResponse.json({
        user: { id: 1, email: "test@example.com", displayName: "Charles" },
        householdId: 1,
      }),
    ),
    http.get("/api/categories", () =>
      HttpResponse.json({ categories: [{ id: 1, name: "Food", type: "variable" }] }),
    ),
    http.get("/api/merchant-aliases", () => HttpResponse.json({ aliases: [] })),
    http.get("/api/mapping-rules", () =>
      HttpResponse.json({
        rules: [
          {
            id: 1,
            bankSubCategory: "Hyper/supermarche",
            labelSimplified: "CARREFOUR",
            budgetCategoryId: 1,
            budgetCategoryName: "Food",
          },
          {
            id: 2,
            bankSubCategory: "Restaurant",
            labelSimplified: "UBER EATS",
            budgetCategoryId: 1,
            budgetCategoryName: "Food",
          },
        ],
      }),
    ),
  );
}

describe("Settings Page", () => {
  it("should show the profile and save a new display name on blur", async () => {
    setupSettings();
    let patchBody: unknown = null;
    server.use(
      http.patch("/api/auth/me", async ({ request }) => {
        patchBody = await request.json();
        return HttpResponse.json({
          user: { id: 1, email: "test@example.com", displayName: "Charly" },
          householdId: 1,
        });
      }),
    );

    const user = userEvent.setup();
    render(<TestWrapper initialPath="/settings" />);

    const input = await screen.findByLabelText("Display name");
    expect(input).toHaveValue("Charles");
    expect(screen.getByText("test@example.com")).toBeInTheDocument();

    await user.clear(input);
    await user.type(input, "Charly");
    await user.tab();

    await waitFor(() => expect(patchBody).toEqual({ displayName: "Charly" }));
    expect(await screen.findByText("✓ Saved")).toBeInTheDocument();
  });

  it("should filter mapping rules with the search box", async () => {
    setupSettings();

    const user = userEvent.setup();
    render(<TestWrapper initialPath="/settings" />);

    expect(await screen.findByText("CARREFOUR")).toBeInTheDocument();
    expect(screen.getByText("UBER EATS")).toBeInTheDocument();

    await user.type(screen.getByLabelText("Search rules"), "uber");

    expect(screen.queryByText("CARREFOUR")).not.toBeInTheDocument();
    expect(screen.getByText("UBER EATS")).toBeInTheDocument();
  });
});
