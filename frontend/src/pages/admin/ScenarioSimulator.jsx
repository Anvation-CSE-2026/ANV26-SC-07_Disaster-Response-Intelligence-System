import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { useWebSocket } from '../../hooks/useWebSocket';
import StatusBadge from '../../components/StatusBadge';

export default function ScenarioSimulator() {
  const [zones, setZones] = useState([]);
  const [roads, setRoads] = useState([]);
  const [resources, setResources] = useState([]);
  const [priorities, setPriorities] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [autoEscalating, setAutoEscalating] = useState(false);
  const [applyingScenario, setApplyingScenario] = useState(false);

  const [zoneId, setZoneId] = useState(2);
  const [disasterType, setDisasterType] = useState('Flood');
  const [waterLevel, setWaterLevel] = useState(2.0);
  const [rainfall, setRainfall] = useState(45);
  const [riseRate, setRiseRate] = useState(0.3);
  const [roadBlocks, setRoadBlocks] = useState([]);
  const [helpRequests, setHelpRequests] = useState(0);

  const { lastMessage } = useWebSocket('admin');

  const loadData = async () => {
    const [z, r, p, a] = await Promise.all([
      api.fetchZones(),
      api.fetchResources(),
      api.fetchPriorities(),
      api.fetchAlerts('admin', 10),
    ]);
    if (z) setZones(z);
    if (r) setResources(r);
    if (p) setPriorities(p);
    if (a) setAlerts(a);
  };

  useEffect(() => {
    loadData();
    loadRoads();
  }, []);

  useEffect(() => {
    if (lastMessage) loadData();
  }, [lastMessage]);

  const loadRoads = async () => {
    const res = await fetch('/api/roads');
    if (res.ok) {
      const data = await res.json();
      setRoads(data);
    }
  };

  const [fetchingLive, setFetchingLive] = useState(false);

  const fetchLiveWeather = async () => {
    const selectedZone = zones.find(z => z.id === parseInt(zoneId));
    if (!selectedZone) return;
    setFetchingLive(true);
    try {
      const res = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${selectedZone.latitude}&longitude=${selectedZone.longitude}&current=precipitation,rain,wind_speed_10m`);
      const data = await res.json();
      if (data.current) {
        setRainfall(data.current.precipitation || 0);
        
        // ML Heuristic mapping for simulation demonstration
        if (data.current.precipitation > 50) { setWaterLevel(4.5); setRiseRate(1.5); }
        else if (data.current.precipitation > 20) { setWaterLevel(3.0); setRiseRate(0.8); }
        else if (data.current.precipitation > 5) { setWaterLevel(1.5); setRiseRate(0.2); }
        else { setWaterLevel(0.5); setRiseRate(0); }
      }
    } catch(e) {
      console.error(e);
    }
    setFetchingLive(false);
  };

  const handleApply = async () => {
    setApplyingScenario(true);
    try {
      await api.applyScenario({
        zone_id: zoneId,
        water_level: waterLevel,
        rainfall: rainfall,
        rise_rate: riseRate,
        road_blocks: roadBlocks,
        help_requests: helpRequests,
      });
      await loadData();
      await loadRoads();
    } finally {
      setApplyingScenario(false);
    }
  };

  const handleReset = async () => {
    await api.resetScenario();
    setWaterLevel(1.0);
    setRainfall(20);
    setRiseRate(0.05);
    setRoadBlocks([]);
    setHelpRequests(0);
    await loadData();
    await loadRoads();
  };

  const handleAutoEscalate = async () => {
    setAutoEscalating(true);
    try {
      await api.autoEscalate(1);
      await loadData();
      await new Promise(r => setTimeout(r, 3000));
      await api.autoEscalate(2);
      await loadData();
      await new Promise(r => setTimeout(r, 3000));
      await api.autoEscalate(3);
      await loadData();
    } finally {
      setAutoEscalating(false);
    }
  };

  const toggleRoadBlock = (roadId, currentStatus) => {
    const newStatus = currentStatus === 'open' ? 'blocked' : 'open';
    const existing = roadBlocks.filter(rb => rb.road_id !== roadId);
    setRoadBlocks([...existing, { road_id: roadId, status: newStatus }]);
  };

  const getRoadEffectiveStatus = (road) => {
    const override = roadBlocks.find(rb => rb.road_id === road.id);
    return override ? override.status : road.status;
  };

  const extractCity = (name) => {
    if (name.includes('(') && name.includes(')')) {
      return name.split('(')[1].split(')')[0].trim();
    }
    if (name.includes('District')) {
      return name.replace('District', '').trim();
    }
    return 'Unknown';
  };

  const citiesSet = new Set();
  zones.forEach(z => citiesSet.add(extractCity(z.name)));
  const availableCities = Array.from(citiesSet).filter(c => c !== 'Unknown');

  const [selectedCityStr, setSelectedCityStr] = useState(availableCities[0] || 'Bengaluru');
  const filteredZones = zones.filter(z => extractCity(z.name) === selectedCityStr);

  useEffect(() => {
    if (filteredZones.length > 0 && !filteredZones.find(z => z.id === zoneId)) {
      setZoneId(filteredZones[0].id);
    }
  }, [selectedCityStr, filteredZones, zoneId]);

  const [showAddCity, setShowAddCity] = useState(false);
  const [showAddZone, setShowAddZone] = useState(false);
  const [newCityName, setNewCityName] = useState('');
  const [newZoneName, setNewZoneName] = useState('');

  const handleAddCity = async (e) => {
    e.preventDefault();
    if (!newCityName) return;
    await api.createZone({
      name: `${newCityName} District`,
      latitude: 15.3173, longitude: 75.7139, population: 100000, area_sqkm: 50.0, disaster_id: 1
    });
    setNewCityName('');
    setShowAddCity(false);
    loadData();
  };

  const handleAddZone = async (e) => {
    e.preventDefault();
    if (!newZoneName) return;
    await api.createZone({
      name: `${newZoneName} (${selectedCityStr})`,
      latitude: 15.3173, longitude: 75.7139, population: 20000, area_sqkm: 5.0, disaster_id: 1
    });
    setNewZoneName('');
    setShowAddZone(false);
    loadData();
  };

  const riskColor = (level) => {
    switch(level) {
      case 'critical': return 'text-red-600 bg-red-50';
      case 'high': return 'text-orange-600 bg-orange-50';
      case 'medium': return 'text-amber-600 bg-amber-50';
      default: return 'text-green-600 bg-green-50';
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6 relative">
      {/* Modals for Custom Add */}
      {showAddCity && (
        <div className="absolute top-20 left-4 bg-white border shadow-xl rounded p-4 z-50">
          <h3 className="font-bold mb-2">Add New City</h3>
          <form onSubmit={handleAddCity} className="flex gap-2">
            <input required value={newCityName} onChange={e => setNewCityName(e.target.value)} placeholder="e.g. Hubballi" className="border p-1 rounded text-sm"/>
            <button type="submit" className="bg-blue-600 text-white px-2 py-1 rounded text-sm font-bold">Add</button>
            <button type="button" onClick={() => setShowAddCity(false)} className="bg-gray-200 px-2 py-1 rounded text-sm font-bold">Cancel</button>
          </form>
        </div>
      )}
      {showAddZone && (
        <div className="absolute top-40 left-4 bg-white border shadow-xl rounded p-4 z-50">
          <h3 className="font-bold mb-2">Add Zone in {selectedCityStr}</h3>
          <form onSubmit={handleAddZone} className="flex gap-2">
            <input required value={newZoneName} onChange={e => setNewZoneName(e.target.value)} placeholder="e.g. Vidyanagar" className="border p-1 rounded text-sm"/>
            <button type="submit" className="bg-blue-600 text-white px-2 py-1 rounded text-sm font-bold">Add</button>
            <button type="button" onClick={() => setShowAddZone(false)} className="bg-gray-200 px-2 py-1 rounded text-sm font-bold">Cancel</button>
          </form>
        </div>
      )}

      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold">Scenario Simulator</h1>
        <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">Simulated Data — Prototype Only</span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Controls — Left Panel */}
        <div className="lg:col-span-2 bg-white border p-5 rounded-lg shadow-sm space-y-5">
          <h2 className="font-semibold border-b pb-2">Simulation Controls</h2>

          <div>
            <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Disaster Type</label>
            <select 
              className="w-full border p-2 rounded text-sm font-semibold text-blue-800 bg-blue-50"
              value={disasterType}
              onChange={e => setDisasterType(e.target.value)}
            >
              <option value="Flood">Flood</option>
              <option value="Fire">Wildfire / Industrial Fire</option>
              <option value="Earthquake">Earthquake</option>
              <option value="Cyclone">Cyclone</option>
            </select>
          </div>

          <div className="space-y-3">
            <div>
              <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Target City / District</label>
              <div className="flex gap-2">
                <select
                  className="flex-1 border p-2 rounded text-sm bg-gray-50 font-medium"
                  value={selectedCityStr}
                  onChange={e => setSelectedCityStr(e.target.value)}
                >
                  {availableCities.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
                <button onClick={() => setShowAddCity(true)} className="px-3 bg-gray-200 hover:bg-gray-300 rounded text-gray-700 text-lg font-bold" title="Add Custom City">+</button>
              </div>
            </div>

            <div>
              <div className="flex justify-between items-end mb-1">
                <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide">Target Zone (Within {selectedCityStr})</label>
                <button 
                  onClick={fetchLiveWeather}
                  disabled={fetchingLive}
                  className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded font-bold hover:bg-green-200 transition"
                >
                  {fetchingLive ? 'Syncing...' : '📡 Sync Live Weather'}
                </button>
              </div>
              <div className="flex gap-2">
                <select
                  className="flex-1 border p-2 rounded text-sm font-semibold text-blue-800 bg-blue-50"
                  value={zoneId}
                  onChange={e => setZoneId(parseInt(e.target.value))}
                >
                  {filteredZones.map(z => (
                    <option key={z.id} value={z.id}>{z.name}</option>
                  ))}
                </select>
                <button onClick={() => setShowAddZone(true)} className="px-3 bg-gray-200 hover:bg-gray-300 rounded text-gray-700 text-lg font-bold" title="Add Custom Zone">+</button>
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">
              {disasterType === 'Flood' ? 'Water Level' : disasterType === 'Fire' ? 'Fire Intensity' : disasterType === 'Earthquake' ? 'Magnitude' : 'Wind Speed'}: 
              <span className="text-gray-900 font-semibold ml-1">{waterLevel.toFixed(1)}{disasterType === 'Flood' ? 'm' : disasterType === 'Earthquake' ? ' M' : ''}</span>
            </label>
            <input
              type="range" min="0" max="10" step="0.1" className={`w-full accent-${disasterType === 'Fire' ? 'orange' : disasterType === 'Earthquake' ? 'amber' : 'blue'}-600`}
              value={waterLevel}
              onChange={e => setWaterLevel(parseFloat(e.target.value))}
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">
              {disasterType === 'Flood' ? 'Rainfall' : disasterType === 'Fire' ? 'Spread Rate' : disasterType === 'Earthquake' ? 'Aftershock Risk' : 'Rainfall'}: 
              <span className="text-gray-900 font-semibold ml-1">{rainfall} {disasterType === 'Flood' || disasterType === 'Cyclone' ? 'mm/hr' : '%'}</span>
            </label>
            <input
              type="range" min="0" max="200" step="5" className={`w-full accent-${disasterType === 'Fire' ? 'orange' : disasterType === 'Earthquake' ? 'amber' : 'blue'}-600`}
              value={rainfall}
              onChange={e => setRainfall(parseFloat(e.target.value))}
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">
              {disasterType === 'Flood' ? 'Rise Rate' : disasterType === 'Fire' ? 'Wind Speed' : disasterType === 'Earthquake' ? 'Building Damage' : 'Storm Distance'}: 
              <span className="text-gray-900 font-semibold ml-1">{riseRate.toFixed(2)} {disasterType === 'Flood' ? 'm/hr' : disasterType === 'Fire' || disasterType === 'Cyclone' ? 'km/h' : '%'}</span>
            </label>
            <input
              type="range" min="0" max="2" step="0.05" className={`w-full accent-${disasterType === 'Fire' ? 'orange' : disasterType === 'Earthquake' ? 'amber' : 'blue'}-600`}
              value={riseRate}
              onChange={e => setRiseRate(parseFloat(e.target.value))}
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">
              Help Requests: <span className="text-gray-900 font-semibold">{helpRequests}</span>
            </label>
            <input
              type="number" min="0" max="50" className="w-full border p-2 rounded text-sm"
              value={helpRequests}
              onChange={e => setHelpRequests(parseInt(e.target.value) || 0)}
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">Road Status</label>
            <div className="space-y-2">
              {roads.map(road => {
                const effective = getRoadEffectiveStatus(road);
                return (
                  <div key={road.id} className="flex items-center justify-between text-sm bg-gray-50 p-2 rounded">
                    <span className="truncate mr-2">{road.name}</span>
                    <button
                      onClick={() => toggleRoadBlock(road.id, effective)}
                      className={`px-2 py-0.5 rounded text-xs font-medium ${effective === 'open' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}
                    >
                      {effective === 'open' ? 'Open' : 'Blocked'}
                    </button>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="flex flex-col gap-2 pt-4 border-t">
            <button
              onClick={handleApply}
              disabled={applyingScenario}
              className="bg-blue-600 text-white px-4 py-2.5 rounded font-medium hover:bg-blue-700 disabled:opacity-50"
            >
              {applyingScenario ? 'Applying...' : 'Apply Scenario'}
            </button>
            <div className="flex gap-2">
              <button
                onClick={handleReset}
                className="bg-gray-200 text-gray-800 px-4 py-2 rounded font-medium hover:bg-gray-300 flex-1 text-sm"
              >
                Reset
              </button>
              <button
                onClick={handleAutoEscalate}
                disabled={autoEscalating}
                className={`px-4 py-2 rounded font-medium flex-1 text-sm text-white ${autoEscalating ? 'bg-amber-400 cursor-not-allowed' : 'bg-amber-600 hover:bg-amber-700'}`}
              >
                {autoEscalating ? 'Escalating...' : 'Auto Escalate'}
              </button>
            </div>
          </div>
        </div>

        {/* Results — Right Panel */}
        <div className="lg:col-span-3 space-y-4">
          {/* Zone Risk Summary */}
          <div className="bg-white border rounded-lg shadow-sm p-4">
            <h2 className="font-semibold border-b pb-2 mb-3">Live Risk Status</h2>
            <div className="space-y-2">
              {zones.map(zone => (
                <div key={zone.id} className="flex items-center justify-between text-sm bg-gray-50 p-3 rounded">
                  <div className="font-medium">{zone.name}</div>
                  <div className="flex items-center gap-4">
                    <div>
                      <span className="text-xs text-gray-500 mr-1">Risk:</span>
                      <span className={`font-bold ${zone.risk_level === 'critical' ? 'text-red-600' : zone.risk_level === 'high' ? 'text-orange-600' : zone.risk_level === 'medium' ? 'text-amber-600' : 'text-green-600'}`}>
                        {Math.round(zone.current_risk_score)}
                      </span>
                    </div>
                    <StatusBadge level={zone.risk_level} />
                    <div className="text-xs">
                      {zone.trend === 'rapid_increase' ? '⬆️' : zone.trend === 'increasing' ? '↑' : zone.trend === 'decreasing' ? '↓' : '→'}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Priority Queue */}
          <div className="bg-white border rounded-lg shadow-sm p-4">
            <h2 className="font-semibold border-b pb-2 mb-3">Priority Queue</h2>
            <table className="min-w-full text-sm">
              <thead>
                <tr className="text-left text-xs text-gray-500 uppercase">
                  <th className="pb-2">#</th>
                  <th className="pb-2">Zone</th>
                  <th className="pb-2">Score</th>
                  <th className="pb-2">Resource</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {priorities.slice(0, 5).map((p, i) => (
                  <tr key={p.zone_id}>
                    <td className="py-2 font-bold text-gray-400">{i + 1}</td>
                    <td className="py-2 font-medium">{p.zone_name}</td>
                    <td className="py-2 font-semibold">{Math.round(p.priority_score)}</td>
                    <td className="py-2 text-xs text-gray-600">{p.recommended_resource_type || 'none'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Resource Allocation */}
          <div className="bg-white border rounded-lg shadow-sm p-4">
            <h2 className="font-semibold border-b pb-2 mb-3">Resource Status</h2>
            <div className="space-y-2">
              {resources.map(r => (
                <div key={r.id} className="flex items-center justify-between text-sm bg-gray-50 p-2 rounded">
                  <span className="font-medium">{r.name}</span>
                  <span className={`px-2 py-0.5 rounded text-xs font-medium ${r.status === 'available' ? 'bg-green-100 text-green-700' : r.status === 'assigned' ? 'bg-blue-100 text-blue-700' : 'bg-amber-100 text-amber-700'}`}>
                    {r.status}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Recent Alerts */}
          <div className="bg-white border rounded-lg shadow-sm p-4">
            <h2 className="font-semibold border-b pb-2 mb-3">Recent Alerts</h2>
            <div className="space-y-2 max-h-40 overflow-y-auto">
              {alerts.slice(0, 5).map(a => (
                <div key={a.id} className={`text-xs p-2 rounded border-l-4 ${a.severity === 'critical' ? 'border-red-500 bg-red-50' : a.severity === 'high' ? 'border-orange-500 bg-orange-50' : 'border-blue-500 bg-blue-50'}`}>
                  <span className="font-medium uppercase mr-2">{a.type}</span>
                  {a.message}
                </div>
              ))}
              {alerts.length === 0 && <div className="text-sm text-gray-500">No alerts</div>}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
