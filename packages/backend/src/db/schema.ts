import { sqliteTable, text, integer, unique } from "drizzle-orm/sqlite-core";
import { sql } from "drizzle-orm";

export const users = sqliteTable("users", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  createdAt: text("created_at")
    .notNull()
    .default(sql`(datetime('now'))`),
});

export const households = sqliteTable("households", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  createdAt: text("created_at")
    .notNull()
    .default(sql`(datetime('now'))`),
});

export const householdMembers = sqliteTable(
  "household_members",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    userId: integer("user_id")
      .notNull()
      .references(() => users.id),
    householdId: integer("household_id")
      .notNull()
      .references(() => households.id),
  },
  (table) => [unique().on(table.userId, table.householdId)],
);

export const sessions = sqliteTable("sessions", {
  id: text("id").primaryKey(),
  userId: integer("user_id")
    .notNull()
    .references(() => users.id),
  expiresAt: text("expires_at").notNull(),
  createdAt: text("created_at")
    .notNull()
    .default(sql`(datetime('now'))`),
});

export const budgetCategories = sqliteTable(
  "budget_categories",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    householdId: integer("household_id")
      .notNull()
      .references(() => households.id),
    name: text("name").notNull(),
    groupName: text("group_name"),
    type: text("type").notNull().default("variable"),
    createdAt: text("created_at")
      .notNull()
      .default(sql`(datetime('now'))`),
    updatedAt: text("updated_at")
      .notNull()
      .default(sql`(datetime('now'))`),
  },
  (table) => [unique().on(table.householdId, table.name)],
);

export const monthlyBudgets = sqliteTable(
  "monthly_budgets",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    householdId: integer("household_id")
      .notNull()
      .references(() => households.id),
    month: text("month").notNull(),
    categoryId: integer("category_id").notNull(),
    amountCents: integer("amount_cents").notNull(),
    createdAt: text("created_at")
      .notNull()
      .default(sql`(datetime('now'))`),
    updatedAt: text("updated_at")
      .notNull()
      .default(sql`(datetime('now'))`),
  },
  (table) => [unique().on(table.householdId, table.month, table.categoryId)],
);

export const transactions = sqliteTable("transactions", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  householdId: integer("household_id")
    .notNull()
    .references(() => households.id),
  dateOperation: text("date_operation").notNull(),
  labelSimplified: text("label_simplified").notNull(),
  labelOperation: text("label_operation").notNull(),
  amount: integer("amount").notNull(),
  bankCategory: text("bank_category").notNull(),
  bankSubCategory: text("bank_sub_category").notNull(),
  budgetCategoryId: integer("budget_category_id").references(
    () => budgetCategories.id,
  ),
  reference: text("reference"),
  additionalInfo: text("additional_info"),
  operationType: text("operation_type").notNull(),
  dedupHash: text("dedup_hash").notNull().unique(),
  createdAt: text("created_at")
    .notNull()
    .default(sql`(datetime('now'))`),
});

export const mappingRules = sqliteTable(
  "mapping_rules",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    householdId: integer("household_id")
      .notNull()
      .references(() => households.id),
    bankSubCategory: text("bank_sub_category").notNull(),
    labelSimplified: text("label_simplified").notNull(),
    budgetCategoryId: integer("budget_category_id")
      .notNull()
      .references(() => budgetCategories.id),
    createdAt: text("created_at")
      .notNull()
      .default(sql`(datetime('now'))`),
  },
  (table) => [
    unique().on(
      table.householdId,
      table.bankSubCategory,
      table.labelSimplified,
    ),
  ],
);

export const merchantAliases = sqliteTable(
  "merchant_aliases",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    householdId: integer("household_id")
      .notNull()
      .references(() => households.id),
    originalLabel: text("original_label").notNull(),
    displayName: text("display_name").notNull(),
    createdAt: text("created_at")
      .notNull()
      .default(sql`(datetime('now'))`),
  },
  (table) => [unique().on(table.householdId, table.originalLabel)],
);
