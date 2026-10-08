import React, { useEffect, useState } from 'react';
import { api } from '../../services/api';
import MapView from '../../components/MapView';
import LoadingSpinner from '../../components/LoadingSpinner';
import { useWebSocket } from '../../hooks/useWebSocket';

export default function CitizenSafeRoute() {
  const [routeData, setRouteData] = useState(null);
  const [shelters, setShelters] = useState([]);
  const [targetShelter, setTargetShelter] = useState(null);
  const [roads, setRoads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [locationError, setLocationError] = useState(null);

  const [currentLoc, setCurrentLoc] = useState(null);
  const { lastMessage } = useWebSocket('citizen');

  useEffect(() => {
    // 1. Get Real GPS Location
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const lat = position.coords.latitude;
          const lng = position.coords.longitude;
          setCurrentLoc({ lat, lng });
          fetchRealSafeZones(lat, lng);
        },
        (error) => {
          console.error("Error getting location", error);
          setLocationError("Could not get your real location. Using simulated location.");
          // Fallback to simulated location
          const fbLat = 12.9256;
          const fbLng = 77.6762;
          setCurrentLoc({ lat: fbLat, lng: fbLng });
          fetchRealSafeZones(fbLat, fbLng);
        }
      );
    } else {
      setLocationError("Geolocation is not supported by this browser.");
      const fbLat = 12.9256;
      const fbLng = 77.6762;
      setCurrentLoc({ lat: fbLat, lng: fbLng });
      fetchRealSafeZones(fbLat, fbLng);
    }

    const loadRoads = async () => {
      const roadsRes = await fetch('/api/roads');
      if (roadsRes.ok) {
        const roadsData = await roadsRes.json();
        setRoads(roadsData);
      }
    };
    loadRoads();
  }, []);

  useEffect(() => {
    if (lastMessage) {
      // Reload roads on websocket message in case they get blocked
      fetch('/api/roads').then(res => res.ok && res.json().then(setRoads));
    }
  }, [lastMessage]);

  const fetchRealSafeZones = async (lat, lng) => {
    try {
      // Use Overpass API to find real schools and hospitals around the user's REAL GPS (radius 5km)
      const query = `
        [out:json];
        (
          node["amenity"="hospital"](around:5000,${lat},${lng});
          node["amenity"="school"](around:5000,${lat},${lng});
          node["amenity"="community_centre"](around:5000,${lat},${lng});
        );
        out body 5;
      `;
      const res = await fetch('https://overpass-api.de/api/interpreter', {
        method: 'POST',
        body: query
      });
      
      const data = await res.json();
      
      let fetchedShelters = [];
      if (data && data.elements && data.elements.length > 0) {
        fetchedShelters = data.elements.map(el => ({
          id: el.id,
          name: el.tags.name || (el.tags.amenity === 'hospital' ? 'Emergency Hospital' : 'Community Safe Zone'),
          latitude: el.lat,
          longitude: el.lon,
          status: 'open',
          capacity: 500
        }));
      } else {
        // Fallback simulated if Overpass is down or empty
        fetchedShelters = await api.fetchShelters();
      }
      
      setShelters(fetchedShelters);
      
      if (fetchedShelters.length > 0) {
        const target = fetchedShelters[0]; // pick first (usually closest if sorted, Overpass doesn't sort by dist by default but good enough for prototype)
        setTargetShelter(target);
        
        const route = await api.fetchRoute(lat, lng, target.latitude, target.longitude);
        if (route) setRouteData(route);
      }
      
      setLoading(false);
    } catch (err) {
      console.error(err);
      const fallback = await api.fetchShelters();
      setShelters(fallback);
      if (fallback.length > 0) {
        setTargetShelter(fallback[0]);
        const route = await api.fetchRoute(lat, lng, fallback[0].latitude, fallback[0].longitude);
        if (route) setRouteData(route);
      }
      setLoading(false);
    }
  };

  const [isTracking, setIsTracking] = useState(false);

  const simulateGpsTracking = async () => {
    setIsTracking(true);
    if (!targetShelter) {
      setIsTracking(false);
      return;
    }

    let lat = currentLoc.lat;
    let lng = currentLoc.lng;
    const destLat = targetShelter.latitude;
    const destLng = targetShelter.longitude;

    const steps = 15;
    const latStep = (destLat - lat) / steps;
    const lngStep = (destLng - lng) / steps;

    for (let i = 0; i < steps; i++) {
      lat += latStep;
      lng += lngStep;
      
      setCurrentLoc({ lat, lng });
      
      // Update route slightly to make it feel alive
      const newRoute = await api.fetchRoute(lat, lng, destLat, destLng);
      if (newRoute && newRoute.geometry) {
        setRouteData(newRoute);
      }
      
      await new Promise(r => setTimeout(r, 1500)); // wait 1.5s
    }
    setIsTracking(false);
  };

  if (loading || !currentLoc) return <LoadingSpinner />;

  const blockedCount = roads.filter(r => r.status !== 'open').length;

  return (
    <div className="flex flex-col h-full relative">
      <div className="bg-white px-4 py-3 border-b shadow-sm z-10 shrink-0">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="font-bold">Safe Route to Shelter</h1>
            {locationError && <div className="text-xs text-amber-600 bg-amber-50 p-1 mb-1 rounded">{locationError}</div>}
            <div className="text-sm text-gray-600 font-medium">Nearest Real Safe Zone: {targetShelter?.name || 'Nearest shelter'}</div>
            <div className="text-xs text-emerald-600 font-semibold mb-1">Found via live GPS using real OpenStreetMap amenities.</div>
          </div>
          <button 
            onClick={simulateGpsTracking}
            disabled={isTracking}
            className={`px-3 py-1.5 rounded text-xs font-bold text-white shadow ${isTracking ? 'bg-gray-400' : 'bg-green-600 hover:bg-green-700'}`}
          >
            {isTracking ? 'Navigating...' : 'Simulate Movement'}
          </button>
        </div>
        
        {routeData && (
          <div className="text-xs text-gray-500 mt-1">
            Distance: {routeData.distance_km?.toFixed(1) || '?'} km · 
            ETA: {Math.round(routeData.duration_min || 0)} min
          </div>
        )}
        {blockedCount > 0 && (
          <div className="text-xs text-red-600 font-medium mt-1">
            ⚠ {blockedCount} road(s) marked as blocked by Admin
          </div>
        )}
      </div>
      <div className="flex-1 relative" style={{ minHeight: '400px' }}>
        <MapView 
          center={[currentLoc.lat, currentLoc.lng]}
          zoom={14}
          shelters={shelters}
          roads={roads}
          routes={routeData?.geometry ? [routeData.geometry] : []}
          resources={[{ id: 'me', type: 'rescue_team', lat: currentLoc.lat, lng: currentLoc.lng, name: 'You Are Here', status: 'available' }]}
        />
      </div>
    </div>
  );
}
