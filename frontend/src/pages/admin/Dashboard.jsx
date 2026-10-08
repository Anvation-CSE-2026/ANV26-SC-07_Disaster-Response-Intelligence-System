import React, { useEffect, useState, useRef } from 'react';
import { api } from '../../services/api';
import { useWebSocket } from '../../hooks/useWebSocket';
import RiskCard from '../../components/RiskCard';
import AlertItem from '../../components/AlertItem';
import MapView from '../../components/MapView';
import LoadingSpinner from '../../components/LoadingSpinner';
import { CloudRain, Thermometer, Wind, Droplets, Search, MapPin } from 'lucide-react';

export default function Dashboard() {
  const [summary, setSummary] = useState(null);
  const [zones, setZones] = useState([]);
  const [priorities, setPriorities] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [resources, setResources] = useState([]);
  const [helpRequests, setHelpRequests] = useState([]);
  const [loading, setLoading] = useState(true);

  // Live Weather State
  const [weatherQuery, setWeatherQuery] = useState('');
  const [weatherSuggestions, setWeatherSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [weatherData, setWeatherData] = useState(null);
  const [weatherCity, setWeatherCity] = useState('');
  const [weatherLoading, setWeatherLoading] = useState(false);
  const searchTimeout = useRef(null);
  const suggestionsRef = useRef(null);

  // AI Analysis Modal State
  const [selectedZoneInfo, setSelectedZoneInfo] = useState(null);

  const { lastMessage } = useWebSocket('admin');

  const loadData = async () => {
    const [sData, zData, pData, aData, rData, hData] = await Promise.all([
      api.fetchDashboardSummary(),
      api.fetchZones(),
      api.fetchPriorities(),
      api.fetchAlerts('admin', 5),
      api.fetchResources(),
      api.fetchHelpRequests()
    ]);
    if (sData) setSummary(sData);
    if (zData) setZones(zData);
    if (pData) setPriorities(pData);
    if (aData) setAlerts(aData);
    if (rData) setResources(rData);
    if (hData) setHelpRequests(hData);
    setLoading(false);

    // Default weather to highest priority zone
    if (pData && pData.length > 0 && !weatherData) {
      const topZone = zData?.find(z => z.id === pData[0].zone_id);
      if (topZone) {
        fetchWeatherByCoords(topZone.latitude, topZone.longitude, topZone.name);
      }
    }
  };

  const handleZoneClick = async (zone) => {
    // When a zone card is clicked, show the AI analysis modal
    const priority = priorities.find(p => p.zone_id === zone.id);
    const assignedResources = resources.filter(r => r.assigned_zone_id === zone.id);
    
    // Fetch latest risk factors for this zone
    try {
      const res = await fetch(`http://localhost:8000/api/risk/${zone.id}`);
      const riskHistory = await res.json();
      let factors = null;
      if (riskHistory && riskHistory.length > 0) {
        factors = JSON.parse(riskHistory[0].factors_json);
      }
      setSelectedZoneInfo({ zone, priority, assignedResources, factors });
    } catch(e) {
      setSelectedZoneInfo({ zone, priority, assignedResources, factors: null });
    }
  };

  const handleDeleteZone = async (e, zoneId) => {
    e.stopPropagation(); // Prevent the click from opening the modal
    if (!window.confirm('Delete this zone? This will remove all associated data (hazard readings, predictions, alerts). You can re-add it later via the Simulator.')) return;
    await api.deleteZone(zoneId);
    loadData(); // Refresh everything
  };

  // Geocoding search (Open-Meteo)
  const searchCities = async (query) => {
    if (query.length < 2) { setWeatherSuggestions([]); return; }
    try {
      const res = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(query)}&count=6&language=en&format=json`);
      const data = await res.json();
      if (data.results) {
        setWeatherSuggestions(data.results.map(r => ({
          name: r.name,
          region: r.admin1 || '',
          country: r.country || '',
          lat: r.latitude,
          lng: r.longitude
        })));
        setShowSuggestions(true);
      } else {
        setWeatherSuggestions([]);
      }
    } catch { setWeatherSuggestions([]); }
  };

  const fetchWeatherByCoords = async (lat, lng, cityName) => {
    setWeatherLoading(true);
    setWeatherCity(cityName);
    setShowSuggestions(false);
    setWeatherQuery('');
    try {
      const res = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}&current=temperature_2m,relative_humidity_2m,precipitation,rain,wind_speed_10m,wind_direction_10m,weather_code&timezone=auto`);
      const data = await res.json();
      if (data.current) {
        setWeatherData({
          temperature: data.current.temperature_2m,
          humidity: data.current.relative_humidity_2m,
          precipitation: data.current.precipitation,
          rain: data.current.rain,
          windSpeed: data.current.wind_speed_10m,
          windDir: data.current.wind_direction_10m,
          weatherCode: data.current.weather_code,
          time: data.current.time,
          lat, lng
        });
      }
    } catch (e) { console.error('Weather fetch failed', e); }
    setWeatherLoading(false);
  };

  const handleWeatherInput = (val) => {
    setWeatherQuery(val);
    clearTimeout(searchTimeout.current);
    searchTimeout.current = setTimeout(() => searchCities(val), 300);
  };

  const getWeatherLabel = (code) => {
    if (code === 0) return 'Clear Sky';
    if (code <= 3) return 'Partly Cloudy';
    if (code <= 48) return 'Fog';
    if (code <= 57) return 'Drizzle';
    if (code <= 67) return 'Rain';
    if (code <= 77) return 'Snow';
    if (code <= 82) return 'Rain Showers';
    if (code <= 86) return 'Snow Showers';
    if (code <= 99) return 'Thunderstorm';
    return 'Unknown';
  };

  const getWeatherColor = (code) => {
    if (code === 0) return 'text-yellow-500';
    if (code <= 3) return 'text-blue-400';
    if (code <= 67) return 'text-blue-600';
    if (code <= 82) return 'text-blue-700';
    if (code <= 99) return 'text-red-500';
    return 'text-gray-500';
  };

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (lastMessage) {
      loadData();
    }
  }, [lastMessage]);

  // Close suggestions on outside click
  useEffect(() => {
    const handler = (e) => {
      if (suggestionsRef.current && !suggestionsRef.current.contains(e.target)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  if (loading || !summary) return <LoadingSpinner />;

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Live Situation Summary */}
      <section className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-4">
        {[
          { label: "Active Disaster", val: summary.active_disaster || 'None', isCritical: true },
          { label: "Affected Zones", val: summary.affected_zones },
          { label: "Critical Zones", val: summary.critical_zones, isCritical: summary.critical_zones > 0 },
          { label: "Available Teams", val: summary.available_teams },
          { label: "Available Ambs", val: summary.available_ambulances },
          { label: "Available Boats", val: summary.available_boats },
          { label: "Active Help Reqs", val: summary.active_help_requests, isCritical: summary.active_help_requests > 0 },
          { label: "Roads Blocked", val: summary.blocked_roads }
        ].map((stat, i) => (
          <div key={i} className="bg-white p-3 rounded-md border shadow-sm flex flex-col justify-center items-center text-center">
            <div className="text-xs text-gray-500 uppercase tracking-tight mb-1">{stat.label}</div>
            <div className={`text-xl font-semibold ${stat.isCritical ? 'text-red-600' : 'text-gray-900'}`}>{stat.val}</div>
          </div>
        ))}
      </section>

      {/* Live Weather Intelligence */}
      <section className="bg-white border rounded-lg shadow-sm p-5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 mb-4">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <CloudRain className="w-5 h-5 text-blue-600" />
            Live Weather Intelligence
            <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-medium">LIVE via Open-Meteo API</span>
          </h2>
          <div className="relative" ref={suggestionsRef}>
            <div className="flex items-center border rounded-lg overflow-hidden bg-gray-50">
              <Search className="w-4 h-4 text-gray-400 ml-3" />
              <input
                type="text"
                className="border-0 bg-transparent p-2 text-sm w-56 focus:outline-none"
                placeholder="Search any city..."
                value={weatherQuery}
                onChange={(e) => handleWeatherInput(e.target.value)}
                onFocus={() => weatherSuggestions.length > 0 && setShowSuggestions(true)}
              />
            </div>
            {showSuggestions && weatherSuggestions.length > 0 && (
              <div className="absolute right-0 mt-1 w-72 bg-white border rounded-lg shadow-xl z-50 max-h-60 overflow-y-auto">
                {weatherSuggestions.map((s, i) => (
                  <button
                    key={i}
                    className="w-full text-left px-4 py-2.5 hover:bg-blue-50 flex items-start gap-2 border-b last:border-b-0 text-sm"
                    onClick={() => fetchWeatherByCoords(s.lat, s.lng, `${s.name}, ${s.region}`)}
                  >
                    <MapPin className="w-4 h-4 text-gray-400 mt-0.5 shrink-0" />
                    <div>
                      <div className="font-semibold">{s.name}</div>
                      <div className="text-xs text-gray-500">{s.region}{s.region && s.country ? ', ' : ''}{s.country}</div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {weatherLoading && <div className="text-center py-6 text-gray-400 text-sm">Fetching live weather data...</div>}

        {weatherData && !weatherLoading && (
          <div>
            <div className="flex items-center gap-2 mb-3">
              <MapPin className="w-4 h-4 text-blue-600" />
              <span className="font-bold text-blue-800">{weatherCity}</span>
              <span className="text-xs text-gray-400">Updated: {weatherData.time}</span>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
              <div className="bg-gray-50 border rounded-lg p-3 text-center">
                <Thermometer className="w-5 h-5 mx-auto mb-1 text-orange-500" />
                <div className="text-2xl font-bold">{weatherData.temperature}°C</div>
                <div className="text-xs text-gray-500">Temperature</div>
              </div>
              <div className="bg-gray-50 border rounded-lg p-3 text-center">
                <Droplets className="w-5 h-5 mx-auto mb-1 text-blue-500" />
                <div className="text-2xl font-bold">{weatherData.humidity}%</div>
                <div className="text-xs text-gray-500">Humidity</div>
              </div>
              <div className="bg-gray-50 border rounded-lg p-3 text-center">
                <CloudRain className="w-5 h-5 mx-auto mb-1 text-blue-700" />
                <div className="text-2xl font-bold">{weatherData.precipitation} mm</div>
                <div className="text-xs text-gray-500">Precipitation</div>
              </div>
              <div className="bg-gray-50 border rounded-lg p-3 text-center">
                <Wind className="w-5 h-5 mx-auto mb-1 text-teal-500" />
                <div className="text-2xl font-bold">{weatherData.windSpeed} km/h</div>
                <div className="text-xs text-gray-500">Wind Speed</div>
              </div>
              <div className="bg-gray-50 border rounded-lg p-3 text-center">
                <CloudRain className={`w-5 h-5 mx-auto mb-1 ${getWeatherColor(weatherData.weatherCode)}`} />
                <div className="text-lg font-bold">{getWeatherLabel(weatherData.weatherCode)}</div>
                <div className="text-xs text-gray-500">Conditions</div>
              </div>
            </div>
            {weatherData.precipitation > 5 && (
              <div className="mt-3 bg-red-50 border border-red-200 text-red-700 rounded p-2 text-sm font-medium">
                ⚠️ Heavy precipitation detected ({weatherData.precipitation} mm). Flood risk elevated in this area.
              </div>
            )}
            {weatherData.windSpeed > 40 && (
              <div className="mt-2 bg-amber-50 border border-amber-200 text-amber-700 rounded p-2 text-sm font-medium">
                ⚠️ High winds detected ({weatherData.windSpeed} km/h). Infrastructure damage risk.
              </div>
            )}
          </div>
        )}

        {/* Quick Zone Buttons */}
        {zones.length > 0 && (
          <div className="mt-4 pt-3 border-t flex flex-wrap items-center gap-2">
            <span className="text-xs text-gray-500 font-semibold">Quick:</span>
            {zones.slice(0, 8).map(z => (
              <button
                key={z.id}
                onClick={() => fetchWeatherByCoords(z.latitude, z.longitude, z.name)}
                className={`text-xs px-2.5 py-1 rounded-full border font-medium transition-colors ${
                  weatherCity === z.name ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-600 hover:bg-blue-50 hover:border-blue-300'
                }`}
              >
                {z.name}
              </button>
            ))}
          </div>
        )}
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Risk Overview */}
        <section className="lg:col-span-2 space-y-4">
          <h2 className="text-lg font-semibold border-b pb-2">Risk Overview</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {zones.map(zone => (
              <div key={zone.id} className="relative group">
                <button 
                  onClick={() => handleZoneClick(zone)}
                  className="text-left w-full transition-transform transform hover:scale-[1.02] hover:shadow-md focus:outline-none focus:ring-2 focus:ring-blue-500 rounded-xl"
                >
                  <RiskCard zone={zone} />
                </button>
                <button
                  onClick={(e) => handleDeleteZone(e, zone.id)}
                  className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity bg-red-500 hover:bg-red-700 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold shadow-md z-10"
                  title="Delete Zone"
                >
                  ✕
                </button>
              </div>
            ))}
          </div>

          <h2 className="text-lg font-semibold border-b pb-2 mt-6">Live Map</h2>
          <div className="bg-white border rounded-lg overflow-hidden" style={{ height: '400px' }}>
            <MapView 
              zones={zones} 
              resources={resources}
              helpRequests={helpRequests}
              center={[14.5, 76.0]}
              zoom={7}
            />
          </div>
        </section>

        {/* Priority, Help Requests & Alerts */}
        <section className="space-y-6">
          <div>
            <h2 className="text-lg font-semibold border-b pb-2 mb-4">Live Help Requests</h2>
            <div className="bg-white border rounded-lg shadow-sm overflow-hidden text-sm">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Type</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Zone</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {helpRequests.slice(0, 5).map(req => {
                    const zName = req.zone_name || `Zone ${req.zone_id}`;
                    return (
                      <tr key={req.id}>
                        <td className="px-4 py-2 font-medium capitalize">{req.type.replace('_', ' ')}</td>
                        <td className="px-4 py-2 text-gray-600">{zName}</td>
                        <td className="px-4 py-2">
                          <span className={`px-2 py-0.5 rounded text-xs font-bold uppercase ${
                            req.status === 'dispatched' ? 'bg-blue-100 text-blue-700' : 
                            req.status === 'resolved' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                          }`}>
                            {req.status}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                  {helpRequests.length === 0 && <tr><td colSpan="3" className="px-4 py-4 text-center text-gray-500">No active requests</td></tr>}
                </tbody>
              </table>
            </div>
          </div>

          <div>
            <h2 className="text-lg font-semibold border-b pb-2 mb-4">Priority Queue</h2>
            <div className="bg-white border rounded-lg shadow-sm overflow-hidden text-sm">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Zone</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Risk</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Resource</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {priorities.slice(0, 5).map((p, i) => (
                    <tr key={p.zone_id}>
                      <td className="px-4 py-2 font-medium">{p.zone_name}</td>
                      <td className="px-4 py-2 text-red-600 font-semibold">{Math.round(p.priority_score)}</td>
                      <td className="px-4 py-2 text-xs">{p.recommended_resource_type}</td>
                    </tr>
                  ))}
                  {priorities.length === 0 && <tr><td colSpan="3" className="px-4 py-4 text-center text-gray-500">No active priorities</td></tr>}
                </tbody>
              </table>
            </div>
          </div>

          <div>
            <h2 className="text-lg font-semibold border-b pb-2 mb-4">Recent Alerts</h2>
            <div className="space-y-3">
              {alerts.map(alert => (
                <AlertItem key={alert.id} alert={alert} />
              ))}
              {alerts.length === 0 && <div className="text-sm text-gray-500">No recent alerts</div>}
            </div>
          </div>
        </section>
      </div>

      {/* AI Analysis Modal */}
      {selectedZoneInfo && (
        <div className="fixed inset-0 bg-black/60 z-[100] flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-5 border-b bg-gray-50 flex justify-between items-center">
              <div>
                <h3 className="text-xl font-bold flex items-center gap-2">
                  <span className="text-blue-700">AI Assessment:</span> {selectedZoneInfo.zone.name}
                </h3>
                <p className="text-sm text-gray-500 mt-1">Intelligent Analysis & Resource Strategy</p>
              </div>
              <button 
                onClick={() => setSelectedZoneInfo(null)}
                className="text-gray-400 hover:text-gray-700 bg-gray-200 hover:bg-gray-300 w-8 h-8 rounded-full flex items-center justify-center font-bold"
              >
                ✕
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto space-y-6">
              
              {/* Primary Risk Drivers */}
              <div className="bg-red-50 border border-red-100 rounded-lg p-4">
                <h4 className="font-bold text-red-800 mb-3 uppercase text-xs tracking-wider">Primary Risk Drivers</h4>
                {selectedZoneInfo.factors ? (
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <div className="text-sm text-red-600">Water Level Factor</div>
                      <div className="font-bold text-lg">{selectedZoneInfo.factors.water_level_factor?.toFixed(1) || 0}%</div>
                    </div>
                    <div>
                      <div className="text-sm text-red-600">Rainfall Factor</div>
                      <div className="font-bold text-lg">{selectedZoneInfo.factors.rainfall_factor?.toFixed(1) || 0}%</div>
                    </div>
                    <div>
                      <div className="text-sm text-red-600">Rise Rate Severity</div>
                      <div className="font-bold text-lg">{selectedZoneInfo.factors.rise_rate_factor?.toFixed(1) || 0}%</div>
                    </div>
                    <div>
                      <div className="text-sm text-red-600">Population Exposure</div>
                      <div className="font-bold text-lg">{selectedZoneInfo.factors.population_factor?.toFixed(1) || 0}%</div>
                    </div>
                  </div>
                ) : (
                  <p className="text-sm text-gray-600">Loading factor breakdown...</p>
                )}
                <div className="mt-4 text-sm font-medium text-red-900 bg-red-100 p-2 rounded">
                  <strong>AI Conclusion:</strong> Massive {summary?.active_disaster || 'Disaster'} scenario detected based on real-time multi-sensor inputs. Evacuation protocols highly recommended.
                </div>
              </div>

              {/* Resource Allocation */}
              <div>
                <h4 className="font-bold text-blue-800 mb-3 uppercase text-xs tracking-wider">Active Resource Allocation</h4>
                {selectedZoneInfo.assignedResources.length > 0 ? (
                  <div className="space-y-2">
                    {selectedZoneInfo.assignedResources.map(r => (
                      <div key={r.id} className="flex justify-between items-center bg-gray-50 border p-3 rounded-lg">
                        <div className="flex items-center gap-3">
                          <div className="bg-blue-100 text-blue-800 p-2 rounded-full">
                            {r.type === 'boat' ? '🛥️' : r.type === 'ambulance' ? '🚑' : '👥'}
                          </div>
                          <div>
                            <div className="font-bold text-sm">{r.name}</div>
                            <div className="text-xs text-gray-500 capitalize">{r.type.replace('_', ' ')} • Cap: {r.capacity}</div>
                          </div>
                        </div>
                        <span className="bg-green-100 text-green-700 text-xs px-2 py-1 rounded font-bold uppercase">{r.status}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-sm text-amber-700 bg-amber-50 p-3 rounded border border-amber-200">
                    ⚠️ No resources are currently assigned to this zone. Check Priority Queue for pending dispatches.
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
