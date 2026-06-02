// src/components/PremiumCard.jsx
import { useState, useEffect } from 'react';
import api from '../api/axios';
import toast from 'react-hot-toast';

export default function PremiumCard() {
  const [status, setStatus]   = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    api.get('/subscription/status').then(r => setStatus(r.data)).catch(() => {});
  }, []);

  const handleSubscribe = async () => {
    setLoading(true);
    try {
      const res = await api.post('/subscription/preference');
      window.open(res.data.sandbox_url || res.data.init_point, '_blank');
    } catch (e) {
      toast.error(e.response?.data?.message || 'Error al procesar.');
    } finally { setLoading(false); }
  };

  const expiresAt = status?.premium_expires_at
    ? new Date(status.premium_expires_at).toLocaleDateString('es-MX', { day: 'numeric', month: 'long', year: 'numeric' })
    : null;

  const daysLeft = status?.premium_expires_at
    ? Math.ceil((new Date(status.premium_expires_at) - new Date()) / 86400000)
    : 0;

  return (
    <div className="bg-white rounded-xl shadow-md overflow-hidden">
      <div className={`px-6 py-4 ${status?.is_premium ? 'bg-gradient-to-r from-yellow-500 to-amber-500' : 'bg-brand-dark'}`}>
        <h2 className="text-lg font-bold text-white flex items-center gap-2">
          ⭐ Membresía Premium
        </h2>
        <p className="text-white/80 text-sm mt-0.5">
          {status?.is_premium ? `Activa hasta el ${expiresAt}` : 'Destácate y consigue más trabajos'}
        </p>
      </div>

      <div className="p-6 space-y-4">
        {status?.is_premium ? (
          <div className="space-y-3">
            <div className="flex items-center justify-between bg-amber-50 rounded-xl p-4 border border-amber-200">
              <div>
                <p className="font-bold text-amber-900">Plan Premium activo</p>
                <p className="text-xs text-amber-700 mt-0.5">Vence en {daysLeft} día{daysLeft !== 1 ? 's' : ''}</p>
              </div>
              <span className="text-3xl">🏅</span>
            </div>

            <ul className="space-y-2 text-sm text-gray-700">
              {['⭐ Badge Premium en tu perfil', '🔝 Apareces primero en búsquedas', '📊 Estadísticas avanzadas', '🎯 Mayor visibilidad ante clientes'].map(f => (
                <li key={f} className="flex items-center gap-2"><span className="text-emerald-500">✓</span>{f}</li>
              ))}
            </ul>

            <button onClick={handleSubscribe} disabled={loading}
              className="w-full py-2.5 text-sm font-semibold text-amber-800 bg-amber-100 hover:bg-amber-200 rounded-xl transition-colors">
              🔄 Renovar membresía — $299 MXN/mes
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            <ul className="space-y-2 text-sm text-gray-700">
              {[
                ['⭐', 'Badge Premium visible en tu perfil'],
                ['🔝', 'Apareces primero en búsquedas'],
                ['📈', '3x más visibilidad que perfiles estándar'],
                ['💬', 'Sin límite de cotizaciones por mes'],
              ].map(([icon, text]) => (
                <li key={text} className="flex items-center gap-2">
                  <span>{icon}</span>
                  <span>{text}</span>
                </li>
              ))}
            </ul>

            <div className="bg-gray-50 rounded-xl p-4 text-center">
              <p className="text-3xl font-black text-gray-900">$299 <span className="text-base font-normal text-gray-500">MXN/mes</span></p>
              <p className="text-xs text-gray-400 mt-1">Cancela cuando quieras. Sin compromisos.</p>
            </div>

            <button onClick={handleSubscribe} disabled={loading}
              className="w-full py-3 text-sm font-bold text-white bg-gradient-to-r from-yellow-500 to-amber-500 hover:from-yellow-600 hover:to-amber-600 rounded-xl transition-all shadow-md disabled:opacity-70 flex items-center justify-center gap-2">
              {loading
                ? <><svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>Procesando...</>
                : '⭐ Activar Premium con MercadoPago'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
