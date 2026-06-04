import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import * as schema from "./schema.js";

export type AppDatabase = ReturnType<typeof createDb>;

function initSchema(sqlite: Database.Database, ifNotExists: boolean) {
  const modifier = ifNotExists ? "IF NOT EXISTS" : "";
  sqlite.exec(`
    CREATE TABLE ${modifier} users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE ${modifier} households (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE ${modifier} household_members (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL REFERENCES users(id),
      household_id INTEGER NOT NULL REFERENCES households(id),
      UNIQUE(user_id, household_id)
    );

    CREATE TABLE ${modifier} sessions (
      id TEXT PRIMARY KEY,
      user_id INTEGER NOT NULL REFERENCES users(id),
      expires_at TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE ${modifier} budget_categories (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      household_id INTEGER NOT NULL REFERENCES households(id),
      name TEXT NOT NULL,
      group_name TEXT,
      type TEXT NOT NULL DEFAULT 'variable',
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now')),
      UNIQUE(household_id, name)
    );

    CREATE TABLE ${modifier} monthly_budgets (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      household_id INTEGER NOT NULL REFERENCES households(id),
      month TEXT NOT NULL,
      category_id INTEGER NOT NULL,
      amount_cents INTEGER NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now')),
      UNIQUE(household_id, month, category_id)
    );

    CREATE TABLE ${modifier} transactions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      household_id INTEGER NOT NULL REFERENCES households(id),
      date_operation TEXT NOT NULL,
      label_simplified TEXT NOT NULL,
      label_operation TEXT NOT NULL,
      amount INTEGER NOT NULL,
      bank_category TEXT NOT NULL,
      bank_sub_category TEXT NOT NULL,
      budget_category_id INTEGER REFERENCES budget_categories(id),
      reference TEXT,
      additional_info TEXT,
      operation_type TEXT NOT NULL,
      dedup_hash TEXT NOT NULL UNIQUE,
      excluded INTEGER NOT NULL DEFAULT 0,
      excluded_reason TEXT,
      reimbursed_amount INTEGER NOT NULL DEFAULT 0,
      reimbursement_note TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE ${modifier} mapping_rules (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      household_id INTEGER NOT NULL REFERENCES households(id),
      bank_sub_category TEXT NOT NULL,
      label_simplified TEXT NOT NULL,
      budget_category_id INTEGER NOT NULL REFERENCES budget_categories(id),
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      UNIQUE(household_id, bank_sub_category, label_simplified)
    );

    CREATE TABLE ${modifier} monthly_contributions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      household_id INTEGER NOT NULL REFERENCES households(id),
      month TEXT NOT NULL,
      user_id INTEGER NOT NULL REFERENCES users(id),
      revenue_cents INTEGER NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now')),
      UNIQUE(household_id, month, user_id)
    );

    CREATE TABLE ${modifier} merchant_aliases (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      household_id INTEGER NOT NULL REFERENCES households(id),
      original_label TEXT NOT NULL,
      display_name TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      UNIQUE(household_id, original_label)
    );
  `);
}

function runMigrations(sqlite: Database.Database) {
  const cols = sqlite.prepare("PRAGMA table_info(budget_categories)").all() as {
    name: string;
  }[];
  if (!cols.some((c) => c.name === "group_name")) {
    sqlite.exec("ALTER TABLE budget_categories ADD COLUMN group_name TEXT");
  }
  if (!cols.some((c) => c.name === "type")) {
    sqlite.exec(
      "ALTER TABLE budget_categories ADD COLUMN type TEXT NOT NULL DEFAULT 'variable'",
    );
  }

  const txCols = sqlite.prepare("PRAGMA table_info(transactions)").all() as {
    name: string;
  }[];
  if (!txCols.some((c) => c.name === "excluded")) {
    sqlite.exec(
      "ALTER TABLE transactions ADD COLUMN excluded INTEGER NOT NULL DEFAULT 0",
    );
  }
  if (!txCols.some((c) => c.name === "excluded_reason")) {
    sqlite.exec("ALTER TABLE transactions ADD COLUMN excluded_reason TEXT");
  }
  if (!txCols.some((c) => c.name === "reimbursed_amount")) {
    sqlite.exec(
      "ALTER TABLE transactions ADD COLUMN reimbursed_amount INTEGER NOT NULL DEFAULT 0",
    );
  }
  if (!txCols.some((c) => c.name === "reimbursement_note")) {
    sqlite.exec("ALTER TABLE transactions ADD COLUMN reimbursement_note TEXT");
  }
}

export function createDb(path?: string) {
  const sqlite = new Database(path ?? "budget.db");
  sqlite.pragma("journal_mode = WAL");
  sqlite.pragma("foreign_keys = ON");

  initSchema(sqlite, true);
  runMigrations(sqlite);

  const db = drizzle(sqlite, { schema });

  return db;
}

export function createTestDb() {
  const sqlite = new Database(":memory:");
  sqlite.pragma("foreign_keys = ON");

  const db = drizzle(sqlite, { schema });

  // Create all tables for tests
  initSchema(sqlite, false);

  return db;
}
