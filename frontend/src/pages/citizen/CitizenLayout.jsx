import React, { useState, useEffect } from 'react';
import { Outlet, NavLink } from 'react-router-dom';
import { Home, Bell, Phone, Building, Flag } from 'lucide-react';
import { api } from '../../services/api';

export default function CitizenLayout() {
  const [zones, setZones] = useState([]);
  const [userZoneId, setUserZoneId] = useState(parseInt(localStorage.getItem('dris_user_zone_id')) || 1);

  useEffect(() => {
    const init = async () => {
      const zData = await api.fetchZones();
      if (zData && zData.length > 0) {
        setZones(zData);
        // If not set in localStorage, default to a sensible GPS-based zone (or first one)
        if (!localStorage.getItem('dris_user_zone_id')) {
          setUserZoneId(zData[0].id);
        }
      }
    };
    init();
  }, []);

  const changeUserZone = (newId) => {
    setUserZoneId(newId);
    localStorage.setItem('dris_user_zone_id', newId);
  };

  const navItems = [
    { to: "/citizen", icon: Home, label: "Home", end: true },
    { to: "/citizen/alerts", icon: Bell, label: "Alerts" },
    { to: "/citizen/help", icon: Phone, label: "Help" },
    { to: "/citizen/shelter", icon: Building, label: "Shelter" },
    { to: "/citizen/report", icon: Flag, label: "Report" }
  ];

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-gray-50 max-w-md mx-auto relative shadow-2xl">
      <header className="h-14 bg-emerald-700 text-white flex items-center justify-between px-4 shrink-0 z-10">
        <div className="font-bold">DRIS</div>
        <div className="text-sm font-medium">Safety Portal</div>
      </header>

      <main className="flex-1 overflow-y-auto pb-16 relative">
        <Outlet context={{ zones, userZoneId, changeUserZone }} />
      </main>

      <nav className="fixed bottom-0 w-full max-w-md bg-white border-t h-16 flex shrink-0 z-20">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            className={({ isActive }) => 
              `flex-1 flex flex-col items-center justify-center text-xs gap-1 ${isActive ? 'text-emerald-700 font-semibold' : 'text-gray-500 hover:text-gray-900'}`
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
