import React, { useEffect, useState } from 'react';
import { api } from '../../services/api';
import { useWebSocket } from '../../hooks/useWebSocket';
import LoadingSpinner from '../../components/LoadingSpinner';

export default function RescueStatus() {
  const [team, setTeam] = useState(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const teamId = parseInt(localStorage.getItem('dris_team_id') || '2');
  const { lastMessage } = useWebSocket('rescue');

  const loadData = async () => {
    const resources = await api.fetchResources();
    const currentTeam = resources?.find(t => t.id === teamId && t.type === 'rescue_team');
    if (currentTeam) setTeam(currentTeam);
    setLoading(false);
  };

  useEffect(() => { loadData(); }, []);
  useEffect(() => { if(lastMessage) loadData(); }, [lastMessage]);

  const updateStatus = async (status) => {
    setUpdating(true);
    await api.updateTeamStatus(teamId, status);
    await loadData();
    setUpdating(false);
  };

  if (loading) return <LoadingSpinner />;
  if (!team) return <div className="p-4 text-center text-gray-500">Team not found</div>;

  const statuses = [
    { id: 'available', label: 'AVAILABLE', color: 'bg-green-600 hover:bg-green-700', activeRing: 'ring-green-400' },
    { id: 'assigned', label: 'ACCEPTED', color: 'bg-blue-600 hover:bg-blue-700', activeRing: 'ring-blue-400' },
    { id: 'on_site', label: 'ON SITE', color: 'bg-amber-500 hover:bg-amber-600', activeRing: 'ring-amber-400' },
    { id: 'completed', label: 'COMPLETED', color: 'bg-gray-600 hover:bg-gray-700', activeRing: 'ring-gray-400' }
  ];

  return (
    <div className="p-4 space-y-6">
      <h1 className="text-xl font-bold">Update Status</h1>
      
      <div className="bg-white border rounded-lg p-4 shadow-sm mb-6 text-center">
        <div className="text-sm text-gray-500 mb-1">Current Status</div>
        <div className="text-2xl font-bold uppercase">{team.status.replace('_', ' ')}</div>
        <div className="text-xs text-gray-400 mt-1">{team.name}</div>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {statuses.map(s => (
          <button
            key={s.id}
            onClick={() => updateStatus(s.id)}
            disabled={team.status === s.id || updating}
            className={`w-full py-4 rounded-lg text-white font-bold text-lg shadow-sm transition-all ${
              team.status === s.id ? `ring-4 ring-offset-2 ${s.activeRing} scale-[1.02]` : 'opacity-80 hover:opacity-100'
            } ${s.color} ${updating ? 'cursor-wait' : ''}`}
          >
            {team.status === s.id ? `✓ ${s.label}` : s.label}
          </button>
        ))}
      </div>
    </div>
  );
}
