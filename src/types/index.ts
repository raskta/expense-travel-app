export interface Trip {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
  budget: number;
  description?: string;
  status: 'active' | 'completed';
  createdAt: string;
}

export interface Expense {
  id: string;
  tripId: string;
  date: string;
  category: ExpenseCategory;
  amount: number;
  description: string;
  receipt?: string;
  createdAt: string;
}

export type ExpenseCategory =
  | 'food'
  | 'accommodation'
  | 'transportation'
  | 'entertainment'
  | 'shopping'
  | 'other';

export interface ExpenseSummary {
  total: number;
  byCategory: Record<ExpenseCategory, number>;
  budgetComparison: {
    budget: number;
    spent: number;
    remaining: number;
    percentageUsed: number;
  };
}
