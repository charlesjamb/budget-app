import { describe, it, expect } from "vite-plus/test";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import Database from "better-sqlite3";
import { createDb } from "./connection.js";

function columnsOf(path: string, table: string): string[] {
  const sqlite = new Database(path);
  const cols = sqlite.prepare(`PRAGMA table_info(${table})`).all() as { name: string }[];
  sqlite.close();
  return cols.map((c) => c.name);
}

describe("createDb migrations", () => {
  it("adds the redesign columns to a database created before them", () => {
    const dir = mkdtempSync(join(tmpdir(), "budget-db-"));
    const path = join(dir, "old.db");

    try {
      const legacy = new Database(path);
      legacy.exec(`
        CREATE TABLE users (id INTEGER PRIMARY KEY AUTOINCREMENT, email TEXT NOT NULL UNIQUE, password_hash TEXT NOT NULL, created_at TEXT NOT NULL DEFAULT (datetime('now')));
        CREATE TABLE budget_categories (id INTEGER PRIMARY KEY AUTOINCREMENT, household_id INTEGER NOT NULL, name TEXT NOT NULL, group_name TEXT, type TEXT NOT NULL DEFAULT 'variable', created_at TEXT NOT NULL DEFAULT (datetime('now')), updated_at TEXT NOT NULL DEFAULT (datetime('now')));
        CREATE TABLE transactions (id INTEGER PRIMARY KEY AUTOINCREMENT, household_id INTEGER NOT NULL, date_operation TEXT NOT NULL, label_simplified TEXT NOT NULL, label_operation TEXT NOT NULL, amount INTEGER NOT NULL, bank_category TEXT NOT NULL, bank_sub_category TEXT NOT NULL, budget_category_id INTEGER, reference TEXT, additional_info TEXT, operation_type TEXT NOT NULL, dedup_hash TEXT NOT NULL UNIQUE, excluded INTEGER NOT NULL DEFAULT 0, excluded_reason TEXT, reimbursed_amount INTEGER NOT NULL DEFAULT 0, reimbursement_note TEXT, created_at TEXT NOT NULL DEFAULT (datetime('now')));
        INSERT INTO users (email, password_hash) VALUES ('a@b.c', 'x');
      `);
      legacy.close();

      createDb(path);

      expect(columnsOf(path, "users")).toContain("display_name");
      expect(columnsOf(path, "budget_categories")).toContain("icon");
      expect(columnsOf(path, "transactions")).toContain("category_locked");
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });
});
