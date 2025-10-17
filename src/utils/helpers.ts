import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Expense, ExpenseCategory, ExpenseSummary } from '../types';

export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(amount);
}

export function formatDate(date: string): string {
  return format(new Date(date), "dd 'de' MMMM 'de' yyyy", { locale: ptBR });
}

export function formatDateShort(date: string): string {
  return format(new Date(date), 'dd/MM/yyyy');
}

export function getCategoryLabel(category: ExpenseCategory): string {
  const labels: Record<ExpenseCategory, string> = {
    food: 'Alimentação',
    accommodation: 'Hospedagem',
    transportation: 'Transporte',
    entertainment: 'Entretenimento',
    shopping: 'Compras',
    other: 'Outros',
  };
  return labels[category];
}

export function getCategoryIcon(category: ExpenseCategory): string {
  const icons: Record<ExpenseCategory, string> = {
    food: '🍽️',
    accommodation: '🏨',
    transportation: '🚗',
    entertainment: '🎭',
    shopping: '🛍️',
    other: '📌',
  };
  return icons[category];
}

export function calculateExpenseSummary(
  expenses: Expense[],
  budget: number
): ExpenseSummary {
  const total = expenses.reduce((sum, exp) => sum + exp.amount, 0);

  const byCategory: Record<ExpenseCategory, number> = {
    food: 0,
    accommodation: 0,
    transportation: 0,
    entertainment: 0,
    shopping: 0,
    other: 0,
  };

  expenses.forEach((exp) => {
    byCategory[exp.category] += exp.amount;
  });

  return {
    total,
    byCategory,
    budgetComparison: {
      budget,
      spent: total,
      remaining: budget - total,
      percentageUsed: budget > 0 ? (total / budget) * 100 : 0,
    },
  };
}

export async function imageToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export async function compressImage(file: File, maxWidth = 1024): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;

        if (width > maxWidth) {
          height = (height * maxWidth) / width;
          width = maxWidth;
        }

        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        ctx?.drawImage(img, 0, 0, width, height);

        resolve(canvas.toDataURL('image/jpeg', 0.8));
      };
      img.onerror = reject;
      img.src = e.target?.result as string;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}
