import React, { useEffect, useState } from 'react';
import { api } from '../../services/api';
import { useWebSocket } from '../../hooks/useWebSocket';
import LoadingSpinner from '../../components/LoadingSpinner';
import AlertItem from '../../components/AlertItem';
import { useOutletContext } from 'react-router-dom';

export default function CitizenAlerts() {
  const { userZoneId } = useOutletContext();
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const { lastMessage } = useWebSocket('citizen');

  const loadData = async () => {
    const data = await api.fetchAlerts('citizen', 50);
    if (data) {
      setAlerts(data.filter(a => a.zone_id === null || a.zone_id === userZoneId));
    }
    setLoading(false);
  };

  useEffect(() => { loadData(); }, [userZoneId]);
  useEffect(() => { if(lastMessage) loadData(); }, [lastMessage]);

  if (loading) return <LoadingSpinner />;

  return (
    <div className="p-4 space-y-4">
      <h1 className="text-xl font-bold border-b pb-2">Safety Alerts</h1>
      <div className="space-y-3">
        {alerts.length > 0 ? (
          alerts.map(alert => <AlertItem key={alert.id} alert={alert} />)
        ) : (
          <p className="text-center text-gray-500 py-8">No current alerts in your area.</p>
        )}
      </div>
    </div>
  );
}
