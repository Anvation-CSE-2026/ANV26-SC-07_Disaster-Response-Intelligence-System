import React, { useEffect, useState } from 'react';
import { api } from '../../services/api';
import { useWebSocket } from '../../hooks/useWebSocket';
import LoadingSpinner from '../../components/LoadingSpinner';
import StatusBadge from '../../components/StatusBadge';

export default function ResponseTeams() {
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(true);
  const { lastMessage } = useWebSocket('admin');

  const loadData = async () => {
    const data = await api.fetchTeams();
    if (data) setTeams(data);
    setLoading(false);
  };

  useEffect(() => { loadData(); }, []);
  useEffect(() => { if(lastMessage) loadData(); }, [lastMessage]);

  if (loading) return <LoadingSpinner />;

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold">Response Teams</h1>
      <div className="bg-white border rounded-lg shadow-sm overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200 text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left font-medium text-gray-500">Team ID</th>
              <th className="px-4 py-3 text-left font-medium text-gray-500">Status</th>
              <th className="px-4 py-3 text-left font-medium text-gray-500">Location</th>
              <th className="px-4 py-3 text-left font-medium text-gray-500">Assignment</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {teams.map(team => (
              <tr key={team.id} className="hover:bg-gray-50">
                <td className="px-4 py-3 font-medium">{team.id}</td>
                <td className="px-4 py-3">
                  <StatusBadge 
                    status={team.status.replace('_', ' ').toUpperCase()} 
                    type={team.status === 'available' ? 'green' : team.status === 'assigned' ? 'amber' : 'blue'} 
                  />
                </td>
                <td className="px-4 py-3 text-gray-600">{team.latitude?.toFixed(4)}, {team.longitude?.toFixed(4)}</td>
                <td className="px-4 py-3 text-gray-600">{team.assigned_zone_id || 'None'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
