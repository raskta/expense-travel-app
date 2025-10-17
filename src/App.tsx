import { useState, useEffect } from 'react';
import Home from './pages/Home';
import TripForm from './pages/TripForm';
import TripDetails from './pages/TripDetails';
import ExpenseForm from './pages/ExpenseForm';
import { Trip } from './types';
import { initDB } from './utils/db';
import './App.css';

type View = 'home' | 'new-trip' | 'edit-trip' | 'trip-details' | 'new-expense' | 'edit-expense';

interface AppState {
  view: View;
  selectedTrip?: Trip;
  selectedExpenseId?: string;
}

function App() {
  const [state, setState] = useState<AppState>({ view: 'home' });
  const [dbReady, setDbReady] = useState(false);

  useEffect(() => {
    initDB().then(() => setDbReady(true));
  }, []);

  const navigateTo = (view: View, data?: { trip?: Trip; expenseId?: string }) => {
    setState({
      view,
      selectedTrip: data?.trip,
      selectedExpenseId: data?.expenseId,
    });
  };

  if (!dbReady) {
    return (
      <div className="app loading">
        <div className="loading-spinner"></div>
        <p>Carregando...</p>
      </div>
    );
  }

  return (
    <div className="app">
      {state.view === 'home' && <Home onNavigate={navigateTo} />}

      {state.view === 'new-trip' && (
        <TripForm onBack={() => navigateTo('home')} onSave={() => navigateTo('home')} />
      )}

      {state.view === 'edit-trip' && state.selectedTrip && (
        <TripForm
          trip={state.selectedTrip}
          onBack={() => navigateTo('trip-details', { trip: state.selectedTrip })}
          onSave={() => navigateTo('trip-details', { trip: state.selectedTrip })}
        />
      )}

      {state.view === 'trip-details' && state.selectedTrip && (
        <TripDetails
          trip={state.selectedTrip}
          onBack={() => navigateTo('home')}
          onEdit={(trip) => navigateTo('edit-trip', { trip })}
          onAddExpense={(trip) => navigateTo('new-expense', { trip })}
          onEditExpense={(trip, expenseId) =>
            navigateTo('edit-expense', { trip, expenseId })
          }
        />
      )}

      {state.view === 'new-expense' && state.selectedTrip && (
        <ExpenseForm
          tripId={state.selectedTrip.id}
          onBack={() => navigateTo('trip-details', { trip: state.selectedTrip })}
          onSave={() => navigateTo('trip-details', { trip: state.selectedTrip })}
        />
      )}

      {state.view === 'edit-expense' && state.selectedTrip && state.selectedExpenseId && (
        <ExpenseForm
          tripId={state.selectedTrip.id}
          expenseId={state.selectedExpenseId}
          onBack={() => navigateTo('trip-details', { trip: state.selectedTrip })}
          onSave={() => navigateTo('trip-details', { trip: state.selectedTrip })}
        />
      )}
    </div>
  );
}

export default App;
