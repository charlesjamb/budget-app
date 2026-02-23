import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { ProgressBar } from "./ProgressBar.js";

describe("ProgressBar", () => {
  it("should render nothing when budget is 0", () => {
    const { container } = render(<ProgressBar spent={5000} budget={0} />);
    expect(container.firstChild).toBeNull();
  });

  it("should render progress bar when budget > 0", () => {
    const { container } = render(<ProgressBar spent={5000} budget={10000} />);
    expect(container.firstChild).not.toBeNull();
  });

  it("should show label with percentage when showLabel is true", () => {
    render(<ProgressBar spent={7500} budget={10000} showLabel />);
    expect(screen.getByText("75%")).toBeInTheDocument();
  });

  it("should not show label when showLabel is false", () => {
    render(<ProgressBar spent={7500} budget={10000} />);
    expect(screen.queryByText("75%")).not.toBeInTheDocument();
  });

  it("should show 100% when fully spent", () => {
    render(<ProgressBar spent={10000} budget={10000} showLabel />);
    expect(screen.getByText("100%")).toBeInTheDocument();
  });

  it("should show over 100% when overspent", () => {
    render(<ProgressBar spent={15000} budget={10000} showLabel />);
    expect(screen.getByText("150%")).toBeInTheDocument();
  });
});
