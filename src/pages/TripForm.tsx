import { useState } from 'react';
import { Trip } from '../types';
import { addTrip, updateTrip } from '../utils/db';
import { generateId } from '../utils/helpers';

interface TripFormProps {
  trip?: Trip;
  onBack: () => void;
  onSave: () => void;
}

function TripForm({ trip, onBack, onSave }: TripFormProps) {
  const [formData, setFormData] = useState({
    name: trip?.name || '',
    startDate: trip?.startDate || '',
    endDate: trip?.endDate || '',
    budget: trip?.budget?.toString() || '',
    description: trip?.description || '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Nome da viagem é obrigatório';
    }

    if (!formData.startDate) {
      newErrors.startDate = 'Data de início é obrigatória';
    }

    if (!formData.endDate) {
      newErrors.endDate = 'Data de término é obrigatória';
    }

    if (formData.startDate && formData.endDate && formData.startDate > formData.endDate) {
      newErrors.endDate = 'Data de término deve ser após a data de início';
    }

    if (!formData.budget || parseFloat(formData.budget) <= 0) {
      newErrors.budget = 'Orçamento deve ser maior que zero';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate()) {
      return;
    }

    const tripData: Trip = {
      id: trip?.id || generateId(),
      name: formData.name.trim(),
      startDate: formData.startDate,
      endDate: formData.endDate,
      budget: parseFloat(formData.budget),
      description: formData.description.trim(),
      status: trip?.status || 'active',
      createdAt: trip?.createdAt || new Date().toISOString(),
    };

    if (trip) {
      await updateTrip(tripData);
    } else {
      await addTrip(tripData);
    }

    onSave();
  };

  return (
    <div className="page form-page">
      <header className="page-header">
        <button className="back-btn" onClick={onBack}>
          ← Voltar
        </button>
        <h1>{trip ? 'Editar Viagem' : 'Nova Viagem'}</h1>
      </header>

      <form className="form" onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="name">Nome da Viagem *</label>
          <input
            type="text"
            id="name"
            name="name"
            value={formData.name}
            onChange={handleChange}
            placeholder="Ex: Viagem a São Paulo"
            className={errors.name ? 'error' : ''}
          />
          {errors.name && <span className="error-message">{errors.name}</span>}
        </div>

        <div className="form-row">
          <div className="form-group">
            <label htmlFor="startDate">Data de Início *</label>
            <input
              type="date"
              id="startDate"
              name="startDate"
              value={formData.startDate}
              onChange={handleChange}
              className={errors.startDate ? 'error' : ''}
            />
            {errors.startDate && <span className="error-message">{errors.startDate}</span>}
          </div>

          <div className="form-group">
            <label htmlFor="endDate">Data de Término *</label>
            <input
              type="date"
              id="endDate"
              name="endDate"
              value={formData.endDate}
              onChange={handleChange}
              className={errors.endDate ? 'error' : ''}
            />
            {errors.endDate && <span className="error-message">{errors.endDate}</span>}
          </div>
        </div>

        <div className="form-group">
          <label htmlFor="budget">Orçamento Previsto (R$) *</label>
          <input
            type="number"
            id="budget"
            name="budget"
            value={formData.budget}
            onChange={handleChange}
            placeholder="0.00"
            step="0.01"
            min="0"
            className={errors.budget ? 'error' : ''}
          />
          {errors.budget && <span className="error-message">{errors.budget}</span>}
        </div>

        <div className="form-group">
          <label htmlFor="description">Descrição</label>
          <textarea
            id="description"
            name="description"
            value={formData.description}
            onChange={handleChange}
            placeholder="Informações adicionais sobre a viagem..."
            rows={4}
          />
        </div>

        <button type="submit" className="btn-primary">
          {trip ? 'Salvar Alterações' : 'Criar Viagem'}
        </button>
      </form>
    </div>
  );
}

export default TripForm;
