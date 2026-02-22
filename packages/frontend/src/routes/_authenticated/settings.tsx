import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import styled from "styled-components";
import {
  useMappingRules,
  useDeleteMappingRule,
} from "../../hooks/useMappingRules.js";
import {
  useMerchantAliases,
  useCreateMerchantAlias,
  useUpdateMerchantAlias,
  useDeleteMerchantAlias,
} from "../../hooks/useMerchantAliases.js";

const Title = styled.h1`
  font-size: 24px;
  margin-bottom: 24px;
`;

const SectionTitle = styled.h2`
  font-size: 18px;
  margin: 32px 0 16px;

  &:first-of-type {
    margin-top: 0;
  }
`;

const Table = styled.table`
  width: 100%;
  background: #fff;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  border-collapse: collapse;
  overflow: hidden;
`;

const Th = styled.th`
  text-align: left;
  padding: 12px 16px;
  background: #f9fafb;
  border-bottom: 1px solid #e5e7eb;
  font-size: 13px;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: #6b7280;
`;

const Td = styled.td`
  padding: 10px 16px;
  border-bottom: 1px solid #f3f4f6;
  font-size: 14px;
`;

const DangerButton = styled.button`
  background: none;
  border: none;
  color: #dc2626;
  cursor: pointer;
  font-size: 13px;

  &:hover {
    text-decoration: underline;
  }
`;

const AddForm = styled.form`
  display: flex;
  gap: 8px;
  margin-bottom: 16px;
`;

const Input = styled.input`
  padding: 8px 12px;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  font-size: 14px;
  flex: 1;
`;

const Button = styled.button`
  background: #1a1a2e;
  color: #fff;
  border: none;
  padding: 8px 16px;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;

  &:hover {
    background: #16213e;
  }
`;

const EmptyState = styled.p`
  color: #6b7280;
  padding: 24px;
  text-align: center;
  font-size: 14px;
`;

const EditableCell = styled.td`
  padding: 10px 16px;
  border-bottom: 1px solid #f3f4f6;
  font-size: 14px;
  cursor: pointer;

  &:hover {
    background: #f9fafb;
  }
`;

const EditInput = styled.input`
  padding: 4px 8px;
  border: 1px solid #3b82f6;
  border-radius: 4px;
  font-size: 14px;
  width: 100%;
`;

export const Route = createFileRoute("/_authenticated/settings")({
  component: SettingsPage,
});

function SettingsPage() {
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
      <Title>Settings</Title>

      <SectionTitle>Mapping Rules</SectionTitle>
      {rules.length === 0 ? (
        <EmptyState>No mapping rules yet.</EmptyState>
      ) : (
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
                  <DangerButton
                    onClick={() => deleteRuleMutation.mutate(rule.id)}
                  >
                    Delete
                  </DangerButton>
                </Td>
              </tr>
            ))}
          </tbody>
        </Table>
      )}

      <SectionTitle>Merchant Aliases</SectionTitle>

      <AddForm onSubmit={handleAddAlias}>
        <Input
          placeholder="Original label (e.g. SARL CHEVALLIER)"
          value={aliasOriginal}
          onChange={(e) => setAliasOriginal(e.target.value)}
        />
        <Input
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
                  <DangerButton
                    onClick={() => deleteAliasMutation.mutate(alias.id)}
                  >
                    Delete
                  </DangerButton>
                </Td>
              </tr>
            ))}
          </tbody>
        </Table>
      )}
    </>
  );
}
