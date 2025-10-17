import { Trip, Expense, ExpenseSummary } from '../types';
import {
  formatCurrency,
  formatDate,
  formatDateShort,
  getCategoryLabel,
  getCategoryIcon,
} from '../utils/helpers';

interface ReportGeneratorProps {
  trip: Trip;
  expenses: Expense[];
  summary: ExpenseSummary;
  onBack: () => void;
}

function ReportGenerator({ trip, expenses, summary, onBack }: ReportGeneratorProps) {
  const handleShare = async () => {
    const reportText = generateReportText();
    const reportHTML = generateReportHTML();

    if (navigator.share) {
      try {
        const blob = new Blob([reportHTML], { type: 'text/html' });
        const file = new File([blob], `relatorio-${trip.name}.html`, { type: 'text/html' });

        const shareData: ShareData = {
          title: `Relatório de Despesas - ${trip.name}`,
          text: reportText,
          files: [file],
        };

        if (navigator.canShare && navigator.canShare(shareData)) {
          await navigator.share(shareData);
        } else {
          await navigator.share({
            title: shareData.title,
            text: reportText,
          });
        }
      } catch (error) {
        if ((error as Error).name !== 'AbortError') {
          console.error('Erro ao compartilhar:', error);
          alert('Erro ao compartilhar relatório');
        }
      }
    } else {
      const blob = new Blob([reportHTML], { type: 'text/html' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `relatorio-${trip.name}.html`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }
  };

  const generateReportText = (): string => {
    let text = `RELATÓRIO DE DESPESAS DE VIAGEM\n\n`;
    text += `Viagem: ${trip.name}\n`;
    text += `Período: ${formatDateShort(trip.startDate)} a ${formatDateShort(trip.endDate)}\n\n`;
    text += `RESUMO FINANCEIRO\n`;
    text += `Orçamento Previsto: ${formatCurrency(trip.budget)}\n`;
    text += `Total Gasto: ${formatCurrency(summary.total)}\n`;
    text += `${summary.budgetComparison.remaining >= 0 ? 'Saldo' : 'Excedente'}: ${formatCurrency(Math.abs(summary.budgetComparison.remaining))}\n\n`;
    text += `DESPESAS POR CATEGORIA\n`;

    Object.entries(summary.byCategory).forEach(([category, amount]) => {
      if (amount > 0) {
        text += `${getCategoryLabel(category as any)}: ${formatCurrency(amount)}\n`;
      }
    });

    text += `\nDETALHE DAS DESPESAS (${expenses.length})\n\n`;
    expenses.forEach((exp, idx) => {
      text += `${idx + 1}. ${exp.description}\n`;
      text += `   Categoria: ${getCategoryLabel(exp.category)}\n`;
      text += `   Data: ${formatDateShort(exp.date)}\n`;
      text += `   Valor: ${formatCurrency(exp.amount)}\n`;
      text += `   ${exp.receipt ? 'Com comprovante anexado' : 'Sem comprovante'}\n\n`;
    });

    return text;
  };

  const generateReportHTML = (): string => {
    return `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Relatório de Despesas - ${trip.name}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif; padding: 20px; background: #f5f5f5; color: #333; }
    .container { max-width: 800px; margin: 0 auto; background: white; padding: 30px; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
    h1 { color: #1976d2; margin-bottom: 10px; font-size: 28px; }
    h2 { color: #424242; margin-top: 30px; margin-bottom: 15px; font-size: 20px; border-bottom: 2px solid #1976d2; padding-bottom: 8px; }
    .trip-info { background: #f5f5f5; padding: 15px; border-radius: 6px; margin: 20px 0; }
    .trip-info p { margin: 8px 0; }
    .summary { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 15px; margin: 20px 0; }
    .summary-item { background: #e3f2fd; padding: 15px; border-radius: 6px; text-align: center; }
    .summary-label { display: block; font-size: 14px; color: #666; margin-bottom: 5px; }
    .summary-value { display: block; font-size: 24px; font-weight: bold; color: #1976d2; }
    .category-list { display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 10px; margin: 15px 0; }
    .category-item { background: #f5f5f5; padding: 12px; border-radius: 6px; display: flex; justify-content: space-between; align-items: center; }
    .expense-list { margin: 20px 0; }
    .expense-item { background: #fafafa; padding: 15px; border-radius: 6px; margin-bottom: 10px; border-left: 4px solid #1976d2; }
    .expense-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px; }
    .expense-description { font-weight: 600; font-size: 16px; }
    .expense-amount { font-size: 18px; font-weight: bold; color: #1976d2; }
    .expense-meta { font-size: 14px; color: #666; }
    .receipt-indicator { display: inline-block; background: #4caf50; color: white; padding: 2px 8px; border-radius: 4px; font-size: 12px; margin-top: 5px; }
    .receipt-img { max-width: 100%; margin-top: 10px; border-radius: 6px; border: 2px solid #e0e0e0; }
    @media print { body { background: white; } .container { box-shadow: none; } }
  </style>
</head>
<body>
  <div class="container">
    <h1>📊 Relatório de Despesas de Viagem</h1>

    <div class="trip-info">
      <p><strong>Viagem:</strong> ${trip.name}</p>
      <p><strong>Período:</strong> ${formatDateShort(trip.startDate)} a ${formatDateShort(trip.endDate)}</p>
      ${trip.description ? `<p><strong>Descrição:</strong> ${trip.description}</p>` : ''}
      <p><strong>Gerado em:</strong> ${formatDate(new Date().toISOString())}</p>
    </div>

    <h2>💰 Resumo Financeiro</h2>
    <div class="summary">
      <div class="summary-item">
        <span class="summary-label">Orçamento Previsto</span>
        <span class="summary-value">${formatCurrency(trip.budget)}</span>
      </div>
      <div class="summary-item">
        <span class="summary-label">Total Gasto</span>
        <span class="summary-value" style="color: ${summary.budgetComparison.percentageUsed > 100 ? '#f44336' : '#1976d2'};">${formatCurrency(summary.total)}</span>
      </div>
      <div class="summary-item">
        <span class="summary-label">${summary.budgetComparison.remaining >= 0 ? 'Saldo Disponível' : 'Valor Excedido'}</span>
        <span class="summary-value" style="color: ${summary.budgetComparison.remaining >= 0 ? '#4caf50' : '#f44336'};">${formatCurrency(Math.abs(summary.budgetComparison.remaining))}</span>
      </div>
    </div>

    <h2>📈 Despesas por Categoria</h2>
    <div class="category-list">
      ${Object.entries(summary.byCategory)
        .filter(([_, amount]) => amount > 0)
        .sort(([_, a], [__, b]) => b - a)
        .map(
          ([category, amount]) => `
        <div class="category-item">
          <span>${getCategoryIcon(category as any)} ${getCategoryLabel(category as any)}</span>
          <strong>${formatCurrency(amount)}</strong>
        </div>
      `
        )
        .join('')}
    </div>

    <h2>📋 Detalhe das Despesas (${expenses.length})</h2>
    <div class="expense-list">
      ${expenses
        .map(
          (exp) => `
        <div class="expense-item">
          <div class="expense-header">
            <span class="expense-description">${getCategoryIcon(exp.category)} ${exp.description}</span>
            <span class="expense-amount">${formatCurrency(exp.amount)}</span>
          </div>
          <div class="expense-meta">
            <span>Categoria: ${getCategoryLabel(exp.category)}</span> •
            <span>Data: ${formatDateShort(exp.date)}</span>
          </div>
          ${exp.receipt ? `<span class="receipt-indicator">📎 Com comprovante</span><br><img src="${exp.receipt}" class="receipt-img" alt="Comprovante">` : ''}
        </div>
      `
        )
        .join('')}
    </div>
  </div>
</body>
</html>`;
  };

  return (
    <div className="page report-page">
      <header className="page-header">
        <button className="back-btn" onClick={onBack}>
          ← Voltar
        </button>
        <h1>Relatório da Viagem</h1>
      </header>

      <div className="report-preview">
        <div className="report-section">
          <h2>📊 {trip.name}</h2>
          <p className="report-dates">
            {formatDateShort(trip.startDate)} - {formatDateShort(trip.endDate)}
          </p>
        </div>

        <div className="report-section">
          <h3>Resumo Financeiro</h3>
          <div className="report-summary">
            <div className="report-summary-item">
              <span>Orçamento</span>
              <strong>{formatCurrency(trip.budget)}</strong>
            </div>
            <div className="report-summary-item">
              <span>Gasto</span>
              <strong style={{ color: '#f44336' }}>{formatCurrency(summary.total)}</strong>
            </div>
            <div className="report-summary-item">
              <span>{summary.budgetComparison.remaining >= 0 ? 'Saldo' : 'Excedente'}</span>
              <strong
                style={{
                  color: summary.budgetComparison.remaining >= 0 ? '#4caf50' : '#f44336',
                }}
              >
                {formatCurrency(Math.abs(summary.budgetComparison.remaining))}
              </strong>
            </div>
          </div>
        </div>

        <div className="report-section">
          <h3>Por Categoria</h3>
          <div className="report-categories">
            {Object.entries(summary.byCategory)
              .filter(([_, amount]) => amount > 0)
              .sort(([_, a], [__, b]) => b - a)
              .map(([category, amount]) => (
                <div key={category} className="report-category-item">
                  <span>
                    {getCategoryIcon(category as any)} {getCategoryLabel(category as any)}
                  </span>
                  <strong>{formatCurrency(amount)}</strong>
                </div>
              ))}
          </div>
        </div>

        <div className="report-section">
          <h3>Despesas ({expenses.length})</h3>
          <div className="report-expense-list">
            {expenses.map((exp) => (
              <div key={exp.id} className="report-expense-item">
                <div className="report-expense-header">
                  <span>
                    {getCategoryIcon(exp.category)} {exp.description}
                  </span>
                  <strong>{formatCurrency(exp.amount)}</strong>
                </div>
                <div className="report-expense-meta">
                  {getCategoryLabel(exp.category)} • {formatDateShort(exp.date)}
                  {exp.receipt && ' • 📎'}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="report-actions">
        <button className="btn-primary" onClick={handleShare}>
          {typeof navigator.share !== 'undefined' ? '📤 Compartilhar Relatório' : '💾 Baixar Relatório'}
        </button>
      </div>
    </div>
  );
}

export default ReportGenerator;
