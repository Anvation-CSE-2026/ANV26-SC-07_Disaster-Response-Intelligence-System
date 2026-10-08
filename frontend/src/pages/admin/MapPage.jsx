import React, { useEffect, useState } from 'react';
import { api } from '../../services/api';
import { useWebSocket } from '../../hooks/useWebSocket';
import MapView from '../../components/MapView';

export default function MapPage() {
  const [zones, setZones] = useState([]);
  const [resources, setResources] = useState([]);
  const [shelters, setShelters] = useState([]);
  const { lastMessage } = useWebSocket('admin');

  const loadData = async () => {
    const [z, r, s] = await Promise.all([
      api.fetchZones(),
      api.fetchResources(),
      api.fetchShelters()
    ]);
    if (z) setZones(z);
    if (r) setResources(r);
    if (s) setShelters(s);
  };

  useEffect(() => { loadData(); }, []);
  useEffect(() => { if(lastMessage) loadData(); }, [lastMessage]);

  return (
    <div className="h-full flex flex-col -m-6"> {/* Negative margin to undo padding */}
      <div className="flex-1">
        <MapView 
          zones={zones} 
          resources={resources}
          shelters={shelters}
          center={[14.5, 76.0]}
          zoom={7}
        />
      </div>
    </div>
  );
}
