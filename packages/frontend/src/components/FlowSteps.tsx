import { Link } from "@tanstack/react-router";
import styled from "styled-components";
import { useMonthRhythm } from "../hooks/useMonthRhythm.js";

const PLAN_STEPS = [
  { to: "/budget", label: "Budget" },
  { to: "/plan/wires", label: "Wires" },
] as const;

const CLOSE_STEPS = [
  { to: "/import", label: "Import" },
  { to: "/classify", label: "Classify" },
  { to: "/close/settle", label: "Settle up" },
] as const;

type PlanPath = (typeof PLAN_STEPS)[number]["to"];
type ClosePath = (typeof CLOSE_STEPS)[number]["to"];

const Bar = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: ${(p) => p.theme.space.sm} ${(p) => p.theme.space.lg};
  margin-bottom: ${(p) => p.theme.space.lg};
`;

const Steps = styled.ol`
  display: flex;
  align-items: center;
  gap: ${(p) => p.theme.space.sm};
  list-style: none;

  li {
    display: flex;
    align-items: center;
    gap: ${(p) => p.theme.space.sm};
  }

  li + li::before {
    content: "";
    width: 20px;
    border-top: 1px solid ${(p) => p.theme.colors.borderLight};
  }

  a {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    color: ${(p) => p.theme.colors.textMuted};
    font-size: ${(p) => p.theme.fontSize.md};
    font-weight: 500;
    text-decoration: none;
  }

  a:hover {
    color: ${(p) => p.theme.colors.primary};
  }

  a[aria-current="step"] {
    color: ${(p) => p.theme.colors.text};
    font-weight: 600;
  }
`;

const StepNumber = styled.span<{ $current: boolean }>`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 22px;
  height: 22px;
  border-radius: ${(p) => p.theme.radii.pill};
  font-size: ${(p) => p.theme.fontSize.xs};
  font-weight: 600;
  background: ${(p) => (p.$current ? p.theme.colors.primary : p.theme.colors.accentSoft)};
  color: ${(p) => (p.$current ? p.theme.colors.onPrimary : p.theme.colors.primary)};
`;

const SwitchLink = styled.span`
  a {
    color: ${(p) => p.theme.colors.textMuted};
    font-size: ${(p) => p.theme.fontSize.sm};
    text-decoration: none;
  }

  a:hover {
    color: ${(p) => p.theme.colors.primary};
    text-decoration: underline;
  }
`;

type FlowStepsProps =
  | { flow: "plan"; current: PlanPath; month: string }
  | { flow: "close"; current: ClosePath; month: string };

/** Stepper header shown on the pages of the monthly Plan and Close flows. */
export function FlowSteps(props: FlowStepsProps) {
  const { planMonth, closeMonth } = useMonthRhythm();

  return (
    <Bar>
      {props.flow === "plan" ? (
        <>
          <nav aria-label="Plan steps">
            <Steps>
              {PLAN_STEPS.map((step, i) => (
                <li key={step.to}>
                  <Link
                    to={step.to}
                    search={{ month: props.month }}
                    aria-current={step.to === props.current ? "step" : undefined}
                  >
                    <StepNumber $current={step.to === props.current}>{i + 1}</StepNumber>
                    {step.label}
                  </Link>
                </li>
              ))}
            </Steps>
          </nav>
          <SwitchLink>
            <Link to="/import" search={{ month: closeMonth }}>
              Switch to Close →
            </Link>
          </SwitchLink>
        </>
      ) : (
        <>
          <nav aria-label="Close steps">
            <Steps>
              {CLOSE_STEPS.map((step, i) => (
                <li key={step.to}>
                  <Link
                    to={step.to}
                    search={{ month: props.month }}
                    aria-current={step.to === props.current ? "step" : undefined}
                  >
                    <StepNumber $current={step.to === props.current}>{i + 1}</StepNumber>
                    {step.label}
                  </Link>
                </li>
              ))}
            </Steps>
          </nav>
          <SwitchLink>
            <Link to="/budget" search={{ month: planMonth }}>
              Switch to Plan →
            </Link>
          </SwitchLink>
        </>
      )}
    </Bar>
  );
}
