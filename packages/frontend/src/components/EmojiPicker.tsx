import { useEffect, useRef, useState } from "react";
import styled from "styled-components";

export const PRESET_EMOJIS = [
  "🥖",
  "🛒",
  "🍷",
  "🍽️",
  "☕",
  "🏠",
  "💡",
  "💧",
  "📶",
  "🔥",
  "🚗",
  "⛽",
  "🚆",
  "✈️",
  "🏖️",
  "💊",
  "🏥",
  "👶",
  "🧸",
  "🎓",
  "🎬",
  "🎁",
  "👕",
  "🐶",
  "🌱",
  "🛡️",
  "🏦",
  "📈",
  "🧾",
  "⛵",
];

const Wrapper = styled.div`
  position: relative;
  display: inline-flex;
`;

const Trigger = styled.button`
  width: 40px;
  height: 40px;
  font-size: 20px;
  line-height: 1;
  background: ${(p) => p.theme.colors.background};
  border: 1px dashed ${(p) => p.theme.colors.borderLight};
  border-radius: ${(p) => p.theme.radii.md};
  color: ${(p) => p.theme.colors.textLight};
  cursor: pointer;

  &:hover {
    border-color: ${(p) => p.theme.colors.primary};
  }
`;

const Popover = styled.div`
  position: absolute;
  top: calc(100% + 4px);
  left: 0;
  z-index: 50;
  width: 264px;
  padding: ${(p) => p.theme.space.md};
  background: ${(p) => p.theme.colors.card};
  border: 1px solid ${(p) => p.theme.colors.border};
  border-radius: ${(p) => p.theme.radii.md};
  box-shadow: ${(p) => p.theme.shadows.cardHover};
`;

const Grid = styled.div`
  display: grid;
  grid-template-columns: repeat(6, 1fr);
  gap: ${(p) => p.theme.space.xs};
  margin-bottom: ${(p) => p.theme.space.sm};
`;

const Cell = styled.button<{ $selected: boolean }>`
  height: 36px;
  font-size: 18px;
  background: ${(p) => (p.$selected ? p.theme.colors.accentSoft : "transparent")};
  border: none;
  border-radius: ${(p) => p.theme.radii.sm};
  cursor: pointer;

  &:hover {
    background: ${(p) => p.theme.colors.accentSoft};
  }
`;

const Custom = styled.input`
  width: 100%;
  padding: 6px 10px;
  border: 1px solid ${(p) => p.theme.colors.borderLight};
  border-radius: ${(p) => p.theme.radii.sm};
  background: ${(p) => p.theme.colors.card};
  color: ${(p) => p.theme.colors.text};
  font-size: ${(p) => p.theme.fontSize.md};
`;

interface EmojiPickerProps {
  value: string;
  onChange: (emoji: string) => void;
}

/** Icon button opening a preset emoji grid, with a free-text field for anything else. */
export function EmojiPicker({ value, onChange }: EmojiPickerProps) {
  const [open, setOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const close = (event: MouseEvent) => {
      if (!wrapperRef.current?.contains(event.target as Node)) setOpen(false);
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.stopPropagation();
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", close);
    document.addEventListener("keydown", onKeyDown, true);
    return () => {
      document.removeEventListener("mousedown", close);
      document.removeEventListener("keydown", onKeyDown, true);
    };
  }, [open]);

  return (
    <Wrapper ref={wrapperRef}>
      <Trigger
        type="button"
        aria-label="Choose icon"
        aria-haspopup="dialog"
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
      >
        {value || "＋"}
      </Trigger>
      {open && (
        <Popover role="dialog" aria-label="Icons">
          <Grid>
            {PRESET_EMOJIS.map((emoji) => (
              <Cell
                key={emoji}
                type="button"
                $selected={emoji === value}
                aria-label={emoji}
                onClick={() => {
                  onChange(emoji);
                  setOpen(false);
                }}
              >
                {emoji}
              </Cell>
            ))}
          </Grid>
          <Custom
            value={value}
            maxLength={8}
            placeholder="Or type your own"
            aria-label="Custom icon"
            onChange={(e) => onChange(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                setOpen(false);
              }
            }}
          />
        </Popover>
      )}
    </Wrapper>
  );
}
