import { openDB, DBSchema, IDBPDatabase } from 'idb';
import { Trip, Expense } from '../types';

interface TravelExpenseDB extends DBSchema {
  trips: {
    key: string;
    value: Trip;
    indexes: { 'by-status': string };
  };
  expenses: {
    key: string;
    value: Expense;
    indexes: { 'by-trip': string; 'by-date': string };
  };
}

const DB_NAME = 'travel-expense-db';
const DB_VERSION = 1;

let dbInstance: IDBPDatabase<TravelExpenseDB> | null = null;

export async function initDB(): Promise<IDBPDatabase<TravelExpenseDB>> {
  if (dbInstance) {
    return dbInstance;
  }

  dbInstance = await openDB<TravelExpenseDB>(DB_NAME, DB_VERSION, {
    upgrade(db) {
      if (!db.objectStoreNames.contains('trips')) {
        const tripStore = db.createObjectStore('trips', { keyPath: 'id' });
        tripStore.createIndex('by-status', 'status');
      }

      if (!db.objectStoreNames.contains('expenses')) {
        const expenseStore = db.createObjectStore('expenses', { keyPath: 'id' });
        expenseStore.createIndex('by-trip', 'tripId');
        expenseStore.createIndex('by-date', 'date');
      }
    },
  });

  return dbInstance;
}

export async function addTrip(trip: Trip): Promise<void> {
  const db = await initDB();
  await db.add('trips', trip);
}

export async function updateTrip(trip: Trip): Promise<void> {
  const db = await initDB();
  await db.put('trips', trip);
}

export async function getTrip(id: string): Promise<Trip | undefined> {
  const db = await initDB();
  return db.get('trips', id);
}

export async function getAllTrips(): Promise<Trip[]> {
  const db = await initDB();
  return db.getAll('trips');
}

export async function getTripsByStatus(status: 'active' | 'completed'): Promise<Trip[]> {
  const db = await initDB();
  return db.getAllFromIndex('trips', 'by-status', status);
}

export async function deleteTrip(id: string): Promise<void> {
  const db = await initDB();
  await db.delete('trips', id);

  const expenses = await getExpensesByTrip(id);
  for (const expense of expenses) {
    await deleteExpense(expense.id);
  }
}

export async function addExpense(expense: Expense): Promise<void> {
  const db = await initDB();
  await db.add('expenses', expense);
}

export async function updateExpense(expense: Expense): Promise<void> {
  const db = await initDB();
  await db.put('expenses', expense);
}

export async function getExpense(id: string): Promise<Expense | undefined> {
  const db = await initDB();
  return db.get('expenses', id);
}

export async function getExpensesByTrip(tripId: string): Promise<Expense[]> {
  const db = await initDB();
  return db.getAllFromIndex('expenses', 'by-trip', tripId);
}

export async function deleteExpense(id: string): Promise<void> {
  const db = await initDB();
  await db.delete('expenses', id);
}
