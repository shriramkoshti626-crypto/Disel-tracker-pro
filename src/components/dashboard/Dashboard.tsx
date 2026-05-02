import React, { useState } from 'react';
import { useDiesel } from '../../context/DieselContext';
import { Plus, Minus, Truck, History, AlertCircle } from 'lucide-react';
import { cn, formatNumber } from '../../lib/utils';
import { EntryType } from '../../types';
import { format } from 'date-fns';
import { motion } from 'motion/react';

export function Dashboard() {
  const { currentBalance, dailyBalances, entries, tmLogs, addEntry, addTMLog, vehicles, setOpeningBalance } = useDiesel();
  const [showInward, setShowInward] = useState(false);
  const [showConsumption, setShowConsumption] = useState(false);
  const [showIssue, setShowIssue] = useState(false);
  const [showSetOpening, setShowSetOpening] = useState(false);

  const today = format(new Date(), 'yyyy-MM-dd');
  const hasOpeningBalance = dailyBalances.some(b => b.dateString === today);

  const getBalanceColor = (balance: number) => {
    if (balance > 1000) return 'text-green-600 bg-green-50 border-green-200';
    if (balance > 300) return 'text-orange-600 bg-orange-50 border-orange-200';
    return 'text-red-600 bg-red-50 border-red-200';
  };

  const recentActivity = [
    ...entries.map(e => ({ ...e, typeLabel: e.type === EntryType.INWARD ? 'Inward' : 'Consumption', date: e.timestamp.toDate() })),
    ...tmLogs.map(l => ({ ...l, typeLabel: 'TM Issue', liters: l.liters_given, date: l.timestamp.toDate(), note: `Vehicle: ${l.vehicleNumber}` }))
  ].sort((a, b) => b.date - a.date).slice(0, 10);

  const latestConsumption = [...entries.filter(e => e.type === EntryType.CONSUMPTION), ...tmLogs]
    .sort((a,b) => b.timestamp.toMillis() - a.timestamp.toMillis())[0];
  
  const needsReminder = !latestConsumption || (Date.now() - latestConsumption.timestamp.toMillis() > 4 * 60 * 60 * 1000);

  return (
    <div className="space-y-8">
      {/* Reminder Banner */}
      {needsReminder && (
        <motion.div 
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: 'auto', opacity: 1 }}
          className="rounded-2xl bg-zinc-900 p-4 text-white flex items-center gap-3 shadow-xl"
        >
          <div className="animate-pulse rounded-full bg-orange-500 p-2">
            <AlertCircle size={18} />
          </div>
          <div className="flex-1">
            <p className="text-sm font-bold">Update Diesel Consumption</p>
            <p className="text-[10px] text-zinc-400">It's been over 4 hours since the last update.</p>
          </div>
          <button 
            onClick={() => setShowConsumption(true)}
            className="rounded-lg bg-white px-3 py-1.5 text-xs font-bold text-zinc-900"
          >
            Update
          </button>
        </motion.div>
      )}

      {/* Balance Card */}
      <section className={cn(
        "relative overflow-hidden rounded-3xl border-2 p-8 shadow-sm transition-all",
        getBalanceColor(currentBalance)
      )}>
        <div className="flex flex-col gap-1">
          <span className="text-sm font-bold uppercase tracking-wider opacity-70 text-zinc-900">Current Diesel Balance</span>
          <div className="flex items-baseline gap-2">
            <span className="text-6xl font-black tracking-tighter text-zinc-900">{formatNumber(currentBalance, 0)}</span>
            <span className="text-xl font-bold text-zinc-900/60">Liters</span>
          </div>
        </div>
        
        {!hasOpeningBalance && (
          <div className="mt-6 flex items-center gap-3 rounded-2xl bg-white/60 p-4 backdrop-blur-sm border border-white/40">
            <AlertCircle size={20} className="text-orange-600 shrink-0" />
            <p className="text-xs font-medium text-zinc-900">Opening balance for today is not set.</p>
            <button 
              onClick={() => setShowSetOpening(true)}
              className="ml-auto rounded-lg bg-orange-600 px-3 py-1.5 text-xs font-bold text-white shadow-sm"
            >
              Set Now
            </button>
          </div>
        )}
      </section>

      {/* Quick Actions */}
      <section className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <button 
          onClick={() => setShowInward(true)}
          className="group flex flex-col items-center justify-center gap-4 rounded-3xl bg-white p-6 border border-zinc-200 shadow-sm transition-all hover:border-orange-200 hover:shadow-md active:scale-95"
        >
          <div className="rounded-2xl bg-green-100 p-4 text-green-600 group-hover:bg-green-600 group-hover:text-white transition-colors">
            <Plus size={32} />
          </div>
          <span className="font-bold">Add Inward</span>
        </button>

        <button 
          onClick={() => setShowConsumption(true)}
          className="group flex flex-col items-center justify-center gap-4 rounded-3xl bg-white p-6 border border-zinc-200 shadow-sm transition-all hover:border-orange-200 hover:shadow-md active:scale-95"
        >
          <div className="rounded-2xl bg-red-100 p-4 text-red-600 group-hover:bg-red-600 group-hover:text-white transition-colors">
            <Minus size={32} />
          </div>
          <span className="font-bold">Manual Use</span>
        </button>

        <button 
          onClick={() => setShowIssue(true)}
          className="group flex flex-col items-center justify-center gap-4 rounded-3xl bg-white p-6 border border-zinc-200 shadow-sm transition-all hover:border-orange-200 hover:shadow-md active:scale-95"
        >
          <div className="rounded-2xl bg-orange-100 p-4 text-orange-600 group-hover:bg-orange-600 group-hover:text-white transition-colors">
            <Truck size={32} />
          </div>
          <span className="font-bold">Issue to TM</span>
        </button>
      </section>

      {/* Recent Activity */}
      <section className="rounded-3xl bg-white p-6 border border-zinc-200 shadow-sm">
        <div className="mb-6 flex items-center justify-between">
          <h3 className="text-lg font-bold">Recent Activity</h3>
          <History size={20} className="text-zinc-400" />
        </div>
        <div className="space-y-4">
          {recentActivity.length === 0 ? (
            <p className="py-8 text-center text-sm text-zinc-400">No recent activity found.</p>
          ) : (
            recentActivity.map((activity, idx) => (
              <div key={idx} className="flex items-center gap-4 border-b border-zinc-50 pb-4 last:border-0 last:pb-0">
                <div className={cn(
                  "rounded-xl p-2.5",
                  activity.type === EntryType.INWARD ? "bg-green-100 text-green-600" : 
                  activity.type === EntryType.CONSUMPTION ? "bg-red-100 text-red-600" : "bg-orange-100 text-orange-600"
                )}>
                  {activity.type === EntryType.INWARD ? <Plus size={18} /> : 
                   activity.type === EntryType.CONSUMPTION ? <Minus size={18} /> : <Truck size={18} />}
                </div>
                <div className="flex-1">
                  <p className="text-sm font-bold">{activity.typeLabel}</p>
                  <p className="text-[10px] text-zinc-500">{format(activity.date, 'MMM d, h:mm a')}</p>
                </div>
                <div className="text-right">
                  <p className={cn(
                    "text-sm font-black",
                    activity.type === EntryType.INWARD ? "text-green-600" : "text-zinc-900"
                  )}>
                    {activity.type === EntryType.INWARD ? '+' : '-'}{activity.liters} L
                  </p>
                  {activity.note && <p className="text-[10px] text-zinc-400 truncate max-w-[100px]">{activity.note}</p>}
                </div>
              </div>
            ))
          )}
        </div>
      </section>

      {/* Modals */}
      {showInward && (
        <EntryModal 
          type={EntryType.INWARD} 
          onClose={() => setShowInward(false)} 
          onSubmit={addEntry} 
        />
      )}
      {showConsumption && (
        <EntryModal 
          type={EntryType.CONSUMPTION} 
          onClose={() => setShowConsumption(false)} 
          onSubmit={addEntry} 
        />
      )}
      {showIssue && (
        <IssueModal 
          onClose={() => setShowIssue(false)} 
          onSubmit={addTMLog}
          vehicles={vehicles}
        />
      )}
      {showSetOpening && (
        <OpeningBalanceModal 
          date={today}
          onClose={() => setShowSetOpening(false)}
          onSubmit={setOpeningBalance}
        />
      )}
    </div>
  );
}

function EntryModal({ type, onClose, onSubmit }: { type: EntryType, onClose: () => void, onSubmit: (d: any) => Promise<void> }) {
  const [liters, setLiters] = useState('');
  const [note, setNote] = useState('');
  const [supplier, setSupplier] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!liters || isNaN(Number(liters))) return;
    setLoading(true);
    await onSubmit({ type, liters: Number(liters), note, supplier });
    setLoading(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-md overflow-hidden rounded-3xl bg-white shadow-2xl"
      >
        <div className={cn("p-6 text-white", type === EntryType.INWARD ? "bg-green-600" : "bg-red-600")}>
          <h2 className="text-xl font-bold">Add {type === EntryType.INWARD ? 'Inward Diesel' : 'Diesel Consumption'}</h2>
          <p className="text-xs opacity-80">Manual entry for inventory logs</p>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="space-y-1">
            <label className="text-xs font-bold uppercase text-zinc-500">Liters</label>
            <input 
              autoFocus
              type="number" 
              value={liters} 
              onChange={e => setLiters(e.target.value)}
              className="w-full rounded-xl border border-zinc-200 bg-zinc-50 p-4 text-2xl font-black focus:border-orange-500 focus:ring-0"
              placeholder="0.00"
              required
            />
          </div>
          {type === EntryType.INWARD && (
            <div className="space-y-1">
              <label className="text-xs font-bold uppercase text-zinc-500">Supplier (Optional)</label>
              <input 
                type="text" 
                value={supplier} 
                onChange={e => setSupplier(e.target.value)}
                className="w-full rounded-xl border border-zinc-200 bg-zinc-50 p-4 focus:border-orange-500 focus:ring-0"
                placeholder="e.g. Jio BP, Shell"
              />
            </div>
          )}
          <div className="space-y-1">
            <label className="text-xs font-bold uppercase text-zinc-500">Note</label>
            <textarea 
              value={note} 
              onChange={e => setNote(e.target.value)}
              className="w-full rounded-xl border border-zinc-200 bg-zinc-50 p-4 focus:border-orange-500 focus:ring-0"
              placeholder="Any additional information..."
              rows={2}
            />
          </div>
          <div className="flex gap-3 pt-4">
            <button 
              type="button" 
              onClick={onClose}
              className="flex-1 rounded-xl bg-zinc-100 py-4 font-bold text-zinc-500 hover:bg-zinc-200 transition-colors"
            >
              Cancel
            </button>
            <button 
              disabled={loading}
              type="submit"
              className={cn(
                "flex-1 rounded-xl py-4 font-bold text-white shadow-lg transition-all",
                type === EntryType.INWARD ? "bg-green-600 hover:bg-green-700 shadow-green-200" : "bg-red-600 hover:bg-red-700 shadow-red-200"
              )}
            >
              {loading ? 'Adding...' : 'Confirm'}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}

function IssueModal({ onClose, onSubmit, vehicles }: { onClose: () => void, onSubmit: (d: any) => Promise<void>, vehicles: any[] }) {
  const [vehicleId, setVehicleId] = useState('');
  const [liters, setLiters] = useState('');
  const [mileage, setMileage] = useState('');
  const [note, setNote] = useState('');
  const [loading, setLoading] = useState(false);

  const selectedVehicle = vehicles.find(v => v.id === vehicleId);

  React.useEffect(() => {
    if (selectedVehicle) {
      setMileage(selectedVehicle.mileage_kmpl.toString());
    }
  }, [selectedVehicle]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!vehicleId || !liters || !mileage) return;
    setLoading(true);
    const lit = Number(liters);
    const mil = Number(mileage);
    await onSubmit({
      vehicleId,
      vehicleNumber: selectedVehicle.vehicle_number,
      liters_given: lit,
      mileage_at_time: mil,
      estimated_km: lit * mil,
      note
    });
    setLoading(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-md overflow-hidden rounded-3xl bg-white shadow-2xl"
      >
        <div className="bg-orange-500 p-6 text-white">
          <h2 className="text-xl font-bold">Issue Diesel to TM</h2>
          <p className="text-xs opacity-80">Track vehicle-wise consumption</p>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="space-y-1">
            <label className="text-xs font-bold uppercase text-zinc-500">Select Vehicle</label>
            <select 
              value={vehicleId} 
              onChange={e => setVehicleId(e.target.value)}
              className="w-full rounded-xl border border-zinc-200 bg-zinc-50 p-4 focus:border-orange-500 focus:ring-0"
              required
            >
              <option value="">Select a vehicle...</option>
              {vehicles.map(v => (
                <option key={v.id} value={v.id}>{v.vehicle_number}</option>
              ))}
            </select>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-bold uppercase text-zinc-500">Liters Given</label>
              <input 
                type="number" 
                value={liters} 
                onChange={e => setLiters(e.target.value)}
                className="w-full rounded-xl border border-zinc-200 bg-zinc-50 p-4 text-xl font-black focus:border-orange-500 focus:ring-0"
                placeholder="0"
                required
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold uppercase text-zinc-500">Mileage (KM/L)</label>
              <input 
                type="number" 
                value={mileage} 
                onChange={e => setMileage(e.target.value)}
                className="w-full rounded-xl border border-zinc-200 bg-zinc-50 p-4 text-xl font-black focus:border-orange-500 focus:ring-0"
                placeholder="0"
                required
              />
            </div>
          </div>

          {liters && mileage && (
            <div className="rounded-2xl bg-orange-50 p-4 border border-orange-100 flex items-center justify-between">
              <span className="text-xs font-bold text-orange-800">Estimated Range:</span>
              <span className="text-xl font-black text-orange-600">{Number(liters) * Number(mileage)} KM</span>
            </div>
          )}

          <div className="space-y-1">
            <label className="text-xs font-bold uppercase text-zinc-500">Note</label>
            <input 
              type="text" 
              value={note} 
              onChange={e => setNote(e.target.value)}
              className="w-full rounded-xl border border-zinc-200 bg-zinc-50 p-4 focus:border-orange-500 focus:ring-0"
              placeholder="Route info, driver, etc."
            />
          </div>

          <div className="flex gap-3 pt-4">
            <button type="button" onClick={onClose} className="flex-1 rounded-xl bg-zinc-100 py-4 font-bold text-zinc-500">Cancel</button>
            <button disabled={loading} type="submit" className="flex-1 rounded-xl bg-orange-500 py-4 font-bold text-white shadow-lg shadow-orange-100">Confirm Issue</button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}

function OpeningBalanceModal({ date, onClose, onSubmit }: { date: string, onClose: () => void, onSubmit: (date: string, amount: number) => Promise<void> }) {
  const [balance, setBalance] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!balance) return;
    setLoading(true);
    await onSubmit(date, Number(balance));
    setLoading(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="w-full max-w-sm rounded-3xl bg-white shadow-2xl overflow-hidden">
        <div className="bg-zinc-900 p-6 text-white">
          <h2 className="text-xl font-bold">Daily Opening Balance</h2>
          <p className="text-xs opacity-60">Set current stock for {date}</p>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="space-y-1">
            <input 
              autoFocus
              type="number" 
              value={balance} 
              onChange={e => setBalance(e.target.value)}
              className="w-full rounded-xl border border-zinc-200 bg-zinc-50 p-6 text-4xl font-black text-center focus:border-orange-500 focus:ring-0"
              placeholder="0"
              required
            />
            <p className="text-center text-[10px] uppercase font-bold text-zinc-400 mt-2">Total Liters in Tank</p>
          </div>
          <div className="flex gap-3 pt-4">
            <button type="button" onClick={onClose} className="flex-1 rounded-xl bg-zinc-100 py-4 font-bold text-zinc-500">Back</button>
            <button disabled={loading} type="submit" className="flex-1 rounded-xl bg-zinc-900 py-4 font-bold text-white shadow-lg">Save Balance</button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}
