import React, { useEffect, useState } from 'react';
import { api } from '../../services/api';
import { useWebSocket } from '../../hooks/useWebSocket';
import LoadingSpinner from '../../components/LoadingSpinner';
import AlertItem from '../../components/AlertItem';

export default function RescueAlerts() {
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const { lastMessage } = useWebSocket('rescue_team');

  const loadData = async () => {
    const data = await api.fetchAlerts('rescue_team', 50);
    if (data) setAlerts(data);
    setLoading(false);
  };

  useEffect(() => { loadData(); }, []);
  useEffect(() => { if(lastMessage) loadData(); }, [lastMessage]);

  if (loading) return <LoadingSpinner />;

  return (
    <div className="p-4 space-y-4">
      <h1 className="text-xl font-bold border-b pb-2">Team Alerts</h1>
      <div className="space-y-3">
        {alerts.length > 0 ? (
          alerts.map(alert => <AlertItem key={alert.id} alert={alert} />)
        ) : (
          <p className="text-center text-gray-500 py-8">No alerts for rescue teams.</p>
        )}
      </div>
    </div>
  );
}
