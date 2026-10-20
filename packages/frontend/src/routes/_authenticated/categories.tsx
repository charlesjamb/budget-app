import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import styled from "styled-components";
import type { BudgetCategory, CategoryType } from "@budget-app/shared";
import { FolderOpen, Pencil, Trash2 } from "lucide-react";
import {
  Button,
  SecondaryButton,
  EditInput,
  Select,
  Chip,
  ErrorMessage,
  PageTitle,
  TitleRow,
} from "../../components/ui.js";
import { EmojiPicker } from "../../components/EmojiPicker.js";
import { RowMenu } from "../../components/RowMenu.js";
import {
  useCategories,
  useCreateCategory,
  useUpdateCategory,
  useDeleteCategory,
} from "../../hooks/useCategories.js";

const List = styled.div`
  background: ${(p) => p.theme.colors.card};
  border-radius: ${(p) => p.theme.radii.lg};
  box-shadow: ${(p) => p.theme.shadows.card};
`;

const Row = styled.div`
  display: flex;
  align-items: center;
  gap: ${(p) => p.theme.space.md};
  padding: ${(p) => p.theme.space.md} ${(p) => p.theme.space.lg};
  border-bottom: 1px solid ${(p) => p.theme.colors.border};

  &:last-child {
    border-bottom: none;
  }

  &:hover [data-row-menu-trigger] {
    opacity: 1;
  }
`;

const RowBody = styled.button`
  flex: 1;
  min-width: 0;
  display: flex;
  align-items: center;
  gap: ${(p) => p.theme.space.md};
  padding: 0;
  background: none;
  border: none;
  color: ${(p) => p.theme.colors.text};
  font-size: ${(p) => p.theme.fontSize.lg};
  text-align: left;
  cursor: pointer;
`;

const Icon = styled.span`
  width: 28px;
  text-align: center;
  font-size: 20px;
`;

const Name = styled.span`
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

const Chips = styled.span`
  display: inline-flex;
  gap: ${(p) => p.theme.space.xs};
  flex-wrap: wrap;
`;

const FormRow = styled.form`
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: ${(p) => p.theme.space.sm};
  padding: ${(p) => p.theme.space.md} ${(p) => p.theme.space.lg};
  border-bottom: 1px solid ${(p) => p.theme.colors.border};
  background: ${(p) => p.theme.colors.accentSoft};

  &:last-child {
    border-bottom: none;
  }
`;

const NameInput = styled(EditInput)`
  flex: 1 1 160px;
  min-width: 0;
  padding: 8px 10px;
`;

const GroupInput = styled(EditInput)`
  flex: 0 1 160px;
  min-width: 0;
  padding: 8px 10px;
`;

const NewRow = styled.button`
  width: 100%;
  padding: ${(p) => p.theme.space.md} ${(p) => p.theme.space.lg};
  background: none;
  border: none;
  color: ${(p) => p.theme.colors.primary};
  font-size: ${(p) => p.theme.fontSize.md};
  font-weight: 600;
  text-align: left;
  cursor: pointer;

  &:hover {
    background: ${(p) => p.theme.colors.background};
  }
`;

interface CategoryDraft {
  name: string;
  groupName: string;
  type: CategoryType;
  icon: string;
}

const EMPTY_DRAFT: CategoryDraft = { name: "", groupName: "", type: "variable", icon: "" };

interface CategoryFormProps {
  initial: CategoryDraft;
  pending: boolean;
  onSubmit: (draft: CategoryDraft) => void;
  onCancel: () => void;
}

/** Inline row form shared by "edit category" and "+ New category". */
function CategoryForm({ initial, pending, onSubmit, onCancel }: CategoryFormProps) {
  const [draft, setDraft] = useState(initial);
  const set = <K extends keyof CategoryDraft>(key: K, value: CategoryDraft[K]) =>
    setDraft((prev) => ({ ...prev, [key]: value }));

  return (
    <FormRow
      onSubmit={(e) => {
        e.preventDefault();
        if (draft.name.trim()) onSubmit(draft);
      }}
      onKeyDown={(e) => {
        if (e.key === "Escape") onCancel();
      }}
    >
      <EmojiPicker value={draft.icon} onChange={(icon) => set("icon", icon)} />
      <NameInput
        aria-label="Category name"
        placeholder="Name"
        value={draft.name}
        onChange={(e) => set("name", e.target.value)}
        autoFocus
      />
      <GroupInput
        aria-label="Group"
        placeholder="Group (optional)"
        value={draft.groupName}
        onChange={(e) => set("groupName", e.target.value)}
      />
      <Select
        aria-label="Type"
        value={draft.type}
        onChange={(e) => set("type", e.target.value as CategoryType)}
      >
        <option value="variable">Variable</option>
        <option value="fixed">Fixed</option>
      </Select>
      <Button type="submit" disabled={pending || !draft.name.trim()}>
        Save
      </Button>
      <SecondaryButton type="button" onClick={onCancel}>
        Cancel
      </SecondaryButton>
    </FormRow>
  );
}

function toDraft(cat: BudgetCategory): CategoryDraft {
  return {
    name: cat.name,
    groupName: cat.groupName ?? "",
    type: cat.type ?? "variable",
    icon: cat.icon ?? "",
  };
}

export const Route = createFileRoute("/_authenticated/categories")({
  component: CategoriesPage,
});

function CategoriesPage() {
  const [editingId, setEditingId] = useState<number | null>(null);
  const [creating, setCreating] = useState(false);

  const categoriesQuery = useCategories();
  const createMutation = useCreateCategory();
  const updateMutation = useUpdateCategory();
  const deleteMutation = useDeleteCategory();

  const categories = categoriesQuery.data?.categories ?? [];

  const handleCreate = (draft: CategoryDraft) => {
    createMutation.mutate(
      {
        name: draft.name.trim(),
        groupName: draft.groupName.trim() || undefined,
        type: draft.type,
        icon: draft.icon.trim() || undefined,
      },
      { onSuccess: () => setCreating(false) },
    );
  };

  const handleUpdate = (id: number, draft: CategoryDraft) => {
    updateMutation.mutate(
      {
        id,
        name: draft.name.trim(),
        groupName: draft.groupName.trim(),
        type: draft.type,
        icon: draft.icon.trim() || null,
      },
      { onSuccess: () => setEditingId(null) },
    );
  };

  return (
    <>
      <TitleRow>
        <FolderOpen size={28} strokeWidth={2} />
        <PageTitle>Categories</PageTitle>
      </TitleRow>

      <List>
        {categories.map((cat) =>
          editingId === cat.id ? (
            <CategoryForm
              key={cat.id}
              initial={toDraft(cat)}
              pending={updateMutation.isPending}
              onSubmit={(draft) => handleUpdate(cat.id, draft)}
              onCancel={() => setEditingId(null)}
            />
          ) : (
            <Row key={cat.id}>
              <RowBody
                type="button"
                aria-label={`Edit ${cat.name}`}
                onClick={() => {
                  setCreating(false);
                  setEditingId(cat.id);
                }}
              >
                <Icon aria-hidden>{cat.icon}</Icon>
                <Name>{cat.name}</Name>
                <Chips>
                  <Chip $tone={cat.type === "fixed" ? "accent" : "neutral"}>
                    {cat.type === "fixed" ? "Fixed" : "Variable"}
                  </Chip>
                  {cat.groupName && <Chip>{cat.groupName}</Chip>}
                </Chips>
              </RowBody>
              <RowMenu
                label={`Actions for ${cat.name}`}
                items={[
                  {
                    label: "Edit",
                    icon: <Pencil size={14} />,
                    onSelect: () => {
                      setCreating(false);
                      setEditingId(cat.id);
                    },
                  },
                  {
                    label: "Delete",
                    icon: <Trash2 size={14} />,
                    onSelect: () => deleteMutation.mutate(cat.id),
                  },
                ]}
              />
            </Row>
          ),
        )}
        {creating ? (
          <CategoryForm
            initial={EMPTY_DRAFT}
            pending={createMutation.isPending}
            onSubmit={handleCreate}
            onCancel={() => setCreating(false)}
          />
        ) : (
          <NewRow
            type="button"
            onClick={() => {
              setEditingId(null);
              setCreating(true);
            }}
          >
            + New category
          </NewRow>
        )}
      </List>

      {createMutation.isError && (
        <ErrorMessage>Failed to create category. Name may already exist.</ErrorMessage>
      )}
      {deleteMutation.isError && (
        <ErrorMessage>Cannot delete: transactions reference this category.</ErrorMessage>
      )}
    </>
  );
}
