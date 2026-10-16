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

describe("Categories Page", () => {
  it("should display categories and allow adding new ones", async () => {
    setupAuthenticatedUser();
    server.use(
      http.get("/api/categories", () => {
        return HttpResponse.json({
          categories: [
            { id: 1, name: "Food", type: "variable" },
            { id: 2, name: "Transport", type: "variable" },
          ],
        });
      }),
      http.post("/api/categories", async ({ request }) => {
        const body = (await request.json()) as { name: string; type?: string };
        return HttpResponse.json(
          {
            category: {
              id: 3,
              name: body.name,
              type: body.type ?? "variable",
            },
          },
          { status: 201 },
        );
      }),
    );

    render(<TestWrapper initialPath="/categories" />);

    expect(await screen.findByText("Food")).toBeInTheDocument();
    expect(screen.getByText("Transport")).toBeInTheDocument();

    const user = userEvent.setup();
    await user.type(screen.getByPlaceholderText("New category name..."), "Entertainment");
    await user.click(screen.getByRole("button", { name: "Add" }));

    await waitFor(() => {
      expect(screen.getByPlaceholderText("New category name...")).toHaveValue("");
    });
  });

  it("should show empty state when no categories exist", async () => {
    setupAuthenticatedUser();
    server.use(
      http.get("/api/categories", () => {
        return HttpResponse.json({ categories: [] });
      }),
    );

    render(<TestWrapper initialPath="/categories" />);

    expect(
      await screen.findByText("No categories yet. Add your first one above!"),
    ).toBeInTheDocument();
  });
});
