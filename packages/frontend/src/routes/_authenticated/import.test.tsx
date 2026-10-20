import { describe, it, expect } from "vite-plus/test";
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

describe("Import Page", () => {
  it("should render upload area", async () => {
    setupAuthenticatedUser();

    render(<TestWrapper initialPath="/import" />);

    expect(await screen.findByText(/Import CSV/)).toBeInTheDocument();
    expect(screen.getByText("Click to upload your bank CSV file")).toBeInTheDocument();
  });

  it("should show import results after successful upload", async () => {
    setupAuthenticatedUser();
    server.use(
      http.post("/api/import", () => {
        return HttpResponse.json({
          imported: 15,
          skipped: 3,
          unmappedCount: 8,
        });
      }),
    );

    render(<TestWrapper initialPath="/import" />);

    await screen.findByText(/Import CSV/);

    const user = userEvent.setup();
    const file = new File(["csv content"], "expenses.csv", {
      type: "text/csv",
    });
    const input = document.querySelector('input[type="file"]') as HTMLInputElement;
    await user.upload(input, file);

    expect(await screen.findByText("Import Complete")).toBeInTheDocument();
    expect(screen.getByText("New transactions imported").nextElementSibling).toHaveTextContent(
      "15",
    );
    expect(screen.getByText("Duplicates skipped").nextElementSibling).toHaveTextContent("3");
  });
});
