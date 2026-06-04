// src/components/FeaturedListingModal.jsx — Comprar listing destacado
import { useState } from 'react';
import api from '../api/axios';
import toast from 'react-hot-toast';

const PLANS = [
  { key: '7days',  days: 7,  price: 99,  label: '7 días',  popular: false, roi: 'Ideal para probar' },
  { key: '15days', days: 15, price: 179, label: '15 días', popular: true,  roi: 'Más popular' },
  { key: '30days', days: 30, price: 299, label: '30 días', popular: false, roi: 'Mejor valor/día' },
];

export default function FeaturedListingModal({ status, onClose, onSuccess }) {
  const [selected, setSelected]   = useState('15days');
  const [loading, setLoading]     = useState(false);
  const isActive = status?.is_featured;
  const until    = status?.featured_until ? new Date(status.featured_until).toLocaleDateString('es-MX', { day: 'numeric', month: 'long' }) : null;

  const handlePay = async () => {
    setLoading(true);
    try {
      const r = await api.post('/featured/preference', { plan: selected });
      const url = import.meta.env.DEV ? r.data.sandbox_init_point : r.data.init_point;
      window.location.href = url;
    } catch (e) {
      toast.error(e.response?.data?.message ?? 'Error al procesar el pago');
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
      <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden">

        <div className="bg-gradient-to-br from-amber-400 via-orange-500 to-orange-600 px-6 py-5 text-white">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-2xl">⭐</span>
            <h3 className="font-black text-xl">Experto Destacado</h3>
          </div>
          <p className="text-amber-100 text-sm">Aparece primero en las búsquedas de tu categoría y ciudad.</p>
          {isActive && until && (
            <div className="mt-3 bg-white/20 rounded-xl px-3 py-2 text-xs font-semibold">
              ✅ Activo hasta el {until}
            </div>
          )}
        </div>

        <div className="p-6 space-y-5">
          {/* Beneficios */}
          <div className="grid grid-cols-2 gap-2">
            {[
              { icon: '🔝', text: 'Primero en búsquedas' },
              { icon: '⭐', text: 'Badge "Destacado"' },
              { icon: '📈', text: '3× más visitas' },
              { icon: '💰', text: 'Más cotizaciones' },
            ].map(b => (
              <div key={b.text} className="flex items-center gap-2 text-xs text-gray-700 bg-amber-50 border border-amber-100 rounded-xl px-3 py-2">
                <span>{b.icon}</span> {b.text}
              </div>
            ))}
          </div>

          {/* Planes */}
          <div className="space-y-2">
            <p className="text-xs font-bold text-gray-500 uppercase">Elige tu plan</p>
            {PLANS.map(plan => (
              <label key={plan.key}
                className={`flex items-center gap-3 p-3.5 rounded-xl border-2 cursor-pointer transition-all ${
                  selected === plan.key ? 'border-amber-400 bg-amber-50' : 'border-gray-200 hover:border-amber-200'
                }`}>
                <input type="radio" name="plan" value={plan.key} checked={selected === plan.key}
                  onChange={() => setSelected(plan.key)} className="sr-only" />
                <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${selected === plan.key ? 'border-amber-500 bg-amber-500' : 'border-gray-300'}`}>
                  {selected === plan.key && <div className="w-2 h-2 rounded-full bg-white" />}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-bold text-gray-900">{plan.label}</p>
                    {plan.popular && (
                      <span className="text-[10px] font-black text-orange-600 bg-orange-100 px-2 py-0.5 rounded-full">Popular</span>
                    )}
                  </div>
                  <p className="text-xs text-gray-400">{plan.roi}</p>
                </div>
                <div className="text-right">
                  <p className="text-lg font-black text-gray-900">${plan.price}</p>
                  <p className="text-[10px] text-gray-400">MXN</p>
                </div>
              </label>
            ))}
          </div>

          <div className="flex gap-3 pt-1">
            <button onClick={onClose}
              className="flex-1 py-3 text-sm font-semibold text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors">
              Cancelar
            </button>
            <button onClick={handlePay} disabled={loading}
              className="flex-1 py-3 text-sm font-bold text-white bg-amber-500 hover:bg-amber-600 rounded-xl transition-colors disabled:opacity-60 shadow-lg shadow-amber-500/30">
              {loading ? 'Redirigiendo...' : `⭐ Destacarme por $${PLANS.find(p => p.key === selected)?.price}`}
            </button>
          </div>

          <p className="text-[10px] text-gray-400 text-center">
            Pago seguro con MercadoPago · Sin renovación automática
          </p>
        </div>
      </div>
    </div>
  );
}
