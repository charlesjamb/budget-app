import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import * as schema from "./schema.js";

export type AppDatabase = ReturnType<typeof createDb>;

export function createDb(path?: string) {
  const sqlite = new Database(path ?? "budget.db");
  sqlite.pragma("journal_mode = WAL");
  sqlite.pragma("foreign_keys = ON");

  const db = drizzle(sqlite, { schema });

  return db;
}

export function createTestDb() {
  const sqlite = new Database(":memory:");
  sqlite.pragma("foreign_keys = ON");

  const db = drizzle(sqlite, { schema });

  // Create all tables for tests
  sqlite.exec(`
    CREATE TABLE users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE households (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE household_members (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL REFERENCES users(id),
      household_id INTEGER NOT NULL REFERENCES households(id),
      UNIQUE(user_id, household_id)
    );

    CREATE TABLE sessions (
      id TEXT PRIMARY KEY,
      user_id INTEGER NOT NULL REFERENCES users(id),
      expires_at TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE budget_categories (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      household_id INTEGER NOT NULL REFERENCES households(id),
      name TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now')),
      UNIQUE(household_id, name)
    );

    CREATE TABLE transactions (
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
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE mapping_rules (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      household_id INTEGER NOT NULL REFERENCES households(id),
      bank_sub_category TEXT NOT NULL,
      label_simplified TEXT NOT NULL,
      budget_category_id INTEGER NOT NULL REFERENCES budget_categories(id),
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      UNIQUE(household_id, bank_sub_category, label_simplified)
    );

    CREATE TABLE merchant_aliases (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      household_id INTEGER NOT NULL REFERENCES households(id),
      original_label TEXT NOT NULL,
      display_name TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      UNIQUE(household_id, original_label)
    );
  `);

  return db;
}
