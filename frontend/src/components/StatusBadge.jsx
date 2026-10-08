import React from 'react';

const levelColors = {
  critical: 'bg-red-100 text-red-800 border-red-200',
  high: 'bg-orange-100 text-orange-800 border-orange-200',
  medium: 'bg-amber-100 text-amber-800 border-amber-200',
  low: 'bg-green-100 text-green-800 border-green-200',
};

const typeColors = {
  green: 'bg-green-100 text-green-800',
  red: 'bg-red-100 text-red-800',
  amber: 'bg-amber-100 text-amber-800',
  blue: 'bg-blue-100 text-blue-800',
  default: 'bg-gray-100 text-gray-800',
};

export default function StatusBadge({ status, text, type = 'default', level }) {
  let colorClass;
  let label;

  if (level) {
    colorClass = levelColors[level.toLowerCase()] || typeColors.default;
    label = level.toUpperCase();
  } else {
    colorClass = typeColors[type] || typeColors.default;
    label = text || status;
  }

  return (
    <span className={`px-2 py-0.5 rounded text-xs font-medium border ${colorClass}`}>
      {label}
    </span>
  );
}
