import { apiUpload } from "./client.js";
import type { ImportResult } from "@budget-app/shared";

export function importCsv(file: File): Promise<ImportResult> {
  const formData = new FormData();
  formData.append("file", file);
  return apiUpload("/api/import", formData);
}
