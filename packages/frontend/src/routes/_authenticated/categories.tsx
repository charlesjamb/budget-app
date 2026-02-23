import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import styled from "styled-components";
import {
  useCategories,
  useCreateCategory,
  useUpdateCategory,
  useDeleteCategory,
} from "../../hooks/useCategories.js";

const Title = styled.h1`
  font-size: 24px;
  margin-bottom: 24px;
`;

const AddForm = styled.form`
  display: flex;
  gap: 8px;
  margin-bottom: 24px;
`;

const Input = styled.input`
  padding: 8px 12px;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  font-size: 14px;
  flex: 1;

  &:focus {
    outline: none;
    border-color: #3b82f6;
    box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.2);
  }
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

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
`;

const DangerButton = styled.button`
  background: none;
  border: none;
  color: #dc2626;
  cursor: pointer;
  font-size: 13px;
  padding: 4px 8px;

  &:hover {
    text-decoration: underline;
  }
`;

const List = styled.div`
  background: #fff;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  overflow: hidden;
`;

const ListItem = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  border-bottom: 1px solid #f3f4f6;

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

const EditInput = styled.input`
  padding: 4px 8px;
  border: 1px solid #3b82f6;
  border-radius: 4px;
  font-size: 14px;
`;

const EmptyState = styled.p`
  text-align: center;
  color: #6b7280;
  padding: 32px;
  font-size: 15px;
`;

const GroupBadge = styled.span`
  font-size: 11px;
  color: #6b7280;
  background: #f3f4f6;
  padding: 2px 8px;
  border-radius: 10px;
  margin-left: 8px;
`;

const ErrorMessage = styled.p`
  color: #dc2626;
  font-size: 13px;
  margin-top: 4px;
`;

export const Route = createFileRoute("/_authenticated/categories")({
  component: CategoriesPage,
});

function CategoriesPage() {
  const [newName, setNewName] = useState("");
  const [newGroupName, setNewGroupName] = useState("");
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editName, setEditName] = useState("");
  const [editGroupName, setEditGroupName] = useState("");

  const categoriesQuery = useCategories();
  const createMutation = useCreateCategory();
  const updateMutation = useUpdateCategory();
  const deleteMutation = useDeleteCategory();

  const categories = categoriesQuery.data?.categories ?? [];

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;
    createMutation.mutate(
      { name: newName.trim(), groupName: newGroupName.trim() || undefined },
      {
        onSuccess: () => {
          setNewName("");
          setNewGroupName("");
        },
      },
    );
  };

  const handleStartEdit = (id: number, name: string, groupName?: string) => {
    setEditingId(id);
    setEditName(name);
    setEditGroupName(groupName ?? "");
  };

  const handleSaveEdit = (id: number) => {
    if (!editName.trim()) return;
    updateMutation.mutate(
      {
        id,
        name: editName.trim(),
        groupName: editGroupName.trim() || undefined,
      },
      { onSuccess: () => setEditingId(null) },
    );
  };

  return (
    <>
      <Title>Budget Categories</Title>

      <AddForm onSubmit={handleAdd}>
        <Input
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
        <Button type="submit" disabled={createMutation.isPending}>
          Add
        </Button>
      </AddForm>

      {createMutation.isError && (
        <ErrorMessage>
          Failed to create category. Name may already exist.
        </ErrorMessage>
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
                  <Actions>
                    <Button
                      onClick={() => handleSaveEdit(cat.id)}
                      disabled={updateMutation.isPending}
                    >
                      Save
                    </Button>
                    <DangerButton onClick={() => setEditingId(null)}>
                      Cancel
                    </DangerButton>
                  </Actions>
                </>
              ) : (
                <>
                  <CategoryName>
                    {cat.name}
                    {cat.groupName && <GroupBadge>{cat.groupName}</GroupBadge>}
                  </CategoryName>
                  <Actions>
                    <Button
                      onClick={() =>
                        handleStartEdit(cat.id, cat.name, cat.groupName)
                      }
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
        <ErrorMessage>
          Cannot delete: transactions reference this category.
        </ErrorMessage>
      )}
    </>
  );
}
