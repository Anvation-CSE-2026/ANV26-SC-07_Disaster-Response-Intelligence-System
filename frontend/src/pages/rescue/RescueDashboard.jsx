import React, { useEffect, useState } from 'react';
import { api } from '../../services/api';
import { useWebSocket } from '../../hooks/useWebSocket';
import LoadingSpinner from '../../components/LoadingSpinner';
import AlertItem from '../../components/AlertItem';

export default function RescueDashboard() {
  const [team, setTeam] = useState(null);
  const [zoneData, setZoneData] = useState(null);
  const [latestAlert, setLatestAlert] = useState(null);
  const [helpRequest, setHelpRequest] = useState(null);
  const [loading, setLoading] = useState(true);
  
  // Default to Team 02 for demo
  const teamId = parseInt(localStorage.getItem('dris_team_id') || '2');
  const { lastMessage } = useWebSocket('rescue');

  const loadData = async () => {
    const resources = await api.fetchResources();
    const currentTeam = resources?.find(t => t.id === teamId && t.type === 'rescue_team');
    if (currentTeam) {
      setTeam(currentTeam);
      if (currentTeam.assigned_zone_id) {
        const zDetail = await api.fetchZoneDetail(currentTeam.assigned_zone_id);
        if (zDetail) setZoneData(zDetail);
      }
    }

    const hReqs = await api.fetchTeamRequests(teamId);
    if (hReqs && hReqs.length > 0) {
      setHelpRequest(hReqs[0]);
    } else {
      setHelpRequest(null);
    }
    
    
    const alerts = await api.fetchAlerts('rescue_team', 1);
    if (alerts && alerts.length > 0) setLatestAlert(alerts[0]);
    
    setLoading(false);
  };

  useEffect(() => { loadData(); }, []);
  useEffect(() => { if(lastMessage) loadData(); }, [lastMessage]);

  if (loading) return <LoadingSpinner />;

  const isAssigned = team && team.assigned_zone_id;
  const riskLevel = zoneData?.risk_level;

  return (
    <div className="p-4 space-y-4">
      {!isAssigned ? (
        <div className="bg-white border rounded-lg p-6 text-center shadow-sm">
          <div className="text-green-600 font-bold text-lg mb-2">AVAILABLE</div>
          <p className="text-gray-500 text-sm">No active assignment. Standing by for dispatch.</p>
          <p className="text-xs text-gray-400 mt-2">Team: {team?.name || `Team ${teamId}`}</p>
        </div>
      ) : (
        <>
          {/* Assignment Card */}
          <div className={`bg-white border-2 rounded-lg shadow-sm overflow-hidden ${riskLevel === 'critical' ? 'border-red-300' : riskLevel === 'high' ? 'border-orange-300' : 'border-blue-300'}`}>
            <div className={`px-4 py-3 border-b flex justify-between items-center ${riskLevel === 'critical' ? 'bg-red-50 border-red-100' : riskLevel === 'high' ? 'bg-orange-50 border-orange-100' : 'bg-blue-50 border-blue-100'}`}>
              <span className={`font-bold uppercase text-sm ${riskLevel === 'critical' ? 'text-red-800' : riskLevel === 'high' ? 'text-orange-800' : 'text-blue-800'}`}>
                {riskLevel === 'critical' ? 'CRITICAL' : riskLevel === 'high' ? 'HIGH' : 'ACTIVE'} PRIORITY
              </span>
              <span className="text-sm font-semibold text-gray-600">ETA: ~12 min</span>
            </div>
            <div className="p-4 space-y-3 text-sm">
              <div className="flex justify-between border-b pb-2">
                <span className="text-gray-500">Zone:</span>
                <span className="font-bold text-lg">{zoneData?.name || `Zone ${team.assigned_zone_id}`}</span>
              </div>
              <div className="flex justify-between border-b pb-2">
                <span className="text-gray-500">Task:</span>
                <span className="font-semibold text-blue-700">{helpRequest ? 'Emergency SOS' : 'Rescue / Evacuation'}</span>
              </div>
              
              {/* User Request Details */}
              {helpRequest && (
                <div className="bg-amber-50 border border-amber-200 rounded p-3 my-2 text-amber-900">
                  <div className="font-bold mb-1 flex justify-between">
                    <span>Citizen: {helpRequest.citizen_name || 'Anonymous'}</span>
                    <span className="text-xs uppercase bg-amber-200 px-1 rounded">{helpRequest.type.replace('_', ' ')}</span>
                  </div>
                  <p className="italic text-xs mb-2">"{helpRequest.description || 'No description provided'}"</p>
                  
                  <div className="flex gap-2 mt-3">
                    <button 
                      onClick={() => alert(`Locating User at: ${helpRequest.latitude.toFixed(4)}, ${helpRequest.longitude.toFixed(4)}\n(In a real app, this would open GPS navigation)`)}
                      className="flex-1 bg-blue-600 text-white font-bold py-2 rounded text-xs shadow-sm hover:bg-blue-700"
                    >
                      Locate User
                    </button>
                    <button 
                      onClick={async () => {
                        await api.resolveRequest(helpRequest.id);
                        loadData();
                        alert('Request marked as completed!');
                      }}
                      className="flex-1 bg-green-600 text-white font-bold py-2 rounded text-xs shadow-sm hover:bg-green-700"
                    >
                      Complete Request
                    </button>
                  </div>
                </div>
              )}

              <div className="flex justify-between items-center pt-2">
                <span className="text-gray-500">Zone Risk:</span>
                <div className="flex gap-2 items-baseline">
                  <span className="font-bold text-red-600 text-xl">{Math.round(zoneData?.current_risk_score || 0)}</span>
                  <span className="text-gray-400">→</span>
                  <span className="font-bold text-red-800">{Math.round(zoneData?.predicted_risk_30 || 0)}</span>
                  <span className="text-xs text-gray-400">(30m)</span>
                </div>
              </div>
            </div>
          </div>

          {/* Situation */}
          <div className="bg-white border rounded-lg p-4 shadow-sm">
            <h2 className="text-xs font-bold text-gray-500 uppercase mb-3">Situation</h2>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">Risk Level:</span>
                <span className={`font-bold uppercase ${riskLevel === 'critical' ? 'text-red-600' : 'text-orange-600'}`}>{riskLevel}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Trend:</span>
                <span className="font-medium">
                  {zoneData?.trend === 'rapid_increase' ? '⬆️ Rising Rapidly' : 
                   zoneData?.trend === 'increasing' ? '↑ Increasing' :
                   zoneData?.trend === 'decreasing' ? '↓ Decreasing' : '→ Stable'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Help Requests:</span>
                <span className="font-bold">{zoneData?.help_request_count || 0}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Accessibility:</span>
                <span className="font-medium">{zoneData?.accessibility >= 0.8 ? 'Good' : zoneData?.accessibility >= 0.5 ? 'Limited' : 'Poor'}</span>
              </div>
            </div>
            {zoneData?.trend === 'rapid_increase' && (
              <div className="mt-3 bg-red-50 border border-red-200 text-red-800 p-2 rounded text-xs font-medium">
                ⚠️ Water level rising rapidly. Exercise extreme caution.
              </div>
            )}
          </div>

          {/* Latest Alert */}
          {latestAlert && (
            <div>
              <h2 className="text-xs font-bold text-gray-500 uppercase mb-2">Latest Alert</h2>
              <AlertItem alert={latestAlert} />
            </div>
          )}
        </>
      )}
    </div>
  );
}
