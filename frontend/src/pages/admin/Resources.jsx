import React, { useEffect, useState } from 'react';
import { api } from '../../services/api';
import { useWebSocket } from '../../hooks/useWebSocket';
import LoadingSpinner from '../../components/LoadingSpinner';
import StatusBadge from '../../components/StatusBadge';
import { Truck, Users, Anchor } from 'lucide-react';

export default function Resources() {
  const [resources, setResources] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [zones, setZones] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Moved these hooks UP before the early return to fix React hook rules violation
  const [showAddModal, setShowAddModal] = useState(false);
  const [newRes, setNewRes] = useState({ name: '', type: 'rescue_team', capacity: 10, latitude: 12.97, longitude: 77.59 });
  const [creating, setCreating] = useState(false);
  const [renderError, setRenderError] = useState(null);

  const { lastMessage } = useWebSocket('admin');

  const loadData = async () => {
    const [rData, aData, zData] = await Promise.all([
      api.fetchResources(), 
      api.fetchAssignments(),
      api.fetchZones()
    ]);
    if (rData) setResources(rData);
    if (aData) setAssignments(aData);
    if (zData) setZones(zData);
    setLoading(false);
  };

  useEffect(() => { loadData(); }, []);
  useEffect(() => { if(lastMessage) loadData(); }, [lastMessage]);

  if (loading) return <LoadingSpinner />;

  const getIcon = (type) => {
    if (type === 'rescue_team') return <Users className="w-5 h-5 text-blue-600" />;
    if (type === 'ambulance') return <Truck className="w-5 h-5 text-red-600" />;
    if (type === 'boat') return <Anchor className="w-5 h-5 text-teal-600" />;
    return <Truck className="w-5 h-5" />;
  };

  const getStatusType = (status) => {
    if (status === 'available') return 'green';
    if (status === 'assigned') return 'amber';
    if (status === 'on_site') return 'blue';
    return 'default';
  };

  const handleAssign = async (resId, zoneId) => {
    if (!zoneId) return;
    await api.manualAssignResource(resId, parseInt(zoneId));
    loadData();
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    setCreating(true);
    await api.createResource({
      name: newRes.name,
      type: newRes.type,
      capacity: parseInt(newRes.capacity),
      latitude: parseFloat(newRes.latitude),
      longitude: parseFloat(newRes.longitude)
    });
    setCreating(false);
    setShowAddModal(false);
    loadData();
  };

  try {
    return (
      <div className="max-w-6xl mx-auto space-y-6 relative">
        
        {/* Add Resource Modal */}
        {showAddModal && (
          <div className="absolute top-10 left-1/2 transform -translate-x-1/2 w-96 bg-white shadow-2xl rounded-lg p-6 z-50 border">
            <h2 className="font-bold border-b pb-2 mb-4">Add Custom Resource</h2>
            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Resource Name</label>
                <input required className="w-full border p-2 rounded text-sm" value={newRes.name} onChange={e => setNewRes({...newRes, name: e.target.value})} placeholder="e.g. Navy Helicopter" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Type</label>
                <select className="w-full border p-2 rounded text-sm" value={newRes.type} onChange={e => setNewRes({...newRes, type: e.target.value})}>
                  <option value="rescue_team">Rescue Team</option>
                  <option value="ambulance">Ambulance</option>
                  <option value="boat">Boat</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Capacity (People / Load)</label>
                <input required type="number" className="w-full border p-2 rounded text-sm" value={newRes.capacity} onChange={e => setNewRes({...newRes, capacity: e.target.value})} />
              </div>
              <div className="flex gap-2">
                <div className="w-1/2">
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Latitude</label>
                  <input required type="number" step="any" className="w-full border p-2 rounded text-sm" value={newRes.latitude} onChange={e => setNewRes({...newRes, latitude: e.target.value})} />
                </div>
                <div className="w-1/2">
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Longitude</label>
                  <input required type="number" step="any" className="w-full border p-2 rounded text-sm" value={newRes.longitude} onChange={e => setNewRes({...newRes, longitude: e.target.value})} />
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-3 border-t">
                <button type="button" onClick={() => setShowAddModal(false)} className="px-3 py-1.5 rounded bg-gray-100 text-sm font-bold text-gray-600">Cancel</button>
                <button type="submit" disabled={creating} className="px-3 py-1.5 rounded bg-blue-600 text-white text-sm font-bold">{creating ? 'Adding...' : 'Add Resource'}</button>
              </div>
            </form>
          </div>
        )}

        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold">Resources & Allocation</h1>
          <button onClick={() => setShowAddModal(true)} className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded shadow text-sm font-semibold">+ Add Custom Resource</button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <section>
            <h2 className="text-lg font-semibold mb-4">Resource Status</h2>
            <div className="grid grid-cols-1 gap-3">
              {(resources || []).map((res, idx) => (
                <div key={res?.id || idx} className="bg-white border p-4 rounded-lg flex items-center justify-between shadow-sm">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-gray-50 rounded-full border">
                      {getIcon(res?.type)}
                    </div>
                    <div>
                      <h3 className="font-semibold text-sm">{res?.name || 'Unknown'}</h3>
                      <p className="text-xs text-gray-500 capitalize">{String(res?.type || '').replace('_', ' ')}</p>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <StatusBadge status={String(res?.status || 'unknown').replace('_', ' ').toUpperCase()} type={getStatusType(res?.status)} />
                    <div className="flex items-center gap-2 mt-1">
                      <select 
                        className="text-xs border rounded p-1 max-w-[140px]"
                        value={res?.assigned_zone_id || ''}
                        onChange={(e) => handleAssign(res?.id, e.target.value)}
                      >
                        <option value="">No Zone</option>
                        {(zones || []).map(z => (
                          <option key={z.id} value={z.id}>{z.name}</option>
                        ))}
                      </select>
                      <span className="text-xs text-gray-400">Override</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section>
            <h2 className="text-lg font-semibold mb-4">Resource Optimization</h2>
            <div className="bg-white border rounded-lg p-4 shadow-sm text-sm">
              <div className="mb-4">
                <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded font-semibold">Calculated using OR-Tools optimization</span>
              </div>
              
              <h3 className="font-medium mb-2 border-b pb-1">Recommended Allocation</h3>
              <ul className="space-y-3">
                {Array.isArray(assignments) && assignments.map((assignment, i) => {
                  if (!assignment) return null;
                  const res = (resources || []).find(r => r.id === assignment.resource_id);
                  const zone = (zones || []).find(z => z.id === assignment.zone_id);
                  return (
                    <li key={i} className="flex justify-between items-start">
                      <div className="flex items-center max-w-[70%]">
                        <span className="font-semibold text-blue-700 truncate" title={zone?.name}>{zone?.name || `Zone ${assignment.zone_id}`}</span>
                        <span className="mx-2 text-gray-400">-&gt;</span>
                        <span className="truncate" title={res?.name}>{res?.name || `Res ${assignment.resource_id}`}</span>
                      </div>
                      <div className="text-xs text-gray-500 text-right ml-2">{assignment.reason || 'Optimal Match'}</div>
                    </li>
                  );
                })}
                {(!Array.isArray(assignments) || assignments.length === 0) && <li className="text-gray-500">No active assignments needed.</li>}
              </ul>
            </div>
          </section>
        </div>
      </div>
    );
  } catch (err) {
    return (
      <div className="p-8 max-w-4xl mx-auto bg-red-50 border border-red-200 text-red-800 rounded">
        <h1 className="text-xl font-bold mb-4">Crash Detected in Resources Page</h1>
        <pre className="text-sm overflow-auto p-4 bg-white border border-red-100 rounded">{err.toString()}\n{err.stack}</pre>
        <button onClick={() => window.location.reload()} className="mt-4 bg-red-600 text-white px-4 py-2 rounded">Force Reload</button>
      </div>
    );
  }
}
