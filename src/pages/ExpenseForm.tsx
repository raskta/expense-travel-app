import { useState, useEffect } from 'react';
import { Expense, ExpenseCategory } from '../types';
import { addExpense, updateExpense, getExpense } from '../utils/db';
import { generateId, getCategoryLabel, getCategoryIcon, compressImage } from '../utils/helpers';

interface ExpenseFormProps {
  tripId: string;
  expenseId?: string;
  onBack: () => void;
  onSave: () => void;
}

function ExpenseForm({ tripId, expenseId, onBack, onSave }: ExpenseFormProps) {
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    category: 'food' as ExpenseCategory,
    amount: '',
    description: '',
    receipt: '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (expenseId) {
      loadExpense();
    }
  }, [expenseId]);

  const loadExpense = async () => {
    if (!expenseId) return;
    const expense = await getExpense(expenseId);
    if (expense) {
      setFormData({
        date: expense.date,
        category: expense.category,
        amount: expense.amount.toString(),
        description: expense.description,
        receipt: expense.receipt || '',
      });
    }
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('Por favor, selecione uma imagem');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      alert('A imagem deve ter no máximo 5MB');
      return;
    }

    setLoading(true);
    try {
      const base64 = await compressImage(file);
      setFormData((prev) => ({ ...prev, receipt: base64 }));
    } catch (error) {
      alert('Erro ao processar imagem');
    } finally {
      setLoading(false);
    }
  };

  const removeReceipt = () => {
    setFormData((prev) => ({ ...prev, receipt: '' }));
  };

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.date) {
      newErrors.date = 'Data é obrigatória';
    }

    if (!formData.amount || parseFloat(formData.amount) <= 0) {
      newErrors.amount = 'Valor deve ser maior que zero';
    }

    if (!formData.description.trim()) {
      newErrors.description = 'Descrição é obrigatória';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate()) {
      return;
    }

    const expenseData: Expense = {
      id: expenseId || generateId(),
      tripId,
      date: formData.date,
      category: formData.category,
      amount: parseFloat(formData.amount),
      description: formData.description.trim(),
      receipt: formData.receipt || undefined,
      createdAt: expenseId ? (await getExpense(expenseId))?.createdAt || new Date().toISOString() : new Date().toISOString(),
    };

    if (expenseId) {
      await updateExpense(expenseData);
    } else {
      await addExpense(expenseData);
    }

    onSave();
  };

  const categories: ExpenseCategory[] = [
    'food',
    'accommodation',
    'transportation',
    'entertainment',
    'shopping',
    'other',
  ];

  return (
    <div className="page form-page">
      <header className="page-header">
        <button className="back-btn" onClick={onBack}>
          ← Voltar
        </button>
        <h1>{expenseId ? 'Editar Despesa' : 'Nova Despesa'}</h1>
      </header>

      <form className="form" onSubmit={handleSubmit}>
        <div className="form-row">
          <div className="form-group">
            <label htmlFor="date">Data *</label>
            <input
              type="date"
              id="date"
              name="date"
              value={formData.date}
              onChange={handleChange}
              className={errors.date ? 'error' : ''}
            />
            {errors.date && <span className="error-message">{errors.date}</span>}
          </div>

          <div className="form-group">
            <label htmlFor="amount">Valor (R$) *</label>
            <input
              type="number"
              id="amount"
              name="amount"
              value={formData.amount}
              onChange={handleChange}
              placeholder="0.00"
              step="0.01"
              min="0"
              className={errors.amount ? 'error' : ''}
            />
            {errors.amount && <span className="error-message">{errors.amount}</span>}
          </div>
        </div>

        <div className="form-group">
          <label htmlFor="category">Categoria *</label>
          <select
            id="category"
            name="category"
            value={formData.category}
            onChange={handleChange}
          >
            {categories.map((cat) => (
              <option key={cat} value={cat}>
                {getCategoryIcon(cat)} {getCategoryLabel(cat)}
              </option>
            ))}
          </select>
        </div>

        <div className="form-group">
          <label htmlFor="description">Descrição *</label>
          <textarea
            id="description"
            name="description"
            value={formData.description}
            onChange={handleChange}
            placeholder="Descreva a despesa..."
            rows={3}
            className={errors.description ? 'error' : ''}
          />
          {errors.description && <span className="error-message">{errors.description}</span>}
        </div>

        <div className="form-group">
          <label>Comprovante</label>
          {!formData.receipt ? (
            <div className="file-upload">
              <input
                type="file"
                id="receipt"
                accept="image/*"
                onChange={handleFileChange}
                disabled={loading}
              />
              <label htmlFor="receipt" className="file-upload-label">
                {loading ? '📤 Processando...' : '📷 Adicionar Foto'}
              </label>
            </div>
          ) : (
            <div className="receipt-preview">
              <img src={formData.receipt} alt="Comprovante" />
              <button type="button" className="remove-receipt-btn" onClick={removeReceipt}>
                🗑️ Remover
              </button>
            </div>
          )}
        </div>

        <button type="submit" className="btn-primary" disabled={loading}>
          {expenseId ? 'Salvar Alterações' : 'Adicionar Despesa'}
        </button>
      </form>
    </div>
  );
}

export default ExpenseForm;
