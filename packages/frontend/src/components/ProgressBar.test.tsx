import { describe, it, expect } from "vite-plus/test";
import { render, screen } from "@testing-library/react";
import { ThemeProvider } from "styled-components";
import { theme } from "../theme.js";
import { ProgressBar } from "./ProgressBar.js";

const renderWithTheme = (ui: React.ReactElement) =>
  render(<ThemeProvider theme={theme}>{ui}</ThemeProvider>);

describe("ProgressBar", () => {
  it("should render nothing when budget is 0", () => {
    const { container } = renderWithTheme(<ProgressBar spent={5000} budget={0} />);
    expect(container.firstChild).toBeNull();
  });

  it("should render progress bar when budget > 0", () => {
    const { container } = renderWithTheme(<ProgressBar spent={5000} budget={10000} />);
    expect(container.firstChild).not.toBeNull();
  });

  it("should show label with percentage when showLabel is true", () => {
    renderWithTheme(<ProgressBar spent={7500} budget={10000} showLabel />);
    expect(screen.getByText("75%")).toBeInTheDocument();
  });

  it("should not show label when showLabel is false", () => {
    renderWithTheme(<ProgressBar spent={7500} budget={10000} />);
    expect(screen.queryByText("75%")).not.toBeInTheDocument();
  });

  it("should show 100% when fully spent", () => {
    renderWithTheme(<ProgressBar spent={10000} budget={10000} showLabel />);
    expect(screen.getByText("100%")).toBeInTheDocument();
  });

  it("should show over 100% when overspent", () => {
    renderWithTheme(<ProgressBar spent={15000} budget={10000} showLabel />);
    expect(screen.getByText("150%")).toBeInTheDocument();
  });
});
