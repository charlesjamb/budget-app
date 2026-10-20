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
    let createBody: unknown = null;
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
        createBody = body;
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
    await user.click(screen.getByRole("button", { name: "+ New category" }));
    await user.type(screen.getByLabelText("Category name"), "Entertainment");
    await user.click(screen.getByRole("button", { name: "Save" }));

    await waitFor(() => {
      expect(screen.queryByLabelText("Category name")).not.toBeInTheDocument();
    });
    expect(createBody).toEqual({ name: "Entertainment", type: "variable" });
  });

  it("should edit a category inline, including its icon", async () => {
    setupAuthenticatedUser();
    let updateBody: unknown = null;
    server.use(
      http.get("/api/categories", () =>
        HttpResponse.json({ categories: [{ id: 1, name: "Food", type: "variable" }] }),
      ),
      http.put("/api/categories/1", async ({ request }) => {
        updateBody = await request.json();
        return HttpResponse.json({ category: { id: 1, name: "Groceries", type: "variable" } });
      }),
    );

    const user = userEvent.setup();
    render(<TestWrapper initialPath="/categories" />);

    await user.click(await screen.findByRole("button", { name: "Edit Food" }));
    const name = screen.getByLabelText("Category name");
    await user.clear(name);
    await user.type(name, "Groceries");
    await user.click(screen.getByRole("button", { name: "Choose icon" }));
    await user.click(screen.getByRole("button", { name: "🛒" }));
    await user.click(screen.getByRole("button", { name: "Save" }));

    await waitFor(() =>
      expect(updateBody).toEqual({
        name: "Groceries",
        groupName: "",
        type: "variable",
        icon: "🛒",
      }),
    );
  });

  it("should offer to add a first category when none exist", async () => {
    setupAuthenticatedUser();
    server.use(
      http.get("/api/categories", () => {
        return HttpResponse.json({ categories: [] });
      }),
    );

    render(<TestWrapper initialPath="/categories" />);

    expect(await screen.findByRole("button", { name: "+ New category" })).toBeInTheDocument();
  });
});
