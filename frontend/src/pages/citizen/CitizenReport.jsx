import React, { useState } from 'react';
import { api } from '../../services/api';
import { useOutletContext } from 'react-router-dom';

export default function CitizenReport() {
  const { zones, userZoneId } = useOutletContext();
  const [incidentType, setIncidentType] = useState('flooded_road');
  const [description, setDescription] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const activeZone = zones?.find(z => z.id === userZoneId) || { name: 'Unknown Zone', latitude: 12.9256, longitude: 77.6762 };

  const handleSubmit = async (e) => {
    e.preventDefault();
    await api.reportIncident({
      name: 'Anonymous Citizen',
      phone: null,
      zone_id: userZoneId,
      latitude: activeZone.latitude,
      longitude: activeZone.longitude,
      status: `${incidentType}: ${description || 'No additional details'}`
    });
    setSubmitted(true);
  };

  if (submitted) {
    return (
      <div className="p-8 text-center space-y-4">
        <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
        </div>
        <h1 className="text-2xl font-bold text-gray-900">Report Submitted</h1>
        <p className="text-gray-600">Thank you. Your report helps update the live situation map and routes for others.</p>
        <button onClick={() => { setSubmitted(false); setDescription(''); }} className="mt-8 text-blue-600 font-medium">Submit another report</button>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-6">
      <h1 className="text-xl font-bold border-b pb-2">Report Incident</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Incident Type</label>
          <select 
            required
            className="w-full rounded-md shadow-sm border border-gray-300 p-3 bg-white text-sm"
            value={incidentType}
            onChange={e => setIncidentType(e.target.value)}
          >
            <option value="flooded_road">Flooded Road</option>
            <option value="rising_water">Rapidly Rising Water</option>
            <option value="blocked_road">Blocked Road / Debris</option>
            <option value="fire">Fire / Electrical Hazard</option>
            <option value="other">Other</option>
          </select>
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Description (optional)</label>
          <textarea 
            className="w-full rounded-md shadow-sm border border-gray-300 p-3 bg-white h-28 text-sm"
            placeholder="Provide additional details..."
            value={description}
            onChange={e => setDescription(e.target.value)}
          />
        </div>

        <div className="bg-blue-50 p-3 rounded text-sm text-blue-800 border border-blue-100">
          📍 Your current selected location ({activeZone.name}) will be included in this report.
        </div>

        <button type="submit" className="w-full bg-amber-500 text-white font-bold py-4 rounded-lg shadow-sm text-lg mt-4 hover:bg-amber-600 active:scale-[0.98] transition-transform">
          SUBMIT REPORT
        </button>
      </form>
    </div>
  );
}
