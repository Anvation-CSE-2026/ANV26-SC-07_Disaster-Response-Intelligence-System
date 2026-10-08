import React from 'react';
import { Outlet, NavLink } from 'react-router-dom';
import { LayoutDashboard, AlertTriangle, ListOrdered, Truck, Users, TrendingUp, Bell, Map as MapIcon, Sliders, FileText, LifeBuoy } from 'lucide-react';
import Header from '../../components/Header';

export default function AdminLayout() {
  const navItems = [
    { to: "/admin", icon: LayoutDashboard, label: "Overview", end: true },
    { to: "/admin/zones", icon: AlertTriangle, label: "Risk Zones" },
    { to: "/admin/priorities", icon: ListOrdered, label: "Priority Queue" },
    { to: "/admin/resources", icon: Truck, label: "Resources" },
    { to: "/admin/teams", icon: Users, label: "Response Teams" },
    { to: "/admin/predictions", icon: TrendingUp, label: "Predictions" },
    { to: "/admin/alerts", icon: Bell, label: "Alerts" },
    { to: "/admin/map", icon: MapIcon, label: "Map" },
    { to: "/admin/simulator", icon: Sliders, label: "Simulator" },
    { to: "/admin/reports", icon: FileText, label: "Reports" },
    { to: "/admin/requests", icon: LifeBuoy, label: "User Requests" }
  ];

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-gray-50">
      <Header role="admin" />
      <div className="flex flex-1 overflow-hidden">
        <aside className="w-56 bg-gray-800 text-gray-300 flex flex-col shrink-0">
          <nav className="flex-1 py-4 space-y-1 overflow-y-auto">
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                className={({ isActive }) => 
                  `flex items-center px-4 py-2 text-sm font-medium ${isActive ? 'bg-gray-700 text-white' : 'hover:bg-gray-700 hover:text-white'}`
                }
              >
                <item.icon className="mr-3 h-5 w-5 flex-shrink-0" />
                {item.label}
              </NavLink>
            ))}
          </nav>
        </aside>
        <main className="flex-1 overflow-y-auto p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
