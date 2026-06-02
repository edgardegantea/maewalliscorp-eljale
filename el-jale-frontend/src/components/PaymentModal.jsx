// src/components/PaymentModal.jsx
import { useState } from 'react';
import api from '../api/axios';
import toast from 'react-hot-toast';

export default function PaymentModal({ job, onClose, onPaid }) {
  const [loading, setLoading] = useState(false);
  const [preference, setPreference] = useState(null);

  const handleCreatePreference = async () => {
    setLoading(true);
    try {
      const res = await api.post(`/jobs/${job.id}/mp/preference`);
      setPreference(res.data);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error al iniciar el pago');
    } finally {
      setLoading(false);
    }
  };

  const feePct = preference
    ? ((preference.platform_fee / preference.amount) * 100).toFixed(0)
    : 10;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">

        {/* Header */}
        <div className="bg-gradient-to-r from-brand-dark to-slate-800 px-6 py-5">
          <div className="flex items-start justify-between">
            <div>
              <h2 className="text-lg font-bold text-white">Pagar con MercadoPago</h2>
              <p className="text-brand-accent/80 text-sm mt-0.5 line-clamp-1">{job.title}</p>
            </div>
            <button onClick={onClose} className="text-gray-400 hover:text-white ml-4 mt-0.5">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"/>
              </svg>
            </button>
          </div>
        </div>

        <div className="p-6 space-y-5">
          {!preference ? (
            <>
              {/* Resumen del pago */}
              <div className="bg-gray-50 rounded-xl p-4 space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Trabajo</span>
                  <span className="font-medium text-gray-900 text-right max-w-[200px] truncate">{job.title}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Monto a pagar</span>
                  <span className="font-bold text-gray-900 text-lg">${Number(job.budget || job.payment?.amount || 0).toLocaleString('es-MX')}</span>
                </div>
                <div className="border-t border-gray-200 pt-3 flex justify-between text-xs text-gray-400">
                  <span>Comisión de plataforma ({feePct}%)</span>
                  <span>incluida en el total</span>
                </div>
              </div>

              {/* Garantía */}
              <div className="flex items-start gap-3 bg-emerald-50 rounded-xl p-4">
                <span className="text-2xl flex-shrink-0">🔒</span>
                <div>
                  <p className="text-sm font-semibold text-emerald-800">Pago 100% seguro</p>
                  <p className="text-xs text-emerald-700 mt-0.5">
                    Tu dinero queda protegido en escrow hasta que confirmes que el trabajo quedó perfecto. Si hay algún problema, te lo regresamos.
                  </p>
                </div>
              </div>

              {/* Métodos aceptados */}
              <div>
                <p className="text-xs text-gray-500 mb-2 font-medium">Métodos de pago aceptados</p>
                <div className="flex flex-wrap gap-2">
                  {['💳 Tarjeta de crédito', '💳 Débito', '🏪 OXXO', '🏦 Transferencia'].map(m => (
                    <span key={m} className="text-xs px-2.5 py-1 bg-gray-100 text-gray-600 rounded-full">{m}</span>
                  ))}
                </div>
              </div>

              <div className="flex gap-3 pt-1">
                <button onClick={onClose} className="flex-1 px-4 py-2.5 text-sm font-medium text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors">
                  Cancelar
                </button>
                <button
                  onClick={handleCreatePreference}
                  disabled={loading}
                  className="flex-1 px-4 py-2.5 text-sm font-semibold text-white bg-brand-primary hover:bg-orange-600 rounded-xl transition-colors disabled:opacity-75 flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <><svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg> Generando...</>
                  ) : '🛒 Ir a pagar'}
                </button>
              </div>
            </>
          ) : (
            <>
              {/* Desglose */}
              <div className="bg-gray-50 rounded-xl p-4 space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500">Total</span>
                  <span className="font-bold text-gray-900">${Number(preference.amount).toLocaleString('es-MX')} MXN</span>
                </div>
                <div className="flex justify-between text-xs text-gray-400">
                  <span>Comisión El Jale ({feePct}%)</span>
                  <span>${Number(preference.platform_fee).toLocaleString('es-MX')}</span>
                </div>
                <div className="flex justify-between text-xs text-gray-400">
                  <span>El experto recibirá</span>
                  <span className="text-emerald-600 font-medium">${Number(preference.expert_amount).toLocaleString('es-MX')}</span>
                </div>
              </div>

              <div className="bg-blue-50 rounded-xl p-4 text-center">
                <p className="text-sm text-blue-800 font-medium mb-1">Listo para pagar</p>
                <p className="text-xs text-blue-600">Se abrirá la página segura de MercadoPago. Al terminar, volverás automáticamente.</p>
              </div>

              <a
                href={preference.sandbox_url || preference.init_point}
                target="_blank"
                rel="noreferrer"
                className="w-full flex items-center justify-center gap-2 px-6 py-3 text-sm font-bold text-white bg-[#009EE3] hover:bg-[#0082c0] rounded-xl transition-colors"
              >
                <img src="https://www.mercadopago.com.mx/favicon.ico" alt="" className="w-4 h-4" onError={e => e.target.style.display='none'} />
                Pagar con MercadoPago
              </a>

              <button
                onClick={() => { onClose(); onPaid?.(); }}
                className="w-full text-sm text-gray-500 hover:text-gray-700 py-1"
              >
                Ya pagué — verificar estado
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
