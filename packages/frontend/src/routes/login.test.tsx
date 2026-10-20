import { describe, it, expect } from "vite-plus/test";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { http, HttpResponse } from "msw";
import { server } from "../mocks/server.js";
import { TestWrapper } from "../test/TestWrapper.js";

describe("Login Page", () => {
  it("should render login form", async () => {
    render(<TestWrapper initialPath="/login" />);

    expect(await screen.findByText("Mathilde & Charles")).toBeInTheDocument();
    expect(screen.getByLabelText("Email")).toBeInTheDocument();
    expect(screen.getByLabelText("Password")).toBeInTheDocument();
  });

  it("should show error on invalid credentials", async () => {
    server.use(
      http.post("/api/auth/login", () => {
        return HttpResponse.json({ error: "Invalid credentials" }, { status: 401 });
      }),
    );

    render(<TestWrapper initialPath="/login" />);

    const user = userEvent.setup();
    await user.type(await screen.findByLabelText("Email"), "test@example.com");
    await user.type(screen.getByLabelText("Password"), "wrong");
    await user.click(screen.getByRole("button", { name: "Log in" }));

    expect(await screen.findByText("Invalid email or password")).toBeInTheDocument();
  });

  it("should tell a network failure apart from bad credentials", async () => {
    server.use(http.post("/api/auth/login", () => HttpResponse.error()));

    render(<TestWrapper initialPath="/login" />);

    const user = userEvent.setup();
    await user.type(await screen.findByLabelText("Email"), "test@example.com");
    await user.type(screen.getByLabelText("Password"), "password123");
    await user.click(screen.getByRole("button", { name: "Log in" }));

    expect(
      await screen.findByText("Can't reach the server, check your connection"),
    ).toBeInTheDocument();
  });

  it("should redirect to dashboard on successful login", async () => {
    let loggedIn = false;

    server.use(
      http.post("/api/auth/login", () => {
        loggedIn = true;
        return HttpResponse.json({
          user: { id: 1, email: "test@example.com" },
        });
      }),
      http.get("/api/auth/me", () => {
        if (!loggedIn) {
          return HttpResponse.json({ error: "Not authenticated" }, { status: 401 });
        }
        return HttpResponse.json({
          user: { id: 1, email: "test@example.com" },
          householdId: 1,
        });
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

    render(<TestWrapper initialPath="/login" />);

    const user = userEvent.setup();
    await user.type(await screen.findByLabelText("Email"), "test@example.com");
    await user.type(screen.getByLabelText("Password"), "password123");
    await user.click(screen.getByRole("button", { name: "Log in" }));

    await waitFor(() => {
      expect(screen.queryByText("Mathilde & Charles")).not.toBeInTheDocument();
    });
  });
});
