import styled, { type DefaultTheme } from "styled-components";

export const Button = styled.button`
  background: ${(p) => p.theme.colors.primary};
  color: ${(p) => p.theme.colors.onPrimary};
  border: none;
  padding: 8px 16px;
  border-radius: ${(p) => p.theme.radii.md};
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;

  &:hover:not(:disabled) {
    background: ${(p) => p.theme.colors.primaryDark};
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
`;

export const SecondaryButton = styled.button`
  background: ${(p) => p.theme.colors.card};
  color: ${(p) => p.theme.colors.primary};
  border: 1px solid ${(p) => p.theme.colors.primary};
  padding: 8px 16px;
  border-radius: ${(p) => p.theme.radii.md};
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;

  &:hover:not(:disabled) {
    background: ${(p) => p.theme.colors.background};
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
`;

export const DangerButton = styled.button`
  background: none;
  border: none;
  color: ${(p) => p.theme.colors.danger};
  cursor: pointer;
  font-size: 13px;
  padding: 4px 8px;

  &:hover {
    text-decoration: underline;
  }
`;

export const Input = styled.input`
  padding: 10px 12px;
  border: 1px solid ${(p) => p.theme.colors.borderLight};
  border-radius: ${(p) => p.theme.radii.md};
  font-size: 14px;
  background: ${(p) => p.theme.colors.card};
  color: ${(p) => p.theme.colors.text};

  &:focus {
    outline: none;
    border-color: ${(p) => p.theme.colors.primary};
    box-shadow: ${(p) => p.theme.shadows.focus};
  }
`;

export const EditInput = styled.input`
  padding: 4px 8px;
  border: 1px solid ${(p) => p.theme.colors.primary};
  border-radius: ${(p) => p.theme.radii.sm};
  font-size: 14px;
  background: ${(p) => p.theme.colors.card};
  color: ${(p) => p.theme.colors.text};

  &:focus {
    outline: none;
    box-shadow: ${(p) => p.theme.shadows.focus};
  }
`;

export const AmountInput = styled(Input)`
  width: 100px;
  text-align: right;
`;

export const MonthInput = styled(Input)`
  padding: 6px 10px;
`;

export const Select = styled.select`
  padding: 8px 12px;
  border: 1px solid ${(p) => p.theme.colors.borderLight};
  border-radius: ${(p) => p.theme.radii.md};
  font-size: 14px;
  background: ${(p) => p.theme.colors.card};
  color: ${(p) => p.theme.colors.text};

  &:focus {
    outline: none;
    border-color: ${(p) => p.theme.colors.primary};
    box-shadow: ${(p) => p.theme.shadows.focus};
  }
`;

export const Label = styled.label`
  font-size: 14px;
  font-weight: 500;
  display: flex;
  flex-direction: column;
  gap: 6px;
  color: ${(p) => p.theme.colors.text};
`;

export const ErrorMessage = styled.p`
  color: ${(p) => p.theme.colors.danger};
  font-size: 13px;
  margin-top: 4px;
`;

export const Card = styled.div`
  background: ${(p) => p.theme.colors.card};
  border-radius: ${(p) => p.theme.radii.lg};
  box-shadow: ${(p) => p.theme.shadows.card};
  overflow: hidden;
`;

export const CardHover = styled(Card)`
  transition:
    transform 0.2s,
    box-shadow 0.2s;

  &:hover {
    transform: translateY(-2px);
    box-shadow: ${(p) => p.theme.shadows.cardHover};
  }
`;

export const EmptyState = styled.p`
  text-align: center;
  color: ${(p) => p.theme.colors.textMuted};
  padding: 48px 32px;
  font-size: 16px;
`;

export const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
  flex-wrap: wrap;
  gap: 12px;
`;

export const SaveStatus = styled.span<{ $success?: boolean }>`
  font-size: 13px;
  color: ${(p) => (p.$success ? p.theme.colors.success : p.theme.colors.textMuted)};
`;

export const Table = styled.table`
  width: 100%;
  border-collapse: collapse;
`;

export const Th = styled.th`
  text-align: left;
  padding: 12px 16px;
  background: ${(p) => p.theme.colors.background};
  border-bottom: 1px solid ${(p) => p.theme.colors.border};
  font-size: 13px;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: ${(p) => p.theme.colors.textMuted};
  white-space: nowrap;
`;

export const Td = styled.td`
  padding: 10px 16px;
  border-bottom: 1px solid ${(p) => p.theme.colors.border};
  font-size: 14px;
`;

type ChipTone = "neutral" | "ok" | "warn" | "over" | "accent";

const chipColors = (tone: ChipTone, theme: DefaultTheme) => {
  switch (tone) {
    case "ok":
      return { bg: theme.colors.okSoft, fg: theme.colors.ok };
    case "warn":
      return { bg: theme.colors.warnSoft, fg: theme.colors.warn };
    case "over":
      return { bg: theme.colors.overSoft, fg: theme.colors.over };
    case "accent":
      return { bg: theme.colors.accentSoft, fg: theme.colors.primary };
    default:
      return { bg: theme.colors.background, fg: theme.colors.textMuted };
  }
};

export const Chip = styled.span<{ $tone?: ChipTone }>`
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 2px 10px;
  border-radius: ${(p) => p.theme.radii.pill};
  font-size: ${(p) => p.theme.fontSize.xs};
  font-weight: 500;
  white-space: nowrap;
  background: ${(p) => chipColors(p.$tone ?? "neutral", p.theme).bg};
  color: ${(p) => chipColors(p.$tone ?? "neutral", p.theme).fg};
`;

export const SectionHeader = styled.h2`
  font-size: ${(p) => p.theme.fontSize.xs};
  font-weight: 600;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: ${(p) => p.theme.colors.textMuted};
  margin: ${(p) => p.theme.space.xl} 0 ${(p) => p.theme.space.sm};
`;

export const PageTitle = styled.h1`
  font-size: 24px;
  font-weight: 700;
  margin: 0;
  color: ${(p) => p.theme.colors.text};
  line-height: 1.2;
`;

export const TitleRow = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 20px;

  svg {
    color: ${(p) => p.theme.colors.primary};
    flex-shrink: 0;
    display: block;
  }
`;

export const ModalOverlay = styled.div`
  position: fixed;
  inset: 0;
  background: ${(p) => p.theme.colors.overlay};
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 16px;
`;

export const ModalContent = styled.div`
  background: ${(p) => p.theme.colors.card};
  border-radius: ${(p) => p.theme.radii.lg};
  box-shadow: ${(p) => p.theme.shadows.cardHover};
  padding: 24px;
  max-width: 400px;
  width: 100%;
`;

export const ModalTitle = styled.h3`
  margin: 0 0 16px 0;
  font-size: 18px;
  font-weight: 600;
`;

export const ModalDescription = styled.p`
  margin: 0 0 16px 0;
  font-size: 14px;
  color: ${(p) => p.theme.colors.textMuted};
`;

export const ModalActions = styled.div`
  display: flex;
  gap: 12px;
  margin-top: 20px;
  justify-content: flex-end;
`;
