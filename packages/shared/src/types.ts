// ---- Entities ----

export interface User {
  id: number;
  email: string;
}

export interface BudgetCategory {
  id: number;
  name: string;
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
}

export interface CategoriesResponse {
  categories: BudgetCategory[];
}

export interface CreateCategoryRequest {
  name: string;
}

export interface UpdateCategoryRequest {
  name: string;
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
}

export interface MonthlySummary {
  month: string;
  totalAmount: number;
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
