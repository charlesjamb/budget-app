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
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editName, setEditName] = useState("");

  const categoriesQuery = useCategories();
  const createMutation = useCreateCategory();
  const updateMutation = useUpdateCategory();
  const deleteMutation = useDeleteCategory();

  const categories = categoriesQuery.data?.categories ?? [];

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;
    createMutation.mutate(
      { name: newName.trim() },
      {
        onSuccess: () => setNewName(""),
      },
    );
  };

  const handleStartEdit = (id: number, name: string) => {
    setEditingId(id);
    setEditName(name);
  };

  const handleSaveEdit = (id: number) => {
    if (!editName.trim()) return;
    updateMutation.mutate(
      { id, name: editName.trim() },
      { onSuccess: () => setEditingId(null) },
    );
  };

  return (
    <>
      <Title>🏷️ Budget Categories</Title>

      <AddForm onSubmit={handleAdd}>
        <Input
          placeholder="New category name..."
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
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
                  <CategoryName>{cat.name}</CategoryName>
                  <Actions>
                    <Button onClick={() => handleStartEdit(cat.id, cat.name)}>
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
