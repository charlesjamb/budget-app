import styled from "styled-components";

export const Section = styled.div`
  background: ${(p) => p.theme.colors.card};
  border-radius: ${(p) => p.theme.radii.lg};
  box-shadow: ${(p) => p.theme.shadows.card};
  padding: ${(p) => p.theme.space.xl};
  margin-bottom: ${(p) => p.theme.space.xl};
`;

export const SectionTitle = styled.h2`
  font-size: ${(p) => p.theme.fontSize.xs};
  font-weight: 600;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  margin: 0 0 ${(p) => p.theme.space.md};
  color: ${(p) => p.theme.colors.textMuted};
`;

export const MemberLine = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: ${(p) => p.theme.space.md};
  padding: ${(p) => p.theme.space.md} 0;
  border-top: 1px solid ${(p) => p.theme.colors.border};

  &:first-of-type {
    border-top: none;
  }
`;

export const MemberLabel = styled.span`
  font-size: ${(p) => p.theme.fontSize.lg};
  font-weight: 500;
`;

export const Figure = styled.span<{ $tone?: "ok" | "over" | "muted" }>`
  font-size: ${(p) => p.theme.fontSize.lg};
  font-weight: 600;
  font-variant-numeric: tabular-nums;
  white-space: nowrap;
  color: ${(p) =>
    p.$tone === "ok"
      ? p.theme.colors.ok
      : p.$tone === "over"
        ? p.theme.colors.over
        : p.$tone === "muted"
          ? p.theme.colors.textMuted
          : p.theme.colors.text};
`;

export const BigNumber = styled.div`
  font-size: ${(p) => p.theme.fontSize.hero};
  font-weight: 700;
  font-variant-numeric: tabular-nums;
  line-height: 1.1;
`;

export const Note = styled.p`
  font-size: ${(p) => p.theme.fontSize.md};
  color: ${(p) => p.theme.colors.textMuted};
  margin: ${(p) => p.theme.space.xs} 0 ${(p) => p.theme.space.md};
`;
