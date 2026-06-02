// src/components/ClientStatsWidget.jsx
import { useState, useEffect } from 'react';
import api from '../api/axios';

export default function ClientStatsWidget() {
  const [stats, setStats] = useState(null);

  useEffect(() => {
    api.get('/client-stats').then(r => setStats(r.data)).catch(() => {});
  }, []);

  if (!stats) return null;

  const items = [
    { label: 'Publicados',  value: stats.total_jobs,     icon: '📋', color: 'text-blue-600',   bg: 'bg-blue-50' },
    { label: 'Activos',     value: stats.active_jobs,    icon: '🔧', color: 'text-orange-600', bg: 'bg-orange-50' },
    { label: 'Completados', value: stats.completed_jobs, icon: '✅', color: 'text-green-600',  bg: 'bg-green-50' },
    {
      label: 'Total pagado',
      value: `$${Number(stats.total_spent).toLocaleString('es-MX', { minimumFractionDigits: 0 })}`,
      icon: '💰',
      color: 'text-emerald-600',
      bg: 'bg-emerald-50',
    },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-2">
      {items.map(item => (
        <div key={item.label} className={`rounded-xl ${item.bg} p-4 flex flex-col gap-1`}>
          <span className="text-xl">{item.icon}</span>
          <span className={`text-lg font-black ${item.color}`}>{item.value}</span>
          <span className="text-xs text-gray-500 font-medium">{item.label}</span>
        </div>
      ))}
    </div>
  );
}
