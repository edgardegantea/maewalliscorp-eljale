// src/components/ExpertStatsWidget.jsx
import { useState, useEffect } from 'react';
import api from '../api/axios';
import StarRating from './StarRating';
import { SkeletonStat } from './Skeleton';

export default function ExpertStatsWidget() {
  const [stats, setStats] = useState(null);

  useEffect(() => {
    api.get('/my-stats')
      .then(r => setStats(r.data))
      .catch(() => {});
  }, []);

  if (!stats) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
        {[...Array(6)].map((_, i) => <SkeletonStat key={i} />)}
      </div>
    );
  }

  const fmt = n => new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN', maximumFractionDigits: 0 }).format(n ?? 0);
  const earningsByMonth = stats.earnings_by_month ?? [];
  const maxEarned = Math.max(...earningsByMonth.map(m => parseFloat(m.earned ?? 0)), 1);

  const cards = [
    {
      label: 'Jales completados',
      value: stats.completed_jobs,
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z"/>
        </svg>
      ),
      color: 'text-green-600 bg-green-50',
    },
    {
      label: 'En progreso',
      value: stats.active_jobs,
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/>
        </svg>
      ),
      color: 'text-blue-600 bg-blue-50',
    },
    {
      label: 'Total ganado (neto)',
      value: fmt(stats.total_earned),
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
        </svg>
      ),
      color: 'text-emerald-600 bg-emerald-50',
    },
    {
      label: 'Por cobrar (escrow)',
      value: fmt(stats.pending_payment),
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"/>
        </svg>
      ),
      color: 'text-yellow-600 bg-yellow-50',
    },
    {
      label: 'Calificación',
      value: (
        <div className="flex items-center gap-2">
          <span className="text-2xl font-extrabold">
            {stats.average_rating > 0 ? stats.average_rating.toFixed(1) : '—'}
          </span>
          {stats.average_rating > 0 && (
            <StarRating value={Math.round(stats.average_rating)} readonly size="sm" />
          )}
        </div>
      ),
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"/>
        </svg>
      ),
      color: 'text-orange-500 bg-orange-50',
    },
    {
      label: 'Reseñas recibidas',
      value: stats.total_reviews,
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"/>
        </svg>
      ),
      color: 'text-purple-600 bg-purple-50',
    },
  ];

  return (
    <div className="space-y-4 mb-6">
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {cards.map((card, i) => (
          <div key={i} className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 flex items-start gap-3">
            <div className={`p-2 rounded-lg flex-shrink-0 ${card.color}`}>
              {card.icon}
            </div>
            <div className="min-w-0">
              <p className="text-xs text-gray-500 font-medium truncate">{card.label}</p>
              {typeof card.value === 'string' || typeof card.value === 'number'
                ? <p className="text-2xl font-extrabold text-gray-900 mt-0.5">{card.value}</p>
                : <div className="mt-0.5">{card.value}</div>
              }
            </div>
          </div>
        ))}
      </div>

      {/* Gráfica de ingresos por mes */}
      {earningsByMonth.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
          <p className="text-xs font-semibold text-gray-500 uppercase mb-3">Ingresos netos — últimos 6 meses</p>
          <div className="flex items-end gap-1.5 h-16">
            {earningsByMonth.map((m, i) => {
              const pct = Math.max((parseFloat(m.earned ?? 0) / maxEarned) * 100, 2);
              return (
                <div key={i} className="flex-1 flex flex-col items-center gap-1 group relative">
                  <div className="absolute -top-7 left-1/2 -translate-x-1/2 bg-gray-900 text-white text-[10px] px-1.5 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-10">
                    {fmt(m.earned)}
                  </div>
                  <div className="w-full bg-emerald-500 rounded-t-sm hover:bg-emerald-400 transition-colors"
                    style={{ height: `${pct}%` }} />
                  <span className="text-[9px] text-gray-400 font-medium">{m.month?.slice(5)}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
