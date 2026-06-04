// src/components/TipModal.jsx — Sistema de propinas post-trabajo
import { useState } from 'react';
import toast from 'react-hot-toast';

const TIP_OPTIONS = [
  { pct: 5,  label: '5%',   icon: '👍' },
  { pct: 10, label: '10%',  icon: '🙌' },
  { pct: 15, label: '15%',  icon: '🌟' },
  { pct: 0,  label: 'Otro', icon: '✏️' },
];

export default function TipModal({ job, onClose, onTip }) {
  const baseAmount  = Number(job?.payment?.amount ?? job?.budget ?? 0);
  const expertName  = job?.expert?.name?.split(' ')[0] ?? 'el experto';
  const [selected, setSelected]   = useState(10);
  const [custom, setCustom]       = useState('');
  const [sending, setSending]     = useState(false);

  const tipAmount = selected === 0
    ? Number(custom || 0)
    : Math.round((baseAmount * selected) / 100);

  const handleSend = async () => {
    if (tipAmount <= 0) { toast.error('Ingresa un monto de propina válido.'); return; }
    setSending(true);
    try {
      // En producción: POST /jobs/{id}/tip con { amount: tipAmount }
      await new Promise(r => setTimeout(r, 800)); // simula llamada API
      toast.success(`🎉 ¡Propina de $${tipAmount.toLocaleString('es-MX')} enviada a ${expertName}!`);
      onTip?.(tipAmount);
      onClose();
    } catch {
      toast.error('No se pudo enviar la propina.');
    } finally { setSending(false); }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
      <div className="relative w-full max-w-sm bg-white rounded-2xl shadow-2xl overflow-hidden">

        <div className="bg-gradient-to-br from-amber-400 to-orange-500 px-6 py-6 text-center">
          <div className="text-5xl mb-2">🎉</div>
          <h3 className="font-black text-white text-xl">¡Trabajo completado!</h3>
          <p className="text-amber-100 text-sm mt-1">
            ¿Quedaste contento con {expertName}?<br />Puedes dejarle una propina.
          </p>
        </div>

        <div className="p-6 space-y-4">
          {baseAmount > 0 && (
            <div className="bg-gray-50 rounded-xl p-3 text-center">
              <p className="text-xs text-gray-500">Monto del trabajo</p>
              <p className="text-2xl font-black text-gray-900">${baseAmount.toLocaleString('es-MX')} MXN</p>
            </div>
          )}

          {/* Opciones de propina */}
          <div className="grid grid-cols-4 gap-2">
            {TIP_OPTIONS.map(opt => (
              <button key={opt.pct}
                onClick={() => { setSelected(opt.pct); if (opt.pct !== 0) setCustom(''); }}
                className={`flex flex-col items-center p-3 rounded-xl border-2 transition-all ${
                  selected === opt.pct
                    ? 'border-amber-400 bg-amber-50'
                    : 'border-gray-200 hover:border-amber-200'
                }`}>
                <span className="text-xl mb-1">{opt.icon}</span>
                <span className="text-sm font-bold text-gray-900">{opt.label}</span>
                {opt.pct > 0 && baseAmount > 0 && (
                  <span className="text-[10px] text-gray-400">
                    ${Math.round(baseAmount * opt.pct / 100).toLocaleString('es-MX')}
                  </span>
                )}
              </button>
            ))}
          </div>

          {/* Monto personalizado */}
          {selected === 0 && (
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 font-medium">$</span>
              <input type="number" min="1" step="1" value={custom}
                onChange={e => setCustom(e.target.value)}
                placeholder="Ingresa el monto"
                className="w-full border border-gray-200 rounded-xl pl-7 pr-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400/30 focus:border-amber-400 text-center font-bold" />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">MXN</span>
            </div>
          )}

          {tipAmount > 0 && (
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-center">
              <p className="text-sm text-amber-800 font-semibold">
                Propina: <span className="text-xl font-black">${tipAmount.toLocaleString('es-MX')} MXN</span>
              </p>
            </div>
          )}

          <div className="flex gap-3 pt-1">
            <button onClick={onClose}
              className="flex-1 py-3 text-sm font-semibold text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors">
              Omitir
            </button>
            <button onClick={handleSend} disabled={sending || tipAmount <= 0}
              className="flex-1 py-3 text-sm font-bold text-white bg-amber-500 hover:bg-amber-600 rounded-xl transition-colors disabled:opacity-50">
              {sending ? 'Enviando...' : `💝 Dar $${tipAmount.toLocaleString('es-MX')}`}
            </button>
          </div>

          <p className="text-[10px] text-gray-400 text-center">
            La propina va directamente al experto · El Jale no cobra comisión sobre propinas
          </p>
        </div>
      </div>
    </div>
  );
}
