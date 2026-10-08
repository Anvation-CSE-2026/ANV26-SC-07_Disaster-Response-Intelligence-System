import React, { useEffect, useState } from 'react';
import { api } from '../../services/api';
import LoadingSpinner from '../../components/LoadingSpinner';

export default function Reports() {
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      const data = await api.fetchDashboardSummary();
      if (data) setSummary(data);
      setLoading(false);
    };
    loadData();
  }, []);

  if (loading || !summary) return <LoadingSpinner />;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex justify-between items-center border-b pb-4">
        <h1 className="text-2xl font-bold">Situation Report</h1>
        <button onClick={() => window.print()} className="bg-gray-100 px-3 py-1 text-sm border rounded hover:bg-gray-200">
          Print
        </button>
      </div>

      <div className="bg-white border rounded-lg p-8 shadow-sm space-y-8" id="report-content">
        <div className="text-center space-y-2 border-b pb-6">
          <h2 className="text-2xl font-bold uppercase tracking-widest text-gray-900">DRIS Situation Report</h2>
          <p className="text-gray-500">Date: {new Date().toLocaleDateString()} | Time: {new Date().toLocaleTimeString()}</p>
          <p className="text-sm font-semibold text-red-600 bg-red-50 inline-block px-2 py-1 rounded">Prototype Report — Simulated Data</p>
        </div>

        <div className="grid grid-cols-2 gap-8">
          <div>
            <h3 className="font-bold text-gray-700 border-b pb-1 mb-3">Disaster Overview</h3>
            <ul className="space-y-2 text-sm">
              <li><span className="font-medium">Type:</span> <span className="uppercase">{summary.disaster_type}</span></li>
              <li><span className="font-medium">Affected Zones:</span> {summary.affected_zones}</li>
              <li><span className="font-medium">Critical Zones:</span> {summary.critical_zones}</li>
              <li><span className="font-medium">System Status:</span> Operational</li>
            </ul>
          </div>
          <div>
            <h3 className="font-bold text-gray-700 border-b pb-1 mb-3">Resource Status</h3>
            <ul className="space-y-2 text-sm">
              <li><span className="font-medium">Available Teams:</span> {summary.available_teams}</li>
              <li><span className="font-medium">Available Ambulances:</span> {summary.available_ambulances}</li>
              <li><span className="font-medium">Available Boats:</span> {summary.available_boats}</li>
              <li><span className="font-medium">Blocked Roads:</span> {summary.roads_blocked}</li>
            </ul>
          </div>
        </div>

        <div>
          <h3 className="font-bold text-gray-700 border-b pb-1 mb-3">Citizen Impact</h3>
          <p className="text-sm">Total active help requests: <span className="font-bold text-red-600">{summary.active_help_requests}</span></p>
        </div>

        <div className="pt-8 border-t text-center text-xs text-gray-400">
          Generated automatically by Disaster Response Intelligence System (DRIS)
        </div>
      </div>
    </div>
  );
}
