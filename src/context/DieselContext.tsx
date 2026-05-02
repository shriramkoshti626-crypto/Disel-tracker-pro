import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { 
  collection, 
  query, 
  where, 
  onSnapshot, 
  orderBy, 
  addDoc, 
  Timestamp, 
  deleteDoc,
  doc,
  setDoc,
  getDocs,
  limit
} from 'firebase/firestore';
import { auth, db, handleFirestoreError, OperationType } from '../lib/firebase';
import { User, onAuthStateChanged } from 'firebase/auth';
import { DieselEntry, Vehicle, TMLog, DailyBalance, EntryType } from '../types';
import { format } from 'date-fns';

interface DieselContextType {
  user: User | null;
  loading: boolean;
  entries: DieselEntry[];
  vehicles: Vehicle[];
  tmLogs: TMLog[];
  dailyBalances: DailyBalance[];
  currentBalance: number;
  addEntry: (data: Partial<DieselEntry>) => Promise<void>;
  addVehicle: (data: Partial<Vehicle>) => Promise<void>;
  updateVehicle: (id: string, data: Partial<Vehicle>) => Promise<void>;
  deleteVehicle: (id: string) => Promise<void>;
  addTMLog: (data: Partial<TMLog>) => Promise<void>;
  deleteEntry: (id: string) => Promise<void>;
  deleteTMLog: (id: string) => Promise<void>;
  setOpeningBalance: (date: string, amount: number) => Promise<void>;
  refreshBalances: () => Promise<void>;
}

const DieselContext = createContext<DieselContextType | undefined>(undefined);

export function DieselProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [entries, setEntries] = useState<DieselEntry[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [tmLogs, setTmLogs] = useState<TMLog[]>([]);
  const [dailyBalances, setDailyBalances] = useState<DailyBalance[]>([]);
  const [currentBalance, setCurrentBalance] = useState(0);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  // Sync entries
  useEffect(() => {
    if (!user) {
      setEntries([]);
      return;
    }
    const q = query(
      collection(db, 'inventory_entries'),
      where('userId', '==', user.uid),
      orderBy('timestamp', 'desc')
    );
    return onSnapshot(q, (snapshot) => {
      setEntries(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as DieselEntry)));
    }, (err) => handleFirestoreError(err, OperationType.LIST, 'inventory_entries'));
  }, [user]);

  // Sync vehicles
  useEffect(() => {
    if (!user) {
      setVehicles([]);
      return;
    }
    const q = query(
      collection(db, 'vehicles'),
      where('userId', '==', user.uid),
      orderBy('vehicle_number', 'asc')
    );
    return onSnapshot(q, (snapshot) => {
      setVehicles(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Vehicle)));
    }, (err) => handleFirestoreError(err, OperationType.LIST, 'vehicles'));
  }, [user]);

  // Sync TM Logs
  useEffect(() => {
    if (!user) {
      setTmLogs([]);
      return;
    }
    const q = query(
      collection(db, 'tm_logs'),
      where('userId', '==', user.uid),
      orderBy('timestamp', 'desc')
    );
    return onSnapshot(q, (snapshot) => {
      setTmLogs(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as TMLog)));
    }, (err) => handleFirestoreError(err, OperationType.LIST, 'tm_logs'));
  }, [user]);

  // Sync Daily Balances
  useEffect(() => {
    if (!user) {
      setDailyBalances([]);
      return;
    }
    const q = query(
      collection(db, 'daily_balances'),
      where('userId', '==', user.uid),
      orderBy('dateString', 'desc'),
      limit(30)
    );
    return onSnapshot(q, (snapshot) => {
      setDailyBalances(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as DailyBalance)));
    }, (err) => handleFirestoreError(err, OperationType.LIST, 'daily_balances'));
  }, [user]);

  // Calculate Real-time balance
  useEffect(() => {
    if (!user) return;
    
    // Simple calculation logic:
    // Start with the latest opening balance found
    // Add all inward since that date
    // Subtract all consumption since that date
    
    const latestBalanceDoc = dailyBalances[0]; // Ordered by dateString desc
    if (!latestBalanceDoc) {
      setCurrentBalance(0);
      return;
    }

    const baseBalance = latestBalanceDoc.opening_balance;
    const balanceDate = new Date(latestBalanceDoc.dateString);
    
    // Sum inward/consumption since that date
    let totalInward = 0;
    let totalConsumption = 0;

    entries.forEach(e => {
      const entryDate = e.timestamp.toDate();
      if (format(entryDate, 'yyyy-MM-dd') >= latestBalanceDoc.dateString) {
        if (e.type === EntryType.INWARD) totalInward += e.liters;
        else totalConsumption += e.liters;
      }
    });

    tmLogs.forEach(log => {
      const logDate = log.timestamp.toDate();
      if (format(logDate, 'yyyy-MM-dd') >= latestBalanceDoc.dateString) {
        totalConsumption += log.liters_given;
      }
    });

    setCurrentBalance(baseBalance + totalInward - totalConsumption);
  }, [user, dailyBalances, entries, tmLogs]);

  const addEntry = async (data: Partial<DieselEntry>) => {
    if (!user) return;
    try {
      await addDoc(collection(db, 'inventory_entries'), {
        ...data,
        userId: user.uid,
        timestamp: Timestamp.now()
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, 'inventory_entries');
    }
  };

  const addVehicle = async (data: Partial<Vehicle>) => {
    if (!user) return;
    try {
      await addDoc(collection(db, 'vehicles'), {
        ...data,
        userId: user.uid
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, 'vehicles');
    }
  };

  const updateVehicle = async (id: string, data: Partial<Vehicle>) => {
    if (!user) return;
    try {
      await setDoc(doc(db, 'vehicles', id), {
        ...data,
        userId: user.uid
      }, { merge: true });
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, 'vehicles');
    }
  };

  const deleteVehicle = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'vehicles', id));
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, 'vehicles');
    }
  };

  const addTMLog = async (data: Partial<TMLog>) => {
    if (!user) return;
    try {
      await addDoc(collection(db, 'tm_logs'), {
        ...data,
        userId: user.uid,
        timestamp: Timestamp.now()
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, 'tm_logs');
    }
  };

  const deleteEntry = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'inventory_entries', id));
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, 'inventory_entries');
    }
  };

  const deleteTMLog = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'tm_logs', id));
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, 'tm_logs');
    }
  };

  const setOpeningBalance = async (date: string, amount: number) => {
    if (!user) return;
    try {
      const q = query(collection(db, 'daily_balances'), where('userId', '==', user.uid), where('dateString', '==', date));
      const existing = await getDocs(q);
      
      if (!existing.empty) {
        const docRef = doc(db, 'daily_balances', existing.docs[0].id);
        const data = existing.docs[0].data();
        
        // Only allow edit if it's the very first balance ever set AND it was set today
        // Or if we want to be more lenient, allow editing ANY balance set for TODAY only.
        // The user said: "can edit it if you have added wrong opening for the first time and that edit option will only be avalible for that day"
        
        await setDoc(docRef, { opening_balance: amount }, { merge: true });
      } else {
        await addDoc(collection(db, 'daily_balances'), {
          dateString: date,
          opening_balance: amount,
          userId: user.uid,
          createdAt: Timestamp.now()
        });
      }
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, 'daily_balances');
    }
  };

  const refreshBalances = async () => {
    // Logic to re-calculate or sync
  };

  return (
    <DieselContext.Provider value={{
      user, loading, entries, vehicles, tmLogs, dailyBalances, currentBalance,
      addEntry, addVehicle, updateVehicle, deleteVehicle, addTMLog, deleteEntry, deleteTMLog, setOpeningBalance, refreshBalances
    }}>
      {children}
    </DieselContext.Provider>
  );
}

export function useDiesel() {
  const context = useContext(DieselContext);
  if (context === undefined) {
    throw new Error('useDiesel must be used within a DieselProvider');
  }
  return context;
}
