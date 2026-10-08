import React from 'react';
import { Outlet, NavLink } from 'react-router-dom';
import { ClipboardList, Map as MapIcon, Radio, Bell } from 'lucide-react';
import { useWebSocket } from '../../hooks/useWebSocket';

export default function RescueLayout() {
  const { connected } = useWebSocket('rescue_team');

  const navItems = [
    { to: "/rescue", icon: ClipboardList, label: "Assignment", end: true },
    { to: "/rescue/map", icon: MapIcon, label: "Map" },
    { to: "/rescue/status", icon: Radio, label: "Status" },
    { to: "/rescue/alerts", icon: Bell, label: "Alerts" }
  ];

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-gray-50 max-w-md mx-auto relative shadow-2xl">
      <header className="h-14 bg-blue-900 text-white flex items-center justify-between px-4 shrink-0 z-10">
        <div className="font-bold">DRIS Response</div>
        <div className="flex items-center gap-3">
          <span className="text-xs font-semibold bg-blue-800 px-2 py-1 rounded">TEAM 02</span>
          <div className={`w-2.5 h-2.5 rounded-full ${connected ? 'bg-green-400' : 'bg-red-400'}`}></div>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto pb-16 relative">
        <Outlet />
      </main>

      <nav className="fixed bottom-0 w-full max-w-md bg-white border-t h-16 flex shrink-0 z-20">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            className={({ isActive }) => 
              `flex-1 flex flex-col items-center justify-center text-xs gap-1 ${isActive ? 'text-blue-700 font-semibold' : 'text-gray-500 hover:text-gray-900'}`
            }
          >
            <item.icon className="h-6 w-6" />
            {item.label}
          </NavLink>
        ))}
      </nav>
    </div>
  );
}
