import styled from "styled-components";

export const Button = styled.button`
  background: ${(p) => p.theme.gradients.primary};
  color: #fff;
  border: none;
  padding: 8px 16px;
  border-radius: ${(p) => p.theme.radii.md};
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  box-shadow: ${(p) => p.theme.shadows.button};

  &:hover:not(:disabled) {
    filter: brightness(1.05);
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
