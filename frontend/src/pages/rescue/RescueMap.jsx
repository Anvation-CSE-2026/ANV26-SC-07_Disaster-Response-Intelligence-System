import React, { useEffect, useState } from 'react';
import { api } from '../../services/api';
import { useWebSocket } from '../../hooks/useWebSocket';
import MapView from '../../components/MapView';

export default function RescueMap() {
  const [zones, setZones] = useState([]);
  const [resources, setResources] = useState([]);
  const [roads, setRoads] = useState([]);
  const [routes, setRoutes] = useState([]);
  const [routeUpdated, setRouteUpdated] = useState(false);
  const { lastMessage } = useWebSocket('rescue');
  const teamId = parseInt(localStorage.getItem('dris_team_id') || '2');

  const [isTracking, setIsTracking] = useState(false);

  const loadData = async () => {
    const [z, r] = await Promise.all([
      api.fetchZones(),
      api.fetchResources()
    ]);
    if (z) setZones(z);
    
    // Load roads
    const roadsRes = await fetch('/api/roads');
    if (roadsRes.ok) {
      const roadsData = await roadsRes.json();
      setRoads(roadsData);
    }
    
    if (r) {
      setResources(r);
      const team = r.find(res => res.id === teamId);
      if (team && team.assigned_zone_id && z) {
        const assignedZone = z.find(zone => zone.id === team.assigned_zone_id);
        if (assignedZone && team.latitude && team.longitude) {
          const routeData = await api.fetchRoute(
            team.latitude, team.longitude, 
            assignedZone.latitude, assignedZone.longitude
          );
          if (routeData && routeData.geometry) {
            setRoutes([routeData.geometry]);
            if (lastMessage?.type === 'route_updated') {
              setRouteUpdated(true);
              setTimeout(() => setRouteUpdated(false), 3000);
            }
          }
        }
      }
    }
  };

  useEffect(() => { loadData(); }, []);
  useEffect(() => { if(lastMessage) loadData(); }, [lastMessage]);

  const simulateGpsTracking = async () => {
    setIsTracking(true);
    const team = resources.find(r => r.id === teamId);
    const assignedZone = zones.find(z => z.id === team?.assigned_zone_id);
    if (!team || !assignedZone) {
      setIsTracking(false);
      return;
    }

    let currentLat = team.latitude;
    let currentLng = team.longitude;
    const destLat = assignedZone.latitude;
    const destLng = assignedZone.longitude;

    const steps = 20;
    const latStep = (destLat - currentLat) / steps;
    const lngStep = (destLng - currentLng) / steps;

    for (let i = 0; i < steps; i++) {
      currentLat += latStep;
      currentLng += lngStep;
      
      // Optically update locally for smooth UI
      setResources(prev => prev.map(r => r.id === teamId ? { ...r, latitude: currentLat, longitude: currentLng } : r));
      
      // Update backend
      await api.updateTeamLocation(teamId, currentLat, currentLng);
      
      await new Promise(r => setTimeout(r, 1000)); // wait 1s
    }
    setIsTracking(false);
  };

  return (
    <div className="h-full relative">
      <div className="absolute top-4 right-4 z-[1000]">
        <button 
          onClick={simulateGpsTracking}
          disabled={isTracking}
          className={`px-4 py-2 rounded shadow font-bold text-sm ${isTracking ? 'bg-gray-400 text-white cursor-not-allowed' : 'bg-blue-600 text-white hover:bg-blue-700'}`}
        >
          {isTracking ? 'Tracking Live...' : 'Start Live GPS Tracking'}
        </button>
      </div>
      <MapView 
        zones={zones} 
        resources={resources}
        roads={roads}
        routes={routes}
        center={[14.5, 76.0]}
        zoom={7}
      />
      {routeUpdated && (
        <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-[1000] bg-white px-4 py-2 rounded-full shadow-lg text-sm font-bold text-blue-700 border-2 border-blue-200 animate-pulse">
          Route Updated
        </div>
      )}
    </div>
  );
}
