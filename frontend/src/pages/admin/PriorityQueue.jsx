import React, { useEffect, useState } from 'react';
import { api } from '../../services/api';
import { useWebSocket } from '../../hooks/useWebSocket';
import LoadingSpinner from '../../components/LoadingSpinner';
import StatusBadge from '../../components/StatusBadge';

export default function PriorityQueue() {
  const [priorities, setPriorities] = useState([]);
  const [zones, setZones] = useState({});
  const [assignments, setAssignments] = useState({});
  const [loading, setLoading] = useState(true);
  const { lastMessage } = useWebSocket('admin');

  const loadData = async () => {
    const [pData, zData, rData] = await Promise.all([
      api.fetchPriorities(),
      api.fetchZones(),
      api.fetchResources()
    ]);
    if (pData) setPriorities(pData);
    if (zData) {
      const zoneMap = {};
      zData.forEach(z => { zoneMap[z.id] = z; });
      setZones(zoneMap);
    }
    if (rData) {
      const assignMap = {};
      rData.forEach(r => {
        if (r.assigned_zone_id) {
          if (!assignMap[r.assigned_zone_id]) assignMap[r.assigned_zone_id] = [];
          assignMap[r.assigned_zone_id].push(r);
        }
      });
      setAssignments(assignMap);
    }
    setLoading(false);
  };

  useEffect(() => { loadData(); }, []);
  useEffect(() => { if(lastMessage) loadData(); }, [lastMessage]);

  if (loading) return <LoadingSpinner />;

  const WEIGHT_LABELS = {
    risk_contrib: { label: 'Current Risk', weight: '35%' },
    pred_contrib: { label: 'Predicted Risk', weight: '20%' },
    pop_contrib: { label: 'Population Exposure', weight: '20%' },
    urgency_contrib: { label: 'Urgency', weight: '10%' },
    access_contrib: { label: 'Accessibility', weight: '10%' },
    help_contrib: { label: 'Help Requests', weight: '5%' },
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold">Priority Queue</h1>
        <span className="text-xs text-gray-400">Ranked by composite priority score</span>
      </div>
      
      <div className="space-y-4">
        {priorities.map((p, index) => {
          const zone = zones[p.zone_id];
          const factors = p.priority_factors || {};
          return (
            <div key={p.zone_id} className={`bg-white border rounded-lg shadow-sm overflow-hidden ${index === 0 ? 'border-red-200' : ''}`}>
              <div className={`flex items-center gap-4 p-4 ${index === 0 ? 'bg-red-50' : index < 3 ? 'bg-orange-50' : ''}`}>
                <div className="flex-shrink-0 flex items-center justify-center w-10 h-10 bg-white rounded-full text-lg font-bold text-gray-700 border shadow-sm">
                  {index + 1}
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-1">
                    <h2 className="font-bold text-lg truncate">{p.zone_name}</h2>
                    {zone && <StatusBadge level={zone.risk_level} />}
                  </div>
                  
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-x-6 gap-y-1 text-sm text-gray-600">
                    <div>Risk: <span className="font-semibold text-gray-900">{Math.round(zone?.current_risk_score || 0)}</span></div>
                    <div>Predicted: <span className="font-semibold text-gray-900">{Math.round(zone?.predicted_risk_30 || 0)}</span></div>
                    <div>Exposure: <span className="font-semibold text-gray-900 capitalize">{zone?.population_exposure || '-'}</span></div>
                    <div>Help Reqs: <span className="font-semibold text-gray-900">{zone?.help_request_count || 0}</span></div>
                  </div>
                </div>

                <div className="text-right flex-shrink-0">
                  <div className="text-2xl font-bold">{Math.round(p.priority_score)}</div>
                  <div className="text-xs text-gray-500">priority</div>
                </div>
              </div>

              {/* Priority Factors */}
              <div className="px-4 py-3 border-t bg-gray-50">
                <div className="text-xs font-semibold text-gray-500 uppercase mb-2">Priority Factors</div>
                <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                  {Object.entries(WEIGHT_LABELS).map(([key, meta]) => (
                    <div key={key} className="text-center">
                      <div className="text-xs text-gray-500">{meta.label}</div>
                      <div className="font-semibold text-sm">{Math.round(factors[key] || 0)}</div>
                      <div className="text-xs text-gray-400">{meta.weight}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Recommended Resource */}
              <div className="px-4 py-2 border-t flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold uppercase text-gray-500">Recommended:</span>
                  <span className="text-sm bg-blue-50 text-blue-700 px-2 py-0.5 rounded border border-blue-100 capitalize">
                    {(p.recommended_resource_type || 'none').replace('_', ' ')}
                  </span>
                </div>
                {assignments[p.zone_id] && assignments[p.zone_id].length > 0 && (
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold uppercase text-gray-500">Assigned:</span>
                    {assignments[p.zone_id].map(res => (
                      <span key={res.id} className="text-sm bg-green-50 text-green-700 px-2 py-0.5 rounded border border-green-100 font-medium">
                        {res.name}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          );
        })}
        {priorities.length === 0 && <p className="text-gray-500 text-center py-8">No active priorities.</p>}
      </div>
    </div>
  );
}
