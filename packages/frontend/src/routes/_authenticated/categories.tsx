import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import styled from "styled-components";
import type { CategoryType } from "@budget-app/shared";
import { FolderOpen } from "lucide-react";
import {
  Button,
  Input,
  DangerButton,
  EditInput,
  Select,
  ErrorMessage,
  EmptyState,
  PageTitle,
  TitleRow,
} from "../../components/ui.js";
import {
  useCategories,
  useCreateCategory,
  useUpdateCategory,
  useDeleteCategory,
} from "../../hooks/useCategories.js";

const AddForm = styled.form`
  display: flex;
  gap: 8px;
  margin-bottom: 24px;
`;

const FormInput = styled(Input)`
  flex: 1;
`;

const List = styled.div`
  background: ${(p) => p.theme.colors.card};
  border-radius: ${(p) => p.theme.radii.lg};
  box-shadow: ${(p) => p.theme.shadows.card};
  overflow: hidden;
`;

const ListItem = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  border-bottom: 1px solid ${(p) => p.theme.colors.border};

  &:last-child {
    border-bottom: none;
  }
`;

const CategoryName = styled.span`
  font-size: 15px;
`;

const Actions = styled.div`
  display: flex;
  gap: 8px;
  align-items: center;
`;

const GroupBadge = styled.span`
  font-size: 11px;
  color: ${(p) => p.theme.colors.textMuted};
  background: ${(p) => p.theme.colors.background};
  padding: 2px 8px;
  border-radius: 10px;
  margin-left: 8px;
`;

const TypeBadge = styled.span`
  font-size: 11px;
  color: ${(p) => p.theme.colors.text};
  background: ${(p) => p.theme.colors.border};
  padding: 2px 8px;
  border-radius: 10px;
  margin-left: 8px;
`;

export const Route = createFileRoute("/_authenticated/categories")({
  component: CategoriesPage,
});

function CategoriesPage() {
  const [newName, setNewName] = useState("");
  const [newGroupName, setNewGroupName] = useState("");
  const [newType, setNewType] = useState<CategoryType>("variable");
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editName, setEditName] = useState("");
  const [editGroupName, setEditGroupName] = useState("");
  const [editType, setEditType] = useState<CategoryType>("variable");

  const categoriesQuery = useCategories();
  const createMutation = useCreateCategory();
  const updateMutation = useUpdateCategory();
  const deleteMutation = useDeleteCategory();

  const categories = categoriesQuery.data?.categories ?? [];

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;
    createMutation.mutate(
      {
        name: newName.trim(),
        groupName: newGroupName.trim() || undefined,
        type: newType,
      },
      {
        onSuccess: () => {
          setNewName("");
          setNewGroupName("");
        },
      },
    );
  };

  const handleStartEdit = (
    id: number,
    name: string,
    groupName?: string,
    type: CategoryType = "variable",
  ) => {
    setEditingId(id);
    setEditName(name);
    setEditGroupName(groupName ?? "");
    setEditType(type);
  };

  const handleSaveEdit = (id: number) => {
    if (!editName.trim()) return;
    updateMutation.mutate(
      {
        id,
        name: editName.trim(),
        groupName: editGroupName.trim(),
        type: editType,
      },
      { onSuccess: () => setEditingId(null) },
    );
  };

  return (
    <>
      <TitleRow>
        <FolderOpen size={28} strokeWidth={2} />
        <PageTitle>Budget Categories</PageTitle>
      </TitleRow>

      <AddForm onSubmit={handleAdd}>
        <FormInput
          placeholder="New category name..."
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
        />
        <Input
          placeholder="Group (optional)"
          value={newGroupName}
          onChange={(e) => setNewGroupName(e.target.value)}
          style={{ flex: "0 0 160px" }}
        />
        <Select value={newType} onChange={(e) => setNewType(e.target.value as CategoryType)}>
          <option value="variable">Variable</option>
          <option value="fixed">Fixed</option>
        </Select>
        <Button type="submit" disabled={createMutation.isPending}>
          Add
        </Button>
      </AddForm>

      {createMutation.isError && (
        <ErrorMessage>Failed to create category. Name may already exist.</ErrorMessage>
      )}

      {categories.length === 0 ? (
        <EmptyState>No categories yet. Add your first one above!</EmptyState>
      ) : (
        <List>
          {categories.map((cat) => (
            <ListItem key={cat.id}>
              {editingId === cat.id ? (
                <>
                  <EditInput
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") handleSaveEdit(cat.id);
                      if (e.key === "Escape") setEditingId(null);
                    }}
                    autoFocus
                  />
                  <EditInput
                    value={editGroupName}
                    onChange={(e) => setEditGroupName(e.target.value)}
                    placeholder="Group"
                    onKeyDown={(e) => {
                      if (e.key === "Enter") handleSaveEdit(cat.id);
                      if (e.key === "Escape") setEditingId(null);
                    }}
                  />
                  <Select
                    value={editType}
                    onChange={(e) => setEditType(e.target.value as CategoryType)}
                  >
                    <option value="variable">Variable</option>
                    <option value="fixed">Fixed</option>
                  </Select>
                  <Actions>
                    <Button
                      onClick={() => handleSaveEdit(cat.id)}
                      disabled={updateMutation.isPending}
                    >
                      Save
                    </Button>
                    <DangerButton onClick={() => setEditingId(null)}>Cancel</DangerButton>
                  </Actions>
                </>
              ) : (
                <>
                  <CategoryName>
                    {cat.name}
                    <TypeBadge>{cat.type === "fixed" ? "Fixed" : "Variable"}</TypeBadge>
                    {cat.groupName && <GroupBadge>{cat.groupName}</GroupBadge>}
                  </CategoryName>
                  <Actions>
                    <Button
                      onClick={() => handleStartEdit(cat.id, cat.name, cat.groupName, cat.type)}
                    >
                      Edit
                    </Button>
                    <DangerButton onClick={() => deleteMutation.mutate(cat.id)}>
                      Delete
                    </DangerButton>
                  </Actions>
                </>
              )}
            </ListItem>
          ))}
        </List>
      )}

      {deleteMutation.isError && (
        <ErrorMessage>Cannot delete: transactions reference this category.</ErrorMessage>
      )}
    </>
  );
}
