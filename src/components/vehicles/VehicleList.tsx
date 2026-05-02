import React, { useState } from 'react';
import { useDiesel } from '../../context/DieselContext';
import { Plus, Edit2, Trash2, Search, Truck, Zap, AlertTriangle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Vehicle } from '../../types';
import { cn } from '../../lib/utils';

export function VehicleList() {
  const { vehicles, addVehicle, updateVehicle, deleteVehicle } = useDiesel();
  const [searchTerm, setSearchTerm] = useState('');
  const [editingVehicle, setEditingVehicle] = useState<Vehicle | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [vehicleToDelete, setVehicleToDelete] = useState<Vehicle | null>(null);

  const filteredVehicles = vehicles.filter(v => 
    v.vehicle_number.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleDelete = async () => {
    if (vehicleToDelete?.id) {
      await deleteVehicle(vehicleToDelete.id);
      setVehicleToDelete(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-black tracking-tight">Vehicle Master</h2>
          <p className="text-sm text-zinc-500">Manage your RMC transit mixer fleet</p>
        </div>
        <button 
          onClick={() => setShowAddForm(true)}
          className="flex items-center justify-center gap-2 rounded-xl bg-zinc-900 px-6 py-3 font-bold text-white shadow-lg hover:bg-zinc-800 transition-all active:scale-95"
        >
          <Plus size={20} />
          Register Vehicle
        </button>
      </div>

      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400" size={20} />
        <input 
          type="text" 
          placeholder="Search vehicle number..." 
          className="w-full rounded-2xl border border-zinc-200 bg-white p-4 pl-12 shadow-sm focus:border-orange-500 focus:ring-0"
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
        />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <AnimatePresence>
          {filteredVehicles.length === 0 ? (
            <div className="col-span-full py-12 text-center text-zinc-400 bg-white rounded-3xl border border-dashed border-zinc-200">
              <Truck size={48} className="mx-auto mb-4 opacity-20" />
              <p>No vehicles registered yet.</p>
            </div>
          ) : (
            filteredVehicles.map((vehicle) => (
              <motion.div 
                key={vehicle.id}
                layout
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="group relative overflow-hidden rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm transition-all hover:border-orange-200 hover:shadow-md"
              >
                <div className="flex items-start justify-between">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-orange-100 text-orange-600">
                    <Truck size={24} />
                  </div>
                  <div className="flex gap-1 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
                    <button 
                      onClick={() => setEditingVehicle(vehicle)}
                      className="rounded-lg p-2 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-900 focus:text-zinc-900"
                    >
                      <Edit2 size={16} />
                    </button>
                    <button 
                      onClick={() => setVehicleToDelete(vehicle)}
                      className="rounded-lg p-2 text-zinc-400 hover:bg-zinc-100 hover:text-red-500 focus:text-red-500"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
                
                <div className="mt-4">
                  <h3 className="text-xl font-bold tracking-tight">{vehicle.vehicle_number}</h3>
                  <div className="mt-2 flex items-center gap-2">
                    <Zap size={14} className="text-orange-500" />
                    <span className="text-sm font-medium text-zinc-600">{vehicle.mileage_kmpl} KM/L Mileage</span>
                  </div>
                  {vehicle.note && (
                    <p className="mt-3 text-xs text-zinc-400 line-clamp-1">{vehicle.note}</p>
                  )}
                </div>
              </motion.div>
            ))
          )}
        </AnimatePresence>
      </div>

      {(showAddForm || editingVehicle) && (
        <VehicleFormModal 
          vehicle={editingVehicle || undefined}
          existingVehicles={vehicles}
          onClose={() => {
            setShowAddForm(false);
            setEditingVehicle(null);
          }}
          onSubmit={async (data) => {
            if (editingVehicle) {
              await updateVehicle(editingVehicle.id!, data);
            } else {
              await addVehicle(data);
            }
          }}
        />
      )}

      {/* Delete Confirmation Modal */}
      {vehicleToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="w-full max-w-sm rounded-3xl bg-white p-6 shadow-2xl text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-100 text-red-600">
              <AlertTriangle size={32} />
            </div>
            <h3 className="text-xl font-bold text-zinc-900">Delete Vehicle?</h3>
            <p className="mt-2 text-sm text-zinc-500">
              Are you sure you want to delete <span className="font-bold text-zinc-900">{vehicleToDelete.vehicle_number}</span>? This action cannot be undone.
            </p>
            <div className="mt-6 flex gap-3">
              <button 
                onClick={() => setVehicleToDelete(null)}
                className="flex-1 rounded-xl bg-zinc-100 py-3 font-bold text-zinc-500"
              >
                Cancel
              </button>
              <button 
                onClick={handleDelete}
                className="flex-1 rounded-xl bg-red-600 py-3 font-bold text-white shadow-lg shadow-red-100"
              >
                Delete
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}

function VehicleFormModal({ 
  vehicle, 
  existingVehicles, 
  onClose, 
  onSubmit 
}: { 
  vehicle?: Vehicle, 
  existingVehicles: Vehicle[],
  onClose: () => void, 
  onSubmit: (d: any) => Promise<void> 
}) {
  const [number, setNumber] = useState(vehicle?.vehicle_number || '');
  const [mileage, setMileage] = useState(vehicle?.mileage_kmpl?.toString() || '');
  const [note, setNote] = useState(vehicle?.note || '');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!number || !mileage) return;

    const upperNumber = number.toUpperCase().trim();
    
    // Duplicate check
    const isDuplicate = existingVehicles.some(v => 
      v.vehicle_number.toUpperCase() === upperNumber && v.id !== vehicle?.id
    );

    if (isDuplicate) {
      setError(`Vehicle ${upperNumber} is already registered!`);
      return;
    }

    setLoading(true);
    try {
      await onSubmit({ 
        vehicle_number: upperNumber, 
        mileage_kmpl: Number(mileage), 
        note 
      });
      onClose();
    } catch (err) {
      setError('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-md overflow-hidden rounded-3xl bg-white shadow-2xl">
        <div className="bg-zinc-900 p-6 text-white">
          <h2 className="text-xl font-bold">{vehicle ? 'Update Vehicle' : 'Register Vehicle'}</h2>
          <p className="text-xs opacity-60">Fleet details for mileage tracking</p>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="rounded-xl bg-red-50 p-4 text-xs font-bold text-red-600 border border-red-100 flex items-center gap-2">
              <AlertTriangle size={16} />
              {error}
            </div>
          )}
          <div className="space-y-1">
            <label className="text-xs font-bold uppercase text-zinc-500">Vehicle Number</label>
            <input 
              autoFocus
              type="text" 
              value={number} 
              onChange={e => {
                setNumber(e.target.value);
                setError(null);
              }}
              className={cn(
                "w-full rounded-xl border p-4 font-bold text-lg focus:ring-0 transition-all",
                error ? "border-red-300 bg-red-50 focus:border-red-500" : "border-zinc-200 bg-zinc-50 focus:border-orange-500"
              )}
              placeholder="e.g. MH12 AB 1234"
              required
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-bold uppercase text-zinc-500">Standard Mileage (KM/L)</label>
            <input 
              type="number" 
              value={mileage} 
              onChange={e => setMileage(e.target.value)}
              className="w-full rounded-xl border border-zinc-200 bg-zinc-50 p-4 font-bold text-lg focus:border-orange-500 focus:ring-0"
              placeholder="0.0"
              step="0.1"
              required
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-bold uppercase text-zinc-500">Note (Optional)</label>
            <textarea 
              value={note} 
              onChange={e => setNote(e.target.value)}
              className="w-full rounded-xl border border-zinc-200 bg-zinc-50 p-4 focus:border-orange-500 focus:ring-0"
              placeholder="Driver details, model year, etc."
              rows={2}
            />
          </div>
          <div className="flex gap-3 pt-4">
            <button type="button" onClick={onClose} className="flex-1 rounded-xl bg-zinc-100 py-4 font-bold text-zinc-500">Cancel</button>
            <button disabled={loading} type="submit" className="flex-1 rounded-xl bg-orange-500 py-4 font-bold text-white shadow-lg">
              {loading ? 'Processing...' : (vehicle ? 'Update' : 'Register')}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}

