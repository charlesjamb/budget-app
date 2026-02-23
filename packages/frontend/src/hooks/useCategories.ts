import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { CreateCategoryRequest } from "@budget-app/shared";
import {
  getCategories,
  createCategory,
  updateCategory,
  deleteCategory,
} from "../api/categories.js";

export function useCategories() {
  return useQuery({
    queryKey: ["categories"],
    queryFn: getCategories,
  });
}

export function useCreateCategory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateCategoryRequest) => createCategory(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["categories"] });
    },
  });
}

export function useUpdateCategory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      name,
      groupName,
    }: {
      id: number;
      name: string;
      groupName?: string;
    }) => updateCategory(id, { name, groupName }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["categories"] });
    },
  });
}

export function useDeleteCategory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteCategory,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["categories"] });
    },
  });
}
