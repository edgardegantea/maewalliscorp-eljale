// src/components/LoyaltyWidget.jsx — Programa de puntos y recompensas
import { useState, useEffect } from 'react';
import api from '../api/axios';

const REWARDS = [
  { pts: 50,  label: '$25 MXN de descuento',    icon: '🎟️' },
  { pts: 100, label: '$60 MXN de descuento',    icon: '💫' },
  { pts: 200, label: '$150 MXN de descuento',   icon: '🏆' },
  { pts: 500, label: 'Trabajo urgente gratis',  icon: '⚡' },
];

function calcPoints(stats) {
  if (!stats) return 0;
  return (stats.completed_jobs ?? 0) * 10 +
         (stats.total_reviews_given ?? 0) * 5 +
         (stats.referrals_used ?? 0) * 20;
}

export default function LoyaltyWidget() {
  const [stats, setStats]       = useState(null);
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    api.get('/client-stats').then(r => setStats(r.data)).catch(() => {});
  }, []);

  const points = calcPoints(stats);
  const nextReward = REWARDS.find(r => r.pts > points) ?? REWARDS[REWARDS.length - 1];
  const pct = Math.min(100, Math.round((points / nextReward.pts) * 100));

  return (
    <div className="card p-5 border border-amber-100 bg-gradient-to-br from-amber-50 to-orange-50">
      <button onClick={() => setExpanded(!expanded)} className="w-full text-left">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <span className="text-2xl">🌟</span>
            <div>
              <p className="text-sm font-bold text-gray-900">El Jale Points</p>
              <p className="text-xs text-gray-500">Gana puntos con cada Jale</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-2xl font-black text-amber-600">{points}</p>
            <p className="text-[10px] text-gray-400 font-medium">puntos</p>
          </div>
        </div>

        {/* Progress bar */}
        <div className="mb-2">
          <div className="flex justify-between text-xs text-gray-500 mb-1">
            <span>{points} pts</span>
            <span>{nextReward.icon} {nextReward.label} ({nextReward.pts} pts)</span>
          </div>
          <div className="w-full bg-amber-100 rounded-full h-2">
            <div className="bg-amber-500 h-2 rounded-full transition-all"
              style={{ width: `${pct}%` }} />
          </div>
          <p className="text-[10px] text-gray-400 mt-1">
            Te faltan <strong>{Math.max(0, nextReward.pts - points)} pts</strong> para tu próxima recompensa
          </p>
        </div>
      </button>

      {expanded && (
        <div className="mt-4 space-y-3 border-t border-amber-100 pt-4">
          {/* Cómo ganar */}
          <div>
            <p className="text-xs font-bold text-gray-700 uppercase mb-2">Cómo ganar puntos</p>
            <div className="space-y-1.5">
              {[
                { icon: '✅', label: 'Trabajo completado', pts: '+10 pts' },
                { icon: '⭐', label: 'Dejar una reseña',   pts: '+5 pts' },
                { icon: '👥', label: 'Referir a un amigo', pts: '+20 pts' },
                { icon: '⚡', label: 'Trabajo urgente',    pts: '+15 pts' },
              ].map(r => (
                <div key={r.label} className="flex items-center justify-between text-xs">
                  <span className="text-gray-600">{r.icon} {r.label}</span>
                  <span className="font-bold text-amber-600">{r.pts}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Recompensas disponibles */}
          <div>
            <p className="text-xs font-bold text-gray-700 uppercase mb-2">Recompensas</p>
            <div className="space-y-2">
              {REWARDS.map(r => {
                const unlocked = points >= r.pts;
                return (
                  <div key={r.pts} className={`flex items-center gap-3 p-2.5 rounded-xl border ${unlocked ? 'bg-amber-50 border-amber-300' : 'bg-white border-gray-100 opacity-60'}`}>
                    <span className="text-xl">{r.icon}</span>
                    <div className="flex-1">
                      <p className="text-xs font-semibold text-gray-900">{r.label}</p>
                      <p className="text-[10px] text-gray-400">{r.pts} puntos</p>
                    </div>
                    {unlocked
                      ? <button className="text-[10px] font-bold text-amber-700 bg-amber-200 px-2.5 py-1 rounded-full hover:bg-amber-300 transition-colors">Canjear</button>
                      : <span className="text-[10px] text-gray-400">🔒 Bloqueado</span>
                    }
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
