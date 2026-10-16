import { describe, it, expect, vi, beforeEach } from "vite-plus/test";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ThemeModeProvider, useThemeMode } from "./ThemeModeContext.js";

function TestConsumer() {
  const { mode, resolvedMode, setMode } = useThemeMode();
  return (
    <div>
      <span data-testid="mode">{mode}</span>
      <span data-testid="resolved">{resolvedMode}</span>
      <button type="button" onClick={() => setMode("light")}>
        Light
      </button>
      <button type="button" onClick={() => setMode("dark")}>
        Dark
      </button>
      <button type="button" onClick={() => setMode("system")}>
        System
      </button>
    </div>
  );
}

describe("ThemeModeContext", () => {
  const mockMatchMedia = vi.fn();
  const mockLocalStorage: Record<string, string> = {};

  beforeEach(() => {
    vi.clearAllMocks();
    Object.keys(mockLocalStorage).forEach((k) => delete mockLocalStorage[k]);

    vi.stubGlobal(
      "matchMedia",
      mockMatchMedia.mockImplementation((query: string) => ({
        matches: query === "(prefers-color-scheme: dark)",
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
      })),
    );

    vi.stubGlobal("localStorage", {
      getItem: vi.fn((key: string) => mockLocalStorage[key] ?? null),
      setItem: vi.fn((key: string, value: string) => {
        mockLocalStorage[key] = value;
      }),
      removeItem: vi.fn((key: string) => {
        delete mockLocalStorage[key];
      }),
    });
  });

  it("defaults to system when no stored preference", () => {
    mockMatchMedia.mockReturnValue({
      matches: false,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    });

    render(
      <ThemeModeProvider>
        <TestConsumer />
      </ThemeModeProvider>,
    );

    expect(screen.getByTestId("mode")).toHaveTextContent("system");
    expect(screen.getByTestId("resolved")).toHaveTextContent("light");
  });

  it("resolves to dark when system prefers dark", () => {
    mockMatchMedia.mockReturnValue({
      matches: true,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    });

    render(
      <ThemeModeProvider>
        <TestConsumer />
      </ThemeModeProvider>,
    );

    expect(screen.getByTestId("mode")).toHaveTextContent("system");
    expect(screen.getByTestId("resolved")).toHaveTextContent("dark");
  });

  it("reads mode from localStorage", () => {
    mockLocalStorage["theme-mode"] = "dark";

    render(
      <ThemeModeProvider>
        <TestConsumer />
      </ThemeModeProvider>,
    );

    expect(screen.getByTestId("mode")).toHaveTextContent("dark");
    expect(screen.getByTestId("resolved")).toHaveTextContent("dark");
  });

  it("persists mode to localStorage when setMode is called", async () => {
    const user = userEvent.setup();

    render(
      <ThemeModeProvider>
        <TestConsumer />
      </ThemeModeProvider>,
    );

    await user.click(screen.getByRole("button", { name: "Dark" }));

    // localStorage.setItem is a vi.fn() mock in this test, so the unbound
    // method reference is safe.
    // oxlint-disable-next-line typescript/unbound-method
    expect(localStorage.setItem).toHaveBeenCalledWith("theme-mode", "dark");
    expect(screen.getByTestId("mode")).toHaveTextContent("dark");
  });

  it("throws when useThemeMode is used outside provider", () => {
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    expect(() => render(<TestConsumer />)).toThrow(
      "useThemeMode must be used within ThemeModeProvider",
    );

    consoleSpy.mockRestore();
  });
});
