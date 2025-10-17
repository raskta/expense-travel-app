import { useState, useEffect } from 'react';
import { getAllTrips, deleteTrip } from '../utils/db';
import { Trip } from '../types';
import { formatDateShort, formatCurrency } from '../utils/helpers';
import { getExpensesByTrip } from '../utils/db';

type View = 'home' | 'new-trip' | 'edit-trip' | 'trip-details' | 'new-expense' | 'edit-expense';

interface HomeProps {
  onNavigate: (view: View, data?: { trip?: Trip }) => void;
}

function Home({ onNavigate }: HomeProps) {
  const [trips, setTrips] = useState<Trip[]>([]);
  const [filter, setFilter] = useState<'all' | 'active' | 'completed'>('all');

  useEffect(() => {
    loadTrips();
  }, []);

  const loadTrips = async () => {
    const allTrips = await getAllTrips();
    allTrips.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    setTrips(allTrips);
  };

  const handleDelete = async (trip: Trip) => {
    if (confirm(`Deseja realmente excluir a viagem "${trip.name}"?`)) {
      await deleteTrip(trip.id);
      loadTrips();
    }
  };

  const filteredTrips = trips.filter((trip) => {
    if (filter === 'all') return true;
    return trip.status === filter;
  });

  return (
    <div className="page home-page">
      <header className="page-header">
        <h1>Minhas Viagens</h1>
        <p className="subtitle">Controle suas despesas de viagem</p>
      </header>

      <div className="filter-tabs">
        <button
          className={filter === 'all' ? 'active' : ''}
          onClick={() => setFilter('all')}
        >
          Todas ({trips.length})
        </button>
        <button
          className={filter === 'active' ? 'active' : ''}
          onClick={() => setFilter('active')}
        >
          Em andamento ({trips.filter((t) => t.status === 'active').length})
        </button>
        <button
          className={filter === 'completed' ? 'active' : ''}
          onClick={() => setFilter('completed')}
        >
          Concluídas ({trips.filter((t) => t.status === 'completed').length})
        </button>
      </div>

      <div className="trip-list">
        {filteredTrips.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">✈️</div>
            <h3>Nenhuma viagem encontrada</h3>
            <p>Comece criando sua primeira viagem</p>
          </div>
        ) : (
          filteredTrips.map((trip) => (
            <TripCard
              key={trip.id}
              trip={trip}
              onClick={() => onNavigate('trip-details', { trip })}
              onDelete={() => handleDelete(trip)}
            />
          ))
        )}
      </div>

      <button className="fab" onClick={() => onNavigate('new-trip')}>
        <span className="fab-icon">+</span>
      </button>
    </div>
  );
}

interface TripCardProps {
  trip: Trip;
  onClick: () => void;
  onDelete: () => void;
}

function TripCard({ trip, onClick, onDelete }: TripCardProps) {
  const [totalExpenses, setTotalExpenses] = useState(0);

  useEffect(() => {
    getExpensesByTrip(trip.id).then((expenses) => {
      const total = expenses.reduce((sum, exp) => sum + exp.amount, 0);
      setTotalExpenses(total);
    });
  }, [trip.id]);

  const remaining = trip.budget - totalExpenses;
  const percentageUsed = trip.budget > 0 ? (totalExpenses / trip.budget) * 100 : 0;

  return (
    <div className="trip-card" onClick={onClick}>
      <div className="trip-card-header">
        <div>
          <h3>{trip.name}</h3>
          <p className="trip-dates">
            {formatDateShort(trip.startDate)} - {formatDateShort(trip.endDate)}
          </p>
        </div>
        <span className={`status-badge ${trip.status}`}>
          {trip.status === 'active' ? 'Em andamento' : 'Concluída'}
        </span>
      </div>

      <div className="trip-card-budget">
        <div className="budget-bar">
          <div
            className="budget-bar-fill"
            style={{
              width: `${Math.min(percentageUsed, 100)}%`,
              backgroundColor:
                percentageUsed > 100 ? '#f44336' : percentageUsed > 80 ? '#ff9800' : '#4caf50',
            }}
          ></div>
        </div>
        <div className="budget-info">
          <span>Gasto: {formatCurrency(totalExpenses)}</span>
          <span>Orçamento: {formatCurrency(trip.budget)}</span>
        </div>
        <div className="budget-remaining" style={{ color: remaining < 0 ? '#f44336' : '#666' }}>
          {remaining >= 0 ? 'Disponível' : 'Excedido'}: {formatCurrency(Math.abs(remaining))}
        </div>
      </div>

      <button
        className="delete-btn"
        onClick={(e) => {
          e.stopPropagation();
          onDelete();
        }}
      >
        🗑️
      </button>
    </div>
  );
}

export default Home;
