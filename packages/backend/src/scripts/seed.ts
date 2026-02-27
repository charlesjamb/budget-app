import bcrypt from "bcrypt";
import { users, households, householdMembers } from "../db/schema.js";
import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import * as schema from "../db/schema.js";

const requiredEnvVars = [
  "CHARLES_EMAIL",
  "CHARLES_PASSWORD",
  "MATHILDE_EMAIL",
  "MATHILDE_PASSWORD",
];

for (const key of requiredEnvVars) {
  if (!process.env[key]) {
    console.error(`Missing required environment variable: ${key}`);
    process.exit(1);
  }
}

const USERS = [
  {
    email: process.env.CHARLES_EMAIL as string,
    password: process.env.CHARLES_PASSWORD as string,
  },
  {
    email: process.env.MATHILDE_EMAIL as string,
    password: process.env.MATHILDE_PASSWORD as string,
  },
];

async function seed() {
  const sqlite = new Database(process.env.DB_PATH ?? "budget.db");
  sqlite.pragma("journal_mode = WAL");
  sqlite.pragma("foreign_keys = ON");

  // Create tables
  sqlite.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS households (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS household_members (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL REFERENCES users(id),
      household_id INTEGER NOT NULL REFERENCES households(id),
      UNIQUE(user_id, household_id)
    );

    CREATE TABLE IF NOT EXISTS sessions (
      id TEXT PRIMARY KEY,
      user_id INTEGER NOT NULL REFERENCES users(id),
      expires_at TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS budget_categories (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      household_id INTEGER NOT NULL REFERENCES households(id),
      name TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now')),
      UNIQUE(household_id, name)
    );

    CREATE TABLE IF NOT EXISTS transactions (
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
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS mapping_rules (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      household_id INTEGER NOT NULL REFERENCES households(id),
      bank_sub_category TEXT NOT NULL,
      label_simplified TEXT NOT NULL,
      budget_category_id INTEGER NOT NULL REFERENCES budget_categories(id),
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      UNIQUE(household_id, bank_sub_category, label_simplified)
    );

    CREATE TABLE IF NOT EXISTS merchant_aliases (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      household_id INTEGER NOT NULL REFERENCES households(id),
      original_label TEXT NOT NULL,
      display_name TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      UNIQUE(household_id, original_label)
    );
  `);

  const db = drizzle(sqlite, { schema });

  // Create household
  db.insert(households).values({ name: "Famille" }).run();
  console.log("Created household: Famille");

  // Create users
  for (const { email, password } of USERS) {
    const passwordHash = await bcrypt.hash(password, 10);
    db.insert(users).values({ email, passwordHash }).run();
    console.log(`Created user: ${email}`);
  }

  // Add both users to household
  db.insert(householdMembers).values({ userId: 1, householdId: 1 }).run();
  db.insert(householdMembers).values({ userId: 2, householdId: 1 }).run();
  console.log("Added both users to household");

  console.log(
    "\nSeed complete! Users created. Login with the credentials you provided via environment variables.",
  );
}

seed().catch(console.error);
