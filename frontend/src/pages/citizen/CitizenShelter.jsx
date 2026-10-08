import React, { useEffect, useState } from 'react';
import { api } from '../../services/api';
import LoadingSpinner from '../../components/LoadingSpinner';
import StatusBadge from '../../components/StatusBadge';
import { useNavigate } from 'react-router-dom';

import { useWebSocket } from '../../hooks/useWebSocket';

export default function CitizenShelter() {
  const [shelters, setShelters] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const { lastMessage } = useWebSocket('citizen');

  const loadData = async () => {
    const data = await api.fetchShelters();
    if (data) setShelters(data);
    setLoading(false);
  };

  useEffect(() => { loadData(); }, []);
  useEffect(() => { if(lastMessage) loadData(); }, [lastMessage]);

  if (loading) return <LoadingSpinner />;

  return (
    <div className="p-4 space-y-4">
      <h1 className="text-xl font-bold border-b pb-2">Nearby Shelters</h1>
      <div className="space-y-3">
        {shelters.map(shelter => {
          const isFull = shelter.current_occupancy >= shelter.capacity;
          return (
            <div key={shelter.id} className="bg-white border rounded-lg p-4 shadow-sm">
              <div className="flex justify-between items-start mb-2">
                <h2 className="font-bold text-lg">{shelter.name}</h2>
                <StatusBadge 
                  status={isFull ? 'FULL' : 'AVAILABLE'} 
                  type={isFull ? 'red' : 'green'} 
                />
              </div>
              <div className="text-sm text-gray-600 mb-4">
                Capacity: {shelter.current_occupancy} / {shelter.capacity} people
              </div>
              <button 
                onClick={() => navigate('/citizen/route')}
                className="w-full bg-blue-100 text-blue-700 font-semibold py-2 rounded border border-blue-200"
              >
                Get Directions
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
