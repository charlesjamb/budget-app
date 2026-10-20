// ---- Entities ----

export type CategoryType = "fixed" | "variable";

export interface User {
  id: number;
  email: string;
  displayName: string | null;
}

export interface BudgetCategory {
  id: number;
  name: string;
  groupName?: string;
  type: CategoryType;
  icon?: string | null;
}

export interface Transaction {
  id: number;
  dateOperation: string;
  labelSimplified: string;
  labelOperation: string;
  amount: number;
  bankCategory: string;
  bankSubCategory: string;
  budgetCategoryId: number | null;
  budgetCategoryName: string | null;
  displayName: string | null;
  reference: string | null;
  additionalInfo: string | null;
  operationType: string;
  excluded: boolean;
  excludedReason: string | null;
  reimbursedAmount: number;
  reimbursementNote: string | null;
  categoryLocked: boolean;
}

export interface MappingRule {
  id: number;
  bankSubCategory: string;
  labelSimplified: string;
  budgetCategoryId: number;
  budgetCategoryName?: string;
}

export interface MerchantAlias {
  id: number;
  originalLabel: string;
  displayName: string;
}

// ---- API Responses ----

export interface AuthMeResponse {
  user: User;
  householdId: number;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  user: User;
  householdId: number;
}

export interface CategoriesResponse {
  categories: BudgetCategory[];
}

export interface CreateCategoryRequest {
  name: string;
  groupName?: string;
  type?: CategoryType;
  icon?: string | null;
}

export interface UpdateCategoryRequest {
  name: string;
  groupName?: string;
  type?: CategoryType;
  icon?: string | null;
}

export interface ImportResult {
  imported: number;
  skipped: number;
  unmappedCount: number;
}

export interface TransactionsResponse {
  transactions: Transaction[];
}

export interface CategorySummary {
  id: number;
  name: string;
  totalAmount: number;
  transactionCount: number;
  budgetAmountCents?: number;
  type?: CategoryType;
}

export interface MonthlySummary {
  month: string;
  totalAmount: number;
  globalBudgetCents?: number;
  categories: CategorySummary[];
  uncategorized: {
    totalAmount: number;
    transactionCount: number;
  };
}

export interface HistoryData {
  months: string[];
  categories: {
    id: number;
    name: string;
    amounts: Record<string, number>;
  }[];
}

export interface UncategorizedTransaction {
  id: number;
  dateOperation: string;
  labelSimplified: string;
  labelOperation: string;
  amount: number;
}

export interface UncategorizedGroup {
  bankSubCategory: string;
  labelSimplified: string;
  count: number;
  transactions: UncategorizedTransaction[];
}

export interface UncategorizedSubcategoriesResponse {
  subcategories: UncategorizedGroup[];
}

export interface MappingRulesResponse {
  rules: MappingRule[];
}

export interface CreateMappingRuleRequest {
  bankSubCategory: string;
  labelSimplified: string;
  budgetCategoryId: number;
}

export interface UpdateMappingRuleRequest {
  budgetCategoryId: number;
}

export interface ClassifyRequest {
  bankSubCategory: string;
  labelSimplified: string;
  budgetCategoryId: number;
}

export interface ClassifyResponse {
  rule: MappingRule;
  updatedCount: number;
}

export interface MerchantAliasesResponse {
  aliases: MerchantAlias[];
}

export interface CreateMerchantAliasRequest {
  originalLabel: string;
  displayName: string;
}

export interface UpdateMerchantAliasRequest {
  displayName: string;
}

// ---- Budget ----

export const GLOBAL_CAP_CATEGORY_ID = 0;

export interface MonthlyBudget {
  categoryId: number;
  amountCents: number;
}

export interface MonthlyBudgetsResponse {
  month: string;
  budgets: MonthlyBudget[];
}

export interface UpsertBudgetsRequest {
  month: string;
  budgets: MonthlyBudget[];
}

export interface CopyBudgetRequest {
  sourceMonth: string;
  targetMonth: string;
}

export interface CopyBudgetResponse {
  copiedCount: number;
}

export type ExcludeTransactionRequest = {
  excluded: boolean;
  reason?: string;
};

export interface ReimbursementRequest {
  amount: number;
  note?: string;
}

// ---- Contributions (Monthly Split) ----

export interface ContributionMember {
  userId: number;
  email: string;
  displayName: string | null;
  revenueCents: number;
}

export interface MonthlyContributionsResponse {
  month: string;
  members: ContributionMember[];
}

export interface UpsertContributionsRequest {
  month: string;
  contributions: { userId: number; revenueCents: number }[];
}
