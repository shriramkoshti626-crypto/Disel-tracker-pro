import React from 'react';
import { useDiesel } from '../../context/DieselContext';
import { format, subDays, isSameDay } from 'date-fns';
import { History, Calendar, ArrowUpRight, ArrowDownRight, Package } from 'lucide-react';
import { cn, formatNumber } from '../../lib/utils';
import { EntryType } from '../../types';

export function InventoryView() {
  const { entries, dailyBalances, tmLogs } = useDiesel();

  // Generate last 7 days summary
  const last7Days = Array.from({ length: 7 }).map((_, i) => subDays(new Date(), i));
  
  const summaries = last7Days.map(date => {
    const dStr = format(date, 'yyyy-MM-dd');
    const balanceDoc = dailyBalances.find(b => b.dateString === dStr);
    
    // Calculate inward/consumption for this specific day
    let dayInward = 0;
    let dayConsumption = 0;

    entries.forEach(e => {
      if (isSameDay(e.timestamp.toDate(), date)) {
        if (e.type === EntryType.INWARD) dayInward += e.liters;
        else dayConsumption += e.liters;
      }
    });

    tmLogs.forEach(log => {
      if (isSameDay(log.timestamp.toDate(), date)) {
        dayConsumption += log.liters_given;
      }
    });

    return {
      date: date,
      dateString: dStr,
      opening: balanceDoc?.opening_balance || 0,
      inward: dayInward,
      consumption: dayConsumption,
      closing: (balanceDoc?.opening_balance || 0) + dayInward - dayConsumption
    };
  });

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
                <th className="px-6 py-4">Note</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-50">
              {[...entries, ...tmLogs.map(l => ({ ...l, type: 'tm_issue' as any }))].sort((a,b) => b.timestamp.toMillis() - a.timestamp.toMillis()).map((item, idx) => (
                <tr key={idx} className="hover:bg-zinc-50/50 transition-colors">
                  <td className="px-6 py-4">
                    <p className="text-xs font-semibold">{format(item.timestamp.toDate(), 'MMM d')}</p>
                    <p className="text-[10px] text-zinc-400">{format(item.timestamp.toDate(), 'hh:mm a')}</p>
                  </td>
                  <td className="px-6 py-4">
                    <span className={cn(
                      "inline-flex rounded-lg px-2 py-1 text-[10px] font-bold uppercase",
                      item.type === EntryType.INWARD ? "bg-green-100 text-green-700" : 
                      item.type === EntryType.CONSUMPTION ? "bg-red-100 text-red-700" : "bg-orange-100 text-orange-700"
                    )}>
                      {item.type === EntryType.INWARD ? 'Inward' : item.type === EntryType.CONSUMPTION ? 'Manual' : 'TM Issue'}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-sm font-bold text-zinc-900">{item.type === EntryType.INWARD ? '+' : '-'}{'liters' in item ? item.liters : (item as any).liters_given} L</p>
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-xs font-medium text-zinc-600">
                      {'supplier' in item ? item.supplier : (item as any).vehicleNumber || '-'}
                    </p>
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-xs text-zinc-400 max-w-[150px] truncate">{item.note || '-'}</p>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
