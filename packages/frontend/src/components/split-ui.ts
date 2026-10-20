import styled from "styled-components";

export const Section = styled.div`
  background: ${(p) => p.theme.colors.card};
  border-radius: ${(p) => p.theme.radii.lg};
  box-shadow: ${(p) => p.theme.shadows.card};
  padding: 20px;
  margin-bottom: 24px;
`;

export const SectionTitle = styled.h2`
  font-size: 16px;
  font-weight: 600;
  margin: 0 0 16px 0;
  color: ${(p) => p.theme.colors.text};
`;

export const SummaryRow = styled.div<{ $spaced?: boolean }>`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
  margin-top: ${(p) => (p.$spaced ? "16px" : "0")};

  &:last-child {
    margin-bottom: 0;
  }
`;

export const SummaryLabel = styled.span`
  font-size: 14px;
  color: ${(p) => p.theme.colors.textMuted};
`;

export const SummaryValue = styled.span<{ $accent?: boolean; $tone?: "positive" | "negative" }>`
  font-size: 16px;
  font-weight: 600;
  color: ${(p) =>
    p.$tone === "positive"
      ? p.theme.colors.over
      : p.$tone === "negative"
        ? p.theme.colors.ok
        : p.$accent
          ? p.theme.colors.primary
          : p.theme.colors.text};
`;

export const MemberLineRow = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 0;
  border-top: 1px solid ${(p) => p.theme.colors.border};
  margin-top: 8px;
`;
