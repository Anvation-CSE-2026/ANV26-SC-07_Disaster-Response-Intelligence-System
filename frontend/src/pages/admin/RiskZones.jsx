import React, { useEffect, useState } from 'react';
import { api } from '../../services/api';
import { useWebSocket } from '../../hooks/useWebSocket';
import LoadingSpinner from '../../components/LoadingSpinner';
import StatusBadge from '../../components/StatusBadge';

export default function RiskZones() {
  const [zones, setZones] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [creating, setCreating] = useState(false);
  const { lastMessage } = useWebSocket('admin');

  // New Zone State
  const [selectedCity, setSelectedCity] = useState('Bengaluru');
  const [subZoneName, setSubZoneName] = useState('');
  const [newZone, setNewZone] = useState({ latitude: '12.9716', longitude: '77.5946', population: '25000', area_sqkm: '5.0' });

  const cityDefaults = {
    'Bengaluru': { lat: '12.9716', lng: '77.5946' },
    'Mangaluru': { lat: '12.8698', lng: '74.8430' },
    'Udupi': { lat: '13.3409', lng: '74.7421' },
    'Kodagu': { lat: '12.3375', lng: '75.8069' },
    'Mysuru': { lat: '12.2958', lng: '76.6394' }
  };

  const handleCityChange = (e) => {
    const city = e.target.value;
    setSelectedCity(city);
    if (cityDefaults[city]) {
      setNewZone(prev => ({
        ...prev,
        latitude: cityDefaults[city].lat,
        longitude: cityDefaults[city].lng
      }));
    }
  };

  const loadData = async () => {
    const data = await api.fetchZones();
    if (data) setZones(data);
    setLoading(false);
  };

  useEffect(() => { loadData(); }, []);
  useEffect(() => { if(lastMessage) loadData(); }, [lastMessage]);

  const handleCreate = async (e) => {
    e.preventDefault();
    setCreating(true);
    await api.createZone({
      name: `${subZoneName} (${selectedCity})`,
      latitude: parseFloat(newZone.latitude),
      longitude: parseFloat(newZone.longitude),
      population: parseInt(newZone.population),
      area_sqkm: parseFloat(newZone.area_sqkm),
      disaster_id: 1 // default to active disaster
    });
    setCreating(false);
    setShowModal(false);
    setSubZoneName('');
    loadData();
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div className="max-w-6xl mx-auto space-y-6 relative">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Risk Zones</h1>
        <button 
          onClick={() => setShowModal(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded shadow text-sm font-semibold"
        >
          + Add Custom Sub-Zone
        </button>
      </div>

      {showModal && (
        <div className="absolute top-0 right-0 w-80 bg-white border shadow-xl rounded-lg p-5 z-20">
          <h2 className="font-bold border-b pb-2 mb-4">Add Custom Sub-Zone</h2>
          <form onSubmit={handleCreate} className="space-y-3">
            <div>
              <label className="block text-xs text-gray-500 mb-1">Parent City / District</label>
              <select value={selectedCity} onChange={handleCityChange} className="w-full border p-2 rounded text-sm bg-gray-50">
                {Object.keys(cityDefaults).map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Sub-Zone Name</label>
              <input required value={subZoneName} onChange={e => setSubZoneName(e.target.value)} className="w-full border p-2 rounded text-sm" placeholder="e.g. Koramangala" />
            </div>
            <div className="flex gap-2">
              <div className="w-1/2">
                <label className="block text-xs text-gray-500 mb-1">Latitude</label>
                <input required type="number" step="any" value={newZone.latitude} onChange={e => setNewZone({...newZone, latitude: e.target.value})} className="w-full border p-2 rounded text-sm" />
              </div>
              <div className="w-1/2">
                <label className="block text-xs text-gray-500 mb-1">Longitude</label>
                <input required type="number" step="any" value={newZone.longitude} onChange={e => setNewZone({...newZone, longitude: e.target.value})} className="w-full border p-2 rounded text-sm" />
              </div>
            </div>
            <div className="flex gap-2">
              <div className="w-1/2">
                <label className="block text-xs text-gray-500 mb-1">Population</label>
                <input required type="number" value={newZone.population} onChange={e => setNewZone({...newZone, population: e.target.value})} className="w-full border p-2 rounded text-sm" placeholder="25000" />
              </div>
              <div className="w-1/2">
                <label className="block text-xs text-gray-500 mb-1">Area (sqkm)</label>
                <input required type="number" step="any" value={newZone.area_sqkm} onChange={e => setNewZone({...newZone, area_sqkm: e.target.value})} className="w-full border p-2 rounded text-sm" placeholder="5.0" />
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-4 pt-2 border-t">
              <button type="button" onClick={() => setShowModal(false)} className="px-3 py-1.5 text-sm text-gray-600 bg-gray-100 rounded">Cancel</button>
              <button type="submit" disabled={creating} className="px-3 py-1.5 text-sm text-white bg-blue-600 rounded">{creating ? 'Saving...' : 'Save Zone'}</button>
            </div>
          </form>
        </div>
      )}

      <div className="bg-white border rounded-lg shadow-sm overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200 text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left font-medium text-gray-500">Zone</th>
              <th className="px-4 py-3 text-left font-medium text-gray-500">Risk Score</th>
              <th className="px-4 py-3 text-left font-medium text-gray-500">Level</th>
              <th className="px-4 py-3 text-left font-medium text-gray-500">Pred (30m)</th>
              <th className="px-4 py-3 text-left font-medium text-gray-500">Trend</th>
              <th className="px-4 py-3 text-left font-medium text-gray-500">Status</th>
              <th className="px-4 py-3 text-left font-medium text-gray-500">Help Reqs</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {zones.map(zone => (
              <tr key={zone.id} className="hover:bg-gray-50">
                <td className="px-4 py-3 font-medium">{zone.name}</td>
                <td className="px-4 py-3 font-semibold">{Math.round(zone.current_risk_score)}</td>
                <td className="px-4 py-3">
                  <StatusBadge level={zone.risk_level} />
                </td>
                <td className="px-4 py-3 text-gray-600">{Math.round(zone.predicted_risk_30)}</td>
                <td className="px-4 py-3 capitalize text-gray-600">{zone.trend?.replace('_', ' ')}</td>
                <td className="px-4 py-3 text-gray-600 capitalize">{zone.response_status}</td>
                <td className="px-4 py-3 font-medium text-red-600">{zone.help_request_count}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
