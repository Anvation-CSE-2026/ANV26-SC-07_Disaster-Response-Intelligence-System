import React, { useEffect } from 'react';
import { MapContainer, TileLayer, CircleMarker, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix Leaflet default icon issue
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

const createColoredIcon = (color) => {
  return new L.Icon({
    iconUrl: `https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-${color}.png`,
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41]
  });
};

const icons = {
  rescue_team: createColoredIcon('blue'),
  ambulance: createColoredIcon('red'),
  boat: createColoredIcon('violet'),
  shelter: createColoredIcon('green'),
  hospital: createColoredIcon('grey')
};

function MapUpdater({ center, zoom }) {
  const map = useMap();
  useEffect(() => {
    if (center) map.setView(center, zoom);
  }, [center, zoom, map]);
  return null;
}

const getRiskColor = (level) => {
  switch(level?.toLowerCase()) {
    case 'low': return '#22c55e';
    case 'medium': return '#eab308';
    case 'high': return '#f97316';
    case 'critical': return '#ef4444';
    default: return '#3b82f6';
  }
};

export default function MapView({ 
  center = [14.5, 76.0], 
  zoom = 7, 
  zones = [], 
  resources = [], 
  shelters = [], 
  roads = [], 
  routes = [],
  helpRequests = [],
  onZoneClick 
}) {
  return (
    <MapContainer center={center} zoom={zoom} style={{ height: '100%', width: '100%' }}>
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <MapUpdater center={center} zoom={zoom} />
      
      {/* Risk Zones */}
      {zones.map((zone) => (
        <CircleMarker
          key={`zone-${zone.id}`}
          center={[zone.latitude, zone.longitude]}
          radius={20}
          pathOptions={{ 
            color: getRiskColor(zone.risk_level),
            fillColor: getRiskColor(zone.risk_level),
            fillOpacity: 0.4
          }}
          eventHandlers={{
            click: () => onZoneClick && onZoneClick(zone)
          }}
        >
          <Popup>
            <div className="p-1 text-sm">
              <h3 className="font-bold">{zone.name}</h3>
              <p>Risk: {Math.round(zone.current_risk_score)} ({zone.risk_level})</p>
              <p>Predicted (30m): {Math.round(zone.predicted_risk_30 || 0)}</p>
              <p>Trend: {zone.trend}</p>
              <p>Help Requests: {zone.help_request_count}</p>
            </div>
          </Popup>
        </CircleMarker>
      ))}

      {/* Resources */}
      {resources.filter(r => r.latitude && r.longitude).map(resource => (
        <Marker 
          key={`res-${resource.id}`} 
          position={[resource.latitude, resource.longitude]}
          icon={icons[resource.type] || createColoredIcon('blue')}
        >
          <Popup>
            <div className="font-semibold">{resource.name}</div>
            <div className="text-xs">{resource.type.replace('_', ' ')}</div>
            <div className="text-xs text-gray-500">{resource.status}</div>
          </Popup>
        </Marker>
      ))}

      {/* Shelters */}
      {shelters.map(shelter => (
        <Marker
          key={`sh-${shelter.id}`}
          position={[shelter.latitude, shelter.longitude]}
          icon={icons.shelter}
        >
          <Popup>
            <div className="font-semibold">{shelter.name}</div>
            <div className="text-xs">Capacity: {shelter.current_occupancy}/{shelter.capacity}</div>
            <div className="text-xs">{shelter.status}</div>
          </Popup>
        </Marker>
      ))}

      {/* Blocked Roads */}
      {roads.filter(r => r.status !== 'open').map(road => (
        <Polyline 
          key={`rd-${road.id}`} 
          positions={[[road.from_lat, road.from_lng], [road.to_lat, road.to_lng]]}
          color="red"
          weight={4}
          dashArray="10, 10"
        >
          <Popup>
            <div className="font-semibold text-red-600">{road.name}</div>
            <div className="text-xs">Status: {road.status}</div>
          </Popup>
        </Polyline>
      ))}

      {/* Routes */}
      {routes.map((route, idx) => (
        <Polyline
          key={`rt-${idx}`}
          positions={route.coordinates ? route.coordinates.map(c => [c[1], c[0]]) : []}
          color="#3b82f6"
          weight={4}
        />
      ))}

      {/* Help Requests */}
      {(helpRequests || []).map(req => (
        <CircleMarker
          key={`hr-${req.id}`}
          center={[req.latitude, req.longitude]}
          radius={6}
          pathOptions={{ 
            color: '#ef4444', 
            fillColor: '#ef4444', 
            fillOpacity: 1,
            weight: 2
          }}
        >
          <Popup>
            <div className="font-bold text-red-600">SOS: {req.type.replace('_', ' ')}</div>
            <div className="text-xs">{req.description || 'No description provided'}</div>
            <div className="text-xs font-bold mt-1 uppercase text-gray-500">Status: {req.status}</div>
          </Popup>
        </CircleMarker>
      ))}
    </MapContainer>
  );
}
