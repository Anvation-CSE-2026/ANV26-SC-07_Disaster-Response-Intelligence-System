import React, { useEffect, useState } from 'react';
import { useNavigate, useOutletContext } from 'react-router-dom';
import { api } from '../../services/api';
import { useWebSocket } from '../../hooks/useWebSocket';
import LoadingSpinner from '../../components/LoadingSpinner';
import { MapPin } from 'lucide-react';

export default function CitizenHome() {
  const navigate = useNavigate();
  const { zones, userZoneId, changeUserZone } = useOutletContext();
  
  const [zoneData, setZoneData] = useState(null);
  const [latestAlert, setLatestAlert] = useState(null);
  const [nearestShelter, setNearestShelter] = useState(null);
  const [loading, setLoading] = useState(true);
  const [safeSent, setSafeSent] = useState(false);
  
  const { lastMessage } = useWebSocket('citizen');

  const loadData = async () => {
    if (zones && zones.length > 0) {
      const myZone = zones.find(z => z.id === userZoneId) || zones[0];
      setZoneData(myZone);
      
      const shelters = await api.fetchShelters();
      if (shelters && shelters.length > 0) {
        // Find shelter in same zone or closest
        const zoneShelter = shelters.find(s => s.zone_id === userZoneId) || shelters[0];
        setNearestShelter(zoneShelter);
      }
    }
    
    const alerts = await api.fetchAlerts('citizen', 50);
    if (alerts && alerts.length > 0) {
      const relevantAlerts = alerts.filter(a => a.zone_id === null || a.zone_id === userZoneId);
      setLatestAlert(relevantAlerts.length > 0 ? relevantAlerts[0] : null);
    } else {
      setLatestAlert(null);
    }
    
    setLoading(false);
  };

  useEffect(() => { loadData(); }, [zones, userZoneId]);
  useEffect(() => { if(lastMessage) loadData(); }, [lastMessage]);

  const handleSafe = async () => {
    await api.markSafe({ citizen_id: 1, shelter_id: nearestShelter?.id });
    setSafeSent(true);
    setTimeout(() => setSafeSent(false), 3000);
  };

  const handleLocateMe = () => {
    if (navigator.geolocation && zones.length > 0) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const lat = pos.coords.latitude;
          const lon = pos.coords.longitude;
          // Find closest zone using simple pythagorean distance for fast approximation
          let closest = zones[0];
          let minD = Infinity;
          zones.forEach(z => {
            const d = Math.pow(z.latitude - lat, 2) + Math.pow(z.longitude - lon, 2);
            if (d < minD) { minD = d; closest = z; }
          });
          changeUserZone(closest.id);
        },
        (err) => {
          console.warn("GPS failed, defaulting to Zone 1");
        }
      );
    }
  };

  if (loading) return <LoadingSpinner />;

  const riskLevel = zoneData?.risk_level || 'unknown';
  const riskColor = riskLevel === 'critical' ? 'text-red-600' : riskLevel === 'high' ? 'text-orange-600' : riskLevel === 'medium' ? 'text-amber-600' : 'text-green-600';

  return (
    <div className="p-4 space-y-5">
      
      {/* Location Selector */}
      <div className="bg-white border rounded p-3 flex flex-col gap-2 shadow-sm">
        <label className="text-xs font-bold text-gray-500 uppercase flex items-center gap-1">
          <MapPin className="w-3 h-3"/> Current Location
        </label>
        <div className="flex gap-2">
          <select 
            className="flex-1 border p-2 rounded text-sm bg-gray-50 font-semibold"
            value={userZoneId}
            onChange={(e) => changeUserZone(parseInt(e.target.value))}
          >
            {zones.map(z => (
              <option key={z.id} value={z.id}>{z.name}</option>
            ))}
          </select>
          <button onClick={handleLocateMe} className="bg-emerald-100 text-emerald-800 px-3 rounded text-xs font-bold whitespace-nowrap">
            Locate Me
          </button>
        </div>
      </div>

      {/* Safety Status */}
      <div className="text-center space-y-2 py-3 bg-white border rounded-lg shadow-sm">
        <h1 className="font-bold text-gray-500 uppercase text-xs tracking-widest mt-2">Zone Safety Status</h1>
        <div className={`text-3xl font-black ${riskColor}`}>
          {riskLevel.toUpperCase()} RISK
        </div>
        <div className="text-sm text-gray-500 pb-3">
          {zoneData?.name || 'Unknown Zone'}
        </div>
      </div>

      {/* Latest Alert */}
      {latestAlert && (
        <div className={`p-3 rounded border text-sm shadow-sm ${latestAlert.severity === 'critical' ? 'bg-red-50 text-red-800 border-red-200' : 'bg-amber-50 text-amber-800 border-amber-200'}`}>
          <div className="font-bold mb-1 uppercase text-xs">⚠ Active Alert</div>
          {latestAlert.message}
        </div>
      )}

      {/* Action Buttons */}
      <div className="grid grid-cols-1 gap-3">
        <button 
          onClick={() => navigate('/citizen/help')} 
          className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-4 rounded-lg shadow-sm text-lg active:scale-[0.98] transition-transform"
        >
          I NEED HELP
        </button>
        <button 
          onClick={handleSafe}
          disabled={safeSent}
          className={`w-full font-bold py-4 rounded-lg shadow-sm text-lg transition-all ${safeSent ? 'bg-green-400 text-white' : 'bg-green-600 hover:bg-green-700 text-white active:scale-[0.98]'}`}
        >
          {safeSent ? '✓ Status Recorded' : "I'M SAFE"}
        </button>
        <button 
          onClick={() => navigate('/citizen/report')} 
          className="w-full bg-amber-500 hover:bg-amber-600 text-white font-bold py-4 rounded-lg shadow-sm text-lg active:scale-[0.98] transition-transform"
        >
          REPORT INCIDENT
        </button>
        <div className="grid grid-cols-2 gap-3">
          <button 
            onClick={() => navigate('/citizen/route')} 
            className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-lg shadow-sm active:scale-[0.98] transition-transform"
          >
            SAFE ROUTE
          </button>
          <button 
            onClick={() => navigate('/citizen/shelter')} 
            className="bg-teal-600 hover:bg-teal-700 text-white font-bold py-3 rounded-lg shadow-sm active:scale-[0.98] transition-transform"
          >
            FIND SHELTER
          </button>
        </div>
      </div>

      {/* Nearest Shelter */}
      {nearestShelter && (
        <div className="bg-white border rounded-lg p-4 shadow-sm">
          <h2 className="text-xs font-bold text-gray-500 uppercase mb-2">Nearest Shelter to You</h2>
          <div className="flex justify-between items-center">
            <div>
              <div className="font-bold text-sm">{nearestShelter.name}</div>
              <div className="text-xs text-gray-500">Distance calculated via DB</div>
            </div>
            <span className={`px-2 py-0.5 rounded text-xs font-medium ${nearestShelter.status === 'open' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
              {nearestShelter.status === 'open' ? `Available (${nearestShelter.current_occupancy}/${nearestShelter.capacity})` : 'Full'}
            </span>
          </div>
        </div>
      )}

    </div>
  );
}
