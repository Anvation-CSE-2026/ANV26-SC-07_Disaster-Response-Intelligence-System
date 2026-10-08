import React, { useEffect, useState } from 'react';
import { api } from '../../services/api';
import { useWebSocket } from '../../hooks/useWebSocket';
import LoadingSpinner from '../../components/LoadingSpinner';
import AlertItem from '../../components/AlertItem';

export default function Alerts() {
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const { lastMessage } = useWebSocket('admin');
  
  const [formData, setFormData] = useState({
    type: 'system',
    severity: 'info',
    message: '',
    zone: '',
    target_role: 'all'
  });

  const loadData = async () => {
    const data = await api.fetchAlerts('all', 100);
    if (data) setAlerts(data);
    setLoading(false);
  };

  useEffect(() => { loadData(); }, []);
  useEffect(() => { if(lastMessage) loadData(); }, [lastMessage]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    await api.createAlert(formData);
    setFormData({ ...formData, message: '' });
    loadData();
  };

  const handleDelete = async (id) => {
    await api.deleteAlert(id);
    loadData();
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold">System Alerts</h1>

      <div className="bg-white border rounded-lg shadow-sm p-4">
        <h2 className="text-sm font-semibold border-b pb-2 mb-3">Send New Alert</h2>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <select 
              className="border rounded p-2 text-sm"
              value={formData.type} onChange={e => setFormData({...formData, type: e.target.value})}
            >
              <option value="system">System</option>
              <option value="weather">Weather</option>
              <option value="infrastructure">Infrastructure</option>
            </select>
            <select 
              className="border rounded p-2 text-sm"
              value={formData.severity} onChange={e => setFormData({...formData, severity: e.target.value})}
            >
              <option value="info">Info</option>
              <option value="warning">Warning</option>
              <option value="critical">Critical</option>
            </select>
            <select 
              className="border rounded p-2 text-sm"
              value={formData.target_role} onChange={e => setFormData({...formData, target_role: e.target.value})}
            >
              <option value="all">All Roles</option>
              <option value="admin">Admin Only</option>
              <option value="rescue_team">Rescue Teams</option>
              <option value="citizen">Citizens</option>
            </select>
            <input 
              type="text" placeholder="Zone ID (optional)" className="border rounded p-2 text-sm"
              value={formData.zone} onChange={e => setFormData({...formData, zone: e.target.value})}
            />
          </div>
          <div className="flex gap-2">
            <input 
              type="text" placeholder="Alert Message..." required className="border rounded p-2 text-sm flex-1"
              value={formData.message} onChange={e => setFormData({...formData, message: e.target.value})}
            />
            <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded text-sm font-medium hover:bg-blue-700">
              Send Alert
            </button>
          </div>
        </form>
      </div>

      <div className="space-y-3">
        {alerts.map(alert => (
          <AlertItem key={alert.id} alert={alert} onDelete={handleDelete} />
        ))}
      </div>
    </div>
  );
}
