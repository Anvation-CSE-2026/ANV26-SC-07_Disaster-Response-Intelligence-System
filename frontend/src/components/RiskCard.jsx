import React from 'react';
import { TrendingUp, TrendingDown, Minus, AlertTriangle } from 'lucide-react';
import StatusBadge from './StatusBadge';

export default function RiskCard({ zone }) {
  const getRiskColor = (level) => {
    switch(level?.toLowerCase()) {
      case 'low': return 'green';
      case 'medium': return 'amber';
      case 'high': return 'amber';
      case 'critical': return 'red';
      default: return 'default';
    }
  };

  const getTrendIcon = (trend) => {
    if (trend === 'rapid_increase') return <AlertTriangle className="w-4 h-4 text-red-500" />;
    if (trend === 'increasing') return <TrendingUp className="w-4 h-4 text-red-500" />;
    if (trend === 'decreasing') return <TrendingDown className="w-4 h-4 text-green-500" />;
    return <Minus className="w-4 h-4 text-gray-400" />;
  };

  const getTrendLabel = (trend) => {
    switch(trend) {
      case 'rapid_increase': return '⬆ Rapid';
      case 'increasing': return '↑ Rising';
      case 'decreasing': return '↓ Falling';
      default: return '→ Stable';
    }
  };

  return (
    <div className="bg-white border rounded-lg p-4 shadow-sm flex flex-col gap-2">
      <div className="flex justify-between items-start">
        <h3 className="font-semibold text-gray-900 truncate text-sm">{zone.name}</h3>
        <StatusBadge status={zone.risk_level?.toUpperCase()} type={getRiskColor(zone.risk_level)} />
      </div>
      
      <div className="flex items-baseline gap-2 mt-1">
        <span className="text-3xl font-bold">{Math.round(zone.current_risk_score || 0)}</span>
        <span className="text-sm text-gray-500">risk</span>
        <div className="ml-auto flex items-center gap-1">
          {getTrendIcon(zone.trend)}
          <span className="text-xs text-gray-500">{getTrendLabel(zone.trend)}</span>
        </div>
      </div>

      <div className="mt-1 grid grid-cols-3 gap-2 text-xs border-t pt-2 text-gray-600">
        <div>Pred: <span className="font-semibold">{Math.round(zone.predicted_risk_30 || 0)}</span></div>
        <div>Help: <span className="font-semibold">{zone.help_request_count || 0}</span></div>
        <div className="capitalize">{zone.response_status || 'monitoring'}</div>
      </div>
    </div>
  );
}
