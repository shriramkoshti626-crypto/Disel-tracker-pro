/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { DieselProvider, useDiesel } from './context/DieselContext';
import { signIn, signOut } from './lib/firebase';
import { 
  Fuel, 
  Truck, 
  History, 
  BarChart3, 
  Plus, 
  Settings, 
  LogOut, 
  User as UserIcon,
  AlertTriangle
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Dashboard } from './components/dashboard/Dashboard';
import { InventoryView } from './components/inventory/InventoryView';
import { VehicleList } from './components/vehicles/VehicleList';
import { ReportsView } from './components/reports/ReportsView';
import { cn } from './lib/utils';

function AppContent() {
  const { user, loading, dailyBalances } = useDiesel();
  const [activeTab, setActiveTab] = useState<'dashboard' | 'inventory' | 'vehicles' | 'reports'>('dashboard');

  if (loading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-zinc-950">
        <motion.div 
          animate={{ scale: [1, 1.2, 1], rotate: [0, 180, 360] }}
          transition={{ duration: 2, repeat: Infinity }}
          className="text-orange-500"
        >
          <Fuel size={40} />
        </motion.div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-zinc-950 px-6 text-white text-center">
        <div className="mb-8 rounded-2xl bg-zinc-900 p-6 shadow-2xl">
          <Fuel size={64} className="mx-auto mb-4 text-orange-500" />
          <h1 className="text-3xl font-bold tracking-tight">DieselTrack Pro</h1>
          <p className="mt-2 text-zinc-400">RMC Plant Diesel Management System</p>
        </div>
        <button
          onClick={signIn}
          className="flex w-full max-w-sm items-center justify-center gap-3 rounded-xl bg-orange-500 py-4 font-semibold text-white transition-all hover:bg-orange-600 active:scale-95"
        >
          <UserIcon size={20} />
          Sign in with Google
        </button>
      </div>
    );
  }

  const tabs = [
    { id: 'dashboard', label: 'Home', icon: Fuel },
    { id: 'inventory', label: 'Stock', icon: History },
    { id: 'vehicles', label: 'Fleet', icon: Truck },
    { id: 'reports', label: 'Reports', icon: BarChart3 },
  ];

  return (
    <div className="flex min-h-screen flex-col bg-zinc-50 pb-24 text-zinc-900 md:pb-0 md:pl-64">
      {/* Desktop Sidebar */}
      <aside className="fixed left-0 top-0 hidden h-full w-64 flex-col border-r border-zinc-200 bg-white p-6 md:flex">
        <div className="mb-10 flex items-center gap-3 text-orange-600">
          <Fuel size={32} strokeWidth={2.5} />
          <span className="text-xl font-bold tracking-tight">DieselTrack</span>
        </div>
        
        <nav className="flex flex-1 flex-col gap-2">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={cn(
                "flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-colors",
                activeTab === tab.id 
                  ? "bg-orange-50 text-orange-600 shadow-sm" 
                  : "text-zinc-500 hover:bg-zinc-50 hover:text-zinc-900"
              )}
            >
              <tab.icon size={20} />
              {tab.label}
            </button>
          ))}
        </nav>

        <div className="mt-auto border-t border-zinc-100 pt-6">
          <div className="flex items-center gap-3 px-2 mb-4">
            <img src={user.photoURL || ''} alt="" className="h-8 w-8 rounded-full border border-zinc-200" />
            <div className="flex flex-col">
              <span className="text-xs font-semibold truncate max-w-[120px]">{user.displayName}</span>
              <span className="text-[10px] text-zinc-500 truncate max-w-[120px]">{user.email}</span>
            </div>
          </div>
          <button
            onClick={signOut}
            className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium text-red-500 hover:bg-red-50 transition-colors"
          >
            <LogOut size={20} />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-4 md:p-8">
        <header className="mb-8 flex items-center justify-between md:hidden">
          <div className="flex items-center gap-2">
            <Fuel size={28} className="text-orange-500" />
            <h1 className="text-xl font-bold">DieselTrack</h1>
          </div>
          <button onClick={signOut} className="text-zinc-400">
            <LogOut size={20} />
          </button>
        </header>

        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
          >
            {activeTab === 'dashboard' && <Dashboard />}
            {activeTab === 'inventory' && <InventoryView />}
            {activeTab === 'vehicles' && <VehicleList />}
            {activeTab === 'reports' && <ReportsView />}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Mobile Nav */}
      <nav className="fixed bottom-0 left-0 flex w-full justify-around border-t border-zinc-200 bg-white/80 p-2 backdrop-blur-lg md:hidden">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className="flex flex-col items-center gap-1 rounded-xl px-4 py-2 transition-all active:scale-90"
          >
            <tab.icon 
              size={20} 
              className={cn(activeTab === tab.id ? "text-orange-600" : "text-zinc-400")} 
              fill={activeTab === tab.id ? "currentColor" : "none"}
              fillOpacity={0.2}
            />
            <span className={cn("text-[10px] font-medium", activeTab === tab.id ? "text-orange-600" : "text-zinc-500")}>
              {tab.label}
            </span>
          </button>
        ))}
      </nav>
    </div>
  );
}

export default function App() {
  return (
    <DieselProvider>
      <AppContent />
    </DieselProvider>
  );
}
