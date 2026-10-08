import React from 'react';
import { AlertCircle, Info, AlertTriangle } from 'lucide-react';
import StatusBadge from './StatusBadge';

export default function AlertItem({ alert, onDelete }) {
  const getSeverityConfig = (severity) => {
    switch(severity?.toLowerCase()) {
      case 'critical':
        return { icon: <AlertCircle className="w-5 h-5 text-red-600" />, bg: 'bg-red-50 border-red-100', textType: 'red' };
      case 'warning':
        return { icon: <AlertTriangle className="w-5 h-5 text-amber-600" />, bg: 'bg-amber-50 border-amber-100', textType: 'amber' };
      default:
        return { icon: <Info className="w-5 h-5 text-blue-600" />, bg: 'bg-blue-50 border-blue-100', textType: 'blue' };
    }
  };

  const config = getSeverityConfig(alert.severity);

  return (
    <div className={`p-3 rounded-md border flex gap-3 ${config.bg} relative group`}>
      <div className="flex-shrink-0 mt-0.5">
        {config.icon}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex justify-between items-start mb-1">
          <StatusBadge status={alert.severity?.toUpperCase() || 'INFO'} type={config.textType} />
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-500 whitespace-nowrap ml-2">
              {(() => {
                let raw = alert.created_at || alert.timestamp;
                if (!raw) return '';
                if (!String(raw).endsWith('Z')) raw = raw + 'Z';
                const d = new Date(raw);
                if (isNaN(d)) return '';
                return d.toLocaleDateString([], { day: '2-digit', month: 'short' }) + ' ' + d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
              })()}
            </span>
            {onDelete && (
              <button 
                onClick={() => onDelete(alert.id)}
                className="opacity-0 group-hover:opacity-100 transition-opacity text-gray-400 hover:text-red-600"
                title="Delete Alert"
              >
                ✕
              </button>
            )}
          </div>
        </div>
        <p className="text-sm text-gray-800 break-words">{alert.message}</p>
        {(alert.zone_name || alert.type) && (
          <div className="mt-1 flex gap-2 text-xs text-gray-500">
            {alert.type && <span>{alert.type}</span>}
            {alert.type && alert.zone_name && <span>•</span>}
            {alert.zone_name && <span>{alert.zone_name}</span>}
          </div>
        )}
      </div>
    </div>
  );
}
