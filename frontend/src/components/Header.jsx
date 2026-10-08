import React from 'react';
import { useWebSocket } from '../hooks/useWebSocket';

export default function Header({ role }) {
  const { connected } = useWebSocket(role || 'admin');

  return (
    <header className="h-14 bg-white border-b shadow-sm flex items-center justify-between px-4 sticky top-0 z-10">
      <div className="flex items-center gap-4">
        <h1 className="font-bold text-lg tracking-tight text-blue-900">DRIS</h1>
        <span className="hidden sm:inline-block text-sm text-gray-500 font-medium">Disaster Response Intelligence System</span>
      </div>
      
      <div className="flex items-center gap-4">
        <span className="bg-amber-100 text-amber-800 text-xs px-2 py-1 rounded font-semibold border border-amber-200">
          SIMULATION
        </span>
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-600">Operational</span>
          <div className={`w-2.5 h-2.5 rounded-full ${connected ? 'bg-green-500' : 'bg-red-500'}`} title={connected ? 'Connected' : 'Disconnected'}></div>
        </div>
      </div>
    </header>
  );
}
