import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import styled from "styled-components";
import { Settings as SettingsIcon, Sun, Moon, Monitor } from "lucide-react";
import { useThemeMode } from "../../contexts/ThemeModeContext.js";
import {
  Button,
  Input,
  DangerButton,
  EditInput,
  EmptyState,
  Table as BaseTable,
  Th,
  Td,
  PageTitle,
  TitleRow,
} from "../../components/ui.js";
import { useMappingRules, useDeleteMappingRule } from "../../hooks/useMappingRules.js";
import {
  useMerchantAliases,
  useCreateMerchantAlias,
  useUpdateMerchantAlias,
  useDeleteMerchantAlias,
} from "../../hooks/useMerchantAliases.js";

const SectionTitle = styled.h2`
  font-size: 18px;
  margin: 32px 0 16px;

  &:first-of-type {
    margin-top: 0;
  }
`;

const TableScroll = styled.div`
  @media (max-width: 640px) {
    width: 100%;
    overflow-x: auto;
    -webkit-overflow-scrolling: touch;
    border-radius: ${(p) => p.theme.radii.lg};
    box-shadow: ${(p) => p.theme.shadows.card};
  }
`;

const Table = styled(BaseTable)`
  width: 100%;
  background: ${(p) => p.theme.colors.card};
  border-radius: ${(p) => p.theme.radii.lg};
  border-collapse: collapse;
  overflow: hidden;
  box-shadow: ${(p) => p.theme.shadows.card};

  @media (max-width: 640px) {
    border-radius: 0;
    width: max-content;
    min-width: 100%;
  }
`;

const AddForm = styled.form`
  display: flex;
  gap: 8px;
  margin-bottom: 16px;

  @media (max-width: 640px) {
    flex-direction: column;
  }
`;

const FormInput = styled(Input)`
  flex: 1;
`;

const EditableCell = styled.td`
  padding: 10px 16px;
  border-bottom: 1px solid ${(p) => p.theme.colors.border};
  font-size: 14px;
  cursor: pointer;

  &:hover {
    background: ${(p) => p.theme.colors.background};
  }
`;

const ThemeSegmentedControl = styled.div`
  display: flex;
  gap: 0;
  border-radius: ${(p) => p.theme.radii.md};
  overflow: hidden;
  border: 1px solid ${(p) => p.theme.colors.border};
  width: fit-content;
`;

const ThemeOption = styled.button<{ $active: boolean }>`
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 16px;
  background: ${(p) => (p.$active ? p.theme.colors.primary : p.theme.colors.card)};
  color: ${(p) => (p.$active ? "#fff" : p.theme.colors.text)};
  border: none;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition:
    background 0.15s,
    color 0.15s;

  &:hover:not(:disabled) {
    background: ${(p) => (p.$active ? p.theme.colors.primaryDark : p.theme.colors.background)};
    color: ${(p) => (p.$active ? "#fff" : p.theme.colors.text)};
  }

  &:not(:last-child) {
    border-right: 1px solid ${(p) => p.theme.colors.border};
  }
`;

export const Route = createFileRoute("/_authenticated/settings")({
  component: SettingsPage,
});

function SettingsPage() {
  const { mode, setMode } = useThemeMode();
  const [aliasOriginal, setAliasOriginal] = useState("");
  const [aliasDisplay, setAliasDisplay] = useState("");
  const [editingAlias, setEditingAlias] = useState<number | null>(null);
  const [editAliasName, setEditAliasName] = useState("");

  const rulesQuery = useMappingRules();
  const deleteRuleMutation = useDeleteMappingRule();

  const aliasesQuery = useMerchantAliases();
  const createAliasMutation = useCreateMerchantAlias();
  const updateAliasMutation = useUpdateMerchantAlias();
  const deleteAliasMutation = useDeleteMerchantAlias();

  const rules = rulesQuery.data?.rules ?? [];
  const aliases = aliasesQuery.data?.aliases ?? [];

  const handleAddAlias = (e: React.FormEvent) => {
    e.preventDefault();
    if (!aliasOriginal.trim() || !aliasDisplay.trim()) return;
    createAliasMutation.mutate(
      {
        originalLabel: aliasOriginal.trim(),
        displayName: aliasDisplay.trim(),
      },
      {
        onSuccess: () => {
          setAliasOriginal("");
          setAliasDisplay("");
        },
      },
    );
  };

  const handleSaveAlias = (id: number) => {
    if (!editAliasName.trim()) return;
    updateAliasMutation.mutate(
      { id, displayName: editAliasName.trim() },
      { onSuccess: () => setEditingAlias(null) },
    );
  };

  return (
    <>
      <TitleRow>
        <SettingsIcon size={28} strokeWidth={2} />
        <PageTitle>Settings</PageTitle>
      </TitleRow>

      <SectionTitle>Appearance</SectionTitle>
      <ThemeSegmentedControl>
        <ThemeOption type="button" $active={mode === "light"} onClick={() => setMode("light")}>
          <Sun size={18} strokeWidth={2} />
          Light
        </ThemeOption>
        <ThemeOption type="button" $active={mode === "dark"} onClick={() => setMode("dark")}>
          <Moon size={18} strokeWidth={2} />
          Dark
        </ThemeOption>
        <ThemeOption type="button" $active={mode === "system"} onClick={() => setMode("system")}>
          <Monitor size={18} strokeWidth={2} />
          System
        </ThemeOption>
      </ThemeSegmentedControl>

      <SectionTitle>Mapping Rules</SectionTitle>
      {rules.length === 0 ? (
        <EmptyState>No mapping rules yet.</EmptyState>
      ) : (
        <TableScroll>
          <Table>
            <thead>
              <tr>
                <Th>Label</Th>
                <Th>Bank Sub-Category</Th>
                <Th>Budget Category</Th>
                <Th>Actions</Th>
              </tr>
            </thead>
            <tbody>
              {rules.map((rule) => (
                <tr key={rule.id}>
                  <Td>{rule.labelSimplified}</Td>
                  <Td>{rule.bankSubCategory}</Td>
                  <Td>{rule.budgetCategoryName}</Td>
                  <Td>
                    <DangerButton onClick={() => deleteRuleMutation.mutate(rule.id)}>
                      Delete
                    </DangerButton>
                  </Td>
                </tr>
              ))}
            </tbody>
          </Table>
        </TableScroll>
      )}

      <SectionTitle>Merchant Aliases</SectionTitle>

      <AddForm onSubmit={handleAddAlias}>
        <FormInput
          placeholder="Original label (e.g. SARL CHEVALLIER)"
          value={aliasOriginal}
          onChange={(e) => setAliasOriginal(e.target.value)}
        />
        <FormInput
          placeholder="Display name (e.g. Boulangerie)"
          value={aliasDisplay}
          onChange={(e) => setAliasDisplay(e.target.value)}
        />
        <Button type="submit" disabled={createAliasMutation.isPending}>
          Add
        </Button>
      </AddForm>

      {aliases.length === 0 ? (
        <EmptyState>No merchant aliases yet.</EmptyState>
      ) : (
        <TableScroll>
          <Table>
            <thead>
              <tr>
                <Th>Original Label</Th>
                <Th>Display Name</Th>
                <Th>Actions</Th>
              </tr>
            </thead>
            <tbody>
              {aliases.map((alias) => (
                <tr key={alias.id}>
                  <Td>{alias.originalLabel}</Td>
                  {editingAlias === alias.id ? (
                    <Td>
                      <EditInput
                        value={editAliasName}
                        onChange={(e) => setEditAliasName(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") handleSaveAlias(alias.id);
                          if (e.key === "Escape") setEditingAlias(null);
                        }}
                        autoFocus
                      />
                    </Td>
                  ) : (
                    <EditableCell
                      onClick={() => {
                        setEditingAlias(alias.id);
                        setEditAliasName(alias.displayName);
                      }}
                    >
                      {alias.displayName}
                    </EditableCell>
                  )}
                  <Td>
                    <DangerButton onClick={() => deleteAliasMutation.mutate(alias.id)}>
                      Delete
                    </DangerButton>
                  </Td>
                </tr>
              ))}
            </tbody>
          </Table>
        </TableScroll>
      )}
    </>
  );
}
