import React, { useState } from 'react';
import { api } from '../../services/api';
import { useOutletContext } from 'react-router-dom';

export default function CitizenHelp() {
  const { zones, userZoneId } = useOutletContext();
  const [needType, setNeedType] = useState('rescue');
  const [description, setDescription] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const activeZone = zones?.find(z => z.id === userZoneId) || { name: 'Unknown Zone', latitude: 12.9256, longitude: 77.6762 };

  const handleSubmit = async (e) => {
    e.preventDefault();
    await api.submitHelpRequest({
      zone_id: userZoneId,
      type: needType,
      description: description,
      latitude: activeZone.latitude + (Math.random() * 0.01 - 0.005),
      longitude: activeZone.longitude + (Math.random() * 0.01 - 0.005),
      citizen_id: 1
    });
    setSubmitted(true);
  };

  if (submitted) {
    return (
      <div className="p-8 text-center space-y-4">
        <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
        </div>
        <h1 className="text-2xl font-bold text-gray-900">Request Received</h1>
        <p className="text-gray-600">Your help request has been submitted. The nearest available rescue team will be dispatched. Stay safe and await instructions.</p>
        <button onClick={() => { setSubmitted(false); setDescription(''); }} className="mt-8 text-blue-600 font-medium">Submit another request</button>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-6">
      <h1 className="text-xl font-bold border-b pb-2">Request Help</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">What do you need?</label>
          <select 
            required
            className="w-full rounded-md shadow-sm border border-gray-300 p-3 bg-white text-sm"
            value={needType}
            onChange={e => setNeedType(e.target.value)}
          >
            <option value="rescue">Rescue / Evacuation</option>
            <option value="medical">Medical Assistance</option>
            <option value="food_water">Food & Water</option>
            <option value="other">Other</option>
          </select>
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Details (optional)</label>
          <textarea 
            className="w-full rounded-md shadow-sm border border-gray-300 p-3 bg-white h-28 text-sm"
            placeholder="Number of people, specific needs, medical conditions..."
            value={description}
            onChange={e => setDescription(e.target.value)}
          />
        </div>

        <div className="bg-blue-50 p-3 rounded text-sm text-blue-800 border border-blue-100">
          📍 Your current selected location ({activeZone.name}) will be sent with this request.
        </div>

        <button type="submit" className="w-full bg-red-600 text-white font-bold py-4 rounded-lg shadow-sm text-lg mt-4 hover:bg-red-700 active:scale-[0.98] transition-transform">
          SUBMIT HELP REQUEST
        </button>
      </form>
    </div>
  );
}
