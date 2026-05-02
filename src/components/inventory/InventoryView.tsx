import React from 'react';
import { useDiesel } from '../../context/DieselContext';
import { format, subDays, isSameDay } from 'date-fns';
import { History, Calendar, ArrowUpRight, ArrowDownRight, Package, Trash2 } from 'lucide-react';
import { cn, formatNumber } from '../../lib/utils';
import { EntryType } from '../../types';

export function InventoryView() {
  const { entries, dailyBalances, tmLogs, deleteEntry, deleteTMLog } = useDiesel();

  const [itemToDelete, setItemToDelete] = React.useState<any | null>(null);

  const handleDelete = async () => {
    if (!itemToDelete) return;
    try {
      if (itemToDelete.type === 'tm_issue') {
        await deleteTMLog(itemToDelete.id);
      } else {
        await deleteEntry(itemToDelete.id);
      }
    } finally {
      setItemToDelete(null);
    }
  };

  // Calculate summaries by working from the earliest data point
  const summaries = React.useMemo(() => {
    if (dailyBalances.length === 0) return [];

    // 1. Find the earliest recorded balance
    const sortedBalances = [...dailyBalances].sort((a, b) => a.dateString.localeCompare(b.dateString));
    const firstBalance = sortedBalances[0];

    // Create a range of dates from firstBalance until today
    const stats: any[] = [];
    let runningBalance = firstBalance.opening_balance;
    const startObj = new Date(firstBalance.dateString);
    const todayObj = new Date();
    todayObj.setHours(23, 59, 59, 999);

    let current = new Date(startObj);
    while (current <= todayObj) {
      const dStr = format(current, 'yyyy-MM-dd');
      
      let dayInward = 0;
      let dayConsumption = 0;

      entries.forEach(e => {
        if (isSameDay(e.timestamp.toDate(), current)) {
          if (e.type === EntryType.INWARD) dayInward += e.liters;
          else dayConsumption += e.liters;
        }
      });

      tmLogs.forEach(log => {
        if (isSameDay(log.timestamp.toDate(), current)) {
          dayConsumption += log.liters_given;
        }
      });

      const opening = runningBalance;
      const closing = opening + dayInward - dayConsumption;

      stats.push({
        date: new Date(current),
        dateString: dStr,
        opening,
        inward: dayInward,
        consumption: dayConsumption,
        closing
      });

      runningBalance = closing;
      current.setDate(current.getDate() + 1);
    }

    // Return the last 7 days from our calculated stats, reversed for UI
    return stats.reverse().slice(0, 7);
  }, [entries, tmLogs, dailyBalances]);

  const allLogs = React.useMemo(() => {
    const logs = [
      ...entries,
      ...tmLogs.map(l => ({ ...l, type: 'tm_issue' as any })),
      ...dailyBalances.map(b => ({
        id: b.id,
        timestamp: b.createdAt || b.timestamp || { toDate: () => new Date(b.dateString), toMillis: () => new Date(b.dateString).getTime() },
        type: 'setup' as any,
        liters: b.opening_balance,
        note: `Opening Balance Set`
      }))
    ];
    return logs.sort((a, b) => {
      const aTime = a.timestamp?.toMillis?.() || 0;
      const bTime = b.timestamp?.toMillis?.() || 0;
      return bTime - aTime;
    });
  }, [entries, tmLogs, dailyBalances]);

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-black tracking-tight">Inventory Logs</h2>
        <p className="text-sm text-zinc-500">Day-wise stock and consumption summary</p>
      </div>

      <section className="flex gap-4 overflow-x-auto pb-4 no-scrollbar">
        {summaries.map((day, idx) => (
          <div 
            key={idx} 
            className="min-w-[200px] shrink-0 rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm flex flex-col gap-4"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-black uppercase text-zinc-400">{format(day.date, 'eee, MMM d')}</span>
              <Calendar size={14} className="text-zinc-300" />
            </div>
            
            <div className="space-y-1">
              <p className="text-[10px] font-bold uppercase text-zinc-500">Opening Stock</p>
              <p className="text-xl font-black">{formatNumber(day.opening, 0)} L</p>
            </div>

            <div className="grid grid-cols-2 gap-2 border-t border-zinc-50 pt-4">
              <div className="space-y-0.5">
                <span className="flex items-center gap-1 text-[9px] font-bold uppercase text-green-600">
                  <ArrowUpRight size={10} /> Inward
                </span>
                <p className="text-sm font-bold text-green-600">+{day.inward}</p>
              </div>
              <div className="space-y-0.5">
                <span className="flex items-center gap-1 text-[9px] font-bold uppercase text-red-600">
                  <ArrowDownRight size={10} /> Used
                </span>
                <p className="text-sm font-bold text-red-600">-{day.consumption}</p>
              </div>
            </div>

            <div className="mt-2 rounded-2xl bg-zinc-50 p-3 flex items-center justify-between">
              <span className="text-[10px] font-bold text-zinc-500">Closing</span>
              <span className="text-sm font-black text-zinc-900">{formatNumber(day.closing, 0)} L</span>
            </div>
          </div>
        ))}
      </section>

      <section className="rounded-3xl bg-white p-2 border border-zinc-200 shadow-sm overflow-hidden">
        <div className="p-4 flex items-center justify-between border-b border-zinc-100">
          <h3 className="font-bold flex items-center gap-2">
            <History size={18} className="text-orange-500" />
            All Entries
          </h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-zinc-50 bg-zinc-50 text-[10px] font-bold uppercase tracking-wider text-zinc-400">
                <th className="px-6 py-4">Date & Time</th>
                <th className="px-6 py-4">Type</th>
                <th className="px-6 py-4">Liters</th>
                <th className="px-6 py-4">Supplier/Vehicle</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-50">
              {allLogs.map((item) => (
                <tr key={item.id} className="group hover:bg-zinc-50/50 transition-colors">
                  <td className="px-6 py-4">
                    <p className="text-xs font-semibold">{format(item.timestamp.toDate(), 'MMM d')}</p>
                    <p className="text-[10px] text-zinc-400">{format(item.timestamp.toDate(), 'hh:mm a')}</p>
                  </td>
                  <td className="px-6 py-4">
                    <span className={cn(
                       "inline-flex rounded-lg px-2 py-1 text-[10px] font-bold uppercase",
                       item.type === EntryType.INWARD ? "bg-green-100 text-green-700" : 
                       item.type === EntryType.CONSUMPTION ? "bg-red-100 text-red-700" : 
                       item.type === 'setup' ? "bg-zinc-100 text-zinc-700" : "bg-orange-100 text-orange-700"
                    )}>
                      {item.type === EntryType.INWARD ? 'Inward' : 
                       item.type === EntryType.CONSUMPTION ? 'Manual' : 
                       item.type === 'setup' ? 'Setup' : 'TM Issue'}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-sm font-bold text-zinc-900">
                      {item.type === EntryType.INWARD || item.type === 'setup' ? '+' : '-'}
                      {'liters' in item ? item.liters : (item as any).liters_given} L
                    </p>
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-xs font-medium text-zinc-600">
                      {'supplier' in item ? item.supplier : (item as any).vehicleNumber || 'System'}
                    </p>
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-xs text-zinc-400 max-w-[150px] truncate">{item.note || '-'}</p>
                  </td>
                  <td className="px-6 py-4 text-right">
                    {item.type !== 'setup' && (
                      <button 
                        onClick={() => setItemToDelete(item)}
                        className="md:opacity-0 md:group-hover:opacity-100 p-2 text-zinc-300 hover:text-red-500 transition-all"
                      >
                        <Trash2 size={16} />
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {itemToDelete && (
        <DeleteModal 
          onClose={() => setItemToDelete(null)}
          onConfirm={handleDelete}
          title="Delete Entry"
          message="Are you sure you want to delete this inventory entry? This will affect your calculated balance."
        />
      )}
    </div>
  );
}

function DeleteModal({ onClose, onConfirm, title, message }: { onClose: () => void, onConfirm: () => void, title: string, message: string }) {
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
      <div className="w-full max-w-sm rounded-[32px] bg-white p-8 shadow-2xl">
        <h3 className="text-xl font-black text-zinc-900">{title}</h3>
        <p className="mt-2 text-sm font-medium text-zinc-500 leading-relaxed">
          {message}
        </p>
        <div className="mt-8 flex gap-3">
          <button 
            onClick={onClose}
            className="flex-1 rounded-2xl bg-zinc-100 py-4 text-sm font-bold text-zinc-500 hover:bg-zinc-200"
          >
            Cancel
          </button>
          <button 
            onClick={onConfirm}
            className="flex-1 rounded-2xl bg-red-500 py-4 text-sm font-bold text-white shadow-lg shadow-red-200 hover:bg-red-600"
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}
