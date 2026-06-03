// src/components/ReferralWidget.jsx
import { useState, useEffect } from 'react';
import api from '../api/axios';
import toast from 'react-hot-toast';

export default function ReferralWidget() {
  const [data, setData]     = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/referrals')
      .then(r => setData(r.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const copyLink = () => {
    if (!data?.referral_link) return;
    navigator.clipboard.writeText(data.referral_link);
    toast.success('¡Enlace copiado!');
  };

  const shareLink = () => {
    if (!data?.referral_link) return;
    if (navigator.share) {
      navigator.share({
        title: 'El Jale — Servicios del hogar',
        text: '¡Únete a El Jale y consigue expertos de confianza!',
        url: data.referral_link,
      });
    } else {
      copyLink();
    }
  };

  if (loading) return (
    <div className="bg-white border border-gray-200 rounded-2xl p-5 animate-pulse h-40" />
  );

  if (!data) return null;

  return (
    <div className="bg-gradient-to-br from-orange-50 to-amber-50 border border-orange-200 rounded-2xl p-5">
      <div className="flex items-center gap-2 mb-4">
        <span className="text-2xl">🎁</span>
        <div>
          <h3 className="font-bold text-gray-800">Programa de referidos</h3>
          <p className="text-xs text-gray-500">Gana $50 MXN por cada amigo que se registre</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3 mb-4">
        {[
          { label: 'Total ganado', value: `$${data.total_credits}`, color: 'text-orange-600' },
          { label: 'Disponible',   value: `$${data.available}`,    color: 'text-green-600' },
          { label: 'Referidos',    value: data.referrals.length,   color: 'text-blue-600' },
        ].map(s => (
          <div key={s.label} className="bg-white rounded-xl p-3 text-center shadow-sm">
            <div className={`text-lg font-bold ${s.color}`}>{s.value}</div>
            <div className="text-xs text-gray-500 mt-0.5">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Link */}
      <div className="bg-white rounded-xl border border-orange-200 px-3 py-2 mb-3 flex items-center gap-2">
        <span className="text-xs text-gray-500 flex-1 truncate">{data.referral_link}</span>
        <button
          onClick={copyLink}
          className="text-xs bg-orange-100 hover:bg-orange-200 text-orange-700 px-2 py-1 rounded-lg font-semibold transition"
        >
          Copiar
        </button>
      </div>

      <button
        onClick={shareLink}
        className="w-full bg-orange-500 hover:bg-orange-600 text-white font-semibold py-2.5 rounded-xl text-sm transition flex items-center justify-center gap-2"
      >
        <span>📤</span> Compartir enlace
      </button>

      {/* Historial */}
      {data.referrals.length > 0 && (
        <div className="mt-4">
          <p className="text-xs font-semibold text-gray-600 mb-2">Mis referidos</p>
          <div className="space-y-1.5 max-h-40 overflow-y-auto">
            {data.referrals.map((r, i) => (
              <div key={i} className="flex items-center justify-between bg-white rounded-lg px-3 py-2 text-xs">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 bg-orange-100 rounded-full flex items-center justify-center text-orange-600 font-bold text-xs">
                    {r.name[0]}
                  </div>
                  <span className="text-gray-700">{r.name}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`font-semibold ${r.used ? 'text-gray-400 line-through' : 'text-green-600'}`}>
                    ${r.amount}
                  </span>
                  <span className={`px-1.5 py-0.5 rounded text-xs ${r.used ? 'bg-gray-100 text-gray-400' : 'bg-green-100 text-green-600'}`}>
                    {r.used ? 'Usado' : 'Disponible'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
