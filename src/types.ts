export enum EntryType {
  INWARD = 'inward',
  CONSUMPTION = 'consumption',
}

export interface DieselEntry {
  id?: string;
  type: EntryType;
  liters: number;
  supplier?: string;
  note?: string;
  timestamp: any; // Firestore Timestamp
  userId: string;
}

export interface Vehicle {
  id?: string;
  vehicle_number: string;
  mileage_kmpl: number;
  note?: string;
  userId: string;
}

export interface TMLog {
  id?: string;
  vehicleId: string;
  vehicleNumber: string;
  liters_given: number;
  mileage_at_time: number;
  estimated_km: number;
  timestamp: any; // Firestore Timestamp
  note?: string;
  userId: string;
}

export interface DailyBalance {
  id?: string;
  dateString: string; // YYYY-MM-DD
  opening_balance: number;
  closing_balance?: number;
  total_inward?: number;
  total_consumption?: number;
  userId: string;
}

export interface DailySummary {
  date: string;
  opening: number;
  inward: number;
  consumption: number;
  closing: number;
}
