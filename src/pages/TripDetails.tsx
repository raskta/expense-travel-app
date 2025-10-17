import { useState, useEffect } from 'react';
import { Trip, Expense } from '../types';
import { getExpensesByTrip, deleteExpense, updateTrip } from '../utils/db';
import {
  formatCurrency,
  formatDateShort,
  getCategoryLabel,
  getCategoryIcon,
  calculateExpenseSummary,
} from '../utils/helpers';
import ReportGenerator from '../components/ReportGenerator';

interface TripDetailsProps {
  trip: Trip;
  onBack: () => void;
  onEdit: (trip: Trip) => void;
  onAddExpense: (trip: Trip) => void;
  onEditExpense: (trip: Trip, expenseId: string) => void;
}

function TripDetails({ trip, onBack, onEdit, onAddExpense, onEditExpense }: TripDetailsProps) {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [showReport, setShowReport] = useState(false);

  useEffect(() => {
    loadExpenses();
  }, [trip.id]);

  const loadExpenses = async () => {
    const tripExpenses = await getExpensesByTrip(trip.id);
    tripExpenses.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    setExpenses(tripExpenses);
  };

  const handleDeleteExpense = async (expense: Expense) => {
    if (confirm(`Deseja realmente excluir esta despesa?`)) {
      await deleteExpense(expense.id);
      loadExpenses();
    }
  };

  const handleToggleStatus = async () => {
    const newStatus = trip.status === 'active' ? 'completed' : 'active';
    await updateTrip({ ...trip, status: newStatus });
    window.location.reload();
  };

  const summary = calculateExpenseSummary(expenses, trip.budget);

  if (showReport) {
    return (
      <ReportGenerator
        trip={trip}
        expenses={expenses}
        summary={summary}
        onBack={() => setShowReport(false)}
      />
    );
  }

  return (
    <div className="page trip-details-page">
      <header className="page-header">
        <button className="back-btn" onClick={onBack}>
          ← Voltar
        </button>
        <h1>{trip.name}</h1>
      </header>

      <div className="trip-info-card">
        <div className="trip-info-header">
          <div>
            <p className="trip-dates">
              {formatDateShort(trip.startDate)} - {formatDateShort(trip.endDate)}
            </p>
            {trip.description && <p className="trip-description">{trip.description}</p>}
          </div>
          <button className="icon-btn" onClick={() => onEdit(trip)}>
            ✏️
          </button>
        </div>

        <div className="budget-summary">
          <div className="budget-item">
            <span className="budget-label">Orçamento</span>
            <span className="budget-value">{formatCurrency(trip.budget)}</span>
          </div>
          <div className="budget-item">
            <span className="budget-label">Gasto</span>
            <span className="budget-value spent">{formatCurrency(summary.total)}</span>
          </div>
          <div className="budget-item">
            <span className="budget-label">
              {summary.budgetComparison.remaining >= 0 ? 'Disponível' : 'Excedido'}
            </span>
            <span
              className="budget-value"
              style={{
                color: summary.budgetComparison.remaining >= 0 ? '#4caf50' : '#f44336',
              }}
            >
              {formatCurrency(Math.abs(summary.budgetComparison.remaining))}
            </span>
          </div>
        </div>

        <div className="budget-bar">
          <div
            className="budget-bar-fill"
            style={{
              width: `${Math.min(summary.budgetComparison.percentageUsed, 100)}%`,
              backgroundColor:
                summary.budgetComparison.percentageUsed > 100
                  ? '#f44336'
                  : summary.budgetComparison.percentageUsed > 80
                  ? '#ff9800'
                  : '#4caf50',
            }}
          ></div>
        </div>
        <p className="budget-percentage">
          {summary.budgetComparison.percentageUsed.toFixed(1)}% do orçamento utilizado
        </p>
      </div>

      <div className="actions-bar">
        <button className="btn-secondary" onClick={handleToggleStatus}>
          {trip.status === 'active' ? '✓ Concluir Viagem' : '↻ Reabrir Viagem'}
        </button>
        <button className="btn-secondary" onClick={() => setShowReport(true)}>
          📊 Ver Relatório
        </button>
      </div>

      <div className="section">
        <div className="section-header">
          <h2>Despesas ({expenses.length})</h2>
        </div>

        {expenses.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">💰</div>
            <h3>Nenhuma despesa registrada</h3>
            <p>Comece adicionando suas despesas</p>
          </div>
        ) : (
          <div className="expense-list">
            {expenses.map((expense) => (
              <div key={expense.id} className="expense-item">
                <div
                  className="expense-item-main"
                  onClick={() => onEditExpense(trip, expense.id)}
                >
                  <div className="expense-icon">{getCategoryIcon(expense.category)}</div>
                  <div className="expense-info">
                    <div className="expense-header">
                      <span className="expense-description">{expense.description}</span>
                      <span className="expense-amount">{formatCurrency(expense.amount)}</span>
                    </div>
                    <div className="expense-meta">
                      <span className="expense-category">
                        {getCategoryLabel(expense.category)}
                      </span>
                      <span className="expense-date">{formatDateShort(expense.date)}</span>
                    </div>
                    {expense.receipt && <span className="receipt-indicator">📎 Com comprovante</span>}
                  </div>
                </div>
                <button
                  className="expense-delete-btn"
                  onClick={() => handleDeleteExpense(expense)}
                >
                  🗑️
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      <button className="fab" onClick={() => onAddExpense(trip)}>
        <span className="fab-icon">+</span>
      </button>
    </div>
  );
}

export default TripDetails;
