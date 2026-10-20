import { useEffect, useRef, useState, type ReactNode } from "react";
import styled from "styled-components";
import { MoreHorizontal } from "lucide-react";

const Wrapper = styled.div`
  position: relative;
  display: inline-flex;
`;

const Trigger = styled.button`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  background: transparent;
  border: none;
  border-radius: ${(p) => p.theme.radii.sm};
  color: ${(p) => p.theme.colors.textMuted};
  cursor: pointer;

  /* Hover-capable devices reveal the trigger with its row; touch devices always show it. */
  @media (hover: hover) {
    opacity: 0;
  }

  &:focus-visible,
  &[aria-expanded="true"] {
    opacity: 1;
  }

  &:hover {
    background: ${(p) => p.theme.colors.background};
    color: ${(p) => p.theme.colors.primary};
  }
`;

const Menu = styled.div`
  position: absolute;
  top: 100%;
  right: 0;
  z-index: 50;
  min-width: 190px;
  padding: ${(p) => p.theme.space.xs};
  background: ${(p) => p.theme.colors.card};
  border: 1px solid ${(p) => p.theme.colors.border};
  border-radius: ${(p) => p.theme.radii.md};
  box-shadow: ${(p) => p.theme.shadows.cardHover};
  display: flex;
  flex-direction: column;
`;

const Item = styled.button`
  display: flex;
  align-items: center;
  gap: ${(p) => p.theme.space.sm};
  padding: ${(p) => p.theme.space.sm} ${(p) => p.theme.space.md};
  background: none;
  border: none;
  border-radius: ${(p) => p.theme.radii.sm};
  color: ${(p) => p.theme.colors.text};
  font-size: ${(p) => p.theme.fontSize.md};
  text-align: left;
  cursor: pointer;

  &:hover:not(:disabled) {
    background: ${(p) => p.theme.colors.background};
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

export interface RowMenuItem {
  label: string;
  icon?: ReactNode;
  onSelect: () => void;
  disabled?: boolean;
}

interface RowMenuProps {
  /** Accessible name of the trigger, e.g. "Actions for Carrefour". */
  label: string;
  items: RowMenuItem[];
}

/** The `⋯` actions menu of a list row. */
export function RowMenu({ label, items }: RowMenuProps) {
  const [open, setOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const close = (event: MouseEvent) => {
      if (!wrapperRef.current?.contains(event.target as Node)) setOpen(false);
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", close);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", close);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  return (
    <Wrapper ref={wrapperRef} data-row-menu>
      <Trigger
        type="button"
        aria-label={label}
        aria-haspopup="menu"
        aria-expanded={open}
        data-row-menu-trigger
        onClick={() => setOpen((o) => !o)}
      >
        <MoreHorizontal size={18} />
      </Trigger>
      {open && (
        <Menu role="menu">
          {items.map((item) => (
            <Item
              key={item.label}
              type="button"
              role="menuitem"
              disabled={item.disabled}
              onClick={() => {
                setOpen(false);
                item.onSelect();
              }}
            >
              {item.icon}
              {item.label}
            </Item>
          ))}
        </Menu>
      )}
    </Wrapper>
  );
}
