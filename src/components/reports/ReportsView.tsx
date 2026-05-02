import React, { useState } from 'react';
import { useDiesel } from '../../context/DieselContext';
import { format, isWithinInterval, startOfDay, endOfDay } from 'date-fns';
import { Download, FileSpreadsheet, Filter, CheckCircle2 } from 'lucide-react';
import * as XLSX from 'xlsx';
import { cn } from '../../lib/utils';
import { EntryType } from '../../types';

export function ReportsView() {
  const { tmLogs, entries, vehicles, dailyBalances } = useDiesel();
  const [startDate, setStartDate] = useState(format(startOfDay(new Date()), 'yyyy-MM-dd'));
  const [endDate, setEndDate] = useState(format(endOfDay(new Date()), 'yyyy-MM-dd'));
  const [selectedVehicle, setSelectedVehicle] = useState('all');
  const [exporting, setExporting] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleExport = () => {
    setExporting(true);
    setSuccess(false);

    const range = {
      start: startOfDay(new Date(startDate)),
      end: endOfDay(new Date(endDate))
    };

    // Filter TM Logs
    const filteredTmLogs = tmLogs.filter(log => {
      const date = log.timestamp.toDate();
      const inRange = isWithinInterval(date, range);
      const vehicleMatch = selectedVehicle === 'all' || log.vehicleId === selectedVehicle;
      return inRange && vehicleMatch;
    });

    // Prepare TM Logs sheet
    const tmData = filteredTmLogs.map(log => ({
      'Date': format(log.timestamp.toDate(), 'yyyy-MM-dd'),
      'Time': format(log.timestamp.toDate(), 'hh:mm a'),
      'Vehicle Number': log.vehicleNumber,
      'Liters Given': log.liters_given,
      'Mileage (KM/L)': log.mileage_at_time,
      'Est. Range (KM)': log.estimated_km,
      'Note': log.note || ''
    }));

    // Filter Inventory Summary
    const inventoryData = dailyBalances
      .filter(b => isWithinInterval(new Date(b.dateString), range))
      .map(b => {
        // Calculate inward/consumption specifically for this export view
        const dayInward = entries
          .filter(e => e.type === EntryType.INWARD && isWithinInterval(e.timestamp.toDate(), { start: startOfDay(new Date(b.dateString)), end: endOfDay(new Date(b.dateString)) }))
          .reduce((sum, e) => sum + e.liters, 0);
        
        const manualConsumption = entries
            .filter(e => e.type === EntryType.CONSUMPTION && isWithinInterval(e.timestamp.toDate(), { start: startOfDay(new Date(b.dateString)), end: endOfDay(new Date(b.dateString)) }))
            .reduce((sum, e) => sum + e.liters, 0);

        const tmConsumption = tmLogs
          .filter(l => isWithinInterval(l.timestamp.toDate(), { start: startOfDay(new Date(b.dateString)), end: endOfDay(new Date(b.dateString)) }))
          .reduce((sum, l) => sum + l.liters_given, 0);

        return {
          'Date': b.dateString,
          'Opening Balance': b.opening_balance,
          'Total Inward': dayInward,
          'Total Consumption': manualConsumption + tmConsumption,
          'Closing Balance': b.opening_balance + dayInward - (manualConsumption + tmConsumption)
        };
      });

    // Create WorkBook
    const wb = XLSX.utils.book_new();
    const wsTm = XLSX.utils.json_to_sheet(tmData);
    const wsInv = XLSX.utils.json_to_sheet(inventoryData);

    XLSX.utils.book_append_sheet(wb, wsTm, "TM Logs");
    XLSX.utils.book_append_sheet(wb, wsInv, "Inventory Summary");

    // Save File
    XLSX.writeFile(wb, `DieselTrack_Report_${startDate}_to_${endDate}.xlsx`);

    setTimeout(() => {
      setExporting(false);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    }, 500);
  };

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-black tracking-tight">Export Reports</h2>
        <p className="text-sm text-zinc-500">Generate Excel reports for audits and tracking</p>
      </div>

      <section className="rounded-3xl bg-white p-8 border border-zinc-200 shadow-sm space-y-6">
        <div className="flex items-center gap-2 text-zinc-900 border-b border-zinc-100 pb-4">
          <Filter size={18} />
          <h3 className="font-bold">Report Filters</h3>
        </div>

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          <div className="space-y-1">
            <label className="text-xs font-bold uppercase text-zinc-400">Start Date</label>
            <input 
              type="date" 
              value={startDate} 
              onChange={e => setStartDate(e.target.value)}
              className="w-full rounded-2xl border border-zinc-200 bg-zinc-50 p-4 font-medium focus:border-orange-500 focus:ring-0"
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-bold uppercase text-zinc-400">End Date</label>
            <input 
              type="date" 
              value={endDate} 
              onChange={e => setEndDate(e.target.value)}
              className="w-full rounded-2xl border border-zinc-200 bg-zinc-50 p-4 font-medium focus:border-orange-500 focus:ring-0"
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-bold uppercase text-zinc-400">Vehicle Filter</label>
            <select 
              value={selectedVehicle}
              onChange={e => setSelectedVehicle(e.target.value)}
              className="w-full rounded-2xl border border-zinc-200 bg-zinc-50 p-4 font-medium focus:border-orange-500 focus:ring-0"
            >
              <option value="all">All Vehicles</option>
              {vehicles.map(v => (
                <option key={v.id} value={v.id}>{v.vehicle_number}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="pt-6">
          <button 
            disabled={exporting}
            onClick={handleExport}
            className={cn(
              "flex w-full items-center justify-center gap-3 rounded-2xl py-5 font-bold text-white transition-all active:scale-[0.98]",
              success ? "bg-green-600 shadow-lg shadow-green-100" : "bg-orange-500 shadow-lg shadow-orange-100 hover:bg-orange-600"
            )}
          >
            {success ? (
              <>
                <CheckCircle2 size={24} />
                Report Exported!
              </>
            ) : exporting ? (
              "Preparing Report..."
            ) : (
              <>
                <FileSpreadsheet size={24} />
                Export to Excel (.xlsx)
              </>
            )}
          </button>
        </div>
      </section>

      <section className="rounded-3xl border-2 border-zinc-200 border-dashed p-10 text-center space-y-4">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-zinc-100 text-zinc-400">
          <Download size={32} />
        </div>
        <div className="max-w-md mx-auto">
          <h4 className="font-bold text-lg text-zinc-900">Automatic Sync</h4>
          <p className="text-sm text-zinc-500">Your data is securely stored in the cloud and available across all your devices.</p>
        </div>
      </section>
    </div>
  );
}
