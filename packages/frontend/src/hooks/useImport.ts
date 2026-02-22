import { useMutation, useQueryClient } from "@tanstack/react-query";
import { importCsv } from "../api/import.js";

export function useImport() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: importCsv,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["transactions"] });
    },
  });
}
