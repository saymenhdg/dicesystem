import React from 'react';

const STATUS_STYLES = {
  active: 'bg-green-100 text-green-700 border border-green-200',
  inactive: 'bg-gray-100 text-gray-700 border border-gray-200',
  suspended: 'bg-yellow-100 text-yellow-700 border border-yellow-200',
  banned: 'bg-red-100 text-red-700 border border-red-200',
  pending: 'bg-blue-50 text-blue-700 border border-blue-200',
  default: 'bg-gray-100 text-gray-700 border border-gray-200',
};

const StatusBadge = ({ status, label, className = '' }) => {
  const key = (status || '').toLowerCase();
  const base = STATUS_STYLES[key] || STATUS_STYLES.default;
  const text = label || (status ? status.charAt(0).toUpperCase() + status.slice(1) : 'Unknown');

  return (
    <span
      className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap ${base} ${className}`}
    >
      {text}
    </span>
  );
};

export default StatusBadge;
