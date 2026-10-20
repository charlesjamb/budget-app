import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import styled from "styled-components";
import { Settings as SettingsIcon, Sun, Moon, Monitor, Pencil, Trash2 } from "lucide-react";
import { useThemeMode } from "../../contexts/ThemeModeContext.js";
import {
  Button,
  Input,
  DangerButton,
  Select,
  SaveStatus,
  EditInput,
  EmptyState,
  Table as BaseTable,
  Th,
  Td,
  PageTitle,
  TitleRow,
} from "../../components/ui.js";
import {
  useMappingRules,
  useDeleteMappingRule,
  useUpdateMappingRule,
} from "../../hooks/useMappingRules.js";
import { useCategories } from "../../hooks/useCategories.js";
import { useAuth, useUpdateProfile } from "../../hooks/useAuth.js";
import { RowMenu } from "../../components/RowMenu.js";
import {
  useMerchantAliases,
  useCreateMerchantAlias,
  useUpdateMerchantAlias,
  useDeleteMerchantAlias,
} from "../../hooks/useMerchantAliases.js";

const SectionTitle = styled.h2`
  font-size: ${(p) => p.theme.fontSize.xs};
  font-weight: 600;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: ${(p) => p.theme.colors.textMuted};
  margin: 32px 0 12px;

  &:first-of-type {
    margin-top: 0;
  }
`;

const ProfileCard = styled.div`
  background: ${(p) => p.theme.colors.card};
  border-radius: ${(p) => p.theme.radii.lg};
  box-shadow: ${(p) => p.theme.shadows.card};
  padding: ${(p) => p.theme.space.lg};
  display: grid;
  grid-template-columns: 120px minmax(0, 1fr);
  align-items: center;
  gap: ${(p) => p.theme.space.md};

  @media (max-width: 640px) {
    grid-template-columns: 1fr;
    gap: ${(p) => p.theme.space.xs};
  }
`;

const FieldLabel = styled.label`
  font-size: ${(p) => p.theme.fontSize.md};
  color: ${(p) => p.theme.colors.textMuted};
`;

const NameField = styled.div`
  display: flex;
  align-items: center;
  gap: ${(p) => p.theme.space.md};

  input {
    flex: 1;
    max-width: 280px;
  }
`;

const ReadOnlyValue = styled.span`
  font-size: ${(p) => p.theme.fontSize.md};
`;

const SearchInput = styled(Input)`
  width: 100%;
  max-width: 320px;
  margin-bottom: ${(p) => p.theme.space.md};
`;

const InlineSelect = styled(Select)`
  padding: 4px 8px;
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

  const { user } = useAuth();
  const updateProfileMutation = useUpdateProfile();
  const [nameDraft, setNameDraft] = useState<string | null>(null);

  const rulesQuery = useMappingRules();
  const deleteRuleMutation = useDeleteMappingRule();
  const updateRuleMutation = useUpdateMappingRule();
  const categories = useCategories().data?.categories ?? [];
  const [ruleSearch, setRuleSearch] = useState("");
  const [editingRule, setEditingRule] = useState<number | null>(null);

  const aliasesQuery = useMerchantAliases();
  const createAliasMutation = useCreateMerchantAlias();
  const updateAliasMutation = useUpdateMerchantAlias();
  const deleteAliasMutation = useDeleteMerchantAlias();

  const allRules = rulesQuery.data?.rules ?? [];
  const search = ruleSearch.trim().toLowerCase();
  const rules = search
    ? allRules.filter((r) =>
        [r.labelSimplified, r.bankSubCategory, r.budgetCategoryName ?? ""].some((v) =>
          v.toLowerCase().includes(search),
        ),
      )
    : allRules;
  const aliases = aliasesQuery.data?.aliases ?? [];

  const savedName = user?.displayName ?? "";
  const handleSaveName = () => {
    if (nameDraft === null) return;
    if (nameDraft.trim() === savedName) {
      setNameDraft(null);
      return;
    }
    updateProfileMutation.mutate(
      { displayName: nameDraft.trim() },
      { onSuccess: () => setNameDraft(null) },
    );
  };

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

      <SectionTitle>Profile</SectionTitle>
      <ProfileCard>
        <FieldLabel htmlFor="display-name">Display name</FieldLabel>
        <NameField>
          <Input
            id="display-name"
            value={nameDraft ?? savedName}
            maxLength={50}
            placeholder="How you appear in Wires and Settle up"
            onChange={(e) => setNameDraft(e.target.value)}
            onBlur={handleSaveName}
            onKeyDown={(e) => {
              if (e.key === "Enter") e.currentTarget.blur();
            }}
          />
          {updateProfileMutation.isSuccess && nameDraft === null && (
            <SaveStatus $success>✓ Saved</SaveStatus>
          )}
          {updateProfileMutation.isError && <SaveStatus>Not saved</SaveStatus>}
        </NameField>
        <FieldLabel>Email</FieldLabel>
        <ReadOnlyValue>{user?.email}</ReadOnlyValue>
      </ProfileCard>

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

      <SectionTitle>Mapping rules</SectionTitle>
      {allRules.length === 0 ? (
        <EmptyState>No mapping rules yet.</EmptyState>
      ) : (
        <>
          <SearchInput
            type="search"
            aria-label="Search rules"
            placeholder="Search rules..."
            value={ruleSearch}
            onChange={(e) => setRuleSearch(e.target.value)}
          />
          {rules.length === 0 ? (
            <EmptyState>No rule matches &ldquo;{ruleSearch}&rdquo;.</EmptyState>
          ) : (
            <TableScroll>
              <Table>
                <thead>
                  <tr>
                    <Th>Merchant</Th>
                    <Th>Bank sub-category</Th>
                    <Th>Category</Th>
                    <Th />
                  </tr>
                </thead>
                <tbody>
                  {rules.map((rule) => (
                    <tr key={rule.id}>
                      <Td>{rule.labelSimplified}</Td>
                      <Td>{rule.bankSubCategory}</Td>
                      <Td>
                        {editingRule === rule.id ? (
                          <InlineSelect
                            aria-label={`Category for ${rule.labelSimplified}`}
                            autoFocus
                            value={rule.budgetCategoryId}
                            onChange={(e) =>
                              updateRuleMutation.mutate(
                                { id: rule.id, budgetCategoryId: Number(e.target.value) },
                                { onSuccess: () => setEditingRule(null) },
                              )
                            }
                            onBlur={() => setEditingRule(null)}
                          >
                            {categories.map((cat) => (
                              <option key={cat.id} value={cat.id}>
                                {cat.name}
                              </option>
                            ))}
                          </InlineSelect>
                        ) : (
                          rule.budgetCategoryName
                        )}
                      </Td>
                      <Td>
                        <RowMenu
                          label={`Actions for ${rule.labelSimplified}`}
                          items={[
                            {
                              label: "Change category",
                              icon: <Pencil size={14} />,
                              onSelect: () => setEditingRule(rule.id),
                            },
                            {
                              label: "Delete rule",
                              icon: <Trash2 size={14} />,
                              onSelect: () => deleteRuleMutation.mutate(rule.id),
                            },
                          ]}
                        />
                      </Td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </TableScroll>
          )}
        </>
      )}

      <SectionTitle>Merchant aliases</SectionTitle>

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
                <Th>Original label</Th>
                <Th>Display name</Th>
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
